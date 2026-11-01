import { NextResponse, type NextRequest } from 'next/server';
import { contentSecurityPolicy } from '@/lib/security';
import { isPrivatePath } from '@/lib/site';
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = contentSecurityPolicy(nonce, {
    development: process.env.NODE_ENV === 'development',
    https: process.env.APP_ORIGIN?.startsWith('https://') === true,
    supabaseOrigin: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cache-Control', 'private, no-store');
  if (isPrivatePath(request.nextUrl.pathname) || process.env.VERCEL_ENV === 'preview')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
}
export const config = {
  matcher: [
    '/((?!api(?:/|$)|_next/static|_next/image|icon\\.svg$|source\\.zip$|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$|llms\\.txt$|og\\.png$|logo\\.png$|apple-touch-icon\\.png$).*)',
  ],
};
