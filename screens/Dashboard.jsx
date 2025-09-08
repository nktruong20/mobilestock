// screens/Dashboard.jsx
import { useNavigation } from '@react-navigation/native';
import {
  BatteryCharging,
  BellRing,
  Plus,
  Search,
  User,
  Wifi
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import BottomNav from '../screens/BottomNav';
import stockService from '../services/stock';

// ================== VN Symbols (có thể thay bằng API) ==================
const VN_STOCKS = [
  // HOSE
  'VIC','VHM','VNM','VCB','CTG','BID','TCB','VPB','FPT','MWG','VRE','SAB','GAS','HPG','SSI','HCM','STB','MBB','ACB','VJC','PLX','BVH','PNJ','REE','KDH','NLG','POW','GVR','DXG','DGC','VTP',
  // HNX
  'SHB','PVS','IDC','VCS','CEO','PVI','BAB','MBS','LAS','PLC',
  // UPCOM
  'BSR','ACV','VGI','VGT','DVN','VIB','LPB','VTP','QNS','FOX'
];

// ================== Helper ==================
const getColorForCode = (code) => {
  const colors = [
    '#4f46e5', '#3b82f6', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#14b8a6', '#e11d48'
  ];
  if (!code) return '#3b82f6';
  let sum = 0;
  for (let i = 0; i < code.length; i++) sum += code.charCodeAt(i);
  return colors[sum % colors.length];
};

const pickRandom = (arr, n) => {
  const pool = [...arr];
  const out = [];
  while (out.length < n && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
};

const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Format “x phút/giờ/ngày trước”
function timeAgoVi(dateInput) {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const m = Math.floor(diffMs / 60000);
    if (m < 1) return 'Vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
}

function isWithin24h(pubDate) {
  try {
    const d = new Date(pubDate);
    if (isNaN(d.getTime())) return false;
    const diff = Date.now() - d.getTime();
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// ================== Component ==================
export default function Dashboard() {
  const navigation = useNavigation();

  const [stocks, setStocks] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);

  // Gợi ý theo thời gian thực
  const [suggestions, setSuggestions] = useState([]);
  // Gợi ý 5 mã random khi focus
  const [randomSuggestions, setRandomSuggestions] = useState([]);
  const [loadingRandom, setLoadingRandom] = useState(false);

  // Giá mua theo từng mã (cả random & realtime)
  const [buyPrices, setBuyPrices] = useState({});

  const [longPressedId, setLongPressedId] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Pagination cho Watchlist
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Last updated
  const [lastUpdated, setLastUpdated] = useState(null);

  // Top lists
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);

  // News
  const NEWS_TOTAL = 18;
  const NEWS_PER_PAGE = 6;

  // ==== Ảnh tin tức (dùng 6 ảnh bạn cung cấp, random cho từng bài) ====
  const NEWS_IMAGES = [
    'https://timo.vn/wp-content/uploads/cach-doc-bieu-do-chung-khoan.jpg',
    'https://cafefcdn.com/thumb_w/650/203337114487263232/2021/6/30/photo1625020248242-16250202485111259660068.png',
    'https://png.pngtree.com/thumb_back/fw800/background/20230616/pngtree-upward-trending-stock-market-graph-in-3d-rendering-image_3617185.jpg',
    'https://img.lovepik.com/photo/40251/3547.jpg_wh860.jpg',
    'https://cdn.mytrade.vn/media/cach-doc-bieu-do-chung-khoan-02.png',
    'https://media.vov.vn/sites/default/files/styles/large/public/2023-12/thi_truong_chung_khoan_2024.png',
  ];
  const NEWS_PLACEHOLDER =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/2048px-No-Image-Placeholder.svg.png';

  const [newsItems, setNewsItems] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsPage, setNewsPage] = useState(1);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const codesInWatchlist = useMemo(
    () => new Set(stocks.map(s => (s.code || '').toUpperCase())),
    [stocks]
  );
  const alreadyInList = (symbol) => codesInWatchlist.has((symbol || '').toUpperCase());

  const loadWatchlist = async () => {
    try {
      setLoadingList(true);
      const list = await stockService.getWatchlist();
      const mapped = Array.isArray(list)
        ? list.map(item => ({
            _id: item._id,
            code: item.symbol,
            buyPrice: item.buyPrice,
            currentPrice: item.currentPrice ?? null,
            yesterdayPrice: item.yesterdayPrice ?? null,
            diffBuy:
              item.currentPrice && item.buyPrice
                ? (((item.currentPrice - item.buyPrice) / item.buyPrice) * 100).toFixed(2) + '%'
                : '--',
            diffYesterday:
              item.currentPrice && item.yesterdayPrice
                ? (((item.currentPrice - item.yesterdayPrice) / item.yesterdayPrice) * 100).toFixed(2) + '%'
                : '--',
          }))
        : [];
      setStocks(mapped);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Lỗi load stocks:', err);
      setStocks([]);
    } finally {
      setLoadingList(false);
    }
  };

  /** Load top gainers & losers */
  const loadTopLists = async () => {
    try {
      const [gainers, losers] = await Promise.all([
        stockService.getTopGainers(),
        stockService.getTopLosers()
      ]);

      const mapData = (arr) =>
        (arr || []).map(item => {
          let changePercent = null;
          if (item.lastPrice1DayAgo && item.lastPrice5DaysAgo) {
            changePercent = (
              ((item.lastPrice1DayAgo - item.lastPrice5DaysAgo) / item.lastPrice5DaysAgo) * 100
            ).toFixed(2);
          }
          return {
            symbol: item.stockCode,
            currentPrice: item.lastPrice1DayAgo ?? null,
            changePercent
          };
        });

      setTopGainers(mapData(gainers));
      setTopLosers(mapData(losers));
    } catch (err) {
      console.error("Lỗi load top lists:", err);
      setTopGainers([]);
      setTopLosers([]);
    }
  };

  /** Debounce tìm kiếm theo thời gian thực khi có q */
  useEffect(() => {
    const keyword = q.trim().toUpperCase();
    if (!keyword) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    let canceled = false;
    setSearching(true);

    const t = setTimeout(async () => {
      try {
        const res = await stockService.searchStock(keyword);
        const list = Array.isArray(res) ? res : (res ? [res] : []);
        if (!canceled) {
          const normalized = list
            .filter(it => it && it.symbol)
            .map(it => ({
              symbol: (it.symbol || '').toUpperCase(),
              currentPrice: it.currentPrice ?? null,
              yesterdayPrice: it.yesterdayPrice ?? null,
            }));
          setSuggestions(normalized);
        }
      } catch {
        if (!canceled) setSuggestions([]);
      } finally {
        if (!canceled) setSearching(false);
      }
    }, 300);

    return () => {
      canceled = true;
      clearTimeout(t);
    };
  }, [q]);

  /** Khi focus: show 5 mã VN ngẫu nhiên với dữ liệu giá */
  const loadRandomSuggestions = async () => {
    try {
      setLoadingRandom(true);
      const sample = pickRandom(VN_STOCKS, 5);
      // Gọi song song để lấy giá hôm nay/hôm qua
      const datas = await Promise.all(
        sample.map(async (sym) => {
          try {
            const d = await stockService.searchStock(sym);
            const it = Array.isArray(d) ? d.find(x => x?.symbol?.toUpperCase() === sym) : d;
            return {
              symbol: sym,
              currentPrice: it?.currentPrice ?? null,
              yesterdayPrice: it?.yesterdayPrice ?? null,
            };
          } catch {
            return { symbol: sym, currentPrice: null, yesterdayPrice: null };
          }
        })
      );
      setRandomSuggestions(datas);
    } finally {
      setLoadingRandom(false);
    }
  };

  /** Thêm từ gợi ý (random hoặc realtime) */
  const addFromSuggestion = async (symbol) => {
    try {
      if (!symbol) return;
      const up = symbol.toUpperCase();
      if (alreadyInList(up)) {
        Alert.alert('Thông báo', `${up} đã có trong watchlist.`);
        return;
      }
      const raw = buyPrices[up] ?? '';
      const priceNum = Number(raw || 0);
      await stockService.addToWatchlist(up, priceNum, '');
      setBuyPrices(prev => {
        const next = { ...prev };
        delete next[up];
        return next;
      });
      await loadWatchlist();
      Alert.alert('Thành công', `Đã thêm ${up} vào watchlist.`);
    } catch (err) {
      Alert.alert('Lỗi', err?.response?.data?.message || err.message);
    }
  };

  /** Lấy 18 tin mới nhất trong 24h qua từ các mã ngẫu nhiên, phân trang 6 tin/trang
   *  Đồng thời gán ảnh ngẫu nhiên từ NEWS_IMAGES cho từng bài. */
  const loadLatestNews24h = async () => {
    try {
      setLoadingNews(true);
      setNewsPage(1);

      // Chọn 10 mã ngẫu nhiên để gom tin (tăng khả năng đủ 18 tin trong 24h)
      const sampleSymbols = pickRandom(VN_STOCKS, 10);

      // Gọi song song, mỗi mã limit 12 tin (range=1d)
      const results = await Promise.all(
        sampleSymbols.map(sym =>
          stockService
            .getNewsItemsBySymbol(sym, { range: '1d', hl: 'vi', gl: 'VN', limit: 12 })
            .catch(() => [])
        )
      );

      // Gộp & khử trùng lặp theo link
      const merged = results.flat().filter(Boolean);
      const mapByLink = new Map();
      for (const it of merged) {
        if (!it?.link) continue;
        if (!mapByLink.has(it.link)) mapByLink.set(it.link, it);
      }
      let items = Array.from(mapByLink.values());

      // Chỉ lấy tin trong 24h qua
      items = items.filter(it => it?.pubDate && isWithin24h(it.pubDate));

      // Sắp xếp mới nhất trước
      items.sort((a, b) => {
        const da = new Date(a.pubDate).getTime() || 0;
        const db = new Date(b.pubDate).getTime() || 0;
        return db - da;
      });

      // Lấy tối đa 18 tin
      items = items.slice(0, NEWS_TOTAL);

      // === Gán ảnh ngẫu nhiên từ danh sách 6 ảnh bạn cung cấp ===
      const withThumb = items.map(it => ({
        ...it,
        _thumb: pickOne(NEWS_IMAGES),
      }));

      setNewsItems(withThumb);
    } catch (err) {
      console.error('Lỗi load news:', err?.message || err);
      setNewsItems([]);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
    loadTopLists();
    loadLatestNews24h();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, []);

  // Pagination slice cho watchlist
  const totalPages = Math.ceil(stocks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStocks = stocks.slice(startIndex, startIndex + itemsPerPage);

  // Pagination cho news
  const newsTotalPages = Math.ceil((newsItems?.length || 0) / NEWS_PER_PAGE) || 1;
  const newsStart = (newsPage - 1) * NEWS_PER_PAGE;
  const currentNews = newsItems.slice(newsStart, newsStart + NEWS_PER_PAGE);

  // Panel nên hiển thị gì?
  const showRealtime = q.trim().length > 0;        // đang gõ => realtime
  const showRandom = isSearchFocused && !showRealtime; // vừa focus, chưa gõ => random

  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41 AM</Text>
        <View style={styles.statusIcons}>
          <Wifi size={14} color="#fff" />
          <BatteryCharging size={14} color="#fff" style={{ marginLeft: 6 }} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đầu tư chứng khoán</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconBtn} onPress={loadLatestNews24h}>
            <BellRing size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <User size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Search size={16} color="#777" style={styles.searchIcon} />
        <TextInput
          placeholder="Nhập mã cổ phiếu (VD: FPT, ACB...)"
          placeholderTextColor="#777"
          style={styles.searchInput}
          value={q}
          onChangeText={(text) => setQ(text)}
          onFocus={() => {
            setIsSearchFocused(true);
            loadRandomSuggestions();
          }}
          onBlur={() => setIsSearchFocused(false)}
          onSubmitEditing={() => Keyboard.dismiss()}
          autoCapitalize="characters"
          returnKeyType="done"
        />
        {/* Kính lúp chỉ để đóng bàn phím */}
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => Keyboard.dismiss()}
          accessible accessibilityLabel="Đóng bàn phím"
        >
          {searching ? <ActivityIndicator size="small" /> : <Search size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      {/* Suggestions panel */}
      {(showRealtime || showRandom) && (
        <View style={styles.searchPanel}>
          {showRealtime ? (
            searching ? (
              <Text style={styles.searchHint}>Đang tìm...</Text>
            ) : suggestions.length > 0 ? (
              <>
                {suggestions.map((it) => (
                  <View key={it.symbol} style={styles.searchCard}>
                    <View style={styles.searchLeft}>
                      <Text style={styles.searchCode}>{it.symbol}</Text>
                      <Text style={styles.searchRow}>
                        Hôm nay: <Text style={styles.searchStrong}>
                          {it.currentPrice?.toLocaleString('vi-VN') ?? '--'}
                        </Text>
                      </Text>
                      <Text style={styles.searchRow}>
                        Hôm qua: <Text style={styles.searchStrong}>
                          {it.yesterdayPrice?.toLocaleString('vi-VN') ?? '--'}
                        </Text>
                      </Text>
                    </View>
                    <View style={styles.searchRight}>
                      {alreadyInList(it.symbol) ? (
                        <Text style={styles.already}>Đã có ✓</Text>
                      ) : (
                        <View style={styles.addRow}>
                          <TextInput
                            style={styles.buyInput}
                            placeholder="Giá mua"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={buyPrices[it.symbol] ?? ''}
                            onChangeText={(v) =>
                              setBuyPrices(prev => ({ ...prev, [it.symbol]: v }))
                            }
                          />
                          <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => addFromSuggestion(it.symbol)}
                          >
                            <Plus size={18} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.searchHint}>
                Không tìm thấy mã “{q.trim().toUpperCase()}”. Thử mã khác nhé.
              </Text>
            )
          ) : (
            <>
              <Text style={[styles.searchHint, { marginBottom: 6 }]}>
                Gợi ý ngẫu nhiên (Việt Nam)
              </Text>
              {loadingRandom ? (
                <ActivityIndicator />
              ) : (
                randomSuggestions.map((it) => (
                  <View key={it.symbol} style={styles.searchCard}>
                    <View style={styles.searchLeft}>
                      <Text style={styles.searchCode}>{it.symbol}</Text>
                      <Text style={styles.searchRow}>
                        Hôm nay: <Text style={styles.searchStrong}>
                          {it.currentPrice?.toLocaleString('vi-VN') ?? '--'}
                        </Text>
                      </Text>
                      <Text style={styles.searchRow}>
                        Hôm qua: <Text style={styles.searchStrong}>
                          {it.yesterdayPrice?.toLocaleString('vi-VN') ?? '--'}
                        </Text>
                      </Text>
                    </View>
                    <View style={styles.searchRight}>
                      {alreadyInList(it.symbol) ? (
                        <Text style={styles.already}>Đã có ✓</Text>
                      ) : (
                        <View style={styles.addRow}>
                          <TextInput
                            style={styles.buyInput}
                            placeholder="Giá mua"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={buyPrices[it.symbol] ?? ''}
                            onChangeText={(v) =>
                              setBuyPrices(prev => ({ ...prev, [it.symbol]: v }))
                            }
                          />
                          <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => addFromSuggestion(it.symbol)}
                          >
                            <Plus size={18} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      )}

      {/* Watchlist */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Cổ phiếu theo dõi</Text>

        {loadingList && (
          <View style={{ paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        )}

        {!loadingList && currentStocks.length === 0 && (
          <Text style={{ color: '#888', marginTop: 10 }}>Chưa có mã nào trong watchlist</Text>
        )}

        {!loadingList &&
          currentStocks.map(s => (
            <TouchableWithoutFeedback
              key={s._id}
              onLongPress={() => setLongPressedId(s._id)}
              onPressOut={() => setTimeout(() => setLongPressedId(null), 2000)}
              onPress={() => navigation.navigate('Market', { symbol: s.code })}
            >
              <View style={styles.stockCard}>
                {longPressedId === s._id && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      Alert.alert(
                        'Xác nhận',
                        `Xóa ${s.code} khỏi watchlist?`,
                        [
                          { text: 'Hủy', style: 'cancel' },
                          {
                            text: 'Xóa',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await stockService.deleteFromWatchlist(s._id);
                                await loadWatchlist();
                                setLongPressedId(null);
                              } catch (err) {
                                Alert.alert('Lỗi', err?.response?.data?.message || err.message);
                              }
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>X</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.stockHeader}>
                  <View style={[styles.stockIcon, { backgroundColor: getColorForCode(s.code) }]}>
                    <Text style={styles.stockIconText}>{s.code?.slice(0, 2) || ''}</Text>
                  </View>
                  <View>
                    <Text style={styles.stockCode}>{s.code}</Text>
                    <Text style={styles.stockLabel}>Giá hiện tại</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Animated.Text style={[styles.stockPrice, { opacity: fadeAnim }]}>
                      {s.currentPrice?.toLocaleString('vi-VN') || '--'}
                    </Animated.Text>
                  </View>
                </View>

                <View style={styles.stockBody}>
                  <View style={styles.stockCol}>
                    <Text style={styles.stockSubLabel}>Giá mua</Text>
                    <Text style={styles.stockSubValue}>{s.buyPrice?.toLocaleString('vi-VN')}</Text>
                    <Text
                      style={[
                        styles.stockChange,
                        s.diffBuy?.startsWith('-') ? styles.down : styles.up
                      ]}
                    >
                      {s.diffBuy}
                    </Text>
                  </View>
                  <View style={styles.stockCol}>
                    <Text style={styles.stockSubLabel}>Hôm qua</Text>
                    <Text style={styles.stockSubValue}>
                      {s.yesterdayPrice?.toLocaleString('vi-VN')}
                    </Text>
                    <Text
                      style={[
                        styles.stockChange,
                        s.diffYesterday?.startsWith('-') ? styles.down : styles.up
                      ]}
                    >
                      {s.diffYesterday}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          ))}

        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            Cập nhật lần cuối{' '}
            {lastUpdated.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}{' '}
            • {lastUpdated.toLocaleDateString('vi-VN')}
          </Text>
        )}

        {/* Pagination (Watchlist) */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
              disabled={currentPage === 1}
              onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <Text style={styles.pageText}>{'<'}</Text>
            </TouchableOpacity>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.pageBtn,
                  currentPage === num && styles.pageBtnActive
                ]}
                onPress={() => setCurrentPage(num)}
              >
                <Text
                  style={[
                    styles.pageText,
                    currentPage === num && styles.pageTextActive
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
              disabled={currentPage === totalPages}
              onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <Text style={styles.pageText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Top tăng giá */}
{/* Top tăng giá */}
{topGainers.length > 0 && (
  <>
    <Text style={styles.sectionTitle}>Top tăng giá</Text>
    {topGainers.slice(0, 5).map((s, i) => (
      <View key={i} style={styles.topCard}>
        <Text style={styles.topCode}>{s.symbol}</Text>
        <Text style={styles.topPrice}>
          {s.currentPrice?.toLocaleString('vi-VN') ?? '--'}
        </Text>
        <Text style={[styles.topChange, styles.up]}>
          {s.changePercent != null ? `${Math.abs(Number(s.changePercent)).toFixed(2)}%` : '--'}
        </Text>
      </View>
    ))}
  </>
)}


{topLosers.length > 0 && (
  <>
    <Text style={styles.sectionTitle}>Top giảm giá</Text>
    {topLosers.slice(0, 5).map((s, i) => (
      <View key={i} style={styles.topCard}>
        <Text style={styles.topCode}>{s.symbol}</Text>
        <Text style={styles.topPrice}>
          {s.currentPrice?.toLocaleString('vi-VN') ?? '--'}
        </Text>
        <Text style={[styles.topChange, styles.down]}>
          {s.changePercent != null ? `${Math.abs(Number(s.changePercent)).toFixed(2)}%` : '--'}
        </Text>
      </View>
    ))}
  </>
)}



        {/* News */}
        <Text style={styles.sectionTitle}>Tin tức mới nhất</Text>

        {loadingNews && (
          <View style={{ paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        )}

        {!loadingNews && currentNews.length === 0 && (
          <Text style={{ color: '#888', marginBottom: 12 }}>
            Chưa có tin trong 24h qua. Bấm chuông để thử làm mới.
          </Text>
        )}

        {!loadingNews && currentNews.map((a, idx) => (
          <TouchableOpacity
            key={a.link || `${newsPage}-${idx}`}
            style={styles.newsCard}
            onPress={() => {
              if (a?.link) Linking.openURL(a.link).catch(() => {});
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: a?._thumb || NEWS_PLACEHOLDER }}
              style={styles.newsImg}
            />
            <View style={styles.newsText}>
              <Text style={styles.newsTitle} numberOfLines={3}>
                {a?.title || 'Bài viết'}
              </Text>
              <Text style={styles.newsMeta} numberOfLines={1}>
                {(a?.source?.name || 'Nguồn')} • {a?.pubDate ? timeAgoVi(a.pubDate) : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Pagination (News) */}
        {(!loadingNews && newsItems.length > 0) && (
          <View style={[styles.pagination, { marginTop: 4 }]}>
            <TouchableOpacity
              style={[styles.pageBtn, newsPage === 1 && styles.pageBtnDisabled]}
              disabled={newsPage === 1}
              onPress={() => setNewsPage(p => Math.max(1, p - 1))}
            >
              <Text style={styles.pageText}>{'<'}</Text>
            </TouchableOpacity>

            {Array.from({ length: newsTotalPages }, (_, i) => i + 1).map(num => (
              <TouchableOpacity
                key={`news-${num}`}
                style={[
                  styles.pageBtn,
                  newsPage === num && styles.pageBtnActive
                ]}
                onPress={() => setNewsPage(num)}
              >
                <Text
                  style={[
                    styles.pageText,
                    newsPage === num && styles.pageTextActive
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.pageBtn, newsPage === newsTotalPages && styles.pageBtnDisabled]}
              disabled={newsPage === newsTotalPages}
              onPress={() => setNewsPage(p => Math.min(newsTotalPages, p + 1))}
            >
              <Text style={styles.pageText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <BottomNav activeRoute="Dashboard" />
    </SafeAreaView>
  );
}

// ================== Styles ==================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  statusTime: { color: '#fff', fontWeight: '600' },
  statusIcons: { flexDirection: 'row' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row' },
  iconBtn: { padding: 6, marginLeft: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },

  searchWrapper: { marginHorizontal: 16, marginBottom: 12, position: 'relative' },
  searchIcon: { position: 'absolute', top: 15, left: 14 },
  searchInput: { height: 50, borderRadius: 12, paddingLeft: 40, paddingRight: 50, backgroundColor: '#1e1e1e', color: '#fff' },
  searchBtn: { position: 'absolute', right: 6, top: 6, bottom: 6, width: 38, height: 38, borderRadius: 8, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },

  searchPanel: { marginHorizontal: 16, marginBottom: 12, gap: 8 },
  searchHint: { color: '#999', fontStyle: 'italic' },
  searchCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#1e1e1e', borderRadius: 12 },
  searchLeft: {},
  searchRight: { justifyContent: 'center' },
  searchCode: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  searchRow: { color: '#ccc' },
  searchStrong: { color: '#fff', fontWeight: '600' },
  already: { color: '#10b981', fontWeight: '600' },
  addRow: { flexDirection: 'row', alignItems: 'center' },
  buyInput: { backgroundColor: '#2c2c2c', color: '#fff', borderRadius: 8, paddingHorizontal: 8, width: 90, marginRight: 8, paddingVertical: 10 },
  addBtn: { backgroundColor: '#10b981', borderRadius: 8, padding: 6 },

  content: { padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginVertical: 12 },

  stockCard: { backgroundColor: '#1e1e1e', borderRadius: 12, padding: 12, marginBottom: 12, position: 'relative' },
  deleteBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'red', padding: 4, borderRadius: 8 },
  stockHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stockIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  stockIconText: { color: '#fff', fontWeight: 'bold' },
  stockCode: { color: '#fff', fontSize: 16, fontWeight: '600' },
  stockLabel: { color: '#999', fontSize: 12 },
  stockPrice: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  stockBody: { flexDirection: 'row', justifyContent: 'space-between' },
  stockCol: { flex: 1 },
  stockSubLabel: { color: '#999', fontSize: 12 },
  stockSubValue: { color: '#ccc', fontSize: 14 },
  stockChange: { fontWeight: '600', marginTop: 4 },
  up: { color: '#10b981' },
  down: { color: '#ef4444' },

  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 6 },
  pageBtn: { padding: 6, minWidth: 32, alignItems: 'center', borderRadius: 6, backgroundColor: '#2c2c2c' },
  pageBtnDisabled: { opacity: 0.3 },
  pageBtnActive: { backgroundColor: '#10b981' },
  pageText: { color: '#fff' },
  pageTextActive: { color: '#fff', fontWeight: 'bold' },

  lastUpdated: { color: '#aaa', textAlign: 'center', marginTop: 8 },

  topCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1e1e1e', padding: 12, borderRadius: 10, marginBottom: 6 },
  topCode: { color: '#fff', fontWeight: '600', fontSize: 16 },
  topPrice: { color: '#ccc', fontSize: 15 },
  topChange: { fontWeight: '700' },

  newsCard: { flexDirection: 'row', backgroundColor: '#1e1e1e', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  newsImg: { width: 80, height: 80 },
  newsText: { flex: 1, padding: 10, justifyContent: 'center' },
  newsTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  newsMeta: { color: '#aaa', fontSize: 12, marginTop: 4 },
});
