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

const {
  ECOMMERCE_VULN_CLASSES,
  ECOMMERCE_METHODOLOGY_PHASES,
  ECOMMERCE_TOOLS_STASH,
  ECOMMERCE_REPORT_TEMPLATES,
} = await load('learn/data/ecommerceData.ts');

test('ECOMMERCE data contains 6 high-yield classes with scenarios, methodology and reports', () => {
  assert.equal(ECOMMERCE_VULN_CLASSES.length, 6);
  for (const v of ECOMMERCE_VULN_CLASSES) {
    assert.ok(v.id && v.title.en && v.title.hi);
    assert.ok(v.cwe && v.vrt && v.bountyRange);
    assert.ok(v.scenarios.length > 0);
    assert.ok(v.testingRecipe.length > 0);
    for (const sc of v.scenarios) {
      assert.ok(sc.title.en && sc.title.hi);
      assert.ok(sc.description.en && sc.description.hi);
      assert.ok(sc.impact.en && sc.impact.hi);
    }
  }
  assert.equal(ECOMMERCE_METHODOLOGY_PHASES.length, 5);
  for (const ph of ECOMMERCE_METHODOLOGY_PHASES) {
    assert.ok(ph.phase && ph.title.en && ph.title.hi);
    assert.ok(ph.steps.length > 0);
  }
  assert.ok(ECOMMERCE_TOOLS_STASH.length >= 2);
  assert.equal(ECOMMERCE_REPORT_TEMPLATES.length, 3);
  for (const tmpl of ECOMMERCE_REPORT_TEMPLATES) {
    assert.ok(tmpl.id && tmpl.title.en && tmpl.cvss && tmpl.reportMarkdown);
  }
});

test.after(async () => {
  await server.close();
});
