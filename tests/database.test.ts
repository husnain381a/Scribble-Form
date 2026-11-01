import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { blankForm } from '../src/lib/forms';

test('database migration enforces ownership, immutable versions, private responses, and atomic submission', async () => {
  const pg = new PGlite();
  try {
    await pg.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema storage; grant usage on schema public,auth to anon,authenticated,service_role;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant execute on function auth.uid() to authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);
 alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated,service_role;
 grant select,insert,update,delete on storage.objects to anon,authenticated,service_role;`);
    const migrationDirectory = new URL('../supabase/migrations/', import.meta.url);
    for (const name of (await readdir(migrationDirectory))
      .filter((name) => name.endsWith('.sql'))
      .sort()) {
      await pg.exec(await readFile(new URL(name, migrationDirectory), 'utf8'));
    }
    const a = crypto.randomUUID(),
      b = crypto.randomUUID(),
      formId = crypto.randomUUID();
    const def = blankForm();
    await pg.query('insert into auth.users values ($1),($2)', [a, b]);
    await pg.exec(
      `set role authenticated; select set_config('request.jwt.claim.sub','${a}',false);`,
    );
    await pg.query('insert into public.scribble_forms(id,owner_id,draft) values ($1,$2,$3)', [
      formId,
      a,
      JSON.stringify(def),
    ]);
    await assert.rejects(
      pg.query('insert into public.scribble_forms(owner_id,draft) values ($1,$2)', [
        b,
        JSON.stringify(def),
      ]),
    );
    await assert.rejects(
      pg.query('update public.scribble_forms set owner_id=$1 where id=$2', [b, formId]),
    );
    await assert.rejects(
      pg.query('update public.scribble_forms set id=$1 where id=$2', [crypto.randomUUID(), formId]),
    );
    const pub = await pg.query<{ scribble_publish: { published_version_id: string } }>(
      'select public.scribble_publish($1,$2)',
      [formId, JSON.stringify(def)],
    );
    const version = pub.rows[0].scribble_publish.published_version_id;
    assert.ok(version);
    await assert.rejects(
      pg.query('update public.scribble_versions set definition=$1 where id=$2', [
        JSON.stringify(def),
        version,
      ]),
    );
    await pg.exec(`select set_config('request.jwt.claim.sub','${b}',false);`);
    assert.equal((await pg.query('select * from public.scribble_forms')).rows.length, 0);
    assert.equal((await pg.query('select * from public.scribble_versions')).rows.length, 0);
    await pg.exec(`reset role;
      grant select on public.scribble_rate_limits to authenticated;
      create policy accidental_permissive_test on public.scribble_rate_limits for select to authenticated using (true);
      insert into storage.objects(bucket_id) values ('scribble-uploads'),('other-test-bucket');
      create policy accidental_storage_test on storage.objects for select to anon using (true);
      set role authenticated;`);
    assert.equal(
      (await pg.query('select * from public.scribble_rate_limits')).rows.length,
      0,
      'restrictive deny survives accidental permissive policy',
    );
    await pg.exec('reset role; set role anon;');
    const objects = await pg.query<{ bucket_id: string }>('select bucket_id from storage.objects');
    assert.deepEqual(
      objects.rows.map((r) => r.bucket_id),
      ['other-test-bucket'],
      'private bucket remains denied without affecting other buckets',
    );
    await assert.rejects(
      pg.query('select public.scribble_publish($1,$2)', [formId, JSON.stringify(def)]),
    );
    await pg.exec('reset role; set role anon;');
    for (const table of [
      'scribble_forms',
      'scribble_versions',
      'scribble_submissions',
      'scribble_uploads',
      'scribble_rate_limits',
    ])
      await assert.rejects(pg.query(`select * from public.${table}`));
    await assert.rejects(
      pg.query('select public.scribble_consume_limit($1,1,600)', ['a'.repeat(64)]),
    );
    await pg.exec('reset role; set role service_role;');
    assert.equal(
      (
        await pg.query<{ v: boolean }>('select public.scribble_consume_limit($1,1,600) as v', [
          'a'.repeat(64),
        ])
      ).rows[0].v,
      true,
    );
    assert.equal(
      (
        await pg.query<{ v: boolean }>('select public.scribble_consume_limit($1,1,600) as v', [
          'a'.repeat(64),
        ])
      ).rows[0].v,
      false,
    );
    const response = crypto.randomUUID();
    const answers = { [def.fields[0].id]: 'Test Student', [def.fields[1].id]: 'test@example.org' };
    await pg.query('select public.scribble_finalize_submission($1,$2,$3,$4)', [
      formId,
      version,
      response,
      JSON.stringify(answers),
    ]);
    await pg.query('select public.scribble_finalize_submission($1,$2,$3,$4)', [
      formId,
      version,
      response,
      JSON.stringify(answers),
    ]);
    assert.equal((await pg.query('select * from public.scribble_submissions')).rows.length, 1);
    await pg.exec(
      `reset role; set role authenticated; select set_config('request.jwt.claim.sub','${b}',false);`,
    );
    assert.equal((await pg.query('select * from public.scribble_submissions')).rows.length, 0);
    await assert.rejects(
      pg.query(
        'insert into public.scribble_submissions(id,form_id,version_id,answers) values ($1,$2,$3,$4)',
        [crypto.randomUUID(), formId, version, '{}'],
      ),
    );
    await pg.exec(`select set_config('request.jwt.claim.sub','${a}',false);`);
    assert.equal((await pg.query('select * from public.scribble_submissions')).rows.length, 1);
    await pg.query("update public.scribble_forms set status='closed' where id=$1", [formId]);
    await pg.exec('reset role; set role service_role;');
    await assert.rejects(
      pg.query('select public.scribble_finalize_submission($1,$2,$3,$4)', [
        formId,
        version,
        crypto.randomUUID(),
        JSON.stringify(answers),
      ]),
      /FORM_CHANGED/,
    );
    await pg.exec(
      `reset role; set role authenticated; select set_config('request.jwt.claim.sub','${a}',false);`,
    );
    await pg.query('delete from public.scribble_forms where id=$1', [formId]);
    assert.equal((await pg.query('select * from public.scribble_submissions')).rows.length, 0);
    assert.equal((await pg.query('select * from public.scribble_versions')).rows.length, 0);
  } finally {
    await pg.close();
  }
});
