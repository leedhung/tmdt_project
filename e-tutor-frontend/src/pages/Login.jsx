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

  // States for Forgot Password flow
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState('email'); // 'email' or 'verify'
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [success, setSuccess] = useState('');

  // States for Social Login flow
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialProvider, setSocialProvider] = useState('Google');
  const [socialLoading, setSocialLoading] = useState(false);
  const [selectedSocialUser, setSelectedSocialUser] = useState('');
  const [socialError, setSocialError] = useState('');

  const handleSocialSelect = async (userEmail) => {
    setSelectedSocialUser(userEmail);
    setSocialLoading(true);
    setSocialError('');

    // Giả lập thời gian handshake bảo mật OAuth2 qua Google/Facebook
    setTimeout(async () => {
      try {
        const response = await api.post('/auth/login', { 
          email: userEmail, 
          password: 'admin123' // Mật khẩu mặc định của các tài khoản mock data
        });
        
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify({
          id: response.data.id,
          email: response.data.email,
          role: response.data.role,
          fullName: response.data.fullName
        }));

        setShowSocialModal(false);
        if (response.data.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (err) {
        setSocialError(err.response?.data?.error || 'Xác thực thông tin qua mạng xã hội thất bại!');
        setSocialLoading(false);
      }
    }, 1500);
  };

  const handleSendOtpForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    
    if (!forgotEmail.trim()) {
      setForgotError('Vui lòng nhập địa chỉ email của bạn!');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotSuccess(response.data || 'Mã xác thực OTP đã được gửi đến email của bạn! (Hãy kiểm tra log console của backend container để lấy mã)');
      setForgotStep('verify');
    } catch (err) {
      setForgotError(err.response?.data?.error || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email!');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!otpCode || otpCode.length !== 6) {
      setForgotError('Mã xác thực OTP phải có đúng 6 chữ số!');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    setForgotLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        otp: otpCode.trim(),
        newPassword
      });
      setSuccess('Đặt lại mật khẩu mới thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập.');
      setIsForgotPassword(false);
      setEmail(forgotEmail);
      setPassword('');
    } catch (err) {
      setForgotError(err.response?.data?.error || 'Xác thực OTP hoặc đặt lại mật khẩu thất bại!');
    } finally {
      setForgotLoading(false);
    }
  };

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

        {success && (
          <div className="badge badge-success" style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            textTransform: 'none',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399'
          }}>
            {success}
          </div>
        )}

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

        {isForgotPassword ? (
          /* ======================== FORM QUÊN MẬT KHẨU (FORGOT PASSWORD) ======================== */
          <div>
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--accent-cyan)', fontSize: '1.2rem', margin: '0 0 0.25rem 0' }}>Khôi phục mật khẩu</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                {forgotStep === 'email' 
                  ? 'Nhập địa chỉ email đăng ký để nhận mã OTP xác minh khôi phục mật khẩu.' 
                  : 'Nhập mã xác thực OTP 6 số và thiết lập mật khẩu mới cho tài khoản.'
                }
              </p>
            </div>

            {forgotError && (
              <div className="badge badge-danger" style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.8rem' }}>
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="badge badge-success" style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.8rem', textTransform: 'none', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 'email' ? (
              <form onSubmit={handleSendOtpForgotPassword}>
                <div className="form-group">
                  <label className="form-label">Email tài khoản của bạn</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(141, 91, 76, 0.5)' }} />
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="email@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  style={{ padding: '0.8rem', marginBottom: '1rem', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)', border: 'none', color: '#fff', fontWeight: 'bold' }}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Đang gửi mã...' : 'Gửi mã xác thực OTP'}
                </button>
                
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setForgotError(''); setForgotSuccess(''); }}
                  className="btn btn-secondary w-100"
                  style={{ padding: '0.8rem' }}
                >
                  Quay lại Đăng nhập
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label className="form-label">Mã xác thực OTP (6 chữ số)</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={6}
                    placeholder="Nhập 6 số..."
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Tối thiểu 6 ký tự..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Nhập lại mật khẩu mới..."
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  style={{ padding: '0.8rem', marginBottom: '1rem', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)', border: 'none', color: '#fff', fontWeight: 'bold' }}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Đang đặt lại mật khẩu...' : 'Xác nhận đặt lại mật khẩu'}
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep('email')}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.8rem' }}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtpForgotPassword}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.8rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                    disabled={forgotLoading}
                  >
                    Gửi lại mã OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ======================== FORM ĐĂNG NHẬP CHÍNH ======================== */
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

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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

            <div style={{ textAlign: 'right', marginBottom: '1.5rem', marginTop: '-0.75rem' }}>
              <span 
                onClick={() => {
                  setIsForgotPassword(true);
                  setForgotStep('email');
                  setForgotEmail(email);
                  setForgotError('');
                  setForgotSuccess('');
                }}
                style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '500', transition: 'all 0.15s' }}
              >
                Quên mật khẩu?
              </span>
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
        )}

        {!isForgotPassword && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
              <span style={{ padding: '0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hoặc đăng nhập bằng</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setSocialProvider('Google');
                  setShowSocialModal(true);
                  setSocialLoading(false);
                  setSelectedSocialUser('');
                  setSocialError('');
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', padding: '0.65rem 0', fontSize: '0.85rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.39 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 4.91 12c0-.79.13-1.57.38-2.31V6.54H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.38l4.11-3.14z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 5.46l4.11 3.15c.94-2.85 3.57-4.96 6.68-4.96z"/>
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={() => {
                  setSocialProvider('Facebook');
                  setShowSocialModal(true);
                  setSocialLoading(false);
                  setSelectedSocialUser('');
                  setSocialError('');
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', padding: '0.65rem 0', fontSize: '0.85rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ fontWeight: '500' }}>
            Đăng ký làm Gia sư hoặc Học viên ngay
          </Link>
        </div>
      </div>

      {/* Modal OAuth2 Giả lập */}
      {showSocialModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-card animate-scale-up" style={{ width: '100%', maxWidth: '420px', border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                {socialProvider === 'Google' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.39 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 4.91 12c0-.79.13-1.57.38-2.31V6.54H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.38l4.11-3.14z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 5.46l4.11 3.15c.94-2.85 3.57-4.96 6.68-4.96z"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0, fontWeight: 'bold' }}>Đăng nhập qua {socialProvider}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>oauth2.secure-auth.etutor.com</span>
              </div>
            </div>

            {socialError && (
              <div className="badge badge-danger" style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.8rem' }}>
                {socialError}
              </div>
            )}

            {socialLoading ? (
              /* Loading State */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
                <div style={{
                  border: '3px solid rgba(255, 255, 255, 0.05)',
                  borderTop: '3px solid var(--accent-cyan)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 1s linear infinite',
                  style: { display: 'inline-block' },
                  marginBottom: '1.25rem'
                }}></div>
                <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'block', marginBottom: '0.25rem' }}>Đang xác thực thông tin...</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Đang liên kết tài khoản {selectedSocialUser} qua {socialProvider} OAuth2.</p>
              </div>
            ) : (
              /* Selection State */
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'left', marginBottom: '1.25rem' }}>
                  Hệ thống phát hiện các tài khoản {socialProvider} hoạt động trên thiết bị. Chọn nhanh tài khoản để liên kết đăng nhập:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  
                  {/* Học viên mẫu */}
                  <div 
                    onClick={() => handleSocialSelect('student1@example.com')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      background: 'rgba(255, 255, 255, 0.01)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.background = 'rgba(102, 252, 241, 0.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'; }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(102, 252, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                      A
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>Nguyễn Văn An (Học viên)</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>student1@example.com</span>
                    </div>
                  </div>

                  {/* Gia sư mẫu */}
                  <div 
                    onClick={() => handleSocialSelect('tutor1@example.com')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      background: 'rgba(255, 255, 255, 0.01)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.background = 'rgba(102, 252, 241, 0.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'; }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(244, 114, 182, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent-pink)', fontSize: '0.9rem' }}>
                      B
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>Trần Thị Bình (Gia sư VIP)</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>tutor1@example.com</span>
                    </div>
                  </div>

                  {/* Admin mẫu */}
                  <div 
                    onClick={() => handleSocialSelect('admin@etutor.com')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      background: 'rgba(255, 255, 255, 0.01)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.background = 'rgba(102, 252, 241, 0.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'; }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent-purple)', fontSize: '0.9rem' }}>
                      AD
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>Quản trị viên Hệ thống</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>admin@etutor.com</span>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowSocialModal(false)} 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.4rem 1rem' }}
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
