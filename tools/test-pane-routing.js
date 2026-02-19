#!/usr/bin/env node
const fs = require('fs');

function fail(msg) {
  console.error('[FAIL]', msg);
  process.exitCode = 1;
}

function pass(msg) {
  console.log('[OK]', msg);
}

const target = process.argv[2] || 'rhodes-split.js';
if (!fs.existsSync(target)) {
  fail(`File not found: ${target}`);
  process.exit(process.exitCode || 1);
}

const src = fs.readFileSync(target, 'utf8');
const fnNames = new Set([...src.matchAll(/function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)].map(m => m[1]));

const mapMatch = src.match(/const\s+paneMessageHandlers\s*=\s*\{([\s\S]*?)\};/);
if (!mapMatch) {
  fail('paneMessageHandlers map not found');
  process.exit(process.exitCode || 1);
}

const mapBody = mapMatch[1];
const entryMatches = [...mapBody.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)/g)];
if (entryMatches.length === 0) {
  fail('paneMessageHandlers has no entries');
  process.exit(process.exitCode || 1);
}

const routeMap = new Map();
for (const m of entryMatches) {
  const msgType = m[1];
  const handler = m[2];
  if (routeMap.has(msgType)) {
    fail(`Duplicate message type mapping: ${msgType}`);
  }
  routeMap.set(msgType, handler);
}

const requiredTypes = [
  'local_ready',
  'auto_login_token',
  'auth_response',
  'ai_message_chunk',
  'ai_message',
  'tool_call',
  'tool_result',
  'thinking',
  'error'
];

for (const msgType of requiredTypes) {
  if (!routeMap.has(msgType)) {
    fail(`Missing required message route: ${msgType}`);
  }
}

for (const [msgType, handler] of routeMap.entries()) {
  if (!fnNames.has(handler)) {
    fail(`Route handler missing function: ${msgType} -> ${handler}`);
  }
}

if (!/const\s+handler\s*=\s*paneMessageHandlers\[msgType\]/.test(src)) {
  fail('handlePaneMessage does not read from paneMessageHandlers[msgType]');
}
if (!/handler\(paneNum,\s*msg,\s*chatEl\)/.test(src)) {
  fail('handlePaneMessage does not invoke dispatcher handler(paneNum, msg, chatEl)');
}

if (!process.exitCode) {
  pass(`Routing map entries: ${routeMap.size}`);
  pass(`Required routes present: ${requiredTypes.length}`);
  pass('Dispatcher wiring validated');
}

process.exit(process.exitCode || 0);
