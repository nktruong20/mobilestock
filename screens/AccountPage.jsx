// screens/ProfileExpo.jsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ Dùng chung API & hàm getProfile đã cấu hình trong services/auth.js
// 👉 CHỈNH LẠI ĐƯỜNG DẪN NẾU CẦN
import { getProfile as apiGetProfile } from "../services/auth";

/**
 * ===========================
 * Utils
 * ===========================
 */
function toNameFromEmail(email = "") {
  const i = email.indexOf("@");
  return i > 0 ? email.slice(0, i) : email;
}

function formatCurrencyVND(n) {
  if (n == null) return "—";
  try {
    return Number(n).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  } catch {
    return `${n}`;
  }
}

function formatPercent(p) {
  if (p == null) return "—";
  try {
    const num = Number(p);
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toFixed(1)}%`;
  } catch {
    return `${p}%`;
  }
}

function toJoinedText(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const month = d.toLocaleString("vi-VN", { month: "long" });
    const year = d.getFullYear();
    return `Tham gia từ ${month}, ${year}`;
  } catch {
    return `Tham gia từ ${dateStr}`;
  }
}

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => (out[k] = obj?.[k]));
  return out;
}

/**
 * Gọi profile qua services/auth.js (đã có interceptor gắn token + baseURL chuẩn)
 * Cover các kiểu payload trả về thường gặp: {user}, {data}, hoặc {...profile}
 */
async function fetchProfile() {
  // Nếu thiếu token thì backend sẽ 401, mình catch ở dưới
  const res = await apiGetProfile();
  const p = (res?.user && typeof res.user === "object")
    ? res.user
    : (res?.data && typeof res.data === "object")
      ? res.data
      : res;

  if (!p || typeof p !== "object") {
    throw new Error("Không lấy được hồ sơ người dùng.");
  }
  return p;
}

/**
 * Đăng xuất:
 * - Xóa token + user
 * - Reset navigation về 'Login'
 */
async function doLogout(navigation) {
  await AsyncStorage.multiRemove(["token", "user"]);
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: "Login" }],
    })
  );
}

/* ===== Bottom Nav - giống các trang khác (bám đáy) ===== */
function BottomNav() {
  const nav = useNavigation();
  const items = [
    { key: "Dashboard", label: "Trang chủ", icon: <Ionicons name="home" size={22} /> },
    { key: "Market", label: "Thị trường", icon: <MaterialCommunityIcons name="chart-line" size={22} /> },
    { key: "News", label: "Tin tức", icon: <Ionicons name="newspaper-outline" size={22} /> },
    { key: "StockCompare", label: "So sánh", icon: <Ionicons name="stats-chart" size={22} /> },
    { key: "Account", label: "Cá nhân", icon: <Ionicons name="person-outline" size={22} /> }, // active tab
  ];
  return (
    <View style={styles.nav}>
      {items.map((it) => {
        const active = it.key === "Account";
        return (
          <TouchableOpacity
            key={it.key}
            style={styles.navBtn}
            onPress={() => nav.navigate(it.key)}
          >
            {React.cloneElement(it.icon, { color: active ? "#4CAF50" : "#888" })}
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>
              {it.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ===== Item list trong card ===== */
function MenuRow({ icon, title, last = false, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.row, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowEmoji}>{icon}</Text>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9aa1a9" />
    </TouchableOpacity>
  );
}

/* ===== Màn hình chính ===== */
export default function ProfileExpo() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const p = await fetchProfile();

      // Chuẩn hóa vài trường để hiển thị
      const normalized = {
        // tên ưu tiên: fullName || name || username || từ email
        name:
          p.fullName ||
          p.name ||
          p.username ||
          (p.email ? toNameFromEmail(p.email) : "Người dùng"),
        email: p.email || p.contactEmail || "—",
        avatar: p.avatar || p.photoURL || p.photo || "",

        // ngày tham gia ưu tiên: createdAt || joinedAt || registerDate
        joinedAt: p.createdAt || p.joinedAt || p.registerDate || "",

        // gói/plan nếu có
        plan: p.plan || p.subscription || p.role || "Nhà đầu tư",

        // vài số liệu ví dụ nếu backend có (tuỳ hệ thống)
        ...pick(p, ["portfolioValue", "profitPercent, holdingsCount"]),
      };

      setProfile(normalized);
    } catch (e) {
      // show message backend nếu có
      setErr(e?.response?.data?.message || e?.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Đăng xuất",
      "Bạn chắc chắn muốn đăng xuất?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await doLogout(navigation);
            } catch (e) {
              Alert.alert("Lỗi", e?.message || "Không thể đăng xuất");
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [navigation]);

  const ui = useMemo(() => {
    const name = profile?.name || "—";
    const email = profile?.email || "—";
    const joinedText = toJoinedText(profile?.joinedAt);
    const plan = profile?.plan || "Nhà đầu tư";
    const portfolioValue = formatCurrencyVND(profile?.portfolioValue ?? 2450000000); // fallback demo
    const profitPercent = formatPercent(profile?.profitPercent ?? 15.2);
    const holdingsCount = profile?.holdingsCount ?? 12;

    return { name, email, joinedText, plan, portfolioValue, profitPercent, holdingsCount };
  }, [profile]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header: chỉ còn tiêu đề */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
      >
        {/* Thông báo lỗi */}
        {!!err && (
          <View style={[styles.card, { borderColor: "#7f1d1d", backgroundColor: "#1f0a0a" }]}>
            <Text style={{ color: "#fecaca", fontWeight: "700" }}>
              Lỗi: {err}
            </Text>
            <TouchableOpacity
              onPress={load}
              style={{ marginTop: 10, backgroundColor: "#ef4444", paddingVertical: 10, borderRadius: 10, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Thẻ hồ sơ */}
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: "rgba(255,255,255,.06)",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Ionicons name="person-outline" size={40} color="#94a3b8" />
              </View>
            )}
            <View style={styles.badgePro}>
              <Text style={styles.badgeProText}>
                {ui.plan}
              </Text>
            </View>
          </View>

          <Text style={styles.name}>{ui.name}</Text>
          <Text style={styles.email}>{ui.email}</Text>
          <Text style={styles.join}>{ui.joinedText}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Giá trị danh mục</Text>
              <Text style={[styles.statValue, { opacity: 0.85 }]}>
                {ui.portfolioValue}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Lợi nhuận</Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      (profile?.profitPercent ?? 15.2) >= 0 ? "#22c55e" : "#ef4444",
                  },
                ]}
              >
                {ui.profitPercent}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Trạng thái tài khoản</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: "#7dd3fc", textDecorationLine: "underline" },
                ]}
              >
                {ui.plan}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Cổ phiếu nắm giữ</Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{ui.holdingsCount} cổ phiếu</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Danh sách menu */}
        <View style={[styles.card, { paddingHorizontal: 0, paddingVertical: 6 }]}>
          <MenuRow icon="📈" title="Danh mục đầu tư" onPress={() => {}} />
          <MenuRow icon="📊" title="Lịch sử giao dịch" onPress={() => {}} />
          <MenuRow icon="🔔" title="Thông báo" onPress={() => {}} />
          <MenuRow icon="🛡️" title="Bảo mật" onPress={() => {}} />
          <MenuRow icon="⚙️" title="Cài đặt" onPress={() => {}} />
          <MenuRow icon="❓" title="Trợ giúp" last onPress={() => {}} />
        </View>

        {/* Đăng xuất */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.9} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>{loading ? "Đang tải..." : "Đăng xuất"}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* BottomNav giống các trang khác */}
      <BottomNav />
    </SafeAreaView>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f1215" },

  // Header đơn giản
  header: {
    borderBottomWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#0f1215",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  headerTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    fontSize: 18,
  },

  // Card
  card: {
    backgroundColor: "#12161a",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  avatarWrap: { alignItems: "center", marginTop: 4, marginBottom: 10 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,.06)",
  },
  badgePro: {
    position: "absolute",
    right: "28%",
    bottom: 2,
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: "#22c55e",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  badgeProText: { color: "#0b2810", fontWeight: "900", fontSize: 12 },

  name: {
    textAlign: "center",
    color: "#22c55e",
    fontWeight: "900",
    fontSize: 22,
    marginTop: 6,
  },
  email: { textAlign: "center", color: "#cbd5e1", opacity: 0.95, marginTop: 2 },
  join: { textAlign: "center", color: "#94a3b8", marginTop: 6, marginBottom: 12 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statBox: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,.02)",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 10,
  },
  statLabel: { color: "#94a3b8", fontSize: 12, marginBottom: 4 },
  statValue: { color: "#e5e7eb", fontWeight: "800" },

  chip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(56,189,248,.12)",
    borderColor: "rgba(56,189,248,.25)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { color: "#7dd3fc", fontWeight: "700", fontSize: 12 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#1f2937",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowEmoji: { fontSize: 18, color: "#e5e7eb" },
  rowTitle: { color: "#e5e7eb", fontWeight: "700" },

  logoutBtn: {
    backgroundColor: "#ef4444",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { color: "#fff", fontWeight: "800" },

  // BottomNav giống các trang khác (không floating)
  nav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 25,
    borderTopWidth: 1,
    borderTopColor: "#333",
    backgroundColor: "#121212",
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  navBtn: { alignItems: "center" },
  navLabel: { fontSize: 11, color: "#888", marginTop: 3 },
  navLabelActive: { color: "#4CAF50", fontWeight: "600" },
});
