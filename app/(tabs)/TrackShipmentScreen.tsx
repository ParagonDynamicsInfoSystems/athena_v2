import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import erpApi from "../hooks/erpApi";

/* ===== BACKGROUND ===== */
const bgImage = require("../../assets/images/bg.png");

/* ===== SEARCH OPTIONS ===== */
const SEARCH_OPTIONS = [
  { label: "MBL No", type: "bookingNo" },
  { label: "Container No", type: "containerNo" },
];

export default function TrackShipmentScreen() {
  const router = useRouter();

  const [searchBy, setSearchBy] = useState(SEARCH_OPTIONS[0]);
  const [value, setValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);

  /* ===== SEARCH ===== */
  const handleSearch = async () => {
    if (!value.trim()) return;

    try {
      setLoading(true);
      setSummary(null);
      setTimeline([]);
      setShowTimeline(false);

      const params =
        searchBy.type === "bookingNo"
          ? { mbldocno: value.trim(), containerno: "", type: "bookingNo" }
          : { mbldocno: "", containerno: value.trim(), type: "containerNo" };

      const res = await erpApi.get("/Athena/app/master/mabl/synccard", { params });
      const d = res.data;

      if (!d) return;

      /* ===== SUMMARY MAPPING ===== */
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

      /* ===== TIMELINE ===== */
      setTimeline(d.containerDetails?.[0]?.timeline || []);
    } catch (e) {
      console.log("Tracking error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={bgImage} style={styles.bg}>
        <View style={styles.overlay} />

        {/* BACK */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.container}>
          {/* ===== SEARCH CARD ===== */}
          <View style={styles.searchCard}>
            <Text style={styles.title}>Track Your Shipment</Text>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text style={styles.dropdownText}>{searchBy.label}</Text>
              <Ionicons
                name={dropdownOpen ? "chevron-up" : "chevron-down"}
                size={18}
              />
            </TouchableOpacity>

            {dropdownOpen &&
              SEARCH_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.type}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSearchBy(opt);
                    setValue("");
                    setDropdownOpen(false);
                  }}
                >
                  <Text>{opt.label}</Text>
                </TouchableOpacity>
              ))}

            <TextInput
              style={styles.input}
              placeholder={`Enter ${searchBy.label}`}
              value={value}
              onChangeText={setValue}
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Ionicons name="search" size={16} color="#fff" />
              <Text style={styles.searchText}>SEARCH</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <ActivityIndicator
              size="large"
              color="#fff"
              style={{ marginTop: 20 }}
            />
          )}

          {/* ===== SUMMARY CARD ===== */}
          {summary && (
            <TouchableOpacity
              style={styles.summaryCard}
              activeOpacity={0.9}
              onPress={() => setShowTimeline(!showTimeline)}
            >
              <View style={styles.topRow}>
                <View style={styles.mblBadge}>
                  <Text style={styles.mblText}>{summary.mbl}</Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{summary.status}</Text>
                </View>
              </View>

              <Text style={styles.carrier}>{summary.carrier}</Text>
              <Text style={styles.vessel}>{summary.vesselVoyage}</Text>

              <Text style={styles.routeTitle}>
                {summary.from} → {summary.to}
              </Text>

              <View style={styles.routeRow}>
                <View>
                  <Text style={styles.port}>{summary.from}</Text>
                  <Text style={styles.date}>ETD: {summary.etd}</Text>
                </View>

                <Ionicons name="arrow-forward" size={16} color="#2563EB" />

                <View>
                  <Text style={styles.port}>{summary.to}</Text>
                  <Text style={styles.date}>ETA: {summary.eta}</Text>
                </View>
              </View>

              <View style={styles.bottomRow}>
                <View style={styles.cutOffRow}>
                  <View style={styles.dot} />
                  <Text style={styles.cutOffText}>
                    Manifest Cut Off: {summary.manifestCutOff}
                  </Text>
                </View>

                <Text style={styles.containerInfo}>
                  {summary.containerInfo}
                </Text>
              </View>

              <Text style={styles.tapHint}>
                {showTimeline ? "Hide Timeline ▲" : "View Timeline ▼"}
              </Text>
            </TouchableOpacity>
          )}

          {/* ===== VERTICAL TIMELINE ===== */}
          {showTimeline && timeline.length > 0 && (
            <View style={styles.timelineCard}>
              {timeline.map((item, index) => {
                if (!item.event) return null;

                return (
                  <View key={index} style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.circle,
                          item.iconEllipse && styles.circleActive,
                        ]}
                      >
                        {item.iconEllipse && (
                          <Ionicons name="boat" size={14} color="#fff" />
                        )}
                      </View>

                      {index !== timeline.length - 1 && (
                        <View style={styles.verticalLine} />
                      )}
                    </View>

                    <View style={styles.timelineContent}>
                      <Text style={styles.event}>{item.event}</Text>
                      <Text style={styles.location}>{item.location}</Text>
                      <Text style={styles.time}>{item.date}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ===== STYLES ===== */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f0b0b" },
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  container: { padding: 16, paddingTop: 100, paddingBottom: 40 },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  searchCard: { backgroundColor: "#fff", borderRadius: 18, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },

  dropdown: {
    borderWidth: 1,
    borderColor: "#22C55E",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  dropdownText: { fontWeight: "600" },
  dropdownItem: { padding: 12, backgroundColor: "#f8fafc" },

  input: {
    borderWidth: 1,
    borderColor: "#22C55E",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },

  searchBtn: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },

  searchText: { color: "#fff", fontWeight: "700", marginLeft: 6 },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
  },

  topRow: { flexDirection: "row", justifyContent: "space-between" },

  mblBadge: {
    backgroundColor: "#15803D",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  mblText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  statusBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: { color: "#0284C7", fontWeight: "700", fontSize: 12 },

  carrier: { marginTop: 6, fontWeight: "700" },
  vessel: { color: "#64748B", marginBottom: 6 },

  routeTitle: { fontWeight: "600", marginBottom: 8 },

  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  port: { fontWeight: "600" },
  date: { fontSize: 12, color: "#64748B" },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: "center",
  },

  cutOffRow: { flexDirection: "row", alignItems: "center" },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
    marginRight: 6,
  },

  cutOffText: { fontSize: 12, color: "#6B7280" },
  containerInfo: { fontSize: 12, fontWeight: "600" },

  tapHint: {
    marginTop: 10,
    textAlign: "center",
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 12,
  },

  timelineCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
  },

  timelineRow: { flexDirection: "row", marginBottom: 18 },

  timelineLeft: { width: 30, alignItems: "center" },

  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },

  circleActive: { backgroundColor: "#2563EB" },

  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 2,
  },

  timelineContent: { flex: 1, paddingLeft: 12 },

  event: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  location: { fontSize: 13, color: "#475569", marginTop: 2 },
  time: { fontSize: 12, color: "#64748B", marginTop: 2 },
});
