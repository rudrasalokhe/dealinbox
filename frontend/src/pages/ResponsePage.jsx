import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Copy, Send, Sparkles, DollarSign, Check, Sliders, CheckCircle2 } from 'lucide-react';

export const ResponsePage = () => {
  const { eid } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyType, setReplyType] = useState('counter'); // interested, counter, clarify, decline, custom
  const [customRate, setCustomRate] = useState('');
  const [deliverables, setDeliverables] = useState({ reel: true, story: true, usage: false, exclusivity: false });
  const [responseText, setResponseText] = useState('');
  const [copied, setCopied] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/enquiry-detail-data/${eid}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.enquiry) {
          setData(d);
          const initialRate = d.enquiry.budget?.replace(/[^0-9]/g, '') || '25000';
          setCustomRate(initialRate);
          generateText('counter', d.enquiry, initialRate, { reel: true, story: true, usage: false, exclusivity: false });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eid]);

  const generateText = (type, enq, rate, delivs) => {
    if (!enq) return;
    const contact = enq.contact_name || enq.brand_name || 'there';
    const brand = enq.brand_name || 'your brand';
    const platform = enq.platform || 'socials';

    const selectedDeliverablesList = [];
    if (delivs.reel) selectedDeliverablesList.push('1x Dedicated Video/Reel');
    if (delivs.story) selectedDeliverablesList.push('2x Story Amplification');
    if (delivs.usage) selectedDeliverablesList.push('30-day Digital Ad Usage Rights');
    if (delivs.exclusivity) selectedDeliverablesList.push('30-day Category Exclusivity');
    const delivStr = selectedDeliverablesList.length > 0 ? selectedDeliverablesList.join(', ') : 'deliverables as requested';

    let text = '';
    if (type === 'interested') {
      text = `Hi ${contact},\n\nThank you for reaching out about collaborating with ${brand}! I've reviewed your brief for ${platform} and I'm excited to partner up.\n\nThe proposed scope and budget align well. I can deliver ${delivStr} within your target timeline.\n\nPlease let me know the next steps for contracts and creative briefing!\n\nBest regards`;
    } else if (type === 'counter') {
      text = `Hi ${contact},\n\nThanks for the collaboration brief for ${brand}! I'm very interested in working together on ${platform}.\n\nBased on the requested scope (${delivStr}) and current engagement metrics, my proposed rate for this package is ₹${Number(rate).toLocaleString() || rate}.\n\nThis includes full high-res production, editing, and audience engagement tracking. Let me know if this works for your team so we can finalize agreements!\n\nBest regards`;
    } else if (type === 'clarify') {
      text = `Hi ${contact},\n\nThank you for reaching out regarding ${brand}! I'd love to explore this opportunity.\n\nTo help me provide an accurate package proposal, could you clarify:\n1. Exact deliverables required (${platform})\n2. Target go-live date and turnaround timeline\n3. Whether paid usage or ad rights are needed\n\nLooking forward to your response!\n\nBest regards`;
    } else if (type === 'decline') {
      text = `Hi ${contact},\n\nThank you for considering me for the ${brand} campaign! I really appreciate you reaching out.\n\nUnfortunately, I'm unable to take on this project at the moment due to current campaign commitments and content scheduling. I'd love to stay connected for future opportunities that align.\n\nWish you all the best with the launch!\n\nWarmly`;
    } else {
      text = responseText;
    }
    setResponseText(text);
  };

  const handleTypeChange = (newType) => {
    setReplyType(newType);
    generateText(newType, data?.enquiry, customRate, deliverables);
  };

  const handleRateChange = (val) => {
    setCustomRate(val);
    if (replyType === 'counter') generateText('counter', data?.enquiry, val, deliverables);
  };

  const handleDeliverableToggle = (key) => {
    const next = { ...deliverables, [key]: !deliverables[key] };
    setDeliverables(next);
    if (replyType === 'counter' || replyType === 'interested') generateText(replyType, data?.enquiry, customRate, next);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(responseText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveToNotes = async () => {
    if (!responseText.trim()) return;
    setSavingNote(true);
    try {
      await fetch(`/enquiries/${eid}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: `[Response Draft (${replyType.toUpperCase()})]:\n${responseText}` }),
      });
      setSavingNote(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      setSavingNote(false);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}><div className="spinner" style={{ marginBottom: 12 }} />Loading Deal Inbox Response Studio...</div>;
  if (!data?.enquiry) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--red)' }}>Deal not found.</div>;
  const enq = data.enquiry;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Link to={`/enquiries/${eid}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t3)', marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to deal overview
      </Link>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="os-pill" style={{ marginBottom: 8, display: 'inline-block' }}>PITCH &amp; RESPONSE STUDIO</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', lineHeight: 1 }}>Respond to {enq.brand_name}</h1>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: 11, textTransform: 'uppercase', marginTop: 8 }}>
            Contact: {enq.contact_name} ({enq.email}) · Budget: <strong style={{ color: 'var(--green)' }}>{enq.budget || 'Open'}</strong>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* ── LEFT: Studio Form & Editor ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Response Type Selector */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="var(--accent)" /> Select Response Strategy
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {[
                { key: 'interested', label: '✅ Accept Deal', sub: 'Standard acceptance' },
                { key: 'counter', label: '💬 Counter-Offer', sub: 'Propose custom rate' },
                { key: 'clarify', label: '❓ Clarify Info', sub: 'Ask scope details' },
                { key: 'decline', label: '🚫 Polite Decline', sub: 'Pass gracefully' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleTypeChange(t.key)}
                  style={{
                    padding: '12px 14px', borderRadius: 'var(--r-md)', textAlign: 'left',
                    background: replyType === t.key ? 'var(--accent-soft)' : 'rgba(255,255,255,.02)',
                    border: replyType === t.key ? '1px solid var(--accent)' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all .2s'
                  }}
                >
                  <strong style={{ fontSize: 13, color: replyType === t.key ? '#fff' : 'var(--t1)', display: 'block' }}>{t.label}</strong>
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Package Builder (for Counter-Offer) */}
          {replyType === 'counter' && (
            <div className="card" style={{ background: 'rgba(79,110,247,.04)', border: '1px solid rgba(79,110,247,.2)' }}>
              <h2 className="card-title" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={16} color="var(--accent-hover)" /> Package &amp; Rate Customizer
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div className="fg" style={{ marginBottom: 0 }}>
                  <label>Proposed Counter Rate (₹)</label>
                  <input
                    type="number"
                    value={customRate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    placeholder="25000"
                    style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 600 }}>Original Inquiry Budget</span>
                  <strong style={{ fontSize: 15, color: '#fff', marginTop: 2 }}>{enq.budget || 'Not specified'}</strong>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>Included Deliverables &amp; Licensing:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { key: 'reel', label: '1x Dedicated Video/Reel' },
                  { key: 'story', label: '2x Story Amplification' },
                  { key: 'usage', label: '30-day Paid Ad Usage Rights' },
                  { key: 'exclusivity', label: '30-day Category Exclusivity' },
                ].map((item) => (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--t1)', cursor: 'pointer', background: 'rgba(255,255,255,.02)', padding: '8px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                    <input
                      type="checkbox"
                      checked={deliverables[item.key]}
                      onChange={() => handleDeliverableToggle(item.key)}
                      style={{ width: 'auto' }}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Response Editor */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 className="card-title">Response Draft Editor</h2>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>Editable text preview</span>
            </div>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={12}
              style={{ fontSize: 13.5, lineHeight: 1.6, fontFamily: 'var(--font-ui)', padding: 16 }}
            />

            {/* Actions Bar */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <a
                href={`mailto:${enq.email}?subject=Re: ${enq.brand_name} Collaboration Pitch&body=${encodeURIComponent(responseText)}`}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <Mail size={16} /> Open in Email Client
              </a>
              <button className="btn btn-secondary" onClick={copyToClipboard}>
                <Copy size={16} /> {copied ? 'Copied to Clipboard!' : 'Copy Text'}
              </button>
              <button className="btn btn-secondary" onClick={handleSaveToNotes} disabled={savingNote}>
                <Send size={16} /> {savingNote ? 'Saving...' : 'Save Draft to Deal Thread'}
              </button>
            </div>
            {savedSuccess && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} /> Draft saved to negotiation notes thread!
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Sidebar Context ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Brand Info */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 12 }}>Campaign Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
              <div><span style={{ color: 'var(--t3)' }}>Brand:</span> <strong style={{ color: '#fff' }}>{enq.brand_name}</strong></div>
              <div><span style={{ color: 'var(--t3)' }}>Contact:</span> <strong style={{ color: '#fff' }}>{enq.contact_name}</strong></div>
              <div><span style={{ color: 'var(--t3)' }}>Platform:</span> <strong style={{ color: '#fff' }}>{enq.platform || 'TBD'}</strong></div>
              <div><span style={{ color: 'var(--t3)' }}>Timeline:</span> <strong style={{ color: '#fff' }}>{enq.timeline || 'Flexible'}</strong></div>
            </div>
          </div>

          {/* Original Brief */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 10 }}>Original Brief</h3>
            <p style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5, maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,.02)', padding: 10, borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
              {enq.brief}
            </p>
          </div>

          {/* Tips */}
          <div className="card" style={{ background: 'var(--gold-soft)', border: '1px solid var(--gold-border)' }}>
            <strong style={{ fontSize: 12, color: 'var(--gold-strong)', display: 'block', marginBottom: 6 }}>💡 Pitch Pro Tip</strong>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>
              Brands are 40% more likely to accept counter-offers when deliverables and usage terms are clearly listed upfront.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
