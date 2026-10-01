import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Mail, KeyRound } from 'lucide-react';

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
        <Link to="/" style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <img src="/static/logo.jpeg" alt="logo" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
          DealInbox
        </Link>
        <span className="tilted-badge acid" style={{ width: 'fit-content', marginBottom: 16 }}>ACCOUNT RECOVERY</span>
        <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px' }}>
          Reset your password.
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '15px', lineHeight: 1.6, maxWidth: '420px' }}>
          Don't worry — we'll send you a secure link to get back into your creator workspace.
        </p>
      </section>

      <section className="auth-right">
        <div className="auth-card">
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'var(--mint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <CheckCircle2 size={32} color="var(--primary)" />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)', marginBottom: '8px' }}>Check your email</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--t2)', marginBottom: '24px', lineHeight: 1.5 }}>
                If an account exists for <strong>{email}</strong>, we've sent password reset instructions.
              </p>
              <Link to="/login" className="btn btn-primary btn-full">← Back to login</Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--t1)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                Forgot password?
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--t2)', marginBottom: '24px' }}>
                Enter your email address to receive a secure reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--t1)', display: 'block', marginBottom: '6px' }}>
                    Email address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="you@email.com"
                      style={{ paddingRight: '40px' }}
                    />
                    <Mail size={18} color="var(--t3)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ height: 48, borderRadius: 14, fontSize: 14.5 }}>
                  {submitting ? 'Sending link...' : 'Send reset link →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '13.5px', color: 'var(--t2)', marginTop: '24px' }}>
                Remembered password? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Log in →</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
