// components/BottomMarket.jsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BottomMarket() {
  const navigation = useNavigation();

  const items = [
    { name: "Dashboard", icon: "home", lib: Ionicons, label: "Trang chủ" },
    { name: "Market", icon: "chart-line", lib: MaterialCommunityIcons, label: "Thị trường" },
    { name: "News", icon: "newspaper-outline", lib: Ionicons, label: "Tin tức" },
    { name: "StockCompare", icon: "stats-chart", lib: Ionicons, label: "So sánh" }, // 👈 thêm
    { name: "Account", icon: "person-outline", lib: Ionicons, label: "Tài khoản" },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isActive = item.name === "Market"; // 👈 đang ở Market
        const IconLib = item.lib;
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.button}
            onPress={() => navigation.navigate(item.name)}
          >
            <IconLib
              name={item.icon}
              size={22}
              color={isActive ? "#4CAF50" : "#64748b"} // xanh lá khi active
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    backgroundColor: "#0f172a",
    paddingVertical: 8,
    justifyContent: "space-around",
  },
  button: { alignItems: "center", flex: 1 },
  label: { fontSize: 11, color: "#64748b", marginTop: 2 },
  activeLabel: { color: "#4CAF50", fontWeight: "600" }, 
});
