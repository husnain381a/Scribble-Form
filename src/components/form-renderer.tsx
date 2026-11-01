'use client';
import { useEffect, useId, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Heart,
  Paperclip,
  Star,
  Upload,
  X,
} from 'lucide-react';
import { allowedMime, contrastText, themes, validateAnswers, visibleFields } from '@/lib/forms';
import type { Answer, Answers, Field, FileAnswer, FormDefinition } from '@/lib/types';
export function FormRenderer({
  definition: def,
  onSubmit,
  onUpload,
  preview = false,
  compact = false,
}: {
  definition: FormDefinition;
  onSubmit?: (answers: Answers) => Promise<void>;
  onUpload?: (field: Field, file: File) => Promise<FileAnswer>;
  preview?: boolean;
  compact?: boolean;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const id = useId();
  const visible = visibleFields(def, answers);
  const questions = visible.filter((f) => f.type !== 'heading');
  const current = questions[Math.min(step, questions.length - 1)];
  const theme = themes.find((t) => t.id === def.theme) || themes[0];
  const shown = def.layout === 'conversation' && current ? [current] : visible;
  useEffect(() => {
    if (def.layout === 'conversation' && current) {
      requestAnimationFrame(() => document.getElementById(`${id}-${current.id}`)?.focus());
    }
  }, [current?.id, def.layout, id]);
  function change(field: string, value: Answer) {
    setAnswers((a) => ({ ...a, [field]: value }));
    setErrors((e) => {
      const n = { ...e };
      delete n[field];
      return n;
    });
  }
  function focusError(key: string) {
    requestAnimationFrame(() => document.getElementById(`${id}-${key}`)?.focus());
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || uploading) return;
    const result = validateAnswers(def, answers);
    if (def.layout === 'conversation' && step < questions.length - 1) {
      if (current && result.errors[current.id]) {
        setErrors({ [current.id]: result.errors[current.id] });
        focusError(current.id);
        return;
      }
      setStep((s) => s + 1);
      setErrors({});
      return;
    }
    if (Object.keys(result.errors).length) {
      setErrors(result.errors);
      const first = Object.keys(result.errors)[0];
      if (def.layout === 'conversation') setStep(questions.findIndex((f) => f.id === first));
      focusError(first);
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (onSubmit) await onSubmit(result.answers);
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Your response could not be sent. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload(f: Field, file: File) {
    if (!allowedMime.includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
      setErrors((e) => ({
        ...e,
        [f.id]: 'Choose a JPG, PNG, WebP, PDF, or text file, up to 5 MB.',
      }));
      return;
    }
    if (!onUpload) {
      setErrors((e) => ({ ...e, [f.id]: 'File uploads are available on your published form.' }));
      return;
    }
    setUploading(f.id);
    try {
      change(f.id, await onUpload(f, file));
    } catch (e) {
      setErrors((x) => ({
        ...x,
        [f.id]: e instanceof Error ? e.message : 'Upload failed. Please try again.',
      }));
    } finally {
      setUploading('');
    }
  }
  return (
    <div
      className={`respondent theme-${def.theme} font-${def.font} ${compact ? 'compact' : ''}`}
      style={
        {
          '--form-bg': theme.bg,
          '--form-ink': theme.ink,
          '--form-accent': def.accent,
          '--form-button-ink': contrastText(def.accent),
        } as CSSProperties
      }
    >
      <div className="respondent-decoration" aria-hidden="true">
        ✳
      </div>
      {done ? (
        <div className="thank-you">
          <span className="success-mark">
            <CheckCheck size={32} />
          </span>
          <span className="handwritten">a little connection, made.</span>
          <h1>{def.successTitle}</h1>
          <p>{def.successMessage}</p>
          {preview && (
            <button
              className="button"
              onClick={() => {
                setDone(false);
                setAnswers({});
                setStep(0);
              }}
            >
              Try again <ArrowRight size={16} />
            </button>
          )}
          <a href="/builder/new" className="respondent-credit">
            Make your own with <b>scribble.</b> <Heart size={12} />
          </a>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className="respondent-intro">
            <span className="form-overline">A LITTLE CONVERSATION</span>
            <h1>{def.title || 'Your next great form'}</h1>
            {def.description && <p>{def.description}</p>}
          </div>
          {def.layout === 'conversation' && (
            <div className="conversation-progress">
              <span>
                {Math.min(step + 1, questions.length)} / {questions.length}
              </span>
              <div>
                <i style={{ width: `${((step + 1) / Math.max(1, questions.length)) * 100}%` }} />
              </div>
            </div>
          )}
          <div
            className="respondent-questions"
            key={def.layout === 'conversation' ? current?.id : 'all'}
          >
            {shown.map((f, i) => {
              const value = answers[f.id];
              const inputId = `${id}-${f.id}`;
              const helpId = `${inputId}-help`;
              const errorId = `${inputId}-error`;
              const shared = {
                id: inputId,
                'aria-invalid': Boolean(errors[f.id]),
                'aria-describedby':
                  `${f.description ? helpId : ''} ${errors[f.id] ? errorId : ''}`.trim() ||
                  undefined,
              };
              if (f.type === 'heading')
                return (
                  <h2 key={f.id} className="form-section-title">
                    {f.label}
                  </h2>
                );
              return (
                <div key={f.id} className={`respondent-field ${errors[f.id] ? 'has-error' : ''}`}>
                  <label className="field-label" htmlFor={inputId}>
                    <span className="question-number">
                      {def.layout === 'conversation' ? step + 1 : questions.indexOf(f) + 1}
                      <ArrowRight size={12} />
                    </span>
                    {f.label}
                    {f.required && (
                      <span className="required-star" aria-label="required">
                        *
                      </span>
                    )}
                  </label>
                  {f.description && (
                    <p className="field-help" id={helpId}>
                      {f.description}
                    </p>
                  )}
                  {['text', 'email', 'phone', 'number', 'url', 'date'].includes(f.type) && (
                    <input
                      {...shared}
                      type={f.type === 'phone' ? 'tel' : f.type === 'text' ? 'text' : f.type}
                      required={f.required}
                      maxLength={f.type === 'text' ? 1000 : 2000}
                      placeholder={
                        (
                          {
                            text: 'Type your answer…',
                            email: 'you@example.com',
                            phone: '+1 (555) 000-0000',
                            number: 'A number, please',
                            url: 'https://',
                          } as Record<string, string>
                        )[f.type]
                      }
                      value={typeof value === 'number' || typeof value === 'string' ? value : ''}
                      onChange={(e) =>
                        change(
                          f.id,
                          f.type === 'number'
                            ? e.target.value === ''
                              ? ''
                              : e.target.valueAsNumber
                            : e.target.value,
                        )
                      }
                    />
                  )}
                  {f.type === 'textarea' && (
                    <textarea
                      {...shared}
                      required={f.required}
                      placeholder="Tell us a little more…"
                      maxLength={10000}
                      rows={4}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(e) => change(f.id, e.target.value)}
                    />
                  )}
                  {(f.type === 'choice' || f.type === 'multi') && (
                    <div
                      className="answer-options"
                      role={f.type === 'choice' ? 'radiogroup' : 'group'}
                      aria-label={f.label}
                      id={inputId}
                      tabIndex={-1}
                    >
                      {f.options.map((o, j) => {
                        const checked =
                          f.type === 'multi'
                            ? Array.isArray(value) && value.includes(o)
                            : value === o;
                        return (
                          <label key={`${o}-${j}`} className={checked ? 'checked' : ''}>
                            <input
                              type={f.type === 'multi' ? 'checkbox' : 'radio'}
                              name={inputId}
                              checked={checked}
                              value={o}
                              onChange={() =>
                                change(
                                  f.id,
                                  f.type === 'multi'
                                    ? checked
                                      ? (value as string[]).filter((v) => v !== o)
                                      : [...(Array.isArray(value) ? value : []), o]
                                    : o,
                                )
                              }
                            />
                            <span className="option-key">{String.fromCharCode(65 + j)}</span>
                            <span>{o}</span>
                            {checked && <Check size={17} />}
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {f.type === 'dropdown' && (
                    <select
                      {...shared}
                      required={f.required}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(e) => change(f.id, e.target.value)}
                    >
                      <option value="">Choose an option…</option>
                      {f.options.map((o, j) => (
                        <option key={j}>{o}</option>
                      ))}
                    </select>
                  )}
                  {(f.type === 'rating' || f.type === 'scale') && (
                    <div
                      {...shared}
                      className={`rating-input ${f.type === 'scale' ? 'scale-input' : ''}`}
                      role="radiogroup"
                      aria-label={f.label}
                      tabIndex={-1}
                    >
                      {Array.from({ length: f.max }, (_, j) => j + 1).map((n) => (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={value === n}
                          aria-label={`${n} of ${f.max}`}
                          className={typeof value === 'number' && n <= value ? 'active' : ''}
                          key={n}
                          onClick={() => change(f.id, n)}
                        >
                          {f.type === 'rating' ? (
                            <Star
                              size={30}
                              fill={
                                typeof value === 'number' && n <= value ? 'currentColor' : 'none'
                              }
                            />
                          ) : (
                            n
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {f.type === 'file' && (
                    <div className="file-area">
                      {typeof value === 'object' && value !== null && 'token' in value ? (
                        <div className="attached-file">
                          <Paperclip size={18} />
                          <span>
                            {value.name}
                            <small>{(value.size / 1024).toFixed(0)} KB · uploaded</small>
                          </span>
                          <button
                            type="button"
                            className="icon-button"
                            aria-label="Remove attached file"
                            onClick={() => change(f.id, '')}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="file-upload" htmlFor={inputId}>
                          <Upload size={24} />
                          <b>
                            {uploading === f.id
                              ? 'Uploading your file…'
                              : 'Drop a little something here'}
                          </b>
                          <span>Choose a file · up to 5 MB</span>
                          <small>JPG, PNG, WebP, PDF, TXT</small>
                          <input
                            {...shared}
                            type="file"
                            accept={allowedMime.join(',')}
                            disabled={Boolean(uploading)}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void upload(f, file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                  {f.type === 'consent' && (
                    <label className="consent-label">
                      <input
                        {...shared}
                        type="checkbox"
                        checked={value === true}
                        onChange={(e) => change(f.id, e.target.checked)}
                      />
                      <span>Yes, I agree.</span>
                    </label>
                  )}
                  {errors[f.id] && (
                    <p className="field-error" id={errorId} role="alert">
                      {errors[f.id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          <div className="respondent-submit">
            {def.layout === 'conversation' && step > 0 && (
              <button
                className="form-back"
                type="button"
                onClick={() => {
                  setStep((s) => s - 1);
                  setErrors({});
                }}
              >
                <ArrowLeft size={17} /> Back
              </button>
            )}
            <button className="form-submit" disabled={busy || Boolean(uploading)}>
              {busy
                ? 'Sending your good thoughts…'
                : def.layout === 'conversation' && step < questions.length - 1
                  ? 'Keep going'
                  : def.button || 'Submit'}
              <ArrowRight size={18} />
            </button>
            <span className="private-note">
              {preview ? 'Preview · responses aren’t saved' : 'Your answers go to the form owner.'}
            </span>
          </div>
          <a href="/" className="respondent-credit">
            made with <b>scribble.</b>
          </a>
        </form>
      )}
    </div>
  );
}
