import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ArrowLeft, CreditCard, Wallet, ShieldCheck, CheckCircle2, 
  QrCode, AlertTriangle, FileText, Check, Landmark, RefreshCw, Coins
} from 'lucide-react';

export default function Checkout() {
  const { classId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [classDetail, setClassDetail] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, frozenBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('WALLET'); // WALLET or BANK_QR
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchCheckoutData();
  }, [classId]);

  const fetchCheckoutData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Tải ví tiền người dùng
      const walletRes = await api.get('/wallet');
      setWallet(walletRes.data);

      // 2. Tải danh sách lớp để lấy lớp tương ứng
      const classesRes = await api.get('/class');
      const foundClass = classesRes.data.find(c => c.id === parseInt(classId));
      
      if (!foundClass) {
        // Nếu không tìm thấy lớp thật (ví dụ lớp mock), chúng ta tạo thông tin mock chất lượng cao để test
        setClassDetail({
          id: parseInt(classId),
          title: classId === '101' ? "Cần Gia sư Toán lớp 12 ôn thi THPT Quốc Gia" : 
                 classId === '102' ? "Gia sư Tiếng Anh Giao tiếp người đi làm từ con số 0" :
                 classId === '103' ? "Bồi dưỡng Vật lý lớp 10 học chương trình mới" : "Lớp học yêu cầu chuyên sâu",
          hourlyRate: classId === '101' ? 200000 : classId === '102' ? 250000 : 180000,
          totalLessons: classId === '101' ? 15 : classId === '102' ? 20 : 12,
          description: "Thông tin chi tiết lớp học đang chờ kết nối thanh toán bảo chứng Escrow.",
          status: 'WAITING_PAYMENT',
          isMock: true
        });
      } else {
        setClassDetail(foundClass);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải thông tin thanh toán từ hệ thống!');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    try {
      setError('');
      setProcessing(true);

      const totalAmount = classDetail.hourlyRate * classDetail.totalLessons;

      if (paymentMethod === 'BANK_QR') {
        if (wallet.balance < totalAmount) {
          const neededAmount = totalAmount - wallet.balance;
          await api.post(`/wallet/deposit?amount=${neededAmount}`);
        }
      } else if (paymentMethod === 'WALLET') {
        if (wallet.balance < totalAmount) {
          throw new Error('Số dư ví khả dụng của bạn không đủ! Hãy chọn phương thức chuyển khoản ngân hàng hoặc nạp thêm tiền.');
        }
      }

      // Thực hiện thanh toán thực tế qua API
      if (classDetail.isMock) {
        setPaymentSuccess(true);
      } else {
        await api.post(`/class/${classId}/pay?method=${paymentMethod}`);
        setPaymentSuccess(true);
      }
    } catch (err) {
      setError(err.message || err.response?.data?.error || 'Thanh toán thất bại! Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" />
        <span style={{ color: 'var(--accent-cyan)' }}>Đang tạo hóa đơn thanh toán...</span>
      </div>
    );
  }

  const totalAmount = classDetail ? classDetail.hourlyRate * classDetail.totalLessons : 0;
  const isBalanceSufficient = wallet.balance >= totalAmount;

  // Render màn hình thanh toán thành công
  if (paymentSuccess) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem 1rem' }}>
        <div className="glass-card" style={{ maxWidth: '580px', width: '100%', textAlign: 'center', padding: '3rem 2rem', border: '1px solid var(--success)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(78, 110, 88, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <CheckCircle2 size={44} />
          </div>
          
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Thanh Toán Thành Công!</h2>
          <p style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '2rem' }}>
            Mã hóa đơn: #ET-{classDetail.id}-{Date.now().toString().slice(-4)}
          </p>

          <div style={{ background: 'rgba(141, 91, 76, 0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Lớp học:</span>
              <strong style={{ color: 'var(--text-primary)', maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{classDetail.title}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Số tiền đã đóng băng:</span>
              <strong style={{ color: 'var(--accent-pink)' }}>{totalAmount.toLocaleString('vi-VN')} đ</strong>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.25rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Học phí đã được chuyển vào **Ví bảo chứng Escrow**. Tiền chỉ được giải ngân từng buổi sau khi bạn xác nhận nghiệm thu buổi học.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/dashboard" className="btn btn-primary" style={{ flexGrow: 1, padding: '0.8rem' }}>
              Vào Dashboard Lớp học
            </Link>
            <Link to="/" className="btn btn-secondary" style={{ padding: '0.8rem' }}>
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Mini Header */}
      <nav className="dashboard-header" style={{ padding: '1rem 2rem' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Quay lại Dashboard
        </Link>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: 'var(--text-primary)' }}>Hóa đơn thanh toán bảo chứng</span>
      </nav>

      {/* Main Container */}
      <div style={{ flexGrow: 1, maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '3rem 2rem' }}>
        
        {error && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'none' }}>
            <AlertTriangle size={16} /> <strong>Lỗi:</strong> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* LEFT: Checkout invoice items & Payment options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Invoice Breakdown */}
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', color: 'var(--text-primary)' }}>
                <FileText size={20} style={{ color: 'var(--accent-cyan)' }} /> Chi Tiết Hóa Đơn Thanh Toán
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tên Lớp Học</span>
                  <strong style={{ display: 'block', fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>{classDetail.title}</strong>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Học phí một buổi</span>
                    <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{classDetail.hourlyRate.toLocaleString('vi-VN')} đ/buổi</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tổng thời lượng</span>
                    <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{classDetail.totalLessons} buổi học</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>TỔNG CỘNG HỌC PHÍ:</span>
                  <strong style={{ fontSize: '1.6rem', color: 'var(--accent-pink)' }}>{totalAmount.toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>
            </div>

            {/* Select Payment Method */}
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Phương Thức Thanh Toán</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                {/* Method 1: Wallet Balance */}
                <div 
                  onClick={() => setPaymentMethod('WALLET')}
                  style={{
                    border: `1px solid ${paymentMethod === 'WALLET' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    background: paymentMethod === 'WALLET' ? 'rgba(141,91,76,0.05)' : 'rgba(255,255,255,0.6)',
                    padding: '1.25rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Wallet size={24} style={{ color: paymentMethod === 'WALLET' ? 'var(--accent-cyan)' : 'var(--text-secondary)' }} />
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>Thanh toán bằng số dư Ví E-Tutor</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Số dư khả dụng: <strong style={{ color: isBalanceSufficient ? 'var(--success)' : 'var(--accent-pink)' }}>{wallet.balance.toLocaleString('vi-VN')} đ</strong>
                      </span>
                    </div>
                  </div>
                  {paymentMethod === 'WALLET' && <div style={{ background: 'var(--accent-cyan)', borderRadius: '50%', padding: '2px', color: '#fff' }}><Check size={14} strokeWidth={3} /></div>}
                </div>

                {/* Method 2: Bank QR Transfer */}
                <div 
                  onClick={() => setPaymentMethod('BANK_QR')}
                  style={{
                    border: `1px solid ${paymentMethod === 'BANK_QR' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    background: paymentMethod === 'BANK_QR' ? 'rgba(141,91,76,0.05)' : 'rgba(255,255,255,0.6)',
                    padding: '1.25rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Landmark size={24} style={{ color: paymentMethod === 'BANK_QR' ? 'var(--accent-cyan)' : 'var(--text-secondary)' }} />
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>Chuyển khoản Ngân hàng (Mã QR)</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quét mã QR để hoàn tất nạp & thanh toán ngay lập tức</span>
                    </div>
                  </div>
                  {paymentMethod === 'BANK_QR' && <div style={{ background: 'var(--accent-cyan)', borderRadius: '50%', padding: '2px', color: '#fff' }}><Check size={14} strokeWidth={3} /></div>}
                </div>

                {/* Method 3: Cash Payment */}
                <div 
                  onClick={() => setPaymentMethod('CASH')}
                  style={{
                    border: `1px solid ${paymentMethod === 'CASH' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    background: paymentMethod === 'CASH' ? 'rgba(141,91,76,0.05)' : 'rgba(255,255,255,0.6)',
                    padding: '1.25rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Coins size={24} style={{ color: paymentMethod === 'CASH' ? 'var(--accent-cyan)' : 'var(--text-secondary)' }} />
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>Thanh toán bằng Tiền mặt trực tiếp</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Học viên thanh toán tay cho Gia sư (Không qua ví Escrow của sàn)</span>
                    </div>
                  </div>
                  {paymentMethod === 'CASH' && <div style={{ background: 'var(--accent-cyan)', borderRadius: '50%', padding: '2px', color: '#fff' }}><Check size={14} strokeWidth={3} /></div>}
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT: Pay CTA Box & QR mock */}
          <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Wallet payment check */}
            {paymentMethod === 'WALLET' ? (
              <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Xác nhận Ví</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Học phí cần thanh toán:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{totalAmount.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ví khả dụng:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{wallet.balance.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Số dư sau thanh toán:</span>
                    <strong style={{ color: isBalanceSufficient ? 'var(--success)' : 'var(--accent-pink)' }}>
                      {isBalanceSufficient ? (wallet.balance - totalAmount).toLocaleString('vi-VN') + ' đ' : 'Không đủ số dư'}
                    </strong>
                  </div>
                </div>

                {!isBalanceSufficient ? (
                  <div style={{ background: 'rgba(236,72,153,0.03)', border: '1px dashed rgba(236,72,153,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', color: 'var(--accent-pink)' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>Học phí lớn hơn số dư ví khả dụng. Vui lòng nạp thêm tiền hoặc chọn phương thức khác!</span>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(16,185,129,0.03)', border: '1px dashed rgba(16,185,129,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', color: 'var(--success)' }}>
                    <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                    <span>Số dư khả dụng đủ điều kiện. Tiền học phí sẽ được chuyển vào ví đóng băng trung gian của hệ thống.</span>
                  </div>
                )}

                <button 
                  onClick={handlePay} 
                  className="btn btn-primary w-100" 
                  disabled={processing || !isBalanceSufficient}
                  style={{ padding: '0.8rem' }}
                >
                  {processing ? 'Đang thực hiện thanh toán...' : 'Thanh toán & Kích hoạt'}
                </button>
              </div>
            ) : paymentMethod === 'CASH' ? (
              <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Xác nhận Tiền mặt</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Học phí chốt lớp:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{totalAmount.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Hình thức:</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>Giao dịch tiền mặt trực tiếp</strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.03)', border: '1px dashed rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', color: '#fbbf24' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <span>Hai bên tự thỏa thuận thời điểm giao nhận tiền mặt. Hệ thống chỉ hỗ trợ ghi nhận và rải lịch học tự động cho lớp học.</span>
                </div>

                <button 
                  onClick={handlePay} 
                  className="btn btn-primary w-100" 
                  disabled={processing}
                  style={{ padding: '0.8rem' }}
                >
                  {processing ? 'Đang kích hoạt...' : 'Xác nhận & Kích hoạt'}
                </button>
              </div>
            ) : (
              /* QR Code Mock Payment */
              <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--text-primary)', textAlign: 'left' }}>Chuyển Khoản Nhanh VietQR</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'left', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Quét mã QR dưới đây bằng ứng dụng Ngân hàng (Mobile Banking) của bạn để thanh toán tự động nạp & chốt lớp.
                </p>

                {/* QR Code Graphic Mockup */}
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem', border: '3px solid var(--accent-cyan)' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={180} style={{ color: '#0b0c10' }} />
                    <Landmark size={28} style={{ position: 'absolute', color: 'var(--accent-purple)', background: '#fff', padding: '4px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                  </div>
                </div>

                <div style={{ background: 'rgba(141, 91, 76, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.82rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ngân hàng:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>MB BANK (Ngân hàng Quân Đội)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Số tài khoản:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>1902 2026 8888</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Số tiền chuyển:</span>
                    <strong style={{ color: 'var(--success)' }}>{totalAmount.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Nội dung chuyển:</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>NAP ETUTOR {classId}</strong>
                  </div>
                </div>

                <button 
                  onClick={handlePay} 
                  className="btn btn-accent w-100" 
                  disabled={processing}
                  style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {processing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Đang kiểm tra giao dịch...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Xác Nhận Đã Chuyển Khoản
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
