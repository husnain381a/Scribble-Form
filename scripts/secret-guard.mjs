import { readFile } from 'node:fs/promises';
export function assertSafeContent(content, name, secrets = []) {
  const text = typeof content === 'string' ? content : Buffer.from(content).toString('utf8');
  if (secrets.some((value) => value.length >= 16 && text.includes(value)))
    throw new Error(`Private credential detected in ${name}; packaging stopped.`);
  if (/sb_secret_[A-Za-z0-9_-]{20,}/.test(text))
    throw new Error(`Secret API key detected in ${name}; packaging stopped.`);
  for (const token of text.match(/[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) ||
    []) {
    let claims;
    try {
      claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    } catch {
      continue;
    }
    if (claims.role === 'service_role' || (claims.sub && claims.exp))
      throw new Error(`Privileged or user JWT detected in ${name}; packaging stopped.`);
  }
}
export async function privateValues(root) {
  const values = [];
  const add = (name, value) => {
    if (
      !name.startsWith('NEXT_PUBLIC_') &&
      /(SECRET|PASSWORD|ACCESS_TOKEN|SERVICE_ROLE)/.test(name) &&
      value
    )
      values.push(value);
  };
  for (const [name, value] of Object.entries(process.env)) add(name, value);
  let env = '';
  try {
    env = await readFile(new URL('.env.local', root), 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) add(match[1], match[2].trim().replace(/^['"]|['"]$/g, ''));
  }
  return values;
}
