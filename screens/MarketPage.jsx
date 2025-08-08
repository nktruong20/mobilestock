// screens/MarketPage.js
import {
    Feather,
    Ionicons,
    MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import BottomNav from '../screens/BottomNav'; // ← ensure this path

export default function MarketPage() {
  const navigation = useNavigation();

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

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Market Indices */}
        <View style={styles.indicesContainer}>
          {marketIndices.map((idx, i) => (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{idx.name}</Text>
                {idx.up ? (
                  <Ionicons name="trending-up" size={18} color="#4caf50" />
                ) : (
                  <Ionicons name="trending-down" size={18} color="#f44336" />
                )}
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

        {/* Chart Placeholder */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Biểu đồ VN-Index</Text>
          <View style={styles.chartCard}>
            <MaterialCommunityIcons name="candlestick-chart" size={40} color="#666" />
            <Text style={styles.chartText}>Biểu đồ hình nến sẽ hiển thị ở đây</Text>
            <Text style={styles.chartSubtext}>
              Tích hợp thư viện như `react-native-svg-charts` để hiển thị dữ liệu thực.
            </Text>
          </View>
        </View>

        {/* Top Movers */}
        <View style={styles.moversContainer}>
          {['gainers', 'losers'].map((key) => (
            <View key={key} style={styles.moversCard}>
              <Text style={[styles.sectionTitle, key === 'gainers' ? styles.up : styles.down]}>
                {key === 'gainers' ? 'Tăng giá mạnh nhất' : 'Giảm giá mạnh nhất'}
              </Text>
              {movers[key].map((s, idx) => (
                <View key={idx} style={styles.stockItem}>
                  <View>
                    <Text style={styles.symbol}>{s.symbol}</Text>
                    <Text style={styles.name}>{s.name}</Text>
                  </View>
                  <View style={styles.right}>
                    <Text style={styles.price}>${s.price.toFixed(2)}</Text>
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

      {/* Bottom nav */}
      <BottomNav activeRoute="Market" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: { fontSize: 18, color: '#f5f5f5', fontWeight: 'bold' },

  content: { padding: 16, paddingBottom: 80 },

  indicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#222',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cardTitle: { color: '#aaa', fontSize: 14, fontWeight: '500' },
  cardBody: { padding: 8 },
  value: { fontSize: 20, fontWeight: 'bold', color: '#f5f5f5' },
  change: { marginTop: 4, fontSize: 12 },
  up: { color: '#4caf50' },
  down: { color: '#f44336' },

  chartSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#f5f5f5', marginBottom: 8 },
  chartCard: {
    backgroundColor: '#222',
    borderRadius: 8,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  chartText: { color: '#888', marginTop: 8 },
  chartSubtext: { color: '#555', fontSize: 12, marginTop: 4, textAlign: 'center' },

  moversContainer: { marginBottom: 16 },
  moversCard: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  symbol: { color: '#f5f5f5', fontWeight: 'bold' },
  name: { color: '#aaa', fontSize: 12 },
  right: { alignItems: 'flex-end' },
  price: { color: '#f5f5f5', fontWeight: 'bold' },
  percent: { fontSize: 12 },
});
