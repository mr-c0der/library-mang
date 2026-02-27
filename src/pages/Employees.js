import React, { useState, useEffect } from 'react';
import api from '../api/axios';
const empty = { name: '', position: '', salary: '', phone: '', email: '', hireDate: new Date().toISOString().split('T')[0], notes: '' };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = async () => { setLoading(true); const r = await api.get('/employees'); setEmployees(r.data); setLoading(false); };
  useEffect(() => { load(); }, []);
  const openEdit = (e) => { setForm({ ...e, hireDate: new Date(e.hireDate).toISOString().split('T')[0] }); setEditing(e._id); setError(''); setModal(true); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try { if (editing) await api.put(`/employees/${editing}`, form); else await api.post('/employees', form); setModal(false); load(); }
    catch (err) { setError(err.response?.data?.message || 'حدث خطأ'); }
  };
  const handleDelete = async (id) => { if (!window.confirm('حذف هذا الموظف؟')) return; await api.delete(`/employees/${id}`); load(); };
  const fmt = (n) => (n || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 });
  const totalSalaries = employees.filter(e => e.isActive).reduce((t, e) => t + e.salary, 0);

  return (
    <>
      <div className="page-header">
        <h1>إدارة <span>الموظفين</span></h1>
        <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(null); setError(''); setModal(true); }}>➕ إضافة موظف</button>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card blue"><div className="stat-icon">👨‍💼</div><div className="stat-value">{employees.length}</div><div className="stat-label">إجمالي الموظفين</div></div>
        <div className="stat-card green"><div className="stat-icon">✅</div><div className="stat-value">{employees.filter(e => e.isActive).length}</div><div className="stat-label">موظفون نشطون</div></div>
        <div className="stat-card red"><div className="stat-icon">💸</div><div className="stat-value">{fmt(totalSalaries)}</div><div className="stat-label">إجمالي الرواتب (جنيه)</div></div>
      </div>
      <div className="card">
        {loading ? <div className="loading-wrapper"><div className="spinner"></div></div> :
          employees.length === 0 ? <div className="empty-state"><div className="empty-icon">👨‍💼</div><h3>لا يوجد موظفون</h3></div> :
          <div className="table-container"><table className="data-table">
            <thead><tr><th>#</th><th>الاسم</th><th>المنصب</th><th>الراتب</th><th>الهاتف</th><th>تاريخ التعيين</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>{employees.map((e, i) => (
              <tr key={e._id}>
                <td>{i + 1}</td>
                <td><strong style={{ color: 'var(--text-primary)' }}>{e.name}</strong></td>
                <td>{e.position}</td>
                <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{fmt(e.salary)} ج</td>
                <td>{e.phone || '-'}</td>
                <td style={{ fontSize: 12 }}>{new Date(e.hireDate).toLocaleDateString('ar-EG')}</td>
                <td><span className={`badge ${e.isActive ? 'badge-success' : 'badge-danger'}`}>{e.isActive ? 'نشط' : 'غير نشط'}</span></td>
                <td><div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e._id)}>🗑️</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        }
      </div>
      {modal && (
        <div className="modal-overlay" onClick={ev => ev.target === ev.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>{editing ? '✏️ تعديل الموظف' : '➕ إضافة موظف'}</h3><button className="close-btn" onClick={() => setModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}><div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="two-col-grid">
                <div className="form-group"><label className="form-label">الاسم *</label><input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">المنصب *</label><input className="form-control" required value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></div>
              </div>
              <div className="two-col-grid">
                <div className="form-group"><label className="form-label">الراتب (جنيه) *</label><input className="form-control" type="number" min="0" required value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">الهاتف</label><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="two-col-grid">
                <div className="form-group"><label className="form-label">البريد</label><input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">تاريخ التعيين</label><input className="form-control" type="date" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} /></div>
              </div>
              {editing && <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive !== false} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                <span className="form-label" style={{ margin: 0 }}>موظف نشط</span>
              </label></div>}
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
