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
