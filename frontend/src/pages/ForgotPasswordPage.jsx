import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email })
      });
      setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split">
      <section className="auth-left">
        <Link to="/" style={{ fontSize: '18px', fontFamily: 'var(--font-display)', fontWeight: 800, textTransform: 'uppercase', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <img src="/static/logo.jpeg" alt="logo" style={{ width: '28px', height: '28px', borderRadius: '0' }} />
          DealInbox
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '56px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', marginBottom: '12px', lineHeight: 0.95 }}>Reset your password.</h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: '13px', textTransform: 'uppercase', maxWidth: '420px' }}>Don't worry — we'll send you a secure link to get back into your creator workspace.</p>
      </section>

      <section className="auth-right">
        <div className="auth-card">
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle2 size={48} color="var(--green)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '8px' }}>Check your email</h2>
              <p style={{ fontSize: '13px', color: 'var(--t3)', marginBottom: '24px' }}>If an account exists for {email}, we've sent password reset instructions.</p>
              <Link to="/login" className="btn btn-secondary btn-full">← Back to login</Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: '4px' }}>Forgot password?</h2>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '24px' }}>Enter your email address to receive a reset link.</p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>Email address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@email.com" />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                  {submitting ? 'Sending link...' : 'Send reset link →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--t3)', marginTop: '20px' }}>
                Remembered password? <Link to="/login" style={{ color: 'var(--accent-hover)' }}>Log in →</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
