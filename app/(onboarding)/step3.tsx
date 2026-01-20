import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import aiApi from "../hooks/aiApi";

const bgImage = require("../../assets/images/bg.png");

export default function TargetSetupScreen() {
  const router = useRouter();
  const [revenue, setRevenue] = useState(500000);
  const [meetings, setMeetings] = useState(50);
  const [loading, setLoading] = useState(false);

  const saveTargets = async () => {
    try {
      setLoading(true);

      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "User not found");
        return;
      }

      await aiApi.put(
        `/preferences/targets?user_id=${encodeURIComponent(userId)}`,
        {
          revenue,
          meetings,
        }
      );

      router.replace("/(onboarding)/step4");
    } catch (e) {
      Alert.alert(
        "Unable to save targets",
        "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={bgImage} style={styles.bg} resizeMode="cover">
      <LinearGradient
        colors={["rgba(0,0,0,0.75)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.9)"]}
        style={styles.overlay}
      />

      <View style={styles.container}>
        <View>
          <Text style={styles.step}>Step 2 of 3</Text>
          <Text style={styles.title}>Set Your Targets</Text>
          <Text style={styles.subtitle}>
            Define clear goals to track your performance.
          </Text>

          {/* ===== Revenue Target ===== */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Revenue Target</Text>
            <Text style={styles.value}>
              ₹ {revenue.toLocaleString()}
            </Text>

            <Slider
              minimumValue={0}
              maximumValue={10000000}
              step={10000}
              value={revenue}
              onValueChange={setRevenue}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#CBD5E1"
              thumbTintColor="#3B82F6"
            />
          </View>

          {/* ===== Meetings Target ===== */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Meetings Target</Text>
            <Text style={styles.value}>
              {meetings} meetings
            </Text>

            <Slider
              minimumValue={0}
              maximumValue={500}
              step={5}
              value={meetings}
              onValueChange={setMeetings}
              minimumTrackTintColor="#10B981"
              maximumTrackTintColor="#CBD5E1"
              thumbTintColor="#10B981"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={saveTargets}
          disabled={loading}
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
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#D1D5DB",
  },
  card: {
    marginTop: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 18,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  value: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
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
