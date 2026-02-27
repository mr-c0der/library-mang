import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const empty = { customer: '', book: '', quantity: 1, unitPrice: '', totalAmount: '', isPaid: false, notes: '' };

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const [s, c, b] = await Promise.all([api.get('/sales'), api.get('/customers'), api.get('/books')]);
    setSales(s.data); setCustomers(c.data); setBooks(b.data.filter(b => b.isAvailableForSale && b.stock > 0));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const onBookChange = (bookId) => {
    const bk = books.find(b => b._id === bookId);
    if (bk) {
      const total = bk.salePrice * (form.quantity || 1);
      setForm(f => ({ ...f, book: bookId, unitPrice: bk.salePrice, totalAmount: total }));
    } else setForm(f => ({ ...f, book: bookId }));
  };

  const onQtyChange = (qty) => {
    const bk = books.find(b => b._id === form.book);
    const total = bk ? bk.salePrice * qty : form.unitPrice * qty;
    setForm(f => ({ ...f, quantity: qty, totalAmount: total }));
  };

  const openAdd = () => { setForm(empty); setEditing(null); setError(''); setModal(true); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) await api.put(`/sales/${editing}`, form);
      else await api.post('/sales', form);
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.message || 'حدث خطأ'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('حذف عملية البيع؟')) return;
    await api.delete(`/sales/${id}`); load();
  };
  const togglePaid = async (id, val) => {
    await api.put(`/sales/${id}`, { isPaid: !val }); load();
  };

  const fmt = (n) => (n || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 });
  const totalRev = sales.filter(s => s.isPaid).reduce((t, s) => t + s.totalAmount, 0);
  const pending = sales.filter(s => !s.isPaid).reduce((t, s) => t + s.totalAmount, 0);

  return (
    <>
      <div className="page-header">
        <h1>إدارة <span>المبيعات</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>➕ بيع كتاب</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="stat-card green"><div className="stat-icon">💰</div><div className="stat-value">{fmt(totalRev)}</div><div className="stat-label">إيرادات مستلمة (دينار)</div></div>
        <div className="stat-card gold"><div className="stat-icon">⏳</div><div className="stat-value">{fmt(pending)}</div><div className="stat-label">مبالغ معلقة (دينار)</div></div>
        <div className="stat-card blue"><div className="stat-icon">🛒</div><div className="stat-value">{sales.length}</div><div className="stat-label">إجمالي عمليات البيع</div></div>
      </div>

      <div className="card">
        {loading ? <div className="loading-wrapper"><div className="spinner"></div></div> :
          sales.length === 0 ? <div className="empty-state"><div className="empty-icon">🛒</div><h3>لا توجد مبيعات</h3><p>ابدأ ببيع أول كتاب</p></div> :
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>#</th><th>العميل</th><th>الكتاب</th><th>الكمية</th><th>المبلغ</th><th>الدفع</th><th>التاريخ</th><th>الإجراءات</th></tr></thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={s._id}>
                    <td>{i + 1}</td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{s.customer?.name || '-'}</strong></td>
                    <td>{s.book?.title || '-'}</td>
                    <td><span className="badge badge-info">{s.quantity}</span></td>
                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmt(s.totalAmount)} د</td>
                    <td>
                      <button onClick={() => togglePaid(s._id, s.isPaid)} className={`badge ${s.isPaid ? 'badge-success' : 'badge-danger'}`} style={{ border: 'none', cursor: 'pointer' }}>
                        {s.isPaid ? '✅ مدفوع' : '❌ غير مدفوع'}
                      </button>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(s.saleDate).toLocaleDateString('ar-EG')}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>🗑️</button></td>
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
            <div className="modal-header"><h3>🛒 بيع كتاب</h3><button className="close-btn" onClick={() => setModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="form-group">
                  <label className="form-label">العميل *</label>
                  <select className="form-control" required value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}>
                    <option value="">اختر عميلاً...</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الكتاب *</label>
                  <select className="form-control" required value={form.book} onChange={e => onBookChange(e.target.value)}>
                    <option value="">اختر كتاباً...</option>
                    {books.map(b => <option key={b._id} value={b._id}>{b.title} - ({b.stock} متاح) - {b.salePrice} د</option>)}
                  </select>
                </div>
                <div className="two-col-grid">
                  <div className="form-group">
                    <label className="form-label">الكمية *</label>
                    <input className="form-control" type="number" min="1" required value={form.quantity} onChange={e => onQtyChange(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">الإجمالي (دينار)</label>
                    <input className="form-control" type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isPaid} onChange={e => setForm({ ...form, isPaid: e.target.checked })} />
                    <span className="form-label" style={{ margin: 0 }}>تم الدفع</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">✅ تأكيد البيع</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
