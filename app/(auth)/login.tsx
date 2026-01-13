import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import erpApi from "../hooks/erpApi";

const bgImage = require("../../assets/images/bg.png");

export default function LoginScreen() {
  const router = useRouter();

  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!empId || !password) {
      Alert.alert("Error", "Please enter user name and password");
      return;
    }

    try {
      setLoading(true);

      console.log("LOGIN REQUEST:", {
        username: empId.toUpperCase(),
      });

      const response = await erpApi.post(
        "/Athena/feeder/mobileApp/mobilelogin",
        {
          username: empId.toUpperCase(), // SAME as Angular
          password: password,
        },
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest", // important
          },
          timeout: 15000,
        }
      );

      console.log("LOGIN RESPONSE:", response.data);

      const result = response.data;

      // ✅ EXACT SAME CHECK AS ANGULAR
      if (result && result.success === true) {
        const user = result.userDetail;

        // === STORE SAME DATA AS WEB ===
        await AsyncStorage.multiSet([
          ["isloggedIn", "true"],
          ["userId", user.userId],
          ["username", user.username],
          ["crmUserId", empId.toUpperCase()], 
          ["email", user.email],
          ["designationName", user.designationName ?? ""],
          ["departmentName", user.departmentName ?? ""],
        ]);

        // ✅ NAVIGATE TO DASHBOARD
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "Login Failed",
          result?.message || "Invalid username or password"
        );
      }
    } catch (error: any) {
      console.log("LOGIN ERROR FULL:", error);
      console.log("LOGIN ERROR RESPONSE:", error?.response?.data);

      Alert.alert(
        "Login Error",
        error?.response?.data?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={bgImage} style={styles.bg} resizeMode="cover">
        <View style={styles.overlay} />

        <View style={styles.card}>
          <Text style={styles.title}>Login</Text>

          {/* USER NAME */}
          <Text style={styles.label}>User name</Text>
          <TextInput
            placeholder="User name"
            style={styles.input}
            autoCapitalize="characters"
            value={empId}
            onChangeText={setEmpId}
          />

          {/* PASSWORD */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Password"
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.showText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* FORGOT PASSWORD */}
          <TouchableOpacity>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0b0b0bff",
  },

  bg: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,

    // subtle elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#111827",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: "#374151",
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 14,
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
  },

  showText: {
    color: "#1D4ED8",
    fontWeight: "600",
    fontSize: 13,
  },

  button: {
    backgroundColor: "#0F172A",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },

  forgot: {
    marginTop: 16,
    textAlign: "center",
    color: "#1D4ED8",
    fontSize: 13,
  },
});
