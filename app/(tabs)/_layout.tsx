import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />

      {/* FLOATING HOME BUTTON */}
      <TouchableOpacity
        style={styles.homeFab}
        onPress={() => router.replace("/(tabs)")}
        activeOpacity={0.85}
      >
        <Ionicons name="home" size={40} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  homeFab: {
    position: "absolute",
    bottom: 22,
    left: 18,

    width: 65,
    height: 65,
    borderRadius: 50,

    backgroundColor: "#4375eaff",
    justifyContent: "center",
    alignItems: "center",

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,

    // Android
    elevation: 20,
  },
});
