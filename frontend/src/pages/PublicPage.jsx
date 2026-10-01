import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Check, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Mail, 
  Building2, 
  User, 
  Calendar, 
  Send, 
  Copy, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Film
} from 'lucide-react';

export const PublicPage = () => {
  const { username } = useParams();
  const cleanUsername = (username || '').replace(/^@/, '').trim().toLowerCase();

  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form fields
  const [brandName, setBrandName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [brief, setBrief] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!cleanUsername) return;
    setLoading(true);
    fetch(`/api/public-creator/${cleanUsername}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.found) {
          setCreator(d);
          if (d.platforms && d.platforms.length > 0) {
            setPlatform(d.platforms[0]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [cleanUsername]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public-creator/${cleanUsername}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: brandName,
          contact_name: contactName,
          email,
          platform,
          budget,
          timeline,
          deliverables,
          brief
        }),
      });
      const data = await res.json();
      setSubmitting(false);
      if (data.ok) {
        setSubmitted({
          ...data,
          brandName,
          contactName,
          email,
          deliverables,
          platform
        });
      } else {
        setError(data.error || 'Submission failed. Please check required fields.');
      }
    } catch {
      setSubmitting(false);
      setError('Connection error. Please try again.');
    }
  };

  const handleCopyLink = () => {
    if (submitted?.tracking_url) {
      navigator.clipboard.writeText(submitted.tracking_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="spinner" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', marginBottom: 16 }} />
        <p style={{ color: 'var(--t2)', fontSize: 15, fontWeight: 500 }}>Loading creator collaboration profile...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 440, background: '#ffffff', borderRadius: 20, border: '1.5px solid var(--border)', padding: '40px 32px', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--red-soft)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', marginBottom: 8 }}>Creator Not Found</h2>
          <p style={{ color: 'var(--t2)', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
            The creator profile for <strong>@{cleanUsername}</strong> could not be located or may have been updated.
          </p>
          <Link to="/" className="btn btn-primary btn-full" style={{ borderRadius: 14, height: 48 }}>
            Return to DealInbox Home
          </Link>
        </div>
      </div>
    );
  }

  // Inbox at capacity view
  if (creator.at_capacity) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 480, background: '#ffffff', borderRadius: 20, border: '1.5px solid var(--border)', padding: '44px 32px', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--amber-soft)', border: '2px solid var(--amber)', color: 'var(--amber)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            ⏸
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--t1)', marginBottom: 8 }}>
            {creator.name}'s inbox is at capacity
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            This creator is currently fully booked with ongoing brand partnerships and is not accepting new briefs right now. Please check back soon!
          </p>
          <Link to="/" className="btn btn-secondary btn-full" style={{ borderRadius: 14 }}>
            Explore DealInbox
          </Link>
        </div>
      </div>
    );
  }

  // SUBMITTED CONFIRMATION SCREEN (Exact Replica of Reference Image 3)
  if (submitted) {
    const bookingId = submitted.tracking_token
      ? `DI-${submitted.tracking_token.slice(0, 6).toUpperCase()}`
      : 'DI-2026-X812';

    return (
      <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
          
          {/* Double Circle Checkmark Halo (Image 3) */}
          <div style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'var(--mint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Check size={32} strokeWidth={3} />
            </div>
          </div>

          {/* Heading & Subhead (Image 3) */}
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.2 }}>
            A little peace of mind.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--t2)', marginBottom: 28 }}>
            Confirmation sent to your email.
          </p>

          {/* White Details Card (Image 3) */}
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1.5px solid var(--border)',
            padding: 24,
            textAlign: 'left',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: 16
          }}>
            {/* Creator Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'var(--mint)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 20
              }}>
                {creator.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>
                  {creator.name}
                </h3>
                <span style={{ fontSize: 13, color: 'var(--t2)' }}>
                  Brand collaboration proposal
                </span>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '14px 0 16px 0' }} />

            {/* Metadata Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <span style={{ color: 'var(--t2)' }}>Brand</span>
                <strong style={{ color: 'var(--t1)', fontWeight: 600 }}>{submitted.brandName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <span style={{ color: 'var(--t2)' }}>When</span>
                <strong style={{ color: 'var(--t1)', fontWeight: 600 }}>Just now · Today</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <span style={{ color: 'var(--t2)' }}>Deliverables</span>
                <strong style={{ color: 'var(--t1)', fontWeight: 600, maxWidth: 220, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {submitted.deliverables || 'Sponsorship Brief'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <span style={{ color: 'var(--t2)' }}>Booking ID</span>
                <strong style={{ color: 'var(--t1)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>
                  {bookingId}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <span style={{ color: 'var(--t2)' }}>Expected Response</span>
                <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  {submitted.resp_time || 'Within 24 hours'}
                </strong>
              </div>
            </div>
          </div>

          {/* Action Buttons (Image 3) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 16,
                background: '#ffffff',
                border: '1.5px solid var(--border)',
                color: 'var(--t1)',
                fontWeight: 600,
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={18} color="var(--primary)" /> : <Copy size={18} />}
              {copied ? 'Tracking Link Copied!' : 'Copy tracking link'}
            </button>

            <Link
              to={`/track/${submitted.tracking_token}`}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 16,
                background: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
            >
              View deal status <ArrowRight size={18} />
            </Link>
          </div>

          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--t3)' }}>
            Powered by DealInbox AI Deal Flow Architecture
          </p>
        </div>
      </div>
    );
  }

  // MAIN INTAKE VIEW (Matching Image 1 & 2 Aesthetic)
  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', color: 'var(--t1)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        
        {/* Top Brand Logo & Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/static/logo.jpeg" alt="DealInbox" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <strong style={{ fontSize: 18, color: 'var(--t1)', fontWeight: 800 }}>DealInbox</strong>
          </Link>
          <span style={{ fontSize: 12, background: 'var(--mint)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 999, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} /> Verified Intake
          </span>
        </div>

        {/* Creator Header Profile Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1.5px solid var(--border)',
          padding: 28,
          marginBottom: 24,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'linear-gradient(135deg, var(--mint), #c8e7d5)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 26,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(22, 78, 67, 0.08)'
            }}>
              {creator.name?.[0]?.toUpperCase() || 'C'}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', lineHeight: 1.2 }}>
                  {creator.name}
                </h1>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'var(--mint)',
                  color: 'var(--primary)',
                  padding: '2px 8px',
                  borderRadius: 999
                }}>
                  <ShieldCheck size={13} /> Verified
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 4 }}>
                @{creator.username} · {creator.niche || 'Digital Creator'}
              </p>
            </div>
          </div>

          {creator.bio && (
            <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 18 }}>
              {creator.bio}
            </p>
          )}

          {/* Quick Metrics Pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 12,
              background: 'var(--canvas-subtle)',
              border: '1px solid var(--border)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--t1)'
            }}>
              <Clock size={15} color="var(--primary)" />
              <span>Replies in {creator.response_time || '24 hours'}</span>
            </div>

            {creator.min_budget && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 12,
                background: 'var(--canvas-subtle)',
                border: '1px solid var(--border)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--t1)'
              }}>
                <DollarSign size={15} color="var(--primary)" />
                <span>Min budget: {creator.min_budget}</span>
              </div>
            )}
          </div>
        </div>

        {/* Intake Brief Form Card (Image 2 style with right icons) */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1.5px solid var(--border)',
          padding: '32px 28px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em', marginBottom: 6 }}>
              Submit Collaboration Brief
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.5 }}>
              Provide campaign deliverables, timeline, and commercial expectations. Briefs are screened by AI Copilot and routed directly to {creator.name}.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 12,
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Brand Name & Contact Name */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                  Brand / Agency Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    required
                    placeholder="e.g. Dream11 / Spotify"
                    style={{ paddingRight: 40 }}
                  />
                  <Building2 size={18} color="var(--t3)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                  Contact Person
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Kunal Sharma"
                    style={{ paddingRight: 40 }}
                  />
                  <User size={18} color="var(--t3)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

            {/* Work Email (Exact match of Email field in Image 2) */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                Work Email *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="partnerships@brand.com"
                  style={{ paddingRight: 40 }}
                />
                <Mail size={18} color="var(--t3)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Platform & Budget Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                  Primary Platform
                </label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  {creator.platforms?.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  )) || (
                    <>
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Twitter/X">Twitter/X</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                  Budget Range (INR)
                </label>
                <select value={budget} onChange={(e) => setBudget(e.target.value)}>
                  <option value="">Select budget range</option>
                  {creator.budgets?.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  )) || (
                    <>
                      <option value="Under Rs.5,000">Under Rs.5,000</option>
                      <option value="Rs.5,000-Rs.10,000">Rs.5,000 - Rs.10,000</option>
                      <option value="Rs.10,000-Rs.25,000">Rs.10,000 - Rs.25,000</option>
                      <option value="Rs.25,000-Rs.50,000">Rs.25,000 - Rs.50,000</option>
                      <option value="Rs.50,000-Rs.1,00,000">Rs.50,000 - Rs.1,00,000</option>
                      <option value="Rs.1,00,000+">Rs.1,00,000+</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Campaign Timeline */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                Expected Campaign Timeline
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="e.g. Next weekend / Matchday launch"
                  style={{ paddingRight: 40 }}
                />
                <Calendar size={18} color="var(--t3)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                Requested Deliverables
              </label>
              <input
                type="text"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                placeholder="e.g. 1 Dedicated Reel + 2 Story frames with swipe-up"
              />
            </div>

            {/* Campaign Brief */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                Campaign Brief &amp; Key Message *
              </label>
              <textarea
                rows={4}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                required
                placeholder="Tell us about the product, campaign objective, call-to-action, and any specific creative requirements or do's/don'ts..."
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Primary Submit Button (Deep Forest Pine Image 2/3 style) */}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.75 : 1,
                boxShadow: '0 4px 14px rgba(22, 78, 67, 0.2)',
                transition: 'all 0.2s ease',
                marginTop: 6
              }}
            >
              {submitting ? 'Submitting brief...' : 'Send Collaboration Brief →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--t3)', marginTop: 18 }}>
            🔒 Direct submission to {creator.name}'s DealInbox • 100% spam-filtered
          </p>
        </div>
      </div>
    </div>
  );
};
