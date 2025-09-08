import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.REACT_NATIVE_API_URL ||
  'http://192.168.1.30:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) return Promise.reject(new Error('Bạn chưa đăng nhập (401). Vui lòng đăng nhập lại.'));
    if (status === 403) return Promise.reject(new Error('Token không hợp lệ hoặc đã hết hạn (403). Vui lòng đăng nhập lại.'));
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Có lỗi mạng/xử lý. Vui lòng thử lại.';
    return Promise.reject(new Error(message));
  }
);

async function requestProtected(method, url, { data, params } = {}) {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Bạn chưa đăng nhập (thiếu token). Vui lòng đăng nhập lại.');
  const res = await api.request({ method, url, data, params });
  return res.data;
}

const newschatService = {
  // CHỈNH: truyền conversationId nếu có
  async askChat(query, opts = {}) {
    if (!query?.trim()) throw new Error('Thiếu câu hỏi');
    const params = opts.debug ? { debug: '1' } : undefined;
    const data = { query };
    if (opts.conversationId) data.conversationId = opts.conversationId;
    return requestProtected('POST', '/chat/query', { data, params });
  },

  async getChatHistory() {
    return requestProtected('GET', '/chat/history');
  },

  async fetchStockToday(symbol) {
    if (!symbol) throw new Error('Thiếu mã cổ phiếu');
    return requestProtected('POST', '/stock-info', { data: { symbol } });
  },
  async fetchStockYesterday(symbol) {
    if (!symbol) throw new Error('Thiếu mã cổ phiếu');
    return requestProtected('POST', '/stock-info/yesterday', { data: { symbol } });
  },
  async fetchStockByDate(symbol, date) {
    if (!symbol) throw new Error('Thiếu mã cổ phiếu');
    if (!date) throw new Error('Thiếu ngày (YYYY-MM-DD)');
    return requestProtected('POST', '/stock-info/by-date', { data: { symbol, date } });
  },
  async fetchStockRange(symbol, days = 7) {
    if (!symbol) throw new Error('Thiếu mã cổ phiếu');
    if (!days || days <= 0) throw new Error('Số ngày không hợp lệ');
    return requestProtected('POST', '/stock-info/range', { data: { symbol, days } });
  },
};

export default newschatService;
