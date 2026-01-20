import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

/* ===== BACKGROUND ===== */
const bgImage = require("../../assets/images/bg.png");
const { width } = Dimensions.get("window");

/* ===== GRID CARD SIZE ===== */

export default function DashboardScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    loadUserDetails();
  }, []);

  const loadUserDetails = async () => {
    try {
      setLoading(true);

      const [
        username,
        designationName,
        departmentName,
      ] = await Promise.all([
        AsyncStorage.getItem("username"),
        AsyncStorage.getItem("designationName"),
        AsyncStorage.getItem("departmentName"),
      ]);

      setUserName(username || "User");
      setDesignation(designationName || "");
      setDepartment(departmentName || "");
    } catch (err) {
      console.log("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={bgImage} style={styles.bg} resizeMode="cover">
        <View style={styles.overlay} />

        {/* ================= BEAUTIFUL TOP PROFILE ================= */}
        <View style={styles.profileWrapper}>
          <View style={styles.profileCard}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                {/* AVATAR */}
                <View style={styles.avatarOuter}>
                  <Ionicons
                    name="person"
                    size={42}
                    color="#ffffff"
                  />
                </View>

                {/* USER INFO */}
                <View style={styles.profileText}>
                  <Text style={styles.welcomeText}>Welcome back 👋</Text>
                  <Text style={styles.nameText}>{userName}</Text>

                  {(designation || department) && (
                    <Text style={styles.roleText}>
                      {designation}
                      {designation && department ? " • " : ""}
                      {department}
                    </Text>
                  )}
                </View>

                {/* LOGOUT */}
                <TouchableOpacity
                  onPress={() => router.replace("./(auth)/login")}
                  style={styles.logoutBtn}
                >
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

      </ImageBackground>
    </SafeAreaView>
  );
}

/* ================= GRID BUTTON ================= */

function SquareButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.iconCircle}>{icon}</View>
      <Text style={styles.cardText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f0b0bff" },
  bg: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  /* ===== PROFILE ===== */
  profileWrapper: {
    paddingHorizontal: 16,
    paddingTop: 32,
  },

  profileCard: {
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },

  avatarOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  profileText: {
    flex: 1,
    marginLeft: 14,
  },

  welcomeText: {
    fontSize: 13,
    color: "#cbd5f5",
    marginBottom: 2,
  },

  nameText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
  },

  roleText: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },

  logoutBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#0f172a",
  },

  /* ===== GRID ===== */
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    marginTop: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },


  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  cardText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#1F2937",
    paddingHorizontal: 6,
  },
});
