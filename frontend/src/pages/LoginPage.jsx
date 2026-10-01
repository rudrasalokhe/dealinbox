import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) navigate('/dashboard');
    else setError(res.error);
  };

  const handleDemoLogin = async () => {
    setError('');
    setSubmitting(true);
    const res = await demoLogin();
    setSubmitting(false);
    if (res.success) navigate('/dashboard');
    else setError(res.error);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--canvas)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 36 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/static/logo.jpeg" alt="DealInbox" style={{ width: 36, height: 36, borderRadius: 10 }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
              DealInbox
            </span>
          </Link>
        </div>

        {/* Title & Subtitle (Exact replica of Image 2) */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 34,
            fontWeight: 800,
            color: 'var(--t1)',
            letterSpacing: '-0.02em',
            marginBottom: 8,
            lineHeight: 1.15
          }}>
            Welcome back.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--t2)', lineHeight: 1.4 }}>
            Let’s pick up where you left off.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 14,
            background: 'var(--red-soft)',
            color: 'var(--red)',
            fontSize: 13.5,
            fontWeight: 500,
            marginBottom: 20,
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Email Address Field with right-aligned Mail icon (Image 2) */}
          <div>
            <label style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav@example.com"
                required
                autoFocus
                style={{
                  height: 52,
                  paddingRight: 44,
                  fontSize: 15,
                  borderRadius: 14,
                  border: '1.5px solid var(--border-strong)',
                  background: '#ffffff'
                }}
              />
              <Mail
                size={20}
                color="var(--t3)"
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>

          {/* Password Field with right-aligned Eye toggle icon (Image 2) */}
          <div>
            <label style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••••••"
                required
                style={{
                  height: 52,
                  paddingRight: 44,
                  fontSize: 15,
                  borderRadius: 14,
                  border: '1.5px solid var(--border-strong)',
                  background: '#ffffff'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: 4,
                  color: 'var(--t3)',
                  cursor: 'pointer'
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link (Image 2) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
            <Link
              to="/forgot-password"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--primary)',
                textDecoration: 'none'
              }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary Submit Button: Rich Forest Pine (Image 2) */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 16,
              background: 'var(--primary)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 16,
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.75 : 1,
              boxShadow: '0 4px 14px rgba(22, 78, 67, 0.16)',
              transition: 'all 0.2s ease',
              marginTop: 4
            }}
          >
            {submitting ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        {/* Divider: "or continue with" (Image 2) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '24px 0 20px',
          color: 'var(--t3)',
          fontSize: 13.5
        }}>
          <span>or continue with</span>
        </div>

        {/* 1-Click Instant Recruiter Demo Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={submitting}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 16,
            background: '#ffffff',
            border: '1.5px solid var(--border-strong)',
            color: 'var(--t1)',
            fontWeight: 700,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
            marginBottom: 14
          }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--mint)',
            color: 'var(--primary)'
          }}>
            <Sparkles size={14} />
          </span>
          <span>Instant Recruiter Demo (1-Click)</span>
        </button>

        {/* Secondary: Link to Signup */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--t2)' }}>
            Don’t have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
