import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor đính kèm Access Token vào mọi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor tự động làm mới Access Token (Refresh Token) khi gặp lỗi 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Không can thiệp hoặc tự động refresh token/chuyển hướng đối với các API auth cơ bản (đăng nhập, đăng ký)
    if (originalRequest && (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register'))) {
      return Promise.reject(error);
    }

    // Nếu gặp lỗi 401 và request chưa được thử lại (để tránh lặp vô tận)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Gọi API refresh token
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken } = res.data;

        // Lưu Access Token mới
        localStorage.setItem('accessToken', accessToken);

        // Cập nhật header cho request ban đầu và thực hiện lại
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Nếu refresh token cũng hết hạn, thực hiện logout người dùng
        console.error('Refresh token expired or invalid', refreshError);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
