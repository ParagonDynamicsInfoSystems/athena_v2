import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  { label: "Job No", code: "J" },
  { label: "HBL / HAWB", code: "H" },
  { label: "Work Order", code: "W" },
  { label: "Container", code: "C" },
  { label: "Shipper", code: "S" },
  { label: "Customer", code: "CT" },
];

export default function ATrackScreen() {
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchBy, setSearchBy] = useState(SEARCH_OPTIONS[0]);
  const [trackingNo, setTrackingNo] = useState("");

  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<any>(null);

  /* ===== SEARCH ===== */
  const handleSearch = async () => {
    if (!trackingNo.trim()) {
      Alert.alert("Error", "Please enter tracking number");
      return;
    }

    try {
      setLoading(true);
      setTracking(null);

      const response = await erpApi.get("/Athena/feeder/mobileApp/getTracking", {
        params: {
          trackingNo: trackingNo.trim(),
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

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={bgImage} style={styles.bg}>
        <View style={styles.overlay} />

        {/* BACK BUTTON */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.container}>
          {/* ===== SEARCH CARD ===== */}
          <View style={styles.searchCard}>
            <Text style={styles.label}>Search By</Text>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text>{searchBy.label}</Text>
              <Ionicons
                name={dropdownOpen ? "chevron-up" : "chevron-down"}
                size={18}
              />
            </TouchableOpacity>

            {dropdownOpen &&
              SEARCH_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.code}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSearchBy(opt);
                    setDropdownOpen(false);
                  }}
                >
                  <Text>{opt.label}</Text>
                </TouchableOpacity>
              ))}

            <TextInput
              style={styles.input}
              placeholder={`Enter ${searchBy.label}`}
              value={trackingNo}
              onChangeText={setTrackingNo}
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Ionicons name="search" size={14} color="#fff" />
              <Text style={styles.searchText}>SEARCH</Text>
            </TouchableOpacity>
          </View>

          {loading && <ActivityIndicator size="large" />}

          {/* ===== DETAILS ===== */}
          {tracking && (
            <View style={styles.detailsWrapper}>
              <Section title="Shipment">
                <Info label="Job Code" value={tracking.jobCode} />
                <Info label="Job Date" value={tracking.jobDate} />
                <Info label="Mode" value={tracking.mode} />
                <Info label="Container" value={tracking.containerType} />
                <Info label="Work Order" value={tracking.workorderno} />
              </Section>

              <Section title="Route">
                <Info label="Origin" value={tracking.origin} />
                <Info label="Destination" value={tracking.destination} />
                <Info label="Sailing Date" value={tracking.sailingDate} />
              </Section>

              <Section title="Parties">
                <Info label="Customer" value={tracking.customer} />
                <Info label="Shipper" value={tracking.shipper} />
                <Info label="Consignee" value={tracking.consignee} />
              </Section>

              <Section title="Cargo">
                <Info label="Total Pieces" value={tracking.totalpieces} />
                <Info
                  label="Gross Weight"
                  value={`${tracking.totalGrossWeight} kg`}
                />
                <Info label="Amount" value={`₹ ${tracking.totalAmount}`} />
              </Section>
            </View>
          )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ===== SMALL COMPONENTS ===== */

function Section({ title, children }: any) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Info({ label, value }: any) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f0b0bff"},
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  container: { padding: 16, paddingTop: 100 },

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

  searchCard: {
    backgroundColor: "#EAF2FA",
    borderRadius: 18,
    padding: 16,
  },

  label: { fontWeight: "600", marginBottom: 6 },

  dropdown: {
    backgroundColor: "#c2d2ff",
    padding: 12,
    borderRadius: 13,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  dropdownItem: {
    padding: 12,
    backgroundColor: "#fff",
  },

  input: {
    backgroundColor: "#c2d2ff",
    padding: 12,
    borderRadius: 13,
    marginTop: 10,
  },

  searchBtn: {
    backgroundColor: "#070e6c",
    padding: 12,
    borderRadius: 22,
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  searchText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
  },

  detailsWrapper: { marginTop: 18 },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0c4f83",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 6,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    width: "45%",
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
    width: "55%",
    textAlign: "right",
  },
});
