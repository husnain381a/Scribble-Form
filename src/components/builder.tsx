'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Eye,
  GripVertical,
  Link2,
  Monitor,
  Paintbrush,
  Plus,
  Redo2,
  Settings2,
  Smartphone,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { useApp } from './provider';
import { FormRenderer } from './form-renderer';
import { Logo, Modal, Loading, ErrorBox } from './ui';
import { definitionSchema, fieldInfo, makeField, themes, uid } from '@/lib/forms';
import { templateDefinition } from '@/lib/templates';
import type { Field, FieldType, FormDefinition, FormRecord } from '@/lib/types';

export function Builder({ id }: { id: string }) {
  const { cloud } = useApp();
  return <BuilderSession key={`${id}-${cloud}`} id={id} />;
}
function BuilderSession({ id }: { id: string }) {
  const { ready, cloud, repo, toast } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState<FormRecord | null>(null);
  const [selected, setSelected] = useState('');
  const [panel, setPanel] = useState<'question' | 'design' | 'settings'>('question');
  const [picker, setPicker] = useState(false);
  const [filter, setFilter] = useState('');
  const [preview, setPreview] = useState(false);
  const [phone, setPhone] = useState(false);
  const [share, setShare] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveState, setSaveState] = useState('All changes saved');
  const [history, setHistory] = useState<FormDefinition[]>([]);
  const [future, setFuture] = useState<FormDefinition[]>([]);
  const initialized = useRef(false);
  const latest = useRef(form);
  const saved = useRef('');
  const queue = useRef(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enqueue = useCallback(
    (record: FormRecord) => {
      queue.current = queue.current
        .catch(() => {})
        .then(async () => {
          setSaving(true);
          try {
            await repo.save(record);
            saved.current = JSON.stringify(record.draft);
            if (JSON.stringify(latest.current?.draft) === saved.current)
              setSaveState('All changes saved');
          } catch (e) {
            setSaveState('Couldn’t save — retry');
            throw e;
          } finally {
            setSaving(false);
          }
        });
      return queue.current;
    },
    [cloud],
  );
  useEffect(() => {
    if (!ready || initialized.current) return;
    initialized.current = true;
    (async () => {
      try {
        if (id === 'new') {
          const created = await repo.create(
            templateDefinition(params.get('template') || undefined),
          );
          router.replace(`/builder/${created.id}`);
          setForm(created);
          latest.current = created;
          saved.current = JSON.stringify(created.draft);
          setSelected(created.draft.fields[0]?.id || '');
        } else {
          const f = await repo.get(id);
          if (!f) throw new Error('We couldn’t find this form in your workspace.');
          setForm(f);
          latest.current = f;
          saved.current = JSON.stringify(f.draft);
          setSelected(f.draft.fields[0]?.id || '');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not open your form.');
      }
    })();
  }, [ready, id]);
  useEffect(() => {
    latest.current = form;
    if (!form || JSON.stringify(form.draft) === saved.current) return;
    setSaveState('Unsaved changes');
    timer.current = setTimeout(() => {
      void enqueue(form).catch((e) => toast(e.message));
    }, 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [form, enqueue]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      const record = latest.current;
      if (record && JSON.stringify(record.draft) !== saved.current) {
        queue.current = queue.current.catch(() => {}).then(() => repo.save(record));
        void queue.current.catch(() =>
          toast('Recent changes could not be saved. Reopen the editor and try again.'),
        );
      }
    },
    [cloud],
  );
  useEffect(() => {
    function leave(e: BeforeUnloadEvent) {
      if (form && JSON.stringify(form.draft) !== saved.current) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [form]);
  function edit(next: FormDefinition) {
    if (!form) return;
    setHistory((h) => [...h.slice(-39), form.draft]);
    setFuture([]);
    setForm({ ...form, draft: next });
  }
  function patch(p: Partial<FormDefinition>) {
    if (form) edit({ ...form.draft, ...p });
  }
  function updateField(p: Partial<Field>) {
    if (form)
      patch({ fields: form.draft.fields.map((f) => (f.id === selected ? { ...f, ...p } : f)) });
  }
  function add(type: FieldType) {
    if (!form) return;
    if (form.draft.fields.length >= 100) {
      toast('A form can hold up to 100 blocks.');
      return;
    }
    const field = makeField(type);
    patch({ fields: [...form.draft.fields, field] });
    setSelected(field.id);
    setPicker(false);
    setFilter('');
    setPanel('question');
  }
  function move(index: number, to: number) {
    if (!form || to < 0 || to >= form.draft.fields.length) return;
    const fields = [...form.draft.fields];
    const [field] = fields.splice(index, 1);
    fields.splice(to, 0, field);
    const positions = new Map(fields.map((f, i) => [f.id, i]));
    if (fields.some((f, i) => f.condition && (positions.get(f.condition.field) ?? i) >= i)) {
      toast('Keep conditional questions after the question they depend on.');
      return;
    }
    patch({ fields });
  }
  function removeField(field: Field) {
    if (!form) return;
    if (form.draft.fields.length === 1) {
      toast('Keep at least one question in your form.');
      return;
    }
    const fields = form.draft.fields
      .filter((f) => f.id !== field.id)
      .map((f) => (f.condition?.field === field.id ? { ...f, condition: undefined } : f));
    patch({ fields });
    setSelected(fields[0]?.id || '');
  }
  async function publish() {
    if (!form) return;
    const parsed = definitionSchema.safeParse(form.draft);
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message || 'Check your questions before publishing.');
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setPublishing(true);
    try {
      await enqueue(form);
      const result = await repo.publish(form);
      setForm(result);
      latest.current = result;
      saved.current = JSON.stringify(result.draft);
      setShare(true);
      toast('Your form is live. Go make a connection.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not publish.');
    } finally {
      setPublishing(false);
    }
  }
  async function exit() {
    if (!form) return;
    try {
      if (timer.current) clearTimeout(timer.current);
      await enqueue(form);
      router.push('/workspace');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save.');
    }
  }
  const field = form?.draft.fields.find((f) => f.id === selected);
  const index = form?.draft.fields.findIndex((f) => f.id === selected) ?? -1;
  const link =
    typeof window !== 'undefined' && form ? `${window.location.origin}/f/${form.id}` : '';
  if (error)
    return (
      <div className="app-error">
        <Logo />
        <ErrorBox message={error} />
        <Link href="/workspace" className="button">
          Back to workspace
        </Link>
      </div>
    );
  if (!form) return <Loading text="Opening a fresh page…" />;
  return (
    <div className="builder-app">
      <header className="builder-header">
        <div className="builder-header-left">
          <button className="icon-button" onClick={exit} aria-label="Save and return to workspace">
            <ArrowLeft size={20} />
          </button>
          <Logo small />
          <span className="header-divider" />
          <span className="builder-title">{form.draft.title}</span>
          <span className="save-status">
            <span className={saving ? 'status-dot pending' : 'status-dot'} />
            <button onClick={() => void enqueue(form).catch((e) => toast(e.message))}>
              {saving ? 'Saving…' : saveState}
            </button>
          </span>
        </div>
        <div className="builder-header-actions">
          <button
            className="icon-button"
            aria-label="Undo"
            disabled={!history.length}
            onClick={() => {
              const prev = history.at(-1);
              if (prev) {
                setFuture((f) => [form.draft, ...f]);
                setHistory((h) => h.slice(0, -1));
                setForm({ ...form, draft: prev });
              }
            }}
          >
            <Undo2 size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Redo"
            disabled={!future.length}
            onClick={() => {
              const next = future[0];
              if (next) {
                setHistory((h) => [...h, form.draft]);
                setFuture((f) => f.slice(1));
                setForm({ ...form, draft: next });
              }
            }}
          >
            <Redo2 size={18} />
          </button>
          <button className="button button-small" onClick={() => setPreview(true)}>
            <Eye size={16} />
            <span>Preview</span>
          </button>
          <button
            className="button button-small button-dark"
            disabled={publishing}
            onClick={publish}
          >
            {publishing ? 'Publishing…' : form.published_version_id ? 'Publish changes' : 'Publish'}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </header>
      <div className="builder-subnav">
        <div>
          <button
            className={panel === 'question' ? 'active' : ''}
            onClick={() => setPanel('question')}
          >
            Build
          </button>
          <button className={panel === 'design' ? 'active' : ''} onClick={() => setPanel('design')}>
            <Paintbrush size={15} />
            Design
          </button>
          <button
            className={panel === 'settings' ? 'active' : ''}
            onClick={() => setPanel('settings')}
          >
            <Settings2 size={15} />
            Settings
          </button>
        </div>
        <div>
          <Link href={`/responses/${form.id}`}>
            Responses <ArrowUpRight size={14} />
          </Link>
          {form.published_version_id && (
            <button onClick={() => setShare(true)}>
              <Link2 size={14} />
              Share
            </button>
          )}
        </div>
      </div>
      <div className="builder-grid">
        <aside className="block-sidebar">
          <div className="sidebar-heading">
            <b>Your questions</b>
            <span>{form.draft.fields.length}</span>
          </div>
          <p className="sidebar-hint">A good conversation, one block at a time.</p>
          <div className="outline-list">
            {form.draft.fields.map((f, i) => (
              <button
                key={f.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  move(Number(e.dataTransfer.getData('text/plain')), i);
                }}
                className={selected === f.id ? 'selected' : ''}
                onClick={() => {
                  setSelected(f.id);
                  setPanel('question');
                }}
              >
                <span className="outline-symbol">{fieldInfo[f.type].symbol}</span>
                <span>{f.label || 'Untitled question'}</span>
                {f.condition && <span title="Conditional question">↳</span>}
              </button>
            ))}
          </div>
          <button className="add-block-button" onClick={() => setPicker(true)}>
            <Plus size={17} /> Add a question <span>+</span>
          </button>
          <div className="sidebar-tip">
            <span className="handwritten">Make room for a little personality.</span>
            <p>Mix question types. Ask less. Connect more.</p>
          </div>
          <Link href="/templates" className="sidebar-bottom-link">
            Need a little inspiration? <ArrowUpRight size={14} />
          </Link>
        </aside>
        <section className="editor-area" aria-label="Form canvas">
          <div className="canvas-topline">
            <span>YOUR FORM, TAKING SHAPE</span>
            <span className="handwritten">click a question to make it yours ↘</span>
          </div>
          <div className={`editor-paper theme-${form.draft.theme} font-${form.draft.font}`}>
            <span className="paper-corner">✳</span>
            <input
              aria-label="Form title"
              className="editable-title"
              value={form.draft.title}
              maxLength={160}
              onChange={(e) => patch({ title: e.target.value })}
            />
            <textarea
              aria-label="Form description"
              className="editable-description"
              rows={2}
              value={form.draft.description}
              onChange={(e) => patch({ description: e.target.value })}
              maxLength={2000}
            />
            <div className="canvas-questions">
              {form.draft.fields.map((f, i) => (
                <div
                  key={f.id}
                  className={`canvas-field ${f.id === selected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelected(f.id);
                    setPanel('question');
                  }}
                >
                  <div className="canvas-field-toolbar">
                    <span>
                      <GripVertical size={14} />
                      {fieldInfo[f.type].label}
                      {f.condition && ' · conditional'}
                    </span>
                    <div>
                      <button
                        className="icon-button"
                        aria-label={`Move question ${i + 1} up`}
                        disabled={i === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          move(i, i - 1);
                        }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move question ${i + 1} down`}
                        disabled={i === form.draft.fields.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          move(i, i + 1);
                        }}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Duplicate question ${i + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const copy = {
                            ...f,
                            id: uid(),
                            condition: f.condition ? { ...f.condition } : undefined,
                          };
                          const fields = [...form.draft.fields];
                          fields.splice(i + 1, 0, copy);
                          patch({ fields });
                          setSelected(copy.id);
                        }}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete question ${i + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(f);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <label className="canvas-label">
                    <span>{i + 1}.</span>
                    <input
                      aria-label={`Question ${i + 1} label`}
                      value={f.label}
                      maxLength={500}
                      onChange={(e) => {
                        setSelected(f.id);
                        patch({
                          fields: form.draft.fields.map((x) =>
                            x.id === f.id ? { ...x, label: e.target.value } : x,
                          ),
                        });
                      }}
                    />
                    {f.required && <b>*</b>}
                  </label>
                  {f.description && <p className="canvas-field-description">{f.description}</p>}
                  <div className="canvas-answer" aria-hidden="true">
                    {['choice', 'multi', 'dropdown'].includes(f.type) ? (
                      f.options.map((o, j) => (
                        <div className="canvas-choice" key={j}>
                          <span>{f.type === 'multi' ? '□' : String.fromCharCode(65 + j)}</span>
                          {o}
                        </div>
                      ))
                    ) : f.type === 'rating' ? (
                      <span className="canvas-stars">☆ ☆ ☆ ☆ ☆</span>
                    ) : f.type === 'scale' ? (
                      <span className="canvas-scale">1　2　3　4　5　6　7　8　9　10</span>
                    ) : f.type === 'heading' ? null : f.type === 'file' ? (
                      <div className="canvas-upload">↥　Choose a file, up to 5 MB</div>
                    ) : f.type === 'consent' ? (
                      <span>□ Yes, I agree.</span>
                    ) : (
                      <div className={`canvas-input ${f.type === 'textarea' ? 'long' : ''}`}>
                        {f.type === 'email'
                          ? 'you@example.com'
                          : f.type === 'date'
                            ? 'mm / dd / yyyy'
                            : 'Your answer goes here…'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="canvas-add" onClick={() => setPicker(true)}>
              <Plus size={17} /> Add a question
            </button>
            <div className="canvas-submit" style={{ background: form.draft.accent }}>
              {form.draft.button}
              <ArrowRight size={17} />
            </div>
            <span className="canvas-credit">
              made with <b>scribble.</b>
            </span>
          </div>
          <p className="canvas-footnote">
            Good forms feel like good conversations. You’ve got this.
          </p>
        </section>
        <aside className="properties-sidebar">
          <div className="sidebar-heading">
            <b>
              {panel === 'question'
                ? 'Question details'
                : panel === 'design'
                  ? 'Make it feel like you'
                  : 'The little details'}
            </b>
            {panel === 'design' ? <Paintbrush size={17} /> : <Settings2 size={17} />}
          </div>
          {panel === 'question' && field ? (
            <div className="property-content">
              <span className="property-type">
                {fieldInfo[field.type].symbol}　{fieldInfo[field.type].label}
              </span>
              <label className="property-label">
                Question
                <input
                  value={field.label}
                  maxLength={500}
                  onChange={(e) => updateField({ label: e.target.value })}
                />
              </label>
              <label className="property-label">
                A little context <span>optional</span>
                <textarea
                  rows={3}
                  value={field.description}
                  placeholder="A hint, a why, a friendly nudge…"
                  maxLength={2000}
                  onChange={(e) => updateField({ description: e.target.value })}
                />
              </label>
              {field.type !== 'heading' && (
                <label className="toggle-row">
                  <span>
                    Answer required<small>Some questions deserve an answer.</small>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={field.required}
                    onChange={(e) => updateField({ required: e.target.checked })}
                  />
                </label>
              )}
              {['choice', 'multi', 'dropdown'].includes(field.type) && (
                <div className="property-label">
                  Choices <span>up to 50</span>
                  {field.options.map((o, i) => (
                    <div className="option-editor" key={i}>
                      <input
                        aria-label={`Choice ${i + 1}`}
                        value={o}
                        maxLength={200}
                        onChange={(e) =>
                          updateField({
                            options: field.options.map((v, j) => (i === j ? e.target.value : v)),
                          })
                        }
                      />
                      <button
                        className="icon-button"
                        aria-label={`Remove choice ${i + 1}`}
                        disabled={field.options.length <= 2}
                        onClick={() =>
                          updateField({ options: field.options.filter((_, j) => i !== j) })
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="text-link small-text"
                    onClick={() =>
                      updateField({
                        options: [...field.options, `Option ${field.options.length + 1}`],
                      })
                    }
                    disabled={field.options.length >= 50}
                  >
                    <Plus size={14} />
                    Add a choice
                  </button>
                </div>
              )}
              {['rating', 'scale'].includes(field.type) && (
                <label className="property-label">
                  Maximum value
                  <select
                    value={field.max}
                    onChange={(e) => updateField({ max: Number(e.target.value) })}
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="property-divider" />
              <div className="property-label">
                A smarter conversation
                <p className="property-hint">
                  Show this question only when an earlier answer matches.
                </p>
                <select
                  aria-label="Conditional question"
                  value={field.condition?.field || ''}
                  onChange={(e) =>
                    updateField({
                      condition: e.target.value ? { field: e.target.value, equals: '' } : undefined,
                    })
                  }
                >
                  <option value="">Always show this question</option>
                  {form.draft.fields
                    .slice(0, index)
                    .filter((f) => f.type !== 'heading' && f.type !== 'file')
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                </select>
                {field.condition && (
                  <label className="property-label">
                    Answer equals
                    <input
                      value={field.condition.equals}
                      onChange={(e) =>
                        updateField({ condition: { ...field.condition!, equals: e.target.value } })
                      }
                      placeholder="Exact answer, e.g. Yes"
                    />
                    <span className="property-hint">
                      For checkboxes, match one option. Consent uses “true”.
                    </span>
                  </label>
                )}
              </div>
            </div>
          ) : panel === 'design' ? (
            <div className="property-content">
              <p className="property-hint">Find your form’s kind of energy.</p>
              <div className="theme-options">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    className={form.draft.theme === t.id ? 'selected' : ''}
                    onClick={() => patch({ theme: t.id, accent: t.accent })}
                  >
                    <span style={{ background: t.bg, color: t.ink }}>
                      <i style={{ background: t.accent }} />
                      Aa{form.draft.theme === t.id && <Check size={12} />}
                    </span>
                    {t.name}
                  </button>
                ))}
              </div>
              <label className="property-label">
                A touch of color
                <div className="color-control">
                  <input
                    aria-label="Accent color"
                    type="color"
                    value={form.draft.accent}
                    onChange={(e) => patch({ accent: e.target.value })}
                  />
                  <span>{form.draft.accent.toUpperCase()}</span>
                </div>
              </label>
              <label className="property-label">
                Type with personality
                <select
                  value={form.draft.font}
                  onChange={(e) => patch({ font: e.target.value as FormDefinition['font'] })}
                >
                  <option value="friendly">Friendly & handwritten</option>
                  <option value="clean">Clean & confident</option>
                  <option value="serif">Classic & editorial</option>
                </select>
              </label>
              <div className="property-label">
                The flow
                <div className="segmented">
                  <button
                    className={form.draft.layout === 'page' ? 'selected' : ''}
                    onClick={() => patch({ layout: 'page' })}
                  >
                    One page
                  </button>
                  <button
                    className={form.draft.layout === 'conversation' ? 'selected' : ''}
                    onClick={() => patch({ layout: 'conversation' })}
                  >
                    One at a time
                  </button>
                </div>
              </div>
              <button className="button button-small" onClick={() => setPreview(true)}>
                <Eye size={16} />
                See it in action
              </button>
            </div>
          ) : panel === 'settings' ? (
            <div className="property-content">
              <label className="property-label">
                Submit button
                <input
                  value={form.draft.button}
                  maxLength={60}
                  onChange={(e) => patch({ button: e.target.value })}
                />
              </label>
              <h3 className="settings-subtitle">A proper thank you.</h3>
              <p className="property-hint">The little moment after they hit send.</p>
              <label className="property-label">
                Thank-you title
                <input
                  value={form.draft.successTitle}
                  maxLength={160}
                  onChange={(e) => patch({ successTitle: e.target.value })}
                />
              </label>
              <label className="property-label">
                Thank-you message
                <textarea
                  value={form.draft.successMessage}
                  maxLength={2000}
                  rows={4}
                  onChange={(e) => patch({ successMessage: e.target.value })}
                />
              </label>
              <div className="property-divider" />
              <b>Form availability</b>
              <p className="property-hint">
                {form.status === 'published'
                  ? 'Your published form is accepting responses.'
                  : form.status === 'closed'
                    ? 'Your form is closed to new responses.'
                    : 'Publish your form when you’re ready.'}
              </p>
              {form.published_version_id && (
                <button
                  className="button button-small"
                  onClick={async () => {
                    try {
                      const next = {
                        ...form,
                        status:
                          form.status === 'closed' ? ('published' as const) : ('closed' as const),
                      };
                      await enqueue(next);
                      setForm(next);
                      toast(
                        next.status === 'closed'
                          ? 'Form closed. Your responses are safe.'
                          : 'Your form is accepting responses again.',
                      );
                    } catch (e) {
                      toast(e instanceof Error ? e.message : 'Could not update availability.');
                    }
                  }}
                >
                  {form.status === 'closed' ? 'Reopen form' : 'Close form'}
                </button>
              )}
              <p className="property-hint privacy-hint">
                Responses belong to you. Anyone with the published link can answer, but only you can
                read what they share.
              </p>
            </div>
          ) : null}
        </aside>
      </div>
      {picker && (
        <Modal
          title="What would you like to ask?"
          onClose={() => {
            setPicker(false);
            setFilter('');
          }}
          wide
        >
          <input
            className="block-search"
            autoFocus
            placeholder="Find a question type…"
            aria-label="Find a question type"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="block-picker">
            {Object.entries(fieldInfo)
              .filter(([, v]) =>
                `${v.label} ${v.hint}`.toLowerCase().includes(filter.toLowerCase()),
              )
              .map(([type, info]) => (
                <button key={type} onClick={() => add(type as FieldType)}>
                  <span>{info.symbol}</span>
                  <div>
                    <b>{info.label}</b>
                    <small>{info.hint}</small>
                  </div>
                  <Plus size={16} />
                </button>
              ))}
          </div>
        </Modal>
      )}
      {preview && (
        <Modal title="A little sneak peek" onClose={() => setPreview(false)} wide>
          <div className="preview-toolbar">
            <span>Try your form just like a respondent.</span>
            <div className="segmented">
              <button
                aria-label="Desktop preview"
                className={!phone ? 'selected' : ''}
                onClick={() => setPhone(false)}
              >
                <Monitor size={17} />
              </button>
              <button
                aria-label="Mobile preview"
                className={phone ? 'selected' : ''}
                onClick={() => setPhone(true)}
              >
                <Smartphone size={17} />
              </button>
            </div>
          </div>
          <div className={`preview-frame ${phone ? 'phone' : ''}`}>
            <FormRenderer
              definition={form.draft}
              preview
              onUpload={async () => {
                throw new Error('Publish your form to test file uploads.');
              }}
            />
          </div>
        </Modal>
      )}
      {share && (
        <Modal title="Your form is out in the world." onClose={() => setShare(false)}>
          <div className="share-success">
            <span className="success-mark">
              <Check size={28} />
            </span>
            <p>One link. A world of good conversations.</p>
          </div>
          <label className="property-label">
            Your form link
            <div className="share-link">
              <input readOnly value={link} onFocus={(e) => e.target.select()} />
              <button
                className="icon-button"
                aria-label="Copy form link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                    toast('Link copied. Pass it on.');
                  } catch {
                    toast('Select and copy the link above.');
                  }
                }}
              >
                <Copy size={18} />
              </button>
            </div>
          </label>
          <div className="modal-actions">
            <a href={link} target="_blank" rel="noopener" className="button button-dark">
              Open form <ArrowUpRight size={17} />
            </a>
            <Link href={`/responses/${form.id}`} className="button">
              View responses
            </Link>
          </div>
        </Modal>
      )}
    </div>
  );
}
