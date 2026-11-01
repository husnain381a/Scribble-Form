// Check actual Git index content, including new files staged for an initial commit.
import { execFileSync } from 'node:child_process';
import { assertSafeContent, privateValues } from './secret-guard.mjs';
const root = new URL('../', import.meta.url);
const secrets = await privateValues(root);
const files = execFileSync('git', ['ls-files', '--cached', '-z'], { cwd: root })
  .toString('utf8')
  .split('\0')
  .filter(Boolean);
if (!files.length) throw new Error('No tracked files found. Stage the proposed commit first.');
for (const name of files) {
  if (
    (/(^|\/)\.env(?:\.|$)/.test(name) && name !== '.env.example') ||
    /(^|\/)(node_modules|\.next|\.vercel|\.temp)(\/|$)/.test(name) ||
    /\.(pem|p12|pfx|key)$/i.test(name) ||
    name === 'public/source.zip'
  )
    throw new Error(`Private or generated file is staged: ${name}`);
  const bytes = execFileSync('git', ['show', `:${name}`], {
    cwd: root,
    maxBuffer: 20 * 1024 * 1024,
  });
  assertSafeContent(bytes, name, secrets);
  const text = bytes.toString('utf8');
  if (
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text) ||
    /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/.test(text)
  )
    throw new Error(`Recognizable private credential is staged: ${name}`);
}
console.log(
  `PASS: ${files.length} staged/tracked files checked; no recognized private credentials or runtime files.`,
);
