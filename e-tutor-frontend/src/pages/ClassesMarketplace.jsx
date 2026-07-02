import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { showAlert } from '../utils/notification';
import { 
  Search, BookOpen, MapPin, Award, ChevronRight, Phone, Mail, 
  Star, Users, Briefcase, RefreshCw, SlidersHorizontal, ArrowUpDown, 
  ArrowLeft, CheckCircle, CreditCard, Calendar
} from 'lucide-react';

export default function ClassesMarketplace() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [sortBy, setSortBy] = useState('NEWEST');

  const [activeClasses, setActiveClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Tải các lớp học public từ database
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
    }

    const params = new URLSearchParams(location.search);
    const subjectParam = params.get('subject');
    const gradeParam = params.get('grade');
    const methodParam = params.get('method');

    if (subjectParam) setSearchQuery(decodeURIComponent(subjectParam));
    if (gradeParam) setGradeFilter(decodeURIComponent(gradeParam));
    if (methodParam) setMethodFilter(decodeURIComponent(methodParam));

    fetchLiveClasses();
  }, [location.search]);

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/class/public');
      setActiveClasses(res.data);
    } catch (e) {
      console.error('Không thể kết nối lấy danh sách lớp thật', e);
    } finally {
      setLoading(false);
    }
  };

  // Tổng hợp danh sách lớp để hiển thị (Chỉ lấy lớp thật từ Database)
  const allDisplayClasses = activeClasses.map(c => ({
    id: c.id,
    title: c.title,
    subject: c.subject,
    grade: c.gradeLevel || "Chưa rõ",
    hourlyRate: c.hourlyRate,
    totalLessons: c.totalLessons,
    scheduleConfig: c.scheduleConfig.includes('[') ? "Xem chi tiết lịch học" : c.scheduleConfig,
    description: c.description,
    studentDetails: c.studentDetails,
    tutorRequirements: c.tutorRequirements,
    status: c.status,
    method: c.learningMode || 'ONLINE',
    address: c.address,
    isReal: true
  }));

  // Áp dụng Tìm kiếm và Bộ lọc linh hoạt
  const filteredClasses = allDisplayClasses.filter(cls => {
    // 1. Lọc theo từ khóa tìm kiếm (Tiêu đề, mô tả)
    const matchesSearch = searchQuery === '' || 
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.description.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Lọc theo cấp lớp
    const matchesGrade = gradeFilter === '' || cls.grade === gradeFilter;

    // 3. Lọc theo hình thức học
    const matchesMethod = methodFilter === 'ALL' || cls.method === methodFilter;

    // 4. Lọc theo trạng thái
    const matchesStatus = statusFilter === 'ALL' || cls.status === statusFilter;

    // 5. Lọc theo giá thù lao
    const rate = parseFloat(cls.hourlyRate);
    const matchesMin = minRate === '' || rate >= parseFloat(minRate);
    const matchesMax = maxRate === '' || rate <= parseFloat(maxRate);

    return matchesSearch && matchesGrade && matchesMethod && matchesStatus && matchesMin && matchesMax;
  });

  // Áp dụng Sắp xếp (Sorting)
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    if (sortBy === 'NEWEST') {
      return b.id - a.id; // Giả lập ID lớn hơn là mới hơn
    } else if (sortBy === 'RATE_ASC') {
      return a.hourlyRate - b.hourlyRate;
    } else if (sortBy === 'RATE_DESC') {
      return b.hourlyRate - a.hourlyRate;
    } else if (sortBy === 'LESSON_DESC') {
      return b.totalLessons - a.totalLessons;
    }
    return 0;
  });

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const handleClassAction = async (cls) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (cls.status === 'FINDING_STUDENT') {
      if (user && user.role === 'STUDENT') {
        try {
          if (cls.isReal) {
            await api.post(`/class/${cls.id}/register`);
            showAlert('Đăng ký lớp thành công', `Đăng ký lớp "${cls.title}" thành công! Hệ thống đang tự động chuyển hướng bạn tới trang thanh toán học phí bảo chứng Escrow để chính thức kích hoạt lớp học.`, 'success');
          } else {
            showAlert('Đăng ký lớp thành công', `[Giả lập] Đăng ký lớp "${cls.title}" thành công! Đang tự động chuyển hướng bạn tới trang thanh toán bảo chứng.`, 'success');
          }
          navigate(`/checkout/${cls.id}`);
        } catch (err) {
          showAlert('Lỗi đăng ký lớp', err.response?.data?.error || 'Đăng ký lớp học thất bại!', 'error');
        }
      } else {
        showAlert('Yêu cầu vai trò', 'Bạn đang đăng nhập dưới vai trò Gia sư. Chỉ Học viên mới có thể đăng ký học khóa học!', 'warning');
      }
    } else {
      // Mặc định hoặc FINDING_TUTOR
      if (user && user.role === 'TUTOR') {
        if (!user.isVerified) {
          showAlert('Chờ duyệt chuyên môn', 'Tài khoản gia sư của bạn chưa được duyệt chuyên môn! Vui lòng truy cập trang cá nhân cập nhật đầy đủ hồ sơ chuyên môn và chờ Ban quản trị phê duyệt trước khi ứng tuyển nhận lớp.', 'warning');
          return;
        }
        try {
          if (cls.isReal) {
            await api.post(`/class/${cls.id}/apply`);
            showAlert('Ứng tuyển thành công', `Đã gửi đơn ứng tuyển vào lớp "${cls.title}" thành công! Vui lòng chờ Học viên phê duyệt.`, 'success');
          } else {
            showAlert('Ứng tuyển thành công', `[Giả lập] Gửi đơn ứng tuyển lớp "${cls.title}" thành công!`, 'success');
          }
        } catch (err) {
          showAlert('Lỗi ứng tuyển', err.response?.data?.error || 'Ứng tuyển thất bại!', 'error');
        }
      } else {
        showAlert('Yêu cầu vai trò', 'Bạn đang đăng nhập dưới vai trò Học viên. Chỉ Gia sư mới có thể ứng tuyển nhận lớp học yêu cầu!', 'warning');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Navigation Header */}
      <nav className="dashboard-header" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-1.5px', color: 'var(--text-primary)' }}>
              GiaSu<span style={{ color: 'var(--accent-cyan)' }}>Home</span>
            </h1>
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.95rem' }} className="nav-links">
            <Link to="/tutors" style={{ color: 'var(--text-secondary)' }}>Tìm Gia Sư</Link>
            <Link to="/classes" style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>Chợ Lớp Học</Link>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.9rem' }}>
                Chào, <strong style={{ color: 'var(--text-primary)' }}>{user.fullName}</strong>
              </span>
              <Link to={user && user.role === 'ADMIN' ? "/admin" : "/dashboard"} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                Dashboard Portal
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                Đăng Xuất
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                Đăng Nhập
              </Link>
              <Link to="/register" className="btn btn-primary pulse-effect" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                Trở thành Gia Sư
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Content Body */}
      <div style={{ flexGrow: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '3rem 2rem' }}>
        
        {/* Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={16} /> Quay lại trang chủ
          </Link>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '3rem' }}>
          <span className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>Khám Phá Cơ Hội Học Tập & Giảng Dạy</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>Chợ Kết Nối Lớp Học Quy Mô Toàn Quốc</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.05rem' }}>
            Tổng hợp danh sách các yêu cầu tìm gia sư từ học sinh và các khóa học online mở sẵn từ giáo viên. Cập nhật thời gian thực.
          </p>
        </div>

        {/* Search & Filter Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Filters Sidebar */}
          <aside className="glass-card" style={{ padding: '1.75rem', position: 'sticky', top: '100px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <SlidersHorizontal size={18} style={{ color: 'var(--accent-cyan)' }} /> Bộ Lọc Tìm Kiếm
              </h3>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setGradeFilter('');
                  setMethodFilter('ALL');
                  setStatusFilter('ALL');
                  setMinRate('');
                  setMaxRate('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Đặt lại lọc
              </button>
            </div>

            {/* Keyword Search */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Từ khóa lớp học</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '34px', fontSize: '0.85rem' }} 
                  placeholder="Nhập Toán, Lý, IELTS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filter by Grade */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Cấp lớp / Trình độ</label>
              <select 
                className="form-select" 
                style={{ fontSize: '0.85rem' }}
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
              >
                <option value="">Tất cả Cấp học</option>
                <option value="Lớp 9">Lớp 9</option>
                <option value="Lớp 10">Lớp 10</option>
                <option value="Lớp 11">Lớp 11</option>
                <option value="Lớp 12">Lớp 12</option>
                <option value="Ôn Thi Đại Học">Ôn Thi Đại Học</option>
                <option value="Người đi làm">Người đi làm</option>
              </select>
            </div>

            {/* Filter by Method */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Hình thức học</label>
              <select 
                className="form-select" 
                style={{ fontSize: '0.85rem' }}
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="ALL">Mọi hình thức</option>
                <option value="ONLINE">Học Trực Tuyến (Online)</option>
                <option value="OFFLINE">Dạy kèm Tại Nhà (Offline)</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Phân loại tin đăng</label>
              <select 
                className="form-select" 
                style={{ fontSize: '0.85rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả bài đăng</option>
                <option value="FINDING_TUTOR">Lớp học cần Gia sư (Học viên đăng)</option>
                <option value="FINDING_STUDENT">Lớp chuyên đề chiêu sinh (Gia sư mở)</option>
              </select>
            </div>

            {/* Hourly Rate range */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Học phí / Buổi (VNĐ)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem' }} 
                  placeholder="Từ (đ)..."
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                />
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem' }} 
                  placeholder="Đến (đ)..."
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                />
              </div>
            </div>

          </aside>

          {/* RIGHT COLUMN: Results Section */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Top Toolbar (Summary & Sort Options) */}
            <div className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'left' }}>
                Tìm thấy <strong style={{ color: 'var(--accent-cyan)' }}>{sortedClasses.length}</strong> lớp học phù hợp với bộ lọc
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ArrowUpDown size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sắp xếp:</span>
                <select 
                  className="form-select" 
                  style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="NEWEST">Mới nhất đăng tuyển</option>
                  <option value="RATE_ASC">Học phí tăng dần</option>
                  <option value="RATE_DESC">Học phí giảm dần</option>
                  <option value="LESSON_DESC">Nhiều buổi học nhất</option>
                </select>
              </div>
            </div>

            {/* Classes Grid */}
            {sortedClasses.length === 0 ? (
              <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                <BookOpen size={48} style={{ color: 'var(--accent-pink)', marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Không tìm thấy lớp học nào</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Vui lòng thay đổi từ khóa hoặc điều chỉnh khoảng lọc thù lao khác.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {sortedClasses.map(cls => (
                  <div 
                    key={cls.id} 
                    className="glass-card" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1rem', 
                      padding: '1.5rem',
                      border: cls.isTutorVip ? '1.5px solid rgba(197, 137, 64, 0.65)' : cls.isReal ? '1px solid rgba(141, 91, 76, 0.35)' : '1px solid var(--glass-border)',
                      background: cls.isTutorVip ? 'linear-gradient(135deg, var(--glass-bg) 0%, rgba(197, 137, 64, 0.05) 100%)' : 'var(--glass-bg)',
                      boxShadow: cls.isTutorVip ? '0 8px 32px rgba(197, 137, 64, 0.08)' : 'none',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem' }}>{cls.grade}</span>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        {cls.isTutorVip && (
                          <span className="badge" style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem', background: 'linear-gradient(135deg, #e5ba73 0%, #c58940 100%)', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.15rem', boxShadow: '0 2px 8px rgba(197,137,64,0.3)' }}>
                            ⭐ VIP
                          </span>
                        )}
                        {cls.status === 'FINDING_STUDENT' ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem' }}>Chiêu Sinh</span>
                        ) : (
                          <span className="badge badge-cyan" style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem' }}>Tìm Gia Sư</span>
                        )}
                        {cls.isReal && <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem' }}>Thực Tế</span>}
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0.15rem 0', color: 'var(--text-primary)', lineHeight: 1.4, minHeight: '44px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {cls.subject ? `[${cls.subject}] ` : ''}{cls.title}
                    </h3>
                    
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '54px', lineHeight: 1.5 }}>
                      {cls.studentDetails && <p style={{ margin: '0 0 0.25rem 0' }}><strong>Đặc điểm học viên:</strong> {cls.studentDetails}</p>}
                      {cls.tutorRequirements && <p style={{ margin: '0 0 0.25rem 0' }}><strong>Yêu cầu GS:</strong> {cls.tutorRequirements}</p>}
                      {cls.description && <p style={{ margin: '0' }}>{cls.description}</p>}
                    </div>

                    <div style={{ background: 'rgba(141, 91, 76, 0.05)', padding: '0.75rem 1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Thù lao/buổi:</span>
                        <strong style={{ color: 'var(--success)', fontWeight: 'bold' }}>{cls.hourlyRate.toLocaleString('vi-VN')} đ</strong>
                      </span>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Thời lượng học:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{cls.totalLessons} buổi</strong>
                      </span>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Phương thức:</span>
                        <strong style={{ color: 'var(--accent-blue)' }}>{cls.method === 'ONLINE' ? 'Trực tuyến (Online)' : `Tại nhà (${cls.address || 'Chưa cập nhật'})`}</strong>
                      </span>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Lịch học:</span>
                        <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.78rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }} title={cls.scheduleConfig}>
                          {cls.scheduleConfig}
                        </strong>
                      </span>
                    </div>

                    <button 
                      onClick={() => handleClassAction(cls)} 
                      className="btn btn-primary animate-pulse-slow" 
                      style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: 'auto' }}
                    >
                      {cls.status === 'FINDING_STUDENT' ? 'Đăng Ký Học Ngay' : 'Ứng Tuyển Nhận Lớp'}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </section>

        </div>

      </div>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        background: '#2D1C16',
        padding: '3rem 2rem',
        borderTop: '1px solid rgba(197, 137, 64, 0.1)',
        fontSize: '0.9rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '3rem' }}>
          <div>
            <h3 style={{ fontWeight: '800', letterSpacing: '-1.5px', color: '#fff', marginBottom: '1rem' }}>
              GiaSu<span style={{ color: 'var(--accent-cyan)' }}>Home</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem', textAlign: 'left' }}>
              Nền tảng kết nối gia sư và lớp học trực tuyến tích hợp ví điện tử bảo chứng an toàn tài chính Escrow. Giúp học tập hiệu quả, minh bạch và an toàn.
            </p>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={16} /> 0369 148 660</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={16} /> support@giasuhome.vn</span>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Về GiaSuHome</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><Link to="/tutors">Tìm kiếm gia sư</Link></li>
              <li><Link to="/classes">Chợ lớp học mới</Link></li>
              <li><Link to="/register">Trở thành gia sư</Link></li>
            </ul>
          </div>
          <div style={{ textAlign: 'left' }}>
            <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Quy định pháp lý</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><a href="#rules">Chính sách bảo mật</a></li>
              <li><a href="#escrow">Quy chế thanh toán</a></li>
              <li><a href="#dispute">Giải quyết khiếu nại</a></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: '2rem', paddingTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          © 2026 GiaSuHome Platform. Bản quyền thiết kế thuộc về đội ngũ E-Tutor.
        </div>
      </footer>

    </div>
  );
}
