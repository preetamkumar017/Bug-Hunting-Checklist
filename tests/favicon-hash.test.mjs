import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

const load = (name) => server.ssrLoadModule(`/src/${name}`);
const {
  murmur3_32_signed,
  murmur3_32_unsigned,
  toShodanBase64,
  calculateShodanFaviconHash,
  computeBinaryMd5,
  normalizeFaviconUrl,
} = await load('tools/lib/faviconHash.ts');

test('MurmurHash3 32-bit signed and unsigned match standard vectors', () => {
  // Test vectors from mmh3 python reference
  assert.equal(murmur3_32_signed('foo'), -156908512);
  assert.equal(murmur3_32_signed('foo', 42), -1322301282);
  assert.equal(murmur3_32_unsigned('foo'), 4138058784);
  assert.equal(murmur3_32_signed('hello world'), 1586663183);
  assert.equal(murmur3_32_unsigned('hello world'), 1586663183);
});

test('Shodan base64 MIME formatting wraps at 76 chars with trailing newline', () => {
  const bytes = new Uint8Array(Array.from({ length: 120 }, (_, i) => i % 256));
  const b64 = toShodanBase64(bytes);
  assert.ok(b64.endsWith('\n'), 'Must end with newline');
  const lines = b64.split('\n').filter(Boolean);
  assert.equal(lines[0].length, 76);
  assert.equal(lines[1].length, 76);
  assert.ok(lines[2].length <= 76);
});

test('Binary MD5 matches node crypto digest exactly on arbitrary bytes', () => {
  const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0xff, 0x42, 0x13, 0x37]);
  const nodeMd5 = createHash('md5').update(bytes).digest('hex');
  const computed = computeBinaryMd5(bytes);
  assert.equal(computed, nodeMd5);
});

test('calculateShodanFaviconHash computes correct MurmurHash3 from binary bytes', () => {
  const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const hash = calculateShodanFaviconHash(bytes);
  assert.equal(typeof hash, 'number');
  assert.ok(Number.isInteger(hash));
  assert.equal(hash, murmur3_32_signed(toShodanBase64(bytes)));
});

test('normalizeFaviconUrl expands bare domains to https and favicon.ico', () => {
  assert.equal(normalizeFaviconUrl('example.com'), 'https://example.com/favicon.ico');
  assert.equal(normalizeFaviconUrl('http://example.com'), 'http://example.com/favicon.ico');
  assert.equal(normalizeFaviconUrl('https://example.com/custom.ico'), 'https://example.com/custom.ico');
});

test.after(async () => {
  await server.close();
});
