import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../api/axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export default function Analytics() {
  const [demo, setDemo] = useState(null);
  const [topBooks, setTopBooks] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/demographics'),
      api.get('/analytics/top-books'),
      api.get('/analytics/monthly'),
    ]).then(([d, t, m]) => { setDemo(d.data); setTopBooks(t.data); setMonthly(m.data); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-wrapper"><div className="spinner"></div></div>;

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#8faabb', font: { family: 'Tajawal' }, padding: 16 } } }
  };
  const barOpts = {
    ...chartOpts,
    scales: { x: { ticks: { color: '#5a7a8f' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#5a7a8f' }, grid: { color: 'rgba(255,255,255,0.05)' } } }
  };

  const genderData = {
    labels: ['ذكور', 'إناث'],
    datasets: [{ data: [demo?.gender?.male || 0, demo?.gender?.female || 0], backgroundColor: ['rgba(52,152,219,0.85)', 'rgba(155,89,182,0.85)'], borderWidth: 0 }]
  };

  const ageData = {
    labels: Object.keys(demo?.ageGroups || {}),
    datasets: [{ data: Object.values(demo?.ageGroups || {}), backgroundColor: ['rgba(52,152,219,0.8)', 'rgba(39,174,96,0.8)', 'rgba(201,162,39,0.8)', 'rgba(231,76,60,0.8)', 'rgba(155,89,182,0.8)'], borderWidth: 0 }]
  };

  const topSoldData = {
    labels: (topBooks?.topSold || []).map(b => b.book?.title?.substring(0, 18) || '-'),
    datasets: [{ label: 'عدد النسخ المباعة', data: (topBooks?.topSold || []).map(b => b.totalSold), backgroundColor: 'rgba(201,162,39,0.8)', borderRadius: 6 }]
  };

  const topRentedData = {
    labels: (topBooks?.topRented || []).map(b => b.book?.title?.substring(0, 18) || '-'),
    datasets: [{ label: 'عدد مرات التأجير', data: (topBooks?.topRented || []).map(b => b.totalRented), backgroundColor: 'rgba(52,152,219,0.8)', borderRadius: 6 }]
  };

  const categoryData = {
    labels: (topBooks?.categoryStats || []).map(c => c._id),
    datasets: [{ data: (topBooks?.categoryStats || []).map(c => c.count), backgroundColor: ['rgba(201,162,39,0.8)', 'rgba(52,152,219,0.8)', 'rgba(39,174,96,0.8)', 'rgba(231,76,60,0.8)', 'rgba(155,89,182,0.8)', 'rgba(243,156,18,0.8)'], borderWidth: 0 }]
  };

  const monthlyTrend = {
    labels: monthly.map(m => MONTHS[m.month - 1]),
    datasets: [
      { label: 'إيرادات (جنيه)', data: monthly.map(m => m.revenue), backgroundColor: 'rgba(39,174,96,0.8)', borderRadius: 4 },
      { label: 'مصروفات (جنيه)', data: monthly.map(m => m.expenses), backgroundColor: 'rgba(231,76,60,0.7)', borderRadius: 4 },
    ]
  };

  return (
    <>
      <div className="page-header"><h1>التحليلات <span>والإحصائيات</span></h1></div>

      {/* Demographics */}
      <h3 style={{ marginBottom: 12, color: 'var(--accent)', fontSize: 15 }}>👥 التحليل الديموغرافي للعملاء</h3>
      <div className="two-col-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <h4 style={{ marginBottom: 14, fontSize: 14, color: 'var(--text-secondary)' }}>توزيع الجنس</h4>
          <div style={{ height: 250 }}><Doughnut data={genderData} options={chartOpts} /></div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 14 }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: '#3498db' }}>{demo?.gender?.male || 0}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ذكور</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: '#9b59b6' }}>{demo?.gender?.female || 0}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>إناث</div></div>
          </div>
        </div>
        <div className="card">
          <h4 style={{ marginBottom: 14, fontSize: 14, color: 'var(--text-secondary)' }}>توزيع الفئات العمرية</h4>
          <div style={{ height: 250 }}><Doughnut data={ageData} options={chartOpts} /></div>
        </div>
      </div>

      {/* Top Books */}
      <h3 style={{ marginBottom: 12, color: 'var(--accent)', fontSize: 15 }}>📚 أكثر الكتب طلباً</h3>
      <div className="two-col-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <h4 style={{ marginBottom: 14, fontSize: 14, color: 'var(--text-secondary)' }}>أكثر الكتب مبيعاً</h4>
          <div style={{ height: 240 }}><Bar data={topSoldData} options={barOpts} /></div>
        </div>
        <div className="card">
          <h4 style={{ marginBottom: 14, fontSize: 14, color: 'var(--text-secondary)' }}>أكثر الكتب تأجيراً</h4>
          <div style={{ height: 240 }}><Bar data={topRentedData} options={barOpts} /></div>
        </div>
      </div>

      {/* Category & Monthly Trend */}
      <h3 style={{ marginBottom: 12, color: 'var(--accent)', fontSize: 15 }}>📊 تحليل التصنيفات والاتجاهات الشهرية</h3>
      <div className="two-col-grid">
        <div className="card">
          <h4 style={{ marginBottom: 14, fontSize: 14, color: 'var(--text-secondary)' }}>أكثر التصنيفات طلباً</h4>
          <div style={{ height: 260 }}><Doughnut data={categoryData} options={chartOpts} /></div>
        </div>
        <div className="card">
          <h4 style={{ marginBottom: 14, fontSize: 14, color: 'var(--text-secondary)' }}>الإيرادات والمصروفات الشهرية ({new Date().getFullYear()})</h4>
          <div style={{ height: 260 }}><Bar data={monthlyTrend} options={barOpts} /></div>
        </div>
      </div>
    </>
  );
}
