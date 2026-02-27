import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Accounting() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/analytics/summary').then(r => setSummary(r.data)).finally(() => setLoading(false));
  }, []);

  const fmt = (n) => (n || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 });

  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get('/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `تقرير_المكتبة_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;
      a.click(); window.URL.revokeObjectURL(url);
    } catch (err) { alert('حدث خطأ في تصدير الملف'); }
    finally { setExporting(false); }
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner"></div></div>;

  const netProfit = summary?.netProfit || 0;

  const Section = ({ title, rows, color }) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ padding: '10px 16px', background: 'var(--bg-dark)', fontSize: 13, fontWeight: 700, color, borderRight: `3px solid ${color}` }}>{title}</div>
      {rows.map(([label, val, valColor]) => (
        <div key={label} className="summary-row">
          <span className="label" style={{ paddingRight: 12 }}>{label}</span>
          <span className="value" style={{ color: valColor || 'var(--text-primary)' }}>{val}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h1>التقارير <span>المالية</span></h1>
        <button className="btn btn-primary" onClick={exportExcel} disabled={exporting}>
          {exporting ? '⏳ جارٍ التصدير...' : '📥 تصدير Excel'}
        </button>
      </div>

      <div className="two-col-grid" style={{ marginBottom: 24 }}>
        {/* Income Statement */}
        <div className="card">
          <h3 style={{ marginBottom: 16, color: 'var(--accent)', fontSize: 16, fontWeight: 800 }}>📑 قائمة الدخل</h3>
          <Section title="الإيرادات" color="var(--success)" rows={[
            ['إيرادات المبيعات', `${fmt(summary?.revenue?.sales)} د`, 'var(--success)'],
            ['إيرادات التأجير', `${fmt(summary?.revenue?.rentals)} د`, 'var(--success)'],
            ['غرامات التأخير', `${fmt(summary?.revenue?.lateFees)} د`, 'var(--warning)'],
          ]} />
          <div className="summary-row" style={{ borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <span className="label" style={{ fontWeight: 700 }}>إجمالي الإيرادات</span>
            <span className="value" style={{ color: 'var(--success)', fontWeight: 800, fontSize: 16 }}>{fmt(summary?.revenue?.total)} د</span>
          </div>

          <div style={{ marginTop: 12 }}>
            <Section title="المصروفات" color="var(--danger)" rows={[
              ['المصروفات التشغيلية', `${fmt(summary?.expenses?.operations)} د`, 'var(--danger)'],
              ['إجمالي الرواتب', `${fmt(summary?.expenses?.salaries)} د`, 'var(--danger)'],
            ]} />
            <div className="summary-row" style={{ borderTop: '1px solid var(--border)', marginTop: 4 }}>
              <span className="label" style={{ fontWeight: 700 }}>إجمالي المصروفات</span>
              <span className="value" style={{ color: 'var(--danger)', fontWeight: 800, fontSize: 16 }}>{fmt(summary?.expenses?.total)} د</span>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '16px', borderRadius: 10, background: netProfit >= 0 ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)', border: `1px solid ${netProfit >= 0 ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>💰 صافي الربح</span>
              <span style={{ fontWeight: 900, fontSize: 24, color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(netProfit)} د</span>
            </div>
          </div>
        </div>

        {/* Other Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16, color: 'var(--accent)', fontSize: 16, fontWeight: 800 }}>⏳ المبالغ المعلقة</h3>
            <div className="summary-row">
              <span className="label">مبيعات غير مدفوعة</span>
              <span className="value" style={{ color: 'var(--warning)' }}>{fmt(summary?.pending?.unpaidSales)} د</span>
            </div>
            <div className="summary-row">
              <span className="label">تأجيرات غير مدفوعة</span>
              <span className="value" style={{ color: 'var(--warning)' }}>{fmt(summary?.pending?.unpaidRentals)} د</span>
            </div>
            <div className="summary-row">
              <span className="label">غرامات تأخير معلقة</span>
              <span className="value" style={{ color: 'var(--danger)' }}>{fmt(summary?.pending?.pendingLateFees)} د</span>
            </div>
            <div className="summary-row total">
              <span className="label">الإجمالي المعلق</span>
              <span className="value" style={{ color: 'var(--warning)', fontSize: 18 }}>
                {fmt((summary?.pending?.unpaidSales || 0) + (summary?.pending?.unpaidRentals || 0) + (summary?.pending?.pendingLateFees || 0))} د
              </span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16, color: 'var(--accent)', fontSize: 16, fontWeight: 800 }}>⚖️ موقف الديون</h3>
            <div className="summary-row">
              <span className="label">ديون لي (غير مسددة)</span>
              <span className="value" style={{ color: 'var(--success)' }}>{fmt(summary?.debts?.owedToMe)} د</span>
            </div>
            <div className="summary-row">
              <span className="label">ديون علي (غير مسددة)</span>
              <span className="value" style={{ color: 'var(--danger)' }}>{fmt(summary?.debts?.owedByMe)} د</span>
            </div>
            <div className="summary-row total">
              <span className="label">صافي موقف الديون</span>
              <span className="value" style={{ color: (summary?.debts?.owedToMe - summary?.debts?.owedByMe) >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 16 }}>
                {fmt((summary?.debts?.owedToMe || 0) - (summary?.debts?.owedByMe || 0))} د
              </span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16, color: 'var(--accent)', fontSize: 16, fontWeight: 800 }}>📊 إحصائيات العمليات</h3>
            <div className="summary-row"><span className="label">تأجيرات نشطة</span><span className="value badge badge-info">{summary?.stats?.activeRentals || 0}</span></div>
            <div className="summary-row"><span className="label">تأجيرات متأخرة</span><span className="value badge badge-danger">{summary?.stats?.overdueRentals || 0}</span></div>
            <div className="summary-row"><span className="label">إجمالي المبيعات</span><span className="value">{summary?.stats?.totalSales || 0} عملية</span></div>
            <div className="summary-row"><span className="label">إجمالي التأجيرات</span><span className="value">{summary?.stats?.totalRentals || 0} تأجير</span></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📥</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>تصدير تقرير شامل</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>تنزيل ملف Excel يحتوي على 5 جداول: المبيعات، التأجيرات، المصروفات، الموظفين، والملخص المالي</p>
        <button className="btn btn-primary" onClick={exportExcel} disabled={exporting} style={{ fontSize: 16, padding: '14px 40px' }}>
          {exporting ? '⏳ جارٍ التصدير...' : '📥 تصدير ملف Excel الآن'}
        </button>
      </div>
    </>
  );
}
