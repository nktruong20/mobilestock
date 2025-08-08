// screens/Dashboard.jsx
import { useNavigation } from '@react-navigation/native';
import {
    BatteryCharging,
    BellRing,
    DollarSign,
    LineChart,
    Search,
    TrendingUp,
    User,
    Wifi
} from 'lucide-react-native';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import BottomNav from '../screens/BottomNav'; // ← import BottomNav

const marketOverview = [
  { title: 'Vốn hóa thị trường', value: '$30.5T', change: '+3.2% so với tháng trước', status: 'up', icon: DollarSign },
  { title: 'Khối lượng giao dịch', value: '12.8B', change: '+15% so với hôm qua', status: 'up', icon: LineChart },
  { title: 'Cổ phiếu tăng giá', value: '2,145', change: 'Đang tăng giá', status: 'up', icon: TrendingUp },
];

const popularStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.28, change: '+0.88%' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 430.12, change: '-0.20%' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.60, change: '+1.15%' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 1180.50, change: '+1.31%' },
];

const IMAGE_URI = 'https://dangtrongkhang.com/wp-content/uploads/2025/02/cach-doc-bieu-do-chung-khoan-5.jpg';

const newsArticles = [
  { id: 1, title: 'Cổ phiếu công nghệ tăng mạnh khi lo ngại lạm phát giảm bớt', source: 'Reuters', time: '2 giờ trước', image: { uri: IMAGE_URI } },
  { id: 2, title: 'Giá dầu tăng vọt trong bối cảnh căng thẳng địa chính trị', source: 'Bloomberg', time: '4 giờ trước', image: { uri: IMAGE_URI } },
  { id: 3, title: 'Công ty X công bố lợi nhuận quý kỷ lục', source: 'Wall Street Journal', time: 'Hôm qua', image: { uri: IMAGE_URI } },
  { id: 4, title: 'Bitcoin đạt mức cao nhất mọi thời đại mới', source: 'CoinDesk', time: '1 ngày trước', image: { uri: IMAGE_URI } },
  { id: 5, title: 'Các vấn đề chuỗi cung ứng toàn cầu vẫn tiếp diễn', source: 'Financial Times', time: '2 ngày trước', image: { uri: IMAGE_URI } },
];

export default function Dashboard() {
  const navigation = useNavigation();

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
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconBtn}>
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
          placeholder="Tìm kiếm cổ phiếu, tin tức..."
          placeholderTextColor="#777"
          style={styles.searchInput}
        />
      </View>

      {/* Main content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Market overview */}
        <View style={styles.section}>
          {marketOverview.map((item, idx) => {
            const Icon = item.icon;
            return (
              <View key={idx} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Icon size={16} color={item.status === 'up' ? '#4ade80' : '#f87171'} />
                </View>
                <Text style={styles.cardValue}>{item.value}</Text>
                <Text style={[styles.cardChange, item.status === 'up' ? styles.up : styles.down]}>
                  {item.change}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Popular stocks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cổ phiếu phổ biến</Text>
          {popularStocks.map(s => (
            <View key={s.symbol} style={styles.stockCard}>
              <View>
                <Text style={styles.stockSymbol}>{s.symbol}</Text>
                <Text style={styles.stockName}>{s.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.stockPrice}>${s.price.toFixed(2)}</Text>
                <Text style={[styles.stockChange, s.change.startsWith('+') ? styles.up : styles.down]}>
                  {s.change}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* News */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tin tức mới nhất</Text>
          {newsArticles.map(a => (
            <View key={a.id} style={styles.newsCard}>
              <Image source={a.image} style={styles.newsImg} />
              <View style={styles.newsText}>
                <Text style={styles.newsTitle}>{a.title}</Text>
                <Text style={styles.newsMeta}>{a.source} • {a.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <BottomNav activeRoute="Dashboard" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  statusTime: { color: '#fff', fontWeight: '600' },
  statusIcons: { flexDirection: 'row' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row' },
  iconBtn: { padding: 6, marginLeft: 8, borderRadius: 20 },

  searchWrapper: { paddingHorizontal: 16, marginBottom: 12, position: 'relative' },
  searchIcon: { position: 'absolute', top: 12, left: 20 },
  searchInput: { paddingLeft: 44, height: 40, borderRadius: 12, backgroundColor: '#1a1a1a', color: '#fff' },

  content: { paddingHorizontal: 16, paddingBottom: 80 },
  section: { marginBottom: 24 },

  card: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#ccc' },
  cardValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginVertical: 4 },
  cardChange: { fontSize: 12 },
  up: { color: '#4ade80' },
  down: { color: '#f87171' },

  sectionTitle: { color: '#fff', fontSize: 18, marginBottom: 8 },

  stockCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 12 },
  stockSymbol: { color: '#fff', fontSize: 16, fontWeight: '600' },
  stockName: { color: '#aaa', fontSize: 12 },
  stockPrice: { color: '#fff', fontSize: 16, fontWeight: '600' },
  stockChange: { fontSize: 12 },

  newsCard: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 12 },
  newsImg: { width: 100, height: 70, borderRadius: 6 },
  newsText: { flex: 1, paddingLeft: 12 },
  newsTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  newsMeta: { color: '#aaa', fontSize: 12, marginTop: 4 },
});
