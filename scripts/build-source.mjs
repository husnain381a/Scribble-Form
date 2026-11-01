// An explicit allowlist prevents credentials, node_modules, and runtime data
// from entering the corresponding-source download served by the website.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { zipSync } from 'fflate';
import { assertSafeContent, privateValues } from './secret-guard.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const rootFiles = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.ts',
  'next-env.d.ts',
  '.env.example',
  '.gitignore',
  '.prettierrc.json',
  '.prettierignore',
  'README.md',
  'LICENSE',
  'NOTICE.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  '.nvmrc',
  '.gitattributes',
  'AGENTS.md',
];
const directories = ['src', 'scripts', 'tests', 'docs', 'supabase', 'public', '.github'];
const entries = {};
const secrets = await privateValues(new URL('../', import.meta.url));
async function add(relative) {
  const bytes = new Uint8Array(await readFile(path.join(root, relative)));
  assertSafeContent(bytes, relative, secrets);
  entries[`scribble/${relative.replaceAll('\\', '/')}`] = bytes;
}
for (const file of rootFiles) await add(file);
async function walk(relative) {
  for (const item of await readdir(path.join(root, relative), { withFileTypes: true })) {
    if (item.name.startsWith('.')) continue;
    const next = path.join(relative, item.name);
    if (item.isDirectory()) {
      await walk(next);
      continue;
    }
    if (
      item.isFile() &&
      /\.(tsx?|mjs|css|md|sql|toml|svg|png|jpe?g|webp|json|ya?ml)$/.test(item.name)
    )
      await add(next);
  }
}
for (const directory of directories) await walk(directory);
const archive = zipSync(entries, { level: 9 });
await mkdir(path.join(root, 'public'), { recursive: true });
await writeFile(path.join(root, 'public', 'source.zip'), archive);
console.log(
  `Prepared open-source download: ${Object.keys(entries).length} files, ${Math.round(archive.length / 1024)} KB. No environment secrets or runtime data included.`,
);
