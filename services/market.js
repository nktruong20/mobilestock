// services/stock.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ⚠️ Đổi IP nếu backend chạy ở máy khác
const API_BASE = 'http://192.168.1.30:3000';

// Hàm helper để lấy token và gắn vào header
async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

// ===== STOCK API =====

// Lấy toàn bộ danh sách cổ phiếu (có isFavorite)
export async function getStocks() {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}/stocks`, { headers });
  return res.data;
}

// Lấy thông tin 1 mã cụ thể
export async function searchStock(symbol) {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/price/${symbol}`, { headers });
    return res.data;
  } catch (err) {
    return null;
  }
}

// Thêm mã mới
export async function addStock(symbol, buyPrice) {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/stocks`, { code: symbol, buyPrice }, { headers });
  return res.data;
}

// Toggle trạng thái yêu thích
export async function toggleFavorite(code) {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/stocks/${code}/favorite`, {}, { headers });
  return res.data; // { success: true, isFavorite: boolean }
}

// Lấy danh sách stock yêu thích
export async function getFavorites() {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}/stocks/favorites`, { headers });
  return res.data; // { success: true, stocks: [...] }
}

// ===== AUTH API =====

// Đăng ký
export async function signup(fullname, email, password) {
  const res = await axios.post(`${API_BASE}/api/signup`, { fullname, email, password });
  if (res.data.success) {
    await AsyncStorage.setItem('token', res.data.token);
  }
  return res.data;
}

// Đăng nhập
export async function login(email, password) {
  const res = await axios.post(`${API_BASE}/api/login`, { email, password });
  if (res.data.success) {
    await AsyncStorage.setItem('token', res.data.token);
  }
  return res.data;
}

// Lấy thông tin user
export async function getMe() {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}/api/me`, { headers });
  return res.data;
}
