import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const emptyRental = { customer: '', book: '', durationDays: 1, pricePerDay: '', totalAmount: '', isPaid: false, notes: '' };

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyRental);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const [r, c, b] = await Promise.all([
      api.get('/rentals', { params: { status: statusFilter } }),
      api.get('/customers'), api.get('/books')
    ]);
    setRentals(r.data); setCustomers(c.data); setBooks(b.data.filter(x => x.isAvailableForRental && x.stock > 0));
    setLoading(false);
  };
  useEffect(() => { load(); }, [statusFilter]);

  const onBookChange = (bookId) => {
    const bk = books.find(b => b._id === bookId);
    if (bk) {
      const total = bk.rentalPricePerDay * (form.durationDays || 1);
      setForm(f => ({ ...f, book: bookId, pricePerDay: bk.rentalPricePerDay, totalAmount: total }));
    } else setForm(f => ({ ...f, book: bookId }));
  };

  const onDaysChange = (days) => {
    const total = form.pricePerDay * days;
    setForm(f => ({ ...f, durationDays: days, totalAmount: total }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Number(form.durationDays));
      await api.post('/rentals', { ...form, dueDate });
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.message || 'حدث خطأ'); }
  };

  const handleReturn = async (id) => {
    if (!window.confirm('تأكيد إرجاع الكتاب؟')) return;
    await api.put(`/rentals/${id}/return`); load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذا التأجير؟')) return;
    await api.delete(`/rentals/${id}`); load();
  };

  const togglePaid = async (id, val) => { await api.put(`/rentals/${id}`, { isPaid: !val }); load(); };
  const fmt = (n) => (n || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 });

  const statusColor = { 'نشط': 'badge-info', 'مُرجَع': 'badge-success', 'متأخر': 'badge-danger' };

  return (
    <>
      <div className="page-header">
        <h1>إدارة <span>التأجيرات</span></h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="form-control" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="نشط">نشط</option>
            <option value="مُرجَع">مُرجَع</option>
            <option value="متأخر">متأخر</option>
          </select>
          <button className="btn btn-primary" onClick={() => { setForm(emptyRental); setError(''); setModal(true); }}>➕ تأجير كتاب</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card blue"><div className="stat-icon">🔄</div><div className="stat-value">{rentals.filter(r => r.status === 'نشط').length}</div><div className="stat-label">نشطة</div></div>
        <div className="stat-card red"><div className="stat-icon">⚠️</div><div className="stat-value">{rentals.filter(r => r.status === 'متأخر').length}</div><div className="stat-label">متأخرة</div></div>
        <div className="stat-card green"><div className="stat-icon">✅</div><div className="stat-value">{rentals.filter(r => r.status === 'مُرجَع').length}</div><div className="stat-label">مُرجَعة</div></div>
        <div className="stat-card gold"><div className="stat-icon">💰</div><div className="stat-value">{fmt(rentals.reduce((t, r) => t + r.lateFee, 0))}</div><div className="stat-label">غرامات (جنيه)</div></div>
      </div>

      <div className="card">
        {loading ? <div className="loading-wrapper"><div className="spinner"></div></div> :
          rentals.length === 0 ? <div className="empty-state"><div className="empty-icon">🔄</div><h3>لا توجد تأجيرات</h3></div> :
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>#</th><th>العميل</th><th>الكتاب</th><th>المدة</th><th>المبلغ</th><th>الغرامة</th><th>الحالة</th><th>التسليم</th><th>الدفع</th><th>إجراءات</th></tr></thead>
              <tbody>
                {rentals.map((r, i) => (
                  <tr key={r._id}>
                    <td>{i + 1}</td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{r.customer?.name || '-'}</strong></td>
                    <td>{r.book?.title || '-'}</td>
                    <td>{r.durationDays} يوم</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmt(r.totalAmount)} ج</td>
                    <td style={{ color: 'var(--danger)' }}>{r.lateFee > 0 ? `${fmt(r.lateFee)} ج` : '-'}</td>
                    <td><span className={`badge ${statusColor[r.status] || 'badge-info'}`}>{r.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.dueDate).toLocaleDateString('ar-EG')}</td>
                    <td>
                      <button onClick={() => togglePaid(r._id, r.isPaid)} className={`badge ${r.isPaid ? 'badge-success' : 'badge-danger'}`} style={{ border: 'none', cursor: 'pointer' }}>
                        {r.isPaid ? '✅' : '❌'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.status !== 'مُرجَع' && <button className="btn btn-success btn-sm" onClick={() => handleReturn(r._id)}>↩️</button>}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>🗑️</button>
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
            <div className="modal-header"><h3>🔄 تأجير كتاب</h3><button className="close-btn" onClick={() => setModal(false)}>✕</button></div>
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
                    {books.map(b => <option key={b._id} value={b._id}>{b.title} - {b.rentalPricePerDay} ج/يوم</option>)}
                  </select>
                </div>
                <div className="two-col-grid">
                  <div className="form-group">
                    <label className="form-label">عدد الأيام *</label>
                    <input className="form-control" type="number" min="1" required value={form.durationDays} onChange={e => onDaysChange(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">الإجمالي (جنيه)</label>
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
                <button type="submit" className="btn btn-primary">✅ تأكيد التأجير</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
