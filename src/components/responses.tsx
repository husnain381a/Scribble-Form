'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  FileText,
  Inbox,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from './provider';
import { Logo, Loading, ErrorBox, Modal } from './ui';
import { csvCell, formatDate } from '@/lib/forms';
import { downloadFile } from '@/lib/repository';
import type { Answer, FileAnswer, FormRecord, Submission } from '@/lib/types';
function valueText(v: Answer | undefined) {
  return typeof v === 'object' && v !== null
    ? 'name' in v
      ? v.name
      : v.join(', ')
    : typeof v === 'boolean'
      ? v
        ? 'Yes'
        : 'No'
      : String(v ?? '—');
}
export function Responses({ id }: { id: string }) {
  const { ready, cloud, repo, toast } = useApp();
  const [form, setForm] = useState<FormRecord | null>(null);
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Submission | null>(null);
  const [remove, setRemove] = useState<Submission | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [f, r] = await Promise.all([repo.get(id), repo.responses(id)]);
      if (!f) throw new Error('This form is not in your workspace.');
      setForm(f);
      setRows(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load responses.');
    } finally {
      setLoading(false);
    }
  }, [id, cloud]);
  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);
  const filtered = rows.filter(
    (r) =>
      Object.values(r.answers).some((a) =>
        valueText(a).toLowerCase().includes(query.toLowerCase()),
      ) || r.id.includes(query),
  );
  const fields = Array.from(
    new Map(
      [...rows.flatMap((r) => r.definition?.fields || []), ...(form?.draft.fields || [])]
        .filter((f) => f.type !== 'heading')
        .map((f) => [f.id, f]),
    ).values(),
  );
  function exportCsv() {
    if (!form) return;
    const csv =
      '\uFEFF' +
      [
        ['Response ID', 'Submitted at', ...fields.map((f) => f.label)].map(csvCell).join(','),
        ...filtered.map((r) =>
          [r.id, r.created_at, ...fields.map((f) => valueText(r.answers[f.id]))]
            .map(csvCell)
            .join(','),
        ),
      ].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.draft.title.replace(/[^a-z0-9]/gi, '-')}-responses.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`${filtered.length} responses exported.`);
  }
  return (
    <div className="responses-app">
      <header className="builder-header">
        <div className="builder-header-left">
          <Link href="/workspace" className="icon-button" aria-label="Back to workspace">
            <ArrowLeft size={20} />
          </Link>
          <Logo small />
          <span className="header-divider" />
          <b className="builder-title">{form?.draft.title || 'Your responses'}</b>
        </div>
        {form && (
          <Link href={`/builder/${id}`} className="button button-small">
            Back to editor <ArrowUpRight size={16} />
          </Link>
        )}
      </header>
      <main id="main" className="responses-content">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={load} />
        ) : (
          form && (
            <>
              <div className="responses-title">
                <div>
                  <span className="eyebrow">THE OTHER SIDE OF THE CONVERSATION</span>
                  <h1>
                    Good things, coming in<span className="coral">.</span>
                  </h1>
                  <p>Every response is a little connection.</p>
                </div>
                <button
                  className="button button-dark"
                  onClick={exportCsv}
                  disabled={!filtered.length}
                >
                  <Download size={17} />
                  Export CSV
                </button>
              </div>
              <div className="response-stats">
                <div>
                  <span>ALL RESPONSES</span>
                  <b>
                    {rows.length}
                    <small>and counting</small>
                  </b>
                </div>
                <div>
                  <span>IN THE LAST 7 DAYS</span>
                  <b>
                    {
                      rows.filter((r) => Date.now() - Date.parse(r.created_at) < 7 * 86400000)
                        .length
                    }
                    <small>fresh perspectives</small>
                  </b>
                </div>
                <div>
                  <span>FORM STATUS</span>
                  <b className="status-label">
                    <i className={form.status === 'published' ? 'green-dot' : 'status-dot'} />
                    {form.status === 'published'
                      ? 'Open for answers'
                      : form.status === 'closed'
                        ? 'Taking a pause'
                        : 'A work in progress'}
                  </b>
                </div>
              </div>
              <div className="responses-toolbar">
                <h2>
                  Responses <span>{filtered.length}</span>
                </h2>
                <div>
                  <label className="search-field">
                    <Search size={16} />
                    <input
                      placeholder="Find a response…"
                      aria-label="Search responses"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <button className="button button-small" onClick={load}>
                    Refresh
                  </button>
                </div>
              </div>
              {filtered.length ? (
                <div className="response-table-wrap">
                  <table className="response-table">
                    <thead>
                      <tr>
                        <th>Submitted</th>
                        {fields.slice(0, 4).map((f) => (
                          <th key={f.id}>{f.label}</th>
                        ))}
                        <th>
                          <span className="sr-only">Open response</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <button onClick={() => setDetail(r)}>
                              {formatDate(r.created_at)}
                              <small>
                                {new Date(r.created_at).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </small>
                            </button>
                          </td>
                          {fields.slice(0, 4).map((f) => (
                            <td key={f.id}>
                              <button onClick={() => setDetail(r)}>
                                {valueText(r.answers[f.id])}
                              </button>
                            </td>
                          ))}
                          <td>
                            <button
                              className="icon-button"
                              aria-label={`Open response from ${formatDate(r.created_at)}`}
                              onClick={() => setDetail(r)}
                            >
                              <ArrowUpRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="workspace-empty">
                  <div className="empty-doodle">
                    <Inbox size={42} />
                    <span>✳</span>
                  </div>
                  <h2>{query ? 'Nothing here matches.' : 'A little quiet. For now.'}</h2>
                  <p>
                    {query
                      ? 'Try a different search.'
                      : 'Share your published form and the good conversations will start here.'}
                  </p>
                  <Link href={`/builder/${id}`} className="button">
                    Open your form <ArrowUpRight size={17} />
                  </Link>
                </div>
              )}
              <p className="responses-privacy">
                Only you can see these answers. Export them anytime. No tracking pixels. No ads.
              </p>
            </>
          )
        )}
      </main>
      {detail && (
        <Modal title="A little perspective." onClose={() => setDetail(null)}>
          <p className="response-detail-date">
            Submitted {new Date(detail.created_at).toLocaleString()}
          </p>
          <div className="response-detail">
            {(detail.definition?.fields || fields)
              .filter((f) => f.type !== 'heading')
              .map((f) => (
                <div key={f.id}>
                  <b>{f.label}</b>
                  {typeof detail.answers[f.id] === 'object' &&
                  detail.answers[f.id] !== null &&
                  'token' in (detail.answers[f.id] as object) ? (
                    <button
                      className="file-download"
                      onClick={async () => {
                        try {
                          await downloadFile(detail.answers[f.id] as FileAnswer);
                        } catch (e) {
                          toast(e instanceof Error ? e.message : 'Download failed.');
                        }
                      }}
                    >
                      <FileText size={17} />
                      {valueText(detail.answers[f.id])}
                      <Download size={16} />
                    </button>
                  ) : (
                    <p>{valueText(detail.answers[f.id])}</p>
                  )}
                </div>
              ))}
          </div>
          <div className="modal-actions">
            <button
              className="button button-small danger-text"
              onClick={() => {
                setRemove(detail);
                setDetail(null);
              }}
            >
              <Trash2 size={15} />
              Delete response
            </button>
            <button className="button button-small" onClick={() => setDetail(null)}>
              Done
            </button>
          </div>
        </Modal>
      )}
      {remove && (
        <Modal title="Delete this response?" onClose={() => setRemove(null)}>
          <p className="modal-copy">
            This permanently deletes the response and its attached files. Export a copy first if you
            need one.
          </p>
          <div className="modal-actions">
            <button className="button" onClick={() => setRemove(null)}>
              Keep response
            </button>
            <button
              className="button button-danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await repo.removeResponse(remove.id);
                  setRows((r) => r.filter((row) => row.id !== remove.id));
                  setRemove(null);
                  toast('Response deleted.');
                } catch (e) {
                  toast(e instanceof Error ? e.message : 'Could not delete response.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? 'Deleting…' : 'Delete response'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
