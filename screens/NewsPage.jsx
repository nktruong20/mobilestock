// screens/NewsPage.js
import {
    Ionicons
} from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import BottomNav from '../screens/BottomNav';

const BASE_IMAGE_URL = 'https://extgw.dsc.com.vn/eback/uploads';

const newsArticles = [
  { id: 1, title: "Công nghệ tăng mạnh", source: "Reuters", time: "2 giờ trước", excerpt: "...", img: 'image_7ba3e7d984.png' },
  { id: 2, title: "Giá dầu tăng vọt", source: "Bloomberg", time: "4 giờ trước", excerpt: "...", img: 'image_7ba3e7d984.png' },
  { id: 3, title: "Công ty X kỷ lục", source: "WSJ", time: "Hôm qua", excerpt: "...", img: 'image_7ba3e7d984.png' },
  { id: 4, title: "Bitcoin cao nhất", source: "CoinDesk", time: "1 ngày trước", excerpt: "…", img: 'image_7ba3e7d984.png' },
  { id: 5, title: "Chuỗi cung ứng toàn cầu", source: "FT", time: "2 ngày trước", excerpt: "…", img: 'image_7ba3e7d984.png' },
  { id: 6, title: "Gói kích thích mới", source: "VnExpress", time: "3 ngày trước", excerpt: "…", img: 'image_7ba3e7d984.png' },
];

export default function NewsPage() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#ccc" />
        </TouchableOpacity>
        <Text style={styles.title}>Tin tức</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {newsArticles.map(item => (
          <View key={item.id} style={styles.card}>
            <Image
              source={{ uri: `${BASE_IMAGE_URL}/${item.img}` }}
              style={styles.image}
            />
            <View style={styles.body}>
              <Text style={styles.headline}>{item.title}</Text>
              <Text style={styles.excerpt}>{item.excerpt}</Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>{item.source}</Text>
                <Text style={styles.metaText}>{item.time}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <BottomNav activeRoute="News" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#1a1a1a' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:12, borderBottomWidth:1, borderBottomColor:'#333' },
  title: { color:'#fff', fontSize:20 },
  content: { padding:16, paddingBottom:80 },
  card: { marginBottom:16, backgroundColor:'#222', borderRadius:8, overflow:'hidden' },
  image: { width:'100%', height:200 },
  body: { padding:12 },
  headline: { color:'#fff', fontSize:16, fontWeight:'600', marginBottom:8 },
  excerpt: { color:'#ccc', fontSize:14, marginBottom:8 },
  meta: { flexDirection:'row', justifyContent:'space-between' },
  metaText: { color:'#888', fontSize:12 },
});
