import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

export default function FloatingDashboardButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.replace("/(tabs)")}
      activeOpacity={0.85}
    >
      <Ionicons name="grid-outline" size={26} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    left: 20,

    width: 56,
    height: 56,
    borderRadius: 28,

    backgroundColor: "#2563EB", // blue
    justifyContent: "center",
    alignItems: "center",

    // shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,

    // elevation (Android)
    elevation: 8,
  },
});
