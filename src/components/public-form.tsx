'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { FormRenderer } from './form-renderer';
import { Loading, ErrorBox, Logo } from './ui';
import { localRepo, saveLocalFile } from '@/lib/local';
import { api } from '@/lib/repository';
import { cloudConfigured, supabase } from '@/lib/supabase';
import { uid, validateAnswers } from '@/lib/forms';
import type { PublishedForm } from '@/lib/types';
export function PublicForm({ id }: { id: string }) {
  const search = useSearchParams();
  const local = search.get('local') === '1';
  const [form, setForm] = useState<PublishedForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const attempt = useRef('');
  useEffect(() => {
    attempt.current = uid();
    (async () => {
      try {
        const f = local ? await localRepo.public(id) : await api(`/api/public/${id}`);
        if (!f)
          throw new Error(
            local
              ? 'This sandbox form is not saved in this browser. Open it in the browser where it was created.'
              : 'This form is unavailable.',
          );
        setForm(f);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not open this form.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, local]);
  if (loading) return <Loading text="A good conversation is on its way…" />;
  if (error)
    return (
      <main id="main" className="public-unavailable">
        <Logo />
        <ErrorBox message={error} />
        <Link href="/" className="text-link">
          Meet Scribble <ArrowUpRight size={17} />
        </Link>
      </main>
    );
  if (!form || form.status === 'closed')
    return (
      <main id="main" className="public-unavailable">
        <Logo />
        <LockKeyhole size={40} />
        <h1>This conversation is taking a pause.</h1>
        <p>The form owner has closed this form to new responses.</p>
        <Link href="/">Make something of your own →</Link>
      </main>
    );
  return (
    <main id="main" className="public-form-page">
      {local && (
        <div className="public-local-notice">
          LOCAL SANDBOX · Responses and files stay in this browser. This is not a public cloud form.
        </div>
      )}
      <FormRenderer
        definition={form.definition}
        onSubmit={async (answers) => {
          const result = validateAnswers(form.definition, answers);
          if (Object.keys(result.errors).length) throw new Error('Please check your answers.');
          if (local) await localRepo.submit(form, result.answers, attempt.current);
          else
            await api(`/api/public/${id}/submit`, {
              method: 'POST',
              body: JSON.stringify({
                version_id: form.version_id,
                submission_id: attempt.current,
                answers: result.answers,
                website: '',
              }),
            });
        }}
        onUpload={async (field, file) => {
          if (local) return saveLocalFile(file);
          if (!supabase) throw new Error('File storage has not been configured.');
          const data = await api(`/api/public/${id}/upload`, {
            method: 'POST',
            body: JSON.stringify({
              field_id: field.id,
              version_id: form.version_id,
              submission_id: attempt.current,
              name: file.name,
              type: file.type,
              size: file.size,
            }),
          });
          const { error } = await supabase.storage
            .from('scribble-uploads')
            .uploadToSignedUrl(data.path, data.upload_token, file, {
              contentType: file.type,
              upsert: false,
            });
          if (error) throw new Error('Your file could not be uploaded. Please try again.');
          return { token: data.token, name: file.name, size: file.size, type: file.type };
        }}
      />
    </main>
  );
}
