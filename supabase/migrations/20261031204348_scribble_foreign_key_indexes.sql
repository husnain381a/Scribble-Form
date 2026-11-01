-- Cover composite foreign keys used by version lookups and cascade checks.
create index scribble_forms_current_version_idx
  on public.scribble_forms(id,published_version_id);
create index scribble_uploads_version_idx
  on public.scribble_uploads(form_id,version_id);
