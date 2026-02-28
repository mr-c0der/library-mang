import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const emptyForm = {
  // Customer (existing or new)
  customerMode: 'existing', // 'existing' | 'new'
  customerId: '',
  customerSearch: '',
  newCustomerName: '',
  newCustomerPhone: '',
  newCustomerEmail: '',
  newCustomerAge: '',
  newCustomerGender: 'ذكر',
  // Sale info
  bookId: '',
  bookSearch: '',
  quantity: '',
  unitPrice: '',
  totalAmount: '',
  isPaid: false,
  notes: ''
};

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const bookInputRef = useRef(null);
  const customerInputRef = useRef(null);

  const fmt = (n) => (n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 });

  const load = async () => {
    setLoading(true);
    const [s, c, b] = await Promise.all([api.get('/sales'), api.get('/customers'), api.get('/books')]);
    setSales(s.data);
    setCustomers(c.data);
    setBooks(b.data.filter(b => b.isAvailableForSale && b.stock > 0));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

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
    setForm(f => ({ ...f, bookSearch: val, bookId: '', unitPrice: '', totalAmount: '' }));
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
    const total = book.salePrice * (Number(form.quantity) || 1);
    setForm(f => ({ ...f, bookId: book._id, bookSearch: book.title, unitPrice: book.salePrice, totalAmount: total }));
    setShowSuggestions(false);
  };

  const onQuantityChange = (val) => {
    setForm(f => {
      const newTotal = (f.unitPrice || 0) * (Number(val) || 0);
      return { ...f, quantity: val, totalAmount: newTotal || '' };
    });
  };

  const openAdd = () => { setForm(emptyForm); setError(''); setBookSuggestions([]); setShowSuggestions(false); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      let customerId = form.customerId;
      // Create new customer inline if needed
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

      await api.post('/sales', {
        customer: customerId,
        book: form.bookId,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        totalAmount: Number(form.totalAmount),
        isPaid: form.isPaid,
        notes: form.notes,
      });
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.message || 'حدث خطأ'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف عملية البيع؟')) return;
    await api.delete(`/sales/${id}`); load();
  };
  const togglePaid = async (id, val) => { await api.put(`/sales/${id}`, { isPaid: !val }); load(); };

  const totalRev = sales.filter(s => s.isPaid).reduce((t, s) => t + s.totalAmount, 0);
  const pending = sales.filter(s => !s.isPaid).reduce((t, s) => t + s.totalAmount, 0);

  return (
    <>
      <div className="page-header">
        <h1>إدارة <span>المبيعات</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>➕ بيع كتاب</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="stat-card green"><div className="stat-icon">💰</div><div className="stat-value">{fmt(totalRev)}</div><div className="stat-label">إيرادات مستلمة (جنيه)</div></div>
        <div className="stat-card gold"><div className="stat-icon">⏳</div><div className="stat-value">{fmt(pending)}</div><div className="stat-label">مبالغ معلقة (جنيه)</div></div>
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
                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmt(s.totalAmount)} ج</td>
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
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header"><h3>🛒 بيع كتاب</h3><button className="close-btn" onClick={() => setModal(false)}>✕</button></div>
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
                          <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>{b.salePrice} ج <span style={{ color: 'var(--success)', fontSize: 11 }}>({b.stock} متاح)</span></span>
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

                {/* ───── Quantity & Total ───── */}
                <div className="two-col-grid">
                  <div className="form-group">
                    <label className="form-label">الكمية *</label>
                    <input className="form-control" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="أدخل الكمية" required value={form.quantity} onChange={e => onQuantityChange(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">الإجمالي (جنيه)</label>
                    <input className="form-control" type="text" inputMode="decimal" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} required />
                  </div>
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
                <button type="submit" className="btn btn-primary">✅ تأكيد البيع</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
