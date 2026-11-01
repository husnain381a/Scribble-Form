// Per-response script nonces authorize Next's runtime without authorizing arbitrary
// inline JavaScript. Inline CSS stays allowed for the form theme/style controls.
export function contentSecurityPolicy(
  nonce: string,
  options: { development: boolean; https: boolean; supabaseOrigin?: string },
) {
  const connectSources = ["'self'"];
  if (options.supabaseOrigin) {
    const source = new URL(options.supabaseOrigin);
    connectSources.push(
      source.origin,
      `${source.protocol === 'https:' ? 'wss:' : 'ws:'}//${source.host}`,
    );
  }
  if (options.development) connectSources.push('ws://localhost:*', 'ws://127.0.0.1:*');
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${options.development ? " 'unsafe-eval'" : ''}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${connectSources.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(options.https ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}
