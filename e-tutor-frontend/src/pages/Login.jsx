import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { LogIn, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const tempErrors = {};
    if (!email.trim()) {
      tempErrors.email = 'Email không được để trống!';
    } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/.test(email.trim())) {
      tempErrors.email = 'Email không đúng định dạng (VD: example@mail.com)!';
    }
    if (!password) {
      tempErrors.password = 'Mật khẩu không được để trống!';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      
      // Lưu trữ tokens và thông tin cơ bản của user vào localStorage
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify({
        id: response.data.id,
        email: response.data.email,
        role: response.data.role,
        fullName: response.data.fullName
      }));

      if (response.data.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      const backendError = err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!';
      // Map error to specific field if applicable
      if (backendError.includes('không chính xác') || backendError.includes('mật khẩu')) {
        setError(backendError);
        setErrors({ email: 'Kiểm tra lại email của bạn', password: 'Kiểm tra lại mật khẩu' });
      } else {
        setError(backendError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
            E-<span style={{ color: 'var(--accent-cyan)' }}>Tutor</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Chào mừng bạn quay trở lại nền tảng!</p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email tài khoản</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: errors.email ? 'var(--error)' : 'rgba(141, 91, 76, 0.5)'
              }} />
              <input
                type="email"
                className="form-input"
                style={{ 
                  paddingLeft: '40px',
                  borderColor: errors.email ? 'var(--error)' : 'rgba(141, 91, 76, 0.25)',
                  boxShadow: errors.email ? '0 0 8px rgba(211, 47, 47, 0.15)' : 'none'
                }}
                placeholder="email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                required
              />
            </div>
            {errors.email && (
              <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.35rem', display: 'block', fontWeight: '500' }}>
                ⚠️ {errors.email}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: errors.password ? 'var(--error)' : 'rgba(141, 91, 76, 0.5)'
              }} />
              <input
                type="password"
                className="form-input"
                style={{ 
                  paddingLeft: '40px',
                  borderColor: errors.password ? 'var(--error)' : 'rgba(141, 91, 76, 0.25)',
                  boxShadow: errors.password ? '0 0 8px rgba(211, 47, 47, 0.15)' : 'none'
                }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                required
              />
            </div>
            {errors.password && (
              <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.35rem', display: 'block', fontWeight: '500' }}>
                ⚠️ {errors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary pulse-effect"
            style={{ width: '100%', padding: '0.9rem', marginBottom: '1.5rem' }}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : (
              <>
                <LogIn size={20} />
                Đăng Nhập
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ fontWeight: '500' }}>
            Đăng ký làm Gia sư hoặc Học viên ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
