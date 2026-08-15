import React, { useState } from 'react';
import { Sparkles, Check, Zap, Shield, TrendingUp, Compass, Download, Eye } from 'lucide-react';
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
    <div className="billing-shell">
      {/* Hero */}
      <div className="billing-hero">
        <div className="db-eyebrow" style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>DealInbox Pro</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', lineHeight: 0.95, margin: '8px 0' }}>Supercharge your creator revenue.</h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: 13, textTransform: 'uppercase', maxWidth: 600, margin: '0 auto' }}>Unlock unlimited brand inquiries, AI copilot, analytics export, priority heatmap, and positioning tools.</p>
      </div>

      {/* Free pro window */}
      {user?.free_pro_window && (
        <div className="billing-banner">
          <strong>🎉 Free Pro window active!</strong>
          <p>You have Pro features enabled free until your trial ends. Upgrade now to keep access.</p>
        </div>
      )}

      <div className="billing-layout">
        {/* ── LEFT: Comparison table ── */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Plan Comparison</h2>
            <div className="billing-table">
              <div><span>Feature</span><span>Free</span><span>Pro ✨</span></div>
              {comparisonRows.map((row, i) => (
                <div key={i}>
                  <span>{row.feature}</span>
                  <span>{row.free}</span>
                  <span>{row.pro}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Why upgrade */}
          <div className="card">
            <h2 className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Why creators upgrade</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: <Zap size={18} color="var(--accent)" />, title: 'Never lose a deal', desc: 'Unlimited active deals means no more archiving promising leads.' },
                { icon: <TrendingUp size={18} color="var(--green)" />, title: 'Know your numbers', desc: 'Full CSV export for your accountant. Monthly earnings breakdowns.' },
                { icon: <Compass size={18} color="var(--gold)" />, title: 'Position higher', desc: 'AI-powered bio suggestions that help you attract ₹50K+ brands.' },
                { icon: <Shield size={18} color="var(--blue)" />, title: 'Negotiate smarter', desc: 'Replay and analyze past negotiations to improve future outcomes.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <strong style={{ fontSize: 14, color: '#fff', display: 'block' }}>{item.title}</strong>
                    <span style={{ fontSize: 12.5, color: 'var(--t3)' }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Payment ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Duration selector */}
          <div className="card">
            <div className="checkout-label">Select Duration</div>
            <div className="checkout-sub">Save more with longer plans.</div>
            <div className="upi-month-opts">
              {[{ m: 1, label: '1 month', price: '₹199' }, { m: 3, label: '3 months', price: '₹499', save: 'Save ₹98' }, { m: 6, label: '6 months', price: '₹899', save: 'Save ₹295' }].map((opt) => (
                <div key={opt.m} className={`umo ${months === opt.m ? 'active' : ''}`} onClick={() => setMonths(opt.m)}>
                  {opt.label}<br /><strong>{opt.price}</strong>
                  {opt.save && <small style={{ color: 'var(--green)' }}>{opt.save}</small>}
                </div>
              ))}
            </div>
          </div>

          {/* Razorpay */}
          <div className="card">
            <div className="checkout-label">Pay Online</div>
            <div className="checkout-sub">Cards, wallets, UPI, net banking</div>
            <button
              className="btn btn-gold btn-full"
              onClick={() => {
                if (window.Razorpay) {
                  const rzp = new window.Razorpay({ key: 'rzp_test_placeholder', amount: selectedPrice * 100, currency: 'INR', name: 'DealInbox Pro', description: `${months}mo Pro plan`, handler: () => setSubmitted(true) });
                  rzp.open();
                }
              }}
            >
              <Sparkles size={16} /> Pay ₹{selectedPrice} with Razorpay
            </button>
          </div>

          {/* UPI */}
          <div className="card">
            <div className="bill-sep"><span>or pay via UPI</span></div>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ width: 120, height: 120, margin: '0 auto 8px', background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t4)', fontSize: 11 }}>
                QR Code
              </div>
              <p style={{ fontSize: 11, color: 'var(--t3)' }}>Scan to pay ₹{selectedPrice}</p>
            </div>
            <a href={`upi://pay?pa=dealinbox@upi&pn=DealInbox&am=${selectedPrice}&cu=INR&tn=DealInbox_Pro_${months}mo`} className="btn btn-secondary btn-full btn-sm" style={{ marginBottom: 12 }}>
              Open in UPI app
            </a>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Check size={32} color="var(--green)" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>Payment submitted! We'll verify within 15 minutes.</p>
              </div>
            ) : (
              <form onSubmit={handleUpiSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="fg" style={{ marginBottom: 0 }}>
                  <label>UPI Transaction ID</label>
                  <input type="text" value={upiTxn} onChange={(e) => setUpiTxn(e.target.value)} placeholder="Enter 12-digit UPI ref" required />
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-sm">Verify payment</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
