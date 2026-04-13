import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../data/supabaseClient';
import './Layout.css';

const NAV_ITEMS = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/projects', icon: '📁', label: 'Projects' },
  { path: '/people', icon: '👥', label: 'Partners & Staff' },
  { path: '/transactions', icon: '💳', label: 'Transactions' },
  { path: '/budget', icon: '📋', label: 'Forecast' },
  { path: '/debt', icon: '🏦', label: 'Ledger' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const pageTitle = NAV_ITEMS.find(n => {
    if (n.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(n.path);
  })?.label || 'CashClaw';

  return (
    <div className={`layout ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">💰</span>
            {!collapsed && <span className="logo-text">CashClaw</span>}
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">L</div>
            {!collapsed && (
              <div className="user-info">
                <span className="user-name">Lucid</span>
                <span className="user-role">HQ Team</span>
              </div>
            )}
            <button
              className="logout-btn"
              title="Đăng xuất"
              onClick={() => supabase.auth.signOut()}
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main">
        <header className="topbar">
          <h1 className="page-title">{pageTitle}</h1>
          <div className="topbar-actions">
            <span className="env-badge">LIVE</span>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
