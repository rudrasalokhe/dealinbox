import React, { useState } from 'react';
import { Sparkles, Check, Zap, Shield, TrendingUp, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UpgradePage = () => {
  const { user } = useAuth();
  const [months, setMonths] = useState(1);
  const [upiTxn, setUpiTxn] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const prices = { 1: 199, 3: 499, 6: 899 };
  const selectedPrice = prices[months] || 199;

  const comparisonRows = [
    { feature: 'Active deals', free: 'Up to 20', pro: 'Unlimited' },
    { feature: 'Public intake page', free: '✓', pro: '✓ + Custom domain' },
    { feature: 'Priority heatmap', free: 'Basic', pro: 'Advanced scoring' },
    { feature: 'AI Deal Copilot', free: '—', pro: '✓ Full access' },
    { feature: 'CSV / Report export', free: '—', pro: '✓' },
    { feature: 'Negotiation replay', free: '—', pro: '✓' },
    { feature: 'Positioning engine', free: 'Basic', pro: 'Advanced + AI bio' },
  ];

  const handleUpiSubmit = async (e) => {
    e.preventDefault();
    if (!upiTxn.trim()) return;
    await fetch('/api/upgrade/upi-verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ txn_id: upiTxn, months }),
    });
    setSubmitted(true);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px',
          borderRadius: 999, background: 'var(--lime)', color: 'var(--lime-text)',
          fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', marginBottom: 14
        }}>
          <Sparkles size={14} /> DEALINBOX PRO
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>
          Supercharge your creator revenue.
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: 14.5, maxWidth: 560, margin: '0 auto' }}>
          Unlock unlimited brand inquiries, AI copilot, analytics export, priority heatmap, and positioning tools.
        </p>
      </div>

      {/* Free pro window */}
      {user?.free_pro_window && (
        <div style={{
          padding: '14px 20px', borderRadius: 14, background: 'var(--green-soft)',
          border: '1px solid var(--green-border)', marginBottom: 24, fontSize: 13.5
        }}>
          <strong>🎉 Free Pro window active!</strong>
          <p style={{ marginTop: 4, color: 'var(--t2)' }}>You have Pro features enabled free until your trial ends. Upgrade now to keep access.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        {/* ── LEFT: Comparison table ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 18 }}>Plan Comparison</h2>

            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', gap: 8, padding: '10px 0', borderBottom: '1.5px solid var(--border)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--t3)' }}>
              <span>Feature</span>
              <span style={{ textAlign: 'center' }}>Free</span>
              <span style={{ textAlign: 'center', color: 'var(--primary)' }}>Pro ✨</span>
            </div>

            {/* Table Rows */}
            {comparisonRows.map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 140px', gap: 8,
                padding: '12px 0', borderBottom: '1px solid var(--border)',
                fontSize: 13.5, color: 'var(--t1)'
              }}>
                <span style={{ fontWeight: 600 }}>{row.feature}</span>
                <span style={{ textAlign: 'center', color: 'var(--t2)' }}>{row.free}</span>
                <span style={{ textAlign: 'center', color: 'var(--primary)', fontWeight: 700 }}>{row.pro}</span>
              </div>
            ))}
          </div>

          {/* Why upgrade */}
          <div style={{ background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 18 }}>Why creators upgrade</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: <Zap size={18} color="var(--primary)" />, title: 'Never lose a deal', desc: 'Unlimited active deals means no more archiving promising leads.' },
                { icon: <TrendingUp size={18} color="var(--green)" />, title: 'Know your numbers', desc: 'Full CSV export for your accountant. Monthly earnings breakdowns.' },
                { icon: <Compass size={18} color="var(--gold)" />, title: 'Position higher', desc: 'AI-powered bio suggestions that help you attract ₹50K+ brands.' },
                { icon: <Shield size={18} color="var(--blue)" />, title: 'Negotiate smarter', desc: 'Replay and analyze past negotiations to improve future outcomes.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'var(--canvas-subtle)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <strong style={{ fontSize: 14.5, color: 'var(--t1)', display: 'block', fontWeight: 700 }}>{item.title}</strong>
                    <span style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Payment ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Duration selector */}
          <div style={{ background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>Select Duration</h3>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 14 }}>Save more with longer plans.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { m: 1, label: '1 month', price: '₹199' },
                { m: 3, label: '3 months', price: '₹499', save: 'Save ₹98' },
                { m: 6, label: '6 months', price: '₹899', save: 'Save ₹295' },
              ].map((opt) => (
                <button
                  key={opt.m}
                  onClick={() => setMonths(opt.m)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: 14,
                    background: months === opt.m ? 'var(--mint)' : 'var(--canvas-subtle)',
                    border: months === opt.m ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    fontWeight: 600, fontSize: 14, color: 'var(--t1)'
                  }}
                >
                  <span>{opt.label}</span>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: 'var(--t1)', fontSize: 16 }}>{opt.price}</strong>
                    {opt.save && <span style={{ display: 'block', fontSize: 11, color: 'var(--green)', fontWeight: 700, marginTop: 2 }}>{opt.save}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Razorpay */}
          <div style={{ background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>Pay Online</h3>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 14 }}>Cards, wallets, UPI, net banking</p>
            <button
              className="btn btn-primary btn-full"
              onClick={() => {
                if (window.Razorpay) {
                  const rzp = new window.Razorpay({ key: 'rzp_test_placeholder', amount: selectedPrice * 100, currency: 'INR', name: 'DealInbox Pro', description: `${months}mo Pro plan`, handler: () => setSubmitted(true) });
                  rzp.open();
                }
              }}
              style={{
                height: 48, borderRadius: 14, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'var(--primary)', boxShadow: '0 4px 14px rgba(22, 78, 67, 0.2)'
              }}
            >
              <Sparkles size={16} /> Pay ₹{selectedPrice} with Razorpay
            </button>
          </div>

          {/* UPI */}
          <div style={{ background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ textAlign: 'center', color: 'var(--t3)', fontSize: 12.5, fontWeight: 600, marginBottom: 16 }}>
              — or pay via UPI —
            </div>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{
                width: 110, height: 110, margin: '0 auto 8px',
                background: 'var(--canvas-subtle)', border: '1.5px solid var(--border)',
                borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--t3)', fontSize: 11
              }}>
                QR Code
              </div>
              <p style={{ fontSize: 12, color: 'var(--t3)' }}>Scan to pay ₹{selectedPrice}</p>
            </div>

            <a
              href={`upi://pay?pa=dealinbox@upi&pn=DealInbox&am=${selectedPrice}&cu=INR&tn=DealInbox_Pro_${months}mo`}
              className="btn btn-secondary btn-full btn-sm"
              style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}
            >
              Open in UPI app
            </a>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Check size={32} color="var(--green)" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>Payment submitted! We'll verify within 15 minutes.</p>
              </div>
            ) : (
              <form onSubmit={handleUpiSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>UPI Transaction ID</label>
                  <input type="text" value={upiTxn} onChange={(e) => setUpiTxn(e.target.value)} placeholder="Enter 12-digit UPI ref" required />
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-sm" style={{ borderRadius: 12 }}>Verify payment</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
