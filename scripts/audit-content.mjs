import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// This audits shipped catalogue structure/method routing, not target exploitability.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { domains } = await server.ssrLoadModule('/src/data/domains.ts');
  const { auditPlaybookCoverage, getItemPlaybook } = await server.ssrLoadModule('/src/lib/playbooks.ts');
  const { auditOwnedContent } = await server.ssrLoadModule('/src/lib/contentReview.ts');
  const corrections = new Map(auditOwnedContent().map(row => [row.itemId, row]));
  const catalogue = domains.flatMap(domain => domain.categories.flatMap(category => category.items.map(item => ({ domain, category, item }))));
  const entries = auditPlaybookCoverage(domains).map((row, index) => {
    const { item, category, domain } = catalogue[index];
    const methods = getItemPlaybook(item, category, domain).methods;
    return { ...row, title: item.text, reference: item.reference ?? category.reference,
      payloadCount: item.payloads?.length ?? 0, notesMatch: (item.payloads?.length ?? 0) === (item.payloadNotes?.length ?? 0),
      methods: methods.map(m => ({ title: m.title, verification: m.verification, stepCount: m.steps.length,
        prerequisites: m.prerequisites, evidence: m.evidence, limitations: m.limitations, safety: m.safety })),
      sourceCorrections: corrections.get(item.id) ?? null };
  });
  const issues = entries.filter(row => !row.notesMatch || !row.methodCount || !row.hasExpectedResults || !row.hasEvidence
    || row.sourceCorrections?.rawIssues.length || row.sourceCorrections?.effectiveIssues.length);
  const summary = { domains: domains.length, categories: domains.reduce((n, d) => n + d.categories.length, 0), checks: entries.length,
    methods: entries.reduce((n, row) => n + row.methodCount, 0), checksWithAdditionalRecipe: entries.filter(row => row.methodCount > 1).length,
    labVerified: entries.filter(row => row.verification.includes('lab_verified')).length, structuralIssues: issues.length };
  await mkdir(path.join(root, 'reports'), { recursive: true });
  await writeFile(path.join(root, 'reports/method-coverage.json'), JSON.stringify({
    schemaVersion: 1,
    scope: 'Source-reviewed catalogue and automated structural coverage. No external targets or device/contract/AD labs were executed. Reviewed is not lab-verified. needs_adaptation means the target-specific procedure still needs configuration.',
    summary, entries,
  }, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
  console.log('Per-check evidence: reports/method-coverage.json');
  if (issues.length) { console.error('Failing IDs:', issues.map(row => row.itemId).join(', ')); process.exitCode = 1; }
} finally { await server.close(); }
