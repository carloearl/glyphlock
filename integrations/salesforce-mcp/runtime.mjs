import { readFileSync } from 'node:fs';

const CONTRACT = JSON.parse(
  readFileSync(new URL('./tool-contracts.json', import.meta.url), 'utf8'),
);

const TOOL_BY_NAME = new Map(CONTRACT.tools.map((tool) => [tool.name, tool]));
const LEGACY_PROTOCOLS = new Set([
  '2024-11-05',
  '2025-03-26',
  '2025-06-18',
  '2025-11-25',
]);
const DEFAULT_LEGACY_PROTOCOL = '2024-11-05';
const MAX_RESULT_BYTES = 256 * 1024;

function jsonRpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id, code, message, data) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return { jsonrpc: '2.0', id: id ?? null, error };
}

function response(status, body, extraHeaders = {}) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
      ...extraHeaders,
    },
    body,
  };
}

function bearerToken(headers = {}) {
  const value = headers.authorization ?? headers.Authorization;
  if (typeof value !== 'string') return null;
  const match = value.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}

function isDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function applyDefaults(schema, input) {
  const output = { ...input };
  for (const [key, property] of Object.entries(schema.properties ?? {})) {
    if (output[key] === undefined && property.default !== undefined) {
      output[key] = property.default;
    }
  }
  return output;
}

function validateArguments(schema, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, message: 'Tool arguments must be an object.' };
  }

  const properties = schema.properties ?? {};
  const allowed = new Set(Object.keys(properties));
  if (schema.additionalProperties === false) {
    const unknown = Object.keys(input).filter((key) => !allowed.has(key));
    if (unknown.length) {
      return { ok: false, message: `Unknown argument field(s): ${unknown.sort().join(', ')}` };
    }
  }

  const value = applyDefaults(schema, input);
  for (const required of schema.required ?? []) {
    if (value[required] === undefined || value[required] === null) {
      return { ok: false, message: `Missing required argument: ${required}` };
    }
  }

  for (const [key, property] of Object.entries(properties)) {
    const field = value[key];
    if (field === undefined) continue;

    if (property.type === 'string') {
      if (typeof field !== 'string') return { ok: false, message: `${key} must be a string.` };
      if (property.minLength !== undefined && field.length < property.minLength) {
        return { ok: false, message: `${key} is shorter than the minimum length.` };
      }
      if (property.maxLength !== undefined && field.length > property.maxLength) {
        return { ok: false, message: `${key} exceeds the maximum length.` };
      }
      if (property.format === 'date' && !isDateString(field)) {
        return { ok: false, message: `${key} must use YYYY-MM-DD.` };
      }
    }

    if (property.type === 'integer') {
      if (!Number.isInteger(field)) return { ok: false, message: `${key} must be an integer.` };
      if (property.minimum !== undefined && field < property.minimum) {
        return { ok: false, message: `${key} is below the minimum.` };
      }
      if (property.maximum !== undefined && field > property.maximum) {
        return { ok: false, message: `${key} exceeds the maximum.` };
      }
    }

    if (Array.isArray(property.enum) && !property.enum.includes(field)) {
      return { ok: false, message: `${key} has an unsupported value.` };
    }
  }

  return { ok: true, value };
}

function hasScope(principal, arguments_) {
  const allowedModes = Array.isArray(principal.allowedModes) ? principal.allowedModes : [];
  if (!allowedModes.includes(arguments_.mode)) return false;

  if (arguments_.venue_ref !== undefined) {
    const allowedVenueRefs = Array.isArray(principal.venueRefs) ? principal.venueRefs : [];
    if (!allowedVenueRefs.includes(arguments_.venue_ref)) return false;
  }

  return typeof principal.tenantRef === 'string' && principal.tenantRef.length > 0;
}

function selectFields(value, fields) {
  const output = {};
  for (const field of fields) {
    if (value?.[field] !== undefined) output[field] = value[field];
  }
  return output;
}

function sanitizeToolResult(tool, rawResult) {
  const sanitized = selectFields(rawResult, tool.output_fields ?? []);
  if (Array.isArray(sanitized.exceptions)) {
    sanitized.exceptions = sanitized.exceptions
      .slice(0, 100)
      .map((item) => selectFields(item, tool.exception_fields ?? []));
  }
  sanitized.authority_notice = tool.authority_notice;

  const serialized = JSON.stringify(sanitized);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_RESULT_BYTES) {
    throw new Error('Sanitized tool result exceeded the maximum response size.');
  }
  return sanitized;
}

function safeErrorCategory(error) {
  if (error && typeof error === 'object' && typeof error.code === 'string') return error.code;
  return 'UPSTREAM_READ_FAILED';
}

async function authenticateRequest(authenticate, headers, requestContext) {
  const token = bearerToken(headers);
  if (!token) return null;
  const principal = await authenticate(token, requestContext);
  if (!principal || typeof principal !== 'object') return null;
  return principal;
}

export function createMcpRuntime({ authenticate, authorize, adapters, audit, now = () => new Date() }) {
  if (typeof authenticate !== 'function') throw new TypeError('authenticate is required.');
  if (typeof authorize !== 'function') throw new TypeError('authorize is required.');
  if (!adapters || typeof adapters !== 'object') throw new TypeError('adapters are required.');
  if (typeof audit !== 'function') throw new TypeError('audit is required.');

  return {
    async handle({ headers = {}, body, requestContext = {} }) {
      if (!body || typeof body !== 'object' || Array.isArray(body) || body.jsonrpc !== '2.0') {
        return response(400, jsonRpcError(body?.id, -32600, 'Invalid JSON-RPC request.'));
      }

      const principal = await authenticateRequest(authenticate, headers, requestContext);
      if (!principal) {
        return response(
          401,
          jsonRpcError(body.id, -32001, 'Unauthorized.'),
          { 'www-authenticate': 'Bearer' },
        );
      }

      if (body.method === 'notifications/initialized') {
        return { status: 204, headers: { 'cache-control': 'private, no-store' }, body: null };
      }

      if (body.method === 'initialize') {
        const requested = body.params?.protocolVersion;
        const protocolVersion = LEGACY_PROTOCOLS.has(requested)
          ? requested
          : DEFAULT_LEGACY_PROTOCOL;
        return response(200, jsonRpcResult(body.id, {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: {
            name: CONTRACT.server.name,
            title: CONTRACT.server.display_name,
            version: CONTRACT.schema_version,
          },
        }));
      }

      if (body.method === 'tools/list') {
        return response(200, jsonRpcResult(body.id, {
          tools: CONTRACT.tools.map(({ name, description, inputSchema }) => ({
            name,
            description,
            inputSchema,
          })),
        }));
      }

      if (body.method !== 'tools/call') {
        return response(404, jsonRpcError(body.id, -32601, 'Method not found.'));
      }

      const toolName = body.params?.name;
      const tool = TOOL_BY_NAME.get(toolName);
      if (!tool) {
        return response(404, jsonRpcError(body.id, -32602, 'Unknown or disallowed tool.'));
      }

      const validation = validateArguments(tool.inputSchema, body.params?.arguments ?? {});
      if (!validation.ok) {
        return response(400, jsonRpcError(body.id, -32602, validation.message));
      }

      const arguments_ = validation.value;
      const inputFields = Object.keys(arguments_).sort();
      const correlationId = String(
        requestContext.correlationId ?? headers['x-correlation-id'] ?? crypto.randomUUID(),
      );
      const startedAt = now();
      let status = 'denied';
      let recordCount = 0;
      let errorCategory = null;
      let sanitized;
      let errorResponse = null;

      try {
        const scopeAllowed = hasScope(principal, arguments_);
        const policyAllowed = scopeAllowed && await authorize({
          principal,
          tool: toolName,
          arguments: arguments_,
          requestContext,
        });
        if (!policyAllowed) {
          errorCategory = 'SCOPE_OR_POLICY_DENIED';
          errorResponse = response(
            403,
            jsonRpcError(body.id, -32003, 'Tool call denied by scope or policy.'),
          );
        } else {
          const adapter = adapters[toolName];
          if (typeof adapter !== 'function') {
            status = 'error';
            errorCategory = 'ADAPTER_NOT_CONFIGURED';
            errorResponse = response(
              503,
              jsonRpcError(body.id, -32004, 'Tool adapter is not configured.'),
            );
          } else {
            const rawResult = await adapter({
              principal,
              arguments: arguments_,
              correlationId,
              requestContext,
            });
            sanitized = sanitizeToolResult(tool, rawResult);
            recordCount = Array.isArray(sanitized.exceptions) ? sanitized.exceptions.length : 1;
            status = 'success';
          }
        }
      } catch (error) {
        status = 'error';
        errorCategory = safeErrorCategory(error);
      }

      const completedAt = now();
      try {
        await audit({
          correlationId,
          clientRef: String(principal.clientRef ?? principal.clientId ?? 'unknown-client'),
          tenantRef: principal.tenantRef,
          venueRef: arguments_.venue_ref ?? null,
          tool: toolName,
          mode: arguments_.mode,
          inputFields,
          decision: status === 'denied' ? 'denied' : 'authorized',
          status,
          latencyMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
          recordCount,
          errorCategory,
          occurredAt: completedAt.toISOString(),
        });
      } catch {
        return response(503, jsonRpcError(body.id, -32005, 'Audit recording failed closed.'));
      }

      if (errorResponse) return errorResponse;

      if (status !== 'success') {
        return response(502, jsonRpcError(body.id, -32006, 'Authorized upstream read failed.', {
          category: errorCategory,
        }));
      }

      return response(200, jsonRpcResult(body.id, {
        content: [{ type: 'text', text: JSON.stringify(sanitized) }],
        structuredContent: sanitized,
        isError: false,
      }));
    },
  };
}

export { CONTRACT, validateArguments };
