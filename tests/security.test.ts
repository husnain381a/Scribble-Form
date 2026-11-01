import test from 'node:test';
import assert from 'node:assert/strict';
import { contentSecurityPolicy } from '../src/lib/security';
import { assertSafeContent } from '../scripts/secret-guard.mjs';
import { safeFileName } from '../src/lib/forms';
test('production CSP restricts scripts to a nonce and the configured project', () => {
  const csp = contentSecurityPolicy('random-test-nonce', {
    development: false,
    https: true,
    supabaseOrigin: 'https://project.supabase.co',
  });
  const script = csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith('script-src '))!;
  assert.ok(script.includes("'nonce-random-test-nonce'"));
  assert.ok(script.includes("'strict-dynamic'"));
  assert.ok(!script.includes('unsafe-inline'));
  assert.ok(!script.includes('unsafe-eval'));
  assert.ok(csp.includes("script-src-attr 'none'"));
  assert.ok(csp.includes("object-src 'none'"));
  assert.ok(csp.includes("frame-ancestors 'none'"));
  assert.ok(csp.includes('https://project.supabase.co'));
  assert.ok(!csp.includes('*.supabase.co'));
  assert.ok(csp.includes('upgrade-insecure-requests'));
});
test('development CSP allows debugging without forcing localhost HTTPS', () => {
  const csp = contentSecurityPolicy('dev-nonce', { development: true, https: false });
  assert.ok(csp.includes("'unsafe-eval'"));
  assert.ok(!csp.includes('upgrade-insecure-requests'));
});
test('source packaging rejects privileged credentials and keeps public keys usable', () => {
  assert.throws(() => assertSafeContent('sb_secret_' + 'A'.repeat(30), 'fixture'));
  const token = [
    Buffer.from('{"alg":"HS256"}').toString('base64url'),
    Buffer.from('{"role":"service_role"}').toString('base64url'),
    'A'.repeat(40),
  ].join('.');
  assert.throws(() => assertSafeContent(token, 'fixture'));
  assert.throws(() =>
    assertSafeContent('a private known-value-credential', 'fixture', ['known-value-credential']),
  );
  assert.doesNotThrow(() => assertSafeContent('sb_publishable_' + 'A'.repeat(30), 'fixture'));
});
test('upload filenames reject path and header control characters', () => {
  for (const name of [
    '../file.txt',
    'folder\\file.txt',
    'bad\r\nheader.txt',
    '\u0000.txt',
    '.',
    '..',
    '   ',
  ])
    assert.equal(safeFileName(name), false);
  for (const name of ['Résumé 2026.pdf', 'photo (1).png', "student's notes.txt"])
    assert.equal(safeFileName(name), true);
});
