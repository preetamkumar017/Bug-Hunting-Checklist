// Verifies Learn content against the vendored official Bugcrowd VRT snapshot
// (scripts/vrt-2026-07-08). Shared by scripts/audit-learn.mjs and the test suite.
import { readFile } from 'node:fs/promises';

const SNAP = new URL('./vrt-2026-07-08/', import.meta.url);
const readJson = async name => JSON.parse(await readFile(new URL(name, SNAP), 'utf8'));

/** Flatten the official VRT into leaves keyed by full name path. */
export async function loadOfficialLeaves() {
  const vrt = (await readJson('vulnerability-rating-taxonomy.json')).content;
  const inherit = (nodes, key, parent = null, prefix = [], out = new Map()) => {
    for (const n of nodes) {
      const val = n[key] ?? parent;
      const p = [...prefix, n.id];
      out.set(p.join('/'), val);
      if (n.children) inherit(n.children, key, val, p, out);
    }
    return out;
  };
  const cvss = inherit((await readJson('cvss_v3.json')).content, 'cvss_v3');
  const cwe = inherit((await readJson('cwe.json')).content, 'cwe');
  const leaves = new Map();
  const walk = (nodes, names = [], ids = []) => {
    for (const n of nodes) {
      const nm = [...names, n.name], id = [...ids, n.id];
      if (n.children?.length) walk(n.children, nm, id);
      else leaves.set(nm.join(' › '), {
        priority: n.priority ? `P${n.priority}` : 'varies',
        cvss: cvss.get(id.join('/')) ?? null,
        cwe: cwe.get(id.join('/')) ?? null,
      });
    }
  };
  walk(vrt);
  return leaves;
}

const LANGS = ['en', 'simple', 'hi'];
function checkTri(value, where, errors) {
  if (typeof value === 'string' || !value) { errors.push(`${where}: not trilingual (needs {en, simple, hi})`); return; }
  for (const l of LANGS) if (!value[l]?.trim()) errors.push(`${where}: missing "${l}"`);
}

/** Returns { errors, pending, stats }. `errors` must be empty for content to be correct. */
export async function auditLearn(server) {
  const leaves = await loadOfficialLeaves();
  const { vrtIndex } = await server.ssrLoadModule('/src/learn/data/vrtIndex.ts');
  const { vrtCwe } = await server.ssrLoadModule('/src/learn/data/vrtCwe.ts');
  const { learnGroups } = await server.ssrLoadModule('/src/learn/data/learn.ts');
  const { topicContent } = await server.ssrLoadModule('/src/learn/data/topics/index.ts');
  const errors = [];
  const full = e => (e.path.startsWith(e.category) ? e.path : `${e.category} › ${e.path}`);
  const indexPaths = new Set(vrtIndex.map(full));

  // 1. VRT index vs official taxonomy
  for (const e of vrtIndex) {
    const p = full(e), o = leaves.get(p);
    if (!o) { errors.push(`index: "${p}" is not an official VRT leaf`); continue; }
    if (o.priority !== e.priority) errors.push(`index: "${p}" priority ${e.priority} != official ${o.priority}`);
    if ((o.cvss ?? null) !== (e.cvss ?? null)) errors.push(`index: "${p}" CVSS ${e.cvss} != official ${o.cvss}`);
  }
  // 2. Official CWE map
  for (const p of indexPaths) {
    const want = leaves.get(p)?.cwe ?? null, got = vrtCwe[p] ?? null;
    if (JSON.stringify(want) !== JSON.stringify(got)) errors.push(`vrtCwe: "${p}" ${JSON.stringify(got)} != official ${JSON.stringify(want)}`);
  }
  // 3. Deep lessons: exact official leaf, matching priority + CVSS
  const deepPaths = new Set();
  for (const g of learnGroups) for (const t of g.topics) {
    const m = t.mapping, o = leaves.get(m.bugcrowdVrt), w = `deep ${g.id}/${t.id}`;
    if (deepPaths.has(m.bugcrowdVrt)) errors.push(`${w}: duplicate VRT path "${m.bugcrowdVrt}"`);
    deepPaths.add(m.bugcrowdVrt);
    if (!o) { errors.push(`${w}: "${m.bugcrowdVrt}" is not an official VRT leaf`); continue; }
    if (!indexPaths.has(m.bugcrowdVrt)) errors.push(`${w}: leaf not in the app's VRT index`);
    if (o.priority !== m.bugcrowdPriority) errors.push(`${w}: priority ${m.bugcrowdPriority} != official ${o.priority}`);
    if ((o.cvss ?? null) !== (m.bugcrowdCvss ?? null)) errors.push(`${w}: CVSS ${m.bugcrowdCvss} != official ${o.cvss}`);
    if (o.cwe && !o.cwe.some(id => new RegExp(`\\b${id}\\b`).test(m.hackeroneCwe)))
      errors.push(`${w}: CWE "${m.hackeroneCwe}" mentions none of the official ${o.cwe.join(', ')}`);
  }
  // 4. Per-leaf topic content: real leaf, no overlap with deep lessons, fully trilingual
  for (const [p, c] of Object.entries(topicContent)) {
    const w = `topic "${p}"`;
    if (!indexPaths.has(p)) { errors.push(`${w}: not a VRT index path`); continue; }
    if (deepPaths.has(p)) errors.push(`${w}: already covered by a deep lesson`);
    checkTri(c.what, `${w}.what`, errors);
    checkTri(c.proof, `${w}.proof`, errors);
    if (c.escalate) checkTri(c.escalate, `${w}.escalate`, errors);
    if (!Array.isArray(c.find) || c.find.length === 0) errors.push(`${w}.find: empty`);
    (c.find ?? []).forEach((m, i) => {
      checkTri(m.title, `${w}.find[${i}].title`, errors);
      if (!m.steps?.length) errors.push(`${w}.find[${i}].steps: empty`);
      (m.steps ?? []).forEach((s, j) => checkTri(s, `${w}.find[${i}].steps[${j}]`, errors));
    });
    if (c.cwe && vrtCwe[p]) errors.push(`${w}.cwe: leaf already has an official CWE (${vrtCwe[p].join(', ')}) — remove the override`);
    if (c.cwe && !/^CWE-\d+: \S/.test(c.cwe)) errors.push(`${w}.cwe: must look like "CWE-123: Name"`);
  }
  const pending = [...indexPaths].filter(p => !deepPaths.has(p) && !topicContent[p]);
  return {
    errors, pending,
    stats: { index: indexPaths.size, deep: deepPaths.size, topics: Object.keys(topicContent).length, pending: pending.length },
  };
}
