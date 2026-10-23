import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

const load = (name) => server.ssrLoadModule(`/src/${name}`);
const { interpolateTargetVars } = await load('shared/store/useTargetContext.ts');
const { ATTACK_CHAINS } = await load('tools/data/attackChainData.ts');

test('interpolateTargetVars replaces {TARGET}, {DOMAIN}, and standard dummy domains', () => {
  const template = 'curl -i "https://target.com/api" -H "Host: {TARGET}"';
  const result = interpolateTargetVars(template, {
    targetDomain: 'uber.com',
  });
  assert.equal(result, 'curl -i "https://uber.com/api" -H "Host: uber.com"');
});

test('interpolateTargetVars replaces {SUBDOMAIN} and api.target.com', () => {
  const template = 'httpx -u "https://api.target.com" -H "Host: {SUBDOMAIN}"';
  const result = interpolateTargetVars(template, {
    targetDomain: 'uber.com',
    subdomain: 'dev-api.uber.com',
  });
  assert.equal(result, 'httpx -u "https://dev-api.uber.com" -H "Host: dev-api.uber.com"');
});

test('interpolateTargetVars replaces {ORIGIN_IP} and {IP}', () => {
  const template = 'curl -k -H "Host: {TARGET}" "https://{ORIGIN_IP}/"';
  const result = interpolateTargetVars(template, {
    targetDomain: 'tesla.com',
    originIp: '198.51.100.42',
  });
  assert.equal(result, 'curl -k -H "Host: tesla.com" "https://198.51.100.42/"');
});

test('interpolateTargetVars replaces {BUCKET} and {PATH}', () => {
  const template = 'aws s3 ls s3://{BUCKET} && curl -i "https://{TARGET}{PATH}"';
  const result = interpolateTargetVars(template, {
    targetDomain: 'company.com',
    cloudBucket: 'company-prod-backups',
    protectedPath: '/actuator/env',
  });
  assert.equal(result, 'aws s3 ls s3://company-prod-backups && curl -i "https://company.com/actuator/env"');
});

test('ATTACK_CHAINS data contains valid categories and non-empty steps', () => {
  assert.ok(ATTACK_CHAINS.length >= 6);
  for (const cat of ATTACK_CHAINS) {
    assert.ok(cat.id && cat.title && cat.artifactName && cat.emoji);
    assert.ok(cat.description.en && cat.description.hi);
    assert.ok(cat.steps.length > 0, `Category ${cat.id} has no steps`);
    for (const step of cat.steps) {
      assert.ok(step.id && step.title && step.commandTemplate);
      assert.ok(step.objective.en && step.objective.hi);
      assert.ok(step.expectedVulnerable.en && step.expectedSafe.en);
      assert.ok(step.bountyTip.en && step.bountyTip.hi);
    }
  }
});

test.after(async () => {
  await server.close();
});
