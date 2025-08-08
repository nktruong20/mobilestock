// src/services/market.js
import API from './auth';

export async function getHistory(symbol, period = '1m') {
  try {
    const resp = await API.get('/api/history', {
      params: { symbol, period },
    });
    // resp.data.history là mảng [{ date, open, high, low, close, volume }, ...]
    return Array.isArray(resp.data.history) ? resp.data.history : [];
  } catch (e) {
    console.warn('getHistory error', e);
    return [];
  }
}
export async function getSymbols(q) {
  try {
    const resp = await API.get('/api/symbols', { params: { q } });
    return resp.data.symbols || [];
  } catch {
    return [];
  }
}

export async function addSymbol(code) {
  try {
    const resp = await API.post('/api/symbols', { code });
    // trả về đối tượng { code: 'XXX' }
    return resp.data;
  } catch (e) {
    // ném lỗi để component xử lý dưới dạng Alert
    throw e;
  }
}
