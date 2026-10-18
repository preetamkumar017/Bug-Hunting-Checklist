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

test('every topic has practical tools, execution steps and high-payout bounty tips', async () => {
  const { vrtIndex } = await server.ssrLoadModule('/src/learn/data/vrtIndex.ts');
  const { lessonForEntry, learnGroups, localizedTopic } = await server.ssrLoadModule('/src/learn/data/learn.ts');

  for (const entry of vrtIndex) {
    const l = lessonForEntry(entry, 'en');
    assert.ok(l.tools && l.tools.length > 0, `Missing tools for ${entry.path}`);
    assert.ok(
      l.bountyTips &&
        l.bountyTips.triageSecret &&
        l.bountyTips.impactMultiplier &&
        l.bountyTips.avoidDuplicates,
      `Missing bounty tips for ${entry.path}`,
    );
  }

  for (const group of learnGroups) {
    for (const topic of group.topics) {
      const l = localizedTopic(topic, 'en');
      assert.ok(l.tools && l.tools.length > 0, `Missing tools for group topic ${topic.name}`);
      assert.ok(
        l.bountyTips &&
          l.bountyTips.triageSecret &&
          l.bountyTips.impactMultiplier &&
          l.bountyTips.avoidDuplicates,
        `Missing bounty tips for group topic ${topic.name}`,
      );
    }
  }
});

