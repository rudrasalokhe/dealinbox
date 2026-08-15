import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, Copy, ExternalLink } from 'lucide-react';

export const SettingsPage = () => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('');
  const [collabEmail, setCollabEmail] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [responseTime, setResponseTime] = useState('48 hours');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [followers, setFollowers] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || ''); setBio(user.bio || ''); setNiche(user.niche || '');
    setPlatform(user.platform || ''); setCollabEmail(user.collab_email || user.email || '');
    setMinBudget(user.min_budget || ''); setResponseTime(user.response_time || '48 hours');
    setInstagram(user.instagram || ''); setYoutube(user.youtube || ''); setFollowers(user.followers || '');
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setMessage('');
    try {
      await fetch('/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ name, bio, niche, platform, collab_email: collabEmail, min_budget: minBudget, response_time: responseTime, instagram, youtube, followers })
      });
      setSubmitting(false); setMessage('Profile saved successfully!'); refreshUser?.();
    } catch { setSubmitting(false); setMessage('Failed to save profile.'); }
  };

  const collabUrl = `${window.location.origin}/@${user?.username || 'handle'}`;
  const copyLink = () => { navigator.clipboard.writeText(collabUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  /* profile completion */
  const fields = [name, bio, niche, platform, followers, instagram || youtube, minBudget, collabEmail];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);

  const budgetOpts = ['No minimum', '₹5,000+', '₹10,000+', '₹25,000+', '₹50,000+', '₹1,00,000+'];
  const timeOpts = ['24 hours', '48 hours', '72 hours', '1 week', '2 weeks'];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', lineHeight: 1 }}>Profile &amp; Settings</h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: 11, textTransform: 'uppercase', marginTop: 8 }}>Customize your creator page and sponsorship preferences.</p>
      </div>

      {message && <div style={{ padding: 12, borderRadius: 'var(--r-sm)', background: 'var(--green-soft)', border: '1px solid var(--green)', color: 'var(--green)', fontSize: 13, marginBottom: 20 }}>{message}</div>}

      <div className="settings-layout">
        {/* ── Sidebar nav ── */}
        <div className="settings-card" style={{ height: 'fit-content', position: 'sticky', top: 80 }}>
          <h2 style={{ fontSize: 14 }}>Workspace setup</h2>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>Profile completion</div>
          <div className="mini-progress"><i style={{ width: `${pct}%` }} /></div>
          <div style={{ fontSize: 12, fontWeight: 600, color: pct >= 80 ? 'var(--green)' : 'var(--accent)', marginBottom: 16 }}>{pct}% complete</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>Creator Profile</button>
            <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>Social Links</button>
            <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>Preferences</button>
            <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>Account</button>
          </div>
        </div>

        {/* ── Main form ── */}
        <div className="settings-card">
          {/* Collaboration link */}
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Your Collaboration Link</h2>
          <div className="link-row" style={{ marginBottom: 20 }}>
            <span className="link-text">{collabUrl}</span>
            <button className="btn btn-secondary btn-sm" onClick={copyLink}><Copy size={14} /> {copied ? 'Copied!' : 'Copy'}</button>
            <a href={collabUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><ExternalLink size={14} /></a>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Creator Profile</h2>
            <div className="form-row-2">
              <div className="fg"><label>Display Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="fg"><label>Collab Email</label><input type="email" value={collabEmail} onChange={(e) => setCollabEmail(e.target.value)} required /></div>
            </div>
            <div className="fg"><label>Bio</label><textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell brands about your audience and content style..." /></div>

            <div className="form-row-2">
              <div className="fg"><label>Niche</label><input type="text" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Beauty / Tech / Lifestyle" /></div>
              <div className="fg"><label>Primary Platform</label><input type="text" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Instagram / YouTube" /></div>
            </div>
            <div className="form-row-2">
              <div className="fg"><label>Follower Count</label><input type="text" value={followers} onChange={(e) => setFollowers(e.target.value)} placeholder="50,000+" /></div>
              <div className="fg"><label>Instagram Handle</label><input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourhandle" /></div>
            </div>
            <div className="form-row-2">
              <div className="fg"><label>YouTube Channel</label><input type="text" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="youtube.com/@yourchannel" /></div>
              <div className="fg"><label>Minimum Budget</label>
                <select value={minBudget} onChange={(e) => setMinBudget(e.target.value)}>
                  <option value="">Select minimum</option>
                  {budgetOpts.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="fg"><label>Typical Response Time</label>
              <select value={responseTime} onChange={(e) => setResponseTime(e.target.value)}>
                {timeOpts.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={16} /> {submitting ? 'Saving...' : 'Save Profile'}
              </button>
              <a href={collabUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                <ExternalLink size={16} /> Preview public page
              </a>
            </div>
          </form>
        </div>

        {/* ── Account sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="settings-card">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Account &amp; Billing</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="df-row"><span className="df-label">Plan</span><span className="df-value"><span className="plan-badge">{(user?.plan || 'free').toUpperCase()}</span></span></div>
              {user?.plan === 'pro' && user?.pro_expiry && <div className="df-row"><span className="df-label">Pro expires</span><span className="df-value">{user.pro_expiry}</span></div>}
              <div className="df-row"><span className="df-label">Email</span><span className="df-value">{user?.email}</span></div>
              <div className="df-row"><span className="df-label">Username</span><span className="df-value">@{user?.username}</span></div>
              <div className="df-row"><span className="df-label">Joined</span><span className="df-value">{user?.joined || 'N/A'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
