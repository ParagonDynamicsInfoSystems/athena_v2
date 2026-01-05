import { useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    ImageBackground,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

// 👇 background image
const bgImage = require("../../assets/images/bg.png");

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={bgImage}
        style={styles.container}
        resizeMode="cover"
      >
        {/* Overlay (for readability) */}
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

          {/* Get Started → Sign In */}
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.primaryBtnText}>Get Started →</Text>
          </TouchableOpacity>

          {/* Already have account */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.secondaryText}>
              Already have an account?{" "}
              <Text style={styles.signIn}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
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

  /* Dark overlay so text pops on image */
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
});
