import React, { useState, useEffect } from 'react';
import api from '../api/axios';
const TYPES = ['أجهزة كمبيوتر', 'أثاث', 'معدات', 'مركبات', 'أخرى'];
const empty = { name: '', type: 'أثاث', purchasePrice: '', currentValue: '', purchaseDate: new Date().toISOString().split('T')[0], quantity: 1, notes: '' };

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = async () => { setLoading(true); const r = await api.get('/assets'); setAssets(r.data); setLoading(false); };
  useEffect(() => { load(); }, []);
  const openEdit = (a) => { setForm({ ...a, purchaseDate: new Date(a.purchaseDate).toISOString().split('T')[0] }); setEditing(a._id); setError(''); setModal(true); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try { if (editing) await api.put(`/assets/${editing}`, form); else await api.post('/assets', form); setModal(false); load(); }
    catch (err) { setError(err.response?.data?.message || 'حدث خطأ'); }
  };
  const handleDelete = async (id) => { if (!window.confirm('حذف هذا الأصل؟')) return; await api.delete(`/assets/${id}`); load(); };
  const fmt = (n) => (n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 });
  const totalValue = assets.reduce((t, a) => t + a.currentValue * a.quantity, 0);

  return (
    <>
      <div className="page-header">
        <h1>الأصول <span>الثابتة</span></h1>
        <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(null); setError(''); setModal(true); }}>➕ إضافة أصل</button>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: 20 }}>
        <div className="stat-card blue"><div className="stat-icon">🏢</div><div className="stat-value">{assets.length}</div><div className="stat-label">عدد الأصول</div></div>
        <div className="stat-card gold"><div className="stat-icon">💎</div><div className="stat-value">{fmt(totalValue)}</div><div className="stat-label">إجمالي قيمة الأصول (جنيه)</div></div>
      </div>
      <div className="card">
        {loading ? <div className="loading-wrapper"><div className="spinner"></div></div> :
          assets.length === 0 ? <div className="empty-state"><div className="empty-icon">🏢</div><h3>لا توجد أصول</h3></div> :
          <div className="table-container"><table className="data-table">
            <thead><tr><th>#</th><th>الأصل</th><th>النوع</th><th>الكمية</th><th>سعر الشراء</th><th>القيمة الحالية</th><th>تاريخ الشراء</th><th>إجراءات</th></tr></thead>
            <tbody>{assets.map((a, i) => (
              <tr key={a._id}>
                <td>{i + 1}</td>
                <td><strong style={{ color: 'var(--text-primary)' }}>{a.name}</strong></td>
                <td><span className="badge badge-info">{a.type}</span></td>
                <td>{a.quantity}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{fmt(a.purchasePrice)} ج</td>
                <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmt(a.currentValue)} ج</td>
                <td style={{ fontSize: 12 }}>{new Date(a.purchaseDate).toLocaleDateString('ar-EG')}</td>
                <td><div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a._id)}>🗑️</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        }
      </div>
      {modal && (
        <div className="modal-overlay" onClick={ev => ev.target === ev.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>{editing ? '✏️ تعديل الأصل' : '➕ إضافة أصل'}</h3><button className="close-btn" onClick={() => setModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}><div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="two-col-grid">
                <div className="form-group"><label className="form-label">اسم الأصل *</label><input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">النوع *</label><select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="three-col-grid">
                <div className="form-group"><label className="form-label">سعر الشراء *</label><input className="form-control" type="number" min="0" required value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">القيمة الحالية *</label><input className="form-control" type="number" min="0" required value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">الكمية</label><input className="form-control" type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">تاريخ الشراء</label><input className="form-control" type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} /></div>
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
