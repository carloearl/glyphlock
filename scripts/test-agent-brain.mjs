import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const agent = JSON.parse(await readFile(new URL('base44/agents/siteBuilder.jsonc', root), 'utf8'));
const panel = await readFile(new URL('src/components/devengine/AgentBrainPanel.jsx', root), 'utf8');

test('Agent Brain agent exposes the existing public web search backend', () => {
  const tool = agent.tool_configs.find(tool => tool.function_name === 'glyphbotWebSearch');
  assert.ok(tool, 'Agent Brain must have a callable public search tool');
  assert.ok(tool.description.includes('deep'));
  assert.ok(agent.instructions.includes('glyphbotWebSearch'));
});

function renderPanel({ existingConversation = null, failCreation = false } = {}) {
  const sent = [], created = [];
  let stateIndex = 0;
  const base44 = { agents: {
    createConversation: async options => {
      created.push(options);
      if (failCreation) throw new Error('Creation failed');
      return { id: 'new-agent-brain-conversation', messages: [] };
    },
    subscribeToConversation: () => () => {},
    addMessage: async (conversation, message) => { sent.push({ conversation, message }); },
  } };
  const useState = initial => {
    const index = stateIndex++;
    const value = index === 0 ? existingConversation : index === 3 ? 'Research public professional work' : initial;
    return [value, () => {}];
  };
  const React = { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) };
  const context = { React, useState, useEffect: () => {}, useRef: () => ({ current: null }), base44,
    toast: { error() {}, success() {} }, console: { error() {} }, setTimeout, clearTimeout };
  const componentNames = ['Card','CardContent','CardHeader','CardTitle','Button','Textarea','ScrollArea','Badge',
    'BrainCircuit','Send','Loader2','CheckCircle2','AlertCircle','Clock','Zap','Paperclip','X','ImageIcon',
    'FileText','Upload','Save','FolderOpen','Trash2','Star','Play','Code','FileCode','Terminal','Copy','HoverTooltip','ReactMarkdown'];
  for (const name of componentNames) context[name] = name;
  const source = panel.replace(/^import .*;$/gm, '').replace('export default function AgentBrainPanel', 'function AgentBrainPanel');
  const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.createContext(context);
  vm.runInContext(compiled + '\nglobalThis.tree = AgentBrainPanel();', context);
  function findSend(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.props?.onClick?.name === 'sendMessage') return node.props.onClick;
    for (const child of node.children || []) {
      const found = Array.isArray(child) ? child.map(findSend).find(Boolean) : findSend(child);
      if (found) return found;
    }
    return null;
  }
  const send = findSend(context.tree);
  assert.ok(send, 'Rendered send control must exist');
  return { send, sent, created };
}

test('first send creates a conversation and sends the request once', async () => {
  const h = renderPanel();
  await h.send();
  assert.equal(h.created.length, 1);
  assert.equal(h.created[0].agent_name, 'siteBuilder');
  assert.equal(h.sent.length, 1);
  assert.equal(h.sent[0].conversation.id, 'new-agent-brain-conversation');
  assert.equal(h.sent[0].message.content, '[BUILD MODE] Research public professional work');
});

test('existing Agent Brain conversations are reused', async () => {
  const h = renderPanel({ existingConversation: { id: 'existing', messages: [] } });
  await h.send();
  assert.equal(h.created.length, 0);
  assert.equal(h.sent.length, 1);
  assert.equal(h.sent[0].conversation.id, 'existing');
});

test('conversation creation failure does not send a message', async () => {
  const h = renderPanel({ failCreation: true });
  await h.send();
  assert.equal(h.sent.length, 0);
});