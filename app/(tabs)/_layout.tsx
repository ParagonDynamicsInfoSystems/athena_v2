// app/(tabs)/_layout.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
      >
        {/* 1. DASHBOARD / HOME */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={28} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="a-track"
          options={{
            title: "ERP Tracking",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="radar" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="shipment-details"
          options={{
            title: "Shipment Details",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="customers"
          options={{
            title: "Customers Outstanding",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="sea-tariff"
          options={{
            title: "Sea Tariff",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="ship-wheel" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="TrackShipmentScreen"
          options={{
            title: "Shipment Tracking",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="truck-fast-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Hidden screens */}
        <Tabs.Screen
          name="add-plan-screen"
          options={{
            title: "plan",
            href: null,
            tabBarStyle: { display: "none" },
          }}
        />

        <Tabs.Screen
          name="meeting-entry"
          options={{
            title: "",
            href: null,
            tabBarStyle: { display: "none" },
          }}
        />

        <Tabs.Screen
          name="meeting-recording"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="mail-draft"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="VisitingCardScanner"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="meeting-transcription-status"
          options={{ href: null }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
