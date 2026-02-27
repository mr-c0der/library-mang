import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const empty = { name: '', age: '', gender: 'ذكر', phone: '', email: '', notes: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api.get('/customers', { params: { search } });
    setCustomers(res.data); setLoading(false);
  };
  useEffect(() => { load(); }, [search]);

  const openAdd = () => { setForm(empty); setEditing(null); setError(''); setModal(true); };
  const openEdit = (c) => { setForm({ ...c }); setEditing(c._id); setError(''); setModal(true); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) await api.put(`/customers/${editing}`, form);
      else await api.post('/customers', form);
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.message || 'حدث خطأ'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذا العميل؟')) return;
    await api.delete(`/customers/${id}`); load();
  };

  const ageGroup = (age) => {
    if (age < 18) return 'أقل من 18';
    if (age <= 25) return '18-25';
    if (age <= 35) return '26-35';
    if (age <= 50) return '36-50';
    return 'أكثر من 50';
  };

  return (
    <>
      <div className="page-header">
        <h1>إدارة <span>العملاء</span></h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ maxWidth: 240 }}>
            <span>🔍</span>
            <input placeholder="اسم أو رقم هاتف..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>➕ إضافة عميل</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card blue"><div className="stat-icon">👥</div><div className="stat-value">{customers.length}</div><div className="stat-label">إجمالي العملاء</div></div>
        <div className="stat-card blue"><div className="stat-icon">👨</div><div className="stat-value">{customers.filter(c => c.gender === 'ذكر').length}</div><div className="stat-label">ذكور</div></div>
        <div className="stat-card gold"><div className="stat-icon">👩</div><div className="stat-value">{customers.filter(c => c.gender === 'أنثى').length}</div><div className="stat-label">إناث</div></div>
      </div>

      <div className="card">
        {loading ? <div className="loading-wrapper"><div className="spinner"></div></div> :
          customers.length === 0 ? <div className="empty-state"><div className="empty-icon">👥</div><h3>لا يوجد عملاء</h3></div> :
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>#</th><th>الاسم</th><th>العمر</th><th>الفئة العمرية</th><th>الجنس</th><th>الهاتف</th><th>البريد</th><th>الإجراءات</th></tr></thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c._id}>
                    <td>{i + 1}</td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong></td>
                    <td>{c.age}</td>
                    <td><span className="badge badge-info">{ageGroup(c.age)}</span></td>
                    <td><span className={`badge ${c.gender === 'ذكر' ? 'badge-info' : 'badge-gold'}`}>{c.gender}</span></td>
                    <td>{c.phone || '-'}</td>
                    <td style={{ fontSize: 12 }}>{c.email || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>🗑️</button>
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
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>{editing ? '✏️ تعديل بيانات العميل' : '➕ إضافة عميل جديد'}</h3><button className="close-btn" onClick={() => setModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="two-col-grid">
                  <div className="form-group">
                    <label className="form-label">الاسم الكامل *</label>
                    <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">العمر *</label>
                    <input className="form-control" type="number" min="1" required value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">الجنس *</label>
                  <select className="form-control" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
                <div className="two-col-grid">
                  <div className="form-group">
                    <label className="form-label">رقم الهاتف</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">البريد الإلكتروني</label>
                    <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
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
