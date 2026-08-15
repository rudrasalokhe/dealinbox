import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Mail, ExternalLink } from 'lucide-react';

export const BrandPortalPage = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/track-data/${token}`)
      .then((r) => r.json())
      .then((d) => { if (d.found) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}><div className="spinner" style={{ marginBottom: 12 }} />Loading deal status...</div>;
  if (!data) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--red)' }}>Invalid or expired tracking link.</div>;

  const steps = data.brand_steps || [
    { key: 'submitted', title: 'Brief Submitted', sub: 'Received by creator', statuses: ['new', 'reviewing', 'negotiating', 'accepted', 'closed'] },
    { key: 'reviewing', title: 'Under Review', sub: 'Creator reviewing deliverables & fit', statuses: ['reviewing', 'negotiating', 'accepted', 'closed'] },
    { key: 'negotiating', title: 'In Negotiation', sub: 'Discussing scope & rates', statuses: ['negotiating', 'accepted', 'closed'] },
    { key: 'accepted', title: 'Deal Confirmed', sub: 'Terms agreed, moving to production', statuses: ['accepted', 'closed'] },
    { key: 'closed', title: 'Collab Completed', sub: 'Content published & fulfilled', statuses: ['closed'] },
  ];

  const currentIdx = steps.findIndex((s) => s.statuses.includes(data.status));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', color: 'var(--t1)' }}>
      {/* Top navbar */}
      <header className="bp-nav">
        <span className="bp-nav-logo">DealInbox <small style={{ color: 'var(--t3)', fontWeight: 400 }}>· Brand Tracker</small></span>
        <span className="os-pill">{data.status_label || data.status?.toUpperCase()}</span>
      </header>

      <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px' }}>
        {/* Header card */}
        <div className="card" style={{ marginBottom: 24, padding: 28 }}>
          <div className="bp-header">
            <div className="bp-header-av">{data.creator_name?.[0]?.toUpperCase() || 'C'}</div>
            <div>
              <h1 className="bp-collab-title" style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', lineHeight: 1, marginBottom: 8 }}>{data.brand_name} <span className="bp-x" style={{ color: '#fff' }}>×</span> {data.creator_name}</h1>
              <p className="bp-submitted" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--t2)' }}>Brief submitted {data.created_at_fmt}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="bp-details-grid">
            <div className="bp-detail"><div className="bp-detail-label">Platform</div><div className="bp-detail-val">{data.platform || 'TBD'}</div></div>
            <div className="bp-detail"><div className="bp-detail-label">Budget</div><div className="bp-detail-val bp-val-green">{data.budget || 'Open'}</div></div>
            <div className="bp-detail"><div className="bp-detail-label">Timeline</div><div className="bp-detail-val">{data.timeline || 'Flexible'}</div></div>
            <div className="bp-detail"><div className="bp-detail-label">Contact</div><div className="bp-detail-val" style={{ fontSize: 12 }}>{data.email}</div></div>
          </div>

          {/* Creator message if present */}
          {data.latest_note && (
            <div className="bp-message">
              <div className="bp-message-from">Message from {data.creator_name}:</div>
              <p className="bp-message-body">{data.latest_note}</p>
            </div>
          )}

          {/* Contextual CTA */}
          <div className="bp-cta-box">
            <div className="bp-cta-text">
              {data.status === 'new' && 'Your brief has been delivered. Creator typically responds within 24-48 hours.'}
              {data.status === 'reviewing' && 'The creator is actively reviewing your brief and campaign requirements.'}
              {data.status === 'negotiating' && 'Negotiation in progress. Check your email for counter-offers or scope updates.'}
              {data.status === 'accepted' && '🎉 Collaboration confirmed! Content production is underway.'}
              {data.status === 'closed' && '✅ Campaign completed! Thank you for working with this creator.'}
            </div>
            {data.collab_email && (
              <a href={`mailto:${data.collab_email}?subject=Re: ${data.brand_name} Collaboration (${token})`} className="bp-email-btn">
                <Mail size={14} style={{ display: 'inline', marginRight: 6 }} /> Email Creator
              </a>
            )}
          </div>
        </div>

        {/* Progress step tracker */}
        <div className="card" style={{ marginBottom: 24, padding: 28 }}>
          <div className="bp-section-label">Collaboration Progress</div>
          <div className="bp-steps">
            {steps.map((step, i) => {
              const isDone = step.statuses.includes(data.status);
              const isActive = i === currentIdx;
              return (
                <div className={`bp-step ${isDone ? 'bp-step-done' : ''} ${isActive ? 'bp-step-active' : ''}`} key={step.key}>
                  <div className="bp-step-track">
                    <div className="bp-step-dot">{isDone ? '✓' : i + 1}</div>
                    {i < steps.length - 1 && <div className="bp-step-line" style={{ background: isDone ? 'var(--green)' : 'var(--border)' }} />}
                  </div>
                  <div className="bp-step-content">
                    <div className="bp-step-title">{step.title}</div>
                    <div className="bp-step-sub">{step.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* About creator */}
        {data.creator && (
          <div className="bp-creator-card">
            <div className="bp-creator-av">{data.creator_name?.[0]?.toUpperCase() || 'C'}</div>
            <div>
              <h3 className="bp-creator-name" style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 4 }}>{data.creator_name}</h3>
              <p className="bp-creator-meta" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--t3)' }}>@{data.creator.username} · {data.creator.niche} Creator</p>
              {data.creator.bio && <p className="bp-creator-bio">{data.creator.bio}</p>}
            </div>
          </div>
        )}

        {/* FAQ Accordion */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="bp-section-label">Frequently Asked Questions</div>
          <div className="bp-faq">
            <details className="bp-faq-item">
              <summary>How do I update campaign details or budget?</summary>
              <p>Reply directly to your email thread with the creator or click the "Email Creator" button above to send an update.</p>
            </details>
            <details className="bp-faq-item">
              <summary>What happens after a deal is accepted?</summary>
              <p>The creator will share draft content or post links according to the agreed timeline. Tracking updates will continue to appear on this page.</p>
            </details>
            <details className="bp-faq-item">
              <summary>Is this tracking link private?</summary>
              <p>Yes. This URL is uniquely generated for your brand brief and is only accessible by you and the creator.</p>
            </details>
          </div>
        </div>

        <div className="bp-powered">
          Powered by <a href="/">DealInbox</a> — The deal workspace for creators.
        </div>
      </main>
    </div>
  );
};
