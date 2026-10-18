import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { auditLearn } from '../scripts/learn-audit-lib.mjs';

// Learn content must never drift from the published Bugcrowd VRT: wrong paths,
// priorities, CVSS vectors or CWE ids are user-facing misinformation.
const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
after(() => server.close());

test('Learn VRT data, deep lessons and per-leaf topics match the official taxonomy', async () => {
  const { errors } = await auditLearn(server);
  assert.deepEqual(errors, []);
});
