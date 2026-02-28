import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../api/axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [, setTopBooks] = useState(null);
  const [demo, setDemo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/monthly'),
      api.get('/analytics/top-books'),
      api.get('/analytics/demographics'),
    ]).then(([s, m, t, d]) => {
      setSummary(s.data); setMonthly(m.data);
      setTopBooks(t.data); setDemo(d.data);
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (n) => (n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 });

  if (loading) return <div className="loading-wrapper"><div className="spinner"></div></div>;

  const barData = {
    labels: monthly.map(m => MONTHS[m.month - 1]),
    datasets: [
      { label: 'الإيرادات', data: monthly.map(m => m.revenue), backgroundColor: 'rgba(201,162,39,0.8)', borderRadius: 6 },
      { label: 'المصروفات', data: monthly.map(m => m.expenses), backgroundColor: 'rgba(231,76,60,0.7)', borderRadius: 6 },
    ]
  };

  const genderData = {
    labels: ['ذكور', 'إناث'],
    datasets: [{ data: [demo?.gender?.male || 0, demo?.gender?.female || 0], backgroundColor: ['rgba(52,152,219,0.8)', 'rgba(155,89,182,0.8)'], borderWidth: 0 }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#8faabb', font: { family: 'Tajawal', size: 12 } } } },
    scales: { x: { ticks: { color: '#5a7a8f' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#5a7a8f' }, grid: { color: 'rgba(255,255,255,0.05)' } } }
  };

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#8faabb', font: { family: 'Tajawal', size: 12 }, padding: 16 } } }
  };

  return (
    <>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{fmt(summary?.revenue?.total)}</div>
          <div className="stat-label">إجمالي الإيرادات (جنيه)</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">📉</div>
          <div className="stat-value">{fmt(summary?.expenses?.total)}</div>
          <div className="stat-label">إجمالي المصروفات (جنيه)</div>
        </div>
        <div className={`stat-card ${(summary?.netProfit || 0) >= 0 ? 'gold' : 'red'}`}>
          <div className="stat-icon">{(summary?.netProfit || 0) >= 0 ? '📈' : '📉'}</div>
          <div className="stat-value">{fmt(summary?.netProfit)}</div>
          <div className="stat-label">صافي الربح (جنيه)</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">🔄</div>
          <div className="stat-value">{summary?.stats?.activeRentals || 0}</div>
          <div className="stat-label">تأجيرات نشطة</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{summary?.stats?.overdueRentals || 0}</div>
          <div className="stat-label">تأجيرات متأخرة</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">⚖️</div>
          <div className="stat-value">{fmt(summary?.debts?.owedToMe)}</div>
          <div className="stat-label">ديون لي (جنيه)</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>📊 الإيرادات والمصروفات الشهرية</h3>
          <div style={{ height: 280 }}><Bar data={barData} options={chartOptions} /></div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>👥 توزيع الجنس</h3>
          <div style={{ height: 280 }}><Doughnut data={genderData} options={doughnutOptions} /></div>
        </div>
      </div>

      {/* Quick Actions + Pending Alerts */}
      <div className="two-col-grid">
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>⚡ إجراءات سريعة</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { to: '/sales', icon: '🛒', label: 'بيع كتاب', color: 'var(--success)' },
              { to: '/rentals', icon: '🔄', label: 'تأجير كتاب', color: 'var(--info)' },
              { to: '/books', icon: '📚', label: 'إضافة كتاب', color: 'var(--accent)' },
              { to: '/customers', icon: '👤', label: 'إضافة عميل', color: '#9b59b6' },
            ].map(a => (
              <Link key={a.to} to={a.to} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '20px 12px', gap: 10,
                background: 'var(--bg-dark)', borderRadius: 10,
                border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s',
                textDecoration: 'none', color: 'inherit'
              }}>
                <span style={{ fontSize: 28 }}>{a.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>💳 الملخص المالي السريع</h3>
          <div className="summary-row">
            <span className="label">إيرادات المبيعات</span>
            <span className="value" style={{ color: 'var(--success)' }}>{fmt(summary?.revenue?.sales)} ج</span>
          </div>
          <div className="summary-row">
            <span className="label">إيرادات التأجير</span>
            <span className="value" style={{ color: 'var(--success)' }}>{fmt(summary?.revenue?.rentals)} ج</span>
          </div>
          <div className="summary-row">
            <span className="label">غرامات التأخير</span>
            <span className="value" style={{ color: 'var(--warning)' }}>{fmt(summary?.revenue?.lateFees)} ج</span>
          </div>
          <div className="summary-row">
            <span className="label">مصروفات تشغيلية</span>
            <span className="value" style={{ color: 'var(--danger)' }}>{fmt(summary?.expenses?.operations)} ج</span>
          </div>
          <div className="summary-row">
            <span className="label">إجمالي الرواتب</span>
            <span className="value" style={{ color: 'var(--danger)' }}>{fmt(summary?.expenses?.salaries)} ج</span>
          </div>
          <div className="summary-row total">
            <span className="label" style={{ fontWeight: 800 }}>صافي الربح</span>
            <span className="value" style={{ color: (summary?.netProfit || 0) >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 18 }}>
              {fmt(summary?.netProfit)} ج
            </span>
          </div>
          {(summary?.pending?.unpaidSales > 0 || summary?.pending?.unpaidRentals > 0) && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(243,156,18,0.1)', borderRadius: 8, border: '1px solid rgba(243,156,18,0.3)' }}>
              <div style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>
                ⚠️ مبالغ غير مدفوعة: {fmt((summary?.pending?.unpaidSales || 0) + (summary?.pending?.unpaidRentals || 0))} ج
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
