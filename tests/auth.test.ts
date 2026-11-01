import test from 'node:test';
import assert from 'node:assert/strict';
import { accountDestination, authErrorMessage, signInLocation } from '../src/lib/auth-routing';
import { repository } from '../src/lib/repository';
import { blankForm } from '../src/lib/forms';

test('sign-in returns to an allowed account route and preserves the chosen template', () => {
  const destination = '/builder/new?template=feedback';
  assert.equal(accountDestination(destination), destination);
  assert.equal(
    new URL(signInLocation(destination), 'https://scribble.invalid').searchParams.get('next'),
    destination,
  );
  assert.equal(
    accountDestination('/responses/00000000-0000-4000-8000-000000000000'),
    '/responses/00000000-0000-4000-8000-000000000000',
  );
});

test('sign-in destinations reject external, executable, encoded, and non-account targets', () => {
  for (const value of [
    'https://evil.invalid',
    '//evil.invalid',
    '/\\evil.invalid',
    'javascript:alert(1)',
    '/%2f%2fevil.invalid',
    '/login?next=https://evil.invalid',
    '/workspace\n',
    '/api/files/x',
    '/builder/../../login',
    '/f/00000000-0000-4000-8000-000000000000',
  ])
    assert.equal(accountDestination(value), '/workspace', value);
});

test('signed-out repository calls fail instead of creating browser-only forms', async () => {
  await assert.rejects(repository().create(blankForm()), /sign[- ]in/i);
  await assert.rejects(repository().list(), /sign[- ]in/i);
});

test('authentication errors do not echo provider or backend details', () => {
  assert.equal(
    authErrorMessage({ message: 'Supabase internals: secret diagnostic' }).includes('Supabase'),
    false,
  );
  assert.match(authErrorMessage({ code: 'invalid_credentials' }), /email or password/i);
});
