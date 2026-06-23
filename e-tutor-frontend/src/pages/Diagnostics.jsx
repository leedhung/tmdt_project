import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import axios from 'axios';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Database, 
  Key, 
  RefreshCw, 
  Trash2, 
  User, 
  Server, 
  Settings, 
  Home,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

export default function Diagnostics() {
  const [pingStatus, setPingStatus] = useState('idle'); // idle, checking, success, error
  const [pingError, setPingError] = useState('');
  const [pingData, setPingData] = useState(null);
  
  const [adminStatus, setAdminStatus] = useState('idle'); // idle, checking, success, error
  const [adminError, setAdminError] = useState('');
  const [adminToken, setAdminToken] = useState('');

  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [testStatus, setTestStatus] = useState('idle');
  const [testError, setTestError] = useState('');
  const [testResult, setTestResult] = useState(null);

  const [storedUser, setStoredUser] = useState(null);
  const [storedAccessToken, setStoredAccessToken] = useState('');
  const [storedRefreshToken, setStoredRefreshToken] = useState('');

  const navigate = useNavigate();

  // Load local storage details
  const loadLocalStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      setStoredUser(userStr ? JSON.parse(userStr) : null);
      setStoredAccessToken(localStorage.getItem('accessToken') || '');
      setStoredRefreshToken(localStorage.getItem('refreshToken') || '');
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
  };

  useEffect(() => {
    loadLocalStorage();
  }, []);

  // Run Backend Service Ping Test
  const runPingTest = async () => {
    setPingStatus('checking');
    setPingError('');
    setPingData(null);
    try {
      // Call debug-auth which is mapped to permitAll
      const response = await api.get('/auth/debug-auth');
      setPingStatus('success');
      setPingData(response.data);
    } catch (err) {
      setPingStatus('error');
      setPingError(err.message || 'Không thể kết nối đến Backend Service');
      console.error(err);
    }
  };

  // Run Auto-Admin login check
  const runAdminTest = async () => {
    setAdminStatus('checking');
    setAdminError('');
    setAdminToken('');
    try {
      const response = await api.post('/auth/login', {
        email: 'admin@etutor.com',
        password: 'admin123'
      });
      setAdminStatus('success');
      setAdminToken(response.data.accessToken);
    } catch (err) {
      setAdminStatus('error');
      setAdminError(err.response?.data?.error || 'Đăng nhập Admin thất bại. Vui lòng kiểm tra lại cấu hình DB!');
      console.error(err);
    }
  };

  // Run Custom login check
  const runCustomTest = async (e) => {
    e.preventDefault();
    if (!testEmail || !testPassword) {
      setTestError('Vui lòng điền đầy đủ Email và Mật khẩu để kiểm thử!');
      return;
    }
    setTestStatus('checking');
    setTestError('');
    setTestResult(null);
    try {
      const response = await api.post('/auth/login', {
        email: testEmail,
        password: testPassword
      });
      setTestStatus('success');
      setTestResult(response.data);
    } catch (err) {
      setTestStatus('error');
      setTestError(err.response?.data?.error || 'Đăng nhập thất bại.');
      console.error(err);
    }
  };

  // Clear session
  const clearSession = () => {
    localStorage.clear();
    loadLocalStorage();
  };

  // Apply tested token to session
  const applyTokenToSession = (data) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify({
      id: data.id,
      email: data.email,
      role: data.role,
      fullName: data.fullName
    }));
    loadLocalStorage();
  };

  const configBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1 (Proxy qua Vite)';

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
      width: '100%',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.25rem', letterSpacing: '-1px' }}>
            E-Tutor <span style={{ color: 'var(--accent-cyan)' }}>Developer Console</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Trình kiểm thử và chuẩn đoán kết nối hệ thống từ Frontend
          </p>
        </div>
        <Link to="/" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Home size={18} /> Trang Chủ
        </Link>
      </div>

      {/* Main Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem'
      }}>
        
        {/* Panel 1: Connection & Configurations */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Settings size={22} style={{ color: 'var(--accent-cyan)' }} />
            Cấu Hình & Kết Nối API
          </h3>

          <div style={{
            background: 'rgba(141, 91, 76, 0.04)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              API BASE URL
            </div>
            <code style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
              {configBaseUrl}
            </code>
          </div>

          {/* Test Backend Service */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>1. Kết nối Backend Service</div>
              <button onClick={runPingTest} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} disabled={pingStatus === 'checking'}>
                <RefreshCw size={14} className={pingStatus === 'checking' ? 'spin' : ''} /> Kiểm tra
              </button>
            </div>

            {pingStatus === 'idle' && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chưa kiểm tra. Click để bắt đầu.</div>
            )}
            {pingStatus === 'checking' && (
              <div style={{ color: 'var(--warning)', fontSize: '0.9rem' }}>Đang thực hiện ping đến Backend...</div>
            )}
            {pingStatus === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} /> Kết nối thành công! (HTTP OK)
                </div>
                {pingData && (
                  <pre style={{
                    background: '#2d3748',
                    color: '#a0aec0',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    overflowX: 'auto',
                    margin: 0
                  }}>
                    {JSON.stringify(pingData, null, 2)}
                  </pre>
                )}
              </div>
            )}
            {pingStatus === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <XCircle size={16} /> Lỗi kết nối đến Backend
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--error)', background: 'rgba(211,47,47,0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                  {pingError}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  💡 <strong>Gợi ý:</strong> Đảm bảo container <code>etutor-backend</code> đang chạy (sử dụng lệnh <code>docker ps</code>). Backend chạy mặc định trên cổng <code>8081</code>.
                </div>
              </div>
            )}
          </div>

          {/* Test Admin Account */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>2. Kiểm tra Tài khoản Admin Mặc định</div>
              <button onClick={runAdminTest} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} disabled={adminStatus === 'checking'}>
                Thử Đăng Nhập
              </button>
            </div>

            {adminStatus === 'idle' && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Thử đăng nhập bằng <code>admin@etutor.com</code> / <code>admin123</code></div>
            )}
            {adminStatus === 'checking' && (
              <div style={{ color: 'var(--warning)', fontSize: '0.9rem' }}>Đang xác thực thông tin...</div>
            )}
            {adminStatus === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} /> Đăng nhập thành công!
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Đã tạo Token JWT hợp lệ. Bạn có thể áp dụng token này để kiểm thử trang Dashboard Admin.
                </div>
                <button 
                  onClick={() => applyTokenToSession({
                    accessToken: adminToken,
                    refreshToken: 'mock-refresh-token',
                    id: 1,
                    email: 'admin@etutor.com',
                    role: 'ADMIN',
                    fullName: 'Hệ Thống Admin'
                  })}
                  className="btn btn-primary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', alignSelf: 'flex-start' }}
                >
                  Gán Session Admin & Vào Admin Panel
                </button>
              </div>
            )}
            {adminStatus === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <XCircle size={16} /> Đăng nhập Admin thất bại
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--error)' }}>
                  {adminError}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  💡 <strong>Gợi ý:</strong> Kiểm tra xem tệp <code>schema.sql</code> hoặc <code>AdminInitializer.java</code> đã tạo tài khoản admin trong MySQL chưa. Kiểm tra kết nối container MySQL của bạn.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Custom Login Tester */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <ShieldCheck size={22} style={{ color: 'var(--accent-cyan)' }} />
            Bộ Kiểm Thử Đăng Nhập Thủ Công
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Nhập tài khoản bạn vừa đăng ký hoặc tài khoản bất kỳ để xem phản hồi chi tiết từ API Backend:
          </p>

          <form onSubmit={runCustomTest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Email kiểm thử</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="student@etutor.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Mật khẩu</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="password123"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={testStatus === 'checking'}>
              {testStatus === 'checking' ? 'Đang gửi Request...' : 'Gửi Request Đăng Nhập'}
            </button>
          </form>

          {/* Render Result */}
          {testStatus !== 'idle' && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Phản hồi từ API:</div>
              
              {testStatus === 'success' && testResult && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={16} /> HTTP 200 OK (Thành Công!)
                  </div>
                  <pre style={{
                    background: '#2d3748',
                    color: '#a0aec0',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    overflowX: 'auto',
                    margin: 0
                  }}>
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                  <button 
                    onClick={() => applyTokenToSession(testResult)}
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', alignSelf: 'flex-start' }}
                  >
                    Gán Token này vào LocalStorage & Tải Lại
                  </button>
                </>
              )}

              {testStatus === 'error' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <XCircle size={16} /> Lỗi Đăng Nhập
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--error)', background: 'rgba(211,47,47,0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                    {testError}
                  </div>
                  
                  {/* Smart Diagnostic Logic based on error message */}
                  <div style={{
                    background: 'rgba(197, 137, 64, 0.08)',
                    borderLeft: '4px solid var(--warning)',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <HelpCircle size={14} /> Ý nghĩa & Khắc phục:
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {testError.includes('Tài khoản gia sư chưa được phê duyệt') ? (
                        <span>
                          Gia sư này đăng ký nhưng chưa được duyệt. Bạn cần vào <strong>Admin Dashboard</strong> bằng tài khoản <code>admin@etutor.com</code> / <code>admin123</code>, tìm người dùng này và bấm kích hoạt (Toggle Verify) trước khi đăng nhập!
                        </span>
                      ) : testError.includes('Tài khoản hoặc mật khẩu không chính xác') ? (
                        <span>
                          Email này chưa tồn tại trong cơ sở dữ liệu hoặc mật khẩu nhập bị sai. Hãy sang trang <strong>Đăng ký</strong> để tạo mới tài khoản rồi thử lại.
                        </span>
                      ) : (
                        <span>
                          Có thể xảy ra lỗi kết nối mạng, CORS, hoặc lỗi server 500. Hãy kiểm tra tab <em>Network</em> trong F12 Console trình duyệt hoặc kiểm tra log backend.
                        </span>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Panel 3: LocalStorage & Current Session */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
              <Database size={22} style={{ color: 'var(--accent-cyan)' }} />
              Trạng Thái Session Hiện Tại (LocalStorage)
            </h3>
            {(storedUser || storedAccessToken) && (
              <button onClick={clearSession} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--error)' }}>
                <Trash2 size={14} /> Xóa Session (Đăng Xuất)
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {/* Stored User Object */}
            <div style={{ background: 'rgba(141, 91, 76, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>User Profile:</div>
              {storedUser ? (
                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><strong>Họ và tên:</strong> {storedUser.fullName}</div>
                  <div><strong>Email:</strong> {storedUser.email}</div>
                  <div><strong>Vai trò:</strong> <span className={`badge ${storedUser.role === 'ADMIN' ? 'badge-danger' : storedUser.role === 'TUTOR' ? 'badge-cyan' : 'badge-success'}`}>{storedUser.role}</span></div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <Link to={storedUser.role === 'ADMIN' ? '/admin' : '/dashboard'} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      Đi đến Panel của {storedUser.role}
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Không tìm thấy thông tin User. Bạn chưa đăng nhập.</div>
              )}
            </div>

            {/* Stored Access Token */}
            <div style={{ background: 'rgba(141, 91, 76, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Access Token (Bearer JWT):</div>
              {storedAccessToken ? (
                <code style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)', 
                  wordBreak: 'break-all', 
                  maxHeight: '120px', 
                  overflowY: 'auto',
                  background: '#ffffff',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)'
                }}>
                  {storedAccessToken}
                </code>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Chưa có Access Token.</div>
              )}
            </div>

            {/* Stored Refresh Token */}
            <div style={{ background: 'rgba(141, 91, 76, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Refresh Token:</div>
              {storedRefreshToken ? (
                <code style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)', 
                  wordBreak: 'break-all', 
                  maxHeight: '120px', 
                  overflowY: 'auto',
                  background: '#ffffff',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)'
                }}>
                  {storedRefreshToken}
                </code>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Chưa có Refresh Token.</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Manual testing guide */}
      <div className="glass-card" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, color: 'var(--accent-cyan)' }}>📖 Hướng dẫn Quy trình Test Đăng nhập Frontend</h3>
        <ol style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          <li>
            <strong>Kiểm tra Kết nối:</strong> Click nút <strong>Kiểm tra</strong> ở mục 1. Nếu kết quả hiện màu xanh là Frontend và Backend đã thông nhau qua cổng 8081.
          </li>
          <li>
            <strong>Tạo tài khoản thử nghiệm:</strong> Nếu bạn chưa có tài khoản, hãy truy cập trang <Link to="/register" style={{ fontWeight: 'bold' }}>Đăng Ký</Link>, điền đầy đủ thông tin (Học viên hoặc Gia sư) rồi bấm Đăng ký.
          </li>
          <li>
            <strong>Đăng nhập tài khoản Học viên (Student):</strong> Học viên đăng ký xong sẽ được kích hoạt tự động ở môi trường dev. Bạn có thể sử dụng thông tin đó để đăng nhập ở trang Login hoặc dùng <em>Bộ kiểm thử đăng nhập thủ công</em> trên trang này.
          </li>
          <li>
            <strong>Đăng nhập tài khoản Gia sư (Tutor) & Quy trình phê duyệt của Admin:</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
              <li>Nếu bạn đăng ký làm Gia sư, theo quy trình nghiệp vụ hệ thống, tài khoản Gia sư phải được phê duyệt trước khi đăng nhập.</li>
              <li>Nếu bạn đăng nhập ngay sẽ nhận được lỗi: <code>"Tài khoản gia sư chưa được phê duyệt bởi Quản trị viên!"</code>.</li>
              <li><strong>Cách giải quyết:</strong> Hãy bấm nút <strong>Gán Session Admin & Vào Admin Panel</strong> ở mục 2 trên trang này. Hệ thống sẽ tự động đăng nhập tài khoản <code>admin@etutor.com</code> và chuyển bạn đến Admin Dashboard. Tại đây, bạn chọn tab <strong>Tài khoản</strong>, tìm email Gia sư của mình, bấm <strong>Duyệt</strong> (nút Toggle Verify). Sau đó Đăng xuất Admin, và đăng nhập lại bằng tài khoản Gia sư của bạn thành công 100%!</li>
            </ul>
          </li>
        </ol>
      </div>

    </div>
  );
}
