import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const bgImage = require("../../assets/images/bg.png");

export default function BeginOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const goToStep2 = () => {
    setLoading(true);

    // Small delay only for UX (optional)
    setTimeout(() => {
      setLoading(false);
      router.replace("./(onboarding)/step2");
    }, 300);
  };

  return (
    <ImageBackground source={bgImage} style={styles.bg} resizeMode="cover">
      {/* Gradient overlay */}
      <LinearGradient
        colors={[
          "rgba(5,14,31,0.75)",
          "rgba(0,0,0,0.45)",
          "rgba(0,0,0,0.85)",
        ]}
        style={styles.overlay}
      />

      <View style={styles.container}>
        <View>
          <Text style={styles.title}>Let’s get you set up</Text>
          <Text style={styles.subtitle}>
            We’ll prepare your workspace and personalize your CRM experience.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <Text style={styles.infoItem}>• Profile initialization</Text>
            <Text style={styles.infoItem}>• Service integrations</Text>
            <Text style={styles.infoItem}>• Notification preferences</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={goToStep2}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    paddingHorizontal: 26,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  title: {
    marginTop: 120,
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#D1D5DB",
  },
  infoCard: {
    marginTop: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 18,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  infoItem: {
    fontSize: 14,
    color: "#E5E7EB",
    marginBottom: 6,
  },
  button: {
    backgroundColor: "#0F172A",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
