import { api } from './authService';

const chatService = {
  sendMessage: async (message) => {
    // include currently logged in user's name (if any) so backend can personalize replies
    let username = null;
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        username = u?.name || u?.username || null;
      }
    } catch (e) {
      // ignore parsing errors
    }

    const payload = { message, username };
    const res = await api.post('/chat/message', payload);
    return res.data;
  }
};

export default chatService;
