import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldAlert, CheckCircle, Zap, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

export const HeroEditorialStagger = () => {
  const [activeDealIndex, setActiveDealIndex] = useState(0);

  const sampleDeals = [
    {
      brand: 'Dream11',
      tag: 'Sports Marketing',
      scope: '1x Matchday Reel + 3x Story Quizzes',
      budget: '₹75,000',
      fairRate: '₹85,000 – ₹95,000',
      aiInsight: 'High Urgency (IPL Weekend). Recommended: Anchor at ₹90,000 bundled with Link in Bio for 7 days.',
      status: 'Active Deal',
      risk: 'Low Risk',
      riskColor: '#10b981',
    },
    {
      brand: 'Boat Lifestyle',
      tag: 'Consumer Tech',
      scope: '1x Unboxing Reel + 2x Stories',
      budget: '₹45,000',
      fairRate: '₹55,000 – ₹65,000',
      aiInsight: '🚨 Risk Detected: Brand requested "Perpetual Spark Ad Rights". Limit rights to 30 days at +₹12,000 fee.',
      status: 'In Review',
      risk: 'Perpetual Ad Rights Flagged',
      riskColor: '#f43f5e',
    },
    {
      brand: 'Myntra',
      tag: 'Fashion & E-Commerce',
      scope: '2x Festive Lookbook Reels',
      budget: '₹90,000',
      fairRate: '₹90,000',
      aiInsight: 'Great deal structure. 50% advance invoice approved. Scheduled for festive sale kickoff.',
      status: 'Accepted',
      risk: 'Contract Approved',
      riskColor: '#10b981',
    },
  ];

  const currentDeal = sampleDeals[activeDealIndex];

  return (
    <div style={{ background: 'var(--canvas)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {/* ── TOP ANNOUNCEMENT BAR ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 32px',
          borderBottom: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--t2)',
          background: 'rgba(15, 23, 42, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} /> DEALINBOX AI 2.0
          </span>
          <span style={{ color: 'var(--t3)' }}>|</span>
          <span>The Sponsorship &amp; Negotiation OS for Creators</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="tilted-badge acid">✦ LIVE ON DEALSINBOX.IN</span>
        </div>
      </div>

      <div style={{ padding: '72px 24px 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', alignItems: 'center' }}>
          {/* Left Column: Headline & Value Prop */}
          <div>
            <div className="mono-label" style={{ marginBottom: '16px' }}>
              <Sparkles size={14} /> AI-POWERED CREATOR SPONSORSHIP WORKSPACE
            </div>

            <h1
              style={{
                fontSize: 'clamp(40px, 6vw, 62px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.08,
                color: '#fff',
                marginBottom: '20px',
              }}
            >
              Never Leave Money on the Table.{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #818cf8, #38bdf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Negotiate with AI.
              </span>
            </h1>

            <p
              style={{
                fontSize: '17px',
                color: 'var(--t2)',
                lineHeight: 1.6,
                marginBottom: '36px',
                maxWidth: '560px',
              }}
            >
              Replace messy DM threads with a single bio intake link. DealInbox uses AI to parse brand briefs, flag predatory contract clauses, benchmark fair market rates, and generate high-converting counter-offers.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '40px' }}>
              <Link to="/signup" className="btn btn-primary btn-xl" style={{ gap: '8px' }}>
                Launch Free Workspace <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-xl">
                ⚡ 1-Click Instant Demo
              </Link>
            </div>

            {/* Micro proof metrics */}
            <div style={{ display: 'flex', gap: '28px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              <div>
                <strong style={{ fontSize: '20px', color: '#fff', display: 'block', fontWeight: 800 }}>₹1.8 Cr+</strong>
                <span style={{ fontSize: '12px', color: 'var(--t3)' }}>Brand Deals Tracked</span>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <strong style={{ fontSize: '20px', color: 'var(--green)', display: 'block', fontWeight: 800 }}>+34%</strong>
                <span style={{ fontSize: '12px', color: 'var(--t3)' }}>Average Rate Uplift</span>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <strong style={{ fontSize: '20px', color: 'var(--accent)', display: 'block', fontWeight: 800 }}>&lt; 24h</strong>
                <span style={{ fontSize: '12px', color: 'var(--t3)' }}>Deal Turnaround</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Deal Intelligence Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 35px rgba(99, 102, 241, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Live Deal Radar
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {sampleDeals.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveDealIndex(i)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: activeDealIndex === i ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                      color: activeDealIndex === i ? '#fff' : 'var(--t2)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    {d.brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Deal Card Header */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{currentDeal.brand}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--t2)' }}>{currentDeal.tag} · {currentDeal.scope}</span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    background: currentDeal.status === 'Accepted' ? 'var(--green-soft)' : 'var(--accent-soft)',
                    color: currentDeal.status === 'Accepted' ? '#34d399' : '#a5b4fc',
                    border: `1px solid ${currentDeal.status === 'Accepted' ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
                  }}
                >
                  {currentDeal.status}
                </span>
              </div>

              {/* Rate & Benchmark comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 600 }}>Brand Offer</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{currentDeal.budget}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 600 }}>AI Fair Benchmark</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>{currentDeal.fairRate}</div>
                </div>
              </div>
            </div>

            {/* AI Insight Box */}
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={15} color="#818cf8" />
                <strong style={{ fontSize: '12.5px', color: '#a5b4fc' }}>Deal Copilot Assessment</strong>
              </div>
              <p style={{ fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.55 }}>
                {currentDeal.aiInsight}
              </p>
            </div>

            {/* Risk Flag Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                fontSize: '12.5px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentDeal.riskColor }} />
                <span style={{ color: 'var(--t2)' }}>Contract Safety:</span>
                <strong style={{ color: '#fff' }}>{currentDeal.risk}</strong>
              </div>
              <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Full Brief &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
