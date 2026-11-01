-- Scribble: owner-private drafts, immutable published versions, private responses.
-- Apply to a Supabase project. No existing application tables are changed.
begin;

create table public.scribble_forms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  draft jsonb not null check (jsonb_typeof(draft) = 'object' and octet_length(draft::text) <= 200000),
  status text not null default 'draft' check (status in ('draft','published','closed')),
  published_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'draft' or published_version_id is not null)
);
create index scribble_forms_owner on public.scribble_forms(owner_id, updated_at desc);

create or replace function public.scribble_valid_definition(d jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare f jsonb; opt jsonb; ids text[] := '{}'; opts text[]; ref text;
begin
  if jsonb_typeof(d) <> 'object' or octet_length(d::text) > 200000 then return false; end if;
  if jsonb_typeof(d->'title') <> 'string' or length(trim(d->>'title')) not between 1 and 160 then return false; end if;
  if jsonb_typeof(d->'description') <> 'string' or length(d->>'description') > 2000 then return false; end if;
  if coalesce(d->>'theme','') not in ('paper','studio','bloom','midnight','confetti','classic') then return false; end if;
  if coalesce(d->>'font','') not in ('friendly','clean','serif') or coalesce(d->>'layout','') not in ('page','conversation') then return false; end if;
  if coalesce(d->>'accent','') !~ '^#[0-9a-fA-F]{6}$' then return false; end if;
  if jsonb_typeof(d->'button') <> 'string' or length(trim(d->>'button')) not between 1 and 60 then return false; end if;
  if jsonb_typeof(d->'successTitle') <> 'string' or length(d->>'successTitle') not between 1 and 160 then return false; end if;
  if jsonb_typeof(d->'successMessage') <> 'string' or length(d->>'successMessage') > 2000 then return false; end if;
  if jsonb_typeof(d->'fields') <> 'array' or jsonb_array_length(d->'fields') not between 1 and 100 then return false; end if;
  for f in select value from jsonb_array_elements(d->'fields') loop
    if coalesce(f->>'id','') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' or (f->>'id') = any(ids) then return false; end if;
    if coalesce(f->>'type','') not in ('text','textarea','email','phone','number','url','date','choice','multi','dropdown','rating','scale','file','consent','heading') then return false; end if;
    if jsonb_typeof(f->'label') <> 'string' or length(trim(f->>'label')) not between 1 and 500 then return false; end if;
    if jsonb_typeof(f->'description') <> 'string' or length(f->>'description') > 2000 or jsonb_typeof(f->'required') <> 'boolean' then return false; end if;
    if jsonb_typeof(f->'options') <> 'array' or jsonb_array_length(f->'options') > 50 then return false; end if;
    opts := '{}';
    for opt in select value from jsonb_array_elements(f->'options') loop
      if jsonb_typeof(opt) <> 'string' or length(trim(opt#>>'{}')) not between 1 and 200 then return false; end if;
      if f->>'type' in ('choice','multi','dropdown') and (opt#>>'{}') = any(opts) then return false; end if;
      opts := array_append(opts, opt#>>'{}');
    end loop;
    if f->>'type' in ('choice','multi','dropdown') and cardinality(opts) < 2 then return false; end if;
    if jsonb_typeof(f->'max') <> 'number' or (f->>'max')::numeric <> trunc((f->>'max')::numeric) or (f->>'max')::int not between 2 and 10 then return false; end if;
    if f ? 'condition' then
      ref := f->'condition'->>'field';
      if jsonb_typeof(f->'condition') <> 'object' or ref is null or not (ref = any(ids)) or jsonb_typeof(f->'condition'->'equals') <> 'string' or length(f->'condition'->>'equals') > 500 then return false; end if;
    end if;
    ids := array_append(ids, f->>'id');
  end loop;
  if not exists(select 1 from jsonb_array_elements(d->'fields') x where x->>'type' <> 'heading') then return false; end if;
  -- Missing properties must not pass SQL's three-valued boolean logic.
  if not (d ?& array['title','description','theme','accent','font','layout','button','successTitle','successMessage','fields']) then return false; end if;
  if exists(select 1 from jsonb_array_elements(d->'fields') x where not (x ?& array['id','type','label','description','required','options','max'])) then return false; end if;
  return true;
exception when others then return false;
end; $$;
revoke all on function public.scribble_valid_definition(jsonb) from public, anon;
grant execute on function public.scribble_valid_definition(jsonb) to authenticated, service_role;

create table public.scribble_versions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.scribble_forms(id) on delete cascade,
  definition jsonb not null check (public.scribble_valid_definition(definition)),
  created_at timestamptz not null default now(),
  unique(form_id,id)
);
create index scribble_versions_form on public.scribble_versions(form_id);
alter table public.scribble_forms add constraint scribble_current_version
  foreign key (id,published_version_id) references public.scribble_versions(form_id,id) deferrable initially deferred;

create table public.scribble_submissions (
  id uuid primary key,
  form_id uuid not null references public.scribble_forms(id) on delete cascade,
  version_id uuid not null,
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 200000),
  created_at timestamptz not null default now(),
  foreign key (form_id,version_id) references public.scribble_versions(form_id,id)
);
create index scribble_submissions_form on public.scribble_submissions(form_id,created_at desc);
create index scribble_submissions_version on public.scribble_submissions(form_id,version_id);

create table public.scribble_uploads (
  token uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.scribble_forms(id) on delete cascade,
  version_id uuid not null,
  submission_id uuid not null,
  field_id uuid not null,
  path text not null unique,
  name text not null check (length(name) between 1 and 240),
  size bigint not null check (size between 1 and 5242880),
  mime text not null check (mime in ('image/jpeg','image/png','image/webp','application/pdf','text/plain')),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  foreign key (form_id,version_id) references public.scribble_versions(form_id,id)
);
create index scribble_uploads_attempt on public.scribble_uploads(form_id,submission_id);
create index scribble_uploads_expiry on public.scribble_uploads(created_at) where used_at is null;

create table public.scribble_rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key(key,window_start)
);
create index scribble_rate_limits_expiry on public.scribble_rate_limits(window_start);

alter table public.scribble_forms enable row level security;
alter table public.scribble_versions enable row level security;
alter table public.scribble_submissions enable row level security;
alter table public.scribble_uploads enable row level security;
alter table public.scribble_rate_limits enable row level security;

revoke all on public.scribble_forms, public.scribble_versions, public.scribble_submissions,
  public.scribble_uploads, public.scribble_rate_limits from anon, authenticated;
grant select,insert,update,delete on public.scribble_forms to authenticated;
grant select,insert on public.scribble_versions to authenticated;
grant select,delete on public.scribble_submissions to authenticated;
grant all on public.scribble_forms, public.scribble_versions, public.scribble_submissions,
  public.scribble_uploads, public.scribble_rate_limits to service_role;

create policy scribble_forms_read on public.scribble_forms for select to authenticated using (owner_id = (select auth.uid()));
create policy scribble_forms_create on public.scribble_forms for insert to authenticated with check (owner_id = (select auth.uid()));
create policy scribble_forms_edit on public.scribble_forms for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy scribble_forms_delete on public.scribble_forms for delete to authenticated using (owner_id = (select auth.uid()));
create policy scribble_versions_read on public.scribble_versions for select to authenticated using (exists (select 1 from public.scribble_forms f where f.id = form_id and f.owner_id = (select auth.uid())));
create policy scribble_versions_create on public.scribble_versions for insert to authenticated with check (exists (select 1 from public.scribble_forms f where f.id = form_id and f.owner_id = (select auth.uid())));
create policy scribble_submissions_read on public.scribble_submissions for select to authenticated using (exists (select 1 from public.scribble_forms f where f.id = form_id and f.owner_id = (select auth.uid())));
create policy scribble_submissions_delete on public.scribble_submissions for delete to authenticated using (exists (select 1 from public.scribble_forms f where f.id = form_id and f.owner_id = (select auth.uid())));
-- No client policies for upload tickets, limiter state, or storage objects.
-- Public respondents use validated Next.js endpoints; files use signed upload URLs.

create or replace function public.scribble_publish(p_form_id uuid,p_definition jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; result public.scribble_forms;
begin
  perform 1 from public.scribble_forms where id = p_form_id and owner_id = (select auth.uid()) for update;
  if not found then raise exception 'FORM_NOT_OWNED'; end if;
  if not public.scribble_valid_definition(p_definition) then raise exception 'INVALID_DEFINITION'; end if;
  insert into public.scribble_versions(form_id,definition) values(p_form_id,p_definition) returning id into v_id;
  update public.scribble_forms set draft=p_definition,status='published',published_version_id=v_id,updated_at=now()
    where id=p_form_id returning * into result;
  return to_jsonb(result);
end; $$;
revoke all on function public.scribble_publish(uuid,jsonb) from public,anon;
grant execute on function public.scribble_publish(uuid,jsonb) to authenticated;

create or replace function public.scribble_consume_limit(p_key text,p_limit integer,p_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare current_window timestamptz; n integer;
begin
  if length(p_key) <> 64 or p_limit not between 1 and 1000 or p_seconds not between 1 and 86400 then raise exception 'INVALID_LIMIT'; end if;
  current_window := to_timestamp(floor(extract(epoch from now())/p_seconds)*p_seconds);
  insert into public.scribble_rate_limits as t(key,window_start,count) values(p_key,current_window,1)
    on conflict(key,window_start) do update set count=least(t.count+1,p_limit+1) returning count into n;
  delete from public.scribble_rate_limits where window_start < now()-interval '1 day';
  return n <= p_limit;
end; $$;
revoke all on function public.scribble_consume_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.scribble_consume_limit(text,integer,integer) to service_role;

create or replace function public.scribble_finalize_submission(p_form_id uuid,p_version_id uuid,p_id uuid,p_answers jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare f public.scribble_forms; pair record; ticket public.scribble_uploads; existing public.scribble_submissions;
begin
  select * into f from public.scribble_forms where id=p_form_id for update;
  if not found or f.status <> 'published' or f.published_version_id <> p_version_id then raise exception 'FORM_CHANGED'; end if;
  select * into existing from public.scribble_submissions where id=p_id;
  if found then
    if existing.form_id=p_form_id and existing.version_id=p_version_id then return existing.id; end if;
    raise exception 'DUPLICATE_IDENTIFIER';
  end if;
  for pair in select key,value from jsonb_each(p_answers) loop
    if jsonb_typeof(pair.value)='object' and pair.value ? 'token' then
      select * into ticket from public.scribble_uploads where token=(pair.value->>'token')::uuid for update;
      if not found or ticket.form_id <> p_form_id or ticket.version_id <> p_version_id
        or ticket.submission_id <> p_id or ticket.field_id::text <> pair.key or ticket.used_at is not null
        or ticket.created_at < now()-interval '2 hours' then raise exception 'INVALID_UPLOAD'; end if;
    end if;
  end loop;
  insert into public.scribble_submissions(id,form_id,version_id,answers) values(p_id,p_form_id,p_version_id,p_answers);
  for pair in select key,value from jsonb_each(p_answers) loop
    if jsonb_typeof(pair.value)='object' and pair.value ? 'token' then
      update public.scribble_uploads set used_at=now() where token=(pair.value->>'token')::uuid;
    end if;
  end loop;
  return p_id;
end; $$;
revoke all on function public.scribble_finalize_submission(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.scribble_finalize_submission(uuid,uuid,uuid,jsonb) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('scribble-uploads','scribble-uploads',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf','text/plain']);

comment on table public.scribble_versions is 'Immutable published snapshots; submissions retain the version answered.';
comment on table public.scribble_uploads is 'Server-only upload tickets. Pending tickets expire after two hours; run cleanup script daily.';
commit;
