import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft, Clock, CheckCircle, AlertTriangle, Play,
  BookOpen, User, RefreshCw, Sparkles, LogOut, Award,
  Shield, Check, X, ShieldAlert
} from 'lucide-react';

export default function Classroom() {
  const { classId, lessonId } = useParams();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef(null);
  const [jitsiApi, setJitsiApi] = useState(null);

  // States
  const [user, setUser] = useState(null);
  const [classDetail, setClassDetail] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Classroom Timer State
  const [timeLeft, setTimeLeft] = useState(5400); // 90 minutes in seconds

  useEffect(() => {
    // Get logged-in user
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));

    // Fetch class and lessons data
    fetchClassAndLessonData();
  }, [classId, lessonId]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fetchClassAndLessonData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch all classes to find the current class details
      const classesRes = await api.get('/class');
      const foundClass = classesRes.data.find(c => c.id === parseInt(classId));
      if (!foundClass) {
        setError('Không tìm thấy thông tin lớp học!');
        return;
      }
      setClassDetail(foundClass);

      // 2. Fetch all lessons of this class
      const lessonsRes = await api.get(`/class/${classId}/lessons`);
      setLessons(lessonsRes.data);

      const foundLesson = lessonsRes.data.find(l => l.id === parseInt(lessonId));
      if (!foundLesson) {
        setError('Không tìm thấy thông tin buổi học!');
        return;
      }
      setLesson(foundLesson);

      // 3. Auto check-in when loading page (if status is UPCOMING)
      if (foundLesson.status === 'UPCOMING') {
        const checkinRes = await api.post(`/class/lessons/${lessonId}/start`);
        setLesson(checkinRes.data);
        // Refresh lessons list
        const updatedLessonsRes = await api.get(`/class/${classId}/lessons`);
        setLessons(updatedLessonsRes.data);
        setSuccess('Điểm danh vào lớp (Check-in) thành công!');
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Lỗi khi tải thông tin phòng học trực tuyến!');
    } finally {
      setLoading(false);
    }
  };

  // Setup Jitsi Meet embedded frame
  useEffect(() => {
    if (!lesson || !user || !window.JitsiMeetExternalAPI) return;

    // Clean container first
    if (jitsiContainerRef.current) {
      jitsiContainerRef.current.innerHTML = "";
    }

    const domain = 'meet.jit.si';
    const roomName = `etutor-class-${classId}-session-${lesson.lessonNumber}`;

    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: `${user.fullName} (${user.role === 'STUDENT' ? 'Học viên' : 'Gia sư'})`,
        email: user.email
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false, // Bypass prejoin screen for faster entry
        disableDeepLinking: true // Prevent forcing Jitsi app installation
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: '#1b1412',
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'sharedvideo', 'settings', 'raisehand', 'videoquality', 'filmstrip',
          'tileview', 'videobackgroundblur', 'shortcuts', 'mute-everyone', 'security'
        ]
      }
    };

    const newJitsiApi = new window.JitsiMeetExternalAPI(domain, options);
    setJitsiApi(newJitsiApi);

    // Listen to iframe events if needed
    newJitsiApi.addEventListener('videoConferenceLeft', () => {
      setSuccess('Bạn đã rời khỏi cuộc gọi video.');
    });

    return () => {
      if (newJitsiApi) {
        newJitsiApi.dispose();
      }
    };
  }, [lesson, user]);

  // Operations
  const handleEndLesson = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn báo cáo kết thúc buổi dạy này? Học viên sẽ nhận được thông báo để nghiệm thu giải ngân.')) return;
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const res = await api.post(`/class/lessons/${lessonId}/end`);
      setLesson(res.data);
      setSuccess('Báo cáo kết thúc buổi dạy thành công! Đang chờ Học viên xác nhận nghiệm thu giải ngân.');
      fetchClassAndLessonData();
    } catch (err) {
      setError(err.response?.data?.error || 'Gửi báo cáo kết thúc thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLesson = async () => {
    if (!window.confirm('Bạn xác nhận buổi học đã hoàn thành tốt đẹp? Tiền học phí buổi này sẽ được giải ngân ngay lập tức cho Gia sư và KHÔNG THỂ hoàn tác.')) return;
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const res = await api.post(`/class/lessons/${lessonId}/confirm`);
      setLesson(res.data);
      setSuccess('Xác nhận hoàn thành thành công! Tiền học đã giải ngân cho Gia sư.');
      fetchClassAndLessonData();
    } catch (err) {
      setError(err.response?.data?.error || 'Xác nhận nghiệm thu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleDisputeLesson = async () => {
    const reason = window.prompt('Nhập lý do khiếu nại (ví dụ: Gia sư vắng mặt, dạy sai giờ, chất lượng không đạt...):');
    if (reason === null) return; // Cancelled
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do để khiếu nại!');
      return;
    }
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const res = await api.post(`/class/lessons/${lessonId}/dispute`);
      setLesson(res.data);
      setSuccess('Đã gửi khiếu nại buổi học này lên hệ thống! Admin sẽ liên hệ và giải quyết tranh chấp tài chính.');
      fetchClassAndLessonData();
    } catch (err) {
      setError(err.response?.data?.error || 'Gửi khiếu nại thất bại!');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !classDetail) {
    return (
      <div style={{ background: '#1E1512', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--accent-cyan)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Đang kết nối phòng học trực tuyến bảo mật...</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--text-primary)', overflow: 'hidden', height: '100vh' }}>
      
      {/* Top Navbar in Classroom */}
      <header style={{
        background: 'rgba(245, 239, 228, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary" 
            style={{ 
              padding: '0.4rem 0.8rem', 
              fontSize: '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem',
              borderColor: 'rgba(255,255,255,0.15)',
              color: 'var(--text-secondary)'
            }}
          >
            <ArrowLeft size={14} /> Trở lại Dashboard
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.5px' }}>
              ETutor<span style={{ color: 'var(--accent-cyan)' }}>Classroom</span>
            </span>
          </div>
        </div>

        {classDetail && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              background: 'rgba(141, 91, 76, 0.08)',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid rgba(141, 91, 76, 0.2)',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)',
              fontWeight: 600
            }}>
              Lớp: {classDetail.title}
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              Môn: {classDetail.subject}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', background: 'rgba(102,252,241,0.05)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(102,252,241,0.15)', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <Clock size={14} /> {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* Main Working Area */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Jitsi Meet embedded frame */}
        <div style={{ flexGrow: 1, background: '#000', position: 'relative' }}>
          {error && (
            <div style={{
              position: 'absolute',
              top: '1.5rem',
              left: '1.5rem',
              right: '1.5rem',
              background: 'rgba(239, 68, 68, 0.9)',
              backdropFilter: 'blur(5px)',
              padding: '1rem',
              borderRadius: '8px',
              zIndex: 100,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <AlertTriangle size={16} /> <strong>Lỗi:</strong> {error}
            </div>
          )}

          {success && (
            <div style={{
              position: 'absolute',
              top: '1.5rem',
              left: '1.5rem',
              right: '1.5rem',
              background: 'rgba(16, 185, 129, 0.95)',
              backdropFilter: 'blur(5px)',
              padding: '1rem',
              borderRadius: '8px',
              zIndex: 100,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <CheckCircle size={16} /> <strong>Thông báo:</strong> {success}
              <button 
                onClick={() => setSuccess('')} 
                style={{ background: 'none', border: 'none', color: '#fff', marginLeft: 'auto', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
              >
                Đóng
              </button>
            </div>
          )}

          {/* Jitsi Meet embedded frame target */}
          <div ref={jitsiContainerRef} style={{ width: '100%', height: '100%', background: '#1b1412' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
              <div className="spinner" style={{ borderTopColor: 'var(--accent-cyan)' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Đang khởi tạo camera và kết nối đường truyền bảo mật...</p>
            </div>
          </div>
        </div>

        {/* Right Side: Glassmorphism Control Panel */}
        <aside style={{
          width: '320px',
          background: 'rgba(245, 239, 228, 0.95)',
          backdropFilter: 'blur(15px)',
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          
          {/* Header Sidebar */}
          <div style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border-color)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
              <strong style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Thông tin buổi học</strong>
            </div>
            
            {lesson && (
              <>
                <h3 style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Buổi học #{lesson.lessonNumber}
                </h3>
                
                {/* Status Badge */}
                <div style={{ marginTop: '0.5rem' }}>
                  {lesson.status === 'UPCOMING' && (
                    <span className="badge" style={{ background: 'rgba(234,179,8,0.1)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>Sắp diễn ra</span>
                  )}
                  {lesson.status === 'ONGOING' && (
                    <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Đang học trực tuyến</span>
                  )}
                  {lesson.status === 'PENDING_CONFIRM' && (
                    <span className="badge" style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>Chờ xác nhận nghiệm thu</span>
                  )}
                  {lesson.status === 'COMPLETED' && (
                    <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>Đã hoàn tất học tập</span>
                  )}
                  {lesson.status === 'DISPUTED' && (
                    <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>Đang tranh chấp</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Interactive Escrow Control Panel */}
          <div style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            flexGrow: 1,
            textAlign: 'left'
          }}>
            
            {/* Escrow Status Explanation */}
            <div style={{
              background: 'rgba(141, 91, 76, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.85rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                <Shield size={14} /> Bảo chứng dòng tiền
              </div>
              Tiền học phí của buổi học này hiện đang được đóng băng an toàn trong hệ thống Escrow. Tiền sẽ được giải ngân sang ví Gia sư ngay sau khi Học viên xác nhận nghiệm thu thành công.
            </div>

            {/* Business logic buttons depending on roles & status */}
            {lesson && user && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                {/* 1. ACTIONS FOR TUTOR */}
                {user.role === 'TUTOR' && (
                  <>
                    {lesson.status === 'ONGOING' && (
                      <button
                        onClick={handleEndLesson}
                        className="btn btn-accent pulse-effect"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          fontSize: '0.85rem',
                          background: 'linear-gradient(135deg, var(--accent-pink) 0%, #ec4899 100%)',
                          color: '#fff',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Check size={16} /> Báo cáo kết thúc buổi dạy
                      </button>
                    )}

                    {lesson.status === 'PENDING_CONFIRM' && (
                      <div style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: 'var(--accent-cyan)',
                        background: 'rgba(102,252,241,0.03)',
                        border: '1px dashed rgba(102,252,241,0.25)',
                        borderRadius: '8px',
                        fontSize: '0.82rem'
                      }}>
                        👍 Bạn đã báo cáo kết thúc dạy học. Vui lòng chờ học viên xác nhận và nghiệm thu buổi học để tự động nhận thù lao.
                      </div>
                    )}

                    {lesson.status === 'COMPLETED' && (
                      <div style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: 'var(--success)',
                        background: 'rgba(16,185,129,0.03)',
                        border: '1px dashed rgba(16,185,129,0.25)',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <CheckCircle size={18} />
                        Thành công! Tiền thù lao của buổi học đã được giải ngân cộng vào số dư ví của bạn.
                      </div>
                    )}
                  </>
                )}

                {/* 2. ACTIONS FOR STUDENT */}
                {user.role === 'STUDENT' && (
                  <>
                    {lesson.status === 'ONGOING' && (
                      <div style={{
                        padding: '0.85rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        📚 Buổi học đang diễn ra. Khi gia sư dạy xong và báo cáo kết thúc, bạn có thể kiểm tra và bấm nút nghiệm thu để giải ngân tiền thù lao cho gia sư.
                      </div>
                    )}

                    {lesson.status === 'PENDING_CONFIRM' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{
                          fontSize: '0.78rem',
                          color: '#fb923c',
                          background: 'rgba(249,115,22,0.03)',
                          border: '1px solid rgba(249,115,22,0.15)',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          lineHeight: 1.4
                        }}>
                          ⚠️ Gia sư đã báo cáo hoàn thành buổi học. Hãy xác nhận nghiệm thu nếu buổi dạy đạt chất lượng.
                        </div>
                        <button
                          onClick={handleConfirmLesson}
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Check size={16} /> Nghiệm thu (Giải ngân)
                        </button>
                        <button
                          onClick={handleDisputeLesson}
                          className="btn btn-secondary"
                          style={{
                            width: '100%',
                            padding: '0.6rem 1rem',
                            fontSize: '0.82rem',
                            borderColor: 'var(--accent-pink)',
                            color: 'var(--accent-pink)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <ShieldAlert size={14} /> Gửi khiếu nại buổi học
                        </button>
                      </div>
                    )}

                    {lesson.status === 'COMPLETED' && (
                      <div style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: 'var(--success)',
                        background: 'rgba(16,185,129,0.03)',
                        border: '1px dashed rgba(16,185,129,0.25)',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <CheckCircle size={18} />
                        Bạn đã nghiệm thu hoàn thành buổi học. Thù lao đã chuyển đến ví Gia sư an toàn.
                      </div>
                    )}
                  </>
                )}

                {/* 3. DISPUTED STATUS (BOTH ROLES) */}
                {lesson.status === 'DISPUTED' && (
                  <div style={{
                    padding: '1rem',
                    color: 'var(--accent-pink)',
                    background: 'rgba(236,72,153,0.03)',
                    border: '1px dashed rgba(236,72,153,0.25)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    lineHeight: 1.4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <ShieldAlert size={20} />
                    <strong>Đang giải quyết khiếu nại!</strong>
                    <span>Hệ thống đang tạm ngừng giao dịch buổi học này. Ban quản trị (Admin) đang tiến hành đối chất giữa hai bên để giải quyết công bằng dòng tiền (hoàn tiền hoặc giải ngân).</span>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Quick List of other sessions of the class */}
          <div style={{
            padding: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'left'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lịch trình khóa học</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {lessons.map(les => {
                const isActive = les.id === parseInt(lessonId);
                return (
                  <div 
                    key={les.id} 
                    style={{
                      background: isActive ? 'rgba(141, 91, 76, 0.08)' : 'rgba(255,255,255,0.5)',
                      border: isActive ? '1px solid rgba(141, 91, 76, 0.25)' : '1px solid var(--border-color)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      opacity: isActive ? 1 : 0.65
                    }}
                  >
                    <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                      Buổi #{les.lessonNumber}
                    </span>
                    <span style={{ 
                      fontSize: '0.72rem',
                      color: les.status === 'COMPLETED' ? 'var(--success)' : 
                             les.status === 'ONGOING' ? 'var(--accent-blue)' : 
                             les.status === 'PENDING_CONFIRM' ? '#fb923c' : 'var(--text-secondary)'
                    }}>
                      {les.status === 'COMPLETED' ? 'Đã học xong' :
                       les.status === 'ONGOING' ? 'Đang học' :
                       les.status === 'PENDING_CONFIRM' ? 'Chờ nghiệm thu' : 'Sắp học'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div style={{
            padding: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(141, 91, 76, 0.03)'
          }}>
            <button 
              onClick={() => {
                if (window.confirm('Bạn muốn rời khỏi lớp học và quay lại trang Dashboard? Cuộc gọi Jitsi vẫn tiếp tục chạy cho đến khi bạn ngắt kết nối.')) {
                  navigate('/dashboard');
                }
              }}
              className="btn btn-secondary w-100" 
              style={{ padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <LogOut size={13} /> Thoát phòng học
            </button>
          </div>

        </aside>

      </div>

    </div>
  );
}
