import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Search, BookOpen, MapPin, Award, ChevronRight, Phone, Mail, 
  Star, Users, Briefcase, RefreshCw, SlidersHorizontal, ArrowUpDown, 
  ArrowLeft, GraduationCap, DollarSign, Heart, ShieldCheck
} from 'lucide-react';

export default function TutorsDirectory() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [rateFilter, setRateFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('RATING_DESC');
  const [selectedTutor, setSelectedTutor] = useState(null);

  const [realTutors, setRealTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Tải danh sách tất cả user và lọc vai trò TUTOR
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
    }

    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/tutors/active');
      const detailedTutors = res.data.map((t) => {
        return {
          id: t.userId || t.id,
          fullName: t.fullName || "Gia sư ẩn danh",
          email: t.email,
          phone: t.phone,
          university: t.university || "Đại học Sư Phạm",
          subjects: t.subjects || "Toán, Lý, Hóa",
          hourlyRate: t.hourlyRate || 150000,
          qualifications: t.qualifications || "Chứng chỉ sư phạm",
          experience: t.experience || "Chưa cập nhật kinh nghiệm tự bạch.",
          certificates: t.certificates || "[]",
          rating: 5.0,
          reviews: 12,
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
          badge: t.qualifications || "Gia sư mới",
          isReal: true
        };
      });
      setRealTutors(detailedTutors);
    } catch (e) {
      console.error('Không thể kết nối lấy danh sách gia sư hoạt động', e);
    } finally {
      setLoading(false);
    }
  };

  // Tổng hợp danh sách gia sư
  const allTutors = realTutors;

  // Áp dụng Tìm kiếm và Lọc linh hoạt
  const filteredTutors = allTutors.filter(t => {
    // 1. Tìm kiếm từ khóa theo Tên hoặc Chuyên ngành
    const matchesSearch = searchQuery === '' || 
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.qualifications.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.experience.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Lọc theo Môn học giảng dạy
    const matchesSubject = subjectFilter === '' || 
      t.subjects.toLowerCase().includes(subjectFilter.toLowerCase());

    // 3. Lọc theo Trường Đại học
    const matchesUniversity = universityFilter === '' || 
      t.university.toLowerCase().includes(universityFilter.toLowerCase());

    // 4. Lọc theo học phí mong muốn
    const rate = parseFloat(t.hourlyRate);
    let matchesRate = true;
    if (rateFilter === 'UNDER_200') {
      matchesRate = rate < 200000;
    } else if (rateFilter === '200_300') {
      matchesRate = rate >= 200000 && rate <= 300000;
    } else if (rateFilter === 'OVER_300') {
      matchesRate = rate > 300000;
    }

    // 5. Lọc theo Số sao đánh giá
    let matchesRating = true;
    if (ratingFilter === '5_STAR') {
      matchesRating = t.rating === 5.0;
    } else if (ratingFilter === 'OVER_4') {
      matchesRating = t.rating >= 4.5;
    }

    return matchesSearch && matchesSubject && matchesUniversity && matchesRate && matchesRating;
  });

  // Áp dụng sắp xếp
  const sortedTutors = [...filteredTutors].sort((a, b) => {
    if (sortBy === 'RATING_DESC') {
      return b.rating - a.rating || b.reviews - a.reviews;
    } else if (sortBy === 'RATE_ASC') {
      return a.hourlyRate - b.hourlyRate;
    } else if (sortBy === 'RATE_DESC') {
      return b.hourlyRate - a.hourlyRate;
    } else if (sortBy === 'REVIEWS_DESC') {
      return b.reviews - a.reviews;
    }
    return 0;
  });

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Lỗi khi đăng xuất API', e);
    }
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const handleConnect = (tutor) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    alert(`Đã gửi yêu cầu kết nối với Gia sư "${tutor.fullName}" thành công! Lớp học của bạn đang chờ phê duyệt từ gia sư hoặc thông báo mời dạy đã gửi tới hòm thư.`);
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
            <Link to="/tutors" style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>Tìm Gia Sư</Link>
            <Link to="/classes" style={{ color: 'var(--text-secondary)' }}>Chợ Lớp Học</Link>
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
          <span className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>Đội Ngũ Học Thuật Uy Tín Hàng Đầu</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>Hệ Thống Danh Mục Gia Sư Tuyển Chọn</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.05rem' }}>
            Duyệt danh sách các gia sư xuất sắc từ các trường đại học hàng đầu Việt Nam. Được kiểm duyệt bằng cấp nghiêm ngặt.
          </p>
        </div>

        {/* Search & Filter Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Filters Sidebar */}
          <aside className="glass-card" style={{ padding: '1.75rem', position: 'sticky', top: '100px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <SlidersHorizontal size={18} style={{ color: 'var(--accent-cyan)' }} /> Lọc Gia Sư
              </h3>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSubjectFilter('');
                  setUniversityFilter('');
                  setRateFilter('ALL');
                  setRatingFilter('ALL');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Đặt lại lọc
              </button>
            </div>

            {/* Keyword Search */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Tìm theo tên / bằng cấp</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '34px', fontSize: '0.85rem' }} 
                  placeholder="Nhập tên, thủ khoa, thạc sĩ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filter by Subject */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Môn học giảng dạy</label>
              <select 
                className="form-select" 
                style={{ fontSize: '0.85rem' }}
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="">Tất cả môn học</option>
                <option value="Toán">Toán học</option>
                <option value="Vật lý">Vật lý</option>
                <option value="Hóa">Hóa học</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Piano">Piano / Nhạc</option>
              </select>
            </div>

            {/* Filter by University */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Trường Đại học</label>
              <select 
                className="form-select" 
                style={{ fontSize: '0.85rem' }}
                value={universityFilter}
                onChange={(e) => setUniversityFilter(e.target.value)}
              >
                <option value="">Mọi trường đại học</option>
                <option value="Bách Khoa">ĐH Bách Khoa</option>
                <option value="Sư phạm">ĐH Sư phạm</option>
                <option value="Khoa học Tự nhiên">ĐH Khoa học Tự nhiên</option>
                <option value="Ngoại thương">ĐH Ngoại thương</option>
                <option value="Nhạc Viện">Nhạc Viện</option>
              </select>
            </div>

            {/* Filter by Rate level */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Mức học phí/buổi</label>
              <select 
                className="form-select" 
                style={{ fontSize: '0.85rem' }}
                value={rateFilter}
                onChange={(e) => setRateFilter(e.target.value)}
              >
                <option value="ALL">Mọi mức học phí</option>
                <option value="UNDER_200">Dưới 200.000 đ</option>
                <option value="200_300">Từ 200.000đ - 300.000đ</option>
                <option value="OVER_300">Trên 300.000 đ</option>
              </select>
            </div>

            {/* Filter by Rating */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Đánh giá đánh giá</label>
              <select 
                className="form-select" 
                style={{ fontSize: '0.85rem' }}
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="ALL">Mọi điểm đánh giá</option>
                <option value="5_STAR">Xuất sắc (Đạt 5.0 ⭐)</option>
                <option value="OVER_4">Rất tốt (Đạt 4.5+ ⭐)</option>
              </select>
            </div>

          </aside>

          {/* RIGHT COLUMN: Results Section */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Top Toolbar (Summary & Sort Options) */}
            <div className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'left' }}>
                Tìm thấy <strong style={{ color: 'var(--accent-cyan)' }}>{sortedTutors.length}</strong> gia sư phù hợp
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
                  <option value="RATING_DESC">Đánh giá hàng đầu (⭐)</option>
                  <option value="REVIEWS_DESC">Nhiều đánh giá nhất</option>
                  <option value="RATE_ASC">Học phí: Thấp đến Cao</option>
                  <option value="RATE_DESC">Học phí: Cao đến Thấp</option>
                </select>
              </div>
            </div>

            {/* Tutors Grid Layout */}
            {sortedTutors.length === 0 ? (
              <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                <Users size={48} style={{ color: 'var(--accent-pink)', marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Không tìm thấy gia sư phù hợp</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Vui lòng thay đổi từ khóa hoặc bộ lọc các trường đại học khác.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {sortedTutors.map(t => (
                  <div 
                    key={t.id} 
                    className="glass-card" 
                    style={{ 
                      padding: '1.75rem',
                      border: t.isReal ? '1px solid rgba(141, 91, 76, 0.35)' : '1px solid var(--glass-border)',
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 180px',
                      gap: '1.5rem',
                      alignItems: 'center',
                      textAlign: 'left'
                    }}
                  >
                    {/* Left: Avatar */}
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={t.avatar} 
                        alt={t.fullName} 
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-cyan)' }} 
                      />
                      {t.isReal && (
                        <span style={{ position: 'absolute', right: 0, bottom: 0, background: 'var(--success)', borderRadius: '50%', border: '2px solid var(--bg-primary)', display: 'flex', padding: '0.15rem' }}>
                          <ShieldCheck size={12} style={{ color: '#fff' }} />
                        </span>
                      )}
                    </div>

                    {/* Middle: Details */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>{t.fullName}</h3>
                        <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem' }}>{t.badge}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-cyan)' }}>
                          <GraduationCap size={15} />
                          {t.university}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)', fontWeight: 600 }}>
                          <Star size={15} fill="var(--warning)" />
                          {t.rating} ({t.reviews} đánh giá)
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span>🎓 <strong>Chuyên ngành/Bằng cấp:</strong> {t.qualifications}</span>
                        <span>📚 <strong>Môn dạy tuyển chọn:</strong> <span style={{ color: 'var(--accent-blue)', fontWeight: 500 }}>{t.subjects}</span></span>
                        <p style={{ margin: '0.35rem 0 0 0', fontStyle: 'italic', fontSize: '0.82rem', lineHeight: 1.4 }}>
                          {t.experience}
                        </p>
                      </div>
                    </div>

                    {/* Right: Rate & Action Button */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem', height: '100%', justifyContent: 'center', alignItems: 'flex-start' }}>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Học phí đề xuất:</span>
                        <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--success)', marginTop: '0.15rem' }}>
                          {parseFloat(t.hourlyRate).toLocaleString('vi-VN')} đ<span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/buổi</span>
                        </strong>
                      </div>
                      <button 
                        onClick={() => setSelectedTutor(t)}
                        className="btn btn-primary btn-sm" 
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', textTransform: 'none', letterSpacing: 0, background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)', border: 'none', color: '#fff', fontWeight: 'bold' }}
                      >
                        Xem Chi Tiết Bằng Cấp
                      </button>
                      <button 
                        onClick={() => handleConnect(t)}
                        className="btn btn-secondary btn-sm" 
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', textTransform: 'none', letterSpacing: 0 }}
                      >
                        Yêu Cầu Dạy Học
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </section>

        </div>

      </div>

      {/* Modal Chi Tiết Hồ Sơ Gia Sư Công Khai */}
      {selectedTutor && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
          onClick={() => setSelectedTutor(null)}
        >
          <div 
            style={{
              maxWidth: '800px',
              width: '100%',
              background: 'linear-gradient(135deg, #1A120B 0%, #2D1C16 100%)',
              border: '1px solid rgba(197, 137, 64, 0.25)',
              borderRadius: '20px',
              padding: '2.5rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              textAlign: 'left',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Nút đóng */}
            <button 
              onClick={() => setSelectedTutor(null)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              ✕
            </button>

            {/* Header thông tin chính */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <img 
                src={selectedTutor.avatar} 
                alt={selectedTutor.fullName} 
                style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-cyan)' }}
              />
              <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#fff' }}>{selectedTutor.fullName}</h2>
                  <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{selectedTutor.badge}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-cyan)' }}>
                    <GraduationCap size={16} />
                    {selectedTutor.university}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--warning)', fontWeight: 600 }}>
                    <Star size={16} fill="var(--warning)" />
                    {selectedTutor.rating} ({selectedTutor.reviews} đánh giá)
                  </span>
                </div>
              </div>
            </div>

            {/* Grid thông tin chi tiết */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              
              {/* Cột trái: Thông tin học vấn */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)', margin: '0 0 1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Trình Độ & Chuyên Môn</h3>
                <table style={{ width: '100%', fontSize: '0.88rem', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Học vị / Học hàm:</td><td style={{ padding: '0.4rem 0', fontWeight: 'bold', color: '#fff' }}>{selectedTutor.qualifications}</td></tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Trường đào tạo:</td><td style={{ padding: '0.4rem 0', fontWeight: 'bold', color: '#fff' }}>{selectedTutor.university}</td></tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Môn dạy đăng ký:</td><td style={{ padding: '0.4rem 0', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{selectedTutor.subjects}</td></tr>
                    <tr><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Học phí yêu cầu:</td><td style={{ padding: '0.4rem 0', fontWeight: 'bold', color: 'var(--success)' }}>{parseFloat(selectedTutor.hourlyRate).toLocaleString('vi-VN')} đ/buổi</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Cột phải: Thông tin tự bạch */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)', margin: '0 0 1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Kinh Nghiệm Giảng Dạy</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{selectedTutor.experience}"
                </p>
              </div>

            </div>

            {/* Phần xem bằng cấp đính kèm */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} style={{ color: 'var(--accent-cyan)' }} /> Bằng Cấp & Chứng Chỉ Đối Chứng
              </h3>
              
              {(!selectedTutor.certificates || JSON.parse(selectedTutor.certificates).length === 0) ? (
                <div style={{ padding: '1.5rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  Gia sư chưa cung cấp tài liệu đính kèm công khai.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  {JSON.parse(selectedTutor.certificates).map(cert => (
                    <div key={cert.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.75rem', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ color: 'var(--accent-cyan)', background: 'rgba(102,252,241,0.05)', padding: '0.4rem', borderRadius: '4px' }}>
                        {cert.type && cert.type.includes('pdf') ? <BookOpen size={16} /> : <Award size={16} />}
                      </div>
                      <div style={{ overflow: 'hidden', textAlign: 'left', flexGrow: 1 }}>
                        <strong style={{ display: 'block', fontSize: '0.8rem', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={cert.name}>{cert.name}</strong>
                        <a 
                          href={cert.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'inline-block', marginTop: '2px', fontWeight: 600 }}
                        >
                          Mở tài liệu ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Các hành động cuối cùng */}
            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedTutor(null)}
                className="btn btn-secondary" 
                style={{ padding: '0.6rem 1.5rem', fontSize: '0.88rem' }}
              >
                Đóng lại
              </button>
              <button 
                onClick={() => { setSelectedTutor(null); handleConnect(selectedTutor); }}
                className="btn btn-primary" 
                style={{ padding: '0.6rem 2rem', fontSize: '0.88rem', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)', border: 'none', fontWeight: 'bold' }}
              >
                Gửi Yêu Cầu Dạy Học
              </button>
            </div>

          </div>
        </div>
      )}

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
