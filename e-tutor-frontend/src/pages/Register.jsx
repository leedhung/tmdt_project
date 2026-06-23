import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, Mail, Lock, User, Phone, BookOpen, FileText } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'STUDENT', // Mặc định là STUDENT
    fullName: '',
    phone: '',
    qualifications: '',
    experience: '',
    hourlyRate: 150000, // 150.000đ/buổi học
    subjects: '',
    citizenCard: '',
    grade: 'Lớp 10',
    learningGoals: ''
  });

  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.fullName.trim()) {
      tempErrors.fullName = 'Họ và tên không được để trống!';
    } else if (formData.fullName.trim().length < 2) {
      tempErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự!';
    }

    if (!formData.email.trim()) {
      tempErrors.email = 'Email không được để trống!';
    } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/.test(formData.email.trim())) {
      tempErrors.email = 'Email không đúng định dạng (VD: example@mail.com)!';
    }

    if (!formData.password) {
      tempErrors.password = 'Mật khẩu không được để trống!';
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự!';
    }

    if (formData.phone && formData.phone.trim()) {
      if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(formData.phone.trim())) {
        tempErrors.phone = 'Số điện thoại không đúng định dạng Việt Nam (phải gồm 10 chữ số)!';
      }
    }

    if (formData.role === 'STUDENT') {
      if (!formData.grade.trim()) {
        tempErrors.grade = 'Vui lòng chọn khối lớp học!';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Chuẩn bị payload tương ứng với từng vai trò để tối giản dữ liệu gửi lên
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        fullName: formData.fullName.trim(),
        phone: formData.phone ? formData.phone.trim() : ''
      };

      if (formData.role === 'TUTOR') {
        payload.qualifications = formData.qualifications.trim();
        payload.experience = formData.experience ? formData.experience.trim() : '';
        payload.hourlyRate = formData.hourlyRate;
        payload.subjects = formData.subjects.trim();
        payload.citizenCard = formData.citizenCard ? formData.citizenCard.trim() : '';
      } else {
        payload.grade = formData.grade.trim();
        payload.learningGoals = formData.learningGoals ? formData.learningGoals.trim() : '';
      }

      // 1. Thực hiện Đăng ký tài khoản
      await api.post('/auth/register', payload);
      setSuccess('Đăng ký tài khoản thành công! Đang tự động đăng nhập...');

      try {
        // 2. Tự động Đăng nhập ngay lập tức
        const loginResponse = await api.post('/auth/login', {
          email: payload.email,
          password: payload.password
        });

        // 3. Lưu trữ tokens và thông tin cơ bản của user vào localStorage
        localStorage.setItem('accessToken', loginResponse.data.accessToken);
        localStorage.setItem('refreshToken', loginResponse.data.refreshToken);
        localStorage.setItem('user', JSON.stringify({
          id: loginResponse.data.id,
          email: loginResponse.data.email,
          role: loginResponse.data.role,
          fullName: loginResponse.data.fullName
        }));

        setSuccess('Đăng ký & Đăng nhập thành công! Đang chuyển hướng đến trang chính...');

        // 4. Chuyển thẳng vào trang chính (Home / Dashboard)
        setTimeout(() => {
          if (loginResponse.data.role === 'ADMIN') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1500);

      } catch (loginErr) {
        // Nếu tự động đăng nhập thất bại (Ví dụ: Tài khoản Gia sư cần Admin duyệt thủ công)
        const loginErrMsg = loginErr.response?.data?.error || '';
        if (loginErrMsg.includes('chưa được phê duyệt')) {
          setSuccess('Đăng ký thành công! Vui lòng chờ Quản trị viên phê duyệt hồ sơ Gia sư của bạn.');
          setTimeout(() => {
            navigate('/login');
          }, 3500);
        } else {
          setSuccess('Đăng ký thành công! Đang chuyển hướng bạn đến trang Đăng nhập...');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      }

    } catch (err) {
      const backendError = err.response?.data?.error || 'Đăng ký thất bại. Vui lòng kiểm tra lại dữ liệu!';
      setError(backendError);
      
      if (backendError.includes('Email đã được sử dụng')) {
        setErrors(prev => ({ ...prev, email: 'Email này đã tồn tại trên hệ thống!' }));
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
      padding: '2rem 1rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
            E-<span style={{ color: 'var(--accent-cyan)' }}>Tutor</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tạo tài khoản để tham gia vào hệ sinh thái học tập!</p>
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

        {success && (
          <div className="badge badge-success" style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontSize: '0.85rem'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Vai trò thành viên</label>
              <select
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="STUDENT">Học Viên (Student)</option>
                <option value="TUTOR">Gia Sư (Tutor)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Họ và Tên</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: errors.fullName ? 'var(--error)' : 'rgba(141, 91, 76, 0.5)'
                }} />
                <input
                  type="text"
                  name="fullName"
                  className="form-input"
                  style={{ 
                    paddingLeft: '40px',
                    borderColor: errors.fullName ? 'var(--error)' : 'rgba(141, 91, 76, 0.25)',
                    boxShadow: errors.fullName ? '0 0 8px rgba(211, 47, 47, 0.15)' : 'none'
                  }}
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.fullName && (
                <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.35rem', display: 'block', fontWeight: '500' }}>
                  ⚠️ {errors.fullName}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
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
                  name="email"
                  className="form-input"
                  style={{ 
                    paddingLeft: '40px',
                    borderColor: errors.email ? 'var(--error)' : 'rgba(141, 91, 76, 0.25)',
                    boxShadow: errors.email ? '0 0 8px rgba(211, 47, 47, 0.15)' : 'none'
                  }}
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.email && (
                <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.35rem', display: 'block', fontWeight: '500' }}>
                  ⚠️ {errors.email}
                </span>
              )}
            </div>

            <div className="form-group">
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
                  name="password"
                  className="form-input"
                  style={{ 
                    paddingLeft: '40px',
                    borderColor: errors.password ? 'var(--error)' : 'rgba(141, 91, 76, 0.25)',
                    boxShadow: errors.password ? '0 0 8px rgba(211, 47, 47, 0.15)' : 'none'
                  }}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.password && (
                <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.35rem', display: 'block', fontWeight: '500' }}>
                  ⚠️ {errors.password}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: errors.phone ? 'var(--error)' : 'rgba(141, 91, 76, 0.5)'
              }} />
              <input
                type="text"
                name="phone"
                className="form-input"
                style={{ 
                  paddingLeft: '40px',
                  borderColor: errors.phone ? 'var(--error)' : 'rgba(141, 91, 76, 0.25)',
                  boxShadow: errors.phone ? '0 0 8px rgba(211, 47, 47, 0.15)' : 'none'
                }}
                placeholder="0987654321"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            {errors.phone && (
              <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.35rem', display: 'block', fontWeight: '500' }}>
                ⚠️ {errors.phone}
              </span>
            )}
          </div>

          {/* HIỂN THỊ DYNAMIC PROFILE CHO HỌC VIÊN */}
          {formData.role === 'STUDENT' && (
            <div style={{
              border: '1px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '1.5rem',
              background: 'rgba(141, 91, 76, 0.03)',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} />
                Thông Tin Lớp & Mục Tiêu Học
              </h3>

              <div className="form-group">
                <label className="form-label">Đang học lớp mấy</label>
                <select
                  name="grade"
                  className="form-select"
                  value={formData.grade}
                  onChange={handleChange}
                >
                  <option value="Lớp 9">Lớp 9</option>
                  <option value="Lớp 10">Lớp 10</option>
                  <option value="Lớp 11">Lớp 11</option>
                  <option value="Lớp 12">Lớp 12</option>
                  <option value="Ôn Thi Đại Học">Ôn Thi Đại Học</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mục tiêu học tập</label>
                <textarea
                  name="learningGoals"
                  className="form-input"
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Muốn bổ túc kiến thức môn Toán để thi học sinh giỏi trường..."
                  value={formData.learningGoals}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', marginBottom: '1.5rem' }}
            disabled={loading}
          >
            {loading ? 'Đang đăng ký...' : (
              <>
                <UserPlus size={20} />
                Đăng Ký Tài Khoản
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ fontWeight: '500' }}>
            Đăng nhập tại đây
          </Link>
        </div>
      </div>
    </div>
  );
}
