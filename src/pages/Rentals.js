import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const emptyForm = {
  customerMode: 'existing',
  customerId: '',
  customerSearch: '',
  newCustomerName: '',
  newCustomerPhone: '',
  newCustomerEmail: '',
  newCustomerAge: '',
  newCustomerGender: 'ذكر',
  bookId: '',
  bookSearch: '',
  durationDays: '',
  pricePerDay: '',
  totalAmount: '',
  lateFee: '',
  isPaid: false,
  notes: ''
};

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const bookInputRef = useRef(null);
  const customerInputRef = useRef(null);

  const fmt = (n) => (n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 });
  const statusColor = { 'نشط': 'badge-info', 'مُرجَع': 'badge-success', 'متأخر': 'badge-danger' };

  const load = async () => {
    setLoading(true);
    const [r, c, b] = await Promise.all([
      api.get('/rentals', { params: { status: statusFilter } }),
      api.get('/customers'), api.get('/books')
    ]);
    setRentals(r.data); setCustomers(c.data);
    setBooks(b.data.filter(x => x.isAvailableForRental && x.stock > 0));
    setLoading(false);
  };
  useEffect(() => { load(); }, [statusFilter]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bookInputRef.current && !bookInputRef.current.contains(e.target)) setShowSuggestions(false);
      if (customerInputRef.current && !customerInputRef.current.contains(e.target)) setShowCustomerSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Customer search autocomplete
  const onCustomerSearchChange = (val) => {
    setForm(f => ({ ...f, customerSearch: val, customerId: '' }));
    if (val.trim().length > 0) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(val.toLowerCase()) ||
        (c.phone && c.phone.includes(val))
      );
      setCustomerSuggestions(filtered);
      setShowCustomerSuggestions(true);
    } else {
      setCustomerSuggestions(customers);
      setShowCustomerSuggestions(true);
    }
  };

  const selectCustomer = (c) => {
    setForm(f => ({ ...f, customerId: c._id, customerSearch: `${c.name} - ${c.phone || ''}` }));
    setShowCustomerSuggestions(false);
  };

  // Book search autocomplete
  const onBookSearchChange = (val) => {
    setForm(f => ({ ...f, bookSearch: val, bookId: '', pricePerDay: '', totalAmount: '' }));
    if (val.trim().length > 0) {
      const filtered = books.filter(b => b.title.toLowerCase().includes(val.toLowerCase()));
      setBookSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setBookSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectBook = (book) => {
    const days = Number(form.durationDays) || 1;
    setForm(f => ({ ...f, bookId: book._id, bookSearch: book.title, pricePerDay: book.rentalPricePerDay, totalAmount: book.rentalPricePerDay * days }));
    setShowSuggestions(false);
  };

  const onDaysChange = (val) => {
    setForm(f => {
      const newTotal = (f.pricePerDay || 0) * (Number(val) || 0);
      return { ...f, durationDays: val, totalAmount: newTotal || '' };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      let customerId = form.customerId;
      if (form.customerMode === 'new') {
        if (!form.newCustomerName.trim()) { setError('الرجاء إدخال اسم العميل'); return; }
        const res = await api.post('/customers', {
          name: form.newCustomerName.trim(),
          phone: form.newCustomerPhone.trim(),
          email: form.newCustomerEmail.trim(),
          age: form.newCustomerAge ? Number(form.newCustomerAge) : undefined,
          gender: form.newCustomerGender,
        });
        customerId = res.data._id;
      }
      if (!customerId) { setError('الرجاء اختيار عميل أو إضافة عميل جديد'); return; }
      if (!form.bookId) { setError('الرجاء اختيار كتاب من القائمة'); return; }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Number(form.durationDays));
      await api.post('/rentals', {
        customer: customerId,
        book: form.bookId,
        durationDays: Number(form.durationDays),
        pricePerDay: Number(form.pricePerDay),
        totalAmount: Number(form.totalAmount),
        lateFee: Number(form.lateFee) || 0,
        isPaid: form.isPaid,
        notes: form.notes,
        dueDate,
      });
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

  const openAdd = () => { setForm(emptyForm); setError(''); setBookSuggestions([]); setShowSuggestions(false); setModal(true); };

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
          <button className="btn btn-primary" onClick={openAdd}>➕ تأجير كتاب</button>
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
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header"><h3>🔄 تأجير كتاب</h3><button className="close-btn" onClick={() => setModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}

                {/* ───── Customer Section ───── */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, customerMode: 'existing' }))}
                      className={`btn btn-sm ${form.customerMode === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }}>
                      👤 اختر عميلاً موجوداً
                    </button>
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, customerMode: 'new', customerId: '' }))}
                      className={`btn btn-sm ${form.customerMode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }}>
                      ➕ أضف عميلاً جديداً
                    </button>
                  </div>

                  {form.customerMode === 'existing' ? (
                    <div className="form-group" style={{ position: 'relative' }} ref={customerInputRef}>
                      <label className="form-label">العميل * <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(اكتب للبحث)</span></label>
                      <input
                        className="form-control"
                        placeholder="ابحث بالاسم أو رقم الهاتف..."
                        value={form.customerSearch}
                        onChange={e => onCustomerSearchChange(e.target.value)}
                        onFocus={() => { setCustomerSuggestions(customers); setShowCustomerSuggestions(true); }}
                        autoComplete="off"
                      />
                      {showCustomerSuggestions && customerSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 999,
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 8, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                        }}>
                          {customerSuggestions.map(c => (
                            <div key={c._id} onClick={() => selectCustomer(c)} style={{
                              padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-dark)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <span style={{ fontWeight: 600 }}>{c.name}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.phone}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {showCustomerSuggestions && customerSuggestions.length === 0 && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 999, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-muted)', fontSize: 13 }}>
                          لا يوجد عملاء مطابقون
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div className="two-col-grid" style={{ marginBottom: 8 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">اسم العميل *</label>
                          <input className="form-control" placeholder="الاسم الكامل" value={form.newCustomerName} onChange={e => setForm(f => ({ ...f, newCustomerName: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">رقم الهاتف</label>
                          <input className="form-control" placeholder="09xxxxxxxx" value={form.newCustomerPhone} onChange={e => setForm(f => ({ ...f, newCustomerPhone: e.target.value }))} />
                        </div>
                      </div>
                      <div className="two-col-grid" style={{ marginBottom: 8 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">العمر</label>
                          <input className="form-control" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="العمر بالسنوات" value={form.newCustomerAge} onChange={e => setForm(f => ({ ...f, newCustomerAge: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">الجنس</label>
                          <select className="form-control" value={form.newCustomerGender} onChange={e => setForm(f => ({ ...f, newCustomerGender: e.target.value }))}>
                            <option>ذكر</option><option>أنثى</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">البريد الإلكتروني</label>
                        <input className="form-control" type="email" placeholder="example@email.com" value={form.newCustomerEmail} onChange={e => setForm(f => ({ ...f, newCustomerEmail: e.target.value }))} />
                      </div>
                    </div>
                  )}
                </div>

                {/* ───── Book Search ───── */}
                <div className="form-group" style={{ position: 'relative' }} ref={bookInputRef}>
                  <label className="form-label">الكتاب * <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(اكتب للبحث)</span></label>
                  <input
                    className="form-control"
                    placeholder="ابحث باسم الكتاب..."
                    value={form.bookSearch}
                    onChange={e => onBookSearchChange(e.target.value)}
                    onFocus={() => form.bookSearch && setShowSuggestions(true)}
                    autoComplete="off"
                  />
                  {showSuggestions && bookSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 999,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 8, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                    }}>
                      {bookSuggestions.map(b => (
                        <div key={b._id} onClick={() => selectBook(b)} style={{
                          padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          transition: 'background 0.15s'
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-dark)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span>{b.title} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({b.author})</span></span>
                          <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>{b.rentalPricePerDay} ج/يوم <span style={{ color: 'var(--success)', fontSize: 11 }}>({b.stock} متاح)</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                  {showSuggestions && bookSuggestions.length === 0 && form.bookSearch && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 999, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-muted)', fontSize: 13 }}>
                      لا توجد كتب مطابقة
                    </div>
                  )}
                </div>

                {/* ───── Days, Total, Late Fee ───── */}
                <div className="two-col-grid">
                  <div className="form-group">
                    <label className="form-label">عدد الأيام *</label>
                    <input className="form-control" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="عدد الأيام" required value={form.durationDays} onChange={e => onDaysChange(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">الإجمالي (جنيه)</label>
                    <input className="form-control" type="text" inputMode="decimal" placeholder="حساب تلقائي" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">غرامة التأخير (جنيه) <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>اختياري</span></label>
                  <input className="form-control" type="text" inputMode="decimal" placeholder="0" value={form.lateFee} onChange={e => setForm(f => ({ ...f, lateFee: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isPaid} onChange={e => setForm(f => ({ ...f, isPaid: e.target.checked }))} />
                    <span className="form-label" style={{ margin: 0 }}>تم الدفع</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">ملاحظات</label>
                  <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
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
