import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  { label: "Job No", code: "J", icon: "briefcase-outline" as const },
  { label: "HBL / HAWB", code: "H", icon: "document-text-outline" as const },
  { label: "Work Order", code: "W", icon: "construct-outline" as const },
  { label: "Container", code: "C", icon: "cube-outline" as const },
  { label: "Shipper", code: "S", icon: "boat-outline" as const },
  { label: "Customer", code: "CT", icon: "people-outline" as const },
];

export default function ATrackScreen() {
  const router = useRouter();
  const { jobNo } = useLocalSearchParams<{ jobNo?: string }>();
  const didAutoSearch = useRef(false);

  const [searchBy, setSearchBy] = useState(SEARCH_OPTIONS[0]);
  const [trackingNo, setTrackingNo] = useState(jobNo || "");
  const [showOptions, setShowOptions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<any>(null);

  /* ===== SEARCH ===== */
  const handleSearch = async (overrideValue?: string) => {
    const searchValue = overrideValue || trackingNo;
    if (!searchValue.trim()) {
      Alert.alert("Error", "Please enter tracking number");
      return;
    }

    try {
      setLoading(true);
      setTracking(null);

      const response = await erpApi.get("/Athena/feeder/mobileApp/getTracking", {
        params: {
          trackingNo: searchValue.trim(),
          trackingBy: searchBy.code,
        },
      });

      if (!response.data?.lTrackingBean?.length) {
        Alert.alert("No Data", "No tracking details found");
        return;
      }

      setTracking(response.data.lTrackingBean[0]);
    } catch {
      Alert.alert("Error", "Unable to fetch tracking details");
    } finally {
      setLoading(false);
    }
  };

  /* ===== AUTO-SEARCH when jobNo is passed from shipment details ===== */
  useEffect(() => {
    if (jobNo && !didAutoSearch.current) {
      didAutoSearch.current = true;
      setSearchBy(SEARCH_OPTIONS[0]); // Job No
      setTrackingNo(jobNo);
      handleSearch(jobNo);
    }
  }, [jobNo]);

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
              <Text style={s.headerTitle}>ERP Tracking</Text>
              <Text style={s.headerSub}>Search shipments, orders & more</Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
          >
            {/* ===== SEARCH CARD ===== */}
            <View style={s.searchCard}>
              {/* Search Type Selector */}
              <TouchableOpacity
                style={s.typeSelector}
                onPress={() => setShowOptions(!showOptions)}
                activeOpacity={0.7}
              >
                <View style={s.typeSelectorLeft}>
                  <View style={s.typeSelectorIcon}>
                    <Ionicons name={searchBy.icon} size={16} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={s.typeSelectorLabel}>Search By</Text>
                    <Text style={s.typeSelectorValue}>{searchBy.label}</Text>
                  </View>
                </View>
                <Ionicons
                  name={showOptions ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {/* Dropdown Options */}
              {showOptions && (
                <View style={s.optionsGrid}>
                  {SEARCH_OPTIONS.map((opt) => {
                    const active = searchBy.code === opt.code;
                    return (
                      <TouchableOpacity
                        key={opt.code}
                        style={[s.optionChip, active && s.optionChipActive]}
                        onPress={() => {
                          setSearchBy(opt);
                          setShowOptions(false);
                        }}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={14}
                          color={active ? "#fff" : "#64748B"}
                        />
                        <Text style={[s.optionChipText, active && s.optionChipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Search Input */}
              <View style={s.inputRow}>
                <View style={s.inputWrap}>
                  <Ionicons name="search" size={18} color="#94A3B8" />
                  <TextInput
                    style={s.input}
                    placeholder={`Enter ${searchBy.label}`}
                    placeholderTextColor="#94A3B8"
                    value={trackingNo}
                    onChangeText={setTrackingNo}
                    autoCapitalize="characters"
                    onSubmitEditing={() => handleSearch()}
                    returnKeyType="search"
                  />
                  {trackingNo.length > 0 && (
                    <Pressable onPress={() => setTrackingNo("")}>
                      <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                    </Pressable>
                  )}
                </View>
                <TouchableOpacity
                  style={[s.searchBtn, !trackingNo.trim() && s.searchBtnDisabled]}
                  onPress={() => handleSearch()}
                  disabled={!trackingNo.trim()}
                >
                  <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ===== LOADING ===== */}
            {loading && (
              <View style={s.loadingWrap}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={s.loadingText}>Fetching details...</Text>
              </View>
            )}

            {/* ===== RESULTS ===== */}
            {tracking && !loading && (
              <View style={s.resultArea}>
                {/* Shipment Section */}
                <Section
                  title="Shipment"
                  icon="boat-outline"
                  iconColor="#3B82F6"
                >
                  <InfoRow label="Job Code" value={tracking.jobCode} />
                  <InfoRow label="Job Date" value={tracking.jobDate} />
                  <InfoRow label="Mode" value={tracking.mode} />
                  <InfoRow label="Container" value={tracking.containerType} />
                  <InfoRow label="Work Order" value={tracking.workorderno} />
                </Section>

                {/* Route Section */}
                <Section
                  title="Route"
                  icon="navigate-outline"
                  iconColor="#10B981"
                >
                  <View style={s.routeVisual}>
                    <View style={s.routeEndpoint}>
                      <View style={[s.routeDot, { backgroundColor: "#3B82F6" }]} />
                      <View>
                        <Text style={s.routeLabel}>ORIGIN</Text>
                        <Text style={s.routePort}>{tracking.origin || "-"}</Text>
                      </View>
                    </View>

                    <View style={s.routeConnector}>
                      <View style={s.routeLine} />
                      <MaterialCommunityIcons name="ferry" size={16} color="#94A3B8" />
                      <View style={s.routeLine} />
                    </View>

                    <View style={s.routeEndpoint}>
                      <View style={[s.routeDot, { backgroundColor: "#10B981" }]} />
                      <View>
                        <Text style={s.routeLabel}>DESTINATION</Text>
                        <Text style={s.routePort}>{tracking.destination || "-"}</Text>
                      </View>
                    </View>
                  </View>
                  {tracking.sailingDate && (
                    <View style={s.sailingRow}>
                      <Ionicons name="calendar-outline" size={13} color="#64748B" />
                      <Text style={s.sailingText}>Sailing: {tracking.sailingDate}</Text>
                    </View>
                  )}
                </Section>

                {/* Parties Section */}
                <Section
                  title="Parties"
                  icon="people-outline"
                  iconColor="#8B5CF6"
                >
                  <InfoRow label="Customer" value={tracking.customer} />
                  <InfoRow label="Shipper" value={tracking.shipper} />
                  <InfoRow label="Consignee" value={tracking.consignee} />
                </Section>

                {/* Cargo Section */}
                <Section
                  title="Cargo"
                  icon="cube-outline"
                  iconColor="#F59E0B"
                >
                  <View style={s.cargoGrid}>
                    <CargoCell
                      label="Pieces"
                      value={tracking.totalpieces}
                      icon="layers-outline"
                      color="#3B82F6"
                    />
                    <CargoCell
                      label="Gross Wt."
                      value={tracking.totalGrossWeight ? `${tracking.totalGrossWeight} kg` : undefined}
                      icon="barbell-outline"
                      color="#10B981"
                    />
                    <CargoCell
                      label="Amount"
                      value={tracking.totalAmount ? `₹${Number(tracking.totalAmount).toLocaleString("en-IN")}` : undefined}
                      icon="cash-outline"
                      color="#F59E0B"
                    />
                  </View>
                </Section>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

/* ================= SECTION COMPONENT ================= */
function Section({ title, icon, iconColor, children }: any) {
  return (
    <View style={s.sectionCard}>
      <View style={s.sectionHeader}>
        <View style={[s.sectionIcon, { backgroundColor: `${iconColor}12` }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

/* ================= INFO ROW ================= */
function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{String(value)}</Text>
    </View>
  );
}

/* ================= CARGO CELL ================= */
function CargoCell({ label, value, icon, color }: any) {
  if (!value) return null;
  return (
    <View style={s.cargoCell}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={s.cargoLabel}>{label}</Text>
      <Text style={s.cargoValue}>{value}</Text>
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

  /* Type Selector */
  typeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  typeSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  typeSelectorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(59,130,246,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  typeSelectorLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeSelectorValue: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "700",
    marginTop: 1,
  },

  /* Options Grid */
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  optionChipActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  optionChipTextActive: {
    color: "#fff",
  },

  /* Input */
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

  /* Result */
  resultArea: {
    marginTop: 18,
    gap: 14,
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },

  /* Info Row */
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94A3B8",
    width: "40%",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    width: "58%",
    textAlign: "right",
  },

  /* Route Visual */
  routeVisual: {
    gap: 4,
    marginBottom: 12,
  },
  routeEndpoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  routePort: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 1,
  },
  routeConnector: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 3,
    gap: 6,
    marginVertical: 2,
  },
  routeLine: {
    width: 16,
    height: 1.5,
    backgroundColor: "#E2E8F0",
  },
  sailingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sailingText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },

  /* Cargo Grid */
  cargoGrid: {
    flexDirection: "row",
    gap: 10,
  },
  cargoCell: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  cargoLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cargoValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
});
