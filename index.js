// index.js
import { registerRootComponent } from 'expo';
import App from './App';

// Đây sẽ tự động inject vào cả native và web
registerRootComponent(App);
