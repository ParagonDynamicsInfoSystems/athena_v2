import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import NetworkLogger, {
  startNetworkLogging,
} from "react-native-network-logger";
import ErrorBoundary from "../components/ErrorBoundary";

/* ================= ENV ================= */

const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || "development";
const IS_PRODUCTION = APP_ENV === "production";

/* ================= TYPES ================= */

const NetworkLoggerAny =
  NetworkLogger as unknown as React.ComponentType<any>;

/* ================= ROOT LAYOUT ================= */

export default function RootLayout() {
  const [showNetworkLogger, setShowNetworkLogger] = useState(false);

  /* 🔹 Start network logging only in DEV */
  useEffect(() => {
    if (!IS_PRODUCTION) {
      try {
        startNetworkLogging();
        if (__DEV__) console.log("[NetworkLogger] started");
      } catch (e) {
        if (__DEV__) console.warn("[NetworkLogger] failed", e);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
    <View style={{ flex: 1 }}>
      {/* ROUTES */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      {/* ================= DEV NETWORK LOGGER ================= */}
      {!IS_PRODUCTION && (
        <>
          {/* FAB */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowNetworkLogger(v => !v)}
          >
            <Text style={styles.fabText}>Net</Text>
          </TouchableOpacity>

          {/* LOGGER OVERLAY */}
          {showNetworkLogger && (
            <View style={styles.loggerWrapper}>
              {/* HEADER */}
              <View style={styles.loggerHeader}>
                <Text style={styles.loggerTitle}>Network Logger</Text>

                <TouchableOpacity
                  onPress={() => setShowNetworkLogger(false)}
                >
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* LOGGER CONTENT */}
              <NetworkLoggerAny />
            </View>
          )}
        </>
      )}
    </View>
    </ErrorBoundary>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  /* Floating Button */
  fab: {
    position: "absolute",
    right: 16,
    bottom: Platform.OS === "ios" ? 32 : 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    zIndex: 999,
  },

  fabText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  /* Logger Overlay */
  loggerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    zIndex: 9999,
  },

  loggerHeader: {
    height: 50,
    backgroundColor: "#111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  loggerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  closeText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
});
