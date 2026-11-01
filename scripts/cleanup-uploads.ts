// Run daily using a private scheduler with server environment values.
// Deletes expired, unsubmitted upload tickets and their storage objects only.
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const cutoff = new Date(Date.now() - 3 * 3600000).toISOString();
let removed = 0;
while (true) {
  const { data, error } = await db
    .from('scribble_uploads')
    .select('token,path')
    .is('used_at', null)
    .lt('created_at', cutoff)
    .limit(100);
  if (error) throw new Error('Could not read expired upload tickets.');
  if (!data?.length) break;
  const { error: storageError } = await db.storage
    .from('scribble-uploads')
    .remove(data.map((f) => f.path));
  if (storageError) throw new Error('Storage cleanup failed. Tickets were retained for a retry.');
  const { error: deleteError } = await db
    .from('scribble_uploads')
    .delete()
    .in(
      'token',
      data.map((f) => f.token),
    )
    .is('used_at', null);
  if (deleteError) throw new Error('Ticket cleanup failed. Retry to finish.');
  removed += data.length;
}
console.log(`Removed ${removed} expired upload tickets.`);
