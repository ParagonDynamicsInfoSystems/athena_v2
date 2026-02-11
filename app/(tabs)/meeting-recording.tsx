// app/meeting-recording.tsx
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import aiApi from "../hooks/aiApi";
const UPLOAD_LANG = "en";


type StartResponse = {
  success?: boolean;
  job_id?: string;
  jobId?: string;
  message?: string;
  status?: string;
  error_message?: string | null;
};


export default function MeetingRecordingScreen() {
  const router = useRouter();
  const { pre_plan_id } = useLocalSearchParams<{ pre_plan_id?: string }>();

  const recordingRef = useRef<Audio.Recording | null>(null);
  const mountedRef = useRef(true);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [durationMillis, setDurationMillis] = useState<number | null>(null);

  // ===== Audio mode =====
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn("Audio mode error:", e);
      }
    })();

    return () => {
      mountedRef.current = false;
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  // ===== Recording preset =====
  const RECORDING_OPTIONS: Audio.RecordingOptions = {
    android: {
      extension: ".m4a",
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
    ios: {
      extension: ".m4a",
      outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      audioQuality: 0,
    },
    web: {
      mimeType: "audio/webm",
      bitsPerSecond: 128000,
    },
  };

  // ===== Upload =====
  const uploadRecording = useCallback(async () => {
    try {
      if (!pre_plan_id) {
        Alert.alert("Missing Plan ID", "pre_plan_id not found");
        return;
      }

      const rec = recordingRef.current;
      if (!rec) {
        Alert.alert("No Recording", "Please record audio first");
        return;
      }

      const uri = rec.getURI();
      if (!uri) {
        Alert.alert("File Error", "Recording file missing");
        return;
      }

      setIsProcessing(true);

      // Get user_id from AsyncStorage
      const userId = await AsyncStorage.getItem("crmUserId");
      if (!userId) {
        Alert.alert("Auth Error", "User session expired");
        return;
      }

      const form = new FormData();
      form.append(
        "file",
        {
          uri,
          name: "meeting.m4a",
          type: "audio/mp4",
        } as any
      );

      const path = `/meeting_transcription/start?user_id=${encodeURIComponent(
        userId
      )}&language=${UPLOAD_LANG}&post_plan_id=${encodeURIComponent(
        pre_plan_id
      )}`;

      const resp = await aiApi.post(path, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const body: StartResponse = resp?.data ?? {};
      const jobId = body?.job_id ?? body?.jobId;


      if (!jobId) {
        Alert.alert(
          "Upload Failed",
          body?.error_message || body?.message || "No job id returned"
        );
        return;
      }

      // Navigate to status screen with job_id
      router.replace(
        `/meeting-transcription-status?job_id=${encodeURIComponent(
          String(jobId)
        )}`
      );
    } catch (e: any) {
      console.error("Upload error:", e);
      Alert.alert("Upload Failed", e?.message ?? "Network error");
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  }, [pre_plan_id, router]);

  // ===== Start recording =====
  const startRecording = useCallback(async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Microphone permission needed");
        return;
      }

      setIsProcessing(true);

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(RECORDING_OPTIONS);
      await rec.startAsync();

      recordingRef.current = rec;
      setIsRecording(true);
      setDurationMillis(null);
    } catch (e: any) {
      Alert.alert("Recording Error", e?.message ?? "Failed to start recording");
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  }, []);

  // ===== Stop recording =====
  const stopRecording = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec) return;

    setIsProcessing(true);
    try {
      await rec.stopAndUnloadAsync();
      const status = await rec.getStatusAsync();
      setDurationMillis(status.durationMillis ?? null);
      setIsRecording(false);

      setTimeout(uploadRecording, 200);
    } catch (e: any) {
      Alert.alert("Recording Error", e?.message ?? "Stop failed");
    }
  }, [uploadRecording]);

  // ===== Timer =====
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(async () => {
      const s = await recordingRef.current?.getStatusAsync();
      if (s && "durationMillis" in s && mountedRef.current) {
        setDurationMillis(s.durationMillis ?? null);
      }
    }, 500);
    return () => clearInterval(id);
  }, [isRecording]);

  const mmss = (ms?: number | null) => {
    if (!ms) return "";
    const t = Math.floor(ms / 1000);
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(
      t % 60
    ).padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Record Meeting</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.center}>
          <MaterialIcons name="mic" size={70} color="#1E4DB3" />

          {!!durationMillis && <Text style={styles.timer}>{mmss(durationMillis)}</Text>}

          <Text style={styles.hint}>
            {isRecording ? "Recording… speak now" : "Tap Record to start"}
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, isRecording && styles.primaryBtnRecording]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isRecording ? "Stop" : "Record"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6FAFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#0D47A1",
  },
  logo: { width: 28, height: 28, marginRight: 10, tintColor: "#fff" },
  title: { color: "#fff", fontWeight: "800", fontSize: 18 },

  container: { flex: 1, justifyContent: "center", padding: 24 },
  center: { alignItems: "center" },

  hint: { marginTop: 8, marginBottom: 18, color: "#666" },
  timer: { fontWeight: "800", fontSize: 20, marginTop: 10 },

  primaryBtn: {
    backgroundColor: "#1E4DB3",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    minWidth: 180,
    alignItems: "center",
  },
  primaryBtnRecording: { backgroundColor: "#D9534F" },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});