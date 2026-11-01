# Search and public discovery

Scribble's default public origin is `https://scribble-form.vercel.app`. Set `NEXT_PUBLIC_SITE_URL` at build time for your own domain. Keep `APP_ORIGIN` consistent with the actual request origin for deployed API validation; local development can keep `APP_ORIGIN=http://localhost:3000` while testing production canonical tags.

## Included

- Brand-first titles (`Scribble Form | Page topic`), descriptions, relevant meta keywords, self-canonical URLs, Open Graph, and large Twitter cards for the six public information pages. Social titles match the page titles; account pages use the same title prefix.
- A 1200 × 630 PNG social image, an SVG favicon, and PNG logo/touch icons.
- Server-rendered marketing content, a linked FAQ with ten full answers, a public GitHub source link, and maintainer/contribution links.
- JSON-LD for the project, website, web application, source code, breadcrumbs, and visible FAQ answers. Static project data is serialized safely and uses the response's CSP nonce. No user form content or invented review/rating data is included.
- `/sitemap.xml` containing only `/`, `/templates`, `/faq`, `/open-source`, `/setup`, and `/privacy`. Modification dates are deliberately omitted rather than fabricated on every request.
- `/robots.txt` with a sitemap pointer and exclusions for account, editor, API, response, and respondent-form paths. This applies to crawlers respecting the wildcard rule, including AI search crawlers.
- Noindex meta tags and HTTP headers for login, workspace, builder, response, and `/f/` pages. Vercel preview deployments also receive noindex directives and a disallow-all robots file.
- An optional `/llms.txt` public fact index. This is an experimental convenience, not a search-engine requirement or ranking signal guarantee.
- A permanent redirect from the old `/source.zip` URL to the GitHub repository. The site no longer generates or serves a source ZIP.

Robots and noindex directives are discovery preferences, not privacy controls. Database authorization, owner checks, and private storage protect data. Blocking a URL in robots.txt may also prevent a crawler from seeing its noindex tag; use search-engine removal tools if an unwanted URL has already been indexed.

## Verify a local production build

```sh
npm test
npm run typecheck
npm run build
npm start
```

In another terminal:

```sh
npm run test:discovery
npm run test:security
```

Discovery checks default to `http://localhost:3000` and expect the default production canonical origin. Override `SEO_TEST_ORIGIN` for a different running instance and `SEO_EXPECTED_SITE_URL` for a fork's canonical domain. You can set `SEO_EVIDENCE_PATH` to save a JSON check summary. These tests use public editorial pages and synthetic route identifiers; they do not crawl customer records.

The security command expects `.env.local` for its private-value exclusion check. Repository CI runs without cloud keys and validates staged/tracked files with `npm run check:repo`.

## After deployment

1. Confirm all public information URLs return HTTP 200 over HTTPS. Check `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/og.png` on the final domain. Confirm Vercel has no deployment protection or `X-Robots-Tag: noindex` on the production marketing pages.
2. Add the HTTPS URL-prefix property to [Google Search Console](https://search.google.com/search-console). Put its verification value in `GOOGLE_SITE_VERIFICATION`, redeploy, and complete verification. Add `BING_SITE_VERIFICATION` for [Bing Webmaster Tools](https://www.bing.com/webmasters/) if used. Do not invent verification values.
3. Submit `https://scribble-form.vercel.app/sitemap.xml` for this instance. For a fork, submit its own sitemap. Inspect `/` and `/faq` through the verified search console and request indexing when appropriate.
4. Validate JSON-LD with [Schema.org's validator](https://validator.schema.org/) and check applicable Google features with the [Rich Results Test](https://search.google.com/test/rich-results). Correct syntax is not a promise that a particular search feature will be shown.
5. Inspect the deployed mobile experience and [PageSpeed Insights](https://pagespeed.web.dev/). Track real Core Web Vitals when enough field data exists; local HTML checks do not measure these.
6. Monitor search impressions/clicks and indexing over time. Keep feature, privacy, and hosting statements accurate as the application changes. Add real author experience, examples, and references as they become available; do not invent adoption figures or testimonials.

## SEO GEO and AEO boundaries

SEO improves technical discovery and clear on-page content. GEO here means helping AI search systems understand and cite accurate public project information. AEO here means directly answering real questions using readable headings, steps, and concise answers.

[Google's current AI search guidance](https://developers.google.com/search/docs/appearance/ai-features) says normal SEO practices remain relevant and no special AI text file or schema is required. Neither indexing, AI citations, FAQ displays, nor rankings are guaranteed. This project does not add fake reviews, keyword stuffing, hidden bot-only content, unsupported `Speakable` claims, or fabricated freshness dates.

The implementation review used [Alex Labat's SEO/GEO/AEO skill](https://github.com/SNLabat/SEO-GEO-AEO-Skill/blob/main/SKILL.md) together with the installed Next.js documentation and current primary search documentation. Deployment access, Search Console ownership, measured performance, backlinks, and observed AI citations require separate post-launch verification.
