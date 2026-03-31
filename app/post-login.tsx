import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import aiApi from "./hooks/aiApi";

export default function PostLogin() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          router.replace("/(auth)/login");
          return;
        }

        const res = await aiApi.get(
          `/preferences/is-onboarded?user_id=${encodeURIComponent(userId)}`
        );

        if (res.data?.is_onboarded === true) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(onboarding)");
        }
      } catch (e) {
        // On error, send to login — do NOT grant access
        router.replace("/(auth)/login");
      }
    };

    checkOnboarding();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
