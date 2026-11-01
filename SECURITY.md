# Security model

The application's `public` database schema is a namespace, not a statement that the data is public. All Scribble tables use row-level security. Anonymous clients have no direct Scribble-table privileges. Creators can access only rows belonging to their account. Private upload tickets and rate counters also have explicit restrictive deny policies for clients.

Published questions are intentionally available through an unlisted form link. Responses, drafts, owner identifiers, upload tickets, and file paths are not returned by that endpoint. Closed forms return only a closed status. Uploaded files live in a private bucket; non-overwriting signed upload tickets bind them to a form, version, question, and response attempt. Downloads require a currently owned, existing response and expire after 60 seconds.

The server secret bypasses RLS and is a trusted administrator credential. It must never be put in `NEXT_PUBLIC_*`, client code, screenshots, source archives, or a public repository. Browser clients use the publishable key and user session. Hosting/database administrators can access stored records; this is not end-to-end encryption.

## Application protections

- Owner routes validate the bearer token with Supabase Auth and read through the user's RLS context.
- Database functions run with invoker privileges and a fixed search path. Public roles cannot execute privileged submission or rate-limit functions.
- Request JSON has a size limit; field values, published versions, file metadata, origin, and form availability are checked on the server.
- Rate counters are durable and atomic. Custom reverse-proxy deployments must configure a trusted client-address source; local development intentionally uses a shared bucket.
- HTML pages use a fresh script nonce and strict Content Security Policy. Production does not allow arbitrary inline scripts or eval. Inline CSS remains allowed for the theme controls. Nonces require dynamic HTML rendering and private/no-store page responses.
- CSV exports escape quotation marks and neutralize spreadsheet formula prefixes, including control-character and full-width variants.
- The Git index scanner rejects private environment files and recognizable credentials, including private environment values, privileged/user JWTs, and secret API keys. Website source links point to the public GitHub repository.

## Verify

Run `npm test`, `npm run typecheck`, and `npm run build`. With the production app running, `npm run test:security` checks browser credential exclusion, the GitHub source redirect, private-file 404s, response headers, unique nonces, and nonce attributes on framework scripts. `npm run test:cloud:managed` verifies real ownership and upload boundaries using disposable accounts, then cleans up those accounts and files.

## Operator responsibilities and limits

Use HTTPS in production, keep email confirmation enabled, choose strong account passwords, configure the provider's Auth rate limits and password requirements, and rotate any exposed server credential. Supabase's leaked-password screening is a Pro-plan feature; this app does not purchase or silently enable paid services.

Rate limiting is not a complete anti-bot or DDoS solution. File types and sizes are checked but contents are not virus-scanned. Operators must configure backups, retention, upload cleanup, email delivery, and a private security-reporting contact before a public launch. Form creation and owner tools require sign-in. The repository has no unauthenticated persistence fallback; direct database and owner API access remain protected independently of the client gate.

## Reporting a vulnerability

For issues in this source project, use GitHub's **Report a vulnerability** option on the [repository security page](https://github.com/husnain381a/Scribble-Forms/security) if private reporting is enabled. Otherwise, use a private contact channel listed on the maintainer's GitHub profile. If no private channel is available, open an issue asking for a private security contact without including the vulnerability details.

For issues specific to a deployed instance, contact that instance's operator privately. Do not include credentials, exploit details involving a live instance, or real respondent data in a public issue. Provide the affected commit/version, a minimal reproduction using invented data, and the expected security boundary. Allow time for investigation before public disclosure; no response deadline or security-support SLA is promised.

This is an early project without separate long-term-support release lines. Security changes target the current main branch; operators are responsible for reviewing and applying updates.
