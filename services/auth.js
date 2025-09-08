// src/services/auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

// Ưu tiên lấy từ app.json -> extra.API_URL.
// Fallback sang EXPO_PUBLIC_API_BASE_URL nếu bạn dùng biến môi trường kiểu Expo.
const API_URL =
  Constants.expoConfig?.extra?.API_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'http://localhost:3000';

console.log('▶️ Using API_URL =', API_URL);

const API = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Gắn token vào mọi request
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tuỳ chọn: bắt 401/403 để tự logout
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(err);
  }
);

// ====== AUTH APIS ======

// Đăng ký (backend yêu cầu name, không phải fullname)
export const signUp = async ({ name, email, password }) => {
  const { data } = await API.post('/api/auth/register', { name, email, password });
  // Backend của bạn không trả token khi register, chỉ trả user.
// Nếu bạn muốn login ngay sau register, hãy gọi logIn phía UI sau khi signUp.
  return data; // { success, message, user: { id, name, email } }
};

// Đăng nhập
export const logIn = async ({ email, password }) => {
  const { data } = await API.post('/api/auth/login', { email, password });
  // data: { success, message, token, user }
  if (data?.token) {
    await AsyncStorage.setItem('token', data.token);
  }
  if (data?.user) {
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
};

// Lấy profile (cần token)
export const getProfile = async () => {
  const { data } = await API.get('/api/auth/profile');
  // data: { success, user: { id, email, name } }
  if (data?.user) {
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
};

// Đăng xuất
export const logout = async () => {
  await AsyncStorage.multiRemove(['token', 'user']);
};

// Helper lấy user/token trong app
export const getStoredUser = async () => {
  const txt = await AsyncStorage.getItem('user');
  return txt ? JSON.parse(txt) : null;
};

export const getStoredToken = () => AsyncStorage.getItem('token');

export default API;
