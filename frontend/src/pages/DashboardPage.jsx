import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  ArrowRight, 
  Sparkles, 
  ExternalLink, 
  Film, 
  Tv, 
  Repeat, 
  Zap, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { AiBriefAnalyzerModal } from '../components/AiBriefAnalyzerModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/dashboard-data', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--t2)' }}>
      <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
      <p style={{ fontSize: '14px', fontWeight: 500 }}>Loading DealInbox workspace...</p>
    </div>
  );

  if (!data) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--red)' }}>
      <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
      <p>Failed to load dashboard data. Please refresh or try logging in again.</p>
    </div>
  );

  const kpis = [
    { label: 'Active Pipeline Value', value: `₹${(data.stats?.total_val || 0).toLocaleString()}`, sub: 'Active & closed deals', color: 'gold', valueColor: 'var(--t1)' },
    { label: 'New Enquiries', value: data.stats?.new_count ?? 0, sub: 'Requires creator review', color: 'blue', valueColor: 'var(--primary)' },
    { label: 'Win Conversion Rate', value: `${data.stats?.conversion ?? 0}%`, sub: `${data.stats?.accepted ?? 0} of ${data.stats?.total ?? 0} signed`, color: 'green', valueColor: 'var(--green)' },
    { label: 'Profile Readiness', value: `${data.stats?.profile_completion_pct ?? 0}%`, sub: 'Intake readiness score', color: 'red', valueColor: 'var(--primary)' },
  ];

  const formats = [
    { name: 'Reels & Shorts', icon: Film, count: 'Fast turnaround' },
    { name: 'Dedicated Video', icon: Tv, count: 'High CPM value' },
    { name: 'Stories & Links', icon: Sparkles, count: '24h quick burst' },
    { name: 'Brand Retainers', icon: Repeat, count: 'Predictable MRR' },
  ];

  const recentDeals = (data.recent || []).filter(deal => 
    !searchQuery || 
    deal.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.deliverables?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      
      {/* ── Top Search Input (Exact replica of top search bar in Image 1) ── */}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search brand deals, sponsors, deliverables..."
          style={{
            height: 52,
            paddingLeft: 46,
            borderRadius: 16,
            background: '#ffffff',
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            fontSize: 14.5
          }}
        />
        <Search
          size={19}
          color="var(--t3)"
          style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
      </div>

      {/* ── Deep Forest Pine Hero Banner (Exact replica of Image 1) ── */}
      <div style={{
        background: 'var(--primary)',
        borderRadius: 24,
        padding: '32px 36px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        boxShadow: '0 8px 24px rgba(22, 78, 67, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 540 }}>
          {/* Fresh Pistachio Lime Pill Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'var(--lime)',
            color: 'var(--lime-text)',
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 14
          }}>
            CARE THAT FITS YOUR WORKFLOW · AI COPILOT
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: 10,
            color: '#ffffff'
          }}>
            Your next brand deal, closed faster with AI.
          </h1>

          <p style={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: 14.5, lineHeight: 1.5 }}>
            Automated brief parsing, contract guardrails, and fair CPM benchmarks for modern creators.
          </p>
        </div>

        {/* Circular Lime Arrow CTA Button (Image 1) */}
        <button
          type="button"
          onClick={() => setShowAnalyzer(true)}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--lime)',
            color: 'var(--lime-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
          title="Open AI Brief Analyzer"
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <ArrowRight size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Format Categories (Mirrors 'Find your specialist' from Image 1) ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>
            Campaign formats
          </h2>
          <Link to="/enquiries" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--primary)' }}>
            See all
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
          {formats.map((fmt, i) => {
            const Icon = fmt.icon;
            return (
              <Link
                to="/enquiries"
                key={i}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid var(--border)',
                  borderRadius: 18,
                  padding: '20px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 10,
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--mint)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={22} />
                </div>
                <div>
                  <strong style={{ fontSize: 14, color: 'var(--t1)', display: 'block', fontWeight: 700 }}>
                    {fmt.name}
                  </strong>
                  <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                    {fmt.count}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Active Inbounds & Deals (Mirrors 'Your next appointment' from Image 1) ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>
            Your incoming brand deals
          </h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <a
              href={`/@${data.username}`}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <ExternalLink size={14} /> View public intake page
            </a>
          </div>
        </div>

        {recentDeals.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1.5px solid var(--border)',
            padding: '40px 24px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📬</p>
            <strong style={{ fontSize: 16, color: 'var(--t1)', display: 'block', marginBottom: 4 }}>
              No incoming deals yet
            </strong>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', maxWidth: 360, margin: '0 auto 16px' }}>
              Share your link <strong>dealsinbox.in/@{data.username}</strong> in your bio to receive structured sponsorship proposals.
            </p>
            <a
              href={`/@${data.username}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: 12 }}
            >
              Test your public intake form →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentDeals.map((deal) => (
              <div
                key={deal.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 18,
                  border: '1.5px solid var(--border)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Brand Squircle Avatar & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--mint)',
                    color: 'var(--primary)',
                    fontWeight: 800,
                    fontSize: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {deal.brand_name?.[0]?.toUpperCase() || 'B'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>
                      {deal.brand_name}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 2 }}>
                      {deal.deliverables || 'Sponsorship Campaign'} · <strong style={{ color: 'var(--primary)' }}>{deal.budget}</strong>
                    </p>
                  </div>
                </div>

                {/* Soft Mint Pill Button (Image 1 'Video visit' button) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: deal.status === 'new' ? 'var(--mint)' : 'var(--canvas-subtle)',
                    color: deal.status === 'new' ? 'var(--primary)' : 'var(--t2)'
                  }}>
                    {deal.status_label || deal.status}
                  </span>

                  <Link
                    to={`/enquiries/${deal.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'var(--mint)',
                      color: 'var(--primary)',
                      padding: '8px 16px',
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--mint-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--mint)'}
                  >
                    Analyze deal →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── KPIs Overview Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {kpis.map((k, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              borderRadius: 18,
              border: '1.5px solid var(--border)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>
              {k.label}
            </span>
            <strong style={{ fontSize: 24, fontWeight: 800, color: k.valueColor, display: 'block', lineHeight: 1.2 }}>
              {k.value}
            </strong>
            <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Modal for AI Brief Analyzer */}
      <AiBriefAnalyzerModal isOpen={showAnalyzer} onClose={() => setShowAnalyzer(false)} />
    </div>
  );
};
