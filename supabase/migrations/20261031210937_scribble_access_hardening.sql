-- Deny client access even if a future permissive policy or GRANT is added.
alter table public.scribble_forms enable row level security;
alter table public.scribble_versions enable row level security;
alter table public.scribble_submissions enable row level security;
alter table public.scribble_uploads enable row level security;
alter table public.scribble_rate_limits enable row level security;

revoke all on public.scribble_uploads,public.scribble_rate_limits from anon,authenticated;
create policy scribble_upload_tickets_deny_clients
  on public.scribble_uploads as restrictive for all to anon,authenticated
  using (false) with check (false);
create policy scribble_rate_limits_deny_clients
  on public.scribble_rate_limits as restrictive for all to anon,authenticated
  using (false) with check (false);

-- Prevent future broad storage policies from exposing the private app bucket.
create policy scribble_private_bucket_deny_clients
  on storage.objects as restrictive for all to anon,authenticated
  using (bucket_id <> 'scribble-uploads')
  with check (bucket_id <> 'scribble-uploads');
update storage.buckets set public=false where id='scribble-uploads';

-- Form ownership and creation metadata cannot be rewritten through the client.
revoke update on public.scribble_forms from authenticated;
grant update(draft,status,published_version_id,updated_at)
  on public.scribble_forms to authenticated;
