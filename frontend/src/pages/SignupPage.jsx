import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Check, X } from 'lucide-react';

function useTypingHeadline(phrases, speed = 50) {
  const [text, setText] = useState(phrases[0] || '');
  useEffect(() => {
    if (!phrases.length) return;
    let pi = 0, ci = 0, deleting = false, timer;
    function tick() {
      const phrase = phrases[pi];
      if (!deleting) { setText(phrase.substring(0, ci + 1)); ci++; if (ci >= phrase.length) { timer = setTimeout(() => { deleting = true; tick(); }, 2200); return; } timer = setTimeout(tick, speed + Math.random() * 30); }
      else { setText(phrase.substring(0, ci - 1)); ci--; if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; timer = setTimeout(tick, 400); return; } timer = setTimeout(tick, 25); }
    }
    timer = setTimeout(tick, 1200);
    return () => clearTimeout(timer);
  }, []);
  return text;
}

function useAnimatedCounter(target, dur = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver((e) => { if (e[0].isIntersecting) { const s = performance.now(); function step(n) { const p = Math.min((n - s) / dur, 1); setVal(Math.round((1 - Math.pow(1 - p, 3)) * target)); if (p < 1) requestAnimationFrame(step); } requestAnimationFrame(step); obs.disconnect(); } });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return [val, ref];
}

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

  const headline = useTypingHeadline(['Launch your premium brand collaboration workspace.', 'Stop losing deals in DMs.', 'Your creator business, organized.']);
  const [creatorCount, crRef] = useAnimatedCounter(2400);
  const [setupTime, stRef] = useAnimatedCounter(60);
  const [freePercent, fpRef] = useAnimatedCounter(100);

  useEffect(() => {
    if (!username || username.length < 3) { setUsernameStatus(null); return; }
    const timer = setTimeout(async () => {
      try { const res = await fetch(`/api/check-username?u=${encodeURIComponent(username)}`); setUsernameStatus(await res.json()); } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    const res = await signup({ name, username, email, password });
    setSubmitting(false);
    if (res.success) navigate('/dashboard'); else setError(res.error);
  };

  const getStrength = (pwd) => {
    if (!pwd) return { pct: 0, text: '', color: '' };
    let s = 0; if (pwd.length >= 6) s++; if (pwd.length >= 10) s++; if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++; if (/\d/.test(pwd)) s++; if (/[^a-zA-Z0-9]/.test(pwd)) s++;
    return [{ pct: 20, color: '#ef4444', text: 'Weak' }, { pct: 40, color: '#f97316', text: 'Fair' }, { pct: 60, color: '#eab308', text: 'Good' }, { pct: 80, color: '#22c55e', text: 'Strong' }, { pct: 100, color: '#10b981', text: 'Excellent' }][Math.min(s, 4)];
  };
  const strength = getStrength(password);

  return (
    <div className="auth-split">
      <section className="auth-left">
        <div className="auth-particles" aria-hidden="true">
          <span className="particle" style={{ width: 80, height: 80, top: '15%', left: '20%' }} />
          <span className="particle" style={{ width: 120, height: 120, top: '65%', left: '70%' }} />
          <span className="particle" style={{ width: 60, height: 60, top: '80%', left: '30%' }} />
          <span className="particle" style={{ width: 50, height: 50, top: '10%', left: '60%' }} />
          <span className="particle" style={{ width: 70, height: 70, top: '45%', left: '85%' }} />
        </div>

        <Link to="/" style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 800, textTransform: 'uppercase', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <img src="/static/logo.jpeg" alt="logo" style={{ width: 28, height: 28, borderRadius: 0 }} /> DealInbox CreatorOS
        </Link>

        <h1 className="typing-cursor" style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', marginBottom: 12, lineHeight: 0.95, minHeight: '2.4em' }}>{headline}</h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: 13, textTransform: 'uppercase', maxWidth: 420 }}>Join {creatorCount.toLocaleString()}+ creators building a reliable deal pipeline instead of losing opportunities in DMs.</p>

        <div className="auth-trust-stats">
          <div className="trust-stat" ref={crRef}>
            <span style={{ display: 'flex', alignItems: 'baseline' }}><span className="trust-num">{creatorCount.toLocaleString()}</span><span className="trust-suffix">+</span></span>
            <span className="trust-label">Creators joined</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-stat" ref={stRef}>
            <span style={{ display: 'flex', alignItems: 'baseline' }}><span className="trust-num">{setupTime}</span><span className="trust-suffix">s</span></span>
            <span className="trust-label">To go live</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-stat" ref={fpRef}>
            <span style={{ display: 'flex', alignItems: 'baseline' }}><span className="trust-num">{freePercent}</span><span className="trust-suffix">%</span></span>
            <span className="trust-label">Free to start</span>
          </div>
        </div>

        <div className="auth-highlight-grid">
          <article><strong>🔗 Public collab page</strong><span>Capture structured brand requests in minutes.</span></article>
          <article><strong>📊 Deal pipeline</strong><span>Move opportunities from inquiry to signed collab.</span></article>
          <article><strong>🚀 Upgrade-ready</strong><span>Scale to Pro workflows as volume grows.</span></article>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-card">
          {/* Progress indicator */}
          <div className="signup-progress">
            <div className="sp-step active"><span>1</span> Account</div>
            <div className="sp-connector" />
            <div className="sp-step"><span>2</span> Profile</div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 4 }}>Create your workspace</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 24 }}>Go live in under a minute.</p>

          {error && <div style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <div className="social-login-group">
            <a href="/auth/google" className="social-btn">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign up with Google
            </a>
            <a href="/auth/github" className="social-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
              Sign up with GitHub
            </a>
          </div>
          <div className="or-row"><span>or sign up with email</span></div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label>Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" required autoFocus />
            </div>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label>Username</label>
              <div className="input-prefix">
                <span className="iprefix">@</span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="yourname" required style={{ paddingRight: 36 }} />
                {usernameStatus && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    {usernameStatus.available ? <Check size={16} color="var(--green)" /> : <X size={16} color="var(--red)" />}
                  </span>
                )}
              </div>
              <div className="hint" style={{ color: usernameStatus && !usernameStatus.available ? 'var(--red)' : usernameStatus?.available ? '#34d399' : 'var(--t4)' }}>
                {usernameStatus ? (usernameStatus.available ? `dealinbox.in/@${username} — Available!` : usernameStatus.reason || 'Username taken') : `Public URL: dealinbox.in/@${username || 'yourname'}`}
              </div>
            </div>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div className="pwd-strength">
                  <div className="pwd-strength-bar"><div className="pwd-strength-fill" style={{ width: `${strength.pct}%`, background: `linear-gradient(90deg, ${strength.color}, ${strength.color}dd)` }} /></div>
                  <span className="pwd-strength-label" style={{ color: strength.color }}>{strength.text}</span>
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ marginTop: 8 }}>
              {submitting ? 'Creating account...' : 'Create free account →'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)', marginTop: 20 }}>Already have an account? <Link to="/login" style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>Log in →</Link></p>
        </div>
      </section>
    </div>
  );
};
