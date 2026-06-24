import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
  LogOut, Wallet as WalletIcon, CreditCard, Shield, PlusCircle,
  Calendar, CheckCircle, RefreshCw, Send, DollarSign, Layers,
  Grid, Book, Users, Star, Headphones, User, Menu, X, Clock,
  Plus, Award, BookOpen, AlertCircle, ShoppingCart
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, frozenBalance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classApplications, setClassApplications] = useState({});
  const [selectedClass, setSelectedClass] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('overview');
  const [profileSubTab, setProfileSubTab] = useState('view');
  const [cartOpen, setCartOpen] = useState(false);

  // States for Wallet actions
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [revenue, setRevenue] = useState(0);

  // States for Class creation
  const [newClass, setNewClass] = useState({
    title: '',
    description: '',
    subject: '',
    gradeLevel: '',
    studentGender: 'ANY',
    studentDetails: '',
    tutorRequirements: '',
    learningMode: 'ONLINE',
    address: '',
    hourlyRate: 150000,
    totalLessons: 10,
    scheduleConfig: ''
  });

  const [scheduleItems, setScheduleItems] = useState([
    { dayOfWeek: 2, startTime: "19:00", endTime: "21:00" },
    { dayOfWeek: 4, startTime: "19:00", endTime: "21:00" }
  ]);

  useEffect(() => {
    setNewClass(prev => ({
      ...prev,
      scheduleConfig: JSON.stringify(scheduleItems, null, 2)
    }));
  }, [scheduleItems]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // States for Account Management
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    dob: '',
    grade: '',
    learningGoals: '',
    school: '',
    qualifications: '',
    experience: '',
    hourlyRate: 0,
    subjects: '',
    citizenCard: '',
    university: '',
    duration: '90 phút',
    certificates: '[]',
    status: 'NOT_SUBMITTED',
    rejectReason: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // 1. Kiểm tra đăng nhập
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role === 'ADMIN') {
      navigate('/admin'); // Nếu là admin, tự động chuyển hướng sang route riêng
      return;
    }
    setUser(parsedUser);

    // 2. Tải dữ liệu ban đầu
    fetchData(parsedUser);
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfileForm({
        fullName: res.data.fullName || '',
        phone: res.data.phone || '',
        dob: res.data.dob || '',
        grade: res.data.grade || '',
        learningGoals: res.data.learningGoals || '',
        school: res.data.school || '',
        qualifications: res.data.qualifications || 'Sinh viên',
        experience: res.data.experience || '',
        hourlyRate: res.data.hourlyRate || 0,
        subjects: res.data.subjects || '',
        citizenCard: res.data.citizenCard || '',
        university: res.data.university || '',
        duration: res.data.duration || '90 phút',
        certificates: res.data.certificates || '[]',
        status: res.data.status || 'NOT_SUBMITTED',
        rejectReason: res.data.rejectReason || ''
      });
      if (res.data.isVerified !== undefined) {
        setUser(prev => {
          const updated = { ...prev, isVerified: res.data.isVerified };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error('Không thể tải hồ sơ chi tiết', err);
    }
  };

  const fetchData = async (currentUser) => {
    try {
      setError('');
      setLoading(true);

      // Load Wallet
      const walletRes = await api.get('/wallet');
      setWallet(walletRes.data);

      // Load Transactions
      const txRes = await api.get('/wallet/transactions');
      setTransactions(txRes.data);

      // Load Classes
      const classesRes = await api.get('/class');
      setClasses(classesRes.data);

      // Tải tất cả lịch học của các lớp đã kích hoạt
      fetchAllLessons(classesRes.data);

      const activeUser = currentUser || user;
      if (activeUser && activeUser.role === 'STUDENT') {
        const findingTutorClasses = classesRes.data.filter(c => c.status === 'FINDING_TUTOR');
        const appsMap = {};
        for (const cls of findingTutorClasses) {
          try {
            const appsRes = await api.get(`/class/${cls.id}/applications`);
            appsMap[cls.id] = appsRes.data;
          } catch (e) {
            console.error(`Không thể tải ứng viên cho lớp ${cls.id}`, e);
          }
        }
        setClassApplications(appsMap);
      } else if (activeUser && activeUser.role === 'TUTOR') {
        try {
          const revRes = await api.get('/wallet/tutor/revenue');
          setRevenue(revRes.data.revenue || 0);
        } catch (e) {
          console.error('Không thể lấy doanh thu gia sư', e);
        }
      }

    } catch (err) {
      console.error(err);
      setError('Lỗi khi đồng bộ dữ liệu với máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTutor = async (applicationId) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const res = await api.post(`/class/applications/${applicationId}/accept`);
      setSuccess('Đã chốt chọn Gia sư thành công! Hệ thống đang tự động chuyển hướng bạn tới trang thanh toán bảo chứng Escrow.');
      
      // Lấy id lớp và tự động chuyển hướng đến trang thanh toán
      const classId = res.data.id;
      navigate(`/checkout/${classId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Chốt gia sư thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // Tải lịch học tổng hợp từ CSDL cho các lớp đã kích hoạt (ACTIVATED)
  const fetchAllLessons = async (classList) => {
    try {
      let allLessons = [];
      const activeClasses = classList.filter(c => c.status === 'ACTIVATED');

      for (const cls of activeClasses) {
        try {
          const res = await api.get(`/class/${cls.id}/lessons`);
          const lessonsWithTitle = res.data.map(les => ({
            ...les,
            classTitle: cls.title
          }));
          allLessons = [...allLessons, ...lessonsWithTitle];
        } catch (e) {
          console.error(`Không thể tải lịch học cho lớp ID ${cls.id}`, e);
        }
      }
      setLessons(allLessons);
    } catch (err) {
      console.error('Lỗi khi đồng bộ lịch học tổng hợp', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Lỗi khi đăng xuất API', e);
    }
    localStorage.clear();
    navigate('/login');
  };

  // CẬP NHẬT HỒ SƠ TÀI KHOẢN (STUDENT/TUTOR)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const res = await api.put('/auth/profile', profileForm);
      setSuccess('Cập nhật thông tin cá nhân và hồ sơ thành công!');

      // Đồng bộ lại thông tin cơ bản trong localStorage
      const updatedUser = {
        ...user,
        fullName: res.data.fullName,
        phone: res.data.phone
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Làm mới dữ liệu và tự động chuyển về tab Xem hồ sơ
      await fetchProfile();
      setProfileSubTab('view');

    } catch (err) {
      setError(err.response?.data?.error || 'Cập nhật tài khoản thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // THAY ĐỔI MẬT KHẨU TÀI KHOẢN
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
      setSuccess('Thay đổi mật khẩu tài khoản thành công!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Thay đổi mật khẩu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // NẠP TIỀN GIẢ LẬP
  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    try {
      setError('');
      await api.post(`/wallet/deposit?amount=${depositAmount}`);
      setSuccess(`Đã nạp giả lập ${parseFloat(depositAmount).toLocaleString('vi-VN')}đ thành công!`);
      setDepositAmount('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Nạp tiền thất bại!');
    }
  };

  // RÚT TIỀN GIẢ LẬP
  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    try {
      setError('');
      await api.post(`/wallet/withdraw?amount=${withdrawAmount}`);
      setSuccess(`Đã rút ${parseFloat(withdrawAmount).toLocaleString('vi-VN')}đ về tài khoản ngân hàng!`);
      setWithdrawAmount('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Rút tiền thất bại!');
    }
  };

  // TẠO LỚP HỌC MỚI (STUDENT hoặc TUTOR)
  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      setError('');
      // Giả lập gán thêm tutorId = 2 cho STUDENT để tiện test luồng thanh toán escrow, TUTOR gán null
      const payload = {
        ...newClass,
        tutorId: user.role === 'STUDENT' ? 2 : null
      };
      await api.post('/class', payload);
      setSuccess(user.role === 'STUDENT'
        ? 'Tạo yêu cầu lớp học thành công (Chờ Admin duyệt)!'
        : 'Mở lớp trực tuyến chiêu sinh học viên thành công (Chờ Admin duyệt)!'
      );
      setNewClass(prev => ({
        ...prev,
        title: '',
        description: ''
      }));
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Tạo lớp học thất bại!');
    }
  };

  // HỌC VIÊN THANH TOÁN (ESCROW) & RẢI LỊCH
  const handlePayClass = async (classId) => {
    try {
      setError('');
      setLoading(true);
      const res = await api.post(`/class/${classId}/pay`);
      setSuccess('Thanh toán thành công! Hệ thống đã đóng băng tiền học và rải lịch học tự động.');

      // Hiển thị các lesson vừa rải lịch
      setSelectedClass(res.data.class);
      setLessons(res.data.lessons);

      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Thanh toán chốt lớp thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // ==================== NGƯỜI 3: VẬN HÀNH PHÒNG HỌC & ĐÓNG BĂNG/GIẢI NGÂN/KHIẾU NẠI ====================

  // HÀNH ĐỘNG BẮT ĐẦU BUỔI HỌC (CHECK-IN)
  const handleStartLesson = async (lessonId, classId) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await api.post(`/class/lessons/${lessonId}/start`);
      
      // Chuyển hướng trực tiếp vào phòng học nhúng trên website của chúng ta!
      navigate(`/classroom/${classId}/${lessonId}`);
      
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Check-in buổi học thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // HÀNH ĐỘNG KẾT THÚC BUỔI HỌC (CHECK-OUT)
  const handleEndLesson = async (lessonId) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await api.post(`/class/lessons/${lessonId}/end`);
      setSuccess('Báo cáo kết thúc buổi dạy thành công! Đang chờ Học viên xác nhận nghiệm thu giải ngân.');
      
      // Load lại danh sách lessons
      if (selectedClass) {
        const res = await api.get(`/class/${selectedClass.id}/lessons`);
        setLessons(res.data);
      }
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Báo cáo kết thúc buổi học thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // HỌC VIÊN XÁC NHẬN HOÀN THÀNH BUỔI HỌC (GIẢI NGÂN)
  const handleConfirmLesson = async (lessonId) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await api.post(`/class/lessons/${lessonId}/confirm`);
      setSuccess('Xác nhận hoàn thành buổi học thành công! Tiền học đã được giải ngân sang Gia sư.');
      
      // Load lại danh sách lessons
      if (selectedClass) {
        const res = await api.get(`/class/${selectedClass.id}/lessons`);
        setLessons(res.data);
      }
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Xác nhận hoàn thành thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // HỌC VIÊN KHIẾU NẠI BUỔI HỌC
  const handleDisputeLesson = async (lessonId) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await api.post(`/class/lessons/${lessonId}/dispute`);
      setSuccess('Đã gửi khiếu nại buổi học này lên hệ thống! Admin sẽ can thiệp để xử lý và giải quyết dòng tiền.');
      
      // Load lại danh sách lessons
      if (selectedClass) {
        const res = await api.get(`/class/${selectedClass.id}/lessons`);
        setLessons(res.data);
      }
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Gửi khiếu nại thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // States for certificate upload
  const [certFile, setCertFile] = useState(null);
  const [certName, setCertName] = useState('');
  const [uploadingCert, setUploadingCert] = useState(false);

  // XỬ LÝ TẢI LÊN CHỨNG CHỈ (CLOUDINARY)
  const handleUploadCertificate = async (e) => {
    e.preventDefault();
    if (!certFile) {
      setError('Vui lòng chọn tệp hình ảnh hoặc PDF chứng chỉ trước khi tải lên!');
      return;
    }
    if (!certName.trim()) {
      setError('Vui lòng nhập tên hoặc tiêu đề cho chứng chỉ này!');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setUploadingCert(true);

      const formData = new FormData();
      formData.append('file', certFile);

      // 1. Tải file lên Cloudinary thông qua backend
      const uploadRes = await api.post('/upload/certificate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { url, type } = uploadRes.data;

      // 2. Cập nhật chuỗi JSON lưu trữ danh sách chứng chỉ
      const currentCerts = JSON.parse(profileForm.certificates || '[]');
      const newCert = {
        id: Date.now().toString(),
        name: certName.trim(),
        url: url,
        type: type
      };
      const updatedCerts = [...currentCerts, newCert];
      const updatedCertsStr = JSON.stringify(updatedCerts);

      // 3. Tự động cập nhật hồ sơ vào cơ sở dữ liệu
      const updatedProfileForm = {
        ...profileForm,
        certificates: updatedCertsStr
      };

      await api.put('/auth/profile', updatedProfileForm);

      setProfileForm(updatedProfileForm);
      setSuccess(`Tải lên và lưu thành công chứng chỉ chuyên môn "${certName}"!`);
      setCertFile(null);
      setCertName('');

      const fileInput = document.getElementById('cert-file-input');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Tải lên chứng chỉ lên hệ thống thất bại!');
    } finally {
      setUploadingCert(false);
    }
  };

  // XỬ LÝ XÓA CHỨNG CHỈ KHỎI HỒ SƠ
  const handleDeleteCertificate = async (certId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chứng chỉ chuyên môn này khỏi hồ sơ cá nhân?')) return;

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const currentCerts = JSON.parse(profileForm.certificates || '[]');
      const updatedCerts = currentCerts.filter(c => c.id !== certId);
      const updatedCertsStr = JSON.stringify(updatedCerts);

      const updatedProfileForm = {
        ...profileForm,
        certificates: updatedCertsStr
      };

      await api.put('/auth/profile', updatedProfileForm);

      setProfileForm(updatedProfileForm);
      setSuccess('Đã loại bỏ chứng chỉ chuyên môn thành công!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Lỗi khi gỡ bỏ chứng chỉ!');
    } finally {
      setLoading(false);
    }
  };

  // GỬI YÊU CẦU PHÊ DUYỆT HỒ SƠ LÊN BAN QUẢN TRỊ
  const handleSubmitReview = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const res = await api.post('/auth/tutor/submit-review');
      setSuccess(res.data.message || 'Đã gửi hồ sơ gia sư chờ phê duyệt chuyên môn thành công!');
      
      // Tải lại hồ sơ để hiển thị trạng thái PENDING
      await fetchProfile();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Gửi yêu cầu duyệt hồ sơ chuyên môn thất bại!');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;


  // Lọc dữ liệu lớp học
  const activeClasses = classes.filter(c => c.status === 'ACTIVATED');

  // Phân bổ lịch học theo ngày trong tuần (T2 - CN)
  const lessonsByDay = {
    1: [], // T2
    2: [], // T3
    3: [], // T4
    4: [], // T5
    5: [], // T6
    6: [], // T7
    0: []  // CN
  };
  lessons.forEach(les => {
    const day = new Date(les.startTime).getDay();
    if (lessonsByDay[day] !== undefined) {
      lessonsByDay[day].push(les);
    }
  });

  // Sắp xếp các buổi học trong ngày theo giờ bắt đầu
  Object.keys(lessonsByDay).forEach(day => {
    lessonsByDay[day].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top Navbar */}
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-brand-ghost d-lg-none" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link className="navbar-brand fw-bold" to="/" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <Award size={26} style={{ color: 'var(--accent-cyan)' }} />
            Giasu<span style={{ color: 'var(--accent-cyan)' }}>Home</span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Biểu tượng Giỏ Hàng Học Tập cho STUDENT */}
          {user && user.role === 'STUDENT' && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setCartOpen(!cartOpen)}
                className="btn-brand-ghost" 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer', 
                  padding: '0.4rem', 
                  display: 'flex', 
                  alignItems: 'center',
                  borderRadius: '50%',
                  transition: 'background 0.2s',
                  position: 'relative'
                }}
                title="Giỏ hàng lớp học chờ thanh toán"
              >
                <ShoppingCart size={22} style={{ color: 'var(--text-primary)' }} />
                {classes.filter(cls => cls.status === 'WAITING_PAYMENT').length > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '-2px', 
                    right: '-2px', 
                    background: 'red', 
                    color: '#fff', 
                    fontSize: '0.68rem', 
                    fontWeight: 'bold', 
                    borderRadius: '50%', 
                    width: '16px', 
                    height: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 0 6px red'
                  }}>
                    {classes.filter(cls => cls.status === 'WAITING_PAYMENT').length}
                  </span>
                )}
              </button>

              {/* Dropdown Giỏ Hàng Học Tập Cao Cấp */}
              {cartOpen && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  marginTop: '0.75rem', 
                  width: '320px', 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)', 
                  padding: '1rem', 
                  zIndex: 200, 
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>🛒 Lớp học chờ thanh toán</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {classes.filter(cls => cls.status === 'WAITING_PAYMENT').length} khóa học
                    </span>
                  </div>

                  {classes.filter(cls => cls.status === 'WAITING_PAYMENT').length === 0 ? (
                    <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      Giỏ hàng học tập trống. Bạn không có lớp học nào đang chờ thanh toán bảo chứng.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto' }}>
                      {classes.filter(cls => cls.status === 'WAITING_PAYMENT').map(cls => (
                        <div key={cls.id} style={{ padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={cls.title}>{cls.title}</strong>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            <span>Số buổi: {cls.totalLessons}</span>
                            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{(cls.hourlyRate * cls.totalLessons).toLocaleString('vi-VN')} đ</span>
                          </div>
                          <button 
                            onClick={() => {
                              setCartOpen(false);
                              navigate(`/checkout/${cls.id}`);
                            }}
                            className="btn btn-primary btn-sm" 
                            style={{ padding: '0.25rem', fontSize: '0.72rem', marginTop: '0.25rem', width: '100%', textTransform: 'none', letterSpacing: 0 }}
                          >
                            Thanh toán ngay
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="sidebar-avatar" style={{ width: '38px', height: '38px', fontSize: '1.1rem' }}>
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={18} />}
            </div>
            <div className="d-none d-md-block" style={{ textAlign: 'left' }}>
              <div className="body-sm-medium" style={{ color: 'var(--text-primary)' }}>{user.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.role === 'STUDENT' ? 'Học viên' : 'Gia sư'}</div>
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
              <div className="sidebar-avatar">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={22} />}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div className="body-md-medium" style={{ color: 'var(--text-primary)' }}>{user.fullName}</div>
                <div className="body-sm text-steel" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {user.role === 'STUDENT' ? 'Học viên' : 'Gia sư'}
                  {user.role === 'TUTOR' && <span className="badge badge-cyan" style={{ fontSize: '7px', padding: '1px 4px' }}>Đã duyệt</span>}
                </div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <a
              className={`sidebar-link ${activePanel === 'overview' ? 'active' : ''}`}
              onClick={() => { setActivePanel('overview'); setSidebarOpen(false); }}
            >
              <Grid size={18} /> Tổng quan
            </a>

            {user.role === 'STUDENT' ? (
              <>
                <a
                  className={`sidebar-link ${activePanel === 'classes' ? 'active' : ''}`}
                  onClick={() => { setActivePanel('classes'); setSidebarOpen(false); }}
                >
                  <Book size={18} /> Lớp học của tôi
                </a>
                <a
                  className={`sidebar-link ${activePanel === 'schedule' ? 'active' : ''}`}
                  onClick={() => { setActivePanel('schedule'); setSidebarOpen(false); }}
                >
                  <Calendar size={18} /> Thời khóa biểu
                </a>
                <a
                  className={`sidebar-link ${activePanel === 'tutors' ? 'active' : ''}`}
                  onClick={() => { setActivePanel('tutors'); setSidebarOpen(false); }}
                >
                  <Users size={18} /> Gia sư của tôi
                </a>
                <a
                  className={`sidebar-link ${activePanel === 'payment' ? 'active' : ''}`}
                  onClick={() => { setActivePanel('payment'); setSidebarOpen(false); }}
                >
                  <WalletIcon size={18} /> Thanh toán
                </a>
              </>
            ) : (
              <>
                <a
                  className={`sidebar-link ${activePanel === 'account' ? 'active' : ''}`}
                  onClick={() => { setActivePanel('account'); setSidebarOpen(false); }}
                >
                  <User size={18} /> Hồ sơ của tôi
                </a>
                <a
                  className={`sidebar-link ${activePanel === 'applications' ? 'active' : ''}`}
                  onClick={() => { setActivePanel('applications'); setSidebarOpen(false); }}
                >
                  <Send size={18} /> Ứng tuyển
                </a>
                <a
                  className={`sidebar-link ${activePanel === 'classes' ? 'active' : ''}`}
                  onClick={() => { setActivePanel('classes'); setSidebarOpen(false); }}
                >
                  <Book size={18} /> Lớp đang dạy
                </a>
                <a
                  className={`sidebar-link ${activePanel === 'payment' ? 'active' : ''}`}
                  onClick={() => { setActivePanel('payment'); setSidebarOpen(false); }}
                >
                  <WalletIcon size={18} /> Doanh thu
                </a>
              </>
            )}

            <a
              className={`sidebar-link ${activePanel === 'reviews' ? 'active' : ''}`}
              onClick={() => { setActivePanel('reviews'); setSidebarOpen(false); }}
            >
              <Star size={18} /> Đánh giá
            </a>

            <a
              className={`sidebar-link ${activePanel === 'support' ? 'active' : ''}`}
              onClick={() => { setActivePanel('support'); setSidebarOpen(false); }}
            >
              <Headphones size={18} /> Hỗ trợ
            </a>

            {user.role === 'STUDENT' && (
              <a
                className={`sidebar-link ${activePanel === 'account' ? 'active' : ''}`}
                onClick={() => { setActivePanel('account'); setSidebarOpen(false); }}
                style={{ borderTop: '1px solid var(--border-color)', borderRadius: 0, paddingTop: '1rem', marginTop: '1rem' }}
              >
                <User size={18} /> Tài khoản cá nhân
              </a>
            )}

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
            {user.role === 'TUTOR' && (
              <div style={{ marginBottom: '1.5rem' }}>
                {profileForm.status === 'NOT_SUBMITTED' && (
                  <div className="badge badge-warning" style={{ width: '100%', padding: '1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', textTransform: 'none', textAlign: 'left', lineHeight: '1.5', background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px', color: '#fbbf24' }} />
                    <div style={{ color: '#fbbf24' }}>
                      <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>Hồ sơ Gia sư chưa gửi duyệt!</strong>
                      Tài khoản của bạn mới được tạo và đang ở chế độ nháp. Vui lòng vào phần <strong>Hồ sơ của tôi</strong> bên dưới để hoàn tất thông tin cá nhân, CCCD, thù lao, kinh nghiệm và tải lên chứng chỉ chuyên môn, sau đó bấm <strong>"Gửi Yêu Cầu Duyệt Hồ Sơ"</strong> để chính thức hoạt động trên hệ thống.
                    </div>
                  </div>
                )}
                {profileForm.status === 'PENDING' && (
                  <div className="badge badge-warning" style={{ width: '100%', padding: '1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', textTransform: 'none', textAlign: 'left', lineHeight: '1.5', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)' }}>
                    <Clock size={22} style={{ flexShrink: 0, marginTop: '2px', color: '#fb923c' }} />
                    <div style={{ color: '#fb923c' }}>
                      <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>Hồ sơ Gia sư đang chờ Admin kiểm duyệt chuyên môn!</strong>
                      Chúng tôi đã tiếp nhận hồ sơ cùng các chứng chỉ đính kèm của bạn. Quá trình đối chiếu và phê duyệt chuyên môn sẽ diễn ra trong vòng 12-24 giờ làm việc. Bạn sẽ nhận được thông báo khi trạng thái thay đổi.
                    </div>
                  </div>
                )}
                {profileForm.status === 'APPROVED' && (
                  <div className="badge badge-success" style={{ width: '100%', padding: '1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', textTransform: 'none', textAlign: 'left', lineHeight: '1.5', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <CheckCircle size={22} style={{ flexShrink: 0, marginTop: '2px', color: '#34d399' }} />
                    <div style={{ color: '#34d399' }}>
                      <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>Hồ sơ Gia sư đã được phê duyệt chính thức!</strong>
                      Tài khoản của bạn đã được xác minh chuyên môn hoàn tất. Hiện tại bạn đã có đầy đủ quyền lợi để mở lớp trực tuyến chiêu sinh và tham gia ứng tuyển nhận lớp học từ học viên.
                    </div>
                  </div>
                )}
                {profileForm.status === 'REJECTED' && (
                  <div className="badge badge-danger" style={{ width: '100%', padding: '1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', textTransform: 'none', textAlign: 'left', lineHeight: '1.5', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
                    <div style={{ color: '#f87171' }}>
                      <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>Yêu cầu phê duyệt hồ sơ chuyên môn bị từ chối!</strong>
                      Lý do từ chối: <strong style={{ color: '#fff', textDecoration: 'underline' }}>{profileForm.rejectReason || 'Không có lý do cụ thể'}</strong>. 
                      <br />
                      Vui lòng cập nhật lại thông tin hồ sơ hoặc thay thế các chứng chỉ bị mờ/lỗi bên dưới, hệ thống sẽ tự động cho phép bạn gửi yêu cầu xét duyệt lại sau khi chỉnh sửa.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DYNAMIC RENDERING OF PANELS */}

          {/* 1. TỔNG QUAN PANEL */}
          {activePanel === 'overview' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 className="heading-2">Xin chào, {user.fullName} 👋</h1>
                  <p className="body-md text-slate">Chúc bạn một ngày {user.role === 'STUDENT' ? 'học tập' : 'dạy học'} hiệu quả và thành công.</p>
                </div>
                {user.role === 'STUDENT' ? (
                  <button onClick={() => setActivePanel('classes')} className="btn btn-primary">
                    <Plus size={16} /> Đăng lớp mới
                  </button>
                ) : (
                  <button onClick={() => setActivePanel('classes')} className="btn btn-primary">
                    <BookOpen size={16} /> Xem lớp đang dạy
                  </button>
                )}
              </div>

              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="dash-stat-card">
                  <div className="stat-icon purple mb-3"><Book size={20} /></div>
                  <div className="heading-3" style={{ fontSize: '1.8rem', margin: '0.25rem 0' }}>{activeClasses.length}</div>
                  <div className="body-sm text-slate">{user.role === 'STUDENT' ? 'Lớp đang học' : 'Lớp đang dạy'}</div>
                </div>
                <div className="dash-stat-card">
                  <div className="stat-icon green mb-3"><CheckCircle size={20} /></div>
                  <div className="heading-3" style={{ fontSize: '1.8rem', margin: '0.25rem 0' }}>{activeClasses.length * 6}</div>
                  <div className="body-sm text-slate">{user.role === 'STUDENT' ? 'Buổi đã học' : 'Buổi đã dạy'}</div>
                </div>
                <div className="dash-stat-card">
                  <div className="stat-icon orange mb-3"><Clock size={20} /></div>
                  <div className="heading-3" style={{ fontSize: '1.8rem', margin: '0.25rem 0' }}>{activeClasses.length * 2}</div>
                  <div className="body-sm text-slate">Buổi học tuần này</div>
                </div>
                <div className="dash-stat-card">
                  <div className="stat-icon blue mb-3"><DollarSign size={20} /></div>
                  <div className="heading-3" style={{ fontSize: '1.8rem', margin: '0.25rem 0' }}>
                    {user.role === 'STUDENT'
                      ? (activeClasses.reduce((sum, c) => sum + (c.hourlyRate * c.totalLessons), 0)).toLocaleString('vi-VN')
                      : (revenue).toLocaleString('vi-VN')
                    } đ
                  </div>
                  <div className="body-sm text-slate">{user.role === 'STUDENT' ? 'Đã chi trả' : 'Doanh thu thực tế'}</div>
                </div>
              </div>

              {/* Main Overview Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', flexWrap: 'wrap' }}>
                <div className="card-feature" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignSelf: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="heading-3" style={{ margin: 0 }}>Lịch học sắp tới</h2>
                    <a onClick={() => setActivePanel('schedule')} style={{ cursor: 'pointer', fontWeight: 600 }}>Xem tất cả</a>
                  </div>

                  {lessons.slice(0, 3).map((les, idx) => (
                    <div key={les.id || idx} className="dash-class-row">
                      <div className="class-avatar"><BookOpen size={18} /></div>
                      <div style={{ flexGrow: 1, textAlign: 'left' }}>
                        <div className="body-md-medium">{les.classTitle}</div>
                        <div className="body-sm text-slate">
                          Buổi #{les.lessonNumber} • {new Date(les.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(les.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className={idx === 0 ? 'badge-tag-green' : idx === 1 ? 'badge-tag-purple' : 'badge-tag-orange'}>
                        {new Date(les.startTime).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                      </span>
                    </div>
                  ))}

                  {lessons.length === 0 && (
                    <div style={{ padding: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      Chưa có lịch học sắp tới. Các lớp học hoạt động sau khi thanh toán sẽ hiển thị ở đây!
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="card-feature" style={{ marginBottom: 0 }}>
                    <h2 className="heading-3">Tiến độ học tập</h2>
                    {activeClasses.map((cls, idx) => (
                      <div key={cls.id || idx} style={{ marginBottom: '1rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span className="body-sm text-slate">{cls.title}</span>
                          <span className="body-sm-medium" style={{ color: 'var(--accent-cyan)' }}>60%</span>
                        </div>
                <div className="progress" style={{ height: '6px', background: 'rgba(141, 91, 76, 0.12)', borderRadius: '3px' }}>
                          <div className="progress-bar" style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                    ))}
                    {activeClasses.length === 0 && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Chưa có lớp học nào đang hoạt động để hiển thị tiến độ.</div>
                    )}
                  </div>

                  {user.role === 'STUDENT' ? (
                    <div className="card-feature-mint">
                      <h2 className="heading-3" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Bạn cần thêm gia sư?</h2>
                      <p className="body-sm text-slate" style={{ marginBottom: '1.25rem' }}>Đăng yêu cầu tìm gia sư mới nhanh chóng và hoàn toàn miễn phí.</p>
                      <button onClick={() => setActivePanel('classes')} className="btn btn-primary w-100" style={{ fontSize: '0.9rem' }}>
                        Đăng lớp ngay
                      </button>
                    </div>
                  ) : (
                    <div className="card-feature-mint">
                      <h2 className="heading-3" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Hoàn thiện hồ sơ của bạn</h2>
                      <p className="body-sm text-slate" style={{ marginBottom: '1.25rem' }}>Hồ sơ đầy đủ, chi tiết giúp bạn tăng cơ hội nhận lớp lên gấp 3 lần.</p>
                      <button onClick={() => setActivePanel('account')} className="btn btn-primary w-100" style={{ fontSize: '0.9rem' }}>
                        Cập nhật hồ sơ
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* 2. LỚP HỌC CỦA TÔI / LỚP ĐANG DẠY PANEL */}
          {activePanel === 'classes' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 className="heading-2">{user.role === 'STUDENT' ? 'Lớp học của tôi' : 'Lớp đang giảng dạy'}</h1>
                  <p className="body-md text-slate">
                    {user.role === 'STUDENT'
                      ? 'Danh sách các lớp học đã đăng, xem danh sách ứng tuyển của gia sư và theo dõi tiến độ các buổi học.'
                      : 'Danh sách các lớp học đang phụ trách giảng dạy và thực hiện check-in/check-out các buổi dạy.'
                    }
                  </p>
                </div>
                <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RefreshCw size={14} /> Làm mới danh sách
                </button>
              </div>

              {/* Form tạo lớp học mới cho STUDENT hoặc TUTOR */}
              {(user.role === 'STUDENT' || user.role === 'TUTOR') && (
                user.role === 'TUTOR' && !user.isVerified ? (
                  <div className="card-feature" style={{ border: '1px dashed var(--warning)', background: 'rgba(197, 137, 64, 0.03)', padding: '2rem', marginTop: '2rem', textAlign: 'center' }}>
                    <AlertCircle size={36} style={{ color: 'var(--warning)', marginBottom: '0.75rem' }} />
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Chức năng mở lớp đang bị tạm khóa</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                      Tài khoản gia sư của bạn chưa được duyệt chuyên môn bởi Ban quản trị. 
                      <br />
                      Vui lòng bổ sung đầy đủ thông tin chuyên môn trong tab <strong>Hồ sơ của tôi</strong> và đợi Admin phê duyệt để bắt đầu mở lớp chiêu sinh.
                    </p>
                  </div>
                ) : (
                  <div className="card-feature" style={{ border: '1px dashed var(--accent-cyan)', background: 'rgba(102,252,241,0.02)', padding: '1.5rem', marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <PlusCircle size={20} /> {user.role === 'STUDENT' ? 'Đăng lớp mới & Tuyển Gia sư' : 'Mở lớp trực tuyến mới & Chiêu sinh Học viên'}
                    </h3>
                    <form onSubmit={handleCreateClass}>
                    {/* Nhóm 1: Cơ bản */}
                    <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>1. Thông tin cơ bản</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Môn học</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ví dụ: Toán, Tiếng Anh..."
                            value={newClass.subject}
                            onChange={(e) => setNewClass(prev => ({ ...prev, subject: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Cấp lớp</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ví dụ: Lớp 10, Ôn thi Đại học..."
                            value={newClass.gradeLevel}
                            onChange={(e) => setNewClass(prev => ({ ...prev, gradeLevel: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>{user.role === 'STUDENT' ? 'Tiêu đề đăng tuyển' : 'Tên khóa học mở sẵn'}</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={user.role === 'STUDENT' ? "Ví dụ: Tìm gia sư Toán lớp 10 luyện thi HSG" : "Ví dụ: Lớp chuyên Lý 11 - Ôn thi HSG"}
                            value={newClass.title}
                            onChange={(e) => setNewClass(prev => ({ ...prev, title: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nhóm 2: Học viên */}
                    <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>2. Thông tin học viên</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Giới tính học viên</label>
                          <select
                            className="form-input"
                            value={newClass.studentGender}
                            onChange={(e) => setNewClass(prev => ({ ...prev, studentGender: e.target.value }))}
                          >
                            <option value="ANY">Không xác định</option>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Lực học / Đặc điểm học viên</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ví dụ: Mất gốc, cần kiên nhẫn, hoặc Đang học khá..."
                            value={newClass.studentDetails}
                            onChange={(e) => setNewClass(prev => ({ ...prev, studentDetails: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nhóm 3: Yêu cầu Gia sư (Chỉ hiển thị cho học sinh STUDENT mở tuyển gia sư) */}
                    {user.role === 'STUDENT' ? (
                      <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>3. Yêu cầu Gia sư & Ghi chú thêm</h4>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Yêu cầu đối với gia sư</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ví dụ: Chỉ nhận Giáo viên nữ, Sinh viên năm 3 trở lên..."
                            value={newClass.tutorRequirements}
                            onChange={(e) => setNewClass(prev => ({ ...prev, tutorRequirements: e.target.value }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, marginTop: '1rem' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Ghi chú / Mô tả chung</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ghi chú thêm nếu có..."
                            value={newClass.description}
                            onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Nhóm 3 đối với Gia sư (TUTOR) khi tự mở lớp chiêu sinh học viên */
                      <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>3. Mô tả khóa học & Ghi chú thêm</h4>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Mô tả lớp học / Ghi chú</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Mô tả nội dung khóa học, giáo trình dạy học, cam kết đầu ra..."
                            value={newClass.description}
                            onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}

                    {/* Nhóm 4: Học phí */}
                    <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>4. Học phí</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Học phí / Buổi (VNĐ)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={newClass.hourlyRate}
                            onChange={(e) => setNewClass(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) }))}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Số buổi học dự kiến</label>
                          <input
                            type="number"
                            className="form-input"
                            value={newClass.totalLessons}
                            onChange={(e) => setNewClass(prev => ({ ...prev, totalLessons: parseInt(e.target.value) }))}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nhóm 5: Lịch trình & Logistics */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>5. Lịch học & Địa điểm</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Hình thức học</label>
                          <select
                            className="form-input"
                            value={newClass.learningMode}
                            onChange={(e) => setNewClass(prev => ({ ...prev, learningMode: e.target.value }))}
                          >
                            <option value="ONLINE">Trực tuyến (Online)</option>
                            <option value="OFFLINE">Tận nơi (Offline)</option>
                          </select>
                        </div>
                        {newClass.learningMode === 'OFFLINE' && (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Địa chỉ học Offline</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Ví dụ: 123 Đường ABC, Quận X..."
                              value={newClass.address}
                              onChange={(e) => setNewClass(prev => ({ ...prev, address: e.target.value }))}
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* INTERACTIVE SCHEDULE PICKER COMPONENT */}
                    <div style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(102, 252, 241, 0.25)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Calendar size={16} /> Lựa chọn Lịch học Cố định (Thứ & Giờ)
                      </label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                        Nhấp chọn các ngày trong tuần học sinh muốn học, sau đó điều chỉnh giờ học tương ứng ở bên dưới.
                      </p>

                      {/* Day Toggles */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {[
                          { val: 1, label: "Thứ 2" },
                          { val: 2, label: "Thứ 3" },
                          { val: 3, label: "Thứ 4" },
                          { val: 4, label: "Thứ 5" },
                          { val: 5, label: "Thứ 6" },
                          { val: 6, label: "Thứ 7" },
                          { val: 7, label: "Chủ Nhật" }
                        ].map(day => {
                          const isActive = scheduleItems.some(item => item.dayOfWeek === day.val);
                          return (
                            <button
                              key={day.val}
                              type="button"
                              onClick={() => {
                                if (isActive) {
                                  setScheduleItems(prev => prev.filter(item => item.dayOfWeek !== day.val));
                                } else {
                                  setScheduleItems(prev => [...prev, { dayOfWeek: day.val, startTime: "19:00", endTime: "21:00" }].sort((a,b)=>a.dayOfWeek-b.dayOfWeek));
                                }
                              }}
                              className="btn"
                              style={{
                                padding: '0.4rem 1rem',
                                fontSize: '0.8rem',
                                textTransform: 'none',
                                letterSpacing: 0,
                                background: isActive ? 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)' : 'rgba(255,255,255,0.03)',
                                color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '6px'
                              }}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Days Configurations */}
                      {scheduleItems.length === 0 ? (
                        <div style={{ padding: '1.25rem', color: 'var(--accent-pink)', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(236,72,153,0.03)', borderRadius: '8px', border: '1px dashed rgba(236,72,153,0.15)' }}>
                          ⚠️ Vui lòng chọn ít nhất một ngày học trong tuần!
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {scheduleItems.map((item, idx) => (
                            <div 
                              key={item.dayOfWeek} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '1rem', 
                                background: 'rgba(255,255,255,0.02)', 
                                padding: '0.5rem 1rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border-color)', 
                                flexWrap: 'wrap'
                              }}
                            >
                              <strong style={{ color: 'var(--accent-blue)', minWidth: '80px', fontSize: '0.85rem' }}>
                                {item.dayOfWeek === 7 ? 'Chủ Nhật' : `Thứ ${item.dayOfWeek + 1}`}
                              </strong>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Từ:</span>
                                <input 
                                  type="time" 
                                  className="form-input" 
                                  style={{ padding: '0.35rem 0.65rem', width: 'auto', fontSize: '0.85rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }} 
                                  value={item.startTime} 
                                  onChange={(e) => {
                                    const newItems = [...scheduleItems];
                                    newItems[idx].startTime = e.target.value;
                                    setScheduleItems(newItems);
                                  }}
                                  required
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Đến:</span>
                                <input 
                                  type="time" 
                                  className="form-input" 
                                  style={{ padding: '0.35rem 0.65rem', width: 'auto', fontSize: '0.85rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }} 
                                  value={item.endTime} 
                                  onChange={(e) => {
                                    const newItems = [...scheduleItems];
                                    newItems[idx].endTime = e.target.value;
                                    setScheduleItems(newItems);
                                  }}
                                  required
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 2rem' }}>
                        {user.role === 'STUDENT' ? 'Đăng lớp yêu cầu' : 'Mở lớp chiêu sinh'}
                      </button>
                    </div>
                  </form>
                </div>
              )
            )}

              {/* Danh sách lớp học hiện tại */}
              <div className="card-feature">
                <h2 className="heading-3" style={{ marginBottom: '1.25rem' }}>Lớp học đang có trên hệ thống</h2>
                {classes.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Chưa ghi nhận lớp học nào.
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
                              Số buổi: <strong>{cls.totalLessons}</strong> | Thù lao: <strong>{cls.hourlyRate.toLocaleString('vi-VN')} đ/buổi</strong> | Tổng: <strong style={{ color: 'var(--accent-cyan)' }}>{(cls.hourlyRate * cls.totalLessons).toLocaleString('vi-VN')} đ</strong>
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem', textAlign: 'left' }}>
                              📍 Hình thức: <strong style={{ color: cls.learningMode === 'OFFLINE' ? 'var(--accent-pink)' : 'var(--accent-cyan)' }}>{cls.learningMode === 'OFFLINE' ? 'Offline (Tận nơi)' : 'Online (Trực tuyến)'}</strong>
                              {cls.learningMode === 'OFFLINE' && cls.address && (
                                <span> | 🏠 Địa điểm: <strong style={{ color: 'var(--text-primary)' }}>{cls.address}</strong></span>
                              )}
                            </span>
                            {cls.description && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>{cls.description}</p>}
                          </div>
                          <div>
                            <span className={`badge ${cls.status === 'ACTIVATED' ? 'badge-success' :
                                cls.status === 'WAITING_PAYMENT' ? 'badge-cyan' :
                                  cls.status === 'FINDING_TUTOR' ? 'badge-primary' :
                                    cls.status === 'FINDING_STUDENT' ? 'badge-primary' : 'badge-warning'
                              }`} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                              {cls.status === 'ACTIVATED' ? 'Đang học / Hoạt động' :
                                cls.status === 'WAITING_PAYMENT' ? 'Chờ thanh toán' :
                                  cls.status === 'FINDING_TUTOR' ? 'Đang tuyển Gia sư' :
                                    cls.status === 'FINDING_STUDENT' ? 'Đang chiêu sinh' : 'Chờ phê duyệt'}
                            </span>
                          </div>
                        </div>

                        {/* Danh sách Gia sư ứng tuyển cho STUDENT có lớp FINDING_TUTOR */}
                        {cls.status === 'FINDING_TUTOR' && user.role === 'STUDENT' && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>Danh sách Gia sư ứng tuyển:</h4>

                            {(!classApplications[cls.id] || classApplications[cls.id].length === 0) ? (
                              <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                                Chưa có Gia sư ứng tuyển lớp này. Lớp học đang được đăng công khai trên chợ kết nối!
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {classApplications[cls.id].map(app => (
                                  <div key={app.applicationId} style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '1rem'
                                  }}>
                                    <div style={{ textAlign: 'left' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{app.fullName || 'Gia sư ẩn danh'}</strong>
                                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{app.qualifications || 'Gia sư'}</span>
                                      </div>
                                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                        <span>🎓 Đại học: <strong>{app.university || 'Chưa cập nhật'}</strong></span>
                                        <span>📚 Môn dạy: <strong>{app.subjects || 'Toán, Lý, Hóa...'}</strong></span>
                                        {app.experience && <span>💼 Kinh nghiệm: {app.experience}</span>}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <button
                                        onClick={() => handleAcceptTutor(app.applicationId)}
                                        className="btn btn-primary btn-sm pulse-effect"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                        disabled={loading}
                                      >
                                        <CheckCircle size={14} /> Chốt chọn Gia sư này
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Các nút bấm thao tác */}
                        <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem' }}>
                          {cls.status === 'WAITING_PAYMENT' && user.role === 'STUDENT' && (
                            <button
                              onClick={() => navigate(`/checkout/${cls.id}`)}
                              className="btn btn-accent pulse-effect"
                              style={{ width: '100%', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                              disabled={loading}
                            >
                              <CreditCard size={15} /> Đi tới Trang Thanh Toán Bảo Chứng Escrow ({(cls.hourlyRate * cls.totalLessons).toLocaleString('vi-VN')} đ)
                            </button>
                          )}

                          {cls.status === 'FINDING_TUTOR' && user.role === 'STUDENT' && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', padding: '0.5rem' }}>Lớp đã được duyệt, đang đăng tuyển tìm Gia sư...</span>
                          )}

                          {cls.status === 'FINDING_STUDENT' && user.role === 'TUTOR' && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', padding: '0.5rem' }}>Lớp đã được duyệt, đang chiêu sinh học viên trên Chợ Lớp Học...</span>
                          )}

                          {cls.status === 'ACTIVATED' && (
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                              <button
                                onClick={async () => {
                                  setSelectedClass(cls);
                                  const res = await api.get(`/class/${cls.id}/lessons`);
                                  setLessons(res.data);
                                  setSuccess(`Đã tải danh sách các buổi học của lớp "${cls.title}"!`);
                                }}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                              >
                                <Calendar size={14} /> Xem danh sách lịch buổi học đã rải trong DB
                              </button>
                              {user.role === 'TUTOR' && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Bạn có chắc chắn muốn hủy lớp này không? Hệ thống sẽ tự động hoàn tiền cho học viên nếu đã thanh toán.')) {
                                      try {
                                        await api.post(`/class/${cls.id}/cancel`);
                                        setSuccess('Đã hủy lớp thành công!');
                                        fetchData();
                                      } catch (err) {
                                        setError('Lỗi khi hủy lớp: ' + (err.response?.data?.error || err.message));
                                      }
                                    }
                                  }}
                                  className="btn"
                                  style={{ background: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                >
                                  Hủy lớp
                                </button>
                              )}
                            </div>
                          )}



                          {cls.status === 'PENDING_APPROVAL' && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem' }}>Đang chờ Admin hệ thống duyệt lớp...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Xem chi tiết lịch các buổi học */}
              {selectedClass && (
                <div className="card-feature" style={{ border: '1px solid var(--accent-cyan)', background: 'rgba(102,252,241,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={18} /> Lịch học lớp "{selectedClass.title}"
                    </h3>
                    <button className="btn btn-secondary" onClick={() => setSelectedClass(null)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Đóng</button>
                  </div>

                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '0.75rem' }}>Buổi học</th>
                          <th style={{ padding: '0.75rem' }}>Thời gian</th>
                          <th style={{ padding: '0.75rem' }}>Trạng thái</th>
                          <th style={{ padding: '0.75rem' }}>Phòng Học / Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lessons.filter(l => l.classId === selectedClass.id).map(les => (
                          <tr key={les.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>Buổi #{les.lessonNumber}</td>
                            <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                              <div>Bắt đầu: {new Date(les.startTime).toLocaleString('vi-VN')}</div>
                              <div>Kết thúc: {new Date(les.endTime).toLocaleString('vi-VN')}</div>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              {les.status === 'UPCOMING' && (
                                <span className="badge" style={{ background: 'rgba(234,179,8,0.1)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>Sắp diễn ra</span>
                              )}
                              {les.status === 'ONGOING' && (
                                <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>Đang học</span>
                              )}
                              {les.status === 'PENDING_CONFIRM' && (
                                <span className="badge" style={{ background: 'rgba(249,115,22,0.1)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>Chờ xác nhận</span>
                              )}
                              {les.status === 'COMPLETED' && (
                                <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>Đã hoàn thành</span>
                              )}
                              {les.status === 'DISPUTED' && (
                                <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>Tranh chấp</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                {/* Nút Vào Lớp: Cho phép cả học sinh và gia sư vào phòng khi chưa học xong */}
                                {(les.status === 'UPCOMING' || les.status === 'ONGOING') && (
                                  <button
                                    onClick={() => handleStartLesson(les.id, les.classId)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                                  >
                                    Vào Lớp Học Online (Jitsi)
                                  </button>
                                )}

                                {/* Nút Kết thúc: Chỉ Gia sư bấm khi trạng thái là ONGOING */}
                                {les.status === 'ONGOING' && user.role === 'TUTOR' && (
                                  <button
                                    onClick={() => handleEndLesson(les.id)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }}
                                  >
                                    Kết thúc buổi học
                                  </button>
                                )}

                                {/* Nghiệm thu / Khiếu nại: Chỉ Học viên bấm khi trạng thái là PENDING_CONFIRM */}
                                {les.status === 'PENDING_CONFIRM' && user.role === 'STUDENT' && (
                                  <>
                                    <button
                                      onClick={() => handleConfirmLesson(les.id)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                                    >
                                      Nghiệm thu (Giải ngân)
                                    </button>
                                    <button
                                      onClick={() => handleDisputeLesson(les.id)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }}
                                    >
                                      Khiếu nại
                                    </button>
                                  </>
                                )}

                                {les.status === 'PENDING_CONFIRM' && user.role === 'TUTOR' && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Chờ học viên nghiệm thu</span>
                                )}

                                {les.status === 'COMPLETED' && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Hoàn tất • Đã giải ngân</span>
                                )}

                                {les.status === 'DISPUTED' && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-pink)' }}>Đang tranh chấp - Chờ Admin</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

            </div>
          )}



          {/* 3. THỜI KHÓA BIỂU PANEL */}
          {activePanel === 'schedule' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 className="heading-2">Thời khóa biểu hàng tuần</h1>
                  <p className="body-md text-slate">Lịch học đồng bộ tự động từ cơ sở dữ liệu dựa trên các lớp học đã đóng học phí.</p>
                </div>
                <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
                  <RefreshCw size={16} /> Làm mới lịch
                </button>
              </div>

              <div className="card-feature">
                <div className="schedule-grid">
                  <div className="schedule-header">Thứ 2</div>
                  <div className="schedule-header">Thứ 3</div>
                  <div className="schedule-header">Thứ 4</div>
                  <div className="schedule-header">Thứ 5</div>
                  <div className="schedule-header">Thứ 6</div>
                  <div className="schedule-header">Thứ 7</div>
                  <div className="schedule-header">Chủ Nhật</div>

                  {/* Grid cells */}
                  {[1, 2, 3, 4, 5, 6, 0].map(dayOfWeek => {
                    const dayLessons = lessonsByDay[dayOfWeek] || [];
                    return (
                      <div key={dayOfWeek} className={`schedule-cell ${dayLessons.length > 0 ? 'available' : 'busy'}`}>
                        {dayLessons.length === 0 ? (
                          <span>Trống</span>
                        ) : (
                          dayLessons.map((les, i) => (
                            <div key={les.id || i} style={{ padding: '0.25rem 0', borderBottom: i < dayLessons.length - 1 ? '1px dashed rgba(102,252,241,0.1)' : 'none', textAlign: 'left' }}>
                              <strong style={{ fontSize: '0.78rem', display: 'block', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={les.classTitle}>
                                {les.classTitle}
                              </strong>
                              <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', display: 'block', marginTop: '1px' }}>
                                {new Date(les.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 4. GIA SƯ CỦA TÔI PANEL (For Student) */}
          {activePanel === 'tutors' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ marginBottom: '2rem' }}>
                <h1 className="heading-2">Đội ngũ Gia sư</h1>
                <p className="body-md text-slate">Xem danh sách các gia sư hàng đầu giảng dạy trên hệ thống.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="tutor-card text-center">
                  <div className="tutor-avatar mx-auto mb-3" style={{ margin: '0 auto' }}><User size={30} /></div>
                  <div className="body-md-medium" style={{ fontSize: '1.15rem' }}>Cô Nguyễn Thị Mai</div>
                  <div className="body-sm text-steel mb-2" style={{ color: 'var(--accent-cyan)' }}>Sư Phạm Toán - Lý</div>
                  <div className="star-rating mb-2">★★★★★</div>
                  <div className="body-sm text-slate mb-3">3 năm kinh nghiệm • ĐH Sư Phạm Hà Nội</div>
                  <button onClick={() => setSuccess('Đã gửi yêu cầu kết nối với Gia sư Nguyễn Thị Mai!')} className="btn btn-secondary btn-sm w-100">
                    Gửi tin nhắn / Kết nối
                  </button>
                </div>
                <div className="tutor-card text-center">
                  <div className="tutor-avatar mx-auto mb-3" style={{ margin: '0 auto' }}><User size={30} /></div>
                  <div className="body-md-medium" style={{ fontSize: '1.15rem' }}>Thầy Trần Văn Hùng</div>
                  <div className="body-sm text-steel mb-2" style={{ color: 'var(--accent-cyan)' }}>Tiếng Anh Giao Tiếp - IELTS</div>
                  <div className="star-rating mb-2">★★★★<span className="unrated">★</span></div>
                  <div className="body-sm text-slate mb-3">5 năm kinh nghiệm • ĐH Ngoại Ngữ</div>
                  <button onClick={() => setSuccess('Đã gửi yêu cầu kết nối với Gia sư Trần Văn Hùng!')} className="btn btn-secondary btn-sm w-100">
                    Gửi tin nhắn / Kết nối
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. ỨNG TUYỂN PANEL (For Tutor) */}
          {activePanel === 'applications' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ marginBottom: '2rem' }}>
                <h1 className="heading-2">Quản lý Ứng tuyển Lớp học</h1>
                <p className="body-md text-slate">Theo dõi trạng thái duyệt hồ sơ và kết quả nhận lớp của bạn.</p>
              </div>

              <div className="card-feature">
                <div className="dash-class-row">
                  <div className="class-avatar"><BookOpen size={18} /></div>
                  <div style={{ flexGrow: 1, textAlign: 'left' }}>
                    <div className="body-md-medium">Toán lớp 9 - Ôn thi vào 10</div>
                    <div className="body-sm text-slate">Cầu Giấy, Hà Nội • 200k/buổi • 2 buổi/tuần</div>
                  </div>
                  <span className="badge-tag-green">Đã nhận lớp</span>
                </div>
              </div>
            </div>
          )}

          {/* 6. THANH TOÁN PANEL */}
          {activePanel === 'payment' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ marginBottom: '2rem' }}>
                <h1 className="heading-2">{user.role === 'STUDENT' ? 'Quản lý Ví tiền & Thanh toán' : 'Doanh thu & Rút thù lao'}</h1>
                <p className="body-md text-slate">Hệ thống thanh toán trung gian Escrow bảo vệ quyền lợi thù lao của học viên và gia sư.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', flexWrap: 'wrap' }}>

                {/* Balance display and simulation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="dash-stat-card" style={{ background: 'rgba(102, 252, 241, 0.04)', border: '1px solid rgba(102, 252, 241, 0.2)' }}>
                      <span className="body-sm" style={{ color: 'var(--accent-cyan)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Số Dư Khả Dụng</span>
                      <strong style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{wallet.balance.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="dash-stat-card" style={{ background: 'rgba(236, 72, 153, 0.04)', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                      <span className="body-sm" style={{ color: 'var(--accent-pink)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Số Dư Đóng Băng (Escrow)</span>
                      <strong style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{wallet.frozenBalance.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>

                  <div className="card-feature">
                    <h3 className="heading-3" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Thực hiện giao dịch giả lập</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Nạp tiền vào ví</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Số tiền nạp..."
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                          />
                          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}><DollarSign size={16} /></button>
                        </div>
                      </form>

                      <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Rút tiền khỏi ví</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Số tiền rút..."
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                          />
                          <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}><CreditCard size={16} /></button>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="card-feature" style={{ marginBottom: 0 }}>
                    <h3 className="heading-3" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Nhật ký lịch sử giao dịch</h3>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '0.75rem' }}>Giao dịch</th>
                            <th style={{ padding: '0.75rem' }}>Số tiền</th>
                            <th style={{ padding: '0.75rem' }}>Trạng thái</th>
                            <th style={{ padding: '0.75rem' }}>Mô tả chi tiết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có giao dịch.</td></tr>
                          ) : transactions.map(tx => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
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

                {/* Right side escrow desc */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="card-feature" style={{ height: '100%', marginBottom: 0 }}>
                    <h3 className="heading-3" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Bảng đối chiếu học phí</h3>

                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '0.6rem' }}>Lớp học</th>
                            <th style={{ padding: '0.6rem' }}>Số buổi</th>
                            <th style={{ padding: '0.6rem' }}>Tổng tiền</th>
                            <th style={{ padding: '0.6rem' }}>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classes.map((cls, idx) => (
                            <tr key={cls.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.6rem', fontWeight: 'bold' }}>{cls.title.split(' ')[0]}</td>
                              <td style={{ padding: '0.6rem' }}>{cls.totalLessons} buổi</td>
                              <td style={{ padding: '0.6rem' }}>{(cls.hourlyRate * cls.totalLessons).toLocaleString('vi-VN')}đ</td>
                              <td style={{ padding: '0.6rem' }}>
                                <span className={`badge-tag-${cls.status === 'ACTIVATED' ? 'green' : 'orange'}`} style={{ fontSize: '0.68rem' }}>
                                  {cls.status === 'ACTIVATED' ? 'Đã chốt Escrow' : 'Chờ TT'}
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

          {/* 7. ĐÁNH GIÁ PANEL */}
          {activePanel === 'reviews' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ marginBottom: '2rem' }}>
                <h1 className="heading-2">Đánh giá & Phản hồi</h1>
                <p className="body-md text-slate">Ý kiến phản hồi cải thiện chất lượng giảng dạy.</p>
              </div>

              <div className="card-feature">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-heading)' }}>4.9</div>
                  <div className="star-rating" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>★★★★★</div>
                  <div className="body-sm text-slate">Dựa trên 28 đánh giá tổng hợp</div>
                </div>
              </div>
            </div>
          )}

          {/* 8. HỖ TRỢ PANEL */}
          {activePanel === 'support' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ marginBottom: '2rem' }}>
                <h1 className="heading-2">Gửi yêu cầu hỗ trợ</h1>
                <p className="body-md text-slate">Gửi trợ giúp khiếu nại tới Ban quản trị hệ thống.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', flexWrap: 'wrap' }}>
                <div className="card-feature" style={{ marginBottom: 0 }}>
                  <h3 className="heading-3" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Gửi yêu cầu nhanh</h3>
                  <form onSubmit={(e) => { e.preventDefault(); setSuccess('Yêu cầu hỗ trợ đã được ghi nhận thành công!'); }}>
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Loại yêu cầu</label>
                      <select className="form-select" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '0.6rem', color: '#fff' }}>
                        <option>Khiếu nại lớp học / Gia sư</option>
                        <option>Vấn đề thanh toán / Ví tiền</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Nội dung chi tiết</label>
                      <textarea className="form-input" rows="4" placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..." required></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.6rem' }}>
                      <Send size={15} /> Gửi yêu cầu
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 9. TÀI KHOẢN CÁ NHÂN PANEL */}
          {activePanel === 'account' && (
            <div className="dash-panel active animate-fade-in">
              <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <h1 className="heading-2" style={{ margin: 0 }}>Hồ sơ cá nhân của tôi 👤</h1>
                  <p className="body-md text-slate" style={{ margin: '0.25rem 0 0 0' }}>Quản lý thông tin năng lực thỉnh giảng, xem chứng chỉ chuyên môn và cấu hình tài khoản.</p>
                </div>
                
                {/* Sub-tabs điều hướng chuyên nghiệp */}
                <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.2)', padding: '0.35rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <button
                    type="button"
                    onClick={() => setProfileSubTab('view')}
                    className="btn"
                    style={{
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.85rem',
                      textTransform: 'none',
                      letterSpacing: 0,
                      background: profileSubTab === 'view' ? 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)' : 'transparent',
                      color: profileSubTab === 'view' ? '#fff' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: profileSubTab === 'view' ? '0 4px 12px rgba(102, 252, 241, 0.2)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    👁️ Xem hồ sơ hiện tại
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileSubTab('edit')}
                    className="btn"
                    style={{
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.85rem',
                      textTransform: 'none',
                      letterSpacing: 0,
                      background: profileSubTab === 'edit' ? 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)' : 'transparent',
                      color: profileSubTab === 'edit' ? '#fff' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: profileSubTab === 'edit' ? '0 4px 12px rgba(102, 252, 241, 0.2)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    ✍️ Chỉnh sửa & Gửi duyệt
                  </button>
                </div>
              </div>

              {profileSubTab === 'view' ? (
                /* ======================== CHẾ ĐỘ XEM HỒ SƠ CÁ NHÂN (VIEW MODE) ======================== */
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', flexWrap: 'wrap' }}>
                  
                  {/* Cột trái: Chi tiết thông tin đã lưu */}
                  <div className="card-feature" style={{ marginBottom: 0, textAlign: 'left' }}>
                    <h3 className="heading-3" style={{ fontSize: '1.15rem', color: 'var(--accent-cyan)', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      👁️ Thông tin năng lực đang lưu trữ
                    </h3>
                    
                    <table style={{ width: '100%', fontSize: '0.92rem', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', width: '35%' }}>Họ tên đầy đủ:</td>
                          <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>{profileForm.fullName || 'Chưa cập nhật'}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Email tài khoản:</td>
                          <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)' }}>{user.email}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Số điện thoại liên lạc:</td>
                          <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>{profileForm.phone || 'Chưa cập nhật'}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Ngày tháng năm sinh:</td>
                          <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)' }}>{profileForm.dob || 'Chưa cập nhật'}</td>
                        </tr>

                        {user.role === 'TUTOR' ? (
                          <>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Số CCCD đối chiếu:</td>
                              <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--accent-pink)' }}>{profileForm.citizenCard || 'Chưa cập nhật'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Trường đào tạo/ĐH:</td>
                              <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>{profileForm.university || 'Chưa cập nhật'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Trình độ chuyên môn:</td>
                              <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{profileForm.qualifications || 'Chưa cập nhật'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Môn học giảng dạy:</td>
                              <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{profileForm.subjects || 'Chưa cập nhật'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Học phí đề xuất:</td>
                              <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--success)' }}>{profileForm.hourlyRate ? profileForm.hourlyRate.toLocaleString('vi-VN') + ' đ/buổi' : 'Chưa cập nhật'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Thời lượng buổi học:</td>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)' }}>{profileForm.duration || '90 phút'}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', verticalAlign: 'top' }}>Kinh nghiệm / Giới thiệu:</td>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)', lineHeight: '1.5' }}>{profileForm.experience || 'Chưa cập nhật thông tin tự bạch.'}</td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Trường học đang theo học:</td>
                              <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>{profileForm.school || 'Chưa cập nhật'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Cấp lớp hiện tại:</td>
                              <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{profileForm.grade || 'Chưa cập nhật'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Môn học quan tâm:</td>
                              <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{profileForm.subjects || 'Chưa cập nhật'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Mức học phí quan tâm:</td>
                              <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--success)' }}>{profileForm.hourlyRate ? profileForm.hourlyRate.toLocaleString('vi-VN') + ' đ/buổi' : 'Chưa cập nhật'}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', verticalAlign: 'top' }}>Mục tiêu học tập:</td>
                              <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)', lineHeight: '1.5' }}>{profileForm.learningGoals || 'Chưa có thông tin tự bạch.'}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Cột phải: Trạng thái & Bằng chứng chỉ (Chỉ TUTOR) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {user.role === 'TUTOR' && (
                      <>
                        {/* Banner Trạng Thái Duyệt Thẩm Định */}
                        <div style={{
                          background: profileForm.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.04)' :
                                      profileForm.status === 'PENDING' ? 'rgba(245, 158, 11, 0.04)' :
                                      profileForm.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${
                            profileForm.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.3)' :
                            profileForm.status === 'PENDING' ? 'rgba(245, 158, 11, 0.3)' :
                            profileForm.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'
                          }`,
                          borderRadius: '12px',
                          padding: '1.5rem',
                          textAlign: 'left'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{
                              fontWeight: 'bold',
                              color: profileForm.status === 'APPROVED' ? 'var(--success)' :
                                     profileForm.status === 'PENDING' ? 'var(--warning)' :
                                     profileForm.status === 'REJECTED' ? 'var(--accent-pink)' : 'var(--text-secondary)'
                            }}>
                              {profileForm.status === 'APPROVED' ? '✓ ĐÃ PHÊ DUYỆT CHÍNH THỨC' :
                               profileForm.status === 'PENDING' ? '⏳ HỒ SƠ ĐANG CHỜ DUYỆT' :
                               profileForm.status === 'REJECTED' ? '✗ HỒ SƠ BỊ TỪ CHỐI' : '⚠️ CHƯA GỬI YÊU CẦU DUYỆT'}
                            </span>
                          </div>
                          
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                            {profileForm.status === 'APPROVED' && 'Chúc mừng! Hồ sơ của bạn đã hoàn thành kiểm duyệt. Bạn có thể tự do mở lớp thỉnh giảng hoặc đăng ký dạy học.'}
                            {profileForm.status === 'PENDING' && 'Ban quản trị đang tiến hành thẩm định và đối chiếu bằng cấp của bạn. Thời gian xử lý dự kiến là 12-24h.'}
                            {profileForm.status === 'REJECTED' && `Lý do từ chối: "${profileForm.rejectReason}". Vui lòng nhấp chọn tab Chỉnh sửa & Gửi duyệt để cập nhật lại hồ sơ theo yêu cầu.`}
                            {profileForm.status === 'NOT_SUBMITTED' && 'Vui lòng bổ sung đầy đủ CCCD, SĐT, kinh nghiệm giảng dạy và tối thiểu 1 bằng cấp, sau đó chọn Chỉnh sửa & Gửi duyệt để gửi yêu cầu kích hoạt tài khoản.'}
                          </p>
                        </div>

                        {/* Bằng chứng chỉ đã tải lên */}
                        <div className="card-feature" style={{ marginBottom: 0, textAlign: 'left' }}>
                          <h3 className="heading-3" style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                            🏆 Bằng cấp chứng chỉ đã tải lên
                          </h3>
                          
                          {JSON.parse(profileForm.certificates || '[]').length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }}>
                              Chưa có bằng cấp chứng chỉ nào được lưu trong hồ sơ.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {JSON.parse(profileForm.certificates || '[]').map(cert => (
                                <div key={cert.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', background: 'rgba(255,255,255,0.01)' }}>
                                  <div style={{ background: 'rgba(59,130,246,0.08)', color: '#2563eb', padding: '0.4rem', borderRadius: '4px' }}>
                                    {cert.type && cert.type.includes('pdf') ? <BookOpen size={16} /> : <Award size={16} />}
                                  </div>
                                  <div style={{ overflow: 'hidden', textAlign: 'left', flexGrow: 1 }}>
                                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={cert.name}>{cert.name}</strong>
                                    <a 
                                      href={cert.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', display: 'inline-block', marginTop: '4px', fontWeight: 'bold' }}
                                    >
                                      Mở tài liệu ↗
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Mẹo nhỏ hoặc Thông tin trợ giúp */}
                    <div className="card-feature-mint" style={{ border: '1px solid rgba(102, 252, 241, 0.1)', background: 'linear-gradient(135deg, rgba(102,252,241,0.02) 0%, rgba(59,130,246,0.02) 100%)', textAlign: 'left' }}>
                      <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>Trợ giúp về tài khoản 🛡️</h4>
                      <p className="body-sm text-slate" style={{ fontSize: '0.8rem', lineHeight: 1.4, marginBottom: 0 }}>
                        Nếu bạn cần hỗ trợ thay đổi email hoặc các thông tin đặc biệt khác, vui lòng liên hệ Ban quản trị tại mục **Khiếu nại & Hỗ trợ** hoặc hotline **0369 148 660**.
                      </p>
                    </div>

                  </div>

                </div>
              ) : (
                /* ======================== CHẾ ĐỘ CHỈNH SỬA & GỬI DUYỆT (EDIT MODE) ======================== */
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', flexWrap: 'wrap' }}>
                  
                  {/* Cột trái: Form chỉnh sửa thông tin & Tải chứng chỉ */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Form cập nhật thông tin cá nhân */}
                    <div className="card-feature" style={{ marginBottom: 0 }}>
                      <h3 className="heading-3" style={{ fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem', marginBottom: '1.25rem', textAlign: 'left' }}>
                        ✍️ Chỉnh sửa thông tin hồ sơ
                      </h3>

                      <form onSubmit={handleUpdateProfile}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Địa chỉ Email (Cố định)</label>
                            <input type="text" className="form-input" value={user.email} disabled style={{ opacity: 0.55, cursor: 'not-allowed' }} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Vai trò tài khoản</label>
                            <input type="text" className="form-input" value={user.role} disabled style={{ opacity: 0.55, cursor: 'not-allowed' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Họ tên đầy đủ</label>
                            <input
                              type="text"
                              className="form-input"
                              value={profileForm.fullName}
                              onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Số điện thoại liên lạc</label>
                            <input
                              type="text"
                              className="form-input"
                              value={profileForm.phone}
                              onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Ngày tháng năm sinh</label>
                            <input
                              type="date"
                              className="form-input"
                              value={profileForm.dob}
                              style={{ colorScheme: 'dark' }}
                              onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })}
                            />
                          </div>

                          {user.role === 'TUTOR' ? (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>Trình độ cao nhất</label>
                              <select
                                className="form-select"
                                value={profileForm.qualifications}
                                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '0.6rem', color: '#fff' }}
                                onChange={e => setProfileForm({ ...profileForm, qualifications: e.target.value })}
                              >
                                <option value="Sinh viên">Sinh viên</option>
                                <option value="Cử nhân">Cử nhân</option>
                                <option value="Thạc sĩ">Thạc sĩ</option>
                                <option value="Tiến sĩ">Tiến sĩ</option>
                                <option value="Giáo viên">Giáo viên</option>
                              </select>
                            </div>
                          ) : (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>Cấp lớp hiện tại</label>
                              <select
                                className="form-select"
                                value={profileForm.grade}
                                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '0.6rem', color: '#fff' }}
                                onChange={e => setProfileForm({ ...profileForm, grade: e.target.value })}
                              >
                                <option value="">Chọn cấp lớp</option>
                                <option value="Lớp 9">Lớp 9</option>
                                <option value="Lớp 10">Lớp 10</option>
                                <option value="Lớp 11">Lớp 11</option>
                                <option value="Lớp 12">Lớp 12</option>
                                <option value="Người đi làm">Người đi làm</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          {user.role === 'TUTOR' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Trường Đại học đào tạo</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Ví dụ: Đại học Sư phạm Hà Nội"
                                  value={profileForm.university}
                                  onChange={e => setProfileForm({ ...profileForm, university: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Số Căn cước công dân (CCCD)</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Nhập 12 số CCCD..."
                                  value={profileForm.citizenCard || ''}
                                  onChange={e => setProfileForm({ ...profileForm, citizenCard: e.target.value })}
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>Trường học đang học tập</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Ví dụ: THPT Chuyên Hà Nội - Amsterdam"
                                value={profileForm.school}
                                onChange={e => setProfileForm({ ...profileForm, school: e.target.value })}
                              />
                            </>
                          )}
                        </div>

                        {/* Môn học và thù lao */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingVer: '1rem', marginTop: '1rem', paddingTop: '1rem' }}>
                          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-primary)', textAlign: 'left' }}>
                            {user.role === 'TUTOR' ? 'Cấu hình môn giảng dạy & Thù lao' : 'Môn học quan tâm & Yêu cầu học phí'}
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>Môn học quan tâm / giảng dạy</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder={user.role === 'TUTOR' ? "Toán, Lý, Hóa" : "Toán ôn thi lớp 10"}
                                value={profileForm.subjects}
                                onChange={e => setProfileForm({ ...profileForm, subjects: e.target.value })}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>Đơn giá (đ/buổi)</label>
                              <input
                                type="number"
                                className="form-input"
                                value={profileForm.hourlyRate}
                                onChange={e => setProfileForm({ ...profileForm, hourlyRate: parseFloat(e.target.value) })}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>Thời lượng buổi học</label>
                              <select
                                className="form-select"
                                value={profileForm.duration}
                                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '0.6rem', color: '#fff' }}
                                onChange={e => setProfileForm({ ...profileForm, duration: e.target.value })}
                              >
                                <option value="90 phút">90 phút</option>
                                <option value="60 phút">60 phút</option>
                                <option value="120 phút">120 phút</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Giới thiệu tóm tắt / Mục tiêu học tập</label>
                          <textarea
                            className="form-input"
                            style={{ height: '90px' }}
                            placeholder={user.role === 'TUTOR' ? "Mô tả triết lý dạy học, kinh nghiệm giảng dạy..." : "Mô tả mục tiêu học tập..."}
                            value={user.role === 'TUTOR' ? profileForm.experience : profileForm.learningGoals}
                            onChange={e => {
                              if (user.role === 'TUTOR') {
                                setProfileForm({ ...profileForm, experience: e.target.value });
                              } else {
                                setProfileForm({ ...profileForm, learningGoals: e.target.value });
                              }
                            }}
                          />
                        </div>

                        <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.65rem', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)', border: 'none', color: '#fff', fontWeight: 'bold' }}>
                          Lưu thông tin hồ sơ
                        </button>
                      </form>
                    </div>

                    {/* Form tải chứng chỉ mới (Chỉ TUTOR) */}
                    {user.role === 'TUTOR' && (
                      <div className="card-feature" style={{ marginBottom: 0, textAlign: 'left' }}>
                        <h3 className="heading-3" style={{ fontSize: '1.15rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <Award size={20} /> Thêm bằng cấp & chứng chỉ mới
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                          Tải lên các tài liệu chứng minh trình độ chuyên môn của bạn (Ảnh chụp hoặc tệp PDF). Admin sẽ đối chiếu các tài liệu này để phê duyệt hồ sơ của bạn.
                        </p>

                        <form onSubmit={handleUploadCertificate} style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(102, 252, 241, 0.1)', borderRadius: '10px', padding: '1.25rem' }}>
                          <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Tên chứng chỉ / bằng cấp</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Ví dụ: Bằng tốt nghiệp Đại học Sư Phạm, Chứng chỉ IELTS 7.5..."
                              value={certName}
                              onChange={e => setCertName(e.target.value)}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ flexGrow: 1 }}>
                              <input
                                type="file"
                                id="cert-file-input"
                                accept="image/*,application/pdf"
                                style={{ display: 'none' }}
                                onChange={e => setCertFile(e.target.files[0])}
                              />
                              <button
                                type="button"
                                onClick={() => document.getElementById('cert-file-input').click()}
                                className="btn btn-secondary w-100"
                                style={{ padding: '0.55rem', fontSize: '0.85rem', textTransform: 'none', letterSpacing: 0 }}
                              >
                                {certFile ? `📎 Đã chọn: ${certFile.name.substring(0, 25)}${certFile.name.length > 25 ? '...' : ''}` : '📁 Chọn tệp tài liệu (Ảnh hoặc PDF)'}
                              </button>
                            </div>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                              disabled={uploadingCert || loading}
                            >
                              {uploadingCert ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : <Plus size={14} />}
                              Tải lên cloud
                            </button>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                            Hỗ trợ định dạng tệp: JPG, PNG, JPEG, PDF. Dung lượng tối đa 10MB.
                          </span>
                        </form>

                        {/* Danh sách thẻ chứng chỉ có nút Xóa để quản lý */}
                        {JSON.parse(profileForm.certificates || '[]').length > 0 && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#fff' }}>Quản lý chứng chỉ đã tải lên (Xóa bỏ nếu cần):</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                              {JSON.parse(profileForm.certificates || '[]').map(cert => (
                                <div key={cert.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', background: 'rgba(255,255,255,0.01)' }}>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div style={{ color: '#2563eb', padding: '0.25rem' }}>
                                      {cert.type && cert.type.includes('pdf') ? <BookOpen size={16} /> : <Award size={16} />}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={cert.name}>{cert.name}</strong>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <a href={cert.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flexGrow: 1, padding: '0.25rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' }}>Xem</a>
                                    <button type="button" onClick={() => handleDeleteCertificate(cert.id)} className="btn btn-brand-ghost btn-sm" style={{ padding: '0.25rem', fontSize: '0.7rem', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }} disabled={loading}>Xóa</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                  </div>

                  {/* Cột phải: Gửi duyệt & Đổi mật khẩu */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Block Gửi duyệt hồ sơ (Chỉ TUTOR) */}
                    {user.role === 'TUTOR' && (
                      <div style={{ background: 'linear-gradient(135deg, rgba(102,252,241,0.03) 0%, rgba(59,130,246,0.03) 100%)', border: '1px solid rgba(102, 252, 241, 0.25)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)', display: 'block', marginBottom: '0.25rem' }}>Đăng ký gia sư chính thức</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block' }}>
                            Để bắt đầu mở lớp chiêu sinh hoặc ứng tuyển, hồ sơ của bạn phải được kiểm duyệt chuyên môn. Vui lòng kiểm tra kỹ các thông tin cá nhân và bằng cấp chứng chỉ trước khi gửi yêu cầu duyệt.
                          </span>
                        </div>

                        {/* Các điều kiện cần */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div>📌 <strong>Điều kiện gửi duyệt tối thiểu:</strong></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: profileForm.fullName ? 'var(--success)' : 'var(--accent-pink)' }}>{profileForm.fullName ? '✓' : '✗'}</span> Họ tên đầy đủ
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: (profileForm.phone && profileForm.phone.match(/^(0[3|5|7|8|9])[0-9]{8}$/)) ? 'var(--success)' : 'var(--accent-pink)' }}>{(profileForm.phone && profileForm.phone.match(/^(0[3|5|7|8|9])[0-9]{8}$/)) ? '✓' : '✗'}</span> SĐT liên lạc (10 số VN)
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: (profileForm.citizenCard && profileForm.citizenCard.match(/^[0-9]{12}$/)) ? 'var(--success)' : 'var(--accent-pink)' }}>{(profileForm.citizenCard && profileForm.citizenCard.match(/^[0-9]{12}$/)) ? '✓' : '✗'}</span> CCCD hợp lệ (12 chữ số)
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: (profileForm.subjects && profileForm.hourlyRate >= 10000 && profileForm.experience) ? 'var(--success)' : 'var(--accent-pink)' }}>{(profileForm.subjects && profileForm.hourlyRate >= 10000 && profileForm.experience) ? '✓' : '✗'}</span> Môn học, thù lao, kinh nghiệm
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: JSON.parse(profileForm.certificates || '[]').length > 0 ? 'var(--success)' : 'var(--accent-pink)' }}>{JSON.parse(profileForm.certificates || '[]').length > 0 ? '✓' : '✗'}</span> Tối thiểu 1 chứng chỉ chuyên môn
                          </div>
                        </div>

                        {/* Nút hành động dựa trên trạng thái */}
                        {(profileForm.status === 'NOT_SUBMITTED' || profileForm.status === 'REJECTED') ? (
                          <button
                            type="button"
                            onClick={handleSubmitReview}
                            className="btn btn-accent w-100 pulse-effect"
                            style={{ padding: '0.75rem', fontSize: '0.95rem', fontWeight: 'bold' }}
                            disabled={loading || uploadingCert}
                          >
                            GỬI YÊU CẦU DUYỆT HỒ SƠ
                          </button>
                        ) : profileForm.status === 'PENDING' ? (
                          <button
                            type="button"
                            className="btn btn-secondary w-100"
                            style={{ padding: '0.75rem', fontSize: '0.95rem', opacity: 0.7, cursor: 'not-allowed' }}
                            disabled
                          >
                            ⏳ HỒ SƠ ĐANG CHỜ DUYỆT...
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary w-100"
                            style={{ padding: '0.75rem', fontSize: '0.95rem', color: 'var(--success)', borderColor: 'var(--success)', opacity: 0.8, cursor: 'not-allowed' }}
                            disabled
                          >
                            ✓ ĐÃ PHÊ DUYỆT CHÍNH THỨC
                          </button>
                        )}
                      </div>
                    )}

                    {/* Form đổi mật khẩu tài khoản */}
                    <div className="card-feature" style={{ marginBottom: 0, textAlign: 'left' }}>
                      <h3 className="heading-3" style={{ fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                        Đổi mật khẩu tài khoản
                      </h3>
                      <form onSubmit={handleUpdatePassword}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Mật khẩu hiện tại</label>
                          <input
                            type="password"
                            className="form-input"
                            value={passwordForm.oldPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Mật khẩu mới</label>
                          <input
                            type="password"
                            className="form-input"
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Nhập lại mật khẩu mới</label>
                          <input
                            type="password"
                            className="form-input"
                            value={passwordForm.confirmPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
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
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
