import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Check, X, Sparkles, User, Mail } from 'lucide-react';

export const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-username?u=${encodeURIComponent(username)}`);
        setUsernameStatus(await res.json());
      } catch {}
    }, 350);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await signup({ name, username, email, password });
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
      <div style={{ width: '100%', maxWidth: 440 }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/static/logo.jpeg" alt="DealInbox" style={{ width: 36, height: 36, borderRadius: 10 }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
              DealInbox
            </span>
          </Link>
        </div>

        {/* Title & Subtitle */}
        <div style={{ marginBottom: 26 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: 'var(--t1)',
            letterSpacing: '-0.02em',
            marginBottom: 8,
            lineHeight: 1.15
          }}>
            Create your account.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--t2)', lineHeight: 1.4 }}>
            Launch your verified collaboration link in seconds.
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

        {/* Signup Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
              Full name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Sharma"
                required
                autoFocus
                style={{
                  height: 50,
                  paddingRight: 40,
                  fontSize: 14.5,
                  borderRadius: 14,
                  border: '1.5px solid var(--border-strong)',
                  background: '#ffffff'
                }}
              />
              <User
                size={18}
                color="var(--t3)"
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>
          </div>

          {/* Username / Handle */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
              Choose username (dealsinbox.in/@username)
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--t3)',
                fontWeight: 700,
                pointerEvents: 'none'
              }}>
                @
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="yourhandle"
                required
                style={{
                  height: 50,
                  paddingLeft: 34,
                  paddingRight: 40,
                  fontSize: 14.5,
                  borderRadius: 14,
                  border: '1.5px solid var(--border-strong)',
                  background: '#ffffff'
                }}
              />
              {usernameStatus && (
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                  {usernameStatus.available ? <Check size={18} color="var(--primary)" /> : <X size={18} color="var(--red)" />}
                </div>
              )}
            </div>
            {username && (
              <p style={{
                fontSize: 12,
                marginTop: 6,
                fontWeight: 600,
                color: usernameStatus?.available ? 'var(--primary)' : 'var(--red)'
              }}>
                {usernameStatus ? (usernameStatus.available ? `dealsinbox.in/@${username} is available!` : 'Username taken') : 'Checking availability...'}
              </p>
            )}
          </div>

          {/* Work Email */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
              Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@creator.com"
                required
                style={{
                  height: 50,
                  paddingRight: 40,
                  fontSize: 14.5,
                  borderRadius: 14,
                  border: '1.5px solid var(--border-strong)',
                  background: '#ffffff'
                }}
              />
              <Mail
                size={18}
                color="var(--t3)"
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                style={{
                  height: 50,
                  paddingRight: 40,
                  fontSize: 14.5,
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
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: 4,
                  color: 'var(--t3)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
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
              marginTop: 6
            }}
          >
            {submitting ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        {/* Log in prompt */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--t2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              Log in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
