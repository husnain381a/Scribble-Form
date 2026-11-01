'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import { Nav, Footer } from '@/components/ui';
import { templates } from '@/lib/templates';
export default function Templates() {
  const [category, setCategory] = useState('All templates');
  const [query, setQuery] = useState('');
  const filtered = templates.filter(
    (t) =>
      (category === 'All templates' || t.category === category) &&
      `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Nav />
      <main id="main" className="template-gallery section-wrap">
        <div className="gallery-intro">
          <span className="eyebrow">BORROW A LITTLE INSPIRATION</span>
          <h1>
            A head start.
            <br />
            <span className="handwritten coral">Your own kind of finish.</span>
          </h1>
          <p>
            Free form templates for events, feedback, student research, and more.
            <br />
            Take one. Make it yours. Ask away.
          </p>
        </div>
        <div className="gallery-toolbar">
          <div className="filter-tabs">
            {['All templates', 'Events', 'Feedback', 'Education', 'Business'].map((c) => (
              <button
                className={category === c ? 'active' : ''}
                key={c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={16} />
            <input
              placeholder="Find your starting point…"
              aria-label="Search templates"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="template-grid">
          {filtered.map((t) => (
            <Link key={t.id} className="template-tile" href={`/builder/new?template=${t.id}`}>
              <div className={`template-preview theme-${t.theme}`}>
                <span className="template-category">{t.category}</span>
                <div className="template-symbol">{t.symbol}</div>
                <h2>{t.name}</h2>
                <span className="fake-input" />
                <span className="fake-input short" />
                <span className="fake-submit">
                  Let’s do this <ArrowRight size={12} />
                </span>
              </div>
              <div className="template-meta">
                <div>
                  <b>{t.name}</b>
                  <p>{t.description}</p>
                </div>
                <ArrowUpRight size={20} />
              </div>
            </Link>
          ))}
        </div>
        {!filtered.length && (
          <div className="workspace-empty">
            <h2>No matches. Plenty of possibilities.</h2>
            <button
              className="button"
              onClick={() => {
                setQuery('');
                setCategory('All templates');
              }}
            >
              See all templates
            </button>
          </div>
        )}
        <div className="gallery-own">
          <span className="handwritten">Got your own thing in mind?</span>
          <Link href="/builder/new" className="text-link">
            Start with a blank page <ArrowUpRight size={18} />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
