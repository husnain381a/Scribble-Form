# Deploy Scribble on Vercel + Supabase

The app works without credentials in a **local sandbox**. Sandbox links and data stay in that browser; they are not public forms. Cloud mode starts after a user signs into your configured Supabase project. Local drafts are not automatically copied into cloud accounts.

## 1. Database and private storage

Create a Supabase project you control. The initial migration is namespaced with `scribble_` and does not modify other application tables.

Option A: run every SQL file in `supabase/migrations/` through the Supabase SQL editor in filename order, once per project.

Option B: install the Supabase CLI and run from this directory:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Do not run the same migration by both methods. It creates forms, immutable versions, submissions, upload tickets, rate limits, row-level policies, transactional functions, and a private `scribble-uploads` bucket. Anonymous roles get no table or bucket access. Public traffic goes through Next.js endpoints.

For a local Supabase stack, install Docker, run `npx supabase start` and `npx supabase db reset`, and use the local project's values in your environment. The normal sandbox requires neither Docker nor Supabase.

## 2. Environment

Copy `.env.example` to `.env.local` and fill:

| Variable                               | Where it comes from                                                       | Browser safe?        |
| -------------------------------------- | ------------------------------------------------------------------------- | -------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project URL                                                               | Yes                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | API Keys → Publishable key                                                | Yes                  |
| `SUPABASE_SECRET_KEY`                  | API Keys → Secret key; legacy service-role key also works                 | **No**               |
| `RATE_LIMIT_SECRET`                    | Random string of at least 32 characters                                   | **No**               |
| `APP_ORIGIN`                           | Exact site origin, e.g. `https://scribble.example.com`, no trailing slash | Public configuration |

Generate the rate secret:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never add a server secret to a `NEXT_PUBLIC_` variable, a source file, or a Git commit. The server-only Supabase client is created per request and never inherits a browser session.

For a local run on port 3005, set `APP_ORIGIN=http://127.0.0.1:3005` and use that exact origin consistently. Different ports and `localhost` vs `127.0.0.1` have separate sandbox storage and sessions.

## 3. Supabase Auth

- Enable email/password login. Keep email confirmation enabled for a public service.
- Set the site URL to your production origin.
- Add `https://YOUR_HOST/workspace` and `https://YOUR_HOST/login?recovery=1` to allowed redirect URLs. Add equivalent localhost URLs for development.
- Configure a transactional SMTP service before opening registration to the public. Supabase's default email service has delivery restrictions and rate limits.
- Set password rules, signup rate limits, and any provider-side abuse protections for your audience.
- Create and confirm your own account through the app. The app includes signup, sign-in, email confirmation, password recovery, password reset, and sign-out.

## 4. Local check

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

Open the printed URL. Sign in, create a form, and publish. Open its `/f/UUID` link in a separate private window. Submit answers and a file. Only the owner should see responses and receive signed file downloads. The local PostgreSQL tests validate SQL and RLS in PGlite; they do not replace verifying Supabase Auth, PostgREST, and Storage on your project.

## 5. Vercel

1. Push this project directory to a Git repository, including the lockfile, source, license, and migrations. Keep `.env.local` untracked.
2. Import that repository in Vercel. Select **Next.js**, install with `npm ci`, and build with `npm run build`. If this directory lives in a larger repository, set it as the root directory.
3. Add all five environment values for production. Set `APP_ORIGIN` to the production domain. An exact stable domain avoids mixing preview and production data.
4. Deploy. Add the domain to Supabase Auth redirects. Redeploy after changing browser environment values.
5. Check `/api/health`; it should report `configured`. This checks required environment presence, not database connectivity or migration status.

Public form submission and upload endpoints require the configured origin in production when a browser sends an Origin header. CORS is not enabled for arbitrary third-party websites. The application does not support iframe embedding by default. Public form pages carry `noindex`; a share link is an unlisted URL, not a password-protected form.

The file upload goes directly to Supabase using a signed, non-overwriting URL. It avoids Vercel's request-body limit. Files are limited to 5 MB and JPG, PNG, WebP, PDF, or plain text. Respondents get no read/list permission. Owner downloads are signed for 60 seconds and forced as attachments. File contents are not virus-scanned; do not automatically execute downloaded attachments.

## 6. Full cloud verification

Create **two disposable, confirmed test accounts** through your instance or Supabase dashboard. Add these values to `.env.local` temporarily (never commit them):

```dotenv
TEST_USER_A_EMAIL=...
TEST_USER_A_PASSWORD=...
TEST_USER_B_EMAIL=...
TEST_USER_B_PASSWORD=...
```

Run `npm run test:cloud` against a running configured instance. The script signs into the supplied accounts, creates one labelled disposable form, tests cross-owner and anonymous access, publication, validation, signed upload, owner-only download, retry idempotency, version changes and closure, then deletes its test form and attached file. It does not create accounts or send email. Remove the test credential values afterwards.

For an owned development project, `npm run test:cloud:managed` can create and clean up the two disposable test accounts automatically using the server-only key. No email is sent, and generated test credentials stay in process memory.

Confirm signup and password-reset email delivery with your own email address before opening registration to others; the automated test deliberately sends no email. Keep email confirmation enabled. A passing test on another instance does not verify your project's configuration.

## 7. Maintenance

Run `npm run test:security` against the production build after security-related changes. It verifies that private values are excluded from browser assets and source downloads, private files are not served, and each HTML response has a valid fresh script nonce. Nonce-based CSP requires dynamic rendering, so these pages must not be served from an HTML cache that reuses a nonce between visitors.

Run the upload cleanup script daily with the server environment:

```sh
npx tsx --env-file=.env.local scripts/cleanup-uploads.ts
```

Schedule it on private infrastructure with secret handling. It removes only pending tickets older than three hours and their files. Upload tickets expire at two hours. It never deletes submitted files. The limiter deletes hashed counters after one day during normal traffic. On Vercel, the limiter hashes the platform-forwarded network address; on local/self-hosted instances it uses one shared development bucket. For a custom reverse proxy, adapt the trusted address extraction in `src/lib/server.ts` before opening a large public service.

App deletion routes clean attached objects before deleting records. Deleting rows or auth users directly in the Supabase dashboard bypasses application cleanup, so use the cleanup workflow for attached objects too. Configure backups, retention, quota monitoring, and an operator privacy contact. No provider costs, backups, geographic residency, availability guarantees, or legal compliance are implied by this source package. Software features are free; infrastructure quotas and bills belong to the host.

Run Supabase's security and performance advisors after migration. Keep dependencies patched. Add stronger anti-abuse controls for a large public deployment if necessary; the included limiter is per hashed network address, so shared networks share limits.
