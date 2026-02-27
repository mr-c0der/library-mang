import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { section: 'عام', items: [
    { path: '/dashboard', icon: '📊', label: 'لوحة التحكم' },
    { path: '/analytics', icon: '📈', label: 'التحليلات' },
    { path: '/accounting', icon: '💰', label: 'التقارير المالية' },
  ]},
  { section: 'العمليات', items: [
    { path: '/books', icon: '📚', label: 'الكتب' },
    { path: '/sales', icon: '🛒', label: 'المبيعات' },
    { path: '/rentals', icon: '🔄', label: 'التأجيرات' },
    { path: '/customers', icon: '👥', label: 'العملاء' },
  ]},
  { section: 'المالية', items: [
    { path: '/expenses', icon: '📉', label: 'المصروفات' },
    { path: '/employees', icon: '👨‍💼', label: 'الموظفون' },
    { path: '/assets', icon: '🏢', label: 'الأصول الثابتة' },
    { path: '/debts', icon: '⚖️', label: 'الديون' },
  ]},
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">📖</div>
          <div className="logo-text">
            <h2>مكتبتي</h2>
            <span>نظام إدارة المكتبة</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(section => (
            <div key={section.section}>
              <div className="nav-section-title">{section.section}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textAlign: 'center' }}>
            مرحباً، <strong style={{ color: 'var(--accent)' }}>{user?.username}</strong>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
