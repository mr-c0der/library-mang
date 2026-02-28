import React, { useState, useEffect } from 'react';
import api from '../api/axios';
const empty = { party: '', amount: '', direction: 'لي', description: '', date: new Date().toISOString().split('T')[0], dueDate: '', isPaid: false, notes: '' };

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [dirFilter, setDirFilter] = useState('');
  const [error, setError] = useState('');

  const load = async () => { setLoading(true); const r = await api.get('/debts', { params: { direction: dirFilter } }); setDebts(r.data); setLoading(false); };
  useEffect(() => { load(); }, [dirFilter]);
  const openEdit = (d) => { setForm({ ...d, date: new Date(d.date).toISOString().split('T')[0], dueDate: d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : '' }); setEditing(d._id); setError(''); setModal(true); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try { if (editing) await api.put(`/debts/${editing}`, form); else await api.post('/debts', form); setModal(false); load(); }
    catch (err) { setError(err.response?.data?.message || 'حدث خطأ'); }
  };
  const handleDelete = async (id) => { if (!window.confirm('حذف هذا الدين؟')) return; await api.delete(`/debts/${id}`); load(); };
  const togglePaid = async (id, val) => { await api.put(`/debts/${id}`, { isPaid: !val }); load(); };
  const fmt = (n) => (n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 });
  const owedToMe = debts.filter(d => d.direction === 'لي' && !d.isPaid).reduce((t, d) => t + d.amount, 0);
  const owedByMe = debts.filter(d => d.direction === 'علي' && !d.isPaid).reduce((t, d) => t + d.amount, 0);

  return (
    <>
      <div className="page-header">
        <h1>إدارة <span>الديون</span></h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="form-control" style={{ width: 140 }} value={dirFilter} onChange={e => setDirFilter(e.target.value)}>
            <option value="">الكل</option><option value="لي">ديون لي</option><option value="علي">ديون علي</option>
          </select>
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(null); setError(''); setModal(true); }}>➕ إضافة دين</button>
        </div>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card green"><div className="stat-icon">💰</div><div className="stat-value">{fmt(owedToMe)}</div><div className="stat-label">ديون لي (جنيه)</div></div>
        <div className="stat-card red"><div className="stat-icon">💳</div><div className="stat-value">{fmt(owedByMe)}</div><div className="stat-label">ديون علي (جنيه)</div></div>
        <div className="stat-card gold"><div className="stat-icon">⚖️</div><div className="stat-value">{fmt(owedToMe - owedByMe)}</div><div className="stat-label">الصافي (جنيه)</div></div>
      </div>
      <div className="card">
        {loading ? <div className="loading-wrapper"><div className="spinner"></div></div> :
          debts.length === 0 ? <div className="empty-state"><div className="empty-icon">⚖️</div><h3>لا توجد ديون</h3></div> :
          <div className="table-container"><table className="data-table">
            <thead><tr><th>#</th><th>الطرف</th><th>الاتجاه</th><th>المبلغ</th><th>الوصف</th><th>الاستحقاق</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>{debts.map((d, i) => (
              <tr key={d._id}>
                <td>{i + 1}</td>
                <td><strong style={{ color: 'var(--text-primary)' }}>{d.party}</strong></td>
                <td><span className={`badge ${d.direction === 'لي' ? 'badge-success' : 'badge-danger'}`}>{d.direction}</span></td>
                <td style={{ fontWeight: 700, color: d.direction === 'لي' ? 'var(--success)' : 'var(--danger)' }}>{fmt(d.amount)} ج</td>
                <td style={{ fontSize: 12 }}>{d.description || '-'}</td>
                <td style={{ fontSize: 12 }}>{d.dueDate ? new Date(d.dueDate).toLocaleDateString('ar-EG') : '-'}</td>
                <td>
                  <button onClick={() => togglePaid(d._id, d.isPaid)} className={`badge ${d.isPaid ? 'badge-success' : 'badge-warning'}`} style={{ border: 'none', cursor: 'pointer' }}>
                    {d.isPaid ? '✅ تم السداد' : '⏳ معلق'}
                  </button>
                </td>
                <td><div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d._id)}>🗑️</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        }
      </div>
      {modal && (
        <div className="modal-overlay" onClick={ev => ev.target === ev.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>{editing ? '✏️ تعديل الدين' : '➕ إضافة دين'}</h3><button className="close-btn" onClick={() => setModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}><div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="two-col-grid">
                <div className="form-group"><label className="form-label">اسم الطرف *</label><input className="form-control" required value={form.party} onChange={e => setForm({ ...form, party: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">الاتجاه *</label><select className="form-control" value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}><option value="لي">لي (يديني)</option><option value="علي">علي (أدين له)</option></select></div>
              </div>
              <div className="two-col-grid">
                <div className="form-group"><label className="form-label">المبلغ (جنيه) *</label><input className="form-control" type="number" min="0" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">تاريخ الاستحقاق</label><input className="form-control" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">الوصف</label><textarea className="form-control" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
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
