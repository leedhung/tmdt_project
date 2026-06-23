import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  LogOut, Wallet as WalletIcon, CreditCard, Shield, PlusCircle, 
  Calendar, CheckCircle, RefreshCw, Send, DollarSign, Layers,
  Grid, Book, Users, Star, Headphones, User, Menu, X, Clock,
  Plus, Award, BookOpen, AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, frozenBalance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('overview');

  // Admin Specific States
  const [allUsers, setAllUsers] = useState([]);
  const [selectedTutorProfile, setSelectedTutorProfile] = useState(null);
  const [userFilter, setUserFilter] = useState('ALL');
  const [pendingTutors, setPendingTutors] = useState([]);
  const [supportTickets, setSupportTickets] = useState([
    { id: 1, type: "Khiếu nại lớp học", content: "Lớp Toán 9 - Gia sư đi dạy muộn 15 phút không báo trước.", classTitle: "Toán lớp 9 ôn thi vào 10", status: "PENDING" },
    { id: 2, type: "Vấn đề ví tiền", content: "Học viên ledinhh521@gmail.com nạp tiền qua ngân hàng chưa nhận được số dư.", classTitle: "Nạp tiền ngân hàng", status: "PENDING" },
    { id: 3, type: "Yêu cầu thay đổi lịch", content: "Gia sư xin phép đổi buổi học Thứ 4 sang Chủ Nhật tuần này.", classTitle: "Piano cơ bản tại nhà", status: "RESOLVED" }
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // States for Password Management
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: ''
  });

  useEffect(() => {
    // 1. Kiểm tra đăng nhập và phân quyền ADMIN
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'ADMIN') {
      navigate('/dashboard'); // Khóa truy cập trái phép, đá về trang thường
      return;
    }
    setUser(parsedUser);
    setProfileForm({
      fullName: parsedUser.fullName || 'Hệ Thống Admin',
      phone: parsedUser.phone || ''
    });

    // 2. Tải dữ liệu ban đầu
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);
      
      // 1. Tải danh sách tất cả lớp học trên toàn sàn
      const classesRes = await api.get('/class/all');
      setClasses(classesRes.data);

      // 2. Tải danh sách tất cả người dùng
      const usersRes = await api.get('/auth/users');
      setAllUsers(usersRes.data);

      // 2b. Tải danh sách gia sư chờ duyệt chuyên môn
      try {
        const pendingRes = await api.get('/auth/admin/tutors/pending');
        setPendingTutors(pendingRes.data);
      } catch (e) {
        console.error("Không thể tải danh sách gia sư chờ duyệt chuyên môn", e);
      }

      // 3. Tải ví hệ thống Admin
      try {
        const walletRes = await api.get('/wallet');
        setWallet(walletRes.data);
      } catch (e) {
        console.error("Không thể tải ví Admin", e);
      }

      // 4. Tải lịch sử giao dịch toàn sàn
      try {
        const txRes = await api.get('/wallet/transactions');
        setTransactions(txRes.data);
      } catch (e) {
        console.error("Không thể tải lịch sử giao dịch toàn hệ thống", e);
      }

      // 5. Tải danh sách các buổi học bị khiếu nại (tranh chấp) thực tế từ DB
      try {
        const disputedRes = await api.get('/class/lessons/disputed');
        const mappedTickets = disputedRes.data.map(les => ({
          id: les.lessonId, // Sử dụng lessonId làm ID ticket
          lessonId: les.lessonId,
          type: "Khiếu nại buổi học",
          content: `Học viên ${les.studentName || 'ẩn danh'} gửi khiếu nại Buổi học #${les.lessonNumber} lớp "${les.classTitle || 'Lớp học'}". Liên hệ Học viên: ${les.studentEmail || ''}. Gia sư giảng dạy: ${les.tutorName || ''} (${les.tutorEmail || ''}).`,
          classTitle: les.classTitle || `Mã lớp #${les.classId}`,
          status: "PENDING",
          hourlyRate: les.hourlyRate
        }));
        
        // Gộp chung với 2 mock ticket mẫu khác loại
        setSupportTickets([
          ...mappedTickets,
          { id: 991, type: "Vấn đề ví tiền", content: "Học viên ledinhh521@gmail.com nạp tiền qua ngân hàng chưa nhận được số dư.", classTitle: "Nạp tiền ngân hàng", status: "PENDING" },
          { id: 992, type: "Yêu cầu thay đổi lịch", content: "Gia sư xin phép đổi buổi học Thứ 4 sang Chủ Nhật tuần này.", classTitle: "Piano cơ bản tại nhà", status: "RESOLVED" }
        ]);
      } catch (e) {
        console.error("Không thể tải danh sách khiếu nại thực tế từ CSDL", e);
      }

    } catch (err) {
      console.error(err);
      setError('Lỗi khi đồng bộ dữ liệu Admin với máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // ADMIN DUYỆT LỚP HỌC THẬT
  const handleApproveClass = async (classId) => {
    try {
      setError('');
      await api.post(`/class/${classId}/approve`);
      setSuccess('Đã duyệt lớp học thành công! Trạng thái chuyển sang Chờ thanh toán.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Duyệt lớp học thất bại!');
    }
  };

  // THAY ĐỔI MẬT KHẨU ADMIN
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không trùng khớp!');
      return;
    }
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      setSuccess('Thay đổi mật khẩu tài khoản Admin thành công!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Thay đổi mật khẩu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // ADMIN PHÊ DUYỆT TÀI KHOẢN GIA SƯ
  const handleToggleVerifyUser = async (userId, email, currentStatus) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await api.post(`/auth/users/${userId}/toggle-verify`);
      
      setSuccess(currentStatus ? `Đã tạm khóa tài khoản thành viên ${email}!` : `Đã phê duyệt kích hoạt tài khoản thành viên ${email}!`);
      
      // Tải lại danh sách người dùng thực tế từ CSDL
      await fetchData();
      if (selectedTutorProfile && selectedTutorProfile.id === userId) {
        // Cập nhật lại UI hiển thị thông tin nếu đang xem gia sư này
        const res = await api.get(`/auth/users/${userId}/profile`);
        setSelectedTutorProfile({ ...res.data, id: userId });
      }
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || 'Lỗi khi phê duyệt tài khoản!');
    } finally {
      setLoading(false);
    }
  };

  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  // ADMIN PHÊ DUYỆT CHÍNH THỨC HỒ SƠ GIA SƯ
  const handleApproveTutorProfile = async (userId, email) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const res = await api.post(`/auth/admin/tutor/${userId}/approve`);
      setSuccess(res.data.message || `Đã phê duyệt hồ sơ chuyên môn và kích hoạt tài khoản ${email} thành công!`);
      
      // Làm mới dữ liệu
      await fetchData();
      if (selectedTutorProfile && selectedTutorProfile.id === userId) {
        const profileRes = await api.get(`/auth/users/${userId}/profile`);
        setSelectedTutorProfile({ ...profileRes.data, id: userId });
      }
      setRejectReasonInput('');
      setShowRejectBox(false);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || 'Phê duyệt hồ sơ gia sư thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // ADMIN TỪ CHỐI DUYỆT HỒ SƠ GIA SƯ
  const handleRejectTutorProfile = async (userId, email) => {
    if (!rejectReasonInput.trim()) {
      setError('Vui lòng nhập lý do cụ thể trước khi từ chối hồ sơ gia sư!');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const res = await api.post(`/auth/admin/tutor/${userId}/reject`, {
        reason: rejectReasonInput.trim()
      });
      setSuccess(res.data.message || `Đã từ chối duyệt hồ sơ gia sư ${email} và gửi phản hồi thành công!`);

      // Làm mới dữ liệu
      await fetchData();
      if (selectedTutorProfile && selectedTutorProfile.id === userId) {
        const profileRes = await api.get(`/auth/users/${userId}/profile`);
        setSelectedTutorProfile({ ...profileRes.data, id: userId });
      }
      setRejectReasonInput('');
      setShowRejectBox(false);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || 'Từ chối duyệt hồ sơ gia sư thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTutorProfile = async (userId) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const res = await api.get(`/auth/users/${userId}/profile`);
      setSelectedTutorProfile({ ...res.data, id: userId });
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || 'Lỗi khi tải chi tiết hồ sơ gia sư!');
    } finally {
      setLoading(false);
    }
  };

  // XỬ LÝ GIẢI QUYẾT TICKET CHO ADMIN
  const handleResolveTicket = async (ticketId, lessonId, decision) => {
    if (lessonId) {
      try {
        setError('');
        setSuccess('');
        setLoading(true);
        await api.post(`/class/lessons/${lessonId}/resolve-dispute?decision=${decision}`);
        setSuccess(decision === 'REFUND' 
          ? `Đã hoàn phí thành công cho Học viên đối với khiếu nại #${ticketId}!`
          : `Đã giải ngân thành công cho Gia sư đối với khiếu nại #${ticketId}!`
        );
        fetchData();
      } catch (err) {
        setError(err.response?.data?.error || 'Xử lý khiếu nại thất bại!');
      } finally {
        setLoading(false);
      }
    } else {
      setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: "RESOLVED" } : t));
      setSuccess(`Đã xử lý khiếu nại #${ticketId} thành công! Hệ thống tự động gửi thông báo hoàn phí.`);
    }
  };

  if (!user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;

  const activeClasses = classes.filter(c => c.status === 'ACTIVATED');
  const pendingClasses = classes.filter(c => c.status === 'PENDING_APPROVAL');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-brand-ghost d-lg-none" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link className="navbar-brand fw-bold" to="/" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <Award size={26} style={{ color: 'var(--accent-pink)' }} />
            Giasu<span style={{ color: 'var(--accent-pink)' }}>Home Admin</span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="sidebar-avatar" style={{ width: '38px', height: '38px', fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--accent-pink) 0%, var(--accent-purple) 100%)' }}>
              AD
            </div>
            <div className="d-none d-md-block" style={{ textAlign: 'left' }}>
              <div className="body-sm-medium" style={{ color: 'var(--text-primary)' }}>{user.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hệ thống Quản trị ROOT</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Layout */}
      <div className="dashboard-shell">
        
        {/* Mobile Sidebar Overlay */}
        <div className={`dash-sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)}></div>

        {/* Sidebar */}
        <aside className="dash-sidebar open">
          <div className="sidebar-user">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg, var(--accent-pink) 0%, var(--accent-purple) 100%)' }}>
                AD
              </div>
              <div style={{ textAlign: 'left' }}>
                <div className="body-md-medium" style={{ color: 'var(--text-primary)' }}>{user.fullName}</div>
                <div className="body-sm text-steel" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Quản trị tối cao
                  <span className="badge badge-warning" style={{ fontSize: '7px', padding: '1px 4px', color: '#ffffff' }}>ROOT</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <a 
              className={`sidebar-link ${activePanel === 'overview' ? 'active' : ''}`}
              onClick={() => { setActivePanel('overview'); setSidebarOpen(false); }}
            >
              <Grid size={18} /> Tổng quan hệ thống
            </a>
            <a 
              className={`sidebar-link ${activePanel === 'classes' ? 'active' : ''}`}
              onClick={() => { setActivePanel('classes'); setSidebarOpen(false); }}
            >
              <Book size={18} /> Phê duyệt Lớp học
            </a>
            <a 
              className={`sidebar-link ${activePanel === 'tutor_reviews' ? 'active' : ''}`}
              onClick={() => { setActivePanel('tutor_reviews'); setSidebarOpen(false); setSelectedTutorProfile(null); setShowRejectBox(false); setRejectReasonInput(''); }}
            >
              <Shield size={18} /> Duyệt hồ sơ Gia sư
              {pendingTutors.length > 0 && (
                <span className="badge badge-danger" style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '10px', marginLeft: 'auto', background: '#ef4444', color: '#fff', fontWeight: 'bold' }}>
                  {pendingTutors.length}
                </span>
              )}
            </a>
            <a 
              className={`sidebar-link ${activePanel === 'users' ? 'active' : ''}`}
              onClick={() => { setActivePanel('users'); setSidebarOpen(false); }}
            >
              <Users size={18} /> Người dùng hệ thống
            </a>
            <a 
              className={`sidebar-link ${activePanel === 'payment' ? 'active' : ''}`}
              onClick={() => { setActivePanel('payment'); setSidebarOpen(false); }}
            >
              <WalletIcon size={18} /> Giám sát Ví tiền sàn
            </a>
            <a 
              className={`sidebar-link ${activePanel === 'support' ? 'active' : ''}`}
              onClick={() => { setActivePanel('support'); setSidebarOpen(false); }}
            >
              <Headphones size={18} /> Khiếu nại & Hỗ trợ
            </a>
            <a 
              className={`sidebar-link ${activePanel === 'account' ? 'active' : ''}`}
              onClick={() => { setActivePanel('account'); setSidebarOpen(false); }}
              style={{ borderTop: '1px solid var(--border-color)', borderRadius: 0, paddingTop: '1rem', marginTop: '1rem' }}
            >
              <User size={18} /> Tài khoản Admin
            </a>

            <Link
              className="sidebar-link"
              to="/classes"
              style={{ borderTop: '1px solid var(--border-color)', borderRadius: 0, paddingTop: '1rem', marginTop: '1rem' }}
            >
              <BookOpen size={18} /> Chợ Lớp Học
            </Link>

            <Link
              className="sidebar-link"
              to="/tutors"
            >
              <Users size={18} /> Danh Mục Gia Sư
            </Link>

            <Link 
              className="sidebar-link"
              to="/"
              style={{ borderTop: '1px solid var(--border-color)', borderRadius: 0, paddingTop: '1rem', marginTop: '1rem' }}
            >
              <Award size={18} /> Quay lại Trang Chủ
            </Link>

            <a 
              className="sidebar-link sidebar-link-logout"
              onClick={handleLogout}
            >
              <LogOut size={18} /> Đăng xuất
            </a>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="dash-main">
          
          {/* Notification System */}
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {error && (
              <div className="badge badge-danger" style={{ width: '100%', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'none' }}>
                <AlertCircle size={16} /> <strong>Lỗi:</strong> {error}
              </div>
            )}
            {success && (
              <div className="badge badge-success" style={{ width: '100%', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'none' }}>
                <CheckCircle size={16} /> <strong>Thông báo:</strong> {success}
              </div>
            )}
          </div>

          {/* ==================== 1. TỔNG QUAN PANEL ==================== */}
          {activePanel === 'overview' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 className="heading-2">Bảng điều hành Quản trị tối cao 🛡️</h1>
                  <p className="body-md text-slate">Trung tâm giám sát toàn diện, phê duyệt chất lượng và quản trị ví tiền sàn.</p>
                </div>
                <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
                  <RefreshCw size={16} /> Làm mới số liệu
                </button>
              </div>

              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="dash-stat-card">
                  <div className="stat-icon purple mb-3"><Users size={20} /></div>
                  <div className="heading-3" style={{ fontSize: '1.8rem', margin: '0.25rem 0' }}>{allUsers.length}</div>
                  <div className="body-sm text-slate">Tổng thành viên</div>
                </div>
                <div className="dash-stat-card">
                  <div className="stat-icon green mb-3"><User size={20} /></div>
                  <div className="heading-3" style={{ fontSize: '1.8rem', margin: '0.25rem 0' }}>{allUsers.filter(u => u.role === 'STUDENT').length}</div>
                  <div className="body-sm text-slate">Tổng Học viên</div>
                </div>
                <div className="dash-stat-card">
                  <div className="stat-icon orange mb-3"><Award size={20} /></div>
                  <div className="heading-3" style={{ fontSize: '1.8rem', margin: '0.25rem 0' }}>{allUsers.filter(u => u.role === 'TUTOR').length}</div>
                  <div className="body-sm text-slate">Tổng Gia sư tuyển chọn</div>
                </div>
                <div className="dash-stat-card">
                  <div className="stat-icon blue mb-3"><Book size={20} /></div>
                  <div className="heading-3" style={{ fontSize: '1.8rem', margin: '0.25rem 0' }}>{classes.length}</div>
                  <div className="body-sm text-slate">Tổng lớp học khởi tạo</div>
                </div>
              </div>

              {/* Grid Panels */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                
                {/* Left: Lớp chờ duyệt */}
                <div className="card-feature" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignSelf: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="heading-3" style={{ margin: 0 }}>Lớp học chờ duyệt khẩn cấp</h2>
                    <a onClick={() => setActivePanel('classes')} style={{ cursor: 'pointer', fontWeight: 600 }}>Xem tất cả</a>
                  </div>

                  {pendingClasses.map(cls => (
                    <div key={cls.id} className="dash-class-row">
                      <div className="class-avatar"><BookOpen size={18} /></div>
                      <div style={{ flexGrow: 1, textAlign: 'left' }}>
                        <div className="body-md-medium">{cls.title}</div>
                        <div className="body-sm text-slate">
                          Học phí: {cls.hourlyRate.toLocaleString('vi-VN')}đ/buổi • Số buổi: {cls.totalLessons}
                        </div>
                      </div>
                      <button onClick={() => handleApproveClass(cls.id)} className="btn btn-primary btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        Duyệt ngay
                      </button>
                    </div>
                  ))}

                  {pendingClasses.length === 0 && (
                    <div style={{ padding: '3rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      Tuyệt vời! Không có lớp học nào đang ở trạng thái chờ duyệt.
                    </div>
                  )}
                </div>

                {/* Right: Escrow wallet stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="card-feature" style={{ marginBottom: 0, textAlign: 'left' }}>
                    <h3 className="heading-3" style={{ fontSize: '1.15rem', color: 'var(--accent-pink)' }}>Quỹ Tiền Hệ Thống</h3>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DOANH THU HOA HỒNG (30%):</span>
                      <strong style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)', display: 'block' }}>
                        {(activeClasses.reduce((sum, c) => sum + (c.hourlyRate * c.totalLessons * 0.3), 0)).toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TỔNG TIỀN ĐANG ĐÓNG BĂNG:</span>
                      <strong style={{ fontSize: '1.4rem', color: 'var(--accent-pink)', display: 'block' }}>
                        {(activeClasses.reduce((sum, c) => sum + (c.hourlyRate * c.totalLessons), 0)).toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                  </div>

                  <div className="card-feature-mint" style={{ border: '1px solid rgba(141, 91, 76, 0.25)', background: 'linear-gradient(135deg, rgba(236,72,153,0.05) 0%, rgba(139,92,246,0.05) 100%)' }}>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', margin: '0 0 0.5rem 0' }}>Bảng điều khiển root</h4>
                    <p className="body-sm text-slate" style={{ fontSize: '0.8rem', lineHeight: 1.4, marginBottom: '1rem' }}>
                      Phê duyệt nhanh các vai trò, mở khóa thù lao an toàn khi có tranh chấp phát sinh.
                    </p>
                    <button onClick={() => setActivePanel('support')} className="btn btn-secondary w-100" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      Xử lý hòm thư khiếu nại
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================== 2. PHÊ DUYỆT LỚP HỌC PANEL ==================== */}
          {activePanel === 'classes' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 className="heading-2">Phê duyệt & Giám sát lớp học</h1>
                  <p className="body-md text-slate">Duyệt các lớp học mới đăng ký từ học sinh để đẩy lên hệ thống kết nối gia sư.</p>
                </div>
                <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
                  <RefreshCw size={16} /> Làm mới
                </button>
              </div>

              <div className="card-feature">
                <h2 className="heading-3" style={{ marginBottom: '1.25rem' }}>Danh sách lớp học toàn hệ thống</h2>
                {classes.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Chưa ghi nhận lớp học nào trên sàn.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {classes.map(cls => (
                      <div key={cls.id} style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        background: 'rgba(255,255,255,0.01)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ textAlign: 'left' }}>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '1.15rem', display: 'block', marginBottom: '0.25rem' }}>{cls.title}</strong>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                              Lớp ID: <strong>#{cls.id}</strong> | Số buổi: <strong>{cls.totalLessons}</strong> | Thù lao: <strong>{cls.hourlyRate.toLocaleString('vi-VN')} đ/buổi</strong> | Tổng: <strong style={{ color: 'var(--accent-cyan)' }}>{(cls.hourlyRate * cls.totalLessons).toLocaleString('vi-VN')} đ</strong>
                            </span>
                            {cls.description && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>{cls.description}</p>}
                          </div>
                          <div>
                            <span className={`badge ${
                              cls.status === 'ACTIVATED' ? 'badge-success' : 
                              cls.status === 'WAITING_PAYMENT' ? 'badge-cyan' : 'badge-warning'
                            }`} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                              {cls.status === 'ACTIVATED' ? 'Đang hoạt động' : 
                               cls.status === 'WAITING_PAYMENT' ? 'Chờ thanh toán' : 'Chờ phê duyệt'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem' }}>
                          {cls.status === 'PENDING_APPROVAL' ? (
                            <button
                              onClick={() => handleApproveClass(cls.id)}
                              className="btn btn-primary"
                              style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                            >
                              <Shield size={14} /> Duyệt phê duyệt lớp này
                            </button>
                          ) : cls.status === 'ACTIVATED' ? (
                            <button
                              onClick={async () => {
                                setSelectedClass(cls);
                                const res = await api.get(`/class/${cls.id}/lessons`);
                                setLessons(res.data);
                                setSuccess(`Đã tải danh sách các buổi học lớp "${cls.title}"!`);
                              }}
                              className="btn btn-secondary"
                              style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                            >
                              <Calendar size={14} /> Xem danh sách lịch buổi học đã rải trong DB
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem' }}>Chờ học viên nạp ví thanh toán học phí chốt lớp...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chi tiết buổi học */}
              {selectedClass && (
                <div className="card-feature" style={{ border: '1px solid var(--accent-pink)', background: 'rgba(236,72,153,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-pink)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={18} /> Lịch học tự động lớp "#{selectedClass.id} - {selectedClass.title}"
                    </h3>
                    <button className="btn btn-secondary" onClick={() => setSelectedClass(null)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Đóng</button>
                  </div>
                  
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '0.75rem' }}>Buổi học</th>
                          <th style={{ padding: '0.75rem' }}>Thời gian bắt đầu</th>
                          <th style={{ padding: '0.75rem' }}>Thời gian kết thúc</th>
                          <th style={{ padding: '0.75rem' }}>Phòng Học Online</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lessons.map(les => (
                          <tr key={les.lessonId || les.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Buổi #{les.lessonNumber}</td>
                            <td style={{ padding: '0.75rem' }}>{les.startTime ? new Date(les.startTime).toLocaleString('vi-VN') : 'Chưa xếp'}</td>
                            <td style={{ padding: '0.75rem' }}>{les.endTime ? new Date(les.endTime).toLocaleString('vi-VN') : 'Chưa xếp'}</td>
                            <td style={{ padding: '0.75rem' }}>
                              {les.meetUrl ? (
                                <a href={les.meetUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>Vào lớp học ↗</a>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)' }}>Chưa cấu hình</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {lessons.length === 0 && (
                          <tr>
                            <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không tìm thấy lịch học thực tế.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 3. NGƯỜI DÙNG PANEL ==================== */}
          {activePanel === 'users' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 className="heading-2">Quản lý thành viên hệ thống</h1>
                  <p className="body-md text-slate">Quản lý trạng thái và xem xét hồ sơ năng lực của các tài khoản trên sàn.</p>
                </div>
                <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RefreshCw size={14} /> Làm mới
                </button>
              </div>

              {/* Tabs Bộ lọc thành viên */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                {[
                  { key: 'ALL', label: 'Tất cả thành viên' },
                  { key: 'TUTORS', label: 'Gia sư hệ thống' },
                  { key: 'STUDENTS', label: 'Học viên' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => { setUserFilter(tab.key); setSelectedTutorProfile(null); }}
                    className="btn"
                    style={{
                      padding: '0.4rem 1rem',
                      fontSize: '0.82rem',
                      textTransform: 'none',
                      letterSpacing: 0,
                      background: userFilter === tab.key 
                        ? 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)'
                        : 'rgba(255,255,255,0.02)',
                      color: userFilter === tab.key ? '#fff' : 'var(--text-secondary)',
                      border: userFilter === tab.key ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="card-feature">
                <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '0.75rem' }}>ID</th>
                        <th style={{ padding: '0.75rem' }}>Họ và tên</th>
                        <th style={{ padding: '0.75rem' }}>Email liên hệ</th>
                        <th style={{ padding: '0.75rem' }}>Số điện thoại</th>
                        <th style={{ padding: '0.75rem' }}>Vai trò</th>
                        <th style={{ padding: '0.75rem' }}>Trạng thái</th>
                        <th style={{ padding: '0.75rem' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers
                        .filter(u => {
                          if (userFilter === 'TUTORS') return u.role === 'TUTOR';
                          if (userFilter === 'STUDENTS') return u.role === 'STUDENT';
                          return true;
                        })
                        .map(u => (
                          <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '0.75rem', color: 'var(--accent-pink)' }}>#{u.id}</td>
                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{u.fullName || 'Chưa cập nhật'}</td>
                            <td style={{ padding: '0.75rem' }}>{u.email}</td>
                            <td style={{ padding: '0.75rem' }}>{u.phone || 'Chưa cập nhật'}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span className={`badge ${
                                u.role === 'ADMIN' ? 'badge-danger' : 
                                u.role === 'TUTOR' ? 'badge-cyan' : 'badge-success'
                              }`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                                {u.role}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span className="status-dot" style={{ backgroundColor: u.isVerified || u.is_verified ? 'var(--success)' : '#ef4444' }}></span>
                                {u.isVerified || u.is_verified ? 'Đang hoạt động' : 'Đang khóa'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              {u.role === 'TUTOR' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    onClick={() => handleViewTutorProfile(u.id)} 
                                    className="btn btn-primary btn-sm" 
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                                  >
                                    Xem hồ sơ
                                  </button>
                                  <button 
                                    onClick={() => handleToggleVerifyUser(u.id, u.email, u.isVerified || u.is_verified ? 1 : 0)} 
                                    className="btn btn-secondary btn-sm" 
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: u.isVerified || u.is_verified ? '#ef4444' : 'var(--success)', color: u.isVerified || u.is_verified ? '#ef4444' : 'var(--success)', background: 'transparent' }}
                                  >
                                    {u.isVerified || u.is_verified ? 'Khóa TK' : 'Duyệt'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedTutorProfile && (
                <div className="card-feature animate-fade-in" style={{ marginTop: '2rem', border: '1px solid var(--accent-cyan)', background: 'rgba(102, 252, 241, 0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <h3 className="heading-3" style={{ color: 'var(--accent-cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award size={20} /> Chi tiết hồ sơ Gia sư thỉnh giảng
                      </h3>
                      <p className="body-sm text-slate" style={{ margin: '0.25rem 0 0 0' }}>Hồ sơ thông tin cơ bản và năng lực giảng dạy của Gia sư.</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => setSelectedTutorProfile(null)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Đóng lại</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', textAlign: 'left' }}>
                    {/* Basic info */}
                    <div>
                      <h4 style={{ color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Thông tin cá nhân</h4>
                      <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr><td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', width: '40%' }}>Họ và tên:</td><td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>{selectedTutorProfile.fullName}</td></tr>
                          <tr><td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>Email:</td><td style={{ padding: '0.5rem 0' }}>{selectedTutorProfile.email}</td></tr>
                          <tr><td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>Số điện thoại:</td><td style={{ padding: '0.5rem 0' }}>{selectedTutorProfile.phone || 'Chưa cập nhật'}</td></tr>
                          <tr><td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>Số CCCD:</td><td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>{selectedTutorProfile.citizenCard || 'Chưa cập nhật'}</td></tr>
                          <tr>
                            <td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>Trạng thái duyệt:</td>
                            <td style={{ padding: '0.5rem 0' }}>
                              <span className={`badge ${selectedTutorProfile.isVerified ? 'badge-success' : 'badge-warning'}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                {selectedTutorProfile.isVerified ? 'Đã duyệt kích hoạt' : 'Đang tạm khóa'}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Specialized details */}
                    <div>
                      <h4 style={{ color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Năng lực & Thù lao</h4>
                      <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr><td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', width: '40%' }}>Trường công tác/ĐH:</td><td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>{selectedTutorProfile.university || 'Chưa cập nhật'}</td></tr>
                          <tr><td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>Trình độ:</td><td style={{ padding: '0.5rem 0', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{selectedTutorProfile.qualifications || 'Chưa cập nhật'}</td></tr>
                          <tr><td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>Môn dạy:</td><td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>{selectedTutorProfile.subjects || 'Chưa cập nhật'}</td></tr>
                          <tr><td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>Học phí mong muốn:</td><td style={{ padding: '0.5rem 0', fontWeight: 'bold', color: 'var(--success)' }}>{selectedTutorProfile.hourlyRate ? selectedTutorProfile.hourlyRate.toLocaleString('vi-VN') + ' đ/buổi' : 'Chưa cập nhật'}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                    <button
                      onClick={() => handleToggleVerifyUser(selectedTutorProfile.id, selectedTutorProfile.email, selectedTutorProfile.isVerified ? 1 : 0)}
                      className={`btn ${selectedTutorProfile.isVerified ? 'btn-secondary' : 'btn-primary'}`}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        borderColor: selectedTutorProfile.isVerified ? '#ef4444' : 'var(--success)',
                        color: selectedTutorProfile.isVerified ? '#ef4444' : '#ffffff',
                        backgroundColor: selectedTutorProfile.isVerified ? 'transparent' : 'var(--success)'
                      }}
                      disabled={loading}
                    >
                      {selectedTutorProfile.isVerified ? 'Tạm khóa quyền hoạt động của Gia sư' : 'Mở khóa kích hoạt tài khoản Gia sư'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 3B. MỤC DUYỆT HỒ SƠ GIA SƯ RIÊNG BIỆT (NEW) ==================== */}
          {activePanel === 'tutor_reviews' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 className="heading-2">Hàng đợi kiểm duyệt chuyên môn Gia sư 🛡️</h1>
                  <p className="body-md text-slate">Thực hiện đối chiếu thông tin năng lực và các tài liệu chứng chỉ đính kèm để cấp phép thỉnh giảng chính thức.</p>
                </div>
                <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RefreshCw size={14} /> Làm mới hàng đợi
                </button>
              </div>

              {/* Layout 2 cột song song */}
              <div style={{ display: 'grid', gridTemplateColumns: '4fr 6fr', gap: '2rem', alignItems: 'start', flexWrap: 'wrap' }}>
                
                {/* Cột trái: Hàng đợi danh sách chờ duyệt */}
                <div className="card-feature" style={{ marginBottom: 0, padding: '1.25rem' }}>
                  <h3 className="heading-3" style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} style={{ color: 'var(--accent-pink)' }} /> Hồ sơ đang chờ duyệt ({pendingTutors.length})
                  </h3>

                  {pendingTutors.length === 0 ? (
                    <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <CheckCircle size={32} style={{ color: 'var(--success)', marginBottom: '0.75rem', display: 'block', margin: '0 auto' }} />
                      🎉 Tuyệt vời! Hiện tại không có hồ sơ gia sư nào đang chờ kiểm duyệt chuyên môn trên hệ thống.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto' }}>
                      {pendingTutors.map(t => {
                        const isSelected = selectedTutorProfile && selectedTutorProfile.id === t.userId;
                        return (
                          <div
                            key={t.userId}
                            onClick={() => {
                              setSelectedTutorProfile({
                                ...t,
                                id: t.userId,
                                fullName: t.user?.fullName,
                                email: t.user?.email,
                                phone: t.user?.phone,
                                dob: t.user?.dob,
                                isVerified: t.user?.isVerified
                              });
                              setShowRejectBox(false);
                              setRejectReasonInput('');
                            }}
                            style={{
                              border: isSelected ? '1px solid var(--accent-pink)' : '1px solid var(--border-color)',
                              borderRadius: '10px',
                              padding: '1rem',
                              background: isSelected ? 'rgba(236,72,153,0.03)' : 'rgba(255,255,255,0.01)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s ease-in-out'
                            }}
                            className="tutor-card-hover"
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <strong style={{ color: isSelected ? 'var(--accent-pink)' : '#fff', fontSize: '0.95rem' }}>
                                {t.user?.fullName || 'Gia sư ẩn danh'}
                              </strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>#{t.userId}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <span>🎓 Trình độ: <strong>{t.qualifications}</strong></span>
                              <span>📚 Môn dạy: <strong>{t.subjects}</strong></span>
                              <span>🏫 ĐH: <strong>{t.university || 'N/A'}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cột phải: Khung xem chi tiết hồ sơ & chứng chỉ đối chứng */}
                <div>
                  {selectedTutorProfile ? (
                    <div className="card-feature animate-fade-in" style={{ marginBottom: 0, border: '1px solid var(--accent-pink)', background: 'rgba(236, 72, 153, 0.02)', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ textAlign: 'left' }}>
                          <h3 className="heading-3" style={{ color: 'var(--accent-pink)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Award size={20} /> Đối chiếu & Thẩm định chuyên môn
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Thẩm định kỹ bằng cấp chứng chỉ của <strong>{selectedTutorProfile.fullName}</strong>.</span>
                        </div>
                        <button className="btn btn-secondary" onClick={() => { setSelectedTutorProfile(null); setShowRejectBox(false); setRejectReasonInput(''); }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Đóng lại</button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                        {/* Cột trái chi tiết: Thông tin cơ bản */}
                        <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                          <h4 style={{ color: 'var(--accent-pink)', margin: '0 0 0.75rem 0', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.35rem' }}>Thông tin cơ bản</h4>
                          <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Email:</td><td style={{ padding: '0.4rem 0', fontWeight: 'bold' }}>{selectedTutorProfile.email}</td></tr>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Số điện thoại:</td><td style={{ padding: '0.4rem 0', fontWeight: 'bold' }}>{selectedTutorProfile.phone || 'Chưa cập nhật'}</td></tr>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Ngày sinh:</td><td style={{ padding: '0.4rem 0' }}>{selectedTutorProfile.dob || 'Chưa cập nhật'}</td></tr>
                              <tr><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>CCCD đối chiếu:</td><td style={{ padding: '0.4rem 0', fontWeight: 'bold', color: 'var(--accent-pink)' }}>{selectedTutorProfile.citizenCard || 'Chưa cập nhật'}</td></tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Cột phải chi tiết: Chuyên môn */}
                        <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                          <h4 style={{ color: 'var(--accent-pink)', margin: '0 0 0.75rem 0', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.35rem' }}>Hồ sơ năng lực</h4>
                          <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Trường đào tạo:</td><td style={{ padding: '0.4rem 0', fontWeight: 'bold' }}>{selectedTutorProfile.university || 'Chưa cập nhật'}</td></tr>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Trình độ:</td><td style={{ padding: '0.4rem 0', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{selectedTutorProfile.qualifications}</td></tr>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Môn đăng ký dạy:</td><td style={{ padding: '0.4rem 0', fontWeight: 'bold' }}>{selectedTutorProfile.subjects}</td></tr>
                              <tr><td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Thù lao yêu cầu:</td><td style={{ padding: '0.4rem 0', fontWeight: 'bold', color: 'var(--success)' }}>{selectedTutorProfile.hourlyRate?.toLocaleString('vi-VN')} đ/buổi ({selectedTutorProfile.duration || '90 phút'})</td></tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Mục kinh nghiệm & Triết lý dạy học */}
                        <div style={{ gridColumn: '1 / -1', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                          <h4 style={{ color: 'var(--accent-pink)', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Kinh nghiệm & Giới thiệu bản thân</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                            {selectedTutorProfile.experience || 'Chưa có thông tin tự bạch.'}
                          </p>
                        </div>

                        {/* Tệp tin bằng cấp chứng chỉ đính kèm */}
                        <div style={{ gridColumn: '1 / -1' }}>
                          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>Tài liệu bằng cấp đính kèm (Cloudinary):</h4>
                          {(!selectedTutorProfile.certificates || JSON.parse(selectedTutorProfile.certificates || '[]').length === 0) ? (
                            <div style={{ padding: '1.5rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }}>
                              ⚠️ Gia sư này chưa đính kèm tài liệu bằng cấp nào lên đám mây.
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                              {JSON.parse(selectedTutorProfile.certificates || '[]').map(cert => (
                                <div key={cert.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.01)' }}>
                                  <div style={{ color: 'var(--accent-pink)', background: 'rgba(236,72,153,0.05)', padding: '0.4rem', borderRadius: '4px' }}>
                                    {cert.type && cert.type.includes('pdf') ? <BookOpen size={16} /> : <Award size={16} />}
                                  </div>
                                  <div style={{ overflow: 'hidden', textAlign: 'left', flexGrow: 1 }}>
                                    <strong style={{ display: 'block', fontSize: '0.8rem', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={cert.name}>{cert.name}</strong>
                                    <a 
                                      href={cert.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      style={{ fontSize: '0.7rem', color: 'var(--accent-pink)', textDecoration: 'none', display: 'inline-block', marginTop: '1px' }}
                                    >
                                      Mở tài liệu ↗
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Nút hành động phê duyệt */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                        {!showRejectBox ? (
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                              onClick={() => handleApproveTutorProfile(selectedTutorProfile.id, selectedTutorProfile.email)}
                              className="btn btn-primary"
                              style={{
                                flex: 1,
                                padding: '0.7rem',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                backgroundColor: 'var(--success)',
                                borderColor: 'var(--success)',
                                color: '#fff'
                              }}
                              disabled={loading}
                            >
                              ✓ PHÊ DUYỆT HỒ SƠ
                            </button>
                            <button
                              onClick={() => setShowRejectBox(true)}
                              className="btn btn-secondary"
                              style={{
                                flex: 1,
                                padding: '0.7rem',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                borderColor: '#ef4444',
                                color: '#ef4444',
                                background: 'transparent'
                              }}
                              disabled={loading}
                            >
                              ✗ TỪ CHỐI DUYỆT
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <label style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 'bold', display: 'block', textAlign: 'left' }}>Lý do từ chối phê duyệt:</label>
                            <textarea
                              rows="2"
                              className="form-input"
                              placeholder="Mô tả lý do từ chối cụ thể (ví dụ: Bản chụp CCCD bị mờ, chứng chỉ bị cắt góc...)..."
                              value={rejectReasonInput}
                              onChange={e => setRejectReasonInput(e.target.value)}
                              style={{ width: '100%', fontSize: '0.85rem' }}
                              required
                            />
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => handleRejectTutorProfile(selectedTutorProfile.id, selectedTutorProfile.email)}
                                className="btn btn-primary btn-sm"
                                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff', padding: '0.35rem 1rem', fontSize: '0.8rem' }}
                                disabled={loading}
                              >
                                Xác nhận từ chối
                              </button>
                              <button
                                type="button"
                                onClick={() => { setShowRejectBox(false); setRejectReasonInput(''); }}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.35rem 1rem', fontSize: '0.8rem' }}
                                disabled={loading}
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '6rem 2rem', color: 'var(--text-secondary)', textAlign: 'center', background: 'rgba(255,255,255,0.005)' }}>
                      <Shield size={48} style={{ color: 'var(--text-secondary)', opacity: 0.3, marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Chưa có hồ sơ kiểm duyệt nào được chọn</strong>
                      Vui lòng nhấp chọn một thẻ gia sư từ danh sách chờ duyệt ở cột bên trái để bắt đầu thẩm định chuyên môn.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. VÍ TIỀN TOÀN SÀN PANEL ==================== */}
          {activePanel === 'payment' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ marginBottom: '2rem' }}>
                <h1 className="heading-2">Giám sát ví tiền & Sổ cái giao dịch 💸</h1>
                <p className="body-md text-slate">Bảng theo dõi tổng quan các tài khoản ví, giao dịch nạp/rút và dòng tiền Escrow toàn sàn.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', flexWrap: 'wrap' }}>
                
                {/* Left columns */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Balance Display */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="dash-stat-card" style={{ background: 'rgba(236,72,153,0.03)', border: '1px solid rgba(236,72,153,0.2)' }}>
                      <span className="body-sm" style={{ color: 'var(--accent-pink)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>DOANH THU HOA HỒNG (30%)</span>
                      <strong style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                        {(activeClasses.reduce((sum, c) => sum + (c.hourlyRate * c.totalLessons * 0.3), 0)).toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                    <div className="dash-stat-card" style={{ background: 'rgba(102, 252, 241, 0.03)', border: '1px solid rgba(102, 252, 241, 0.2)' }}>
                      <span className="body-sm" style={{ color: 'var(--accent-cyan)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>TIỀN ĐANG ĐÓNG BĂNG (ESCROW)</span>
                      <strong style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                        {(activeClasses.reduce((sum, c) => sum + (c.hourlyRate * c.totalLessons), 0)).toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                  </div>

                  {/* Platform Transaction Logs */}
                  <div className="card-feature" style={{ marginBottom: 0 }}>
                    <h3 className="heading-3" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Lịch sử nhật ký giao dịch toàn sàn</h3>
                    <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '0.75rem' }}>Mã ví</th>
                            <th style={{ padding: '0.75rem' }}>Loại giao dịch</th>
                            <th style={{ padding: '0.75rem' }}>Số tiền</th>
                            <th style={{ padding: '0.75rem' }}>Trạng thái</th>
                            <th style={{ padding: '0.75rem' }}>Mô tả chi tiết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa phát sinh giao dịch nào trên toàn sàn.</td></tr>
                          ) : transactions.map(tx => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem', color: 'var(--accent-pink)' }}>#{tx.walletId}</td>
                              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                                <span style={{ color: tx.type === 'DEPOSIT' || tx.type === 'UNLOCK' ? 'var(--success)' : 'var(--accent-pink)' }}>{tx.type}</span>
                              </td>
                              <td style={{ padding: '0.75rem' }}>{tx.amount.toLocaleString('vi-VN')} đ</td>
                              <td style={{ padding: '0.75rem' }}>
                                <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{tx.status}</span>
                              </td>
                              <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{tx.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Right columns */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="card-feature" style={{ height: '100%', marginBottom: 0 }}>
                    <h3 className="heading-3" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Bảng theo dõi Escrow lớp học</h3>
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '0.6rem' }}>Mã HS</th>
                            <th style={{ padding: '0.6rem' }}>Môn học</th>
                            <th style={{ padding: '0.6rem' }}>Học phí</th>
                            <th style={{ padding: '0.6rem' }}>Escrow</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classes.map((cls, idx) => (
                            <tr key={cls.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.6rem', fontWeight: 'bold' }}>#{cls.studentId}</td>
                              <td style={{ padding: '0.6rem' }}>{cls.title.split(' ')[0]}</td>
                              <td style={{ padding: '0.6rem' }}>{(cls.hourlyRate * cls.totalLessons).toLocaleString('vi-VN')}đ</td>
                              <td style={{ padding: '0.6rem' }}>
                                <span className={`badge-tag-${cls.status === 'ACTIVATED' ? 'green' : 'orange'}`} style={{ fontSize: '0.68rem' }}>
                                  {cls.status === 'ACTIVATED' ? 'Hoạt động' : 'Chờ TT'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================== 5. HỖ TRỢ & KHIẾU NẠI PANEL ==================== */}
          {activePanel === 'support' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ marginBottom: '2rem' }}>
                <h1 className="heading-2">Hộp thư giải quyết khiếu nại của Học viên</h1>
                <p className="body-md text-slate">Xem danh sách các yêu cầu khiếu nại, hỗ trợ dòng tiền và trợ giúp kỹ thuật.</p>
              </div>

              <div className="card-feature">
                <h3 className="heading-3" style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}>Các khiếu nại của Học viên</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {supportTickets.map(ticket => (
                    <div key={ticket.id} className="testimonial-card" style={{ border: ticket.status === 'PENDING' ? '1px solid var(--accent-pink)' : '1px solid var(--border-color)', opacity: ticket.status === 'RESOLVED' ? 0.65 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge ${ticket.status === 'PENDING' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                          {ticket.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-pink)' }}>Loại: {ticket.type}</span>
                      </div>
                      <p className="body-sm text-steel" style={{ textAlign: 'left', margin: '0.5rem 0' }}>{ticket.content}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tham chiếu lớp học: <strong>{ticket.classTitle}</strong></span>
                        {ticket.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {ticket.lessonId ? (
                              <>
                                <button 
                                  onClick={() => handleResolveTicket(ticket.id, ticket.lessonId, 'REFUND')} 
                                  className="btn btn-secondary btn-sm" 
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }}
                                >
                                  Hoàn học phí Học viên
                                </button>
                                <button 
                                  onClick={() => handleResolveTicket(ticket.id, ticket.lessonId, 'PAY_TUTOR')} 
                                  className="btn btn-secondary btn-sm" 
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                                >
                                  Giải ngân Gia sư
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => handleResolveTicket(ticket.id)} 
                                className="btn btn-secondary btn-sm" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent-pink)' }}
                              >
                                Giải quyết khiếu nại (Hoàn phí)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 6. TÀI KHOẢN ADMIN PANEL ==================== */}
          {activePanel === 'account' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ marginBottom: '2rem' }}>
                <h1 className="heading-2">Cập nhật tài khoản Admin</h1>
                <p className="body-md text-slate">Quản lý cấu hình tài khoản và đổi mật khẩu bảo mật Admin tối cao.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', flexWrap: 'wrap' }}>
                
                {/* Left Form */}
                <div className="card-feature" style={{ marginBottom: 0 }}>
                  <h3 className="heading-3" style={{ fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                    Thông tin tài khoản Quản trị viên
                  </h3>
                  <form onSubmit={(e) => { e.preventDefault(); setSuccess("Cập nhật thông tin Admin thành công!"); }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Địa chỉ Email (Cố định)</label>
                        <input type="text" className="form-input" value={user.email} disabled style={{ opacity: 0.55, cursor: 'not-allowed' }} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Quyền hạn tài khoản</label>
                        <input type="text" className="form-input" value="Quản trị viên (ROOT)" disabled style={{ opacity: 0.55, cursor: 'not-allowed' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Họ tên đầy đủ</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={profileForm.fullName} 
                          onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} 
                          required 
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Số điện thoại liên lạc</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={profileForm.phone} 
                          onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.65rem' }}>
                      Lưu thay đổi thông tin Admin
                    </button>
                  </form>
                </div>

                {/* Right Form: Change Password */}
                <div className="card-feature" style={{ marginBottom: 0 }}>
                  <h3 className="heading-3" style={{ fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                    Đổi mật khẩu tài khoản Admin
                  </h3>
                  <form onSubmit={handleUpdatePassword}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Mật khẩu hiện tại</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={passwordForm.oldPassword}
                        onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Mật khẩu mới</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Nhập lại mật khẩu mới</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        required 
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary w-100" style={{ borderColor: 'rgba(236,72,153,0.3)', color: 'var(--text-primary)', padding: '0.65rem' }}>
                      Đổi mật khẩu bảo mật
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
