import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import erpApi from "../hooks/erpApi";

/* ===== BACKGROUND ===== */
const bgImage = require("../../assets/images/bg.png");

type OutstandingSale = {
  id: string;
  text: string;
  vesselCode: string | null;
  mloName: string | null;
  customername: string | null;
  salesperson: string | null;
  balancetc: number | null;
  balanceamount: number | null;
  days45to60: number | null;
  days45: number | null;
  days30: number | null;
};

export default function OutstandingViaSales() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<OutstandingSale[]>([]);

  useEffect(() => {
    fetchOutstandingList();
  }, []);

  const fetchOutstandingList = async () => {
    try {
      setLoading(true);
      const response = await erpApi.get(
        "/Athena/feeder/mobileApp/outstandingviasales",
        { params: { salesid: "E0044" } }
      );
      setList(response.data?.outstandingList || []);
    } catch (e) {
      console.log("OUTSTANDING FETCH ERROR:", e);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: OutstandingSale }) => (
    <View style={styles.card}>
      {/* HEADER SECTION */}
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="business" size={18} color="#2563EB" />
        </View>
        <Text style={styles.customerName} numberOfLines={1}>
          {item.customername || "No Customer Name"}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* PRIMARY INFO GRID */}
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Sales Person</Text>
          <Text style={styles.value}>{item.salesperson || "-"}</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>Balance TC</Text>
          <Text style={styles.value}>{item.balancetc ?? "0.00"}</Text>
        </View>
      </View>

      {/* TOTAL BALANCE HIGHLIGHT */}
      <View style={styles.highlightSection}>
        <Text style={styles.label}>Total Balance Amount</Text>
        <View style={styles.amountBadgePrimary}>
          <Text style={styles.amountTextPrimary}>
            ${item.balanceamount?.toLocaleString() ?? "0.00"}
          </Text>
        </View>
      </View>

      {/* AGING BUCKETS GRID (3 COLUMNS) */}
      <View style={styles.agingGrid}>
        <View style={styles.agingItem}>
          <Text style={styles.labelSmall}>Day 30</Text>
          <Text style={styles.agingValue}>
            ${item.days30?.toLocaleString() ?? "0"}
          </Text>
        </View>

        <View style={[styles.agingItem, styles.borderX]}>
          <Text style={styles.labelSmall}>Day 65</Text>
          <Text style={styles.agingValue}>
            ${item.days45?.toLocaleString() ?? "0"}
          </Text>
        </View>

        <View style={styles.agingItem}>
          <Text style={styles.labelSmall}>45-65 Days</Text>
          <Text style={styles.agingValue}>
            ${item.days45to60?.toLocaleString() ?? "0"}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ImageBackground source={bgImage} style={styles.bg} resizeMode="cover">
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safe}>
          {/* NAVIGATION BAR */}
          <View style={styles.navBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Customer Outstanding</Text>
              <Text style={styles.headerSubtitle}>{list.length} records found</Text>
            </View>
          </View>

          {/* LIST AREA */}
          <View style={styles.contentArea}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.loadingText}>Fetching Records...</Text>
              </View>
            ) : (
              <FlatList
                data={list}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Ionicons name="document-text-outline" size={48} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.emptyText}>No outstanding sales found</Text>
                  </View>
                }
              />
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 11, 30, 0.75)",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },

  /* HEADER */
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTextContainer: { flex: 1 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },

  /* LIST AREA */
  contentArea: { flex: 1 },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  /* CARD DESIGN */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  customerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  gridItem: { width: "48%" },
  label: {
    fontSize: 10,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },

  /* HIGHLIGHTS */
  highlightSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  amountBadgePrimary: {
    marginTop: 4,
  },
  amountTextPrimary: {
    fontSize: 22,
    fontWeight: "800",
    color: "#16A34A",
  },

  /* AGING GRID (Compact 3-column) */
  agingGrid: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  agingItem: {
    flex: 1,
    alignItems: "center",
  },
  borderX: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#F1F5F9",
  },
  labelSmall: {
    fontSize: 9,
    color: "#64748B",
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 2,
  },
  agingValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },

  /* STATES */
  loadingText: {
    marginTop: 12,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    marginTop: 10,
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 15,
  },
});