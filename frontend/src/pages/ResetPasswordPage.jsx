import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, KeyRound } from 'lucide-react';

export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password, confirm_password: confirmPassword })
      });
      setSubmitting(false);
      navigate('/login');
    } catch (err) {
      setSubmitting(false);
      setError('Reset failed.');
    }
  };

  return (
    <div className="auth-split">
      <section className="auth-left">
        <Link to="/" style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <img src="/static/logo.jpeg" alt="logo" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
          DealInbox
        </Link>
        <span className="tilted-badge acid" style={{ width: 'fit-content', marginBottom: 16 }}>SECURITY</span>
        <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px' }}>
          Set a new password.
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '15px', lineHeight: 1.6, maxWidth: '420px' }}>
          Choose a strong password for your DealInbox workspace.
        </p>
      </section>

      <section className="auth-right">
        <div className="auth-card">
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--t1)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            New Password
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--t2)', marginBottom: '24px' }}>
            Create a secure password with at least 6 characters.
          </p>

          {error && (
            <div style={{
              padding: '12px 14px', borderRadius: '12px', background: 'var(--red-soft)',
              color: 'var(--red)', fontSize: '13px', fontWeight: 600, marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--t1)', display: 'block', marginBottom: '6px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  style={{ paddingRight: '40px' }}
                />
                <Lock size={18} color="var(--t3)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--t1)', display: 'block', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm password"
                  style={{ paddingRight: '40px' }}
                />
                <KeyRound size={18} color="var(--t3)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ height: 48, borderRadius: 14, fontSize: 14.5 }}>
              {submitting ? 'Updating...' : 'Update Password →'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
