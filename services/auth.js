// src/services/auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const { expoConfig } = Constants;
const API_URL = expoConfig.extra.API_URL;  // http://192.168.1.19:3000

console.log('▶️ Using API_URL =', API_URL);

const API = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

API.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const signUp = async ({ fullname, email, password }) => {
  const { data } = await API.post('/api/signup', { fullname, email, password });
  await AsyncStorage.setItem('token', data.token);
  return data;
};

export const logIn = async ({ email, password }) => {
  const { data } = await API.post('/api/login', { email, password });
  await AsyncStorage.setItem('token', data.token);
  return data;
};

export default API;
