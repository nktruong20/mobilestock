// screens/MarketPage.jsx
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import BottomNav from '../screens/BottomNav';

import { addSymbol, getHistory, getSymbols } from '../services/market';

const FAVORITES_KEY = '@market_favorites';

export default function MarketPage() {
  const navigation = useNavigation();
  const screenWidth = Dimensions.get('window').width - 32;

  // Main state
  const [symbol, setSymbol] = useState('AAPL');
  const [period, setPeriod] = useState('1m');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Favorites (max 4), loaded from AsyncStorage
  const [favorites, setFavorites] = useState([]);

  // Load favorites từ AsyncStorage khi mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(FAVORITES_KEY);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Failed to load favorites', e);
      }
    })();
  }, []);

  // Lưu favorites lên AsyncStorage mỗi khi thay đổi
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      } catch (e) {
        console.warn('Failed to save favorites', e);
      }
    })();
  }, [favorites]);

  // Fake popular data mẫu (để lấy giá + %change nếu có)
  const popularData = [
    { symbol: 'AAPL', price: 220.03, changePercent: +0.97 },
    { symbol: 'GOOG', price: 135.67, changePercent: -0.33 },
    { symbol: 'MSFT', price: 340.50, changePercent: +0.26 },
    { symbol: 'AMZN', price: 130.25, changePercent: +0.15 },
  ];

  // Toggle favorite và tự động giới hạn 4
  const toggleFavorite = sym => {
    setFavorites(favs => {
      if (favs.includes(sym)) {
        return favs.filter(s => s !== sym);
      } else {
        if (favs.length >= 4) {
          // bỏ phần tử cũ nhất
          return [...favs.slice(1), sym];
        }
        return [...favs, sym];
      }
    });
  };

  // ... các useEffect còn lại để fetch symbols, history giống trước

  useEffect(() => {
    if (!showSearch) return;
    let active = true;
    (async () => {
      const syms = await getSymbols(query);
      if (active) setResults(syms);
    })();
    return () => { active = false; };
  }, [query, showSearch]);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const h = await getHistory(symbol, period);
      setHistory(h);
      setLoading(false);
    })();
  }, [symbol, period]);

  const { labels, data } = useMemo(() => {
    if (!history.length) return { labels: [], data: [] };
    return {
      labels: history.map(i => {
        const d = new Date(i.date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      data: history.map(i => i.close),
    };
  }, [history]);

  const diff = data.length > 1 ? data[data.length - 1] - data[0] : 0;
  const lineColor = diff >= 0
    ? (opacity = 1) => `rgba(76,175,80,${opacity})`
    : (opacity = 1) => `rgba(244,67,54,${opacity})`;

  const titleText = `${symbol} — ${period === '1m' ? '30 ngày' : '3 tháng'}`;

  // Render search
  if (showSearch) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.searchHeader}>
            <TextInput
              autoFocus
              placeholder="Tìm mã..."
              placeholderTextColor="#888"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
            <TouchableOpacity onPress={() => setShowSearch(false)}>
              <Text style={styles.searchCancel}>Hủy</Text>
            </TouchableOpacity>
          </View>

          {results.length === 0 && query.length > 0 && (
            <TouchableOpacity
              style={styles.addItem}
              onPress={async () => {
                try {
                  await addSymbol(query.toUpperCase());
                  Alert.alert('Thành công', `Đã thêm mã ${query.toUpperCase()}`);
                  setSymbol(query.toUpperCase());
                  setShowSearch(false);
                  setQuery('');
                } catch (e) {
                  Alert.alert('Lỗi', e.response?.data?.msg || e.message);
                }
              }}
            >
              <Ionicons name="add-circle" size={20} color="#4caf50" />
              <Text style={styles.addItemText}>
                Thêm {'\''}{query.toUpperCase()}{'\''}
              </Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={results}
            keyExtractor={item => item}
            contentContainerStyle={styles.searchList}
            renderItem={({ item }) => {
              const isFav = favorites.includes(item);
              return (
                <View style={styles.searchItem}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      setSymbol(item);
                      setShowSearch(false);
                      setQuery('');
                    }}
                  >
                    <Text style={styles.searchItemText}>{item}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleFavorite(item)}>
                    <Ionicons
                      name={isFav ? 'star' : 'star-outline'}
                      size={20}
                      color={isFav ? '#FFD700' : '#888'}
                    />
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
      </SafeAreaView>
    );
  }

  // Main UI
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#ccc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thị trường</Text>
        <TouchableOpacity onPress={() => setShowSearch(true)}>
          <Feather name="search" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Popular Symbols Grid */}
        <View style={styles.popularGrid}>
          {favorites.length > 0 ? (
            favorites.slice(-4).map(sym => {
              const item = popularData.find(d => d.symbol === sym) || {
                symbol: sym,
                price: 0,
                changePercent: 0,
              };
              const up = item.changePercent >= 0;
              const active = item.symbol === symbol;
              return (
                <TouchableOpacity
                  key={item.symbol}
                  style={[styles.popularCard, active && styles.popularCardActive]}
                  onPress={() => setSymbol(item.symbol)}
                >
                  <Ionicons
                    name={up ? 'trending-up' : 'trending-down'}
                    size={18}
                    color={up ? '#4caf50' : '#f44336'}
                    style={styles.popularIcon}
                  />
                  <Text style={[styles.popularSymbol, active && styles.popularSymbolActive]}>
                    {item.symbol}
                  </Text>
                  <Text style={styles.popularPrice}>
                    {item.price.toFixed(2)} USD
                  </Text>
                  <Text style={[styles.popularChange, up ? styles.up : styles.down]}>
                    {up ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.noFavText}>
              Tick ngôi sao ở danh sách trên để thêm mã vào đây.
            </Text>
          )}
        </View>

        {/* Period Toggle */}
        <View style={styles.toggleContainer}>
          {['1m','3m'].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.toggleBtn, period === p && styles.toggleBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.toggleLabel, period === p && styles.toggleLabelActive]}>
                {p === '1m' ? '1 tháng' : '3 tháng'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>{titleText}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16 }}>
            <View style={[styles.chartCard, { width: Math.max(screenWidth, data.length * 40) }]}>
              <LineChart
                data={{ labels, datasets: [{ data }] }}
                width={Math.max(screenWidth, data.length * 40)}
                height={260}
                yAxisSuffix=" USD"
                chartConfig={{
                  backgroundGradientFrom: '#1a1a1a',
                  backgroundGradientTo: '#1a1a1a',
                  decimalPlaces: 2,
                  color: lineColor,
                  labelColor: opacity => `rgba(245,245,245,${opacity})`,
                  style: { borderRadius: 8 },
                  propsForDots: { r: '3', strokeWidth: '2', stroke: lineColor(1) }
                }}
                style={{ borderRadius: 8 }}
                withDots
                withShadow={false}
                withInnerLines={false}
              />
            </View>
          </ScrollView>
        </View>

        {/* Movers */}
        <View style={styles.moversContainer}>
          <View style={styles.moversCard}>
            <Text style={[styles.sectionTitle, styles.up]}>Tăng giá mạnh nhất</Text>
            {[
              { symbol: 'FPT', price: 110.5, percent: '+4.75%' },
              { symbol: 'HPG', price: 30.2, percent: '+4.13%' },
              { symbol: 'VCB', price: 95.8, percent: '+3.79%' },
            ].map((m, i) => (
              <View key={i} style={styles.stockItem}>
                <Text style={styles.symbol}>{m.symbol}</Text>
                <View style={styles.right}>
                  <Text style={styles.price}>{m.price.toFixed(2)}</Text>
                  <Text style={[styles.percent, styles.up]}>{m.percent}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.moversCard}>
            <Text style={[styles.sectionTitle, styles.down]}>Giảm giá mạnh nhất</Text>
            {[
              { symbol: 'VIC', price: 45.1, percent: '-5.25%' },
              { symbol: 'SAB', price: 150.0, percent: '-4.45%' },
              { symbol: 'MSN', price: 78.9, percent: '-3.66%' },
            ].map((m, i) => (
              <View key={i} style={styles.stockItem}>
                <Text style={styles.symbol}>{m.symbol}</Text>
                <View style={styles.right}>
                  <Text style={styles.price}>{m.price.toFixed(2)}</Text>
                  <Text style={[styles.percent, styles.down]}>{m.percent}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNav activeRoute="Market"/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#1a1a1a' },
  container: { flex:1, backgroundColor:'#1a1a1a' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:12, backgroundColor:'#1a1a1a', borderBottomWidth:1, borderBottomColor:'#333' },
  headerTitle: { fontSize:18, color:'#f5f5f5', fontWeight:'bold' },
  content: { padding:16, paddingBottom:80 },

  searchHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:12, backgroundColor:'#222' },
  searchInput: { flex:1, height:48, backgroundColor:'#333', borderRadius:24, paddingHorizontal:16, color:'#fff', fontSize:16 },
  searchCancel: { marginLeft:12, color:'#4caf50', fontSize:16, fontWeight:'600' },
  addItem: { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:14, backgroundColor:'#222', marginTop:8 },
  addItemText: { marginLeft:8, color:'#4caf50', fontSize:16 },
  searchList: { marginTop:8, marginHorizontal:16, backgroundColor:'#222', borderRadius:8 },
  searchItem: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingVertical:14,
    paddingHorizontal:12,
    borderBottomWidth:1,
    borderBottomColor:'#333'
  },
  searchItemText: { color:'#f5f5f5', fontSize:16 },

  popularGrid: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', marginBottom:16 },
  noFavText: { width:'100%', textAlign:'center', color:'#888', marginVertical:12 },

  popularCard: { width:'48%', backgroundColor:'#222', borderRadius:8, padding:16, marginBottom:12, position:'relative' },
  popularCardActive: { backgroundColor:'#333' },
  popularIcon: { position:'absolute', top:12, right:12 },
  popularSymbol: { color:'#ccc', fontSize:16, fontWeight:'600', textAlign:'center' },
  popularSymbolActive: { color:'#4caf50' },
  popularPrice: { color:'#f5f5f5', fontSize:14, fontWeight:'bold', textAlign:'center', marginTop:4 },
  popularChange: { fontSize:12, textAlign:'center', marginTop:2 },

  toggleContainer: { flexDirection:'row', justifyContent:'center', marginBottom:12 },
  toggleBtn: { paddingVertical:6, paddingHorizontal:16, marginHorizontal:4, borderRadius:20, backgroundColor:'#333' },
  toggleBtnActive: { backgroundColor:'#4caf50' },
  toggleLabel: { color:'#ccc', fontSize:14 },
  toggleLabelActive: { color:'#fff', fontWeight:'bold' },

  chartSection: { marginBottom:16 },
  sectionTitle: { fontSize:16, fontWeight:'bold', color:'#f5f5f5', marginBottom:8 },
  chartCard: { backgroundColor:'#222', borderRadius:8, padding:12, alignItems:'center' },

  moversContainer: { marginBottom:16 },
  moversCard: { backgroundColor:'#222', borderRadius:8, padding:12, marginBottom:12 },
  stockItem: { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  symbol: { color:'#f5f5f5', fontWeight:'bold' },
  right: { alignItems:'flex-end' },
  price: { color:'#f5f5f5', fontWeight:'bold' },
  percent: { fontSize:12 },
  up: { color:'#4caf50' },
  down: { color:'#f44336' },
});
