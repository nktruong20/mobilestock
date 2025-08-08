// screens/MarketPage.js
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import BottomNav from '../screens/BottomNav';

import { getHistory } from '../services/market';

export default function MarketPage() {
  const navigation = useNavigation();

  const [period, setPeriod] = useState('1m');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const marketIndices = [
    { name: 'VN-Index',  value: '1,280.50', change: '+12.30', percent: '+0.97%', up: true },
    { name: 'HNX-Index', value: '245.15',   change: '-0.80', percent: '-0.33%', up: false },
    { name: 'UPCOM-Index',value: '95.70',    change: '+0.25', percent: '+0.26%', up: true },
  ];

  const movers = {
    gainers: [
      { symbol: 'FPT', price: 110.5, percent: '+4.75%' },
      { symbol: 'HPG', price: 30.2,  percent: '+4.13%' },
      { symbol: 'VCB', price: 95.8,  percent: '+3.79%' },
    ],
    losers: [
      { symbol: 'VIC', price: 45.1,  percent: '-5.25%' },
      { symbol: 'SAB', price: 150.0, percent: '-4.45%' },
      { symbol: 'MSN', price: 78.9,  percent: '-3.66%' },
    ],
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      const h = await getHistory('AAPL', period);
      setHistory(h);
      setLoading(false);
    })();
  }, [period]);

  // Prepare labels & data arrays
  const { labels, data } = useMemo(() => {
    if (!history.length) return { labels: [], data: [] };
    return {
      labels: history.map(item => {
        const d = new Date(item.date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      data: history.map(item => item.close),
    };
  }, [history]);

  const screenWidth = Dimensions.get('window').width - 32;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
      </SafeAreaView>
    );
  }

  const titleText =
    period === '1m'
      ? 'Giá đóng cửa AAPL (30 ngày)'
      : 'Giá đóng cửa AAPL (3 tháng)';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#ccc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thị trường</Text>
        <TouchableOpacity>
          <Feather name="search" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Market Indices */}
        <View style={styles.indicesContainer}>
          {marketIndices.map((idx, i) => (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{idx.name}</Text>
                {idx.up 
                  ? <Ionicons name="trending-up" size={18} color="#4caf50" />
                  : <Ionicons name="trending-down" size={18} color="#f44336" />
                }
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.value}>{idx.value}</Text>
                <Text style={[styles.change, idx.up ? styles.up : styles.down]}>
                  {idx.change} ({idx.percent})
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Period Toggle */}
        <View style={styles.toggleContainer}>
          {[
            { key: '1m', label: '1 tháng' },
            { key: '3m', label: '3 tháng' },
          ].map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.toggleBtn,
                period === opt.key && styles.toggleBtnActive,
              ]}
              onPress={() => setPeriod(opt.key)}
            >
              <Text
                style={[
                  styles.toggleLabel,
                  period === opt.key && styles.toggleLabelActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>{titleText}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16 }}
          >
            <View style={[styles.chartCard, { width: Math.max(screenWidth, data.length * 40) }]}>
              {data.length > 0 ? (
                <LineChart
                  data={{
                    labels,
                    datasets: [{ data }],
                  }}
                  width={Math.max(screenWidth, data.length * 40)}
                  height={260}
                  yAxisSuffix=" USD"
                  chartConfig={{
                    backgroundGradientFrom: '#1a1a1a',
                    backgroundGradientTo: '#1a1a1a',
                    decimalPlaces: 2,
                    color: (opacity = 1) => `rgba(76,175,80,${opacity})`,
                    labelColor: (opacity = 1) => `rgba(245,245,245,${opacity})`,
                    style: { borderRadius: 8 },
                    propsForDots: { r: '3', strokeWidth: '2', stroke: '#4caf50' },
                  }}
                  style={{ borderRadius: 8 }}
                  withDots
                  withShadow={false}
                  withInnerLines={false}
                />
              ) : (
                <Text style={styles.noDataText}>Không có dữ liệu để hiển thị</Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Top Movers */}
        <View style={styles.moversContainer}>
          {['gainers', 'losers'].map(key => (
            <View key={key} style={styles.moversCard}>
              <Text style={[styles.sectionTitle, key === 'gainers' ? styles.up : styles.down]}>
                {key === 'gainers' ? 'Tăng giá mạnh nhất' : 'Giảm giá mạnh nhất'}
              </Text>
              {movers[key].map((s, idx) => (
                <View key={idx} style={styles.stockItem}>
                  <Text style={styles.symbol}>{s.symbol}</Text>
                  <View style={styles.right}>
                    <Text style={styles.price}>{s.price.toFixed(2)}</Text>
                    <Text style={[styles.percent, key === 'gainers' ? styles.up : styles.down]}>
                      {s.percent}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav activeRoute="Market" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a'
  },
  container: { flex: 1, backgroundColor: '#1a1a1a' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 12,
    backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333'
  },
  headerTitle: { fontSize: 18, color: '#f5f5f5', fontWeight: 'bold' },

  content: { padding: 16, paddingBottom: 80 },

  indicesContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', marginBottom: 16,
  },
  card: {
    width: '48%', backgroundColor: '#222',
    borderRadius: 8, marginBottom: 12, overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 8, borderBottomWidth: 1, borderBottomColor: '#333',
  },
  cardTitle: { color: '#aaa', fontSize: 14, fontWeight: '500' },
  cardBody: { padding: 8 },
  value: { fontSize: 20, fontWeight: 'bold', color: '#f5f5f5' },
  change: { marginTop: 4, fontSize: 12 },
  up: { color: '#4caf50' },
  down: { color: '#f44336' },

  toggleContainer: {
    flexDirection: 'row', justifyContent: 'center', marginBottom: 12,
  },
  toggleBtn: {
    paddingVertical: 6, paddingHorizontal: 16, marginHorizontal: 4,
    borderRadius: 20, backgroundColor: '#333',
  },
  toggleBtnActive: {
    backgroundColor: '#4caf50',
  },
  toggleLabel: {
    color: '#ccc', fontSize: 14,
  },
  toggleLabelActive: {
    color: '#fff', fontWeight: 'bold',
  },

  chartSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#f5f5f5', marginBottom: 8 },
  chartCard: {
    backgroundColor: '#222', borderRadius: 8, padding: 12, alignItems: 'center'
  },
  noDataText: { color: '#888', fontSize: 14, marginTop: 20 },

  moversContainer: { marginBottom: 16 },
  moversCard: {
    backgroundColor: '#222', borderRadius: 8, padding: 12, marginBottom: 12,
  },
  stockItem: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  symbol: { color: '#f5f5f5', fontWeight: 'bold' },
  right: { alignItems: 'flex-end' },
  price: { color: '#f5f5f5', fontWeight: 'bold' },
  percent: { fontSize: 12 },
});
