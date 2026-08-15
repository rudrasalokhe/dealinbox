import React, { useState, useEffect } from 'react';
import { Flame, ArrowRight, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeatmapPage = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);

  useEffect(() => {
    fetch('/api/urgency-heatmap', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setDeals(d.deals || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32, marginBottom: 16 }} />
      <p style={{ color: 'var(--t3)', fontSize: 14 }}>🔍 Scanning open deals for urgency signals...</p>
    </div>
  );

  const getLevel = (d) => d?.urgency?.level || 'low';
  const getScore = (d) => d?.urgency?.score || 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', display: 'flex', alignItems: 'center', gap: 10, lineHeight: 1 }}>
          <Flame color="var(--gold)" size={36} /> Priority & Urgency Board
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: 11, textTransform: 'uppercase' }}>Deals scored by deadline urgency, deal size, and response delay.</p>
      </div>

      {/* Legend */}
      <div className="hm-legend">
        <div className="hml-item"><span className="hm-dot hm-high" /> High (70–100) — Act now</div>
        <div className="hml-item"><span className="hm-dot hm-medium" /> Medium (40–69) — Review soon</div>
        <div className="hml-item"><span className="hm-dot hm-low" /> Low (0–39) — Comfortable</div>
      </div>

      {deals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div className="es-icon">🎉</div>
          <p style={{ fontSize: 15, color: 'var(--t3)' }}>No active deals needing priority scoring right now.</p>
          <p style={{ fontSize: 12, color: 'var(--t4)', marginTop: 6 }}>All clear — when new opportunities come in, they'll appear here ranked by urgency.</p>
        </div>
      ) : (
        <div className="hm-grid">
          {deals.map((d) => {
            const level = getLevel(d);
            const score = getScore(d);
            return (
              <div
                key={d.id}
                className={`card hm-card-${level}`}
                onClick={() => setSelectedDeal(selectedDeal?.id === d.id ? null : d)}
                style={{ cursor: 'pointer', borderTop: `4px solid var(--${level === 'high' ? 'red' : level === 'medium' ? 'gold' : 't4'})` }}
              >
                <div className="hmc-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="hmc-brand">{d.brand}</span>
                  <span className={`hmc-badge badge-${level}`}>
                    {score}/100 · {level.toUpperCase()}
                  </span>
                </div>
                <div className="hmc-meta">{d.platform} · {d.budget} · Received {d.created}</div>
                <div className="hmc-bar-track">
                  <div className={`hmc-bar-fill fill-${level}`} style={{ width: `${score}%` }} />
                </div>
                <div className={`hmc-score score-${level}`}>
                  {d.urgency?.reasons?.length > 0 && <span>→ {d.urgency.reasons[0]}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      {selectedDeal && (
        <div className="hm-panel">
          <div className="hmp-head">
            <div>
              <h3 className="hmp-brand">{selectedDeal.brand}</h3>
              <p className="hmp-meta">{selectedDeal.platform} · {selectedDeal.budget} · Received {selectedDeal.created}</p>
            </div>
            <button onClick={() => setSelectedDeal(null)} style={{ color: 'var(--t3)' }}><X size={20} /></button>
          </div>

          <div className="hmp-score-row">
            <div className="hmp-score-wrap">
              <div className={`hmp-score-num score-${getLevel(selectedDeal)}`}>{getScore(selectedDeal)}</div>
              <div className="hmp-score-label">Urgency Score</div>
            </div>
            <div className="hmp-reasons">
              {selectedDeal.urgency?.reasons?.map((r, i) => (
                <div className="hmp-reason" key={i}>{r}</div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Link to={`/enquiries/${selectedDeal.id}`} className="btn btn-primary btn-sm">
              Open Deal <ArrowRight size={14} />
            </Link>
            <Link to={`/enquiries/${selectedDeal.id}`} className="btn btn-secondary btn-sm">
              <ExternalLink size={14} /> Full details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
