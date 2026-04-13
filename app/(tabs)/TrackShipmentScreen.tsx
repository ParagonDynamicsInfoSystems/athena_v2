import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import erpApi from "../hooks/erpApi";

const BG_IMAGE = require("../../assets/images/bg.png");

const SEARCH_OPTIONS = [
  { label: "MBL No", type: "bookingNo", icon: "document-text-outline" as const },
  { label: "Container No", type: "containerNo", icon: "cube-outline" as const },
];

export default function TrackShipmentScreen() {
  const router = useRouter();
  const { mblNo } = useLocalSearchParams<{ mblNo?: string }>();
  const didAutoSearch = useRef(false);

  const [searchBy, setSearchBy] = useState(SEARCH_OPTIONS[0]);
  const [value, setValue] = useState(mblNo || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);

  /* ===== SEARCH ===== */
  const handleSearch = async (overrideValue?: string) => {
    const searchValue = overrideValue || value;
    if (!searchValue.trim()) return;

    try {
      setLoading(true);
      setSummary(null);
      setTimeline([]);
      setShowTimeline(false);

      const params =
        searchBy.type === "bookingNo"
          ? { mbldocno: searchValue.trim(), containerno: "", type: "bookingNo" }
          : { mbldocno: "", containerno: searchValue.trim(), type: "containerNo" };

      const res = await erpApi.get("/Athena/app/master/mabl/synccard", { params });
      const d = res.data;

      if (!d) return;

      setSummary({
        mbl: d.mbldocno,
        carrier: d.headcarrier,
        vesselVoyage: `${d.vessel} ${d.voyage}`,
        from: d.from,
        to: d.to,
        etd: d.etd,
        eta: d.eta,
        manifestCutOff: d.manifestCutOff,
        containerInfo:
          d.containerDetails?.length > 0
            ? `${d.containerDetails[0].size}DS * 1`
            : "",
        status: d.status?.toUpperCase(),
      });

      setTimeline(d.containerDetails?.[0]?.timeline || []);
    } catch (e) {
      if (__DEV__) console.log("Tracking error:", e);
    } finally {
      setLoading(false);
    }
  };

  /* ===== AUTO-SEARCH when mblNo is passed ===== */
  useEffect(() => {
    if (mblNo && !didAutoSearch.current) {
      didAutoSearch.current = true;
      handleSearch(mblNo);
    }
  }, [mblNo]);

  /* ===== STATUS COLOR ===== */
  const getStatusStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "completed":
        return { bg: "#ECFDF5", text: "#059669", icon: "checkmark-circle" as const };
      case "in transit":
      case "intransit":
        return { bg: "#EFF6FF", text: "#2563EB", icon: "boat" as const };
      case "pending":
      case "booked":
        return { bg: "#FFFBEB", text: "#D97706", icon: "time" as const };
      default:
        return { bg: "#F1F5F9", text: "#64748B", icon: "ellipse" as const };
    }
  };

  const statusStyle = summary ? getStatusStyle(summary.status) : null;

  return (
    <View style={s.root}>
      <ImageBackground source={BG_IMAGE} style={s.flex1}>
        <View style={s.overlay} />

        <SafeAreaView style={s.flex1}>
          {/* ===== HEADER ===== */}
          <View style={s.header}>
            <Pressable onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
            <View style={s.headerText}>
              <Text style={s.headerTitle}>Shipment Tracking</Text>
              <Text style={s.headerSub}>Track your cargo in real-time</Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
          >
            {/* ===== SEARCH SECTION ===== */}
            <View style={s.searchCard}>
              {/* Search Type Tabs */}
              <View style={s.tabRow}>
                {SEARCH_OPTIONS.map((opt) => {
                  const active = searchBy.type === opt.type;
                  return (
                    <TouchableOpacity
                      key={opt.type}
                      style={[s.tab, active && s.tabActive]}
                      onPress={() => {
                        setSearchBy(opt);
                        setValue("");
                        setDropdownOpen(false);
                      }}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={16}
                        color={active ? "#fff" : "#64748B"}
                      />
                      <Text style={[s.tabText, active && s.tabTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Search Input */}
              <View style={s.inputRow}>
                <View style={s.inputWrap}>
                  <Ionicons name="search" size={18} color="#94A3B8" />
                  <TextInput
                    style={s.input}
                    placeholder={`Enter ${searchBy.label}`}
                    placeholderTextColor="#94A3B8"
                    value={value}
                    onChangeText={setValue}
                    autoCapitalize="characters"
                    onSubmitEditing={() => handleSearch()}
                    returnKeyType="search"
                  />
                  {value.length > 0 && (
                    <Pressable onPress={() => setValue("")}>
                      <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                    </Pressable>
                  )}
                </View>

                <TouchableOpacity
                  style={[s.searchBtn, !value.trim() && s.searchBtnDisabled]}
                  onPress={() => handleSearch()}
                  disabled={!value.trim()}
                >
                  <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ===== LOADING ===== */}
            {loading && (
              <View style={s.loadingWrap}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={s.loadingText}>Tracking shipment...</Text>
              </View>
            )}

            {/* ===== SUMMARY ===== */}
            {summary && !loading && (
              <View style={s.summaryCard}>
                {/* Header — MBL + Status */}
                <View style={s.summaryHeader}>
                  <View style={s.mblBadge}>
                    <MaterialCommunityIcons name="file-document-outline" size={14} color="#fff" />
                    <Text style={s.mblText}>{summary.mbl}</Text>
                  </View>
                  {statusStyle && (
                    <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Ionicons name={statusStyle.icon} size={12} color={statusStyle.text} />
                      <Text style={[s.statusText, { color: statusStyle.text }]}>
                        {summary.status}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Carrier & Vessel */}
                <View style={s.carrierRow}>
                  <View style={s.carrierIcon}>
                    <MaterialCommunityIcons name="ferry" size={18} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={s.carrierName}>{summary.carrier}</Text>
                    <Text style={s.vesselName}>{summary.vesselVoyage}</Text>
                  </View>
                </View>

                <View style={s.divider} />

                {/* Route Visual */}
                <View style={s.routeSection}>
                  <View style={s.routeEndpoint}>
                    <View style={[s.routeDot, { backgroundColor: "#3B82F6" }]} />
                    <View>
                      <Text style={s.routeLabel}>ORIGIN</Text>
                      <Text style={s.routePort}>{summary.from}</Text>
                      <View style={s.dateChip}>
                        <Ionicons name="calendar-outline" size={11} color="#64748B" />
                        <Text style={s.dateChipText}>ETD: {summary.etd}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.routeConnector}>
                    <View style={s.routeLineV} />
                    <View style={s.routeIconCircle}>
                      <MaterialCommunityIcons name="ferry" size={16} color="#94A3B8" />
                    </View>
                    <View style={s.routeLineV} />
                  </View>

                  <View style={s.routeEndpoint}>
                    <View style={[s.routeDot, { backgroundColor: "#10B981" }]} />
                    <View>
                      <Text style={s.routeLabel}>DESTINATION</Text>
                      <Text style={s.routePort}>{summary.to}</Text>
                      <View style={s.dateChip}>
                        <Ionicons name="calendar-outline" size={11} color="#64748B" />
                        <Text style={s.dateChipText}>ETA: {summary.eta}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={s.divider} />

                {/* Info Grid */}
                <View style={s.infoGrid}>
                  {summary.manifestCutOff && (
                    <View style={s.infoCell}>
                      <Ionicons name="warning-outline" size={14} color="#F59E0B" />
                      <Text style={s.infoCellLabel}>Manifest Cut Off</Text>
                      <Text style={s.infoCellValue}>{summary.manifestCutOff}</Text>
                    </View>
                  )}
                  {summary.containerInfo && (
                    <View style={s.infoCell}>
                      <Ionicons name="cube-outline" size={14} color="#8B5CF6" />
                      <Text style={s.infoCellLabel}>Container</Text>
                      <Text style={s.infoCellValue}>{summary.containerInfo}</Text>
                    </View>
                  )}
                </View>

                {/* Timeline Toggle */}
                {timeline.length > 0 && (
                  <TouchableOpacity
                    style={s.timelineToggle}
                    onPress={() => setShowTimeline(!showTimeline)}
                  >
                    <Ionicons
                      name={showTimeline ? "chevron-up-circle" : "chevron-down-circle"}
                      size={18}
                      color="#3B82F6"
                    />
                    <Text style={s.timelineToggleText}>
                      {showTimeline ? "Hide Timeline" : "View Timeline"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ===== TIMELINE ===== */}
            {showTimeline && timeline.length > 0 && (
              <View style={s.timelineCard}>
                <View style={s.timelineHeader}>
                  <Ionicons name="time-outline" size={18} color="#1E293B" />
                  <Text style={s.timelineTitle}>Shipment Timeline</Text>
                </View>

                {timeline.map((item, index) => {
                  if (!item.event) return null;
                  const isActive = !!item.iconEllipse;
                  const isLast = index === timeline.length - 1;

                  return (
                    <View key={index} style={s.tlRow}>
                      {/* Left Track */}
                      <View style={s.tlTrack}>
                        <View
                          style={[
                            s.tlDot,
                            isActive && s.tlDotActive,
                          ]}
                        >
                          {isActive && (
                            <Ionicons name="boat" size={12} color="#fff" />
                          )}
                        </View>
                        {!isLast && (
                          <View style={[s.tlLine, isActive && s.tlLineActive]} />
                        )}
                      </View>

                      {/* Content */}
                      <View style={[s.tlContent, isActive && s.tlContentActive]}>
                        <Text style={[s.tlEvent, isActive && s.tlEventActive]}>
                          {item.event}
                        </Text>
                        {item.location && (
                          <View style={s.tlLocationRow}>
                            <Ionicons name="location-outline" size={12} color="#94A3B8" />
                            <Text style={s.tlLocation}>{item.location}</Text>
                          </View>
                        )}
                        {item.date && (
                          <View style={s.tlDateRow}>
                            <Ionicons name="time-outline" size={12} color="#94A3B8" />
                            <Text style={s.tlDate}>{item.date}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ===== EMPTY STATE (no results after search) ===== */}
            {!loading && !summary && didAutoSearch.current && (
              <View style={s.emptyWrap}>
                <View style={s.emptyIcon}>
                  <MaterialCommunityIcons name="ship-wheel" size={48} color="rgba(255,255,255,0.25)" />
                </View>
                <Text style={s.emptyTitle}>No Results Found</Text>
                <Text style={s.emptySub}>Check the MBL or container number and try again</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

/* ================= STYLES ================= */
const s = StyleSheet.create({
  root: { flex: 1 },
  flex1: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 11, 30, 0.78)",
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    marginTop: 2,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* Search Card */
  searchCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tabActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },
  tabTextActive: {
    color: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },
  searchBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnDisabled: {
    backgroundColor: "rgba(59,130,246,0.4)",
  },

  /* Loading */
  loadingWrap: {
    alignItems: "center",
    marginTop: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
  },

  /* Summary Card */
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    marginTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  mblBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mblText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  /* Carrier */
  carrierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  carrierIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  carrierName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  vesselName: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },

  /* Route */
  routeSection: {
    gap: 4,
  },
  routeEndpoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  routeLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  routePort: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 1,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  dateChipText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  routeConnector: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 4,
    gap: 8,
    marginVertical: 4,
  },
  routeLineV: {
    width: 20,
    height: 1.5,
    backgroundColor: "#E2E8F0",
  },
  routeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Info Grid */
  infoGrid: {
    flexDirection: "row",
    gap: 10,
  },
  infoCell: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  infoCellLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  infoCellValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },

  /* Timeline Toggle */
  timelineToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.06)",
  },
  timelineToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3B82F6",
  },

  /* Timeline Card */
  timelineCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },

  /* Timeline Row */
  tlRow: {
    flexDirection: "row",
    minHeight: 60,
  },
  tlTrack: {
    width: 36,
    alignItems: "center",
  },
  tlDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F1F5F9",
  },
  tlDotActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#BFDBFE",
  },
  tlLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  tlLineActive: {
    backgroundColor: "#BFDBFE",
  },
  tlContent: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 20,
    borderRadius: 12,
    padding: 12,
    marginLeft: 4,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  tlContentActive: {
    backgroundColor: "#EFF6FF",
  },
  tlEvent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  tlEventActive: {
    fontWeight: "700",
    color: "#1E40AF",
  },
  tlLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  tlLocation: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  tlDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  tlDate: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },

  /* Empty State */
  emptyWrap: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
});
