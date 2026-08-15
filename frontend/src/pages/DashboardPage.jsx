import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, CheckCircle2, Sparkles, Clock, AlertCircle, TrendingUp, Lightbulb } from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard-data', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: 'var(--t3)' }}><div className="spinner" style={{ marginBottom: 12 }} />Loading DealInbox dashboard...</div>;
  if (!data) return <div style={{ padding: 40, color: 'var(--red)' }}>Failed to load dashboard.</div>;

  const kpis = [
    { label: 'Total Pipeline Value', value: `₹${(data.stats?.total_val || 0).toLocaleString()}`, sub: 'Active & closed deals', color: 'gold', valueColor: '#fff' },
    { label: 'New Enquiries', value: data.stats?.new_count ?? 0, sub: 'Needs attention', color: 'blue', valueColor: 'var(--accent)' },
    { label: 'Win Rate', value: `${data.stats?.conversion ?? 0}%`, sub: `${data.stats?.accepted ?? 0} of ${data.stats?.total ?? 0} closed`, color: 'green', valueColor: 'var(--gold)' },
    { label: 'Profile Completion', value: `${data.stats?.profile_completion_pct ?? 0}%`, sub: 'Optimized page', color: 'red', valueColor: 'var(--green)' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', lineHeight: 1 }}>Welcome back, {data.name}!</h1>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: 11, textTransform: 'uppercase' }}>Here's your creator collaboration pipeline overview.</p>
        </div>
        <a href={`/@${data.username}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
          <ArrowUpRight size={14} /> Public intake page
        </a>
      </div>

      {/* Notifications */}
      {data.notifications?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {data.notifications.map((n, i) => (
            <div key={i} style={{ padding: '12px 16px', borderRadius: 'var(--r-sm)', background: 'var(--accent-soft)', border: '1px solid rgba(79,110,247,.3)', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={16} color="var(--accent)" /> {n.text}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {kpis.map((k, i) => (
          <div className={`dbx-kpi ${k.color}`} key={i}>
            <label>{k.label}</label>
            <strong style={{ color: k.valueColor }}>{k.value}</strong>
            <p>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Insights banner */}
      {data.insights?.length > 0 && (
        <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 14, padding: '20px 24px' }}>
          <Lightbulb size={20} color="var(--gold)" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: 13, color: 'var(--gold)', display: 'block', marginBottom: 4 }}>💡 Deal Insight</strong>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{data.insights[0]}</p>
          </div>
        </div>
      )}

      {/* Deal Pipeline */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <h2 className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff' }}>Deal Pipeline</h2>
          <Link to="/enquiries" className="btn btn-secondary btn-sm">View all deals →</Link>
        </div>
        <div className="pipeline-grid">
          {(data.pipeline || []).map((col) => {
            const total = data.pipeline.reduce((a, c) => a + (c.count || 0), 0) || 1;
            const pct = Math.round(((col.count || 0) / total) * 100);
            return (
              <div key={col.key} className="pipeline-col">
                <div className="pipeline-head">
                  <span style={{ color: col.color, fontWeight: 700 }}>{col.label}</span>
                  <span className="pipeline-count">{col.count}</span>
                </div>
                <div className="dbx-track"><div className="dbx-fill" style={{ width: `${pct}%`, background: col.color }} /></div>
                <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 6, textAlign: 'center' }}>
                  {col.count === 0 ? 'Empty stage' : `${col.count} deal(s) · ${pct}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Recent deals */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Brand Opportunities</h2>
            <Link to="/enquiries" style={{ fontSize: 12, color: 'var(--accent)' }}>See all</Link>
          </div>
          {(!data.recent || data.recent.length === 0) ? (
            <div className="empty-state">
              <p className="es-icon">📭</p>
              <p style={{ color: 'var(--t3)', fontSize: 13 }}>No brand opportunities yet. Share your link <strong style={{ color: 'var(--accent-hover)', fontFamily: 'var(--font-mono)' }}>@{data.username}</strong>!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.recent.map((deal) => (
                <Link key={deal.id} to={`/enquiries/${deal.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)', transition: 'all .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-hover)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      {deal.brand_name?.[0]?.toUpperCase() || 'B'}
                    </div>
                    <div>
                      <strong style={{ fontSize: 14, color: '#fff', display: 'block' }}>{deal.brand_name}</strong>
                      <small style={{ color: 'var(--t3)', fontSize: 12 }}>{deal.platform} · <span style={{ color: 'var(--green)' }}>{deal.budget}</span></small>
                    </div>
                  </div>
                  <span className={`badge badge-${deal.status}`}>{deal.status_label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Reminders + Channels + Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Reminders */}
          {data.reminders?.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16} color="var(--amber)" /> Reminders</h3>
              {data.reminders.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < data.reminders.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--amber)' }}>⏰</span>
                  <span style={{ flex: 1, color: 'var(--t1)' }}>{r.text}</span>
                  <span style={{ color: 'var(--t4)', fontSize: 11 }}>{r.due}</span>
                </div>
              ))}
            </div>
          )}

          {/* Top channels */}
          {data.top_channels?.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={16} color="var(--green)" /> Top Channels</h3>
              {data.top_channels.map((ch, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < data.top_channels.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--t1)' }}>{ch.name}</span>
                  <span style={{ color: 'var(--t3)' }}>{ch.count} deals</span>
                </div>
              ))}
            </div>
          )}

          {/* Onboarding checklist */}
          {data.checklist?.length > 0 && (
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="var(--accent)" /> Getting Set Up
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.checklist.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <CheckCircle2 size={18} color={item.done ? 'var(--green)' : 'var(--t4)'} />
                    <span style={{ color: item.done ? 'var(--t1)' : 'var(--t3)', textDecoration: item.done ? 'line-through' : 'none', flex: 1 }}>{item.title}</span>
                    {item.done && <span style={{ fontSize: 10, color: 'var(--green)' }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
