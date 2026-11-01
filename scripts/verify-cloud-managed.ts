// Disposable cloud verification: no emails, no persistent test credentials.
import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('Configure the local Supabase environment first.');
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const created: string[] = [];
const accounts: { email: string; password: string }[] = [];
try {
  for (let index = 0; index < 2; index++) {
    const email = `scribble-test-${randomUUID()}@example.invalid`;
    const password = randomBytes(32).toString('base64url');
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user)
      throw new Error(`Could not create disposable test account: ${error?.message}`);
    created.push(data.user.id);
    accounts.push({ email, password });
  }
  console.log('Created two disposable verification accounts. No email was sent.');
  const code = await new Promise<number>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url)),
        'scripts/verify-cloud.ts',
      ],
      {
        cwd: fileURLToPath(new URL('../', import.meta.url)),
        env: {
          ...process.env,
          TEST_USER_A_EMAIL: accounts[0].email,
          TEST_USER_A_PASSWORD: accounts[0].password,
          TEST_USER_B_EMAIL: accounts[1].email,
          TEST_USER_B_PASSWORD: accounts[1].password,
        },
        stdio: 'inherit',
        windowsHide: true,
      },
    );
    child.once('error', reject);
    child.once('exit', (exitCode) => resolve(exitCode ?? 1));
  });
  if (code !== 0) throw new Error('Cloud verification did not pass. See the assertion above.');
} finally {
  for (const id of created) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`Disposable account cleanup failed for ${id}.`);
  }
  console.log(`Cleaned up ${created.length} disposable verification accounts.`);
}
