import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Send, Clock, DollarSign } from 'lucide-react';

export const PublicPage = () => {
  const { username } = useParams();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [brief, setBrief] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/public-creator/${username}`)
      .then((r) => r.json())
      .then((d) => { if (d.found) setCreator(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const res = await fetch(`/api/public-creator/${username}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: brandName, contact_name: contactName, email, platform, budget, timeline, deliverables, brief }),
      });
      const data = await res.json();
      setSubmitting(false);
      if (data.ok) setSubmitted(data); else setError(data.error || 'Submission failed.');
    } catch { setSubmitting(false); setError('Connection error.'); }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}><div className="spinner" style={{ marginBottom: 12 }} />Loading creator collaboration page...</div>;
  if (!creator) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--red)' }}>Creator page not found.</div>;

  /* inbox at capacity */
  if (creator.at_capacity) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--canvas)', color: 'var(--t1)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: '0', background: 'var(--amber-soft)', border: '2px solid var(--amber)', color: 'var(--amber)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '4px 4px 0 var(--amber)' }}>⏸</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 8, lineHeight: 1 }}>{creator.name}'s inbox is at capacity</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, textTransform: 'uppercase', color: 'var(--t2)', lineHeight: 1.6 }}>This creator is not accepting new collaboration requests right now. Check back later or follow them on social media for updates.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 540, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: 40 }}>
          <CheckCircle2 size={48} color="var(--green)" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', marginBottom: 8, lineHeight: 1 }}>Enquiry Submitted!</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--t2)', marginBottom: 24 }}>
            Thank you! Your collaboration brief has been sent to <strong>{submitted.creator_name}</strong>. Typical response time is {submitted.resp_time}.
          </p>
          <div style={{ background: 'rgba(255,255,255,.03)', padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', textAlign: 'left', marginBottom: 20 }}>
            <span style={{ fontSize: 11, color: 'var(--t4)', textTransform: 'uppercase', fontWeight: 700 }}>Brand Tracking Link</span>
            <p style={{ fontSize: 12, color: 'var(--accent-hover)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', marginTop: 4 }}>
              <Link to={`/track/${submitted.tracking_token}`}>{submitted.tracking_url}</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', color: 'var(--t1)', padding: '40px 20px' }}>
      <div className="pp-shell">
        {/* Creator Header */}
        <div className="card" style={{ marginBottom: 24, padding: 28 }}>
          <div className="pp-header">
            <div className="pp-avatar">{creator.name?.[0]?.toUpperCase() || 'C'}</div>
            <div>
              <h1 className="pp-name">{creator.name}</h1>
              <p className="pp-meta">@{creator.username} · {creator.niche} Creator</p>
            </div>
          </div>
          {creator.bio && <p className="pp-bio">{creator.bio}</p>}

          {/* Stats */}
          <div className="pp-stats">
            {creator.response_time && (
              <div className="pp-stat">
                <strong style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} color="var(--t3)" /> {creator.response_time}</strong>
                <span>Response time</span>
              </div>
            )}
            {creator.min_budget && (
              <div className="pp-stat">
                <strong style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={14} color="var(--t3)" /> {creator.min_budget}</strong>
                <span>Min budget</span>
              </div>
            )}
          </div>
        </div>

        {/* Intake Form */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 4 }}>Submit Collaboration Brief</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 20 }}>Direct intake form for brand partnerships &amp; sponsorships.</p>

          {error && <div style={{ padding: 10, borderRadius: 'var(--r-sm)', background: 'rgba(239,68,68,.15)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="fg" style={{ marginBottom: 0 }}><label>Brand Name *</label><input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} required placeholder="Nike / Spotify" /></div>
              <div className="fg" style={{ marginBottom: 0 }}><label>Contact Person</label><input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Sarah Jenkins" /></div>
            </div>
            <div className="fg" style={{ marginBottom: 0 }}><label>Work Email *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="sarah@brand.com" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="fg" style={{ marginBottom: 0 }}><label>Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)}><option value="">Select platform</option>{creator.platforms?.map((p) => <option key={p} value={p}>{p}</option>)}</select>
              </div>
              <div className="fg" style={{ marginBottom: 0 }}><label>Budget Range</label>
                <select value={budget} onChange={(e) => setBudget(e.target.value)}><option value="">Select budget</option>{creator.budgets?.map((b) => <option key={b} value={b}>{b}</option>)}</select>
              </div>
            </div>
            <div className="fg" style={{ marginBottom: 0 }}><label>Timeline</label><input type="text" value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="When do you need the content live?" /></div>
            <div className="fg" style={{ marginBottom: 0 }}><label>Deliverables</label><textarea rows={2} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder="2x Instagram Reels, 1 Story, 1 YouTube mention..." /></div>
            <div className="fg" style={{ marginBottom: 0 }}><label>Campaign Brief *</label><textarea rows={4} value={brief} onChange={(e) => setBrief(e.target.value)} required placeholder="Describe product, key messages, campaign goals..." /></div>
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>{submitting ? 'Submitting brief...' : 'Send Collaboration Brief →'}</button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t4)', marginTop: 16 }}>Goes directly to {creator.name}'s DealInbox — not a generic form.</p>
        </div>
      </div>
    </div>
  );
};
