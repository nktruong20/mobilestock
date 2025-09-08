import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BottomNav() {
  const navigation = useNavigation();
  const route = useRoute();   // 👈 lấy route hiện tại

  const items = [
    { name: "Dashboard", icon: <Ionicons name="home" size={22} />, label: "Trang chủ" },
    { name: "Market", icon: <MaterialCommunityIcons name="chart-line" size={22} />, label: "Thị trường" },
    { name: "News", icon: <Ionicons name="newspaper-outline" size={22} />, label: "Tin tức" },
    { name: "StockCompare", icon: <Ionicons name="stats-chart" size={22} />, label: "So sánh" },
    { name: "Account", icon: <Ionicons name="person-outline" size={22} />, label: "Tài khoản" },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isActive = item.name === route.name;   // 👈 so sánh trực tiếp
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.button}
            onPress={() => navigation.navigate(item.name)}
          >
            {React.cloneElement(item.icon, {
              color: isActive ? "#4CAF50" : "#888",
            })}
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
    borderTopColor: "#333",
    backgroundColor: "#121212",
    paddingVertical: 8,
    justifyContent: "space-around",
  },
  button: { alignItems: "center" },
  label: { fontSize: 11, color: "#888", marginTop: 3 },
  activeLabel: { color: "#4CAF50", fontWeight: "600" },
});
