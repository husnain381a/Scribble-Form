'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  FolderOpen,
  Grid2X2,
  Heart,
  LayoutTemplate,
  List,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from './provider';
import { Logo, LocalNotice, Loading, ErrorBox, Modal } from './ui';
import { formatDate } from '@/lib/forms';
import { templates } from '@/lib/templates';
import { supabase } from '@/lib/supabase';
import type { FormRecord } from '@/lib/types';
export function Workspace() {
  const { ready, user, cloud, repo, toast } = useApp();
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [view, setView] = useState('grid');
  const [remove, setRemove] = useState<FormRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [menu, setMenu] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setForms(await repo.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your workspace.');
    } finally {
      setLoading(false);
    }
  }, [cloud]);
  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);
  const filtered = forms
    .filter(
      (f) =>
        f.draft.title.toLowerCase().includes(query.toLowerCase()) &&
        (filter === 'all' || f.status === filter),
    )
    .sort((a, b) =>
      sort === 'name'
        ? a.draft.title.localeCompare(b.draft.title)
        : sort === 'responses'
          ? (b.response_count || 0) - (a.response_count || 0)
          : b.updated_at.localeCompare(a.updated_at),
    );
  async function duplicate(f: FormRecord) {
    try {
      const copy = await repo.create({ ...f.draft, title: `${f.draft.title} (copy)` });
      setForms((fs) => [copy, ...fs]);
      setMenu('');
      toast('A fresh copy, ready for your ideas.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not duplicate.');
    }
  }
  return (
    <div className="workspace-app">
      <aside className="workspace-sidebar">
        <Logo />
        <Link href="/builder/new" className="button button-dark">
          <Plus size={18} />
          Make a form
        </Link>
        <nav aria-label="Workspace navigation">
          <Link href="/workspace" className="active">
            <FolderOpen size={18} />
            My forms<span>{forms.length}</span>
          </Link>
          <Link href="/templates">
            <LayoutTemplate size={18} />
            Template gallery
            <ArrowUpRight size={14} />
          </Link>
          <Link href="/open-source">
            <Heart size={18} />
            The free & open bit
          </Link>
        </nav>
        <div className="workspace-sidebar-note">
          <span className="handwritten">
            A space for
            <br />
            your next big idea.
          </span>
          <p>
            No premium plan.
            <br />
            You’re already on the good one.
          </p>
          <span className="plan-label">
            <Check size={13} />
            EVERYTHING PLAN · FREE
          </span>
        </div>
        <div className="workspace-user">
          <span className="avatar">{user?.email?.slice(0, 1).toUpperCase() || 'Y'}</span>
          <div>
            <b>{user?.email?.split('@')[0] || 'Your workspace'}</b>
            <small>{cloud ? 'Connected to Supabase' : 'Local sandbox'}</small>
          </div>
          {user ? (
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={async () => {
                await supabase?.auth.signOut();
                location.href = '/';
              }}
            >
              <LogOut size={16} />
            </button>
          ) : (
            <Link href="/login" aria-label="Sign in">
              <ArrowUpRight size={17} />
            </Link>
          )}
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <span>MY LITTLE CORNER OF THE INTERNET</span>
          <Link href="/">
            Back to Scribble <ArrowUpRight size={14} />
          </Link>
        </header>
        <LocalNotice />
        <main id="main" className="workspace-content">
          <div className="workspace-welcome">
            <div>
              <span className="eyebrow">YOUR WORKSPACE</span>
              <h1>
                Good things start with a question<span className="coral">.</span>
              </h1>
              <p>What are you curious about today?</p>
            </div>
            <Link href="/builder/new" className="button button-yellow">
              <Plus size={18} />
              New form
            </Link>
          </div>
          <section className="workspace-templates">
            <div className="row-heading">
              <b>A little inspiration to get you going</b>
              <Link href="/templates">
                All templates <ArrowUpRight size={14} />
              </Link>
            </div>
            <div>
              {templates.slice(0, 4).map((t) => (
                <Link
                  key={t.id}
                  href={`/builder/new?template=${t.id}`}
                  className={`quick-template theme-${t.theme}`}
                >
                  <span>{t.symbol}</span>
                  <div>
                    <b>
                      {t.category === 'Events'
                        ? 'Event RSVP'
                        : t.category === 'Feedback'
                          ? 'Customer feedback'
                          : t.category === 'Education'
                            ? 'Student research'
                            : 'Contact form'}
                    </b>
                    <small>{t.description}</small>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          </section>
          <section className="my-forms">
            <div className="forms-heading">
              <h2>
                Your forms <span>{forms.length}</span>
              </h2>
              <div className="segmented">
                <button
                  aria-label="Grid view"
                  className={view === 'grid' ? 'selected' : ''}
                  onClick={() => setView('grid')}
                >
                  <Grid2X2 size={16} />
                </button>
                <button
                  aria-label="List view"
                  className={view === 'list' ? 'selected' : ''}
                  onClick={() => setView('list')}
                >
                  <List size={17} />
                </button>
              </div>
            </div>
            <div className="workspace-filters">
              <div className="filter-tabs">
                {['all', 'draft', 'published', 'closed'].map((t) => (
                  <button
                    key={t}
                    className={filter === t ? 'active' : ''}
                    onClick={() => setFilter(t)}
                  >
                    {t === 'all'
                      ? 'All forms'
                      : t === 'published'
                        ? 'Live'
                        : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="filter-actions">
                <label className="search-field">
                  <Search size={16} />
                  <input
                    aria-label="Search your forms"
                    placeholder="Find a form…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Sort forms"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="recent">Last edited</option>
                  <option value="name">A to Z</option>
                  <option value="responses">Most responses</option>
                </select>
              </div>
            </div>
            {loading ? (
              <Loading />
            ) : error ? (
              <ErrorBox message={error} retry={load} />
            ) : filtered.length ? (
              <div className={`form-cards ${view === 'list' ? 'list-view' : ''}`}>
                {filtered.map((f) => (
                  <article className="form-card" key={f.id}>
                    <Link
                      href={`/builder/${f.id}`}
                      className={`form-card-preview theme-${f.draft.theme} font-${f.draft.font}`}
                    >
                      <span className="form-card-symbol">
                        {templates.find((t) => t.theme === f.draft.theme)?.symbol || '✳'}
                      </span>
                      <h3>{f.draft.title}</h3>
                      <p>
                        {f.draft.fields.length} questions ·{' '}
                        {f.draft.layout === 'conversation' ? 'One at a time' : 'One page'}
                      </p>
                      <span className="card-edit">
                        Open editor <ArrowUpRight size={15} />
                      </span>
                    </Link>
                    <div className="form-card-body">
                      <div>
                        <span className={`status-badge ${f.status}`}>
                          <i />
                          {f.status === 'published'
                            ? 'Live'
                            : f.status === 'closed'
                              ? 'Closed'
                              : 'Draft'}
                        </span>
                        <div className="card-menu">
                          <button
                            className="icon-button"
                            aria-label={`Options for ${f.draft.title}`}
                            aria-expanded={menu === f.id}
                            onClick={() => setMenu(menu === f.id ? '' : f.id)}
                          >
                            <MoreHorizontal size={19} />
                          </button>
                          {menu === f.id && (
                            <div className="dropdown-menu">
                              <button onClick={() => duplicate(f)}>
                                <Copy size={15} />
                                Duplicate
                              </button>
                              <Link href={`/responses/${f.id}`}>
                                <FileText size={15} />
                                View responses
                              </Link>
                              <button
                                className="danger-text"
                                onClick={() => {
                                  setRemove(f);
                                  setMenu('');
                                }}
                              >
                                <Trash2 size={15} />
                                Delete form
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="card-stats">
                        <Link href={`/responses/${f.id}`}>
                          <b>{f.response_count || 0}</b> responses <ArrowUpRight size={12} />
                        </Link>
                        <span>Edited {formatDate(f.updated_at)}</span>
                      </div>
                    </div>
                  </article>
                ))}
                <Link href="/builder/new" className="new-form-card">
                  <Plus size={26} />
                  <span>
                    A blank page.
                    <br />A world of possibilities.
                  </span>
                  <b>
                    Create a form <ArrowUpRight size={15} />
                  </b>
                </Link>
              </div>
            ) : (
              <div className="workspace-empty">
                <div className="empty-doodle">
                  <FileText size={40} />
                  <span>✳</span>
                </div>
                <h2>
                  {query || filter !== 'all'
                    ? 'No forms in this little corner.'
                    : 'Your first good question awaits.'}
                </h2>
                <p>
                  {query || filter !== 'all'
                    ? 'Try a different search or filter.'
                    : 'Start from scratch or borrow a little inspiration from a template.'}
                </p>
                <Link href="/builder/new" className="button button-dark">
                  Make your first form <ArrowUpRight size={17} />
                </Link>
              </div>
            )}
          </section>
          <p className="workspace-bottom-note">
            <Heart size={13} />
            Free tools. More possibilities. That’s the whole idea.
          </p>
        </main>
      </div>
      {remove && (
        <Modal title="Say goodbye to this form?" onClose={() => setRemove(null)}>
          <p className="modal-copy">
            “{remove.draft.title}” and all its responses and files will be permanently deleted.
            Export any responses you need first.
          </p>
          <div className="modal-actions">
            <button className="button" onClick={() => setRemove(null)}>
              Keep my form
            </button>
            <button
              className="button button-danger"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                try {
                  await repo.remove(remove.id);
                  setForms((fs) => fs.filter((f) => f.id !== remove.id));
                  setRemove(null);
                  toast('Form deleted. Space for something new.');
                } catch (e) {
                  toast(e instanceof Error ? e.message : 'Could not delete.');
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? 'Deleting…' : 'Delete form'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
