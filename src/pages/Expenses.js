import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const CATS = ['راتب موظف', 'كهرباء', 'مياه', 'إنترنت', 'شراء كتب', 'إيجار', 'صيانة', 'أخرى'];
const empty = { title: '', amount: '', type: 'متغير', category: 'أخرى', date: new Date().toISOString().split('T')[0], notes: '' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api.get('/expenses', { params: { type: typeFilter } });
    setExpenses(res.data); setLoading(false);
  };
  useEffect(() => { load(); }, [typeFilter]);

  const openAdd = () => { setForm(empty); setEditing(null); setError(''); setModal(true); };
  const openEdit = (e) => { setForm({ ...e, date: new Date(e.date).toISOString().split('T')[0] }); setEditing(e._id); setError(''); setModal(true); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) await api.put(`/expenses/${editing}`, form);
      else await api.post('/expenses', form);
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.message || 'حدث خطأ'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذا المصروف؟')) return;
    await api.delete(`/expenses/${id}`); load();
  };

  const fmt = (n) => (n || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 });
  const totalFixed = expenses.filter(e => e.type === 'ثابت').reduce((t, e) => t + e.amount, 0);
  const totalVar = expenses.filter(e => e.type === 'متغير').reduce((t, e) => t + e.amount, 0);

  return (
    <>
      <div className="page-header">
        <h1>إدارة <span>المصروفات</span></h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="form-control" style={{ width: 140 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">كل الأنواع</option>
            <option value="ثابت">ثابتة</option>
            <option value="متغير">متغيرة</option>
          </select>
          <button className="btn btn-primary" onClick={openAdd}>➕ إضافة مصروف</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card red"><div className="stat-icon">📉</div><div className="stat-value">{fmt(totalFixed + totalVar)}</div><div className="stat-label">إجمالي المصروفات (دينار)</div></div>
        <div className="stat-card red"><div className="stat-icon">📌</div><div className="stat-value">{fmt(totalFixed)}</div><div className="stat-label">مصروفات ثابتة (دينار)</div></div>
        <div className="stat-card gold"><div className="stat-icon">📊</div><div className="stat-value">{fmt(totalVar)}</div><div className="stat-label">مصروفات متغيرة (دينار)</div></div>
      </div>

      <div className="card">
        {loading ? <div className="loading-wrapper"><div className="spinner"></div></div> :
          expenses.length === 0 ? <div className="empty-state"><div className="empty-icon">📉</div><h3>لا توجد مصروفات</h3></div> :
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>#</th><th>البند</th><th>الفئة</th><th>النوع</th><th>المبلغ</th><th>التاريخ</th><th>الإجراءات</th></tr></thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={e._id}>
                    <td>{i + 1}</td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{e.title}</strong></td>
                    <td><span className="badge badge-info">{e.category}</span></td>
                    <td><span className={`badge ${e.type === 'ثابت' ? 'badge-danger' : 'badge-warning'}`}>{e.type}</span></td>
                    <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{fmt(e.amount)} د</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(e.date).toLocaleDateString('ar-EG')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {modal && (
        <div className="modal-overlay" onClick={ev => ev.target === ev.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>{editing ? '✏️ تعديل المصروف' : '➕ إضافة مصروف'}</h3><button className="close-btn" onClick={() => setModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="form-group">
                  <label className="form-label">اسم البند *</label>
                  <input className="form-control" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="two-col-grid">
                  <div className="form-group">
                    <label className="form-label">الفئة *</label>
                    <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">النوع *</label>
                    <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="ثابت">ثابت</option>
                      <option value="متغير">متغير</option>
                    </select>
                  </div>
                </div>
                <div className="two-col-grid">
                  <div className="form-group">
                    <label className="form-label">المبلغ (دينار) *</label>
                    <input className="form-control" type="number" min="0" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">التاريخ *</label>
                    <input className="form-control" type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">ملاحظات</label>
                  <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">{editing ? '💾 حفظ' : '➕ إضافة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
