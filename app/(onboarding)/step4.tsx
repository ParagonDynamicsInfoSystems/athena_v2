import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const bgImage = require("../../assets/images/bg.png");

export default function TargetViewPreference() {
  const router = useRouter();
  const [selected, setSelected] = useState<"monthly" | "quarterly">("monthly");

  const savePreference = async () => {
    // 1️⃣ Save preference
    await AsyncStorage.setItem("targetViewMode", selected);

    // 2️⃣ Navigate correctly (ABSOLUTE PATH)
    router.replace("/(onboarding)/step5");
  };

  return (
    <ImageBackground source={bgImage} style={styles.bg} resizeMode="cover">
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.7)",
          "rgba(0,0,0,0.4)",
          "rgba(0,0,0,0.9)",
        ]}
        style={styles.overlay}
      />

      <View style={styles.container}>
        <View>
          <Text style={styles.step}>Step 4 of 5</Text>
          <Text style={styles.title}>
            How would you like to view your targets?
          </Text>
          <Text style={styles.subtitle}>
            You can always change this later in settings.
          </Text>

          {/* Monthly */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selected === "monthly" && styles.optionSelected,
            ]}
            onPress={() => setSelected("monthly")}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.optionTitle,
                selected === "monthly" && styles.optionTitleSelected,
              ]}
            >
              Monthly
            </Text>
            <Text
              style={[
                styles.optionDesc,
                selected === "monthly" && styles.optionDescSelected,
              ]}
            >
              Track progress every month with detailed insights.
            </Text>
          </TouchableOpacity>

          {/* Quarterly */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selected === "quarterly" && styles.optionSelected,
            ]}
            onPress={() => setSelected("quarterly")}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.optionTitle,
                selected === "quarterly" && styles.optionTitleSelected,
              ]}
            >
              Quarterly
            </Text>
            <Text
              style={[
                styles.optionDesc,
                selected === "quarterly" && styles.optionDescSelected,
              ]}
            >
              Review performance in strategic 3-month cycles.
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={savePreference}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  container: {
    flex: 1,
    paddingHorizontal: 26,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  step: {
    marginTop: 90,
    fontSize: 13,
    color: "#9CA3AF",
  },
  title: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#D1D5DB",
  },
  optionCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  optionSelected: {
    backgroundColor: "#FFFFFF",
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  optionTitleSelected: {
    color: "#111827",
  },
  optionDesc: {
    marginTop: 6,
    fontSize: 14,
    color: "#E5E7EB",
  },
  optionDescSelected: {
    color: "#374151",
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
