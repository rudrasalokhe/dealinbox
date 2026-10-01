import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroEditorialStagger } from '../components/HeroEditorialStagger';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, ArrowRight, Sparkles, AlertTriangle, ShieldCheck, Zap, TrendingUp, DollarSign, Copy, Check } from 'lucide-react';

const CheckIcon = ({ color = 'var(--green)' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" style={{ width: 16, height: 16, flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" />
  </svg>
);

export const LandingPage = () => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const [submittingDemo, setSubmittingDemo] = useState(false);

  // Interactive Live AI Brief Demo state
  const [liveBrief, setLiveBrief] = useState(
    "Hi Rudra! We love your content. We are launching our new Vitamin C skincare range and would love to partner for 1 dedicated Instagram Reel and 2 Stories before next Friday. Our budget for this campaign is Rs.25,000. We also request 30 days Spark Ads whitelisting."
  );
  const [liveResult, setLiveResult] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  const presets = [
    {
      name: 'Mamaearth Launch',
      text: 'Hi Rudra! We love your content. We are launching our new Vitamin C skincare range and would love to partner for 1 dedicated Instagram Reel and 2 Stories before next Friday. Our budget for this campaign is Rs.25,000. We also request 30 days Spark Ads whitelisting.',
    },
    {
      name: 'Noise Smartwatch (High Risk)',
      text: 'Hey Rudra, Noise team here! We need 1 unboxing reel for our ColorFit Pro 5 smartwatch. We require perpetual digital ad usage rights and Spark Ads access for Meta. Budget is INR 18,000 with payment on Net-60 terms.',
    },
    {
      name: 'Dream11 Sports Collab',
      text: 'Hi there, reaching out from Dream11 Sports Marketing. We want to collaborate for an IPL matchday preview reel + 3 interactive quiz stories encouraging followers to create fantasy teams. Campaign timeline is next weekend. Budget allocated is Rs.75,000.',
    },
  ];

  const handleRunLiveDemo = async (customText) => {
    const textToRun = customText || liveBrief;
    if (!textToRun.trim()) return;
    setLiveLoading(true);
    setLiveResult(null);

    try {
      const res = await fetch('/api/ai/analyze-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: textToRun }),
      });
      const data = await res.json();
      if (data.ok) {
        setLiveResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLiveLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setSubmittingDemo(true);
    const res = await demoLogin();
    setSubmittingDemo(false);
    if (res.success) navigate('/dashboard');
    else navigate('/login');
  };

  const tickerItems = [
    { dot: 'green', text: <><strong>@priyasharma</strong> signed a ₹55,000 Reel deal with Mamaearth</> },
    { dot: 'gold', text: <><strong>Dream11</strong> initiated a ₹75,000 IPL brief on DealInbox</> },
    { dot: '', text: <><strong>₹1.8 Cr+</strong> creator sponsorship volume tracked this quarter</> },
    { dot: 'green', text: <><strong>@techrohan</strong> countered Boat at ₹65,000 with AI Copilot</> },
    { dot: 'gold', text: <><strong>Nykaa</strong> booked 4 Reels with @nehamukherjee</> },
  ];

  const features = [
    {
      icon: '🤖',
      title: 'AI Contract Risk Radar',
      desc: 'Never give away perpetual ad rights or sign predatory Net-90 payment terms. DealInbox flags red-flag clauses and generates protective legal addendums.',
    },
    {
      icon: '💰',
      title: 'Dynamic Rate Benchmarks',
      desc: 'Know your exact market rate. Calculate fair compensation for Reels, YouTube integrations, usage rights, and category exclusivity based on reach.',
    },
    {
      icon: '⚡',
      title: 'Multi-Strategy AI Negotiator',
      desc: 'One click generates 3 tactical responses: Value Upsell, Scope Boundary, and Professional Close. Stop guessing what to reply to brand budget offers.',
    },
    {
      icon: '🔗',
      title: 'One Link for Your Bio',
      desc: 'Share dealsinbox.in/@username. Brands fill a structured intake brief — budget, deliverables, timeline — instead of chaotic Instagram DMs.',
    },
    {
      icon: '📊',
      title: 'Visual Deal Pipeline',
      desc: 'Track every deal from inbound brief to live deliverable and invoice payment. Never lose an opportunity in an unread thread.',
    },
    {
      icon: '💳',
      title: 'Milestone Payments & Tracking',
      desc: 'Integrated with Razorpay & UPI. Require 50% advance deposits upfront and provide brands with a dedicated tracking portal.',
    },
  ];

  const testimonials = [
    {
      name: 'Rohan K.',
      tag: '1.2M · Tech Creator',
      text: "The AI Brief Analyzer spotted that a top audio brand was asking for 'perpetual paid ad rights' for only ₹20,000. I used the AI counter-offer script and closed at ₹60,000 for 30-day rights. It literally paid for itself 100x over.",
    },
    {
      name: 'Priya S.',
      tag: '850K · Lifestyle & Beauty',
      text: "I used to have thirty unread emails and random WhatsApp chats from PR agencies. With my DealInbox link, brands submit proper budgets upfront. My average deal value went up 40% in two months.",
    },
    {
      name: 'Sneha M.',
      tag: '450K · Fitness & Sports',
      text: "Brand agencies love the structured portal. They said it was the cleanest, most professional creator intake they had ever seen. Closed 3 retainer sponsorships in my first week.",
    },
  ];

  return (
    <div style={{ background: 'var(--canvas)', color: 'var(--t1)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── TOP NAV ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-logo">
          <img src="/static/logo.jpeg" alt="DealInbox Logo" />
          DealInbox
        </Link>
        <div className="lp-nav-links">
          <a href="#ai-demo">AI Demo</a>
          <a href="#features">Features</a>
          <a href="#testimonials">Creators</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleDemoClick}
            disabled={submittingDemo}
            className="btn btn-secondary btn-sm"
            style={{ color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.4)' }}
          >
            {submittingDemo ? 'Loading...' : '⚡ Instant Demo'}
          </button>
          <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Launch workspace</Link>
        </div>
      </nav>

      {/* ── LIVE TICKER ── */}
      <div className="live-ticker-wrap">
        <div className="live-ticker-track">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <div className="ticker-item" key={i}>
              <span className={`ticker-dot ${t.dot}`} /> {t.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── HERO COMPONENT ── */}
      <HeroEditorialStagger />

      {/* ── LIVE INTERACTIVE AI BRIEF ANALYZER SANDBOX ── */}
      <section className="lp-section" id="ai-demo" style={{ paddingTop: '40px' }}>
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.6), 0 0 30px rgba(99, 102, 241, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
            <div>
              <span className="mono-label" style={{ marginBottom: '8px' }}>
                <Sparkles size={14} /> INTERACTIVE AI DEMO
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Test the Deal Intelligence Engine Live
              </h2>
              <p style={{ color: 'var(--t2)', fontSize: '14px', marginTop: '6px' }}>
                Paste any brand email or pitch below to extract deliverables, spot contract traps, and generate counter-offers in real-time.
              </p>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setLiveBrief(p.text);
                    handleRunLiveDemo(p.text);
                  }}
                  style={{
                    fontSize: '12px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ⚡ {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Action */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <textarea
              rows={3}
              value={liveBrief}
              onChange={(e) => setLiveBrief(e.target.value)}
              placeholder="Paste any brand collab pitch or DM here..."
              style={{
                width: '100%',
                fontSize: '14px',
                padding: '16px',
                borderRadius: '14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                lineHeight: 1.6,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                onClick={() => handleRunLiveDemo()}
                disabled={liveLoading || !liveBrief.trim()}
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontSize: '14px', gap: '8px' }}
              >
                {liveLoading ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing with AI Engine...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Analyze Deal with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Output */}
          {liveResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '24px',
              }}
            >
              {/* Card 1: Deliverables & Rate */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Scope &amp; Fair Value</span>
                <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '6px 0 10px' }}>
                  {liveResult.brand_name}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  {liveResult.deliverables?.map((d, idx) => (
                    <div key={idx} style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#10b981" /> {d}
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '12px', color: 'var(--t2)' }}>Brand Offer:</span>
                    <strong style={{ fontSize: '15px', color: '#fff' }}>₹{liveResult.offered_budget?.toLocaleString() || 'TBD'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#38bdf8' }}>AI Fair Market Rate:</span>
                    <strong style={{ fontSize: '18px', color: '#38bdf8' }}>
                      ₹{liveResult.fair_market_value?.min?.toLocaleString()} – ₹{liveResult.fair_market_value?.max?.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Contract Risk Radar */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '11px', color: '#f43f5e', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} /> Contract Safety Scan
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {liveResult.risk_radar?.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: r.severity === 'high' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        border: `1px solid ${r.severity === 'high' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      }}
                    >
                      <strong style={{ fontSize: '12.5px', color: r.severity === 'high' ? '#fb7185' : '#fcd34d', display: 'block' }}>
                        {r.flag}
                      </strong>
                      <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: '4px 0' }}>{r.warning}</p>
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                        Clause fix: {r.counter_clause}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Counter-Offer Script */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#818cf8', textTransform: 'uppercase', fontWeight: 700 }}>
                    AI Generated Counter-Offer
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(liveResult.counter_draft);
                      setCopiedPitch(true);
                      setTimeout(() => setCopiedPitch(false), 2000);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: copiedPitch ? '#10b981' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedPitch ? <Check size={12} /> : <Copy size={12} />}
                    {copiedPitch ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    lineHeight: 1.6,
                    color: '#e2e8f0',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '12px',
                    borderRadius: '10px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {liveResult.counter_draft}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="lp-section" id="features">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="lp-section-head"
        >
          <span className="lp-section-eyebrow">FEATURES</span>
          <h2>
            Engineered for High-Volume Creator Sponsorships
          </h2>
          <p style={{ color: 'var(--t2)', fontSize: '16px', marginTop: '8px' }}>
            No spreadsheets. No awkward rate discussions. Just a seamless, AI-assisted deal pipeline from brief to payment.
          </p>
        </motion.div>

        <div className="lp-feature-grid">
          {features.map((f, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              viewport={{ once: true }}
              className="lp-feature"
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-section" id="testimonials">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="lp-section-head"
        >
          <span className="lp-section-eyebrow">CREATOR STORIES</span>
          <h2>
            Loved by 2,400+ Creators Across India
          </h2>
          <p style={{ color: 'var(--t2)', fontSize: '16px', marginTop: '8px' }}>
            From tech YouTubers to beauty & lifestyle creators on Instagram.
          </p>
        </motion.div>

        <div className="lp-test-grid">
          {testimonials.map((t, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="lp-test-card"
            >
              <p className="lp-test-text">"{t.text}"</p>
              <div>
                <strong style={{ fontSize: '15px', color: '#fff', display: 'block' }}>{t.name}</strong>
                <span style={{ fontSize: '12px', color: 'var(--t3)' }}>{t.tag}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-section" id="pricing">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <span className="lp-section-eyebrow">PRICING</span>
          <h2>Simple, Transparent Pricing</h2>
          <p style={{ color: 'var(--t2)', fontSize: '16px', marginTop: '8px' }}>
            Start completely free. Upgrade to Pro as your brand sponsorship volume expands.
          </p>
        </motion.div>

        <div className="lp-pricing-grid">
          {/* Free Tier */}
          <motion.article className="lp-price-card">
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Starter</span>
            <div className="lp-price">₹0 <small>/month</small></div>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--t3)' }}>Everything to get started</p>
            <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: '13.5px', color: 'var(--t2)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckIcon /> 1 public DealInbox bio link</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckIcon /> Up to 20 active brand deals</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckIcon /> AI Brief Parser (Basic)</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckIcon /> Automated brand status tracking</li>
            </ul>
            <Link to="/signup" className="btn btn-secondary btn-full" style={{ marginTop: 28 }}>Start Free</Link>
          </motion.article>

          {/* Pro Tier */}
          <motion.article className="lp-price-card pro">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#818cf8' }}>Pro Creator</span>
              <span className="badge" style={{ background: 'var(--accent-soft)', color: '#a5b4fc', border: '1px solid var(--accent-border)' }}>
                Most Popular
              </span>
            </div>
            <div className="lp-price">₹199 <small>/month</small></div>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--t3)' }}>For professional and agency creators</p>
            <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: '13.5px', color: '#e2e8f0' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckIcon color="var(--accent)" /> <strong>Unlimited</strong> active deals</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckIcon color="var(--accent)" /> <strong>Full AI Copilot &amp; Risk Scanner</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckIcon color="var(--accent)" /> Dynamic rate card &amp; multi-strategy pitch</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckIcon color="var(--accent)" /> Earnings analytics &amp; CSV export</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckIcon color="var(--accent)" /> Priority brand positioning studio</li>
            </ul>
            <Link to="/signup" className="btn btn-primary btn-full" style={{ marginTop: 28 }}>
              Start Pro Trial →
            </Link>
          </motion.article>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="lp-final"
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            Ready to Take Control of Your Sponsorships?
          </h2>
          <p style={{ marginTop: 14, fontSize: '16px', color: 'var(--t2)' }}>
            Join 2,400+ creators who use DealInbox to protect their rates, spot contract traps, and close more deals.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '32px', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary btn-xl" style={{ padding: '16px 36px', gap: '8px' }}>
              Create your free workspace <ArrowRight size={18} />
            </Link>
            <button
              onClick={handleDemoClick}
              disabled={submittingDemo}
              className="btn btn-secondary btn-xl"
            >
              ⚡ 1-Click Instant Demo
            </button>
          </div>
          <small style={{ display: 'block', marginTop: 18, color: 'var(--t3)' }}>
            No credit card required · Free plan available · 2-minute setup
          </small>
        </div>
      </motion.section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', maxWidth: '1140px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/static/logo.jpeg" alt="Logo" style={{ width: 22, height: 22, borderRadius: 6 }} />
            <strong style={{ color: '#fff' }}>DealInbox</strong>
            <span style={{ color: 'var(--t3)' }}>· AI-Powered Sponsorship Workspace</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', color: 'var(--t2)', fontSize: '13px' }}>
            <a href="https://dealsinbox.in" target="_blank" rel="noreferrer">dealsinbox.in</a>
            <a href="https://github.com/rudrasalokhe/dealinbox" target="_blank" rel="noreferrer">GitHub</a>
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
