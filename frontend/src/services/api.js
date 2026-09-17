import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stockpilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 / 403 Unauthorized & Expired Tokens
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isTokenError = status === 401 || (status === 403 && String(error.response?.data?.message || '').toLowerCase().includes('token'));

    if (isTokenError && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('stockpilot_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/api/v1/auth/refresh`, { refreshToken });
          if (res.data?.data?.accessToken) {
            localStorage.setItem('stockpilot_token', res.data.data.accessToken);
            if (res.data.data.refreshToken) {
              localStorage.setItem('stockpilot_refresh_token', res.data.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
            return axios(originalRequest);
          }
        } catch {
          localStorage.removeItem('stockpilot_token');
          localStorage.removeItem('stockpilot_refresh_token');
          localStorage.removeItem('stockpilot_user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('stockpilot_token');
        localStorage.removeItem('stockpilot_refresh_token');
        localStorage.removeItem('stockpilot_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
