// app/(tabs)/_layout.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          // If you want the bottom bar visible, keep this. 
          // If you only want the floating button, uncomment the line below:
          // tabBarStyle: { display: "none" }, 
        }}
      >
        {/* 1. DASHBOARD / HOME (Keep only this one) */}
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
            title: "A-Track",
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
              <Ionicons name="call-outline" size={size} color={color} />
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
            title: "Track Shipment",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="truck-fast-outline" size={size} color={color} />
            ),
          }}
        />
       //================hide screens  =================

 <Tabs.Screen
          name="add-plan-screen"
          options={{
            title: "plan",
             href: null, // hides from tab bar
          tabBarStyle: { display: "none" },
          }}
        />

        <Tabs.Screen
          name="meeting-entry"
          options={{
            title: "",
             href: null, // hides from tab bar
          tabBarStyle: { display: "none" },
          }}
        />
       <Tabs.Screen
  name="meeting-recording"
  options={{
    href: null,
  }}
/>

<Tabs.Screen
  name="mail-draft"
  options={{
    href: null,
  }}
/><Tabs.Screen
  name="VisitingCardScanner"
  options={{
    href: null,
  }}
/><Tabs.Screen
  name="meeting-transcription-status"
  options={{
    href: null,
  }}
/>
      </Tabs>

    
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  homeFab: {
    position: "absolute",
    left: 18,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#4375eaff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 20,
    zIndex: 100, // Makes sure button stays above the tab content
  },
});