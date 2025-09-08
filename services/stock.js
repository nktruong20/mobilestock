import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.REACT_NATIVE_API_URL ||
  'http://192.168.1.30:3000/api';

/**
 * 👉 axios instance dùng chung: tự gắn Bearer token cho MỌI request
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
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
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Có lỗi mạng/xử lý. Vui lòng thử lại.';
    return Promise.reject(new Error(message));
  }
);

// =====================
// Utils
// =====================

function stripHtml(html = '') {
  try {
    const noCdata = html.replace(/<!\[CDATA\[|\]\]>/g, '');
    return noCdata.replace(/<\/?[^>]+(>|$)/g, '').replace(/\s+/g, ' ').trim();
  } catch {
    return html;
  }
}

function getTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function normalizeNewsLink(link = '') {
  try {
    const url = new URL(link);
    const orig = url.searchParams.get('url');
    return orig || link;
  } catch {
    return link;
  }
}

function parseGoogleNewsRss(xml) {
  const channelTitle = stripHtml(getTag(xml, 'title'));
  const out = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch;
  while ((itemMatch = itemRe.exec(xml)) !== null) {
    const block = itemMatch[1];

    const title = stripHtml(getTag(block, 'title'));
    const linkRaw = stripHtml(getTag(block, 'link'));
    const link = normalizeNewsLink(linkRaw);
    const pubDate = stripHtml(getTag(block, 'pubDate'));
    const description = stripHtml(getTag(block, 'description')) || '';

    const sourceName = stripHtml(getTag(block, 'source'));
    const sourceUrlMatch = block.match(/<source[^>]*url="([^"]+)"/i);
    const sourceUrl = sourceUrlMatch ? sourceUrlMatch[1] : '';

    let imageUrl = '';
    const mediaContent = block.match(/<media:content[^>]*url="([^"]+)"/i);
    const mediaThumb = block.match(/<media:thumbnail[^>]*url="([^"]+)"/i);
    const enclosure = block.match(/<enclosure[^>]*url="([^"]+)"/i);
    imageUrl =
      (mediaContent && mediaContent[1]) ||
      (mediaThumb && mediaThumb[1]) ||
      (enclosure && enclosure[1]) ||
      '';

    out.push({
      title,
      link,
      pubDate,
      description,
      source: { name: sourceName, url: sourceUrl },
      imageUrl,
    });
  }
  return { channel: channelTitle, items: out };
}

function buildNewsParams({ range, hl = 'vi', gl = 'VN', limit, enrich } = {}) {
  const params = new URLSearchParams();
  if (range) params.set('range', range); // 1d, 7d, 30d...
  if (hl) params.set('hl', hl);
  if (gl) params.set('gl', gl);
  if (limit) params.set('limit', String(limit));
  if (typeof enrich !== 'undefined') params.set('enrich', String(enrich)); // '0' | '1'
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// =====================
// Stock service (TẤT CẢ dùng `api`)
// =====================

/**
 * Hàm trả về thông tin chi tiết của 1 mã cổ phiếu.
 * range: "today" | "yesterday" | "3days" | "week"
 * TODO: Sau này thay bằng call API thật khi backend có endpoint!
 */
async function getStockDetails(symbol, range = "today") {
  await new Promise((r) => setTimeout(r, 400));
  switch (range) {
    case "today":
      return {
        symbol: symbol.toUpperCase(),
        openTime: "09:00",
        closeTime: "15:00",
        openPrice: 101000,
        closePrice: 103400,
        highPrice: 104200,
        lowPrice: 99800,
        volume: 2000000,
        value: 204000000000,
        referencePrice: 101000,
        ceilingPrice: 108000,
        floorPrice: 94000,
        priceChange: 2400,
        priceChangePercent: 2.4,
        liquidityCompare: "Cao hơn trung bình 3 ngày",
        rsi14: 68,
        rsiStatus: "Gần quá mua",
        recommendation: "NÊN MUA",
        analysis: "Giá duy trì xu hướng tăng tốt, thanh khoản ổn định. RSI tiệm cận vùng quá mua, nên cân nhắc chốt lời ngắn hạn nếu đã có lãi. Nhà đầu tư mới có thể giải ngân 1 phần, ưu tiên theo dõi sát diễn biến thị trường.",
        news: [],
      };
    case "yesterday":
      return {
        symbol: symbol.toUpperCase(),
        openTime: "09:00",
        closeTime: "15:00",
        openPrice: 99500,
        closePrice: 100800,
        highPrice: 101500,
        lowPrice: 99200,
        volume: 1888000,
        value: 192000000000,
        referencePrice: 99500,
        ceilingPrice: 107500,
        floorPrice: 91500,
        priceChange: 1300,
        priceChangePercent: 1.3,
        liquidityCompare: "Thấp hơn trung bình 10 ngày",
        rsi14: 61,
        rsiStatus: "Trung bình",
        recommendation: "THEO DÕI",
        analysis: "Giá đi ngang, thanh khoản thấp hơn bình quân. Chờ tín hiệu rõ ràng hơn.",
        news: [],
      };
    case "3days":
      return {
        symbol: symbol.toUpperCase(),
        openTime: "09:00",
        closeTime: "15:00",
        openPrice: 98000,
        closePrice: 103400,
        highPrice: 104200,
        lowPrice: 97000,
        volume: 5800000,
        value: 570000000000,
        referencePrice: 96000,    // Giá tham chiếu đầu kỳ 3 ngày
        ceilingPrice: 106000,
        floorPrice: 95000,
        priceChange: 7400,        // 103400 - 96000
        priceChangePercent: 7.7,  // ((103400-96000)/96000*100).toFixed(1)
        liquidityCompare: "Cao hơn trung bình 3 ngày",
        rsi14: 70,
        rsiStatus: "Quá mua",
        recommendation: "CÂN NHẮC CHỐT LỜI",
        analysis: "Giá tăng mạnh trong 3 ngày, thanh khoản cao, RSI vượt ngưỡng quá mua. Nên cân nhắc chốt lời ngắn hạn nếu đã có lợi nhuận.",
        news: [],
      };
    case "week":
      return {
        symbol: symbol.toUpperCase(),
        openTime: "09:00",
        closeTime: "15:00",
        openPrice: 95500,
        closePrice: 103400,
        highPrice: 105000,
        lowPrice: 95000,
        volume: 11200000,
        value: 1110000000000,
        referencePrice: 95000,     // Giá tham chiếu đầu tuần
        ceilingPrice: 104500,
        floorPrice: 90000,
        priceChange: 8400,         // 103400 - 95000
        priceChangePercent: 8.8,   // ((103400-95000)/95000*100).toFixed(1)
        liquidityCompare: "Cao hơn trung bình 3 ngày",
        rsi14: 73,
        rsiStatus: "Quá mua mạnh",
        recommendation: "KHÔNG MUA ĐUỔI",
        analysis: "Giá tăng nóng cả tuần, rủi ro điều chỉnh ngắn hạn cao. Nhà đầu tư nên cân nhắc hạn chế mua mới, có thể chốt lời dần.",
        news: [],
      };
    default:
      return {
        symbol: symbol.toUpperCase(),
        openTime: "--",
        closeTime: "--",
        openPrice: null,
        closePrice: null,
        highPrice: null,
        lowPrice: null,
        volume: null,
        value: null,
        referencePrice: null,
        ceilingPrice: null,
        floorPrice: null,
        priceChange: null,
        priceChangePercent: null,
        liquidityCompare: null,
        rsi14: null,
        rsiStatus: null,
        recommendation: null,
        analysis: null,
        news: [],
      };
  }
}


const stockService = {
  /** Watchlist */
  async getWatchlist() {
    const res = await api.get('/watchlist');
    return res.data.data || [];
  },

  async addToWatchlist(symbol, buyPrice, note = '') {
    const res = await api.post('/watchlist', { symbol, buyPrice, note });
    return res.data;
  },

  async updateWatchlistItem(id, symbol, buyPrice, note = '') {
    const res = await api.put(`/watchlist/${id}`, { symbol, buyPrice, note });
    return res.data;
  },

  async deleteFromWatchlist(id) {
    const res = await api.delete(`/watchlist/${id}`);
    return res.data;
  },

  /** Stocks */
  async getStocksData(codes) {
    const res = await api.get(`/stocks`, { params: { codes } });
    return res.data.data || [];
  },

  async getStockTrades(symbol) {
    const res = await api.get(`/stocks/trades/${symbol}`);
    return res.data.trades || [];
  },

  async getStockHistory(symbol) {
    const res = await api.get(`/stocks/history/${symbol}`);
    return res.data || {};
  },

  async searchStock(symbol) {
    const res = await api.get(`/stocks/search`, { params: { symbol } });
    return res.data.data || [];
  },

  async getTopGainers() {
    const res = await api.get(`/stocks/top-gainers`);
    return res.data.data || [];
  },

  async getTopLosers() {
    const res = await api.get(`/stocks/top-losers`);
    return res.data.data || [];
  },

  // =====================
  // NEWS (JSON từ backend)
  // =====================

  async getNewsJsonByQuery(q, opts = {}) {
    if (!q) throw new Error('Thiếu tham số q');
    const query = buildNewsParams(opts);
    const url = `/news/json${query ? `${query}&` : '?'}q=${encodeURIComponent(q)}`;
    const res = await api.get(url);
    return res.data; // { success, items, ... }
  },

  async getNewsJsonBySymbol(symbol, opts = {}) {
    if (!symbol) throw new Error('Thiếu mã cổ phiếu');
    const query = buildNewsParams(opts);
    const url = `/news/json/${encodeURIComponent(symbol)}${query}`;
    const res = await api.get(url);
    return res.data;
  },

  async getNewsItemsByQuery(q, opts = {}) {
    const r = await this.getNewsJsonByQuery(q, opts);
    return Array.isArray(r?.items) ? r.items : [];
  },
  async getNewsItemsBySymbol(symbol, opts = {}) {
    const r = await this.getNewsJsonBySymbol(symbol, opts);
    return Array.isArray(r?.items) ? r.items : [];
  },

  // =====================
  // (tuỳ chọn) NEWS qua RSS XML cũ
  // =====================

  async getNewsXmlByQuery(q, opts = {}) {
    if (!q) throw new Error('Thiếu tham số q');
    const query = buildNewsParams(opts);
    const url = `/news${query ? `${query}&` : '?'}q=${encodeURIComponent(q)}`;
    const res = await api.get(url, { responseType: 'text' });
    return res.data;
  },

  async getNewsXmlBySymbol(symbol, opts = {}) {
    if (!symbol) throw new Error('Thiếu mã cổ phiếu');
    const query = buildNewsParams(opts);
    const url = `/news/${encodeURIComponent(symbol)}${query}`;
    const res = await api.get(url, { responseType: 'text' });
    return res.data;
  },

  async getNewsByQuery(q, opts = {}) {
    const xml = await this.getNewsXmlByQuery(q, opts);
    return parseGoogleNewsRss(xml);
  },
  async getNewsBySymbol(symbol, opts = {}) {
    const xml = await this.getNewsXmlBySymbol(symbol, opts);
    return parseGoogleNewsRss(xml);
  },

  getStockDetails,
  
};

export default stockService;
