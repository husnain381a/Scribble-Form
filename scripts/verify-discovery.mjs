// Production HTTP checks use only editorial pages and synthetic private-route IDs.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const origin = process.env.SEO_TEST_ORIGIN || 'http://localhost:3000';
const canonical = new URL(process.env.SEO_EXPECTED_SITE_URL || 'https://scribble-forms.vercel.app')
  .origin;
const repository = 'https://github.com/husnain381a/Scribble-Forms';
const paths = ['/', '/templates', '/faq', '/open-source', '/setup', '/privacy'];
const pages = [];
const titles = new Set();
for (const path of paths) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert.ok(title && !titles.has(title), `${path}: unique title`);
  titles.add(title);
  assert.match(html, /<meta name="description" content="[^"]{60,}"/);
  const canonicalTag = html.match(/<link rel="canonical" href="([^"]+)"/s)?.[1];
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/s)?.[1];
  assert.ok(canonicalTag && ogUrl, `${path}: URL tags exist`);
  assert.equal(new URL(canonicalTag).href, new URL(path, canonical).href, `${path}: canonical URL`);
  assert.equal(new URL(ogUrl).href, new URL(path, canonical).href, `${path}: OG URL`);
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
  assert.ok(html.includes(`property="og:image" content="${canonical}/og.png"`));
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${path}: exactly one H1`);
  assert.ok(!html.includes('content="noindex'), `${path}: indexable`);
  assert.ok(!html.includes('href="/source.zip"'), `${path}: no ZIP link`);
  assert.ok(html.includes(`href="${repository}"`), `${path}: GitHub link in server HTML`);
  const blocks = [
    ...html.matchAll(/<script\b(?=[^>]*\btype="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g),
  ].map((match) => JSON.parse(match[1]));
  assert.ok(blocks.length, `${path}: parseable JSON-LD`);
  if (path === '/faq') {
    const faq = blocks.find((block) => block['@type'] === 'FAQPage');
    assert.equal(faq.mainEntity.length, 10);
    for (const entry of faq.mainEntity) {
      assert.ok(html.includes(entry.name), 'FAQ question is visible in server HTML');
      assert.ok(
        html.includes(entry.acceptedAnswer.text.replaceAll('&', '&amp;').replaceAll("'", '&#x27;')),
        'FAQ answer is visible in server HTML',
      );
    }
  }
  pages.push({
    path,
    status: response.status,
    title,
    canonical: canonical + path,
    jsonLdBlocks: blocks.length,
    words: html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length,
  });
}
const sitemap = await (await fetch(origin + '/sitemap.xml')).text();
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(new Set(locations), new Set(paths.map((path) => canonical + path)));
const robots = await (await fetch(origin + '/robots.txt')).text();
assert.ok(robots.includes('Allow: /') && robots.includes(`Sitemap: ${canonical}/sitemap.xml`));
assert.ok(robots.includes('Disallow: /f/') && robots.includes('Disallow: /api/'));
for (const path of [
  '/login',
  '/workspace',
  '/builder/new',
  '/responses/00000000-0000-4000-8000-000000000000',
  '/f/00000000-0000-4000-8000-000000000000',
]) {
  const response = await fetch(origin + path);
  const html = await response.text();
  assert.ok(response.headers.get('x-robots-tag')?.includes('noindex'), `${path}: noindex header`);
  assert.ok(/<meta name="robots" content="[^"]*noindex/.test(html), `${path}: noindex meta`);
  assert.ok(!html.includes('rel="canonical"'), `${path}: no inherited home canonical`);
}
const llms = await fetch(origin + '/llms.txt');
assert.ok(llms.headers.get('content-type')?.includes('text/plain'));
assert.ok((await llms.text()).includes(repository));
const image = await fetch(origin + '/og.png');
assert.equal(image.status, 200);
assert.ok(image.headers.get('content-type')?.includes('image/png'));
const png = Buffer.from(await image.arrayBuffer());
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 630);
const legacySource = await fetch(origin + '/source.zip', { redirect: 'manual' });
assert.equal(legacySource.status, 308);
assert.equal(legacySource.headers.get('location'), repository);
const report = {
  mode: 'local production build; not a live ranking or indexing audit',
  canonicalOrigin: canonical,
  pages,
  sitemapUrls: locations,
  privateRoutesChecked: 5,
  ogDimensions: [1200, 630],
  githubRedirect: true,
};
if (process.env.SEO_EVIDENCE_PATH)
  await writeFile(process.env.SEO_EVIDENCE_PATH, JSON.stringify(report, null, 2) + '\n');
console.log(
  `PASS: ${pages.length} public pages, metadata/canonicals, visible JSON-LD answers, 5 private exclusions, sitemap, robots, llms.txt, social image, and GitHub source redirect.`,
);
