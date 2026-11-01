# Contributing to Scribble

Thanks for helping make forms feel a little more human. Code, documentation, templates, accessibility improvements, and reproducible bug reports are all welcome.

## Start here

Check the [open issues](https://github.com/husnain381a/Scribble-Forms/issues). If you want to fix something small, explain the change in your pull request. For a new feature or a substantial refactor, open an issue first so we can discuss the scope. Do not assume an unlabelled idea has been accepted or assigned.

Follow our [code of conduct](CODE_OF_CONDUCT.md). Keep review discussions kind, specific, and about the work.

## Local setup

1. Fork the repository and clone your fork.
2. Use Node.js 22 or later (`.nvmrc` selects Node 22).
3. Run `npm ci`, then `npm run dev`.
4. Create a focused branch: `git switch -c fix/short-description`.

The browser-local sandbox needs no credentials. Cloud features require a Supabase project you own; see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Never use someone else's instance or real respondent data to test a contribution.

## Make a focused change

- Preserve the paper, ink, and handwritten design language. Prefer existing tokens and components.
- Include visible field labels, keyboard paths, useful errors, and responsive layouts. Respect reduced-motion preferences.
- Keep form rules in shared validation where possible. The server must validate public requests independently of the browser.
- Never expose server keys, broaden owner policies, or add raw HTML rendering for user-supplied text.
- Discuss new dependencies and broad architectural changes before adding them. Commit `package-lock.json` when dependencies change.
- If you are using an AI coding tool, review its output and verify it yourself. You are responsible for what you submit.

## Verify your work

```sh
npm run format
npm run format:check
npm test
npm run typecheck
npm run build
```

Add or update a meaningful regression test when behavior changes. For visual changes, check narrow and wide viewports and attach screenshots using invented data. Docs-only changes need accurate examples and working links; explain checks you did not run.

With files staged, `npm run check:repo` scans the proposed commit for private environment files and recognizable credentials. CI also runs this check. It supplements careful review; it cannot detect every kind of sensitive data.

Use `npm run test:security` against a configured production build when changing security headers or browser assets. Run cloud tests only against your own development project; `test:cloud:managed` creates and removes disposable users, forms, and files. These tests are not run against a shared database in pull-request CI.

## Database changes

Create a new migration with `npx supabase migration new descriptive_name`. Do not rewrite migrations already applied to a deployed instance. Explain upgrade implications and any required environment changes.

Keep RLS enabled on exposed tables, preserve owner checks and restrictive Storage policies, and give functions the narrowest permissions they need. Extend the PGlite tests to exercise authorized and unauthorized paths. Verify the change on a development Supabase project before requesting review.

## Open a pull request

Describe the problem, the resulting behavior, and how you verified it. Link the relevant issue, include screenshots for visible changes, and call out migrations or deployment steps. Keep unrelated formatting or refactors out of the same pull request.

Maintainers may request changes or decline a proposal that does not fit the project. We do not promise review timelines. No separate contributor license agreement is required; contributions to this project are provided under its existing AGPL-3.0-only license, and you must have the right to contribute them.

## Bugs and security

Use the bug template for ordinary bugs and remove personal data from logs and screenshots. For vulnerabilities, follow [SECURITY.md](SECURITY.md). Do not post credentials, exploit details involving a live instance, or real form responses in a public issue.
