import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import aiApi from "../hooks/aiApi";
import erpApi from "../hooks/erpApi";

// 🔔 Notifications
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

// 🌐 OAuth helpers
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

const bgImage = require("../../assets/images/bg.png");

/* ================= NOTIFICATION HELPERS ================= */

const SECURE_KEYS = {
  devicePushToken: "pushToken.device",
};

async function buildDeviceName() {
  try {
    const brand = Device.brand ?? "";
    const model = Device.modelName ?? "";
    const os = `${Platform.OS} ${Device.osVersion ?? ""}`.trim();
    return [brand, model, os].filter(Boolean).join(" ") || "Unknown Device";
  } catch {
    return "Unknown Device";
  }
}

async function getDevicePushTokenOrFetch(): Promise<string | null> {
  if (Constants.appOwnership === "expo") return null;

  const stored = await SecureStore.getItemAsync(SECURE_KEYS.devicePushToken);
  if (stored) return stored;

  try {
    const res = await Notifications.getDevicePushTokenAsync();
    const token = (res as any)?.data ?? null;
    if (token) {
      await SecureStore.setItemAsync(SECURE_KEYS.devicePushToken, token);
    }
    return token;
  } catch {
    return null;
  }
}

function getDeviceType() {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "ios") return "ios";
  return "unknown";
}

async function registerNotificationToken(userId: string) {
  try {
    const device_token = await getDevicePushTokenOrFetch();
    if (!device_token) return;

    await aiApi.post(
      `/notifications/register-token?user_id=${encodeURIComponent(userId)}`,
      {
        device_name: await buildDeviceName(),
        device_token,
        device_type: getDeviceType(),
      }
    );
  } catch (e) {
    console.warn("Notification token registration failed", e);
  }
}

/* ================= EMAIL-AI OAUTH ================= */

async function openOAuthInApp(authUrl: string, router: any) {
  try {
    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
    await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  } catch (e) {
    console.warn("OAuth error", e);
  } finally {
    try {
      await WebBrowser.dismissBrowser();
    } catch {}
    router.replace("/(tabs)");
  }
}

async function handleEmailAiFlow(userId: string, router: any) {
  try {
    const res = await aiApi.get(
      `/preferences/is-onboarded?user_id=${encodeURIComponent(userId)}`
    );

    const data = res.data;

    if (data.google_services_connected || data.outlook_services_connected) {
      router.replace("/(tabs)");
      return;
    }

    Alert.alert(
      "Customize Email",
      "Which mail do you want to authorize to customize mail for you?",
      [
        {
          text: "Google",
          onPress: async () => {
            const g = await aiApi.get(
              `/email-ai/auth/google?user_id=${encodeURIComponent(userId)}`
            );
            if (g?.data?.url) {
              await openOAuthInApp(g.data.url, router);
            }
          },
        },
        {
          text: "Outlook",
          onPress: async () => {
            const o = await aiApi.get(
              `/email-ai/auth/outlook?user_id=${encodeURIComponent(userId)}`
            );
            if (o?.data?.url) {
              await openOAuthInApp(o.data.url, router);
            }
          },
        },
        {
          text: "Skip",
          style: "cancel",
          onPress: () => router.replace("/(tabs)"),
        },
      ],
      { cancelable: false }
    );
  } catch (e) {
    console.warn("Email-AI flow failed", e);
    router.replace("/(tabs)");
  }
}

/* ================= LOGIN SCREEN ================= */

export default function LoginScreen() {
  const router = useRouter();

  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  /* 🔁 AUTO LOGIN */
  useEffect(() => {
    const autoLogin = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem("isloggedIn");
        const userId = await AsyncStorage.getItem("userId");

        if (isLoggedIn === "true" && userId) {
          await registerNotificationToken(userId);
          router.replace("/(tabs)");
          return;
        }
      } finally {
        setBooting(false);
      }
    };
    autoLogin();
  }, []);

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});
  }, []);

  /* 🔐 LOGIN */
  const handleLogin = async () => {
    if (!empId || !password) {
      Alert.alert("Error", "Please enter user name and password");
      return;
    }

    try {
      setLoading(true);

      const response = await erpApi.post(
        "/Athena/feeder/mobileApp/mobilelogin",
        {
          username: empId.toUpperCase(),
          password,
        }
      );

      const result = response.data;

      if (result?.success === true) {
        const user = result.userDetail;

        await AsyncStorage.multiSet([
          ["isloggedIn", "true"],
          ["userId", user.userId],
          ["username", user.username],
          ["crmUserId", empId.toUpperCase()],
          ["email", user.email],
        ]);

        await registerNotificationToken(user.userId);

        await handleEmailAiFlow(user.userId, router);
      } else {
        Alert.alert("Login Failed", result?.message || "Invalid credentials");
      }
    } catch (e: any) {
      Alert.alert(
        "Login Error",
        e?.response?.data?.message || "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  /* 🚧 BOOT */
  if (booting) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={bgImage} style={styles.bg}>
        <View style={styles.card}>
          <Text style={styles.title}>Login</Text>

          <TextInput
            placeholder="User name"
            style={styles.input}
            autoCapitalize="characters"
            value={empId}
            onChangeText={setEmpId}
          />

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

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0bff", justifyContent: "center" },
  bg: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 22 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14 },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  passwordInput: { flex: 1, paddingVertical: 14 },
  showText: { color: "#1D4ED8", fontWeight: "600" },
  button: {
    backgroundColor: "#0F172A",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
