import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditLearn } from './learn-audit-lib.mjs';

// Usage: npm run audit:learn [-- --strict]   (--strict also fails on pending leaves)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { errors, pending, stats } = await auditLearn(server);
  console.log(`VRT index ${stats.index} · deep lessons ${stats.deep} · per-leaf topics ${stats.topics} · pending ${stats.pending}`);
  for (const e of errors) console.log(`ERROR  ${e}`);
  if (process.argv.includes('--verbose')) for (const p of pending) console.log(`PENDING  ${p}`);
  const strict = process.argv.includes('--strict');
  if (errors.length || (strict && pending.length)) {
    console.log(`\n${errors.length} error(s)${strict ? `, ${pending.length} pending` : ''}`);
    process.exitCode = 1;
  } else console.log('\nOK — all Learn content matches the official VRT snapshot.');
} finally {
  await server.close();
}
