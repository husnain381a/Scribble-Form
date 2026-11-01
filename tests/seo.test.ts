import test from 'node:test';
import assert from 'node:assert/strict';
import { faqs } from '../src/lib/site-content';
import { absoluteUrl, isPrivatePath, publicPages, serializeJsonLd } from '../src/lib/site';
import { faqSchema, homeSchema, pageMetadata, privateMetadata } from '../src/lib/seo';

test('only editorial pages receive indexable canonicals and appear in the public catalogue', () => {
  const paths = new Set(publicPages.map(({ path }) => path));
  assert.equal(paths.size, publicPages.length);
  for (const page of publicPages) {
    assert.equal(isPrivatePath(page.path), false);
    assert.equal(pageMetadata(page.path).alternates?.canonical, absoluteUrl(page.path));
  }
  for (const path of [
    '/f/abc',
    '/builder/new',
    '/workspace',
    '/responses/abc',
    '/login',
    '/api/files/x',
  ])
    assert.equal(isPrivatePath(path), true, path);
  assert.equal(isPrivatePath('/faq'), false);
  assert.equal(isPrivatePath('/formats'), false);
  assert.equal(privateMetadata('Private').alternates?.canonical, null);
});

test('FAQ structured answers use the same complete content as the visible FAQ page', () => {
  assert.equal(new Set(faqs.map(({ id }) => id)).size, faqs.length);
  assert.deepEqual(
    faqSchema.mainEntity.map((entry) => entry.name),
    faqs.map(({ question }) => question),
  );
  assert.deepEqual(
    faqSchema.mainEntity.map((entry) => entry.acceptedAnswer.text),
    faqs.map(({ answer }) => answer),
  );
  assert.equal(
    homeSchema['@graph'].some((entry) => 'aggregateRating' in entry || 'review' in entry),
    false,
  );
});

test('structured data serialization cannot terminate its script element', () => {
  const unsafe = { answer: '</script><script>alert(1)</script>\u2028\u2029' };
  const safe = serializeJsonLd(unsafe);
  assert.equal(safe.includes('<'), false);
  assert.deepEqual(JSON.parse(safe), unsafe);
});
