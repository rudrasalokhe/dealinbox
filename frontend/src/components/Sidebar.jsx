import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Inbox, Flame, TrendingUp, Compass, Settings, Sparkles, ExternalLink, LogOut } from 'lucide-react';

export const Sidebar = ({ newEnquiryCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="os-sidebar">
      <div className="os-brand">
        <img src="/static/logo.jpeg" alt="logo" />
        <div>
          <strong>DEALINBOX</strong>
          <span>CREATOR OS ✦ 2026</span>
        </div>
      </div>

      <div className="os-user">
        <div className="os-av">{user.name ? user.name[0].toUpperCase() : 'U'}</div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{user.name}</p>
          <small style={{ fontFamily: 'var(--font-mono)', color: 'var(--acid)', fontSize: '11px' }}>@{user.username}</small>
        </div>
      </div>

      <div className="os-nav-group">
        <p className="os-nav-label">01 // WORKSPACE</p>
        <nav className="os-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `os-link ${isActive ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LayoutDashboard size={15} /> Dashboard
            </span>
          </NavLink>

          <NavLink to="/enquiries" className={({ isActive }) => `os-link ${isActive ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Inbox size={15} /> Brand Opportunities
            </span>
            {newEnquiryCount > 0 && <span className="badge badge-new">{newEnquiryCount}</span>}
          </NavLink>

          <NavLink to="/heatmap" className={({ isActive }) => `os-link ${isActive ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={15} /> Urgency Board
            </span>
          </NavLink>

          <NavLink to="/analytics" className={({ isActive }) => `os-link ${isActive ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={15} /> Earnings Studio
            </span>
          </NavLink>
        </nav>
      </div>

      <div className="os-nav-group">
        <p className="os-nav-label">02 // GROWTH &amp; TOOLS</p>
        <nav className="os-nav">
          <NavLink to="/positioning" className={({ isActive }) => `os-link ${isActive ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={15} /> Positioning
            </span>
          </NavLink>

          <NavLink to="/settings" className={({ isActive }) => `os-link ${isActive ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={15} /> Profile &amp; Settings
            </span>
          </NavLink>

          {user.plan !== 'pro' && (
            <NavLink to="/upgrade" className={({ isActive }) => `os-link os-link-upgrade ${isActive ? 'active' : ''}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} /> Upgrade to Pro
              </span>
            </NavLink>
          )}
        </nav>
      </div>

      <div className="os-sidebar-foot">
        <a href={`/@${user.username}`} target="_blank" rel="noreferrer" className="os-link">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExternalLink size={14} /> Public collab page
          </span>
        </a>
        <button onClick={handleLogout} className="os-link" style={{ width: '100%', textAlign: 'left' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)' }}>
            <LogOut size={14} /> Log out
          </span>
        </button>
      </div>
    </aside>
  );
};
