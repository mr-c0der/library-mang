import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const CATEGORIES = ['تعليمي', 'أدب', 'قصص أطفال', 'ديني', 'علمي', 'تاريخ', 'رواية', 'أخرى'];
const empty = { title: '', author: '', category: 'تعليمي', salePrice: '', rentalPricePerDay: '', purchasePrice: '', stock: '', description: '' };

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api.get('/books', { params: { search, category: catFilter } });
    setBooks(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, catFilter]);

  const openAdd = () => { setForm(empty); setEditing(null); setError(''); setModal(true); };
  const openEdit = (b) => { setForm({ ...b }); setEditing(b._id); setError(''); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) await api.put(`/books/${editing}`, form);
      else await api.post('/books', form);
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.message || 'حدث خطأ'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;
    await api.delete(`/books/${id}`); load();
  };

  return (
    <>
      <div className="page-header">
        <h1>إدارة <span>الكتب</span></h1>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ maxWidth: 220 }}>
            <span>🔍</span>
            <input placeholder="ابحث عن كتاب..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 140 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">كل التصنيفات</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}>➕ إضافة كتاب</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-wrapper"><div className="spinner"></div></div> :
          books.length === 0 ? <div className="empty-state"><div className="empty-icon">📚</div><h3>لا توجد كتب</h3><p>ابدأ بإضافة أول كتاب</p></div> :
          <div className="table-container">
            <table className="data-table">
              <thead><tr>
                <th>#</th><th>العنوان</th><th>المؤلف</th><th>التصنيف</th>
                <th>سعر البيع</th><th>سعر التأجير/يوم</th><th>المخزون</th><th>الإجراءات</th>
              </tr></thead>
              <tbody>
                {books.map((b, i) => (
                  <tr key={b._id}>
                    <td>{i + 1}</td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{b.title}</strong></td>
                    <td>{b.author}</td>
                    <td><span className="badge badge-gold">{b.category}</span></td>
                    <td style={{ color: 'var(--success)' }}>{b.salePrice} د</td>
                    <td style={{ color: 'var(--info)' }}>{b.rentalPricePerDay} د</td>
                    <td>
                      <span className={`badge ${b.stock > 5 ? 'badge-success' : b.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                        {b.stock} نسخة
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b._id)}>🗑️</button>
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
            <div className="modal-header">
              <h3>{editing ? '✏️ تعديل الكتاب' : '➕ إضافة كتاب جديد'}</h3>
              <button className="close-btn" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="two-col-grid">
                  <div className="form-group">
                    <label className="form-label">عنوان الكتاب *</label>
                    <input className="form-control" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">اسم المؤلف *</label>
                    <input className="form-control" required value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">التصنيف *</label>
                  <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="three-col-grid">
                  <div className="form-group">
                    <label className="form-label">سعر البيع (دينار)</label>
                    <input className="form-control" type="number" min="0" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">سعر التأجير/يوم</label>
                    <input className="form-control" type="number" min="0" value={form.rentalPricePerDay} onChange={e => setForm({ ...form, rentalPricePerDay: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">سعر الشراء (دينار)</label>
                    <input className="form-control" type="number" min="0" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">الكمية في المخزون</label>
                  <input className="form-control" type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">وصف الكتاب</label>
                  <textarea className="form-control" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">{editing ? '💾 حفظ التعديلات' : '➕ إضافة الكتاب'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
