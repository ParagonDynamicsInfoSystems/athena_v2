import Constants from "expo-constants";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Platform, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import aiApi from "./hooks/aiApi";

interface VersionInfo {
  service: string;
  version: string;
  android_app_url: string;
  ios_app_url: string;
  build_date: string;
  environment: string;
}

export default function ModalScreen() {
  const [checking, setChecking] = useState(true);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  // 🔢 Current app version (expoConfig is the correct modern API)
  const currentVersion = Constants.expoConfig?.version ?? "0.0.0";

  useEffect(() => {
    checkAppVersion();
  }, []);

  const checkAppVersion = async () => {
    try {
      const res = await aiApi.get("/health/version");
      const data: VersionInfo = res.data;

      setVersionInfo(data);

      if (data?.version && data.version !== currentVersion) {
        showUpdateAlert(data);
      }

      setChecking(false);
    } catch (e) {
      if (__DEV__) console.warn("Version check failed", e);
      setChecking(false);
    }
  };

  const showUpdateAlert = (data: VersionInfo) => {
    const storeUrl =
      Platform.OS === "android"
        ? data.android_app_url
        : data.ios_app_url;

    Alert.alert(
      "Update Available",
      `New version available: ${data.version}`,
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
    <ThemedView style={styles.container}>
      <ThemedText type="title">App Information</ThemedText>

      {checking && (
        <ThemedText style={styles.info}>Checking version…</ThemedText>
      )}

      {!checking && versionInfo && (
        <ThemedView style={styles.card}>
          <ThemedText style={styles.row}>
            📱 App Version: <ThemedText type="defaultSemiBold">{currentVersion}</ThemedText>
          </ThemedText>

          <ThemedText style={styles.row}>
            🌐 Server Version:{" "}
            <ThemedText type="defaultSemiBold">{versionInfo.version}</ThemedText>
          </ThemedText>

         
        </ThemedView>
      )}

      {!checking && (
        <Link href="/" dismissTo style={styles.link}>
          <ThemedText type="link">Go to home screen</ThemedText>
        </Link>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  row: {
    marginBottom: 8,
    fontSize: 14,
  },
  info: {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.7,
  },
  link: {
    marginTop: 20,
    paddingVertical: 15,
  },
});
