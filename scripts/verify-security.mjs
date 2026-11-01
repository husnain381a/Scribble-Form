import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { assertSafeContent, privateValues } from './secret-guard.mjs';
const secrets = await privateValues(new URL('../', import.meta.url));
let assets = 0;
async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) await walk(file);
    else {
      assertSafeContent(await readFile(file), file, secrets);
      assets++;
    }
  }
}
await walk(fileURLToPath(new URL('../.next/static/', import.meta.url)));
const origin = process.env.APP_ORIGIN || 'http://localhost:3000';
const source = await fetch(origin + '/source.zip', { redirect: 'manual' });
assert.equal(source.status, 308, 'legacy source download redirects');
assert.equal(source.headers.get('location'), 'https://github.com/husnain381a/Scribble-Forms');
for (const route of ['/.env.local', '/.env', '/supabase/config.toml']) {
  const response = await fetch(origin + route);
  assert.equal(response.status, 404, `${route} is not served`);
}
const pages = await Promise.all([fetch(origin + '/'), fetch(origin + '/')]);
const policies = pages.map((response) => response.headers.get('content-security-policy') || '');
assert.notEqual(policies[0], policies[1], 'fresh nonce on each response');
for (let i = 0; i < pages.length; i++) {
  const policy = policies[i];
  const script = policy
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith('script-src '));
  assert.ok(
    script?.includes('nonce-') && script.includes('strict-dynamic'),
    'nonce-based script policy',
  );
  assert.ok(
    !script.includes('unsafe-inline') && !script.includes('unsafe-eval'),
    'no unsafe script execution in production',
  );
  assert.equal(pages[i].headers.get('x-content-type-options'), 'nosniff');
  assert.equal(pages[i].headers.get('x-frame-options'), 'DENY');
  const html = await pages[i].text();
  const nonce = script.match(/'nonce-([^']+)'/)?.[1];
  const scripts = html.match(/<script\b[^>]*>/g) || [];
  assert.ok(scripts.length > 0, 'page includes framework scripts');
  assert.ok(
    scripts.every((tag) => tag.includes(`nonce="${nonce}"`)),
    'all rendered framework scripts carry the response nonce',
  );
}
console.log(
  `PASS: ${assets} browser assets exclude private credentials; private files return 404; source link redirects to GitHub; production headers and all script nonces verified.`,
);
