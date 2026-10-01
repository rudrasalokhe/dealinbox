import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, Copy, ExternalLink, User, Mail, Globe, Camera, Clock, DollarSign } from 'lucide-react';

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

  const fields = [name, bio, niche, platform, followers, instagram || youtube, minBudget, collabEmail];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);

  const budgetOpts = ['No minimum', '₹5,000+', '₹10,000+', '₹25,000+', '₹50,000+', '₹1,00,000+'];
  const timeOpts = ['24 hours', '48 hours', '72 hours', '1 week', '2 weeks'];

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
          Profile & Settings
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: 14, marginTop: 4 }}>
          Customize your creator page and sponsorship preferences.
        </p>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: 14, background: 'var(--green-soft)',
          border: '1px solid var(--green-border)', color: 'var(--green)',
          fontSize: 13.5, fontWeight: 500, marginBottom: 20
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>

        {/* ── Left Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile Completion Card */}
          <div style={{
            background: '#ffffff', border: '1.5px solid var(--border)',
            borderRadius: 18, padding: 22, boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 10 }}>
              Workspace Setup
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 8 }}>Profile completion</p>
            <div style={{
              height: 6, background: 'var(--canvas-subtle)', borderRadius: 999, overflow: 'hidden', marginBottom: 6
            }}>
              <div style={{
                height: '100%', width: `${pct}%`, borderRadius: 999,
                background: pct >= 80 ? 'var(--green)' : 'var(--primary)',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 80 ? 'var(--green)' : 'var(--primary)' }}>
              {pct}% complete
            </span>
          </div>

          {/* Nav Links */}
          <div style={{
            background: '#ffffff', border: '1.5px solid var(--border)',
            borderRadius: 18, padding: '14px 16px', boxShadow: 'var(--shadow-sm)',
            display: 'flex', flexDirection: 'column', gap: 4
          }}>
            {['Creator Profile', 'Social Links', 'Preferences', 'Account'].map((label) => (
              <button
                key={label}
                style={{
                  padding: '8px 12px', borderRadius: 10, textAlign: 'left',
                  fontSize: 13.5, fontWeight: 600, color: 'var(--t1)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--canvas-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Account & Billing */}
          <div style={{
            background: '#ffffff', border: '1.5px solid var(--border)',
            borderRadius: 18, padding: 22, boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>
              Account & Billing
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Plan', value: <span style={{ background: 'var(--lime)', color: 'var(--lime-text)', fontWeight: 800, fontSize: 11, padding: '2px 8px', borderRadius: 999 }}>{(user?.plan || 'free').toUpperCase()}</span> },
                { label: 'Email', value: user?.email },
                { label: 'Username', value: `@${user?.username}` },
                { label: 'Joined', value: user?.joined || 'N/A' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--t3)' }}>{row.label}</span>
                  <span style={{ color: 'var(--t1)', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Form Card ── */}
        <div style={{
          background: '#ffffff', border: '1.5px solid var(--border)',
          borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Collaboration Link Section */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 12 }}>
              Your Collaboration Link
            </h2>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: 'var(--canvas-subtle)', border: '1px solid var(--border)',
              borderRadius: 12, fontSize: 13.5
            }}>
              <span style={{ flex: 1, color: 'var(--primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {collabUrl}
              </span>
              <button onClick={copyLink} className="btn btn-secondary btn-sm" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
              </button>
              <a href={collabUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: -4 }}>Creator Profile</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Display Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Collab Email</label>
                <input type="email" value={collabEmail} onChange={(e) => setCollabEmail(e.target.value)} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Bio</label>
              <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell brands about your audience and content style..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Niche</label>
                <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Beauty / Tech / Lifestyle" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Primary Platform</label>
                <input type="text" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Instagram / YouTube" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Follower Count</label>
                <input type="text" value={followers} onChange={(e) => setFollowers(e.target.value)} placeholder="50,000+" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Instagram Handle</label>
                <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourhandle" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>YouTube Channel</label>
                <input type="text" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="youtube.com/@yourchannel" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Minimum Budget</label>
                <select value={minBudget} onChange={(e) => setMinBudget(e.target.value)}>
                  <option value="">Select minimum</option>
                  {budgetOpts.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Typical Response Time</label>
              <select value={responseTime} onChange={(e) => setResponseTime(e.target.value)}>
                {timeOpts.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> {submitting ? 'Saving...' : 'Save Profile'}
              </button>
              <a href={collabUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <ExternalLink size={16} /> Preview public page
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
