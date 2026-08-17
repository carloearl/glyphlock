import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CONNECTOR_ID = '6a679b363997eb3bfad605a5';
const GRAPH = 'https://graph.microsoft.com/v1.0';
const FILE_NAME = 'GlyphLock Activity Log.xlsx';
const SHEET = 'ActivityLog';

const HEADERS = [
  'Timestamp', 'User Email', 'User Role', 'Action Type',
  'Entity Affected', 'Venue', 'Mode', 'Notes'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = body.action || 'status';

    const { accessToken } = await base44.asServiceRole.connectors
      .getCurrentAppUserConnection(CONNECTOR_ID);

    const graph = async (path, init = {}) => {
      const res = await fetch(`${GRAPH}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(init.headers || {})
        }
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) {
        throw new Error(json?.error?.message || `Graph ${res.status}`);
      }
      return json;
    };

    // Identify the connected Microsoft account (also proves the connection works)
    const me = await graph('/me?$select=displayName,userPrincipalName');

    if (action === 'status') {
      return Response.json({
        connected: true,
        account: me.userPrincipalName || me.displayName,
        file_name: FILE_NAME
      });
    }

    // Find or create the workbook in the user's OneDrive root
    let item;
    try {
      item = await graph(`/me/drive/root:/${encodeURIComponent(FILE_NAME)}`);
    } catch {
      item = await graph(
        `/me/drive/root:/${encodeURIComponent(FILE_NAME)}:/content`,
        { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: new Uint8Array(0) }
      );
    }
    const itemId = item.id;

    // Ensure our worksheet exists
    const sheets = await graph(`/me/drive/items/${itemId}/workbook/worksheets`);
    if (!(sheets.value || []).some((w) => w.name === SHEET)) {
      await graph(`/me/drive/items/${itemId}/workbook/worksheets/add`, {
        method: 'POST',
        body: JSON.stringify({ name: SHEET })
      });
    }

    // Pull the activity log (newest first, capped)
    const limit = Math.min(body.limit || 500, 2000);
    const logs = await base44.asServiceRole.entities.ActivityLog.list('-timestamp', limit);

    const rows = logs.map((l) => [
      l.timestamp || '',
      l.user_email || '',
      l.user_role || '',
      l.action_type || '',
      l.entity_affected || '',
      l.venue_id || '',
      l.mode || '',
      l.notes || ''
    ]);

    // Full refresh: clear the sheet, then write headers + rows
    await graph(
      `/me/drive/items/${itemId}/workbook/worksheets('${SHEET}')/range(address='A1:H10000')/clear`,
      { method: 'POST', body: JSON.stringify({ applyTo: 'All' }) }
    );

    const values = [HEADERS, ...rows];
    const endRow = values.length;
    await graph(
      `/me/drive/items/${itemId}/workbook/worksheets('${SHEET}')/range(address='A1:H${endRow}')`,
      { method: 'PATCH', body: JSON.stringify({ values }) }
    );

    return Response.json({
      synced: true,
      account: me.userPrincipalName || me.displayName,
      rows: rows.length,
      file_name: FILE_NAME,
      web_url: item.webUrl || null,
      synced_at: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});