import React, { useState, useEffect } from 'react';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* SVG arc score ring */
const ScoreRing = ({ score, size = 80 }) => {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)';
  return (
    <div className="pos-score-ring" style={{ width: size, height: size }}>
      <svg className="rs-circle" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.06)" fill="none" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} fill="none" strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <span className="pos-score-num" style={{ color }}>{score}</span>
    </div>
  );
};

export const PositioningPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* bio builder fields */
  const [bbNiche, setBbNiche] = useState('');
  const [bbPlatform, setBbPlatform] = useState('');
  const [bbAudience, setBbAudience] = useState('');
  const [bbBrands, setBbBrands] = useState('');
  const [generatedBio, setGeneratedBio] = useState('');

  useEffect(() => {
    fetch('/api/positioning-analysis', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const generateBio = () => {
    const parts = [];
    if (bbNiche) parts.push(`${bbNiche} creator`);
    if (bbPlatform) parts.push(`on ${bbPlatform}`);
    if (bbAudience) parts.push(`reaching ${bbAudience} engaged followers`);
    if (bbBrands) parts.push(`Previously collaborated with ${bbBrands}`);
    setGeneratedBio(parts.length ? parts.join(' ') + '. Open to brand collaborations — structured briefs only.' : '');
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--t3)' }}><div className="spinner" style={{ marginBottom: 12 }} />Analyzing positioning engine...</div>;

  const score = data?.score || 0;
  const scoreLabel = score >= 70 ? 'Strong' : score >= 50 ? 'Average' : score >= 30 ? 'Weak' : 'Needs work';

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', display: 'flex', alignItems: 'center', gap: 10, lineHeight: 1 }}>
          <Compass color="var(--accent)" size={36} /> Creator Positioning Engine
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: 11, textTransform: 'uppercase', marginTop: 8 }}>AI suggestions to raise your rates and attract higher-quality brands.</p>
      </div>

      {!data?.ready ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>
          {data?.message || 'Need more deal data to generate positioning analysis.'}
        </div>
      ) : (
        <div className="pos-layout">
          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Score + bar */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ScoreRing score={score} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 600 }}>Positioning Health Score</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, color: '#fff', margin: '4px 0', lineHeight: 1 }}>{score} / 100</h2>
                <div className="pos-bar-row">
                  <div className="pos-bar-track"><div className="pos-bar-fill" style={{ width: `${score}%` }} /></div>
                  <div className="pos-bar-labels">
                    <span>Weak</span><span>Average</span><span>Strong</span><span>Premium</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, color: 'var(--t2)' }}>Avg Budget: <strong style={{ color: '#fff' }}>₹{(data.avg_budget || 0).toLocaleString()}</strong></p>
                <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>Low deals (&lt;₹10k): <strong style={{ color: 'var(--gold)' }}>{data.pct_low || 0}%</strong></p>
              </div>
            </div>

            {/* Suggestions */}
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: 12 }}>AI Recommendations</h2>
              {data.suggestions?.map((item, idx) => (
                <div className="sugg-item" key={idx}>
                  <div className="sugg-head">
                    <span className="sugg-icon">{item.icon}</span>
                    <span className="sugg-area">{item.area}</span>
                    <span className={`sugg-severity sev-${item.severity}`}>{item.severity.toUpperCase()}</span>
                  </div>
                  <p className="sugg-problem"><strong>Problem:</strong> {item.problem}</p>
                  <p className="sugg-fix">✅ <strong>Fix:</strong> {item.fix}</p>
                  {item.bio_tweak && <p className="sugg-bio-tweak">💡 Bio tweak: "{item.bio_tweak}"</p>}
                </div>
              ))}
            </div>

            {/* Bio Builder */}
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: 14 }}>🔧 Bio Builder</h2>
              <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 16 }}>Generate a positioning-optimized bio for your public page.</p>
              <div className="form-row-2" style={{ marginBottom: 12 }}>
                <div className="fg"><label>Your niche</label><input type="text" value={bbNiche} onChange={(e) => setBbNiche(e.target.value)} placeholder="Beauty / Tech / Fitness" /></div>
                <div className="fg"><label>Primary platform</label><input type="text" value={bbPlatform} onChange={(e) => setBbPlatform(e.target.value)} placeholder="Instagram / YouTube" /></div>
              </div>
              <div className="form-row-2" style={{ marginBottom: 12 }}>
                <div className="fg"><label>Audience size</label><input type="text" value={bbAudience} onChange={(e) => setBbAudience(e.target.value)} placeholder="50K+" /></div>
                <div className="fg"><label>Past brands (optional)</label><input type="text" value={bbBrands} onChange={(e) => setBbBrands(e.target.value)} placeholder="Mamaearth, Nykaa" /></div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={generateBio}>Generate Bio</button>
              {generatedBio && <div className="bio-result" style={{ marginTop: 12 }}>{generatedBio}</div>}
            </div>
          </div>

          {/* ── RIGHT: Profile Preview ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>How brands see you</h3>
              <div className="profile-preview">
                <div className="pp-mock-av">{user?.name?.[0]?.toUpperCase() || 'C'}</div>
                <div className="pp-mock-name">{user?.name || 'Creator'}</div>
                <div className="pp-mock-handle">@{user?.username || 'handle'}</div>
                <div className="pp-mock-tags">
                  {user?.niche && <span className="pp-mock-tag">{user.niche}</span>}
                  {user?.platform && <span className="pp-mock-tag">{user.platform}</span>}
                  {user?.followers && <span className="pp-mock-tag">{user.followers}</span>}
                  {!user?.niche && !user?.platform && <span className="pp-mock-tag" style={{ color: 'var(--red)' }}>No tags set</span>}
                </div>
                {user?.bio ? <p className="pp-mock-bio">"{user.bio}"</p> : <p className="pp-mock-bio empty">⚠ No bio — brands see an empty page</p>}
                {user?.min_budget ? <p className="pp-mock-budget">Min budget: ₹{user.min_budget}</p> : <p className="pp-mock-budget empty">⚠ No minimum budget set</p>}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 14 }}>Deal Data</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--t3)' }}>Total enquiries</span>
                  <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{data.total_enquiries || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--t3)' }}>Avg budget</span>
                  <span style={{ fontWeight: 600, color: 'var(--t1)' }}>₹{(data.avg_budget || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--t3)' }}>Low budget %</span>
                  <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{data.pct_low || 0}%</span>
                </div>
                {data.top_platform && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--t3)' }}>Top platform</span>
                    <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{data.top_platform}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
