import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import newschatService from "../services/newschat";

/* =========== Utils & Format =========== */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()} ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function BottomNavLocal({ active = "News" }) {
  const nav = useNavigation();
  const tabs = [
    { key: "Dashboard", label: "Trang chủ", icon: <Ionicons name="home" size={22} /> },
    { key: "Market", label: "Thị trường", icon: <MaterialCommunityIcons name="chart-line" size={22} /> },
    { key: "News", label: "Tin tức", icon: <Ionicons name="newspaper-outline" size={22} /> },
    { key: "StockCompare", label: "So sánh", icon: <Ionicons name="stats-chart" size={22} /> },
    { key: "Account", label: "Tài khoản", icon: <Ionicons name="person-outline" size={22} /> },
  ];
  return (
    <View style={styles.nav}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.navBtn}
            onPress={() => nav.navigate(t.key)}
          >
            {React.cloneElement(t.icon, { color: isActive ? "#22c55e" : "#6b7280" })}
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
function TypingIndicator() {
  return (
    <View style={styles.typingWrap}>
      <View style={styles.dot} />
      <View style={[styles.dot, { opacity: 0.5 }]} />
      <View style={[styles.dot, { opacity: 0.8 }]} />
    </View>
  );
}

/* =========== Chat Utils =========== */
function formatBotHistory(text) {
  if (!text || typeof text !== "string") return text;
  const isJson =
    text.startsWith("{") && (text.includes('"success":true') || text.includes('"data"'));
  if (!isJson) return text;

  try {
    const payload = JSON.parse(text);
    if (payload.data && payload.data.symbol && payload.data.date) {
      return buildStockReply(`📊 ${payload.data.symbol} - ${payload.data.date}`, payload);
    }
    if (Array.isArray(payload.data)) {
      return buildRangeReply(payload.data[0]?.symbol || "?", payload, payload.data.length);
    }
    if (typeof payload.answer === "string") return payload.answer;
    return text;
  } catch {
    return text;
  }
}
function renderFormattedText(text) {
  if (!text) return null;
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return lines.map((line, idx) => {
    if (line.startsWith("### ")) {
      return (
        <Text key={idx} style={styles.heading}>
          {line.replace("### ", "")}
        </Text>
      );
    }
    if (line.startsWith("#### ")) {
      return (
        <Text key={idx} style={styles.subHeading}>
          {line.replace("#### ", "")}
        </Text>
      );
    }
    if (line.trim().startsWith("- ")) {
      return (
        <Text key={idx} style={styles.bullet}>
          • {line.replace("- ", "")}
        </Text>
      );
    }
    if (line.includes(",") && line.length > 60) {
      return line.split(",").map((part, j) => (
        <Text key={`${idx}-${j}`} style={styles.bullet}>
          • {part.trim()}
        </Text>
      ));
    }
    return (
      <Text key={idx} style={styles.msgText}>
        {line}
      </Text>
    );
  });
}
function parseIntent(raw) {
  const text = (raw || "").trim();
  if (!text) return { type: "empty" };
  const lower = text.toLowerCase();
  const firstToken = text.split(/\s+/)[0];
  const symbolGuess = firstToken.replace(/[^a-zA-Z]/g, "");
  const isSymbol = /^[a-zA-Z]{2,5}$/.test(symbolGuess);
  const symbol = isSymbol ? symbolGuess.toUpperCase() : null;
  if (symbol && (/\bhôm\s*nay\b/.test(lower) || /\btoday\b/.test(lower))) {
    return { type: "today", symbol };
  }
  if (symbol && (/\bhôm\s*qua\b/.test(lower) || /\byesterday\b/.test(lower))) {
    return { type: "yesterday", symbol };
  }
  const by1 = text.match(/\bby\s+(\d{4}-\d{2}-\d{2})\b/i);
  const by2 = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (symbol && (by1 || by2)) {
    return { type: "byDate", symbol, date: (by1?.[1] || by2?.[1]) };
  }
  const rangeMatch = text.match(/\b(range\s+)?(\d{1,3})\s*(ngày|day|d)\b/i);
  if (symbol && rangeMatch) {
    return { type: "range", symbol, days: Number(rangeMatch[2]) };
  }
  const monthMatch = text.match(/\b(1|một)\s*tháng\b/i);
  if (symbol && monthMatch) {
    return { type: "range", symbol, days: 30 };
  }
  if (symbol && text.split(/\s+/).length === 1) {
    return { type: "today", symbol };
  }
  return { type: "chat", query: text };
}
function buildStockReply(title, payload) {
  if (!payload?.success) {
    return payload?.message ? `❌ ${payload.message}` : "❌ Không có dữ liệu.";
  }
  const d = payload.data;
  if (!d) return "❌ Không có dữ liệu.";
  let out = `### ${title}\n`;
  if (d.date) out += `- Ngày: ${d.date}\n`;
  if (d.referencePrice != null) out += `- Giá tham chiếu: ${d.referencePrice} đ\n`;
  if (d.open != null) out += `- Giá mở cửa: ${d.open} đ\n`;
  if (d.high != null) out += `- Cao nhất: ${d.high} đ\n`;
  if (d.low != null) out += `- Thấp nhất: ${d.low} đ\n`;
  if (d.close != null) out += `- Đóng cửa: ${d.close} đ\n`;
  if (d.change != null) out += `- Thay đổi: ${d.change}\n`;
  if (d.percentChange != null) out += `- % thay đổi: ${d.percentChange}%\n`;
  if (d.volume != null) out += `- Khối lượng: ${d.volume} cp\n`;
  if (d.value != null) out += `- Giá trị khớp: ${d.value}\n`;
  return out.trim();
}
function buildRangeReply(symbol, payload, days) {
  if (!payload?.success) {
    return payload?.message
      ? `❌ ${payload.message}`
      : `❌ Không có dữ liệu ${symbol} trong ${days} ngày gần đây.`;
  }
  const rows = payload?.data || [];
  if (!rows.length) return `Không có dữ liệu ${symbol} trong ${days} ngày gần đây.`;
  let out = `### ${symbol} - ${days} ngày gần đây\n`;
  const show = rows.slice(-5);
  show.forEach((r) => {
    out += `- ${r.date}: O:${r.open ?? "-"} H:${r.high ?? "-"} L:${r.low ?? "-"} C:${r.close ?? "-"} Vol:${r.volume ?? "-"}\n`;
  });
  out += `\n(gồm tổng ${rows.length} phiên)`;
  return out.trim();
}

export default function NewsExpo() {
  const nav = useNavigation();
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      from: "bot",
      text: "👋 Xin chào! Hỏi mình kiểu: “FPT hôm nay”, “VNM hôm qua”, “MWG 7 ngày”, “HPG by 2025-08-15”… hoặc gõ câu tự nhiên.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  // Multi conversation
  const [conversationId, setConversationId] = useState(Date.now().toString());
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);

  const listRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      const newConvId = Date.now().toString();
      setConversationId(newConvId);
      setMessages([{
        id: "welcome",
        from: "bot",
        text: "👋 Xin chào! Hỏi mình kiểu: “FPT hôm nay”, “VNM hôm qua”, “MWG 7 ngày”, “HPG by 2025-08-15”… hoặc gõ câu tự nhiên.",
      }]);
      setActiveConv(null);
    }, [])
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
    }, 50);
    return () => clearTimeout(t);
  }, [messages]);

  useEffect(() => { (async () => { await ensureAuth(); })(); }, []);
  useEffect(() => { if (showHistory) loadHistory(); }, [showHistory]);

  const ensureAuth = useCallback(async () => {
    const token = await AsyncStorage.getItem("token");
    const ok = !!token && token.length > 10;
    setNeedLogin(!ok);
    return ok;
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      if (!(await ensureAuth())) return;
      const res = await newschatService.getChatHistory();
      if (res.success) {
        const convs = (res.conversations || []).map((conv) => ({
          id: conv.conversationId,
          title: conv.title || "Đoạn chat",
          messages: conv.messages,
          lastDate: conv.messages[conv.messages.length - 1]?.createdAt,
        }));
        setConversations(convs);
      }
    } catch (e) {
      handleAuthError(e);
    }
  }, [ensureAuth]);

  const startNewChat = () => {
    const newConvId = Date.now().toString();
    setConversationId(newConvId);
    setMessages([{ id: "1", from: "bot", text: "🆕 Đoạn chat mới. Bạn muốn hỏi gì?" }]);
    setActiveConv(null);
    setShowHistory(false);
  };
  const handleSelectHistory = (conv) => {
    setActiveConv(conv);
    setConversationId(conv.id);
    setMessages(
      conv.messages.map((m, i) => ({
        id: `${conv.id}_${i}`,
        from: m.from,
        text: m.text,
      }))
    );
    setShowHistory(false);
  };

  const pushTyping = () => {
    const id = `typing_${Date.now()}`;
    setMessages((prev) => [...prev, { id, from: "bot", typing: true }]);
    return id;
  };
  const replaceTyping = (typingId, text) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === typingId ? { ...m, text, typing: false } : m))
    );
  };
  const handleAuthError = (e) => {
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("chưa đăng nhập") || msg.toLowerCase().includes("token")) {
      setNeedLogin(true);
    }
  };

  // === Gửi chat API
  const handleSend = async () => {
    const q = (input || "").trim();
    if (!q) return;
    if (!(await ensureAuth())) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          from: "bot",
          text: "🔒 Bạn cần đăng nhập để sử dụng chat và dữ liệu thị trường.",
        },
      ]);
      return;
    }
    const userMsg = { id: Date.now().toString(), from: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const typingId = pushTyping();
    setLoadingReply(true);

    try {
      const intent = parseIntent(q);
      let botReply = "";
      if (intent.type === "today") {
        const res = await newschatService.fetchStockToday(intent.symbol);
        botReply = buildStockReply(`📊 ${intent.symbol} - Hôm nay`, res);
        try { await newschatService.askChat(q, { conversationId }); } catch (_) {}
      } else if (intent.type === "yesterday") {
        const res = await newschatService.fetchStockYesterday(intent.symbol);
        botReply = buildStockReply(`📊 ${intent.symbol} - Hôm qua (phiên gần nhất)`, res);
        try { await newschatService.askChat(q, { conversationId }); } catch (_) {}
      } else if (intent.type === "byDate") {
        const res = await newschatService.fetchStockByDate(intent.symbol, intent.date);
        botReply = buildStockReply(`📊 ${intent.symbol} - Ngày ${intent.date}`, res);
        try { await newschatService.askChat(q, { conversationId }); } catch (_) {}
      } else if (intent.type === "range") {
        const days = intent.days > 0 ? intent.days : 7;
        const res = await newschatService.fetchStockRange(intent.symbol, days);
        botReply = buildRangeReply(intent.symbol, res, days);
        try { await newschatService.askChat(q, { conversationId }); } catch (_) {}
      } else if (intent.type === "chat") {
        const res = await newschatService.askChat(intent.query, { conversationId });
        botReply = res?.answer?.trim() || "Mình chưa rõ câu hỏi, bạn có thể nói lại không?";
      } else {
        botReply =
          "Bạn hãy nhập mã như: `FPT`, `FPT hôm nay`, `FPT hôm qua`, `FPT 7 ngày`, `FPT by 2025-08-15`…";
      }
      replaceTyping(typingId, botReply);
      try { await loadHistory(); } catch {}
    } catch (e) {
      handleAuthError(e);
      replaceTyping(typingId, `❌ Lỗi: ${e?.message || "Không lấy được dữ liệu"}`);
    } finally {
      setLoadingReply(false);
    }
  };

  const renderItem = ({ item }) => {
    if (item.typing) {
      return (
        <View style={[styles.msg, styles.botMsg]}>
          <TypingIndicator />
        </View>
      );
    }
    let displayText = item.from === "bot" ? formatBotHistory(item.text) : item.text;
    return (
      <View
        style={[
          styles.msg,
          item.from === "user" ? styles.userMsg : styles.botMsg,
        ]}
      >
        {renderFormattedText(displayText)}
      </View>
    );
  };

  // === Chip fix đẹp sát header, có icon, spacing nhỏ:
  const quickChips = [
    { label: "Báo cáo chi tiết FPT hôm nay", icon: "file-document-outline" }, // <-- CHIP GỢI Ý MỚI!
    { label: "FPT hôm nay", icon: "alpha-f-box-outline" },
    { label: "VNM hôm qua", icon: "alpha-v-box-outline" },
    { label: "MWG 7 ngày", icon: "alpha-m-box-outline" },
    { label: "HPG by 2025-08-15", icon: "alpha-h-box-outline" },
    { label: "FPT 1 tháng", icon: "alpha-f-box-outline" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="trending-up" size={20} color="#0a0a0a" />
          </View>
          <View>
            <Text style={styles.hTitle}>Tin Tức Chứng Khoán</Text>
            <Text style={styles.hSub}>Chat tra cứu thị trường</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setShowHistory(true)}>
          <Ionicons name="menu" size={22} color="#22c55e" />
        </TouchableOpacity>
      </View>
      {/* CHIP SÁT HEADER */}
      <View style={styles.quickChipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipsRow}
        >
          {quickChips.map((chip) => (
            <TouchableOpacity
              key={chip.label}
              style={styles.quickChip}
              activeOpacity={0.92}
              onPress={() => setInput(chip.label)}
            >
              <MaterialCommunityIcons
                name={chip.icon}
                size={14}
                color="#38bdf8"
                style={{ marginRight: 4, opacity: 0.92 }}
              />
              <Text style={styles.quickChipText}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {/* Phần message/chat giữ nguyên */}
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 180 }}
      />
      {/* Nhập chat */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
        style={[styles.inputWrap, { marginBottom: 70 }]}
      >
        <TextInput
          style={styles.input}
          placeholder={
            needLogin
              ? "Bạn cần đăng nhập để chat…"
              : "Nhập: FPT / 'FPT hôm nay' / 'FPT 7 ngày' hoặc câu hỏi tự nhiên..."
          }
          placeholderTextColor="#666"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!loadingReply}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (loadingReply || needLogin) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={loadingReply || needLogin}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
      <BottomNavLocal active="News" />
      {/* Lịch sử chat */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowHistory(false)} />
          <View style={styles.drawer}>
            <Text style={styles.drawerTitle}>📜 Lịch sử đoạn chat</Text>
            <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat}>
              <Ionicons name="add-circle-outline" size={18} color="#22c55e" />
              <Text style={styles.newChatText}>Đoạn chat mới</Text>
            </TouchableOpacity>
            {needLogin ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: "#9ca3af", marginBottom: 8 }}>
                  Bạn cần đăng nhập để xem lịch sử chat.
                </Text>
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => {
                    setShowHistory(false);
                    nav.navigate("Account");
                  }}
                >
                  <Text style={styles.loginBtnText}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ marginTop: 15 }}>
                {conversations.map((conv) => (
                  <TouchableOpacity
                    key={conv.id}
                    style={[
                      styles.historyTab,
                      activeConv?.id === conv.id && styles.historyTabActive,
                    ]}
                    onPress={() => handleSelectHistory(conv)}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color="#22c55e"
                      style={{ marginRight: 6 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTabText}>{conv.title}</Text>
                      {conv.lastDate && (
                        <Text style={styles.historyTabDate}>
                          {formatDate(conv.lastDate)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========== STYLE CHUẨN v0.dev, CHIP SÁT HEADER, ĐẸP =========== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: "#111",
    backgroundColor: "#0a0a0a",
  },
  logo: {
    backgroundColor: "#22c55e",
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  hTitle: { color: "#fff", fontWeight: "900", fontSize: 18 },
  hSub: { color: "#9ca3af", fontSize: 11 },
  menuBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(34,197,94,0.1)",
  },
  // CHIP sát header
  quickChipsWrap: {
    backgroundColor: "#000",
    paddingTop: 0,
    paddingBottom: 2,
    minHeight: 46,
  },
  quickChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 10,
    gap: 6,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a1626",
    borderWidth: 1,
    borderColor: "#144974",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginVertical: 4,
    shadowColor: "#38bdf8",
    shadowOpacity: 0.09,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickChipText: {
    color: "#e0f2fe",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  // ------ Còn lại giữ nguyên như code cũ -----
  loginBanner: {
    marginTop: 8,
    marginHorizontal: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginBannerText: { color: "#9ca3af", flex: 1 },
  loginBtn: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  loginBtnText: { color: "#0a0a0a", fontWeight: "700" },
  msg: { padding: 12, borderRadius: 12, marginVertical: 4, maxWidth: "85%" },
  userMsg: { backgroundColor: "#22c55e", alignSelf: "flex-end" },
  botMsg: { backgroundColor: "#111", alignSelf: "flex-start" },
  msgText: { color: "#fff", fontSize: 15, lineHeight: 22 },
  heading: { color: "#22c55e", fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  subHeading: { color: "#3babd7ff", fontSize: 15, fontWeight: "600", marginTop: 6 },
  bullet: { color: "#fff", fontSize: 15, lineHeight: 22, marginLeft: 10, marginTop: 2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    borderTopWidth: 1,
    borderColor: "#1f2937",
    padding: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#111",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sendBtn: { backgroundColor: "#22c55e", padding: 10, borderRadius: 50 },
  nav: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 20,
    backgroundColor: "#0a0a0a",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  navBtn: { alignItems: "center", gap: 2 },
  navLabel: { fontSize: 11, color: "#6b7280" },
  navLabelActive: { color: "#22c55e", fontWeight: "700" },
  typingWrap: { flexDirection: "row", gap: 4, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ccc", marginHorizontal: 2 },
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  drawer: {
    width: "75%",
    backgroundColor: "#0a0a0a",
    padding: 16,
    paddingTop: 65,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  drawerTitle: { color: "#fff", fontWeight: "bold", fontSize: 16, marginBottom: 12 },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  newChatText: { color: "#22c55e", marginLeft: 6, fontWeight: "600" },
  historyTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#111",
  },
  historyTabActive: { backgroundColor: "#22c55e22" },
  historyTabText: { color: "#fff", fontWeight: "600" },
  historyTabDate: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
});
