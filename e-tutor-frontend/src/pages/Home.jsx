import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Search, BookOpen, GraduationCap, MapPin, Award, CheckCircle, 
  ChevronRight, Phone, Mail, ShieldAlert, Star, Users, Briefcase,
  RefreshCw
} from 'lucide-react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  // Search state
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [method, setMethod] = useState('ALL');

  const [activeClasses, setActiveClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [realTutors, setRealTutors] = useState([]);

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
    }

    // Tải các lớp học public từ database
    fetchLiveClasses();
    // Tải danh sách gia sư thực tế
    fetchTutors();
  }, []);

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

  const fetchTutors = async () => {
    try {
      const res = await api.get('/auth/tutors/active');
      const detailedTutors = res.data.map((t) => {
        return {
          id: t.userId || t.id,
          name: t.fullName || "Gia sư ẩn danh",
          university: t.university || "Đại học Sư Phạm",
          subjects: t.subjects || "Toán, Lý, Hóa",
          hourlyRate: typeof t.hourlyRate === 'number' 
            ? `${t.hourlyRate.toLocaleString('vi-VN')} đ` 
            : (t.hourlyRate ? `${parseFloat(t.hourlyRate).toLocaleString('vi-VN')} đ` : "150.000 đ"),
          qualifications: t.qualifications || "Chứng chỉ sư phạm",
          experience: t.experience || "Chưa cập nhật kinh nghiệm tự bạch.",
          rating: 5.0,
          reviews: 12,
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
          badge: t.qualifications || "Gia sư mới"
        };
      });
      setRealTutors(detailedTutors);
    } catch (e) {
      console.error('Không thể lấy danh sách gia sư thực tế', e);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  // Tổng hợp danh sách lớp để hiển thị (Chỉ lấy lớp thật từ DB)
  const allDisplayClasses = activeClasses.map(c => ({
    id: c.id,
    title: c.title,
    grade: c.gradeLevel || "Cấp học",
    hourlyRate: c.hourlyRate,
    totalLessons: c.totalLessons,
    scheduleConfig: c.scheduleConfig.includes('[') ? "Xem chi tiết lịch học" : c.scheduleConfig,
    description: c.description,
    status: c.status,
    isReal: true
  }));

  // Lọc tìm kiếm
  const filteredTutors = realTutors.filter(t => {
    const matchSubject = subject === '' || t.subjects.toLowerCase().includes(subject.toLowerCase());
    return matchSubject;
  });

  const filteredClasses = allDisplayClasses.filter(c => {
    const matchSubject = subject === '' || c.title.toLowerCase().includes(subject.toLowerCase());
    const matchGrade = grade === '' || c.grade.toLowerCase().includes(grade.toLowerCase());
    return matchSubject && matchGrade;
  });

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
            <Link to="/classes" style={{ color: 'var(--text-secondary)' }}>Chợ Lớp Học</Link>
            <a href="#workflow" style={{ color: 'var(--text-secondary)' }}>Quy Trình Hoạt Động</a>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.9rem' }}>
                Chào, <strong style={{ color: 'var(--text-primary)' }}>{user.fullName}</strong>
              </span>
              <Link to={user && user.role === 'ADMIN' ? "/admin" : "/dashboard"} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                {user && user.role === 'ADMIN' ? 'Vào Admin Portal' : 'Vào Dashboard'}
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

      {/* Hero Section */}
      <section style={{
        padding: '5rem 2rem',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 50%, rgba(245, 239, 228, 0.55) 0%, rgba(252, 250, 246, 0.98) 100%)',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <span className="badge badge-cyan" style={{ marginBottom: '1.5rem', fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
            Nền Tảng Kết Nối Gia Sư 1 Kèm 1 Uy Tín Hàng Đầu Việt Nam
          </span>
          <h2 style={{ fontSize: '3.2rem', fontWeight: '800', lineHeight: '1.2', letterSpacing: '-1.5px', marginBottom: '1.5rem' }}>
            Tìm Gia Sư Giỏi <br />
            <span style={{ background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Tại Nhà & Online
            </span> Hoàn Hảo Nhất
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto 2.5rem auto' }}>
            Ứng dụng công nghệ kết nối trực tiếp cung-cầu học tập. Đảm bảo an toàn tài chính nhờ cơ chế giữ tiền trung gian (Escrow) đầu tiên tại Việt Nam.
          </p>

          {/* Interactive Search Box */}
          <div className="glass-card" style={{
            padding: '1.5rem',
            maxWidth: '800px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.8fr 1.2fr 1fr 0.5fr',
            gap: '1rem',
            alignItems: 'center',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.9)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Search size={18} style={{ color: 'var(--accent-cyan)' }} />
              <input
                type="text"
                placeholder="Nhập môn học (Toán, Lý, Anh...)"
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.95rem' }}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border-color)', padding: '0.6rem', color: 'var(--text-primary)' }}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="">Tất cả Lớp học</option>
              <option value="Lớp 9">Lớp 9</option>
              <option value="Lớp 10">Lớp 10</option>
              <option value="Lớp 11">Lớp 11</option>
              <option value="Lớp 12">Lớp 12</option>
              <option value="Người đi làm">Người đi làm</option>
            </select>

            <select
              className="form-select"
              style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border-color)', padding: '0.6rem', color: 'var(--text-primary)' }}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="ALL">Mọi hình thức</option>
              <option value="ONLINE">Học Online</option>
              <option value="OFFLINE">Học Tại Nhà</option>
            </select>

            <button 
              onClick={() => {
                navigate(`/classes?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}&method=${encodeURIComponent(method)}`);
              }} 
              className="btn btn-primary" 
              style={{ padding: '0.75rem', width: '100%', borderRadius: '8px' }}
            >
              <Search size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section style={{ padding: '3rem 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
          <div>
            <strong style={{ fontSize: '2.5rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-heading)' }}>15,000+</strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase' }}>Gia sư chất lượng</p>
          </div>
          <div>
            <strong style={{ fontSize: '2.5rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-heading)' }}>30,000+</strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase' }}>Học viên tin dùng</p>
          </div>
          <div>
            <strong style={{ fontSize: '2.5rem', color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)' }}>98.5%</strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase' }}>Phản hồi hài lòng</p>
          </div>
          <div>
            <strong style={{ fontSize: '2.5rem', color: 'var(--accent-pink)', fontFamily: 'var(--font-heading)' }}>0%</strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase' }}>Rủi ro tài chính</p>
          </div>
        </div>
      </section>

      {/* Tutors Section (Danh sách Gia sư nổi bật) */}
      <section id="tutors" style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Gia Sư Tiêu Biểu Nổi Bật</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Danh sách các gia sư hàng đầu có điểm đánh giá xuất sắc và đầy đủ hồ sơ bằng cấp được kiểm duyệt bởi Admin.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
          {filteredTutors.map(t => (
            <div key={t.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <img src={t.avatar} alt={t.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-cyan)' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '1.15rem' }}>{t.name}</strong>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>{t.badge}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <Star size={16} fill="var(--warning)" />
                    <strong>{t.rating}</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>({t.reviews} đánh giá)</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <GraduationCap size={16} />
                    {t.university}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Môn dạy: </strong>
                  <span style={{ color: 'var(--accent-blue)' }}>{t.subjects}</span>
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Học phí: </strong>
                  <span style={{ color: 'var(--success)' }}>{t.hourlyRate}/buổi</span>
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flexGrow: 1, lineHeights: '1.4' }}>
                {t.experience}
              </p>

              <button onClick={() => navigate('/register')} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}>
                Liên Hệ Nhận Lớp
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Classes Board Section (Lớp Học Cần Gia Sư) */}
      <section id="classes" style={{ padding: '5rem 2rem', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Bảng Lớp Học Mới Đang Đăng Tuyển</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Danh sách các lớp học có nhu cầu bồi dưỡng kiến thức cần gia sư ứng tuyển ngay.</p>
            </div>
            <button onClick={fetchLiveClasses} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <RefreshCw size={14} /> Tải lại bảng lớp
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
            {filteredClasses.map(cls => (
              <div key={cls.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: cls.isReal ? '1px solid rgba(141, 91, 76, 0.35)' : '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{cls.grade}</span>
                  {cls.isReal && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Lớp Thực Tế</span>}
                </div>

                <h3 style={{ fontSize: '1.15rem', lineHeight: '1.4', margin: '0.25rem 0', color: 'var(--text-primary)' }}>{cls.title}</h3>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flexGrow: 1 }}>
                  {cls.description}
                </p>

                <div style={{ background: 'rgba(141, 91, 76, 0.05)', padding: '0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong>Mức thù lao: </strong>
                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{cls.hourlyRate.toLocaleString('vi-VN')} đ/buổi</span>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong>Lịch học: </strong>
                    <span style={{ color: 'var(--accent-blue)' }}>{cls.scheduleConfig}</span>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong>Số buổi: </strong>
                    <span style={{ color: 'var(--text-primary)' }}>{cls.totalLessons} buổi</span>
                  </span>
                </div>

                <button 
                  onClick={async () => {
                    if (!isLoggedIn) {
                      navigate('/login');
                      return;
                    }
                    if (cls.status === 'FINDING_STUDENT') {
                      if (user && user.role === 'STUDENT') {
                        try {
                          if (cls.isReal) {
                            await api.post(`/class/${cls.id}/register`);
                            alert(`Đăng ký lớp "${cls.title}" thành công! Hãy tiến hành thanh toán học phí bảo chứng Escrow tại Dashboard để chính thức kích hoạt lớp học.`);
                          } else {
                            alert(`[Giả lập] Đăng ký lớp "${cls.title}" thành công! Vui lòng thanh toán học phí bảo chứng Escrow tại Dashboard.`);
                          }
                          navigate('/dashboard');
                        } catch (err) {
                          alert(err.response?.data?.error || 'Đăng ký lớp học thất bại!');
                        }
                      } else if (user && user.role === 'TUTOR') {
                        alert('Bạn đang có tài khoản Gia sư. Chỉ Học viên mới có thể đăng ký học các lớp do Gia sư mở sẵn!');
                      } else if (user && user.role === 'ADMIN') {
                        navigate('/admin');
                      }
                    } else {
                      // Mặc định hoặc FINDING_TUTOR
                      if (user && user.role === 'TUTOR') {
                        try {
                          if (cls.isReal) {
                            await api.post(`/class/${cls.id}/apply`);
                            alert(`Đã gửi đơn ứng tuyển vào lớp "${cls.title}" thành công! Vui lòng chờ Học viên phê duyệt.`);
                          } else {
                            alert(`[Giả lập] Gửi đơn ứng tuyển lớp "${cls.title}" thành công!`);
                          }
                        } catch (err) {
                          alert(err.response?.data?.error || 'Ứng tuyển thất bại!');
                        }
                      } else if (user && user.role === 'ADMIN') {
                        navigate('/admin');
                      } else {
                        navigate('/dashboard');
                      }
                    }
                  }} 
                  className="btn btn-primary animate-pulse-slow" 
                  style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {cls.status === 'FINDING_STUDENT' ? 'Đăng Ký Học Ngay' : 'Ứng Tuyển Nhận Lớp'}
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="workflow" style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Quy Trình Hoạt Động Kép</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Được tối ưu hóa bằng công nghệ để bảo vệ an toàn tối đa cho dòng tiền và học tập.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          {/* Cột học viên */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem', marginBottom: '1.5rem' }}>
              <Users size={24} />
              Dành Cho Học Viên
            </h3>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>1. Tìm kiếm hoặc Đăng tin:</strong> Lọc tìm gia sư ưng ý hoặc tự đăng thông tin yêu cầu học tập công khai lên bảng tin.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>2. Chọn gia sư & Nạp phí:</strong> Xem danh sách ứng viên chất lượng, chọn người ưng ý và thanh toán học phí qua hệ thống Escrow.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>3. Tiền đóng băng an toàn:</strong> Học phí sẽ được đóng băng trong ví. Trung tâm không giải ngân cho Gia sư khi chưa học xong.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>4. Học & Giải ngân từng buổi:</strong> Học trực tuyến qua phòng tích hợp. Học xong buổi nào, hệ thống chuyển thù lao buổi đó sang Gia sư.
              </li>
            </ul>
          </div>

          {/* Cột gia sư */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem', marginBottom: '1.5rem' }}>
              <Briefcase size={24} />
              Dành Cho Gia Sư
            </h3>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>1. Đăng ký & Xét duyệt:</strong> Cập nhật bằng cấp, CCCD, kinh nghiệm. Admin sẽ phê duyệt hồ sơ trong vòng 24 giờ.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>2. Ứng tuyển nhận lớp:</strong> Duyệt danh sách lớp cần gia sư phù hợp và bấm Ứng tuyển để kết nối học viên.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>3. Trực tiếp giảng dạy:</strong> Dạy học qua phòng tương tác trực tuyến (WebRTC/Zoom) tự động mở link trước giờ học.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>4. Nhận thù lao tức thì:</strong> Nhận chuyển khoản tiền học của từng buổi ngay sau khi học viên bấm xác nhận và thực hiện rút tiền về ngân hàng.
              </li>
            </ul>
          </div>
        </div>
      </section>

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
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
              Nền tảng kết nối gia sư và lớp học trực tuyến tích hợp ví điện tử bảo chứng an toàn tài chính Escrow. Giúp học tập hiệu quả, minh bạch và an toàn.
            </p>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={16} /> 0369 148 660</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={16} /> support@giasuhome.vn</span>
            </div>
          </div>
          <div>
            <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Về GiaSuHome</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><a href="#tutors">Tìm kiếm gia sư</a></li>
              <li><a href="#classes">Lớp mới đăng tuyển</a></li>
              <li><a href="#workflow">Quy trình giữ tiền</a></li>
              <li><Link to="/register">Trở thành gia sư</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Quy định pháp lý</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><a href="#rules">Chính sách bảo mật</a></li>
              <li><a href="#escrow">Quy chế thanh toán</a></li>
              <li><a href="#dispute">Giải quyết khiếu nại</a></li>
              <li><a href="#terms">Điều khoản sử dụng</a></li>
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
