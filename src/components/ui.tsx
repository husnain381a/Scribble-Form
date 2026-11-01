'use client';
import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowUpRight, Check, Feather, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useApp } from './provider';
export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className={`logo ${small ? 'small' : ''}`} aria-label="Scribble home">
      <span className="logo-mark">
        <Feather size={small ? 19 : 23} strokeWidth={2} />
      </span>
      scribble<span className="logo-dot">.</span>
    </Link>
  );
}
export function Nav() {
  const [open, setOpen] = useState(false);
  const { user } = useApp();
  return (
    <header className="site-nav">
      <div className="nav-inner">
        <Logo />
        <nav aria-label="Main navigation" className={open ? 'nav-links open' : 'nav-links'}>
          <Link href="/#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </Link>
          <Link href="/templates" onClick={() => setOpen(false)}>
            Templates <span className="tiny-new">NEW</span>
          </Link>
          <Link href="/open-source" onClick={() => setOpen(false)}>
            Free. Really.
          </Link>
        </nav>
        <div className="nav-actions">
          <Link href={user ? '/workspace' : '/login'} className="login-link">
            {user ? 'My workspace' : 'Log in'}
          </Link>
          <Link href="/builder/new" className="button button-small button-dark">
            Make a form <ArrowUpRight size={16} />
          </Link>
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Logo />
        <p>A little more human. A lot more you.</p>
      </div>
      <div className="footer-links">
        <Link href="/templates">Templates</Link>
        <Link href="/open-source">Open source</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/workspace">
          Workspace <ArrowUpRight size={14} />
        </Link>
      </div>
      <span className="footer-note">Made for everyone, with a little scribble.</span>
    </footer>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Loading({ text = 'Gathering your good ideas…' }: { text?: string }) {
  return (
    <div className="loading">
      <span className="spinner" />
      <p>{text}</p>
    </div>
  );
}
export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="error-box" role="alert">
      <p>{message}</p>
      {retry && (
        <button className="button button-small" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function LocalNotice() {
  const { cloud } = useApp();
  if (cloud) return null;
  return (
    <div className="local-notice">
      <span className="status-dot" />
      Local sandbox · Saved in this browser. Share links work here only.
      <Link href="/login">
        Sign in for cloud publishing <ArrowUpRight size={13} />
      </Link>
    </div>
  );
}
export function CheckLine({ children }: { children: ReactNode }) {
  return (
    <span className="check-line">
      <Check size={15} />
      {children}
    </span>
  );
}
export function DoodleArrow({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 130 80"
      fill="none"
      aria-hidden="true"
      className={`doodle-arrow ${className}`}
    >
      <path
        d="M7 11C28 1 55 8 45 32C34 52 20 24 53 27C83 30 93 47 117 65M98 63L120 68L118 45"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
