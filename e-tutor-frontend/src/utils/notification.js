/**
 * Hệ thống Thông báo & Hộp thoại Tùy chỉnh Cao cấp (Custom Toast & Dialog System)
 * Thay thế cho alert() và confirm() mặc định của trình duyệt với thiết kế Glassmorphism hiện đại.
 */

// Tự động tiêm CSS cần thiết cho Toast và Alert vào document
const injectStyles = () => {
  if (document.getElementById('custom-notification-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'custom-notification-styles';
  styleEl.innerHTML = `
    /* Style cho Toast Container */
    #custom-toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }

    /* Style cho từng Toast */
    .custom-toast {
      min-width: 320px;
      max-width: 450px;
      padding: 16px 20px;
      border-radius: 12px;
      background: rgba(20, 20, 25, 0.85);
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.9rem;
      line-height: 1.4;
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: auto;
      transform: translateY(-20px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .custom-toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .custom-toast.hide {
      transform: scale(0.9);
      opacity: 0;
    }

    .custom-toast-icon {
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .custom-toast-success {
      border-left: 4px solid #10b981;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15);
    }
    .custom-toast-success .custom-toast-icon { color: #10b981; }

    .custom-toast-error {
      border-left: 4px solid #ef4444;
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.15);
    }
    .custom-toast-error .custom-toast-icon { color: #ef4444; }

    .custom-toast-info {
      border-left: 4px solid #66fcf1;
      box-shadow: 0 10px 30px rgba(102, 252, 241, 0.15);
    }
    .custom-toast-info .custom-toast-icon { color: #66fcf1; }

    .custom-toast-warning {
      border-left: 4px solid #f59e0b;
      box-shadow: 0 10px 30px rgba(245, 158, 11, 0.15);
    }
    .custom-toast-warning .custom-toast-icon { color: #f59e0b; }

    /* Style cho Dialog Overlay */
    .custom-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      padding: 20px;
    }

    .custom-dialog-overlay.show {
      opacity: 1;
    }

    /* Style cho Dialog Box */
    .custom-dialog-box {
      width: 100%;
      max-width: 480px;
      background: linear-gradient(135deg, #15151b 0%, #0d0d12 100%);
      border: 1px solid rgba(102, 252, 241, 0.15);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(102, 252, 241, 0.05);
      font-family: system-ui, -apple-system, sans-serif;
      color: #fff;
      transform: scale(0.9);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .custom-dialog-overlay.show .custom-dialog-box {
      transform: scale(1);
      opacity: 1;
    }

    .custom-dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .custom-dialog-title {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0;
      color: #fff;
    }

    .custom-dialog-body {
      font-size: 0.92rem;
      color: #a0aec0;
      line-height: 1.6;
      margin-bottom: 24px;
      text-align: left;
    }

    .custom-dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .custom-dialog-btn {
      padding: 10px 20px;
      font-size: 0.85rem;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .custom-dialog-btn-primary {
      background: linear-gradient(135deg, #66fcf1 0%, #45a29e 100%);
      color: #0b0c10;
    }
    .custom-dialog-btn-primary:hover {
      box-shadow: 0 0 15px rgba(102, 252, 241, 0.4);
      transform: translateY(-1px);
    }

    .custom-dialog-btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e0;
    }
    .custom-dialog-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  `;
  document.head.appendChild(styleEl);
};

// Đảm bảo CSS được tiêm khi load file
if (typeof document !== 'undefined') {
  injectStyles();
}

// 1. Tạo Toast Container
const getToastContainer = () => {
  let container = document.getElementById('custom-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'custom-toast-container';
    document.body.appendChild(container);
  }
  return container;
};

// 2. Xuất hàm Show Toast
export const showToast = (message, type = 'success') => {
  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = `custom-toast custom-toast-${type}`;

  let icon = '🔔';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'warning') icon = '⚠️';
  if (type === 'info') icon = 'ℹ️';

  toast.innerHTML = `
    <div class="custom-toast-icon">${icon}</div>
    <div style="flex-grow: 1;">${message}</div>
  `;

  container.appendChild(toast);

  // Trigger animation show
  setTimeout(() => toast.classList.add('show'), 10);

  // Tự động đóng sau 3.5 giây
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
};

// 3. Xuất hàm Show Alert (Hộp thoại thông báo tùy chỉnh)
export const showAlert = (title, message, type = 'info') => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';

    let icon = '💡';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    overlay.innerHTML = `
      <div class="custom-dialog-box">
        <div class="custom-dialog-header">
          <span style="font-size: 1.5rem;">${icon}</span>
          <h4 class="custom-dialog-title">${title}</h4>
        </div>
        <div class="custom-dialog-body">${message}</div>
        <div class="custom-dialog-footer">
          <button class="custom-dialog-btn custom-dialog-btn-primary" id="custom-alert-ok-btn">Đồng ý</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Mở animation
    setTimeout(() => overlay.classList.add('show'), 10);

    const closeAlert = () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        resolve(true);
      }, 300);
    };

    overlay.querySelector('#custom-alert-ok-btn').addEventListener('click', closeAlert);
  });
};

// 4. Xuất hàm Show Confirm (Hộp thoại xác nhận tùy chỉnh)
export const showConfirm = (title, message) => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';

    overlay.innerHTML = `
      <div class="custom-dialog-box">
        <div class="custom-dialog-header">
          <span style="font-size: 1.5rem; color: #f59e0b;">❓</span>
          <h4 class="custom-dialog-title">${title}</h4>
        </div>
        <div class="custom-dialog-body">${message}</div>
        <div class="custom-dialog-footer">
          <button class="custom-dialog-btn custom-dialog-btn-secondary" id="custom-confirm-cancel-btn">Hủy bỏ</button>
          <button class="custom-dialog-btn custom-dialog-btn-primary" id="custom-confirm-yes-btn">Xác nhận</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Mở animation
    setTimeout(() => overlay.classList.add('show'), 10);

    const handleAction = (isConfirmed) => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        resolve(isConfirmed);
      }, 300);
    };

    overlay.querySelector('#custom-confirm-yes-btn').addEventListener('click', () => handleAction(true));
    overlay.querySelector('#custom-confirm-cancel-btn').addEventListener('click', () => handleAction(false));
  });
};
