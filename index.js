// index.js

// 1) URL polyfill cho Hermes
import 'react-native-url-polyfill/auto';

// 2) Đăng ký root component qua Expo
import { registerRootComponent } from 'expo';
import App from './App'; // chắc chắn là './App', đúng tên file App.js bạn có

registerRootComponent(App);
