import React, { useState } from 'react';
import { Sparkles, X, AlertTriangle, ShieldCheck, TrendingUp, Copy, Check, ArrowRight, Zap, RefreshCw } from 'lucide-react';

export const AiBriefAnalyzerModal = ({ isOpen, onClose, onDealCreated }) => {
  const [briefInput, setBriefInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const samplePresets = [
    {
      title: 'Mamaearth Brand Pitch',
      text: 'Hi Rudra! We love your tech & lifestyle content. We are launching our new Vitamin C daily glow serum and would love to partner for 1 dedicated Instagram Reel and 2 Stories before next Friday. Our budget for this campaign is Rs.25,000. Looking forward to hearing from you!',
    },
    {
      title: 'Noise Smartwatch (High Risk)',
      text: 'Hey Rudra, Noise team here! We need 1 product unboxing reel for our ColorFit Pro 5 smartwatch. We also require perpetual digital ad usage rights and Spark Ads access for Meta. Budget is INR 18,000 with payment on Net-60 terms.',
    },
    {
      title: 'Dream11 Matchday Campaign',
      text: 'Hi there, reaching out from Dream11 Sports Marketing. We want to collaborate for an IPL matchday preview reel + 3 interactive quiz stories encouraging followers to create fantasy teams. Campaign timeline is next weekend. Budget allocated is Rs.75,000.',
    },
  ];

  if (!isOpen) return null;

  const handleAnalyze = async (textToUse) => {
    const text = textToUse || briefInput;
    if (!text.trim()) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch('/api/ai/analyze-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ brief: text }),
      });
      const data = await res.json();
      if (data.ok) {
        setAnalysis(data);
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>AI Deal &amp; Brief Intelligence</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Paste raw brand pitch or email to extract deliverables, spot contract traps, and get counter-offers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Preset Buttons */}
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Quick Presets:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {samplePresets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setBriefInput(p.text);
                    handleAnalyze(p.text);
                  }}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  ⚡ {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Input Textarea */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <textarea
              rows={4}
              value={briefInput}
              onChange={(e) => setBriefInput(e.target.value)}
              placeholder="Paste raw email pitch, DM, or brief details here..."
              style={{
                width: '100%',
                fontSize: '13.5px',
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !briefInput.trim()}
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Run AI Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Display */}
          {analysis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Top Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Detected Brand</label>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#fff', marginTop: '4px' }}>{analysis.brand_name}</strong>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{analysis.deliverables?.join(' · ')}</span>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Offered vs Fair Rate</label>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#38bdf8', marginTop: '4px' }}>
                    ₹{analysis.offered_budget?.toLocaleString() || 'TBD'} &rarr; ₹{analysis.fair_market_value?.min?.toLocaleString()}–₹{analysis.fair_market_value?.max?.toLocaleString()}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#10b981' }}>Calculated fair market benchmark</span>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Urgency Leverage</label>
                  <strong style={{ display: 'block', fontSize: '18px', color: analysis.urgency?.score > 70 ? '#f59e0b' : '#10b981', marginTop: '4px' }}>
                    {analysis.urgency?.label} ({analysis.urgency?.score}/100)
                  </strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{analysis.urgency?.description}</span>
                </div>
              </div>

              {/* Contract Risk Radar */}
              <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                  <AlertTriangle size={16} color="#f43f5e" /> Contract Risk Radar
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysis.risk_radar?.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: r.severity === 'high' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        border: `1px solid ${r.severity === 'high' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: r.severity === 'high' ? '#fb7185' : '#fcd34d' }}>{r.flag}</strong>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: r.severity === 'high' ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)', color: '#fff', fontWeight: 700 }}>
                          {r.severity} severity
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>{r.warning}</p>
                      <div style={{ fontSize: '11.5px', color: '#38bdf8', background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '6px' }}>
                        🛡️ <strong>Recommended Clause</strong>: {r.counter_clause}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counter Pitch Draft */}
              <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                    <Zap size={16} color="#6366f1" /> AI Counter-Pitch Draft
                  </h4>
                  <button
                    onClick={() => handleCopy(analysis.counter_draft)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    {copiedDraft ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    {copiedDraft ? 'Copied to Clipboard!' : 'Copy Pitch'}
                  </button>
                </div>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {analysis.counter_draft}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
