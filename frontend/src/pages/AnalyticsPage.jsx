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

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--t2)' }}>
      <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
      <p style={{ fontSize: 14 }}>Loading earnings analytics...</p>
    </div>
  );
  if (!data) return <div style={{ padding: 40, color: 'var(--red)' }}>Failed to load analytics.</div>;

  const stats = data.stats || {};
  const months = data.monthly_revenue || [
    { label: 'Mar', value: 12000 }, { label: 'Apr', value: 28000 }, { label: 'May', value: 18000 },
    { label: 'Jun', value: 45000 }, { label: 'Jul', value: 32000 }, { label: 'Aug', value: stats.total_val || 55000 },
  ];
  const maxVal = Math.max(...months.map((m) => m.value), 1);

  const stages = data.stage_mix || [
    { label: 'New', count: stats.new_count || 4, color: 'var(--blue)' },
    { label: 'Reviewing', count: 3, color: 'var(--amber)' },
    { label: 'Negotiating', count: 2, color: 'var(--primary)' },
    { label: 'Accepted', count: stats.accepted || 5, color: 'var(--green)' },
    { label: 'Declined', count: 1, color: 'var(--red)' },
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.02em' }}>
            <TrendingUp color="var(--primary)" size={28} /> Creator Earnings & Performance
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 14, marginTop: 4 }}>
            Track your revenue growth, top brand partners, and conversion rates.
          </p>
        </div>
        <a href="/analytics/export" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 12 }}>
          <Download size={14} /> Export report
        </a>
      </div>

      {/* Insight Banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 22px', marginBottom: 24,
        background: 'var(--amber-soft)', border: '1px solid var(--gold-border)',
        borderRadius: 16
      }}>
        <Lightbulb size={18} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ fontSize: 13, color: 'var(--gold)', display: 'block', marginBottom: 4, fontWeight: 700 }}>Performance Insight</strong>
          <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.5 }}>{insightText}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Revenue', value: `₹${(stats.total_val || 0).toLocaleString()}`, sub: 'Lifetime deal value', accent: 'var(--primary)', bar: 'var(--primary)' },
          { label: 'Avg Deal Size', value: `₹${(stats.avg_value || 0).toLocaleString()}`, sub: 'Per collaboration', accent: 'var(--gold)', bar: 'var(--amber)' },
          { label: 'Conversion Rate', value: `${stats.conversion || 0}%`, sub: `${stats.accepted || 0} of ${stats.total || 0} converted`, accent: 'var(--primary)', bar: 'var(--blue)' },
          { label: 'Closed Collabs', value: stats.accepted || 0, sub: 'Successfully completed', accent: 'var(--red)', bar: 'var(--red)' },
        ].map((k, i) => (
          <div key={i} style={{
            background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 18,
            padding: '20px 22px', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: k.bar }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{k.label}</span>
            <strong style={{ fontSize: 30, fontWeight: 800, color: k.accent, display: 'block', margin: '6px 0 4px', lineHeight: 1, letterSpacing: '-0.03em' }}>{k.value}</strong>
            <p style={{ fontSize: 12, color: 'var(--t2)' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Revenue Chart */}
        <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 20 }}>Revenue — Last 6 Months</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180 }}>
            {months.map((m, i) => {
              const barH = Math.max((m.value / maxVal) * 160, 8);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)' }}>₹{(m.value / 1000).toFixed(0)}K</span>
                  <div style={{
                    width: '100%', maxWidth: 56, height: barH,
                    background: 'linear-gradient(to top, var(--primary), #22c55e)',
                    borderRadius: '10px 10px 4px 4px',
                    transition: 'height 0.4s ease'
                  }} />
                  <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Mix */}
        <div style={{ background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 18 }}>Collab Stage Mix</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stages.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100, fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  {s.label}
                </span>
                <div style={{ flex: 1, height: 8, background: 'var(--canvas-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(s.count / stageMax) * 100}%`, background: s.color, borderRadius: 999, transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', minWidth: 20, textAlign: 'right' }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Mix */}
        <div style={{ background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 18 }}>Channel Mix</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {channels.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100, fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  {c.label}
                </span>
                <div style={{ flex: 1, height: 8, background: 'var(--canvas-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(c.count / channelMax) * 100}%`, background: c.color, borderRadius: 999, transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', minWidth: 20, textAlign: 'right' }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Brands */}
        <div style={{ background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 18 }}>Top Recurring Brands</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topBrands.map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: 'var(--canvas-subtle)', border: '1px solid var(--border)'
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: i === 0 ? 'var(--lime)' : 'var(--mint)',
                  color: 'var(--primary)', fontWeight: 800, fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  #{i + 1}
                </span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{b.name}</span>
                <span style={{ fontSize: 12.5, color: 'var(--t2)', fontWeight: 600 }}>{b.count} collabs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Goal */}
        <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 18 }}>Monthly Earnings Goal</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 10, background: 'var(--canvas-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${goalPct}%`, borderRadius: 999,
                  background: goalPct >= 100 ? 'var(--green)' : 'linear-gradient(90deg, var(--primary), var(--green))',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--t3)' }}>
                <span>₹0</span>
                <span>Target: ₹{(goalTarget / 1000).toFixed(0)}K</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 80 }}>
              <strong style={{ fontSize: 28, fontWeight: 800, color: goalPct >= 100 ? 'var(--green)' : 'var(--primary)' }}>{goalPct}%</strong>
              <p style={{ fontSize: 11, color: 'var(--t3)' }}>{goalPct >= 100 ? '🎉 Goal hit!' : 'Progress'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
