'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { FormRenderer } from './form-renderer';
import { Loading, ErrorBox, Logo } from './ui';
import { api } from '@/lib/repository';
import { supabase } from '@/lib/supabase';
import { uid, validateAnswers } from '@/lib/forms';
import type { PublishedForm } from '@/lib/types';
export function PublicForm({ id }: { id: string }) {
  const [form, setForm] = useState<PublishedForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const attempt = useRef('');
  useEffect(() => {
    attempt.current = uid();
    (async () => {
      try {
        const f = await api(`/api/public/${id}`);
        if (!f) throw new Error('This form is unavailable.');
        setForm(f);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not open this form.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);
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
      <FormRenderer
        definition={form.definition}
        onSubmit={async (answers) => {
          const result = validateAnswers(form.definition, answers);
          if (Object.keys(result.errors).length) throw new Error('Please check your answers.');
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
          if (!supabase)
            throw new Error('File uploads are temporarily unavailable. Please try again later.');
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
