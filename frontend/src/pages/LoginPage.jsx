import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

/* Typing headline hook */
function useTypingHeadline(phrases, speed = 60) {
  const [text, setText] = useState(phrases[0] || '');
  useEffect(() => {
    if (!phrases.length) return;
    let pi = 0, ci = 0, deleting = false, timer;
    function tick() {
      const phrase = phrases[pi];
      if (!deleting) {
        setText(phrase.substring(0, ci + 1));
        ci++;
        if (ci >= phrase.length) { timer = setTimeout(() => { deleting = true; tick(); }, 2200); return; }
        timer = setTimeout(tick, speed + Math.random() * 40);
      } else {
        setText(phrase.substring(0, ci - 1));
        ci--;
        if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; timer = setTimeout(tick, 400); return; }
        timer = setTimeout(tick, 30);
      }
    }
    timer = setTimeout(tick, 1200);
    return () => clearTimeout(timer);
  }, []);
  return text;
}

/* Animated counter hook */
function useAnimatedCounter(target, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const start = performance.now();
        function step(now) {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setValue(Math.round(ease * target));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        obs.disconnect();
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return [value, ref];
}

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const headline = useTypingHeadline([
    'Welcome back, Creator.',
    'Your deals are waiting.',
    'Pick up where you left off.',
  ]);

  const [creators, creatorsRef] = useAnimatedCounter(2400);
  const [dealVal, dealValRef] = useAnimatedCounter(12);
  const [uptime, uptimeRef] = useAnimatedCounter(98);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) navigate('/dashboard');
    else setError(res.error);
  };

  return (
    <div className="auth-split">
      <section className="auth-left">
        <div className="auth-particles" aria-hidden="true">
          <span className="particle" style={{ width: 80, height: 80, top: '15%', left: '20%' }} />
          <span className="particle" style={{ width: 120, height: 120, top: '65%', left: '70%' }} />
          <span className="particle" style={{ width: 60, height: 60, top: '80%', left: '30%' }} />
          <span className="particle" style={{ width: 40, height: 40, top: '30%', left: '80%' }} />
          <span className="particle" style={{ width: 90, height: 90, top: '50%', left: '10%' }} />
        </div>

        <Link to="/" style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 800, textTransform: 'uppercase', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <img src="/static/logo.jpeg" alt="logo" style={{ width: 28, height: 28, borderRadius: 0 }} /> DealInbox
        </Link>

        <h1 className="typing-cursor" style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', marginBottom: 12, lineHeight: 0.95, minHeight: '2.4em' }}>{headline}</h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: 13, textTransform: 'uppercase', maxWidth: 420, marginBottom: 0 }}>
          Every brand deal, negotiation, and opportunity — right where you tracked it.
        </p>

        {/* Trust stats */}
        <div className="auth-trust-stats">
          <div className="trust-stat" ref={creatorsRef}>
            <span style={{ display: 'flex', alignItems: 'baseline' }}>
              <span className="trust-num">{creators.toLocaleString()}</span><span className="trust-suffix">+</span>
            </span>
            <span className="trust-label">Creators</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-stat" ref={dealValRef}>
            <span style={{ display: 'flex', alignItems: 'baseline' }}>
              <span className="trust-num">{dealVal}</span><span className="trust-suffix">L+ tracked</span>
            </span>
            <span className="trust-label">Deal value</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-stat" ref={uptimeRef}>
            <span style={{ display: 'flex', alignItems: 'baseline' }}>
              <span className="trust-num">{uptime}</span><span className="trust-suffix">%</span>
            </span>
            <span className="trust-label">Uptime</span>
          </div>
        </div>

        <div className="auth-highlight-grid">
          <article><strong>🎯 Deal pipeline</strong><span>See every brand opportunity at a glance.</span></article>
          <article><strong>💰 Earnings tracker</strong><span>Know exactly what you've made and what's pending.</span></article>
          <article><strong>📋 Brand submissions</strong><span>Structured briefs — no more DM chaos.</span></article>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 4 }}>Log in</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 24 }}>Enter your details to continue.</p>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="social-login-group">
            <a href="/auth/google" className="social-btn">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </a>
            <a href="/auth/github" className="social-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
              Continue with GitHub
            </a>
          </div>

          <div className="or-row"><span>or continue with email</span></div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required autoFocus />
            </div>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)' }}>Forgot password?</Link>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ marginTop: 8 }}>
              {submitting ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Logging in...</> : 'Continue →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)', marginTop: 20 }}>
            No account? <Link to="/signup" style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>Create one free →</Link>
          </p>
        </div>
      </section>
    </div>
  );
};
