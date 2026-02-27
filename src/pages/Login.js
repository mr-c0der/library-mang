import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user]);

  useEffect(() => {
    api.get('/auth/check').then(res => {
      setIsSetup(!res.data.hasAdmin);
      setCheckDone(true);
    }).catch(() => setCheckDone(true));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isSetup) {
        await api.post('/auth/setup', { username, password });
        await login(username, password);
      } else {
        await login(username, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى');
    } finally { setLoading(false); }
  };

  if (!checkDone) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top right, #1a3a5c 0%, #0d1b2a 60%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, direction: 'rtl'
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'fixed', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(201,162,39,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(26,58,92,0.6)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            borderRadius: 18, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, boxShadow: '0 8px 32px rgba(201,162,39,0.4)'
          }}>📖</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>نظام إدارة المكتبة</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            {isSetup ? 'إنشاء حساب المدير للمرة الأولى' : 'مرحباً بك، تفضل بتسجيل الدخول'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(22, 38, 54, 0.95)',
          border: '1px solid var(--border)',
          borderRadius: 16, padding: 32,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          {isSetup && (
            <div className="alert alert-success" style={{ marginBottom: 20 }}>
              🎉 مرحباً! لم يتم إنشاء حساب مدير بعد. سجّل الآن
            </div>
          )}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">اسم المستخدم</label>
              <input
                className="form-control"
                type="text"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">كلمة المرور</label>
              <input
                className="form-control"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 15, marginTop: 8 }}
              disabled={loading}
            >
              {loading ? '⏳ جارٍ التحميل...' : isSetup ? '🚀 إنشاء الحساب' : '🔑 تسجيل الدخول'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
          نظام إدارة المكتبة © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
