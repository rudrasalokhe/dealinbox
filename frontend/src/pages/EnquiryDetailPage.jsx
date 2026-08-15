import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Copy, Mail, ExternalLink, Trash2, Clock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

const replyTemplates = [
  { label: '✅ Interested', key: 'interested', text: (enq) => `Hi ${enq.contact_name || 'there'},\n\nThank you for reaching out about a collaboration with ${enq.brand_name}! I'd love to discuss this further.\n\nCould you share more details about:\n- Specific deliverables and content format\n- Campaign timeline and go-live dates\n- Usage rights and exclusivity period\n\nLooking forward to working together!\n\nBest regards` },
  { label: '💰 Counter-offer', key: 'counter', text: (enq) => `Hi ${enq.contact_name || 'there'},\n\nThanks for the ${enq.brand_name} collaboration brief! I'm interested in the campaign.\n\nAfter reviewing the scope and deliverables, I'd like to propose an adjusted rate of [YOUR RATE] which reflects:\n- Content creation and editing time\n- My audience reach and engagement rate\n- Usage rights for the content\n\nHappy to discuss further and find a structure that works for both sides.\n\nBest` },
  { label: '❓ Clarify', key: 'clarify', text: (enq) => `Hi ${enq.contact_name || 'there'},\n\nThanks for reaching out about ${enq.brand_name}!\n\nBefore I can provide my rates, could you clarify:\n- What platforms and content types are needed?\n- Is this a one-time collab or ongoing partnership?\n- What's the expected turnaround time?\n\nThis will help me put together the best proposal.\n\nThanks!` },
  { label: '🚫 Decline', key: 'decline', text: (enq) => `Hi ${enq.contact_name || 'there'},\n\nThank you for considering me for the ${enq.brand_name} campaign. I appreciate the opportunity!\n\nUnfortunately, I'm unable to take this on at the moment due to [scheduling conflicts / content alignment / other reason].\n\nI'd love to stay in touch for future opportunities that might be a better fit.\n\nBest wishes` },
];

export const EnquiryDetailPage = () => {
  const { eid } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [status, setStatus] = useState('');
  const [replyOutput, setReplyOutput] = useState('');
  const [copied, setCopied] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadDetail = async () => {
    try {
      const res = await fetch(`/api/enquiry-detail-data/${eid}`, { credentials: 'include' });
      const d = await res.json();
      if (d.enquiry) { setData(d); setStatus(d.enquiry.status); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadDetail(); }, [eid]);

  const handleStatusUpdate = async (newStatus) => {
    setStatus(newStatus);
    await fetch(`/api/enquiry/${eid}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status: newStatus }) });
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await fetch(`/enquiries/${eid}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ text: noteText }) });
    setNoteText('');
    loadDetail();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete this opportunity from ${data.enquiry.brand_name}? This action cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/enquiries/${eid}/delete`, { method: 'POST', credentials: 'include' });
    navigate('/enquiries');
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(label); setTimeout(() => setCopied(''), 2000); });
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--t3)' }}><div className="spinner" style={{ marginBottom: 12 }} />Loading deal details...</div>;
  if (!data?.enquiry) return <div style={{ padding: 40, color: 'var(--red)' }}>Enquiry not found.</div>;
  const enq = data.enquiry;

  const timelineSteps = data.timeline || [
    { title: 'Brief received', time: enq.created_at_fmt, done: true },
    ...(status === 'reviewing' || status === 'negotiating' || status === 'accepted' || status === 'closed' ? [{ title: 'Under review', time: '', done: true }] : []),
    ...(status === 'negotiating' || status === 'accepted' || status === 'closed' ? [{ title: 'Negotiation started', time: '', done: true }] : []),
    ...(status === 'accepted' || status === 'closed' ? [{ title: 'Deal accepted', time: '', done: true }] : []),
    ...(status === 'closed' ? [{ title: 'Collaboration complete', time: '', done: true }] : []),
  ];

  const trackingUrl = data.tracking_url || `${window.location.origin}/track/${enq.tracking_token || 'xxx'}`;

  return (
    <div>
      <Link to="/enquiries" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t3)', marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to opportunities
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent-hover)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {enq.brand_name?.[0]?.toUpperCase() || 'B'}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', lineHeight: 1 }}>{enq.brand_name}</h1>
            <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: 11, textTransform: 'uppercase', marginTop: 8 }}>Contact: {enq.contact_name} ({enq.email}) · Received {enq.created_at_fmt}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select value={status} onChange={(e) => handleStatusUpdate(e.target.value)} style={{ padding: '8px 14px', fontSize: 13, width: 'auto' }}>
            {data.statuses?.map((st) => <option key={st.key} value={st.key}>{st.label}</option>)}
          </select>
        </div>
      </div>

      <div className="deal-layout">
        {/* ── LEFT: Main content ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Campaign info cards */}
          <div className="deal-info-grid">
            <div className="deal-meta-card"><label>Platform</label><strong>{enq.platform || 'TBD'}</strong></div>
            <div className="deal-meta-card"><label>Budget Range</label><strong style={{ color: 'var(--green)' }}>{enq.budget || 'Open'}</strong></div>
            <div className="deal-meta-card"><label>Timeline</label><strong>{enq.timeline || 'Flexible'}</strong></div>
            {enq.deliverables && <div className="deal-meta-card"><label>Deliverables</label><strong>{enq.deliverables}</strong></div>}
          </div>

          {/* Campaign Brief */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}>Campaign Brief</h2>
            <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{enq.brief}</p>
          </div>

          {/* Quick Reply Templates */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="var(--accent)" /> Quick Reply Templates
            </h2>
            <div className="ai-btns">
              {replyTemplates.map((t) => (
                <button key={t.key} className="ai-btn" onClick={() => setReplyOutput(t.text(enq))}>{t.label}</button>
              ))}
            </div>
            {replyOutput && (
              <>
                <div className="ai-output">{replyOutput}</div>
                <div className="ai-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(replyOutput, 'reply')}>
                    <Copy size={14} /> {copied === 'reply' ? 'Copied!' : 'Copy reply'}
                  </button>
                  <a href={`mailto:${enq.email}?subject=Re: ${enq.brand_name} Collaboration&body=${encodeURIComponent(replyOutput)}`} className="btn btn-secondary btn-sm">
                    <Mail size={14} /> Open in email
                  </a>
                </div>
              </>
            )}
          </div>

          {/* Notes Thread */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>Negotiation Notes Thread</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {(!enq.notes_thread || enq.notes_thread.length === 0) ? (
                <p className="empty-small">No negotiation notes added yet.</p>
              ) : (
                enq.notes_thread.map((n, i) => (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.5 }}>{n.text}</p>
                    <small style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4, display: 'block' }}>{n.author} · {n.created_at}</small>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 10 }}>
              <textarea placeholder="Add counter offer, rate notes, or internal comments..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} style={{ flex: 1, resize: 'vertical' }} />
              <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}><Send size={14} /> Add</button>
            </form>
          </div>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Contact info */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 12 }}>Brand Contact</h3>
            <p style={{ fontSize: 13, color: 'var(--t2)' }}><strong>Name:</strong> {enq.contact_name}</p>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 6 }}><strong>Email:</strong> {enq.email}</p>
            <Link to={`/enquiries/${eid}/respond`} className="btn btn-primary btn-sm btn-full" style={{ marginTop: 14 }}>
              <Sparkles size={14} /> Open Pitch &amp; Response Studio
            </Link>
          </div>

          {/* Actions */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 12 }}>Quick Actions</h3>
            <div className="sidebar-actions">
              <button className="btn btn-secondary btn-sm btn-full" onClick={() => copyToClipboard(enq.brief || '', 'brief')}>
                <Copy size={14} /> {copied === 'brief' ? 'Copied!' : 'Copy campaign brief'}
              </button>
              {enq.tracking_token && (
                <>
                  <button className="btn btn-secondary btn-sm btn-full" onClick={() => copyToClipboard(trackingUrl, 'tracking')}>
                    <Copy size={14} /> {copied === 'tracking' ? 'Copied!' : 'Copy brand status link'}
                  </button>
                  <a href={trackingUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm btn-full">
                    <ExternalLink size={14} /> Preview brand portal
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 14 }}>Deal Timeline</h3>
            <div className="timeline">
              {timelineSteps.map((step, i) => (
                <div className="tl-item" key={i}>
                  <i style={{ background: step.done ? 'var(--green)' : 'var(--t4)' }} />
                  <div>
                    <h5 style={{ color: step.done ? 'var(--t1)' : 'var(--t3)' }}>{step.title}</h5>
                    {step.time && <small>{step.time}</small>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Replay link */}
          {data.has_replay && (
            <Link to={`/enquiries/${eid}/replay`} className="btn btn-secondary btn-sm btn-full" style={{ justifyContent: 'center' }}>
              <Sparkles size={14} /> View Negotiation Replay
            </Link>
          )}

          {/* Delete */}
          <button className="btn btn-danger btn-sm btn-full" onClick={handleDelete} disabled={deleting}>
            <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete opportunity'}
          </button>
        </div>
      </div>
    </div>
  );
};
