import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, CheckCircle2, Sparkles, Clock, AlertCircle, TrendingUp, Lightbulb, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { AiBriefAnalyzerModal } from '../components/AiBriefAnalyzerModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard-data', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--t2)' }}>
      <div className="spinner" style={{ marginBottom: 16 }} />
      <p style={{ fontSize: '14px' }}>Loading DealInbox workspace...</p>
    </div>
  );

  if (!data) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--red)' }}>
      <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
      <p>Failed to load dashboard data. Please refresh or try logging in again.</p>
    </div>
  );

  const kpis = [
    { label: 'Active Pipeline Value', value: `₹${(data.stats?.total_val || 0).toLocaleString()}`, sub: 'Active & closed deals', color: 'gold', valueColor: '#fff' },
    { label: 'New Enquiries', value: data.stats?.new_count ?? 0, sub: 'Requires creator review', color: 'blue', valueColor: 'var(--accent)' },
    { label: 'Win Conversion Rate', value: `${data.stats?.conversion ?? 0}%`, sub: `${data.stats?.accepted ?? 0} of ${data.stats?.total ?? 0} signed`, color: 'green', valueColor: 'var(--green)' },
    { label: 'Profile Optimization', value: `${data.stats?.profile_completion_pct ?? 0}%`, sub: 'Intake readiness score', color: 'red', valueColor: '#a5b4fc' },
  ];

  return (
    <div>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.2 }}>
            Welcome back, {data.name}!
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 14, marginTop: 4 }}>
            Here is your creator sponsorship pipeline, contract safety alerts, and AI deal intelligence.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setShowAnalyzer(true)}
            className="btn btn-primary btn-sm"
            style={{ gap: 6, padding: '9px 16px' }}
          >
            <Sparkles size={15} /> AI Brief Analyzer
          </button>
          <a
            href={`/@${data.username}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ gap: 6, padding: '9px 16px' }}
          >
            <ArrowUpRight size={15} /> Public intake page
          </a>
        </div>
      </div>

      {/* ── AI Insights Banner ── */}
      {data.insights?.length > 0 && (
        <div
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            padding: '16px 20px',
            borderRadius: 'var(--r-lg)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <Sparkles size={20} color="#818cf8" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 13, color: '#a5b4fc', display: 'block', marginBottom: 2 }}>
              Deal Copilot Recommendation
            </strong>
            <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>
              {data.insights[0]}
            </p>
          </div>
          <button
            onClick={() => setShowAnalyzer(true)}
            className="btn btn-ghost btn-sm"
            style={{ color: '#818cf8', fontSize: 12, padding: '4px 8px' }}
          >
            Run brief scan &rarr;
          </button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {kpis.map((k, i) => (
          <div className={`dbx-kpi ${k.color}`} key={i}>
            <label>{k.label}</label>
            <strong style={{ color: k.valueColor }}>{k.value}</strong>
            <p>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Deal Pipeline Stages ── */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Deal Pipeline</h2>
            <p style={{ fontSize: 12.5, color: 'var(--t2)', marginTop: 2 }}>Visual stages across your collaboration lifecycle</p>
          </div>
          <Link to="/enquiries" className="btn btn-secondary btn-sm">View full pipeline →</Link>
        </div>
        <div className="pipeline-grid">
          {(data.pipeline || []).map((col) => {
            const total = data.pipeline.reduce((a, c) => a + (c.count || 0), 0) || 1;
            const pct = Math.round(((col.count || 0) / total) * 100);
            return (
              <div key={col.key} className="pipeline-col">
                <div className="pipeline-head">
                  <span style={{ color: col.color, fontWeight: 600 }}>{col.label}</span>
                  <span className="pipeline-count">{col.count}</span>
                </div>
                <div className="dbx-track"><div className="dbx-fill" style={{ width: `${pct}%`, background: col.color }} /></div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8, textAlign: 'center' }}>
                  {col.count === 0 ? 'Empty stage' : `${col.count} deal(s) · ${pct}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent Deals + Sidebar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Recent Deals Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Brand Inbounds</h2>
              <p style={{ fontSize: 12.5, color: 'var(--t2)', marginTop: 2 }}>Latest structured briefs from your link</p>
            </div>
            <Link to="/enquiries" style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600 }}>See all</Link>
          </div>
          {(!data.recent || data.recent.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>📭</p>
              <p style={{ fontSize: 14 }}>No brand opportunities yet.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Add your DealInbox link to your Instagram / YouTube bio!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.recent.map((deal) => (
                <div
                  key={deal.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    borderRadius: 'var(--r-lg)',
                    background: 'rgba(255,255,255,.02)',
                    border: '1px solid var(--border)',
                    transition: 'all .2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: '#818cf8', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                      {deal.brand_name?.[0]?.toUpperCase() || 'B'}
                    </div>
                    <div>
                      <strong style={{ fontSize: 14.5, color: '#fff', display: 'block' }}>{deal.brand_name}</strong>
                      <span style={{ color: 'var(--t2)', fontSize: 12.5 }}>
                        {deal.platform} · <strong style={{ color: 'var(--green)' }}>{deal.budget}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge badge-${deal.status}`}>{deal.status_label}</span>
                    <Link
                      to={`/enquiries/${deal.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      Inspect &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick AI Deal Copilot Prompt Box */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
              border: '1px solid rgba(99, 102, 241, 0.25)',
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Zap size={16} color="#818cf8" /> Deal Copilot Shortcuts
            </h3>
            <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 14 }}>
              Fast-track your sponsorships with 1-click AI tools.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => setShowAnalyzer(true)}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', gap: 8, fontSize: 12 }}
              >
                <Sparkles size={14} color="#818cf8" /> Scan pitch email for red flags
              </button>
              <Link
                to="/positioning"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', gap: 8, fontSize: 12 }}
              >
                <TrendingUp size={14} color="var(--green)" /> Benchmark creator rate card
              </Link>
            </div>
          </div>

          {/* Onboarding Checklist */}
          {data.checklist?.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--accent)" /> Launch Checklist
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.checklist.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <CheckCircle2 size={16} color={item.done ? 'var(--green)' : 'var(--t3)'} />
                    <span style={{ color: item.done ? 'var(--t1)' : 'var(--t2)', textDecoration: item.done ? 'line-through' : 'none', flex: 1 }}>
                      {item.title}
                    </span>
                    {item.done && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>Done</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for brief analyzer */}
      <AiBriefAnalyzerModal isOpen={showAnalyzer} onClose={() => setShowAnalyzer(false)} />
    </div>
  );
};
