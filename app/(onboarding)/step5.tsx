import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import aiApi from "../hooks/aiApi";

const bgImage = require("../../assets/images/bg.png");

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

/* ---------- HELPERS ---------- */

// Even split that always sums to 100
const evenSplit = (count: number) => {
  const base = Number((100 / count).toFixed(6));
  const arr = Array(count).fill(base);
  arr[count - 1] = Number(
    (100 - base * (count - 1)).toFixed(6)
  );
  return arr;
};

// Backend requires 12 values even for quarterly
const expandQuarterlyToMonthly = (quarters: number[]) =>
  quarters.flatMap((q) =>
    Array(3).fill(Number((q / 3).toFixed(6)))
  );

export default function TargetSplitStep() {
  const router = useRouter();
  const [mode, setMode] = useState<"monthly" | "quarterly">("monthly");
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------- INIT ---------- */
  useEffect(() => {
    (async () => {
      const saved =
        (await AsyncStorage.getItem("targetViewMode")) === "quarterly"
          ? "quarterly"
          : "monthly";

      setMode(saved);
      setValues(evenSplit(saved === "monthly" ? 12 : 4));
    })();
  }, []);

  const labels = mode === "monthly" ? MONTHS : QUARTERS;

  /* ---------- LOADING GUARD ---------- */
  if (values.length !== labels.length) {
    return (
      <ImageBackground source={bgImage} style={styles.bg}>
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.75)",
            "rgba(0,0,0,0.4)",
            "rgba(0,0,0,0.9)",
          ]}
          style={styles.overlay}
        />
        <View style={[styles.container, { justifyContent: "center" }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </ImageBackground>
    );
  }

  /* ---------- AUTO-BALANCING SLIDERS ---------- */
  const updateValue = (index: number, newValue: number) => {
    const clamped = Math.max(0, Math.min(100, newValue));
    const updated = [...values];
    updated[index] = clamped;

    const remaining = 100 - clamped;
    const otherIndexes = updated
      .map((_, i) => i)
      .filter((i) => i !== index);

    const othersTotal = otherIndexes.reduce(
      (sum, i) => sum + updated[i],
      0
    );

    if (othersTotal === 0) {
      const even = remaining / otherIndexes.length;
      otherIndexes.forEach((i) => {
        updated[i] = Number(even.toFixed(6));
      });
    } else {
      otherIndexes.forEach((i) => {
        const ratio = updated[i] / othersTotal;
        updated[i] = Number((ratio * remaining).toFixed(6));
      });
    }

    // Fix floating-point drift
    const drift = 100 - updated.reduce((a, b) => a + b, 0);
    updated[updated.length - 1] += drift;

    setValues(updated);
  };

  /* ---------- SAVE ---------- */
  const saveAndFinish = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const payload =
        mode === "monthly"
          ? values
          : expandQuarterlyToMonthly(values);

      await aiApi.put(
        `/preferences/target-split-percentage?breakup_type=${mode}&user_id=${encodeURIComponent(
          userId
        )}`,
        payload
      );

      try {
        await aiApi.post(
          `/preferences/complete-onboarding?user_id=${encodeURIComponent(
            userId
          )}`
        );
      } catch {}

      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Unable to save target split");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <ImageBackground source={bgImage} style={styles.bg} resizeMode="cover">
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.75)",
          "rgba(0,0,0,0.4)",
          "rgba(0,0,0,0.9)",
        ]}
        style={styles.overlay}
      />

      <View style={styles.container}>
        {/* ✅ SCROLLABLE CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <Text style={styles.step}>Final Step</Text>
          <Text style={styles.title}>
            {mode === "monthly" ? "Monthly" : "Quarterly"} Target Split
          </Text>

          {labels.map((label, index) => (
            <View key={label} style={styles.monthCard}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthLabel}>{label}</Text>
                <Text style={styles.monthValue}>
                  {values[index].toFixed(2)}%
                </Text>
              </View>

              <Slider
                value={values[index]}
                minimumValue={0}
                maximumValue={100}
                step={0.5}
                onValueChange={(v) => updateValue(index, v)}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#CBD5E1"
                thumbTintColor="#3B82F6"
              />
            </View>
          ))}
        </ScrollView>

        {/* ✅ FIXED BUTTON */}
        <TouchableOpacity
          style={styles.button}
          onPress={saveAndFinish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Finish Onboarding</Text>
          )}
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

/* ---------- STYLES ---------- */
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
    marginTop: 80,
    fontSize: 13,
    color: "#9CA3AF",
  },
  title: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  monthCard: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 14,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  monthValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E5E7EB",
    width: 70,
    textAlign: "right",
  },
  button: {
    backgroundColor: "#0F172A",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
