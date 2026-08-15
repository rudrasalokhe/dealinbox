import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export const NegotiationReplayPage = () => {
  const { eid } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/enquiries/${eid}/negotiation-replay`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [eid]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}><div className="spinner" style={{ marginBottom: 12 }} />Loading negotiation replay...</div>;
  if (!data || !data.enquiry) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--red)' }}>Negotiation data not found.</div>;

  const enq = data.enquiry;
  const events = data.events || [];
  const insights = data.insights || [];
  const score = data.deal_score || 75;

  return (
    <div>
      <Link to={`/enquiries/${eid}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t3)', marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to deal
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', display: 'flex', alignItems: 'center', gap: 10, lineHeight: 1 }}>
          <Sparkles color="var(--accent)" size={36} /> Negotiation Replay &amp; AI Analysis
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: 11, textTransform: 'uppercase', marginTop: 8 }}>Timeline analysis and actionable AI feedback for {enq.brand_name}.</p>
      </div>

      {/* Deal summary strip */}
      <div className="replay-strip">
        <div className="rstrip-item"><div className="rstrip-label">Brand</div><div className="rstrip-val">{enq.brand_name}</div></div>
        <div className="rstrip-item"><div className="rstrip-label">Budget</div><div className="rstrip-val" style={{ color: 'var(--green)' }}>{enq.budget || 'Open'}</div></div>
        <div className="rstrip-item"><div className="rstrip-label">Platform</div><div className="rstrip-val">{enq.platform || 'TBD'}</div></div>
        <div className="rstrip-item"><div className="rstrip-label">Status</div><div className="rstrip-val"><span className={`badge badge-${enq.status}`}>{enq.status}</span></div></div>
      </div>

      <div className="replay-grid">
        {/* ── LEFT: Timeline & Insights ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* AI Insights */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>AI Deal Insights</h2>
            {insights.length === 0 ? (
              <p className="empty-small">No specific negotiation alerts found for this deal.</p>
            ) : (
              insights.map((item, i) => (
                <div className="insight-item" key={i}>
                  <span className="insight-emoji">{item.emoji || '💡'}</span>
                  <div style={{ flex: 1 }}>
                    <div className="insight-title">{item.title}</div>
                    <div className="insight-detail">{item.detail}</div>
                    <span className={`insight-impact impact-${item.impact}`}>{item.impact?.toUpperCase()} IMPACT</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Timeline Replay */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>Negotiation Sequence</h2>
            <div className="replay-timeline">
              {events.length === 0 ? (
                <p className="empty-small">No events recorded yet in negotiation history.</p>
              ) : (
                events.map((ev, i) => (
                  <div className="rtl-item" key={i}>
                    <span className="rtl-icon">{ev.icon || '📌'}</span>
                    <div style={{ flex: 1 }}>
                      <div className="rtl-title">{ev.title}</div>
                      <div className="rtl-time">{ev.time}</div>
                      {ev.detail && <div className="rtl-detail">{ev.detail}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Sidebar Stats ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Deal Health Score */}
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 12 }}>Deal Velocity Score</h3>
            <div className="rs-circle-wrap">
              <svg className="rs-circle" width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,.06)" fill="none" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" stroke="var(--accent)" fill="none" strokeWidth="6"
                  strokeDasharray={213} strokeDashoffset={213 - (score / 100) * 213} strokeLinecap="round" />
              </svg>
              <div className="rs-val">{score}</div>
            </div>
            <div className="rs-label">{score >= 70 ? 'High Momentum' : 'Average Pace'}</div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 12 }}>Deal Metrics</h3>
            <div className="rstat-row"><span className="rstat-label">Notes added</span><span className="rstat-val">{enq.notes_thread?.length || 0}</span></div>
            <div className="rstat-row"><span className="rstat-label">Initial inquiry</span><span className="rstat-val">{enq.created_at_fmt}</span></div>
            <div className="rstat-row"><span className="rstat-label">Contact email</span><span className="rstat-val" style={{ fontSize: 11 }}>{enq.email}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
