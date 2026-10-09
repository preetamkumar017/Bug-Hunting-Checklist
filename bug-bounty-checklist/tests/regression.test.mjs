import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createServer } from 'vite';

// Exercise the real TypeScript modules without installing a second bundler.
// No HTTP listener, target requests, device hooks, or real browser storage.
const storage = new Map();
let rejectWrites = false;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => { if (rejectWrites) throw new Error('Simulated quota exceeded'); storage.set(key, value); },
  removeItem: key => storage.delete(key),
}});
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
after(() => server.close());
const load = name => server.ssrLoadModule(`/src/${name}`);
const { domains } = await load('data/domains.ts');
const playbooks = await load('lib/playbooks.ts');
const contentReview = await load('lib/contentReview.ts');
const cvss3 = await load('lib/cvss.ts');
const cvss4 = await load('lib/cvss4.ts');
const encoder = await load('lib/encoder.ts');
const hashes = await load('lib/hackerTools.ts');
const http = await load('lib/httpTools.ts');
const validation = await load('lib/profileValidation.ts');
const persistence = await load('lib/persistence.ts');
const catalogue = await load('lib/catalogue.ts');
const progress = await load('lib/progress.ts');
const reports = await load('lib/reportExport.ts');
const drafts = await load('lib/reportDraft.ts');
const reportSafety = await load('lib/reportSafety.ts');
const items = domains.flatMap(domain => domain.categories.flatMap(category => category.items.map(item => ({ domain, category, item }))));
const profile = (id = 'fixture') => ({ id, name: 'Test fixture', createdAt: 1, itemStates: {}, findings: [], assets: [], customCategories: [] });
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1kAAAAASUVORK5CYII=';
const finding = () => ({ id: 'finding', itemId: items[0].item.id, itemText: 'Fixture check', domain: 'web', categoryName: 'Fixture', severity: 'low', title: 'Observed fixture', description: 'Synthetic evidence only', createdAt: 1 });

test('entire catalogue: stable unique IDs, paired payload notes and valid references', () => {
  assert.equal(domains.length, 11);
  assert.ok(items.length >= 651);
  const categoryIds = domains.flatMap(d => d.categories.map(c => c.id));
  assert.equal(new Set(categoryIds).size, categoryIds.length);
  const ids = new Set(items.map(({ item }) => item.id));
  assert.equal(ids.size, items.length);
  for (const { item, category } of items) {
    assert.ok(item.text.trim() && item.how.trim(), item.id);
    assert.equal(item.payloads?.length ?? 0, item.payloadNotes?.length ?? 0, item.id);
    assert.ok(item.expectedResponse?.vulnerable && item.expectedResponse?.safe, item.id);
    const reference = item.reference ?? category.reference;
    assert.ok(reference && /^https?:\/\//.test(reference), `Missing source: ${item.id}`);
    for (const related of item.tags?.relatedItemIds ?? []) assert.ok(ids.has(related), `${item.id}: ${related}`);
  }
});

test('every check has item-relevant methods, evidence, controls and honest verification', () => {
  const audit = playbooks.auditPlaybookCoverage(domains);
  assert.equal(audit.length, items.length);
  for (const domain of domains) for (const category of domain.categories) {
    assert.equal(playbooks.resolvePlaybookStrategy(domain.id, category.id).categoryMatched, true, category.id);
  }
  const routes = playbooks.auditRecipeRoutes(domains);
  assert.ok(routes.every(route => route.exists));
  assert.equal(new Set(routes.map(route => `${route.domainId}:${route.categoryId}:${route.itemId}`)).size, routes.length);
  for (const { item, category, domain } of items) {
    const { methods } = playbooks.getItemPlaybook(item, category, domain);
    assert.ok(methods.length, item.id);
    for (const method of methods) {
      assert.ok(method.title.trim() && method.steps.length >= 3, item.id);
      for (const field of ['prerequisites', 'evidence', 'limitations', 'safety', 'references']) assert.ok(method[field]?.length, `${item.id}: ${field}`);
      assert.ok(method.expectedResponse?.vulnerable && method.expectedResponse?.safe, item.id);
      assert.notEqual(method.verification, 'lab_verified', `No target lab was run: ${item.id}`);
      assert.ok(!JSON.stringify(method).includes('--no-pause'), item.id);
    }
  }
  const byDomain = id => audit.find(row => row.domainId === id);
  assert.equal(byDomain('ai').strategy, 'ai-trust-boundary');
  assert.equal(byDomain('network_ad').strategy, 'directory-policy');
  assert.equal(byDomain('soc_forensics').strategy, 'forensic-corroboration');
  assert.equal(byDomain('web3').strategy, 'local-contract-invariant');
  assert.ok(audit.filter(row => row.methodCount > 1).length >= 73);
});

test('owned source corrections expose mechanical defects instead of padding them', () => {
  const rows = contentReview.auditOwnedContent();
  assert.equal(rows.length, 197);
  for (const row of rows) {
    assert.equal(row.rawIssues.length, 0, JSON.stringify(row));
    assert.equal(row.effectiveIssues.length, 0, JSON.stringify(row));
  }
  assert.ok(contentReview.inspectContentIssues({ id: 'bad', how: 'Fixture', payloads: ['one'], payloadNotes: [] }).length);
});

test('custom and unknown checks never inherit an invented keyword attack recipe', () => {
  const domain = domains.find(d => d.id === 'ai');
  const item = { id: 'custom-inject', text: 'SQL injection words in an AI custom check', how: 'Review a fixture', severity: 'info', isCustom: true };
  const category = { id: 'new-inject-category', name: 'Injection', items: [item], isCustom: true };
  const result = playbooks.getItemPlaybook(item, category, domain);
  assert.equal(result.methods.length, 1);
  assert.equal(result.methods[0].verification, 'needs_adaptation');
  assert.ok(!JSON.stringify(result).includes('sqlmap'));
  const authored = { ...item, methods: [{ title: 'My precise method', steps: ['a', 'b', 'c'] }] };
  assert.equal(playbooks.getItemPlaybook(authored, category, domain).methods[0].title, 'My precise method');
});

test('CVSS fixtures and strict base-vector parsing', () => {
  assert.equal(cvss3.calcCvss({ av: 'N', ac: 'L', pr: 'N', ui: 'N', s: 'U', c: 'H', i: 'H', a: 'H' }).score, 9.8);
  assert.equal(cvss3.calcCvss(cvss3.DEFAULT_CVSS).score, 0);
  const base = cvss4.calcCvss4(cvss4.DEFAULT_CVSS4);
  assert.equal(base.score, 9.3);
  assert.equal(cvss4.calcCvss4({ ...cvss4.DEFAULT_CVSS4, sc: 'H', si: 'H', sa: 'H' }).score, 10);
  assert.equal(cvss4.calcCvss4({ ...cvss4.DEFAULT_CVSS4, vc: 'N', vi: 'N', va: 'N' }).score, 0);
  assert.deepEqual(cvss4.parseCvss4Vector(base.vector), cvss4.DEFAULT_CVSS4);
  for (const vector of [base.vector + '/AV:N', base.vector + '/E:A', base.vector + '/BOGUS:N', base.vector.replace('/SA:N', ''), base.vector.replace('AV:N', 'AV:N:bad')]) assert.equal(cvss4.parseCvss4Vector(vector), null, vector);
  assert.equal(cvss3.parseCvssVector('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:F'), null);
});

test('all 104976 CVSS4 base combinations are finite, bounded and round-trip', () => {
  const keys = ['av', 'ac', 'at', 'pr', 'ui', 'vc', 'vi', 'va', 'sc', 'si', 'sa'];
  const choices = ['NALP', 'LH', 'NP', 'NLH', 'NPA', 'HLN', 'HLN', 'HLN', 'HLN', 'HLN', 'HLN'];
  let count = 0;
  function visit(index, metrics) {
    if (index < keys.length) { for (const value of choices[index]) visit(index + 1, { ...metrics, [keys[index]]: value }); return; }
    const { score, vector } = cvss4.calcCvss4(metrics);
    assert.ok(Number.isFinite(score) && score >= 0 && score <= 10, vector);
    assert.deepEqual(cvss4.parseCvss4Vector(vector), metrics);
    count++;
  }
  visit(0, {});
  assert.equal(count, 104976);
});

test('Unicode hashes and encodings agree with platform reference outputs', () => {
  for (const text of ['', 'abc', 'é', '😀', 'हिन्दी', 'line\r\nline']) {
    assert.equal(hashes.computeMd5(text), createHash('md5').update(text, 'utf8').digest('hex'), text);
    assert.equal(encoder.base64Decode(encoder.base64Encode(text)), text);
    assert.equal(encoder.hexDecode(encoder.hexEncode(text)), text);
  }
  for (const invalid of ['gg', '0g', '1', 'zz00']) assert.match(encoder.hexDecode(invalid), /^Error:/);
  const token = [Buffer.from('{"alg":"none"}').toString('base64url'), Buffer.from('{"exp":0,"iat":0}').toString('base64url'), ''].join('.');
  assert.equal(encoder.parseJwt(token).isExpired, true);
  assert.equal(encoder.parseJwt(token + '.extra'), null);
  assert.equal(encoder.parseJwt(token.slice(0, -1)), null);
  const mutations = encoder.generateWafMutations('<svg onload=alert(1)>');
  assert.ok(!mutations.some(m => /alternating case|inline sql/i.test(m.technique)));
});

test('HTTP replay preserves body, duplicate values and query; links resolve', () => {
  const raw = 'GET /api/users/1?tag=a&tag=b HTTP/1.1\r\nHost: example.test\r\nX-Test: first\r\nX-Test: second\r\n\r\nbody\r\n';
  const req = http.parseRawHttpRequest(raw);
  assert.ok(req);
  assert.equal(req.raw, raw);
  assert.equal(req.body, 'body\r\n');
  assert.deepEqual(req.queryParams, [['tag', 'a'], ['tag', 'b']]);
  assert.deepEqual(http.headerValues(req, 'X-Test'), ['first', 'second']);
  assert.match(http.generateNucleiTemplate(req), /\/api\/users\/1\?tag=a&tag=b/);
  assert.match(http.generateNucleiTemplate(req), /severity: info/);
  assert.match(http.generatePython(req), /raise ValueError/);
  const categoryIds = new Set(domains.flatMap(d => d.categories.map(c => c.id)));
  for (const suggestion of http.analyzeRequestForAttacks(req)) assert.ok(categoryIds.has(suggestion.categoryLink), suggestion.categoryLink);
  const form = http.parseRawHttpRequest('POST / HTTP/1.1\r\nHost: example.test\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\nid=1&id=2');
  assert.deepEqual(form.formParams, [['id', '1'], ['id', '2']]);
  assert.match(http.generatePython(form), /requests\.request/);
  assert.match(http.generatePython(form), /verify=True/);
  assert.equal(http.parseRawHttpRequest('GET / HTTP/1.1\r\nHost: a.test\r\nHost: b.test'), null);
});

test('cURL shell quoting keeps command substitutions and leading @ literal', () => {
  const req = http.parseRawHttpRequest('POST /?value=$(REVIEW_CANARY) HTTP/1.1\r\nHost: example.test\r\nX-Test: `REVIEW_CANARY` "quote" $HOME\r\n\r\n@local-file\ntext');
  const generated = http.generateCurl(req);
  // bash function substitutes for curl, so no network call or file read occurs.
  const stub = 'curl() { command node -e "console.log(JSON.stringify(process.argv.slice(1)))" -- "$@"; }; REVIEW_CANARY() { command printf "UNSAFE_SUBSTITUTION" >&2; };\n';
  const result = spawnSync('bash', ['--noprofile', '--norc', '-c', stub + generated], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  const argv = JSON.parse(result.stdout);
  assert.ok(argv.includes('X-Test: `REVIEW_CANARY` "quote" $HOME'));
  assert.ok(argv.includes(req.url));
  assert.equal(argv[argv.indexOf('--data-raw') + 1], req.body);
  assert.ok(!argv.includes('-k'));
});

test('profile import rejects malformed state, hostile metadata and inconsistent scores', () => {
  assert.deepEqual(validation.validateProfile(profile()), profile());
  for (const input of [{}, [], { ...profile(), findings: {} }, { ...profile(), id: '__proto__' }]) assert.throws(() => validation.validateProfile(input));
  const custom = { id: 'custom-cat-fixture', name: 'Fixture', domainId: 'web', items: [{ id: 'custom-item-fixture', text: 'Fixture', how: 'Inspect fixture', severity: 'info', payloads: ['one'], payloadNotes: [] }] };
  assert.throws(() => validation.validateProfile({ ...profile(), customCategories: [custom] }));
  custom.items[0].payloadNotes = ['Explanation'];
  custom.items[0].methods = [{ title: 'Test', steps: ['Test'], references: ['javascript:alert(1)'] }];
  assert.throws(() => validation.validateProfile({ ...profile(), customCategories: [custom] }));
  const scored = { ...finding(), cvss: { vector: cvss4.calcCvss4(cvss4.DEFAULT_CVSS4).vector, score: 10 } };
  assert.throws(() => validation.validateProfile({ ...profile(), findings: [scored] }));
  assert.equal(validation.validateScreenshot(png), png);
  assert.throws(() => validation.validateScreenshot('data:image/svg+xml;base64,PHN2Zz4='));
  assert.throws(() => validation.validateScreenshot('https://example.test/remote.png'));
});

test('HTML reports escape untrusted imported values and do not infer impact', () => {
  const hostile = { ...finding(), title: '<script>CANARY</script>', description: '<img src=x onerror=CANARY>', severity: 'low" onclick="CANARY', screenshots: ['x"><b id="CANARY">injected</b>', 'https://example.test/leak', 'data:image/svg+xml;base64,PHN2Zz4=', png] };
  const html = reports.generateExecutiveHtml({ ...profile(), findings: [hostile] }, new Date('2026-01-01T00:00:00Z'));
  assert.ok(!html.includes('<script>CANARY'));
  assert.ok(!html.includes('<b id="CANARY">'));
  assert.ok(!html.includes('src="https://example.test/leak'));
  assert.ok(html.includes('script-src'));
  assert.ok(html.includes(png));
  assert.equal(reportSafety.isSafeDataImage('data:image/svg+xml;base64,PHN2Zz4='), false);
  const markdown = reports.formatFinding(finding(), 'hackerone');
  assert.ok(!markdown.includes('potentially leading to'));
});

test('report drafts allow factual bracketed evidence and informational observations', () => {
  const blank = drafts.newReportDraft(drafts.REPORT_PRESETS[0]);
  assert.ok(drafts.reportDraftIssues(blank).length);
  const ready = { ...blank, title: 'Fixture observation', targetUrl: 'https://[::1]/fixture', steps: '1. Inspect fixture [A]', evidence: '[12:00] Response contained ["owned-marker"]', impact: 'Only fixture A is affected; no additional access demonstrated.' };
  assert.deepEqual(drafts.reportDraftIssues(ready), []);
  assert.match(drafts.generateReportDraft(ready, 'hackerone', false), /INCOMPLETE DRAFT/);
  assert.ok(!drafts.generateReportDraft(ready, 'hackerone', true).includes('INCOMPLETE DRAFT'));
});

test('legacy persistence is readable without destructive migration; reductions are allowed', () => {
  const largePng = 'data:image/png;base64,' + Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(300_000)]).toString('base64');
  const old = { ...profile(), findings: [{ ...finding(), screenshots: [largePng] }] };
  const raw = JSON.stringify({ state: { profiles: { fixture: old }, activeProfileId: 'fixture' }, version: 0 });
  storage.set(persistence.STORAGE_KEY, raw);
  const state = persistence.loadState();
  assert.equal(storage.get(persistence.STORAGE_KEY), raw);
  assert.equal(state.profiles.fixture.findings[0].screenshots[0], largePng);
  assert.match(persistence.getPersistenceWarning(), /Recovery mode/);
  assert.throws(() => validation.validateProfile(old));
  const edited = structuredClone(state);
  edited.profiles.fixture.name = 'Unrelated edit';
  assert.throws(() => persistence.saveState(edited), /read-only/);
  const reduced = structuredClone(state);
  reduced.profiles.fixture.findings[0].screenshots = [];
  persistence.saveState(reduced);
  assert.equal(persistence.getPersistenceWarning(), null);
  storage.set(persistence.STORAGE_KEY, '{}');
  assert.throws(() => persistence.saveState(reduced), /another tab/);
  storage.clear();
  persistence.loadState();
});

test('store transactions persist custom checks, isolated profiles, accurate counts and rollback', async () => {
  storage.clear();
  persistence.loadState();
  const { useChecklistStore: store } = await load('store/useChecklistStore.ts');
  const active = () => store.getState().profiles[store.getState().activeProfileId];
  const domain = domains[0];
  const category = domain.categories[0];
  const before = active();
  store.getState().addCustomItem(category.id, { text: 'Custom fixture', how: 'Compare controlled fixture', severity: 'info' });
  const custom = active().customCategories.find(c => c.id === category.id).items[0];
  assert.equal(catalogue.effectiveCategories(domain, active())[0].items.length, category.items.length + 1);
  store.getState().setItemStatus(custom.id, 'clean');
  assert.equal(progress.categoryProgress(catalogue.effectiveCategories(domain, active())[0], active()).done, 1);
  store.getState().toggleBookmark(custom.id);
  store.getState().setItemNote(custom.id, 'Follow up');
  store.getState().setItemStatus(custom.id, 'blocked');
  assert.equal(active().itemStates[custom.id].bookmarked, true);
  assert.equal(progress.categoryProgress(catalogue.effectiveCategories(domain, active())[0], active()).done, 0);
  store.getState().deleteCustomItem(category.id, custom.id);
  assert.equal(active().itemStates[custom.id], undefined);
  assert.equal(catalogue.effectiveCategories(domain, active())[0].items.length, category.items.length);
  store.getState().setItemNote(category.items[0].id, 'Profile A only');
  const a = active().id;
  store.getState().createProfile('Profile B');
  const b = active().id;
  assert.notEqual(a, b);
  assert.equal(active().itemStates[category.items[0].id], undefined);
  store.getState().setItemNote(category.items[0].id, 'Profile B only');
  store.getState().setActiveProfile(a);
  assert.equal(active().itemStates[category.items[0].id].note, 'Profile A only');
  const imported = validation.validateProfile(active());
  store.getState().importProfile(imported);
  assert.notEqual(active().id, imported.id);
  assert.equal(store.getState().profiles[a].name, before.name);
  store.getState().bulkAddAssets(['https://example.test/']);
  assert.equal(active().assets[0].status, 'Unverified');
  const saved = active();
  rejectWrites = true;
  assert.throws(() => store.getState().setScratchpad('must not save'), /quota/);
  assert.equal(active(), saved);
  assert.match(store.getState().storageError, /quota/);
  rejectWrites = false;
  store.getState().setScratchpad('saved fixture');
  assert.equal(active().scratchpad, 'saved fixture');
  assert.equal(store.getState().storageError, null);
  assert.equal(JSON.parse(storage.get(persistence.STORAGE_KEY)).state.profiles[active().id].scratchpad, 'saved fixture');
});
