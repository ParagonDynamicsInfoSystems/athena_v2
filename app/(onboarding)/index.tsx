import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Dimensions,
    ImageBackground,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const bgImage = require("../../assets/images/bg.png");
const { height } = Dimensions.get("window");

export default function OnboardingWelcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent />

      <ImageBackground
        source={bgImage}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* Gradient overlay – DOES NOT CHANGE IMAGE */}
        <LinearGradient
          colors={[
            "transparent",
            "transparent",
            "transparent",
          ]}
          locations={[0, 0.5, 1]}
          style={styles.overlay}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Brand Block */}
          <View style={styles.textBlock}>
            <Text style={styles.welcome}>Welcome to</Text>

            <Text style={styles.brand}>Athena CRM</Text>

            <View style={styles.divider} />

            <Text style={styles.tagline}>
              Smarter logistics. Faster decisions.{"\n"}
              One powerful platform built for performance.
            </Text>
          </View>

          {/* CTA */}
          <View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/(onboarding)/step2")}
              activeOpacity={0.92}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Setup takes less than a minute
            </Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },

  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: 48,
    justifyContent: "space-between",
  },

  textBlock: {
    marginTop: height * 0.24,
  },

  welcome: {
    fontSize: 20,
    color: "#141516",
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  brand: {
    marginTop: 6,
    fontSize: 40,
    fontWeight: "900",
    color: "#111748",
    letterSpacing: 0.8,
  },

  divider: {
    width: 48,
    height: 4,
    backgroundColor: "#3B82F6",
    borderRadius: 2,
    marginTop: 14,
  },

  tagline: {
    marginTop: 18,
    fontSize: 15,
    lineHeight: 22,
    color: "#4d6fb5",
    maxWidth: "92%",
  },

  button: {
    backgroundColor: "#05163d",
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",

    // Premium depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  helperText: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 12,
    color: "#7987a0",
  },
});
