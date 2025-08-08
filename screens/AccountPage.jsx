// screens/AccountPage.js
import {
    Feather,
    Ionicons,
    MaterialCommunityIcons,
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

export default function AccountPage() {
  const navigation = useNavigation();

  const user = {
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    memberSince: "Tháng 1, 2023",
    avatarUrl: "https://dautuhanghoa.vn/wp-content/uploads/2020/04/dau-tu-chung-khoan-1.jpg",
  };

  const handleLogout = () => {
    // Xóa session/token ở đây nếu cần
    navigation.replace('Login');  // chuyển về màn Login và clear history
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Status Bar giả */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41 AM</Text>
        <View style={styles.statusIcons}>
          <Ionicons name="wifi" size={16} color="#fff" />
          <MaterialCommunityIcons
            name="battery-charging"
            size={16}
            color="#fff"
            style={{ marginLeft: 6 }}
          />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#ccc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài khoản</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          {/* Avatar + Edit button */}
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Feather name="edit-2" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.username}>{user.name}</Text>
          <Text style={styles.memberSince}>Thành viên từ: {user.memberSince}</Text>

          {/* Thông tin cá nhân */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Thông tin cá nhân</Text>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={16} color="#888" />
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={16} color="#888" />
                <Text style={styles.infoLabel}>Ngày tham gia</Text>
                <Text style={styles.infoValue}>{user.memberSince}</Text>
              </View>
              <TouchableOpacity style={styles.btnOutline}>
                <Feather name="edit-2" size={14} color="#4dabf7" />
                <Text style={styles.btnOutlineText}>Chỉnh sửa hồ sơ</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cài đặt tài khoản */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Cài đặt tài khoản</Text>
            <View style={styles.cardContent}>
              <TouchableOpacity style={styles.btnGhost}>
                <MaterialCommunityIcons name="key" size={16} color="#ccc" />
                <Text style={styles.btnGhostText}>Đổi mật khẩu</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGhost}>
                <Feather name="bell" size={16} color="#ccc" />
                <Text style={styles.btnGhostText}>Quản lý thông báo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGhost}>
                <Feather name="shield" size={16} color="#ccc" />
                <Text style={styles.btnGhostText}>Cài đặt bảo mật</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGhost}>
                <Feather name="settings" size={16} color="#ccc" />
                <Text style={styles.btnGhostText}>Cài đặt chung</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
            <Feather name="log-out" size={16} color="#fff" />
            <Text style={styles.btnLogoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav activeRoute="Account" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 8 },
  statusTime: { color: '#fff', fontSize: 12 },
  statusIcons: { flexDirection: 'row' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#333',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '600' },
  headerSpacer: { width: 24 },

  content: { padding: 16, paddingBottom: 80 },
  profileSection: { alignItems: 'center' },

  avatarWrapper: {
    position: 'relative',
    width: 150, height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatar: { width: '100%', height: '100%' },
  editAvatarBtn: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6, borderRadius: 20,
  },

  username: { color: '#fff', fontSize: 24, fontWeight: '600' },
  memberSince: { color: '#888', fontSize: 14, marginBottom: 16 },

  card: {
    width: '100%', maxWidth: 360,
    backgroundColor: '#222', borderRadius: 8,
    marginBottom: 16, overflow: 'hidden',
  },
  cardHeader: {
    padding: 12, backgroundColor: '#1a1a1a',
    color: '#fff', fontSize: 16, fontWeight: '600',
  },
  cardContent: { padding: 12 },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: { flex: 1, color: '#ccc', marginLeft: 8 },
  infoValue: { color: '#fff', fontWeight: '500' },

  btnOutline: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 8, padding: 8,
    borderWidth: 1, borderColor: '#4dabf7',
    borderRadius: 6,
  },
  btnOutlineText: { color: '#4dabf7', marginLeft: 6 },

  btnGhost: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10,
  },
  btnGhostText: { color: '#ccc', marginLeft: 8 },

  btnLogout: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#c0392b',
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 6, marginTop: 16,
  },
  btnLogoutText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
});
