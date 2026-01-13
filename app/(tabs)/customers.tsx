import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import aiApi from "../hooks/aiApi";

/* ===== BACKGROUND ===== */
const bgImage = require("../../assets/images/bg.png");

type Customer = {
  cust_name: string;
  customer_id: string;
  lead: boolean;
  interaction_count: number;
};

export default function CustomersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const crmUserId = await AsyncStorage.getItem("crmUserId");
      if (!crmUserId) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await aiApi.get("/crm_data/customer-outstandings", {
        params: { user_id: crmUserId },
      });

      setCustomers(response.data?.customers_interacted ?? []);
    } catch (e) {
      console.log("CUSTOMER FETCH ERROR:", e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={bgImage} style={styles.bg}>
        <View style={styles.overlay} />

        {/* BACK BUTTON */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* ===== FIXED HEADER ===== */}
        <View style={styles.fixedHeader}>
          <View style={styles.headerAccent} />
          <Text style={styles.headerTitle}>Customers</Text>
          <Text style={styles.headerSubtitle}>
            {customers.length} total customers
          </Text>
        </View>

        {/* ===== SCROLLABLE CONTAINER ===== */}
        <View style={styles.scrollContainer}>
          {loading && (
            <ActivityIndicator
              size="large"
              color="#2563EB"
              style={{ marginTop: 40 }}
            />
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          >
            {!loading &&
              customers.map((item, index) => (
                <View
                  key={`${item.customer_id}-${index}`}
                  style={styles.card}
                >
                  {/* NAME + LEAD */}
                  <View style={styles.cardTop}>
                    <Text style={styles.customerName}>
                      {item.cust_name}
                    </Text>

                    {item.lead && (
                      <View style={styles.leadBadge}>
                        <Ionicons name="star" size={12} color="#92400E" />
                        <Text style={styles.leadText}>LEAD</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.divider} />

                  {/* DETAILS */}
                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.label}>Customer ID</Text>
                      <Text style={styles.value}>
                        {item.customer_id}
                      </Text>
                    </View>

                    <View style={styles.interactionPill}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={14}
                        color="#2563EB"
                      />
                      <Text style={styles.interactionText}>
                        {item.interaction_count}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

            {!loading && customers.length === 0 && (
              <Text style={styles.emptyText}>
                No customers found
              </Text>
            )}
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ===== STYLES ===== */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#090808" },
  bg: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 2, 2, 0.55)",
  },

  backBtn: {
    position: "absolute",
    top: 10,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },

  /* ===== FIXED HEADER ===== */
  fixedHeader: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: "rgba(5, 4, 47, 0.4)",
    zIndex: 5,
  },

  headerAccent: {
    width: 36,
    height: 1,
    borderRadius: 4,
    backgroundColor: "transparent",
    marginBottom: 10,
  },

  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#ffffff",
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#eff2f5",
  },

  /* ===== SCROLL AREA ===== */
  scrollContainer: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: "hidden",
  },

  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },

  /* ===== CUSTOMER CARD ===== */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    paddingRight: 8,
  },

  leadBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  leadText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },

  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontSize: 11,
    color: "#64748B",
  },

  value: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 2,
  },

  interactionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  interactionText: {
    marginLeft: 6,
    fontWeight: "700",
    color: "#2563EB",
    fontSize: 13,
  },

  emptyText: {
    marginTop: 40,
    textAlign: "center",
    color: "#64748B",
    fontSize: 14,
  },
});
