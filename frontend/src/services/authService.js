import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Debug base URL selection
// eslint-disable-next-line no-console
console.log('[authService] Using real backend:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const parseSpringBootMessage = (data) => {
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.join(', ');
  if (data?.message) return data.message;
  try { return JSON.stringify(data); } catch { return 'Unknown error'; }
};

const synthesizeUserFromLoginSuccess = (identifier, message) => {
  let username = identifier?.includes('@') ? identifier.split('@')[0] : identifier;
  const match = typeof message === 'string' && message.includes('Welcome')
    ? message.split('Welcome').pop().trim()
    : null;
  if (match) username = match;
  return {
    id: 'local-session',
    name: username || 'User',
    email: identifier && identifier.includes('@') ? identifier : `${username || 'user'}@local`,
  };
};

const attemptLogin = async (identifier, password) => {
  const isEmail = typeof identifier === 'string' && identifier.includes('@');

  const attempts = [
    { url: '/auth/user/login', body: { loginId: identifier, password } }
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      // eslint-disable-next-line no-console
      console.log('[authService] login attempt', attempt.url, attempt.body);
      const res = await api.post(attempt.url, attempt.body);
      const data = res.data;
      // eslint-disable-next-line no-console
      console.log('[authService] login response', data);
      if (typeof data === 'string') {
        return { token: 'local-session', user: synthesizeUserFromLoginSuccess(identifier, data) };
      }
      if (data?.token && data?.user) return data;
      if (data?.username || data?.email) {
        return { token: 'local-session', user: {
          id: data.id || 'local-session',
          name: data.username || data.name || identifier,
          email: data.email || (isEmail ? identifier : `${identifier}@local`),
        }};
      }
      return { token: 'local-session', user: synthesizeUserFromLoginSuccess(identifier, 'Login successful') };
    } catch (err) {
      lastError = err;
      // eslint-disable-next-line no-console
      console.warn('[authService] login failed attempt', attempt.url, err?.response?.data || err?.message);
      continue;
    }
  }

  const message = parseSpringBootMessage(lastError?.response?.data) || lastError?.message || 'Login failed';
  throw new Error(message);
};

const authService = {
  async login(identifier, password) {
    return attemptLogin(identifier, password);
  },

  async register(name, email, password) {
    try {
      const res = await api.post('/auth/user/register', { username: name, email, password });
      // backend now returns a safe payload with only id/username/email/message
      const payload = res.data;
      const message = payload?.message || 'Registration successful';
      return { message };
    } catch (error) {
      const msg = parseSpringBootMessage(error?.response?.data) || error?.message || 'Registration failed';
      throw new Error(msg);
    }
  },

  async verifyToken(token) {
    // If backend exposes a verification endpoint, prefer calling it here.
    // For now, accept the locally stored token and return the stored user to keep session after reload.
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) return JSON.parse(storedUser);
      throw new Error('No stored user');
    } catch (err) {
      throw new Error('Invalid token');
    }
  },

  async forgotPassword(email) {
      try {
        const res = await api.post('/auth/user/forgot-password', { loginId: email });
        return res.data;
      } catch (error) {
        // If the request failed to connect (container/host networking), try a common Docker-for-Windows host alias
        const isConnRefused = error?.code === 'ECONNREFUSED' || (error?.message || '').toLowerCase().includes('connection refused');
        if (isConnRefused && API_BASE_URL.includes('localhost')) {
          const altBase = API_BASE_URL.replace('localhost', 'host.docker.internal');
          // eslint-disable-next-line no-console
          console.warn('[authService] primary API unreachable, retrying with', altBase);
          try {
            const retry = await axios.post(`${altBase}/auth/user/forgot-password`, { loginId: email }, { headers: { 'Content-Type': 'application/json' } });
            return retry.data;
          } catch (retryErr) {
            // fall through to normal error handling
            // eslint-disable-next-line no-console
            console.error('[authService] retry with host.docker.internal failed', retryErr?.message || retryErr);
          }
        }

        const msg = parseSpringBootMessage(error?.response?.data) || error?.message || 'Failed to process request';
        throw new Error(msg);
      }
  },

  async changePassword(loginId, oldPassword, newPassword) {
    try {
      const res = await api.post('/auth/user/change-password', { loginId, oldPassword, newPassword });
      return res.data;
    } catch (error) {
      const msg = parseSpringBootMessage(error?.response?.data) || error?.message || 'Failed to change password';
      throw new Error(msg);
    }
  },

  async resetPassword(token, password) {
    try {
      const res = await api.post('/auth/user/reset-password', { token, password });
      return res.data;
    } catch (error) {
      const msg = parseSpringBootMessage(error?.response?.data) || error?.message || 'Failed to reset password';
      throw new Error(msg);
    }
  },

  async verifyOtp(email, otp) {
    try {
      const res = await api.post('/auth/user/verify-otp', { email, otp });
      return res.data;
    } catch (error) {
      const msg = parseSpringBootMessage(error?.response?.data) || error?.message || 'Invalid OTP';
      throw new Error(msg);
    }
  },

  async resendOtp(email) {
    try {
      const res = await api.post('/auth/user/resend-otp', { email });
      return res.data;
    } catch (error) {
      const msg = parseSpringBootMessage(error?.response?.data) || error?.message || 'Failed to resend OTP';
      throw new Error(msg);
    }
  },

  async getCurrentUser() {
    throw new Error('Not implemented');
  }
};

// Export the axios instance so other services (chat, weather, etc.) can reuse it
export { authService, attemptLogin, api };
