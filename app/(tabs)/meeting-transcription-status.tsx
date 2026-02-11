import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import aiApi from "../hooks/aiApi";

/* ================= HELPERS ================= */
const normalizeProgress = (p: any) =>
  Math.max(0, Math.min(100, Number(p) || 0));

const extractMeetingAnalysis = (data: any) => {
  const analysis = data?.result?.formatted?.meeting_analysis ?? {};
  return {
    meetingSummary:
      analysis?.meeting_summary?.executive_summary ??
      "No summary available.",

    activeSpeakers:
      analysis?.active_speakers_analysis?.participation_ranking ?? [],

    engagementMetrics:
      analysis?.active_speakers_analysis?.engagement_metrics ?? null,

    additionalInsights:
      analysis?.additional_insights?.topics_by_category ?? {},

    expertiseDemonstrated:
      analysis?.additional_insights?.expertise_demonstrated ?? [],

    positiveHighlights:
      analysis?.additional_insights?.positive_highlights ?? [],
  };
};

/* ================= SCREEN ================= */
export default function MeetingTranscriptionStatusScreen() {
  const router = useRouter();
  const { job_id } = useLocalSearchParams<{ job_id?: string }>();

  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollTimer.current) {
        clearTimeout(pollTimer.current);
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  };

  /* ================= POLLING ================= */
  const poll = useCallback(async () => {
    if (!job_id) return;

    const userId = await AsyncStorage.getItem("crmUserId");
    if (!userId) return;

    try {
      const resp = await aiApi.get(
        "/meeting_transcription/status",
        {
          params: {
            job_id,
            user_id: userId,
          },
        }
      );

      const body = resp?.data;

      const prog = normalizeProgress(body?.progress);
      setProgress(prog);

      if (body?.status === "completed") {
        stopPolling();
        setResult(extractMeetingAnalysis(body));
        return;
      }

      pollTimer.current = setTimeout(() => {
        if (mountedRef.current) poll();
      }, 5000);
    } catch (e) {
      stopPolling();
    }
  }, [job_id]);

  /* ================= START POLLING ================= */
  useEffect(() => {
    poll();
  }, [poll]);

  const onBack = () => {
    stopPolling();
    router.replace("/(tabs)/calendar");
  };

  /* ================= UI ================= */
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Meeting Insights</Text>
      </View>

      {/* ================= PROCESSING UI ================= */}
      {progress < 100 || !result ? (
        <View style={styles.loading}>
          <Text style={styles.progressText}>{progress}%</Text>
          <ActivityIndicator size="large" color="#1E4DB3" />
          <Text style={styles.subText}>
            Meeting is being analyzed…
          </Text>
        </View>
      ) : (
        /* ================= RESULT UI ================= */
        <ScrollView contentContainerStyle={styles.content}>
          <Card title="Meeting Summary">
            <Text style={styles.text}>
              {result.meetingSummary}
            </Text>
          </Card>

          <Card title="Active Speakers">
            {result.activeSpeakers.map((s: any, i: number) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bold}>
                  {s.speaker_name} (
                  {s.participation_percentage}%)
                </Text>
                <Text style={styles.text}>
                  {s.contribution_type}
                </Text>
              </View>
            ))}
          </Card>

          <Card title="Engagement Metrics">
            <Text style={styles.text}>
              {result.engagementMetrics?.interaction_patterns}
            </Text>
          </Card>

          <Card title="Additional Insights">
            {Object.entries(result.additionalInsights).map(
              ([key, values]: any) => (
                <View key={key} style={{ marginBottom: 8 }}>
                  <Text style={styles.bold}>
                    {key.toUpperCase()}
                  </Text>
                  {values.map((v: string, i: number) => (
                    <Text key={i} style={styles.text}>
                      • {v}
                    </Text>
                  ))}
                </View>
              )
            )}
          </Card>

          <Card title="Expertise Demonstrated">
            {result.expertiseDemonstrated.map(
              (e: any, i: number) => (
                <Text key={i} style={styles.text}>
                  • {e.speaker} — {e.expertise_area}
                </Text>
              )
            )}
          </Card>

          <Card title="Positive Highlights">
            {result.positiveHighlights.map(
              (p: string, i: number) => (
                <Text key={i} style={styles.text}>
                  • {p}
                </Text>
              )
            )}
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ================= CARD COMPONENT ================= */
const Card = ({ title, children }: any) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6FAFF" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#0D47A1",
  },
  backBtn: { marginRight: 12 },
  backTxt: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 18 },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  progressText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#1E4DB3",
    marginBottom: 10,
  },

  subText: {
    marginTop: 10,
    color: "#555",
    fontSize: 14,
  },

  content: { padding: 16 },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e6f0ff",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#15314a",
    marginBottom: 8,
  },

  text: { fontSize: 14, color: "#333", lineHeight: 20 },
  bold: { fontWeight: "700", color: "#15314a" },
  listItem: { marginBottom: 8 },
});
