// screens/MarketPage.jsx
import { useRoute } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import BottomMarket from "../screens/BottomMarket";
import stockService from "../services/stock";

/* ================= Timeframes ================= */
const TF_OPTIONS = [
  { key: "1D", days: 1 },
  { key: "1W", days: 5 },
  { key: "1M", days: 22 },
  { key: "3M", days: 66 },
  { key: "ALL", days: 0 },
];

/* ============= Helpers: Y nice scale ============= */
function niceNum(range, round) {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let nf;
  if (round) {
    if (fraction < 1.5) nf = 1;
    else if (fraction < 3) nf = 2;
    else if (fraction < 7) nf = 5;
    else nf = 10;
  } else {
    if (fraction <= 1) nf = 1;
    else if (fraction <= 2) nf = 2;
    else if (fraction <= 5) nf = 5;
    else nf = 10;
  }
  return nf * Math.pow(10, exponent);
}
function niceScale(min, max, maxTicks = 10) {
  if (!isFinite(min) || !isFinite(max) || min === max) {
    const v = isFinite(min) ? min : 0;
    min = v - 1;
    max = v + 1;
  }
  const range = niceNum(max - min, false);
  const step = niceNum(range / (maxTicks - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push(v);
  return { niceMin, niceMax, ticks };
}

/* ============= Helpers: map quotes -> candles ============= */
function mapQuoteToCandles(quoteObj) {
  if (!quoteObj) return [];
  const { o, h, l, c, v, t } = quoteObj;
  const n = Math.min(
    o?.length || 0,
    h?.length || 0,
    l?.length || 0,
    c?.length || 0,
    v?.length || 0,
    t?.length || 0
  );
  return Array.from({ length: n }, (_, i) => ({
    open: +o[i],
    high: +h[i],
    low: +l[i],
    close: +c[i],
    volume: +v[i],
    time: +t[i] * 1000,
    isUp: +c[i] >= +o[i],
  }));
}

/* ============= Utils for card ============= */
const hashColors = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#14b8a6", "#22c55e",
];
function badgeColor(symbol = "") {
  const s = symbol.toUpperCase().trim();
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return hashColors[sum % hashColors.length];
}
const fmt = (v) =>
  v == null || !isFinite(v) ? "--" : Number(v).toLocaleString("vi-VN");
const pct = (cur, base) =>
  cur != null && base != null && base !== 0
    ? (((cur - base) / base) * 100).toFixed(2)
    : null;

/* ========== Compact Symbol Selector ========== */
function SymbolSelectorCompact({ stocks, selected, onSelect, maxInline = 5 }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const visible = stocks.slice(0, maxInline);
  const overflow = stocks.slice(maxInline);

  const filtered = useMemo(() => {
    const term = q.trim().toUpperCase();
    if (!term) return stocks;
    return stocks.filter((s) => (s.code || "").toUpperCase().includes(term));
  }, [q, stocks]);

  return (
    <>
      {/* Row chips gọn */}
      <View style={styles.selectorRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: "center" }}
        >
          {visible.map((s) => (
            <TouchableOpacity
              key={s.code}
              style={[styles.chip, selected === s.code && styles.chipActive]}
              onPress={() => onSelect(s.code)}
            >
              <Text
                style={[
                  styles.chipText,
                  selected === s.code && styles.chipTextActive,
                ]}
              >
                {s.code}
              </Text>
            </TouchableOpacity>
          ))}

          {overflow.length > 0 && (
            <TouchableOpacity style={styles.chipMore} onPress={() => setOpen(true)}>
              <Text style={styles.chipMoreText}>+{overflow.length}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Bottom sheet modal */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Chọn mã</Text>

            <View style={styles.searchBox}>
              <TextInput
                placeholder="Tìm mã…"
                placeholderTextColor="#718096"
                value={q}
                onChangeText={setQ}
                style={styles.searchInput}
                autoCapitalize="characters"
              />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.map((s) => (
                <TouchableOpacity
                  key={s.code}
                  style={styles.sheetItem}
                  onPress={() => {
                    onSelect(s.code);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sheetItemText,
                      selected === s.code && { color: "#22c55e" },
                    ]}
                  >
                    {s.code}
                  </Text>
                </TouchableOpacity>
              ))}
              {filtered.length === 0 && (
                <Text style={{ color: "#94a3b8", padding: 16 }}>
                  Không tìm thấy mã phù hợp.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ================= Main Page ================= */
export default function MarketPage() {
  const route = useRoute();
  const symbolFromRoute = route.params?.symbol || null;

  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(symbolFromRoute);
  const [timeframe, setTimeframe] = useState("3M");
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [candles, setCandles] = useState([]);

  // Tooltip index
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const clearSelect = () => setSelectedIdx(-1);

  /* -------- init watchlist -------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const list = await stockService.getWatchlist();
        const mapped = (list || []).map((item) => ({
          code: item.symbol,
          buyPrice: item.buyPrice,
          currentPrice: item.currentPrice ?? null,
          yesterdayPrice: item.yesterdayPrice ?? null,
        }));
        setStocks(mapped);
        if (symbolFromRoute) setSelectedStock(symbolFromRoute);
        else if (mapped.length > 0) setSelectedStock(mapped[0].code);
      } catch (err) {
        console.error("❌ Lỗi load Market:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load history
  useEffect(() => {
    if (!selectedStock) return;
    const run = async () => {
      try {
        setLoading(true);
        const res = await stockService.getStockHistory(selectedStock);
        if (!res?.success || !Array.isArray(res.quote) || !res.quote.length) {
          setCandles([]);
          return;
        }
        setCandles(mapQuoteToCandles(res.quote[0]));
      } catch (e) {
        console.error("❌ Lỗi load history:", e);
        setCandles([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [selectedStock]);

  const viewCandles = useMemo(() => {
    if (!candles.length) return [];
    const opt = TF_OPTIONS.find((o) => o.key === timeframe);
    return opt?.days > 0 ? candles.slice(-opt.days) : candles;
  }, [timeframe, candles]);

  const stock = selectedStock
    ? stocks.find((s) => s.code === selectedStock)
    : null;

  /* ---------------- Chart sizing & scale ---------------- */
  const screenW = Dimensions.get("window").width;

  // OY cố định, luôn hiển thị khi lướt
  const AXIS_W = 58;
  const MARGIN = { left: 10, right: 16, top: 16, bottom: 34 };
  const chartH = 260;

  // Kích thước nến
  const candleW = 14;
  const candleGap = 12;

  // Rộng vùng vẽ (đảm bảo tối thiểu để khung ít nến vẫn thoáng)
  const plotCount = Math.max(1, viewCandles.length);
  let plotW = plotCount * (candleW + candleGap) - candleGap;
  const minPlotW = Math.max(screenW * 1.2, 320);
  if (plotW < minPlotW) plotW = minPlotW;
  const scrollSvgW = MARGIN.left + plotW + MARGIN.right;

  // Scale Y + nhiều ticks hơn
  const prices = viewCandles.map((c) => [c.high, c.low]).flat();
  const rawMin = prices.length ? Math.min(...prices) : 0;
  const rawMax = prices.length ? Math.max(...prices) : 1;
  const { niceMin, niceMax, ticks: yTicks } = niceScale(rawMin, rawMax, 10);
  const toY = (price) => {
    const p = (price - niceMin) / (niceMax - niceMin);
    return MARGIN.top + (1 - p) * chartH;
  };

  // Derived values for card
  const cur = stock?.currentPrice ?? null;
  const buy = stock?.buyPrice ?? null;
  const yesterday = stock?.yesterdayPrice ?? null;
  const pctFromBuy = pct(cur, buy);
  const pctFromYesterday = pct(cur, yesterday);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Thị trường</Text>
          <Text style={styles.headerClock}>
            {now.toLocaleTimeString("vi-VN")}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#3b82f6" size="large" />
        ) : !stock ? (
          <Text style={{ color: "#94a3b8", marginTop: 20, textAlign: "center" }}>
            Watchlist trống. Hãy thêm mã cổ phiếu.
          </Text>
        ) : (
          <>
            {/* Symbol selector – gọn đẹp */}
            <SymbolSelectorCompact
              stocks={stocks}
              selected={selectedStock}
              onSelect={(code) => {
                setSelectedStock(code);
                clearSelect();
              }}
            />

            {/* ====== SUMMARY CARD kiểu mới ====== */}
            <View style={styles.summaryCard}>
              {/* top row */}
              <View style={styles.summaryTop}>
                <View style={styles.badgeWrap}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: badgeColor(stock.code) },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {String(stock.code || "")
                        .toUpperCase()
                        .slice(0, 2)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.symName}>{stock.code}</Text>
                    <Text style={styles.symSub}>Giá hiện tại</Text>
                  </View>
                </View>

                <Text style={styles.symPrice}>{fmt(cur)}</Text>
              </View>

              {/* divider */}
              <View style={styles.divider} />

              {/* bottom metrics */}
              <View style={styles.metricsRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Giá mua</Text>
                  <Text style={styles.metricValue}>{fmt(buy)}</Text>
                  <Text
                    style={[
                      styles.metricPct,
                      pctFromBuy == null
                        ? styles.pctNeutral
                        : Number(pctFromBuy) >= 0
                        ? styles.pctUp
                        : styles.pctDown,
                    ]}
                  >
                    {pctFromBuy == null ? "--" : `${pctFromBuy}%`}
                  </Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Hôm qua</Text>
                  <Text style={styles.metricValue}>{fmt(yesterday)}</Text>
                  <Text
                    style={[
                      styles.metricPct,
                      pctFromYesterday == null
                        ? styles.pctNeutral
                        : Number(pctFromYesterday) >= 0
                        ? styles.pctUp
                        : styles.pctDown,
                    ]}
                  >
                    {pctFromYesterday == null ? "--" : `${pctFromYesterday}%`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Timeframe chips */}
            <View style={styles.timeframeRow}>
              {TF_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.tfBtn,
                    timeframe === opt.key && styles.tfBtnActive,
                  ]}
                  onPress={() => {
                    setTimeframe(opt.key);
                    clearSelect();
                  }}
                >
                  <Text style={styles.tfText}>{opt.key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ===== Chart ===== */}
            <View className="time-card" style={styles.card}>
              {!viewCandles.length ? (
                <Text style={{ color: "#94a3b8" }}>Không có dữ liệu chart.</Text>
              ) : (
                <View style={{ flexDirection: "row" }}>
                  {/* OY cố định */}
                  <Svg width={AXIS_W} height={chartH + MARGIN.top + MARGIN.bottom}>
                    <Line
                      x1={AXIS_W - 1}
                      y1={MARGIN.top}
                      x2={AXIS_W - 1}
                      y2={MARGIN.top + chartH}
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                    />
                    {yTicks.map((val, i) => {
                      const y = toY(val);
                      return (
                        <G key={`y-${i}`}>
                          <Line
                            x1={AXIS_W - 7}
                            y1={y}
                            x2={AXIS_W - 1}
                            y2={y}
                            stroke="#64748b"
                            strokeWidth={1}
                          />
                          <SvgText
                            x={AXIS_W - 9}
                            y={y + 3}
                            fontSize="10"
                            fill="#94a3b8"
                            textAnchor="end"
                          >
                            {val.toLocaleString("vi-VN")}
                          </SvgText>
                        </G>
                      );
                    })}
                  </Svg>

                  {/* Plot scrollable */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onScrollBeginDrag={clearSelect}
                  >
                    <Svg width={scrollSvgW} height={chartH + MARGIN.top + MARGIN.bottom}>
                      {/* background */}
                      <Rect
                        x={MARGIN.left}
                        y={MARGIN.top}
                        width={plotW}
                        height={chartH}
                        rx={10}
                        fill="#0f172a"
                      />

                      {/* grid */}
                      {yTicks.map((val, i) => {
                        const y = toY(val);
                        return (
                          <Line
                            key={`grid-${i}`}
                            x1={MARGIN.left}
                            y1={y}
                            x2={MARGIN.left + plotW}
                            y2={y}
                            stroke="#334155"
                            strokeDasharray="3 3"
                            strokeWidth={1}
                          />
                        );
                      })}

                      {/* OX */}
                      <Line
                        x1={MARGIN.left}
                        y1={MARGIN.top + chartH}
                        x2={MARGIN.left + plotW}
                        y2={MARGIN.top + chartH}
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                      />

                      {/* candles */}
                      {viewCandles.map((c, i) => {
                        const xBand = MARGIN.left + i * (candleW + candleGap);
                        const yHigh = toY(c.high);
                        const yLow = toY(c.low);
                        const yOpen = toY(c.open);
                        const yClose = toY(c.close);
                        const color = c.isUp ? "#16a34a" : "#dc2626";
                        const isSel = selectedIdx === i;

                        return (
                          <G key={c.time}>
                            <Rect
                              x={xBand - candleGap / 2}
                              y={MARGIN.top}
                              width={candleW + candleGap}
                              height={chartH}
                              fill="transparent"
                              onPress={() => setSelectedIdx(i)}
                            />
                            <Line
                              x1={xBand + candleW / 2}
                              y1={yHigh}
                              x2={xBand + candleW / 2}
                              y2={yLow}
                              stroke={color}
                              strokeWidth={1.6}
                            />
                            <Rect
                              x={xBand}
                              y={Math.min(yOpen, yClose)}
                              width={candleW}
                              height={Math.max(1, Math.abs(yClose - yOpen))}
                              fill={color}
                              rx={2}
                              onPress={() => setSelectedIdx(i)}
                            />
                            {isSel && (
                              <Line
                                x1={xBand + candleW / 2}
                                y1={MARGIN.top}
                                x2={xBand + candleW / 2}
                                y2={MARGIN.top + chartH}
                                stroke="#e5e7eb"
                                strokeDasharray="4 3"
                                strokeWidth={1}
                              />
                            )}
                          </G>
                        );
                      })}

                      {/* X labels: hiện TẤT CẢ ngày */}
                      {viewCandles.map((c, i) => {
                        const x =
                          MARGIN.left + i * (candleW + candleGap) + candleW / 2;
                        const y = MARGIN.top + chartH + 14;
                        const dateStr = new Date(c.time).toLocaleDateString(
                          "vi-VN",
                          { day: "2-digit", month: "2-digit" }
                        );
                        return (
                          <G key={`x-${i}`}>
                            <Line
                              x1={x}
                              y1={MARGIN.top + chartH}
                              x2={x}
                              y2={MARGIN.top + chartH + 6}
                              stroke="#64748b"
                              strokeWidth={1}
                            />
                            <SvgText
                              x={x}
                              y={y + 4}
                              fontSize="9"
                              fill="#94a3b8"
                              textAnchor="middle"
                              transform={`rotate(-35, ${x}, ${y})`}
                            >
                              {dateStr}
                            </SvgText>
                          </G>
                        );
                      })}

                      {/* Last price marker */}
                      {viewCandles.length > 0 && (() => {
                        const last = viewCandles[viewCandles.length - 1];
                        const y = toY(last.close);
                        const x1 = MARGIN.left + plotW - 50;
                        const x2 = MARGIN.left + plotW;
                        return (
                          <>
                            <Line
                              x1={MARGIN.left}
                              y1={y}
                              x2={x1}
                              y2={y}
                              stroke="#22c55e"
                              strokeDasharray="4 3"
                              strokeWidth={1}
                            />
                            <Rect
                              x={x1}
                              y={y - 9}
                              width={50}
                              height={18}
                              rx={5}
                              fill="#16a34a"
                            />
                            <SvgText
                              x={(x1 + x2) / 2}
                              y={y + 4}
                              fontSize="10"
                              fill="#ffffff"
                              textAnchor="middle"
                              fontWeight="700"
                            >
                              {last.close.toLocaleString("vi-VN")}
                            </SvgText>
                          </>
                        );
                      })()}

                      {/* Tooltip cho nến đang chọn */}
                      {selectedIdx >= 0 &&
                        selectedIdx < viewCandles.length &&
                        (() => {
                          const c = viewCandles[selectedIdx];
                          const bandX =
                            MARGIN.left + selectedIdx * (candleW + candleGap);
                          const y = Math.min(toY(c.open), toY(c.close)) - 8;
                          const boxW = 168;
                          const boxH = 88;
                          let boxX = bandX - boxW - 8;
                          if (boxX < MARGIN.left) boxX = bandX + candleW + 8;
                          if (boxX + boxW > MARGIN.left + plotW)
                            boxX = Math.max(MARGIN.left, bandX - boxW - 8);
                          const boxY = Math.max(
                            MARGIN.top + 6,
                            Math.min(y, MARGIN.top + chartH - boxH - 6)
                          );
                          const d = new Date(c.time);
                          const dateStr = d.toLocaleDateString("vi-VN", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                          });

                          return (
                            <G key="tip">
                              <Rect
                                x={boxX}
                                y={boxY}
                                width={boxW}
                                height={boxH}
                                rx={8}
                                fill="#0b1220"
                                stroke="#334155"
                                strokeWidth={1}
                              />
                              <SvgText
                                x={boxX + 10}
                                y={boxY + 16}
                                fontSize="11"
                                fill="#e2e8f0"
                                fontWeight="700"
                              >
                                {dateStr}
                              </SvgText>
                              <SvgText x={boxX + 10} y={boxY + 32} fontSize="10" fill="#94a3b8">
                                O: {c.open.toLocaleString("vi-VN")}
                              </SvgText>
                              <SvgText x={boxX + 10} y={boxY + 46} fontSize="10" fill="#94a3b8">
                                H: {c.high.toLocaleString("vi-VN")}
                              </SvgText>
                              <SvgText x={boxX + 10} y={boxY + 60} fontSize="10" fill="#94a3b8">
                                L: {c.low.toLocaleString("vi-VN")}
                              </SvgText>
                              <SvgText x={boxX + 10} y={boxY + 74} fontSize="10" fill="#94a3b8">
                                C: {c.close.toLocaleString("vi-VN")} • Vol: {c.volume.toLocaleString("vi-VN")}
                              </SvgText>
                            </G>
                          );
                        })()}

                      {/* Tap trống để tắt tooltip */}
                      <Rect
                        x={0}
                        y={0}
                        width={scrollSvgW}
                        height={chartH + MARGIN.top + MARGIN.bottom}
                        fill="transparent"
                        onPress={clearSelect}
                      />
                    </Svg>
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Thông tin chi tiết mã */}
            <StockDetailInfo stockCode={selectedStock} />
          </>
        )}
      </ScrollView>
      <BottomMarket />
    </SafeAreaView>
  );
}

/* =========== COMPONENT: StockDetailInfo =========== */
// Thay thế component StockDetailInfo (bên dưới function MarketPage)
// Thay thế function StockDetailInfo cũ bằng code mới này
function StockDetailInfo({ stockCode }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("today");

  const rangeOptions = [
    { key: "today", label: "Hôm nay" },
    { key: "yesterday", label: "Hôm qua" },
    { key: "3days", label: "3 ngày qua" },
    { key: "week", label: "1 tuần qua" },
  ];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setInfo(null);

    stockService.getStockDetails(stockCode, range)
      .then(res => {
        if (!cancelled) setInfo(res);
      })
      .catch(() => {
        if (!cancelled) setError("Không lấy được dữ liệu chi tiết.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [stockCode, range]);

  // --- UI ---
  if (loading) return <ActivityIndicator color="#3b82f6" />;
  if (error) return <Text style={{ color: "#ef4444" }}>{error}</Text>;
  if (!info) return null;

  // Xử lý hiển thị màu biến động giá
  const priceUp = info.priceChange > 0;
  const priceDown = info.priceChange < 0;
  const priceZero = info.priceChange === 0;

  // Định dạng %
  const pctStr =
    info.priceChangePercent != null
      ? `${info.priceChange > 0 ? "+" : ""}${info.priceChangePercent}%`
      : "--";

  // Định dạng giá trị %
  const priceChangeStr =
    info.priceChange != null
      ? `${info.priceChange > 0 ? "+" : ""}${fmt(info.priceChange)} (${pctStr})`
      : "--";

  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailHeader}>
        Thông tin chi tiết về mã {info.symbol}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.detailRangeRowWrap}
        style={{ marginBottom: 14, marginTop: -4 }}
      >
        {rangeOptions.map(opt => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setRange(opt.key)}
            style={[
              styles.detailRangeBtn,
              range === opt.key && styles.detailRangeBtnActive,
            ]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.detailRangeText,
                range === opt.key && styles.detailRangeTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Info detail */}
      <View style={styles.detailRow}>
  <Text style={styles.detailLabel}>
    Giờ giao dịch:
    <Text style={styles.detailValue}> {info.openTime || "--"} </Text>
    <Text style={{ color: "#64748b", fontWeight: "400" }}>—</Text>
    <Text style={styles.detailValue}> {info.closeTime || "--"}</Text>
  </Text>
</View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Giá mở cửa:</Text>
        <Text style={styles.detailValue}>{fmt(info.openPrice)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Giá đóng cửa:</Text>
        <Text style={styles.detailValue}>{fmt(info.closePrice)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Giá cao nhất:</Text>
        <Text style={styles.detailValue}>{fmt(info.highPrice)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Giá thấp nhất:</Text>
        <Text style={styles.detailValue}>{fmt(info.lowPrice)}</Text>
      </View>
      
      
      {/* Thêm các trường nâng cao */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Giá tham chiếu:</Text>
        <Text style={styles.detailValue}>{fmt(info.referencePrice)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Giá trần / sàn:</Text>
        <Text style={styles.detailValue}>
          {fmt(info.ceilingPrice)} / {fmt(info.floorPrice)}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Khối lượng GD:</Text>
        <Text style={styles.detailValue}>{fmt(info.volume)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Giá trị GD:</Text>
        <Text style={styles.detailValue}>{fmt(info.value)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Biến động giá:</Text>
        <Text
          style={[
            styles.detailValue,
            priceUp && { color: "#22c55e" },
            priceDown && { color: "#ef4444" },
            priceZero && { color: "#fbbf24" },
          ]}
        >
          {priceChangeStr}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Thanh khoản:</Text>
        <Text style={[styles.detailValue, info.liquidityCompare?.includes("cao hơn") ? { color: "#22c55e" } : { color: "#eab308" }]}>
          {info.liquidityCompare || "--"}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>RSI (14):</Text>
        <Text
          style={[
            styles.detailValue,
            info.rsi14 >= 70
              ? { color: "#fbbf24", fontWeight: "700" }
              : info.rsi14 <= 30
              ? { color: "#60a5fa", fontWeight: "700" }
              : { color: "#e2e8f0" },
          ]}
        >
          {info.rsi14 != null ? `${info.rsi14} (${info.rsiStatus})` : "--"}
        </Text>
      </View>
      {/* Khuyến nghị & nhận định */}
      <Text style={styles.recommendHeader}>Khuyến nghị & Phân tích</Text>
      <View style={styles.recommendRow}>
        <Text style={styles.recommendLabel}>Khuyến nghị:</Text>
        <Text
          style={[
            styles.recommendStrong,
            info.recommendation === "NÊN MUA" && styles.recommendBuy,
            info.recommendation === "CÂN NHẮC CHỐT LỜI" && styles.recommendWarn,
            info.recommendation === "KHÔNG MUA ĐUỔI" && styles.recommendSell,
          ]}
        >
          {info.recommendation || "--"}
        </Text>
      </View>
      <View style={styles.recommendSummaryBox}>
        <Text style={styles.recommendSummaryTitle}>Nhận định tổng quan</Text>
        <Text style={styles.recommendSummary}>{info.analysis || "--"}</Text>
      </View>
    </View>
  );
}


/* ================= Styles ================= */
const styles = StyleSheet.create({
  
  safe: { flex: 1, backgroundColor: "#0f172a" },
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#60a5fa" },
  headerClock: { fontSize: 14, color: "#94a3b8" },

  /* selector compact */
  selectorRow: { marginBottom: 12, paddingHorizontal: 4 },
  chip: {
    backgroundColor: "#1e293b",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#3b82f6" },
  chipText: { color: "#e2e8f0", fontWeight: "700", fontSize: 13, letterSpacing: 0.2 },
  chipTextActive: { color: "#fff" },
  chipMore: {
    backgroundColor: "#0b1220",
    borderWidth: 1, borderColor: "#334155",
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12,
  },
  chipMoreText: { color: "#94a3b8", fontWeight: "700" },

  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingBottom: 20, maxHeight: "70%",
  },
  sheetHandle: { alignSelf: "center", width: 44, height: 4, borderRadius: 4, backgroundColor: "#334155", marginTop: 10, marginBottom: 12 },
  sheetTitle: { color: "#f8fafc", fontWeight: "700", fontSize: 16, paddingHorizontal: 16, marginBottom: 10 },
  searchBox: { marginHorizontal: 16, marginBottom: 8, backgroundColor: "#0b1220", borderRadius: 10, borderWidth: 1, borderColor: "#334155" },
  searchInput: { color: "#e2e8f0", paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  sheetItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1f2937" },
  sheetItemText: { color: "#cbd5e1", fontWeight: "700", fontSize: 15 },

  /* summary card (kiểu mới) */
  summaryCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeWrap: { flexDirection: "row", alignItems: "center" },
  badge: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  symName: { color: "#f8fafc", fontWeight: "800", fontSize: 18, letterSpacing: 0.3 },
  symSub: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  symPrice: { color: "#ffffff", fontWeight: "800", fontSize: 22 },

  divider: { height: 1, backgroundColor: "#1f2937", marginVertical: 12, borderRadius: 1 },

  metricsRow: { flexDirection: "row" },
  metricCol: { flex: 1 },
  metricLabel: { color: "#94a3b8", fontSize: 12 },
  metricValue: { color: "#e5e7eb", fontSize: 16, fontWeight: "700", marginTop: 2 },
  metricPct: { marginTop: 2, fontWeight: "700" },
  pctUp: { color: "#22c55e" },
  pctDown: { color: "#ef4444" },
  pctNeutral: { color: "#9ca3af" },

  /* generic card for chart */
  card: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 },

  timeframeRow: { flexDirection: "row", marginBottom: 12, flexWrap: "wrap" },
  tfBtn: {
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6,
    backgroundColor: "#334155", marginRight: 8, marginBottom: 8,
  },
  tfBtnActive: { backgroundColor: "#10b981" },
  tfText: { color: "#fff", fontSize: 12 },

  /* chi tiết mã */
   detailCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
detailHeader: {
  color: "#60a5fa", // <-- đổi từ vàng sang xanh dương nhạt
  fontSize: 17,
  fontWeight: "800",
  marginBottom: 8,
  letterSpacing: 0.3,
},
detailRangeRowWrap: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
  // Nếu tràn thì lướt ngang
  flexWrap: 'nowrap',
  overflow: 'visible',
},
detailRangeBtn: {
  backgroundColor: '#334155',
  borderRadius: 999,
  paddingVertical: 3,   // nhỏ lại
  paddingHorizontal: 14, // nhỏ lại
  marginRight: 7,
  marginBottom: 10,
  marginTop:10,
  minHeight: 26,        // rất gọn
  minWidth: 0,
  elevation: 0,
  shadowColor: 'transparent',
},
detailRangeBtnActive: {
  backgroundColor: '#10b981',
},
detailRangeText: {
  color: '#e2e8f0',
  fontSize: 13,
  fontWeight: '700',
  paddingTop:2,
  letterSpacing: 0.1,
},
detailRangeTextActive: {
  color: '#fff',
},

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    color: "#94a3b8",
    fontSize: 14,
  },
  detailValue: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "600",
  },
recommendCard: {
  backgroundColor: "#212c3b",
  borderRadius: 14,
  padding: 16,
  marginBottom: 22,
  borderWidth: 1,
  borderColor: "#283141",
  shadowColor: "#111",
  shadowOpacity: 0.18,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
},
recommendHeader: {
  color: "#60a5fa", // xanh dương nhạt
  fontSize: 16,
  fontWeight: "bold",
  letterSpacing: 0.15,
  marginBottom: 14,
},
recommendRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-end",
  marginBottom: 6,
},
recommendLabel: {
  color: "#b6c0d6",
  fontSize: 13,
  fontWeight: "600",
  letterSpacing: 0.1,
},
recommendValue: {
  color: "#e0e7ef",
  fontSize: 15.5,
  fontWeight: "700",
},
recommendStrong: {
  fontSize: 16.5,
  fontWeight: "bold",
},
recommendBuy: { color: "#22c55e" },
recommendSell: { color: "#ef4444" },
recommendUp: { color: "#10b981" },
recommendWarn: { color: "#fbbf24", fontWeight: "bold" },

recommendSummaryBox: {
  backgroundColor: "#232c3c",
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 14,
  marginTop: 14,
  borderWidth: 1,
  borderColor: "#2e3a4f",
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
},
recommendSummaryTitle: {
  color: "#60a5fa", // xanh dương nhạt
  fontSize: 14.5,
  fontWeight: "800",
  marginBottom: 7,
  letterSpacing: 0.13,
},
recommendSummary: {
  color: "#e2e8f0",
  fontSize: 14.3,
  lineHeight: 21,
  fontWeight: "500",
},

});
