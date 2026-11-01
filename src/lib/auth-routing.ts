const uuid = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
const accountRoute = new RegExp(`^/(?:workspace|builder/(?:new|${uuid})|responses/${uuid})$`);

export function accountDestination(value: string | null | undefined): string {
  if (
    !value ||
    value.length > 2048 ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  )
    return '/workspace';
  try {
    const url = new URL(value, 'https://scribble.invalid');
    if (url.origin !== 'https://scribble.invalid' || !accountRoute.test(url.pathname))
      return '/workspace';
    return url.pathname + url.search;
  } catch {
    return '/workspace';
  }
}

export function signInLocation(destination: string) {
  return `/login?next=${encodeURIComponent(accountDestination(destination))}`;
}

export function authErrorMessage(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (code === 'invalid_credentials')
    return 'The email or password did not match. Please try again.';
  if (code === 'email_not_confirmed')
    return 'Confirm your email address before signing in. Check your inbox for the confirmation link.';
  if (code === 'weak_password') return 'Choose a stronger password with at least 10 characters.';
  if (code === 'email_address_invalid') return 'Check your email address and try again.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit')
    return 'A few too many attempts. Please wait a little and try again.';
  return 'We could not complete that request. Please try again shortly.';
}
