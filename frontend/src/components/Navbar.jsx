import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Sparkles, BrainCircuit } from 'lucide-react';
import { AiBriefAnalyzerModal } from './AiBriefAnalyzerModal';

export const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showPalette, setShowPalette] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  if (!user) {
    return (
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 700, color: '#fff' }}>
          <img src="/static/logo.jpeg" alt="logo" style={{ width: '26px', height: '26px', borderRadius: '8px' }} />
          DealInbox
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
          <Link to="/login" className="btn btn-secondary btn-sm">Log in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Launch workspace</Link>
        </div>
      </nav>
    );
  }

  return (
    <>
      <header className="os-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="cmd-btn" onClick={() => setShowPalette(true)}>
            <Search size={14} /> ⌘K &nbsp; Search opportunities, brands...
          </button>
          <button
            onClick={() => setShowAnalyzer(true)}
            className="btn btn-secondary btn-sm"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              borderColor: 'rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              gap: '6px',
            }}
          >
            <Sparkles size={14} color="#818cf8" /> AI Brief Analyzer
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="os-pill">{user.plan.toUpperCase()} PLAN</span>
          {user.plan !== 'pro' && (
            <Link to="/upgrade" className="btn btn-primary btn-sm">
              <Sparkles size={14} /> Upgrade
            </Link>
          )}
        </div>
      </header>

      <AiBriefAnalyzerModal isOpen={showAnalyzer} onClose={() => setShowAnalyzer(false)} />

      {showPalette && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '100px', background: 'rgba(0,0,0,.8)' }} onClick={() => setShowPalette(false)}>
          <div style={{ width: '100%', maxWidth: '540px', background: 'var(--paper)', border: '2px solid #000', borderRadius: '0', padding: '16px', boxShadow: '8px 8px 0 #000' }} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder="Search brand, campaign, budget..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              style={{ fontSize: '15px', padding: '12px 16px', marginBottom: '12px' }}
            />
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {searchResults.length === 0 && searchQuery.length >= 2 && (
                <p style={{ padding: '12px', fontSize: '13px', color: 'var(--t3)', textAlign: 'center' }}>No matching opportunities found.</p>
              )}
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    navigate(`/enquiries/${item.id}`);
                    setShowPalette(false);
                  }}
                  style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,.03)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <strong style={{ fontSize: '13.5px', color: '#fff' }}>{item.brand}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--t3)' }}>{item.status} · {item.budget || 'TBD'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
