import { json } from '@/lib/server';
export function GET() {
  const ready = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SECRET_KEY &&
    process.env.RATE_LIMIT_SECRET &&
    process.env.RATE_LIMIT_SECRET.length >= 32 &&
    process.env.APP_ORIGIN,
  );
  return json({ status: ready ? 'configured' : 'unavailable', cloudConfigured: ready });
}
