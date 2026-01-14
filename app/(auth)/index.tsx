import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AIApi from "../hooks/aiApi";

const { width } = Dimensions.get("window");

// 👇 background image
const bgImage = require("../../assets/images/bg.png");

interface VersionInfo {
  service: string;
  version: string;
  android_app_url: string;
  ios_app_url: string;
  build_date: string;
  environment: string;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  // 📱 Current app version
  const currentVersion =
    Constants.expoConfig?.version ||
    Constants.manifest?.version ||
    "0.0.0";

  useEffect(() => {
    checkAppVersion();
  }, []);

  const checkAppVersion = async () => {
    try {
      const res = await AIApi.get("/health/version");
      const data: VersionInfo = res.data;

      setVersionInfo(data);

      if (data?.version && data.version !== currentVersion) {
        showUpdateAlert(data);
      }
    } catch (e) {
      console.warn("❌ Version check failed", e);
    }
  };

  const showUpdateAlert = (data: VersionInfo) => {
    const storeUrl =
      Platform.OS === "android"
        ? data.android_app_url
        : data.ios_app_url;

    Alert.alert(
      "Update Available",
      `New version available (${data.version}). Please update the app.`,
      [
        {
          text: "Update Now",
          onPress: () => {
            if (storeUrl) Linking.openURL(storeUrl);
          },
        },
        {
          text: "Later",
          style: "cancel",
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={bgImage}
        style={styles.container}
        resizeMode="cover"
      >
        {/* Overlay */}
        <View style={styles.overlay} />

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>
            Level up your{"\n"}
            <Text style={styles.highlight}>Global Sales</Text>
          </Text>

          <Text style={styles.subtitle}>
            Plan smarter routes, scale globally{"\n"}and grow smarter
          </Text>

          {/* Get Started */}
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.primaryBtnText}>Get Started →</Text>
          </TouchableOpacity>

          {/* Already have account */}
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.secondaryText}>
              Already have an account?{" "}
              <Text style={styles.signIn}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🔢 VERSION INFO FOOTER */}
        {versionInfo && (
          <View style={styles.versionBox}>
            <Text style={styles.versionText}>
              App v{currentVersion} • Server v{versionInfo.version}
            </Text>
            <Text style={styles.versionSub}>
              {versionInfo.environment} • {versionInfo.build_date}
            </Text>
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },

  container: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  title: {
    fontSize: 35,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
    marginBottom: 14,
  },

  highlight: {
    color: "#1D4ED8",
  },

  subtitle: {
    fontSize: 20,
    textAlign: "center",
    color: "#070708ff",
    marginBottom: 36,
    lineHeight: 22,
  },

  primaryBtn: {
    backgroundColor: "#1D4ED8",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 22,
    width: "100%",
    alignItems: "center",
  },

  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  secondaryText: {
    fontSize: 14,
    color: "#31353dff",
  },

  signIn: {
    color: "#1D4ED8",
    fontWeight: "600",
  },

  /* 🔢 Version footer */
  versionBox: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    alignItems: "center",
  },

  versionText: {
    fontSize: 12,
    color: "#1f2937",
    fontWeight: "500",
  },

  versionSub: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
});
