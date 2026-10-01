import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Zap, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

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
      risk: 'Contract Verified',
      riskColor: '#4ade80',
    },
    {
      brand: 'Boat Lifestyle',
      tag: 'Consumer Tech',
      scope: '1x Unboxing Reel + 2x Stories',
      budget: '₹45,000',
      fairRate: '₹55,000 – ₹65,000',
      aiInsight: '🚨 Risk Detected: Brand requested "Perpetual Spark Ad Rights". Limit rights to 30 days at +₹12,000 fee.',
      status: 'In Review',
      risk: 'Perpetual Rights Flagged',
      riskColor: '#fb7185',
    },
    {
      brand: 'Myntra',
      tag: 'Fashion & E-Commerce',
      scope: '2x Festive Lookbook Reels',
      budget: '₹90,000',
      fairRate: '₹90,000',
      aiInsight: 'Great deal structure. 50% advance invoice approved. Scheduled for festive sale kickoff.',
      status: 'Accepted',
      risk: '50% Advance Confirmed',
      riskColor: '#4ade80',
    },
  ];

  const currentDeal = sampleDeals[activeDealIndex];

  return (
    <div style={{ background: 'var(--canvas)', color: 'var(--t1)', position: 'relative', overflow: 'hidden' }}>
      
      {/* ── TOP ANNOUNCEMENT BAR (Clean Cream & Pine Pill) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 32px',
          borderBottom: '1px solid var(--border)',
          fontSize: '12.5px',
          color: 'var(--t2)',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} /> DEALINBOX AI 2.0
          </span>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <span style={{ color: 'var(--t2)', fontWeight: 500 }}>The Sponsorship &amp; Negotiation OS for Creators</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            background: 'var(--lime)',
            color: 'var(--lime-text)',
            fontWeight: 800,
            fontSize: '11px',
            padding: '3px 10px',
            borderRadius: '9999px',
            letterSpacing: '0.04em'
          }}>
            ✦ LIVE ON DEALSINBOX.IN
          </span>
        </div>
      </div>

      <div style={{ padding: '64px 24px 72px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', alignItems: 'center' }}>
          
          {/* Left Column: Headline, Typography & Value Prop */}
          <div>
            {/* Mint Pill Eyebrow */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'var(--mint)',
              color: 'var(--primary)',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.04em',
              marginBottom: 20
            }}>
              <Sparkles size={14} /> AI-POWERED CREATOR SPONSORSHIP WORKSPACE
            </div>

            {/* Main Headline with High Contrast Deep Forest Font and Emerald Gradient */}
            <h1
              style={{
                fontSize: 'clamp(42px, 5.5vw, 62px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: 'var(--t1)',
                marginBottom: '20px',
              }}
            >
              Never Leave Money on the Table.{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #164e43 0%, #15803d 50%, #22c55e 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}
              >
                Negotiate with AI.
              </span>
            </h1>

            {/* Subheading */}
            <p
              style={{
                fontSize: '17px',
                color: 'var(--t2)',
                lineHeight: 1.65,
                marginBottom: '36px',
                maxWidth: '540px',
              }}
            >
              Replace messy DM threads with a single bio intake link. DealInbox uses AI to parse brand briefs, flag predatory contract clauses, benchmark fair market rates, and generate high-converting counter-offers.
            </p>

            {/* CTAs with Rich Forest Pine and Clean White Textures */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '40px' }}>
              <Link
                to="/signup"
                className="btn btn-primary btn-xl"
                style={{
                  background: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 15,
                  padding: '14px 28px',
                  borderRadius: 16,
                  boxShadow: '0 6px 20px rgba(22, 78, 67, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Launch Free Workspace <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="btn btn-secondary btn-xl"
                style={{
                  background: '#ffffff',
                  color: 'var(--t1)',
                  fontWeight: 700,
                  fontSize: 15,
                  padding: '14px 26px',
                  borderRadius: 16,
                  border: '1.5px solid var(--border-strong)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                ⚡ 1-Click Instant Demo
              </Link>
            </div>

            {/* Micro proof metrics */}
            <div style={{ display: 'flex', gap: '28px', borderTop: '1.5px solid var(--border)', paddingTop: '24px' }}>
              <div>
                <strong style={{ fontSize: '22px', color: 'var(--t1)', display: 'block', fontWeight: 800 }}>
                  ₹1.8 Cr+
                </strong>
                <span style={{ fontSize: '12.5px', color: 'var(--t3)' }}>Brand Deals Tracked</span>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <strong style={{ fontSize: '22px', color: 'var(--primary)', display: 'block', fontWeight: 800 }}>
                  +34%
                </strong>
                <span style={{ fontSize: '12.5px', color: 'var(--t3)' }}>Average Rate Uplift</span>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <strong style={{ fontSize: '22px', color: 'var(--t1)', display: 'block', fontWeight: 800 }}>
                  &lt; 24h
                </strong>
                <span style={{ fontSize: '12.5px', color: 'var(--t3)' }}>Deal Turnaround</span>
              </div>
            </div>
          </div>

          {/* Right Column: Deep Forest Pine Showcase Card (Mixing Rich Green Textures) */}
          <div
            style={{
              background: 'linear-gradient(155deg, #164e43 0%, #113d35 60%, #0c2c26 100%)',
              border: '1.5px solid rgba(217, 249, 157, 0.25)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 24px 60px -12px rgba(12, 45, 38, 0.35), 0 0 30px rgba(22, 78, 67, 0.25)',
              color: '#ffffff',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Subtle Texture Glow */}
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-20%',
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(217, 249, 157, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            {/* Top Bar with Live Indicator & Brand Pills */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#4ade80',
                  boxShadow: '0 0 10px #4ade80'
                }} />
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                      padding: '5px 11px',
                      borderRadius: '8px',
                      background: activeDealIndex === i ? 'var(--lime)' : 'rgba(255, 255, 255, 0.1)',
                      color: activeDealIndex === i ? 'var(--lime-text)' : 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all .15s ease',
                    }}
                  >
                    {d.brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Deal Showcase Card Header */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              padding: '22px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15 }}>
                    {currentDeal.brand}
                  </h3>
                  <span style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.72)', marginTop: 4, display: 'block' }}>
                    {currentDeal.tag} · {currentDeal.scope}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    background: 'var(--lime)',
                    color: 'var(--lime-text)',
                  }}
                >
                  {currentDeal.status}
                </span>
              </div>

              {/* Rate & Benchmark comparison */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Brand Offer
                  </span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                    {currentDeal.budget}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--lime)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    AI Fair Benchmark
                  </span>
                  <div style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--lime)',
                    marginTop: '2px',
                    textShadow: '0 0 16px rgba(217, 249, 157, 0.35)'
                  }}>
                    {currentDeal.fairRate}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insight Box (Mint Chip & Pine Contrast) */}
            <div
              style={{
                background: 'rgba(226, 244, 234, 0.12)',
                border: '1px solid rgba(217, 249, 157, 0.3)',
                borderRadius: '16px',
                padding: '16px 18px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={16} color="var(--lime)" />
                <strong style={{ fontSize: '12.5px', color: 'var(--lime)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Deal Copilot Assessment
                </strong>
              </div>
              <p style={{ fontSize: '13px', color: '#f0fdf4', lineHeight: 1.55 }}>
                {currentDeal.aiInsight}
              </p>
            </div>

            {/* Risk Flag Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentDeal.riskColor }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Contract Safety:</span>
                <strong style={{ color: '#ffffff' }}>{currentDeal.risk}</strong>
              </div>
              <Link
                to="/login"
                style={{
                  color: 'var(--lime)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none'
                }}
              >
                Inspect Brief &rarr;
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
