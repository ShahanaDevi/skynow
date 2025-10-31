// src/services/chatService.js
import axios from "axios";

// Normalize API base so consumers can set REACT_APP_API_URL either to the root (e.g. http://localhost:8080)
// or include the /api path (e.g. http://backend:8080/api). This prevents double "/api/api" and
// avoids trailing slash issues.
let API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";
API_BASE = String(API_BASE).trim();
// remove trailing slashes
API_BASE = API_BASE.replace(/\/+$/g, '');
// if the value already ends with /api, use it as-is, otherwise append /api
const API_BASE_URL = API_BASE.toLowerCase().endsWith('/api') ? API_BASE : `${API_BASE}/api`;

const chatService = {
  async sendMessage(message) {
    const res = await axios.get(`${API_BASE_URL}/ask`, { params: { query: message } });
    return res.data;
  },

  async translateText(text, lang) {
    const res = await axios.get(`${API_BASE_URL}/translate`, {
      params: { forecast: text, lang },
    });
    return res.data;
  },
};

export default chatService;
