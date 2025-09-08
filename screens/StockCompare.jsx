import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import BottomNav from "./BottomNav";

// ===== Mock Data =====
const mockStocks = [
  { symbol: "FPT", name: "FPT Corp", price: 100300, change: 11400, changePercent: 11.44, buyPrice: 90000, yesterday: 100300 },
  { symbol: "VNINDEX", name: "VN-Index", price: 1654.2, change: -8346, changePercent: -83.46, buyPrice: 10000, yesterday: 1654.2 },
  { symbol: "ACB", name: "Asia Commercial Bank", price: 28450, change: 13800, changePercent: 13.8, buyPrice: 25000, yesterday: 28450 },
  { symbol: "VIB", name: "VIB Bank", price: 20500, change: 820, changePercent: 4.16, buyPrice: 18000, yesterday: 20500 },
];

const formatPrice = (n) => new Intl.NumberFormat("vi-VN").format(n);
const formatChange = (n) => (n > 0 ? `+${formatPrice(n)}` : formatPrice(n));

export default function StockComparison() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(["FPT", "VNINDEX"]);
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mockStocks;
    return mockStocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [search]);

  const selectedData = useMemo(
    () => mockStocks.filter((s) => selected.includes(s.symbol)),
    [selected]
  );

  const toggle = (sym) => {
    setSelected((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 So sánh chứng khoán</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#aaa" style={{ marginRight: 6 }} />
          <TextInput
            style={{ flex: 1, color: "#fff" }}
            placeholder="Nhập mã cổ phiếu..."
            placeholderTextColor="#777"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((stock) => {
          const isSel = selected.includes(stock.symbol);
          return (
            <TouchableOpacity
              key={stock.symbol}
              style={[styles.card, isSel && styles.selected]}
              onPress={() => toggle(stock.symbol)}
            >
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.symbol}>{stock.symbol}</Text>
                  <Text style={styles.name}>{stock.name}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.price}>{formatPrice(stock.price)}</Text>
                  <Text
                    style={{
                      color: stock.change >= 0 ? "#4CAF50" : "#f44336",
                      fontWeight: "600",
                    }}
                  >
                    {formatChange(stock.change)} ({stock.changePercent}%)
                  </Text>
                </View>
              </View>
              <View style={styles.meta}>
                <Text style={styles.metaText}>Giá mua: {formatPrice(stock.buyPrice)}</Text>
                <Text style={styles.metaText}>Hôm qua: {formatPrice(stock.yesterday)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Compare button đặt cuối ScrollView */}
        {selected.length > 1 && (
          <TouchableOpacity style={styles.compareBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="stats-chart" size={18} color="#fff" />
            <Text style={styles.compareText}>
              So sánh {selected.length} mã ({selected.join(", ")})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={{ fontWeight: "700", fontSize: 16, color: "#fff" }}>
                So sánh chi tiết
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.table}>
                <View style={styles.row}>
                  <Text style={styles.cellHead}>Chỉ số</Text>
                  {selectedData.map((s) => (
                    <Text key={s.symbol} style={styles.cellHead}>
                      {s.symbol}
                    </Text>
                  ))}
                </View>
                {[
                  { label: "Giá hiện tại", field: "price" },
                  { label: "Thay đổi", field: "change" },
                  { label: "Giá mua", field: "buyPrice" },
                  { label: "Hôm qua", field: "yesterday" },
                ].map((row) => (
                  <View style={styles.row} key={row.label}>
                    <Text style={styles.cellHead}>{row.label}</Text>
                    {selectedData.map((s) => (
                      <Text
                        key={s.symbol}
                        style={[
                          styles.cell,
                          row.field === "change" && {
                            color: s.change >= 0 ? "#4CAF50" : "#f44336",
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {row.field === "price" || row.field.includes("Price")
                          ? formatPrice(s[row.field])
                          : row.field === "change"
                          ? `${formatChange(s.change)} (${s.changePercent}%)`
                          : formatPrice(s[row.field])}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#121212" },
  header: { padding: 16, borderBottomWidth: 1, borderColor: "#333" },
  title: { color: "#fff", fontWeight: "700", fontSize: 18, marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
  },
  list: { padding: 12 },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  selected: { borderColor: "#4CAF50" },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  symbol: { fontSize: 18, fontWeight: "700", color: "#fff" },
  name: { fontSize: 13, color: "#aaa" },
  price: { fontSize: 18, fontWeight: "700", color: "#fff" },
  meta: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  metaText: { fontSize: 12, color: "#888" },
  compareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 90, // chừa chỗ cho BottomNav
  },
  compareText: { color: "#fff", fontWeight: "700", marginLeft: 8 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,.7)", justifyContent: "flex-end" },
  modal: {
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#333",
  },
  table: { padding: 12 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#333", paddingVertical: 8 },
  cellHead: { flex: 1, fontWeight: "700", color: "#fff" },
  cell: { flex: 1, textAlign: "center", color: "#fff" },
});
