import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Check the actual JSX sibling keys. Duplicate changing keys can leave orphaned
// DOM nodes; a store-only profile-switch test cannot detect that regression.
const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const app = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'App');
const statement = app.body.statements.find(ts.isReturnStatement);
const root = ts.isParenthesizedExpression(statement.expression) ? statement.expression.expression : statement.expression;
const expressions = new Map();
for (const child of root.children) {
  const opening = ts.isJsxElement(child) ? child.openingElement : ts.isJsxSelfClosingElement(child) ? child : null;
  if (!opening) continue;
  const name = opening.tagName.getText(ast);
  if (!['Sidebar', 'main', 'Suspense'].includes(name)) continue;
  const attribute = opening.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.text === 'key');
  assert.ok(attribute && ts.isJsxExpression(attribute.initializer), `${name} must reset on profile change`);
  expressions.set(name, attribute.initializer.expression.getText(ast));
}

test('profile-switch layout siblings have unique keys and each resets on target change', () => {
  assert.equal(expressions.size, 3);
  const keys = profile => [...expressions.values()].map(expression => runInNewContext(`(${expression})`, { profile }));
  for (const profile of [null, { id: 'A' }, { id: 'B' }, { id: 'no-profile' }]) {
    const current = keys(profile);
    assert.equal(new Set(current).size, current.length, `Duplicate sibling keys: ${current.join(', ')}`);
    assert.deepEqual(keys(profile), current);
  }
  const a = keys({ id: 'A' });
  const b = keys({ id: 'B' });
  a.forEach((key, index) => assert.notEqual(key, b[index]));
});
