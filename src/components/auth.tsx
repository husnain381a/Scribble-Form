'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Feather, Heart } from 'lucide-react';
import { Logo } from './ui';
import { supabase, cloudConfigured } from '@/lib/supabase';
import { accountDestination, authErrorMessage } from '@/lib/auth-routing';
export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [destination, setDestination] = useState('/workspace');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setDestination(accountDestination(params.get('next')));
    if (params.get('mode') === 'signup') setMode('signup');
    if (params.get('recovery') === '1') setMode('reset');
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('reset');
    });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/login?recovery=1`,
        });
        if (error) throw error;
        setMessage('If an account exists, a reset link is on its way. Check your inbox.');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        location.href = destination;
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/workspace` },
        });
        if (error) throw error;
        if (data.session) location.href = destination;
        else setMessage('Check your inbox to confirm your email. Then come back and sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        location.href = destination;
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function switchMode(next: typeof mode) {
    setMode(next);
    setError('');
    setMessage('');
  }
  return (
    <main id="main" className="auth-page">
      <section className="auth-art">
        <Logo />
        <div>
          <span className="eyebrow">A LITTLE MORE HUMAN</span>
          <h1>
            Good things
            <br />
            happen when
            <br />
            <span>we ask.</span>
          </h1>
          <div className="auth-paper">
            <Heart size={29} />
            <span className="handwritten">
              Your ideas belong
              <br />
              out in the world.
            </span>
            <p>Let’s give them a little room to grow.</p>
          </div>
          <span className="auth-art-star">✳</span>
        </div>
        <p>Free tools. Open doors. Everyone’s invited.</p>
      </section>
      <section className="auth-form">
        <Link className="text-link auth-back" href="/">
          <ArrowLeft size={15} />
          Back to Scribble
        </Link>
        <div>
          <span className="eyebrow">YOUR LITTLE CORNER OF THE INTERNET</span>
          <h2>
            {mode === 'signup'
              ? 'Make yourself at home.'
              : mode === 'forgot'
                ? 'A fresh start.'
                : mode === 'reset'
                  ? 'Your new password.'
                  : 'Well, hello again.'}
          </h2>
          <p>
            {mode === 'signup'
              ? 'A home for your questions. Free, always.'
              : mode === 'forgot'
                ? 'We’ll send you a link to reset your password.'
                : mode === 'reset'
                  ? 'Choose a strong one. Make it yours.'
                  : 'Your good ideas are right where you left them.'}
          </p>
          {!cloudConfigured ? (
            <div className="auth-setup">
              <h3>Sign-in is temporarily unavailable.</h3>
              <p>
                Please try again a little later. Your account is required to create and manage
                forms.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={submit}>
                {mode !== 'reset' && (
                  <label className="property-label">
                    Email address
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@yourcorner.com"
                    />
                  </label>
                )}
                {mode !== 'forgot' && (
                  <label className="property-label">
                    Password
                    <div className="password-field">
                      <input
                        required
                        minLength={mode === 'login' ? 1 : 10}
                        type={show ? 'text' : 'password'}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'At least 10 characters' : 'Your password'}
                      />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={show ? 'Hide password' : 'Show password'}
                        onClick={() => setShow(!show)}
                      >
                        {show ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </label>
                )}
                {mode === 'login' && (
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => switchMode('forgot')}
                  >
                    Forgot your password?
                  </button>
                )}
                {error && (
                  <div className="error-box" role="alert">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="success-box" role="status">
                    <Check size={18} />
                    {message}
                  </div>
                )}
                <button className="button button-dark auth-submit" disabled={busy}>
                  {busy
                    ? 'One little moment…'
                    : mode === 'signup'
                      ? 'Create your free account'
                      : mode === 'forgot'
                        ? 'Send reset link'
                        : mode === 'reset'
                          ? 'Save new password'
                          : 'Come on in'}
                  <ArrowRight size={18} />
                </button>
              </form>
              <p className="auth-switch">
                {mode === 'login'
                  ? 'New around here?'
                  : mode === 'signup'
                    ? 'Already part of the club?'
                    : 'Remembered your password?'}{' '}
                <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                  {mode === 'login' ? 'Make an account' : 'Sign in'}
                </button>
              </p>
              <p className="auth-privacy">
                Your account keeps your forms and responses together.{' '}
                <Link href="/privacy">Read about privacy.</Link>
              </p>
            </>
          )}
          <div className="auth-free">
            <Heart size={14} />
            No card. No trial. Just possibilities.
          </div>
        </div>
      </section>
    </main>
  );
}
