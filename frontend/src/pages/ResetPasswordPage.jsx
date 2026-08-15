import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

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
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '56px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', lineHeight: 0.95 }}>Set a new password.</h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: '13px', textTransform: 'uppercase', marginTop: '12px', maxWidth: '420px' }}>Choose a strong password for your DealInbox workspace.</p>
      </section>

      <section className="auth-right">
        <div className="auth-card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: '16px' }}>New Password</h2>

          {error && <div style={{ padding: '10px', borderRadius: 'var(--r-sm)', background: 'rgba(239,68,68,.15)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} placeholder="Confirm password" />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Password →'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
