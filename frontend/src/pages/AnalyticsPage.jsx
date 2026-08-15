import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, Lightbulb } from 'lucide-react';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard-data', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: 'var(--t3)' }}><div className="spinner" style={{ marginBottom: 12 }} />Loading earnings analytics...</div>;
  if (!data) return <div style={{ padding: 40, color: 'var(--red)' }}>Failed to load analytics.</div>;

  const stats = data.stats || {};
  const months = data.monthly_revenue || [
    { label: 'Mar', value: 12000 }, { label: 'Apr', value: 28000 }, { label: 'May', value: 18000 },
    { label: 'Jun', value: 45000 }, { label: 'Jul', value: 32000 }, { label: 'Aug', value: stats.total_val || 55000 },
  ];
  const maxVal = Math.max(...months.map((m) => m.value), 1);

  const stages = data.stage_mix || [
    { label: 'New', count: stats.new_count || 4, color: '#818cf8' },
    { label: 'Reviewing', count: 3, color: '#fbbf24' },
    { label: 'Negotiating', count: 2, color: '#60a5fa' },
    { label: 'Accepted', count: stats.accepted || 5, color: '#34d399' },
    { label: 'Declined', count: 1, color: '#f87171' },
  ];
  const stageMax = Math.max(...stages.map((s) => s.count), 1);

  const channels = data.channel_mix || [
    { label: 'Instagram', count: 8, color: '#e040a0' },
    { label: 'YouTube', count: 5, color: '#ff4444' },
    { label: 'LinkedIn', count: 3, color: '#0077b5' },
    { label: 'Other', count: 2, color: 'var(--t3)' },
  ];
  const channelMax = Math.max(...channels.map((c) => c.count), 1);

  const topBrands = data.top_brands || [
    { name: 'Mamaearth', count: 3 }, { name: 'boAt', count: 2 }, { name: 'Nykaa', count: 2 },
  ];

  const goalTarget = data.goal_target || 100000;
  const goalCurrent = stats.total_val || 0;
  const goalPct = Math.min(Math.round((goalCurrent / goalTarget) * 100), 100);

  const insightText = (stats.conversion || 0) >= 50
    ? `Your conversion rate of ${stats.conversion}% is well above average. Keep nurturing high-budget leads to maximize revenue.`
    : `Your conversion rate is ${stats.conversion || 0}%. Consider following up on stale deals — many creators see a 15-20% lift just by responding faster.`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', display: 'flex', alignItems: 'center', gap: 10, lineHeight: 1 }}>
            <TrendingUp color="var(--green)" size={36} /> Creator Earnings & Performance
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: 11, textTransform: 'uppercase' }}>Track your revenue growth, top brand partners, and conversion rates.</p>
        </div>
        <a href="/analytics/export" className="btn btn-secondary btn-sm"><Download size={14} /> Export report</a>
      </div>

      {/* Insight banner */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 22px' }}>
        <Lightbulb size={18} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ fontSize: 12, color: 'var(--gold)', display: 'block', marginBottom: 4 }}>Performance Insight</strong>
          <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{insightText}</p>
        </div>
      </div>

      {/* Top‐level KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="dbx-kpi green"><label>Total Revenue</label><strong style={{ color: 'var(--green)' }}>₹{(stats.total_val || 0).toLocaleString()}</strong><p>Lifetime deal value</p></div>
        <div className="dbx-kpi gold"><label>Avg Deal Size</label><strong style={{ color: 'var(--gold)' }}>₹{(stats.avg_value || 0).toLocaleString()}</strong><p>Per collaboration</p></div>
        <div className="dbx-kpi blue"><label>Conversion Rate</label><strong style={{ color: 'var(--accent)' }}>{stats.conversion || 0}%</strong><p>{stats.accepted || 0} of {stats.total || 0} converted</p></div>
        <div className="dbx-kpi red"><label>Closed Collabs</label><strong>{stats.accepted || 0}</strong><p>Successfully completed</p></div>
      </div>

      <div className="analytics-grid">
        {/* Revenue chart */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Revenue — Last 6 Months</h2>
          <div className="bar-chart">
            {months.map((m, i) => (
              <div className="bc-col" key={i}>
                <span className="bc-val">₹{(m.value / 1000).toFixed(0)}K</span>
                <div className="bc-bar-wrap"><div className="bc-bar" style={{ height: `${(m.value / maxVal) * 100}%` }} /></div>
                <span className="bc-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage mix */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Collab Stage Mix</h2>
          <div className="sb-list">
            {stages.map((s, i) => (
              <div className="sb-row" key={i}>
                <span className="sb-label"><span className="sb-dot" style={{ background: s.color }} /> {s.label}</span>
                <div className="sb-bar-wrap"><div className="sb-bar" style={{ width: `${(s.count / stageMax) * 100}%`, background: s.color }} /></div>
                <span className="sb-count">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Channel mix */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Channel Mix</h2>
          <div className="sb-list">
            {channels.map((c, i) => (
              <div className="sb-row" key={i}>
                <span className="sb-label"><span className="sb-dot" style={{ background: c.color }} /> {c.label}</span>
                <div className="sb-bar-wrap"><div className="sb-bar" style={{ width: `${(c.count / channelMax) * 100}%`, background: c.color }} /></div>
                <span className="sb-count">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top brands */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Top Recurring Brands</h2>
          <div className="top-brands">
            {topBrands.map((b, i) => (
              <div className="tb-row" key={i}>
                <span className="tb-rank" style={{ color: i === 0 ? 'var(--gold)' : i === 1 ? 'var(--t2)' : 'var(--t3)' }}>#{i + 1}</span>
                <span className="tb-name">{b.name}</span>
                <span className="tb-count">{b.count} collabs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly goal */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Monthly Earnings Goal</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <div className="dbx-track" style={{ height: 10 }}>
                <div className="dbx-fill" style={{ width: `${goalPct}%`, background: goalPct >= 100 ? 'var(--green)' : 'linear-gradient(90deg, var(--accent), var(--green))' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--t3)' }}>
                <span>₹0</span><span>Target: ₹{(goalTarget / 1000).toFixed(0)}K</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 80 }}>
              <strong style={{ fontSize: 28, fontWeight: 800, color: goalPct >= 100 ? 'var(--green)' : '#fff', fontFamily: 'var(--font-display)' }}>{goalPct}%</strong>
              <p style={{ fontSize: 11, color: 'var(--t3)' }}>{goalPct >= 100 ? '🎉 Goal hit!' : 'Progress'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
