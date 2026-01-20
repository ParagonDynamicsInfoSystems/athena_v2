import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
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
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

export default function FiscalYearScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState<number>(5);
  const [loading, setLoading] = useState(false);

  const saveFiscalYear = async () => {
    try {
      setLoading(true);

      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "User not found");
        return;
      }

      await aiApi.put(
        `/preferences/fiscal-year-start-month?month=${selectedMonth}&user_id=${encodeURIComponent(
          userId
        )}`
      );

      // Go to next onboarding step
      router.replace("/(onboarding)/step3");
    } catch (error) {
      Alert.alert(
        "Unable to save",
        "Failed to update fiscal year. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={bgImage} style={styles.bg} resizeMode="cover">
      <LinearGradient
        colors={["rgba(5, 7, 31, 0.7)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.9)"]}
        style={styles.overlay}
      />

      <View style={styles.container}>
        <View>
          <Text style={styles.step}>Step 1 of 3</Text>
          <Text style={styles.title}>Fiscal Year Start</Text>
          <Text style={styles.subtitle}>
            Select the month when your financial year begins.
          </Text>

          <ScrollView
            style={styles.monthList}
            showsVerticalScrollIndicator={false}
          >
            {MONTHS.map((month) => (
              <TouchableOpacity
                key={month.value}
                style={[
                  styles.monthItem,
                  selectedMonth === month.value &&
                    styles.monthItemSelected,
                ]}
                onPress={() => setSelectedMonth(month.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.monthText,
                    selectedMonth === month.value &&
                      styles.monthTextSelected,
                  ]}
                >
                  {month.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={saveFiscalYear}
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
  monthList: {
    marginTop: 30,
    maxHeight: 320,
  },
  monthItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },
  monthItemSelected: {
    backgroundColor: "#FFFFFF",
  },
  monthText: {
    fontSize: 15,
    color: "#E5E7EB",
    fontWeight: "500",
  },
  monthTextSelected: {
    color: "#111827",
    fontWeight: "700",
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
