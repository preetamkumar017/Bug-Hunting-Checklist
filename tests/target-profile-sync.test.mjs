import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

const load = (name) => server.ssrLoadModule(`/src/${name}`);

const { extractDomainFromText, deriveSubdomain } = await load('shared/lib/domainExtractor.ts');
const {
  useTargetContext,
  interpolateTargetVars,
  syncTargetContextFromProfile,
} = await load('shared/store/useTargetContext.ts');
const { validateProfile } = await load('shared/lib/profileValidation.ts');

test('extractDomainFromText extracts hostname from bare domains, URLs, wildcards and titles', () => {
  assert.equal(extractDomainFromText('salesflare.com'), 'salesflare.com');
  assert.equal(extractDomainFromText('https://api.salesflare.com/v1/users'), 'api.salesflare.com');
  assert.equal(extractDomainFromText('http://test.salesflare.com:8080'), 'test.salesflare.com');
  assert.equal(extractDomainFromText('*.salesflare.com'), 'salesflare.com');
  assert.equal(extractDomainFromText('Salesflare Program (salesflare.com)'), 'salesflare.com');
  assert.equal(extractDomainFromText('tesla.com/vulnerabilities'), 'tesla.com');
  assert.equal(extractDomainFromText('Default'), '');
  assert.equal(extractDomainFromText('Bug Bounty 2026'), '');
  assert.equal(extractDomainFromText(''), '');
});

test('deriveSubdomain creates api subdomain or retains multi-level subdomain', () => {
  assert.equal(deriveSubdomain('salesflare.com'), 'api.salesflare.com');
  assert.equal(deriveSubdomain('tesla.com'), 'api.tesla.com');
  assert.equal(deriveSubdomain('dev-api.salesflare.com'), 'dev-api.salesflare.com');
  assert.equal(deriveSubdomain(''), '');
});

test('interpolateTargetVars replaces api.example.com, {TARGET_URL}, and {URL}', () => {
  const template = 'curl -i "{TARGET_URL}/auth" -H "Host: {TARGET}" && ffuf -u "https://api.example.com/FUZZ" -w wordlist.txt';
  const result = interpolateTargetVars(template, {
    targetDomain: 'salesflare.com',
    subdomain: 'api.salesflare.com',
  });
  assert.equal(
    result,
    'curl -i "https://salesflare.com/auth" -H "Host: salesflare.com" && ffuf -u "https://api.salesflare.com/FUZZ" -w wordlist.txt'
  );
});

test('validateProfile accepts valid targetContext and preserves it', () => {
  const profile = {
    id: 'profile-sync-test',
    name: 'salesflare.com',
    createdAt: Date.now(),
    itemStates: {},
    findings: [],
    targetContext: {
      targetDomain: 'salesflare.com',
      subdomain: 'api.salesflare.com',
      originIp: '198.51.100.42',
      cloudBucket: 'salesflare-backups',
      protectedPath: '/actuator/env',
      techStack: 'Node.js, AWS',
      tokenOrSecret: 'secret_123',
    },
  };

  const validated = validateProfile(profile);
  assert.deepEqual(validated.targetContext, profile.targetContext);
});

test('syncTargetContextFromProfile loads per-profile variables into useTargetContext', () => {
  const profileSalesflare = {
    id: 'p-sf',
    name: 'salesflare.com',
    createdAt: Date.now(),
    itemStates: {},
    findings: [],
    targetContext: {
      targetDomain: 'salesflare.com',
      subdomain: 'api.salesflare.com',
      originIp: '198.51.100.10',
      cloudBucket: 'salesflare-s3',
      protectedPath: '/admin',
      techStack: '',
      tokenOrSecret: '',
    },
  };

  const profileTesla = {
    id: 'p-ts',
    name: 'tesla.com',
    createdAt: Date.now(),
    itemStates: {},
    findings: [],
    targetContext: {
      targetDomain: 'tesla.com',
      subdomain: 'api.tesla.com',
      originIp: '104.22.0.1',
      cloudBucket: 'tesla-prod-assets',
      protectedPath: '/debug',
      techStack: '',
      tokenOrSecret: '',
    },
  };

  // Sync salesflare
  syncTargetContextFromProfile(profileSalesflare);
  let state = useTargetContext.getState();
  assert.equal(state.targetDomain, 'salesflare.com');
  assert.equal(state.subdomain, 'api.salesflare.com');
  assert.equal(state.originIp, '198.51.100.10');
  assert.equal(state.cloudBucket, 'salesflare-s3');
  assert.equal(state.protectedPath, '/admin');

  // Switch to Tesla
  syncTargetContextFromProfile(profileTesla);
  state = useTargetContext.getState();
  assert.equal(state.targetDomain, 'tesla.com');
  assert.equal(state.subdomain, 'api.tesla.com');
  assert.equal(state.originIp, '104.22.0.1');
  assert.equal(state.cloudBucket, 'tesla-prod-assets');
  assert.equal(state.protectedPath, '/debug');

  // Switch back to salesflare - verify no cross-contamination
  syncTargetContextFromProfile(profileSalesflare);
  state = useTargetContext.getState();
  assert.equal(state.targetDomain, 'salesflare.com');
  assert.equal(state.subdomain, 'api.salesflare.com');
  assert.equal(state.originIp, '198.51.100.10');
  assert.equal(state.cloudBucket, 'salesflare-s3');
  assert.equal(state.protectedPath, '/admin');
});

test('syncTargetContextFromProfile auto-seeds domain and subdomain from profile name when empty', () => {
  const bareProfile = {
    id: 'p-bare',
    name: 'uber.com',
    createdAt: Date.now(),
    itemStates: {},
    findings: [],
  };

  syncTargetContextFromProfile(bareProfile);
  const state = useTargetContext.getState();
  assert.equal(state.targetDomain, 'uber.com');
  assert.equal(state.subdomain, 'api.uber.com');
});

test.after(async () => {
  await server.close();
});
