import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/dashboard': { title: 'لوحة', highlight: 'التحكم' },
  '/books': { title: 'إدارة', highlight: 'الكتب' },
  '/sales': { title: 'إدارة', highlight: 'المبيعات' },
  '/rentals': { title: 'إدارة', highlight: 'التأجيرات' },
  '/customers': { title: 'إدارة', highlight: 'العملاء' },
  '/expenses': { title: 'إدارة', highlight: 'المصروفات' },
  '/employees': { title: 'إدارة', highlight: 'الموظفين' },
  '/assets': { title: 'الأصول', highlight: 'الثابتة' },
  '/debts': { title: 'إدارة', highlight: 'الديون' },
  '/accounting': { title: 'التقارير', highlight: 'المالية' },
  '/analytics': { title: 'التحليلات', highlight: 'والإحصائيات' },
};

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: 'نظام', highlight: 'المكتبة' };

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
            <h1 className="page-title">{page.title} <span>{page.highlight}</span></h1>
          </div>
          <div className="header-actions">
            <div className="header-user">
              <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
              <span>{user?.username}</span>
            </div>
          </div>
        </header>
        <div className="page-wrapper">{children}</div>
      </div>
    </div>
  );
}
