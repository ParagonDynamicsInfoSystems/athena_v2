import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import aiApi from "../hooks/aiApi";

/* ================= BACKGROUND ================= */
const BG_IMAGE = require("../../assets/images/bg.png");

/* ================= HELPERS ================= */
const pad = (n: number) => String(n).padStart(2, "0");
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const addDays = (d: Date, days: number) => {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
};

const buildWeek = (base: Date) =>
  Array.from({ length: 7 }, (_, i) => addDays(base, i - 3));

const getKey = (d: Date) =>
  `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

/* ================= STATUS HELPERS ================= */
const getCardStyle = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "met": return styles.cardMet;
    case "not met": return styles.cardNotMet;
    default: return styles.cardDefault;
  }
};

const getStatusBadgeStyle = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "met": return styles.statusMet;
    case "not met": return styles.statusNotMet;
    default: return styles.statusDefault;
  }
};

/* ================= COMPONENT ================= */
export default function CalendarScreen() {
  const router = useRouter();
  const WIDTH = Dimensions.get("window").width - 32;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const weeks = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) =>
        buildWeek(addDays(selectedDate, (i - 4) * 7))
      ),
    [selectedDate]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: WIDTH * 4, animated: false });
  }, [WIDTH]);

  /* ================= FETCH ================= */
  const fetchMeetings = useCallback(async (date: Date) => {
    const key = getKey(date);
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("crmUserId");
      if (!userId) throw new Error("User ID missing");

      const resp = await aiApi.get("/calendar/view", {
        params: {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          user_id: userId,
        },
      });

      const calendar = resp.data?.calendar_meetings || {};
      const data = Array.isArray(calendar[key]) ? calendar[key] : [];
      setMeetings(data);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMeetings(selectedDate);
    }, [fetchMeetings, selectedDate])
  );

  /* ================= DELETE ================= */
  const deleteMeeting = async (postPlanId: string, prePlanId?: string) => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("crmUserId");
      if (!userId) return;
      const planId = prePlanId || postPlanId;
      await aiApi.delete("/calendar/delete-meeting", {
        params: {
          pre_plan_id: planId,
          user_id: userId.toUpperCase(),
        },
      });
      await fetchMeetings(selectedDate);
    } catch {
      Alert.alert("Error", "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (postPlanId: string, prePlanId?: string) => {
    Alert.alert("Delete Meeting", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMeeting(postPlanId, prePlanId) },
    ]);
  };

  /* ================= MAIL NAVIGATION ================= */
  const openMailDraft = (postPlanId?: string) => {
    if (!postPlanId) return;
    router.push({
      pathname: "/mail-draft",
      params: { post_plan_id: String(postPlanId) },
    });
  };

  return (
    <ImageBackground source={BG_IMAGE} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>

          {/* HEADER */}
          <View style={styles.headerBar}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.headerTitle}>Calendar</Text>
              <Text style={styles.headerSub}>
                {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* DATE STRIP */}
          <View style={{ marginBottom: 20 }}>
            <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {weeks.map((week, wi) => (
                <View key={wi} style={{ width: WIDTH }}>
                  <View style={styles.daysRow}>
                    {week.map((d) => {
                      const selected = d.toDateString() === selectedDate.toDateString();
                      return (
                        <Pressable
                          key={d.toISOString()}
                          onPress={() => {
                            const nd = new Date(d);
                            setSelectedDate(nd);
                            fetchMeetings(nd);
                          }}
                          style={[styles.dayPill, selected && styles.daySelected]}
                        >
                          <Text style={[styles.dayName, selected && styles.dayActiveText]}>
                            {dayNames[d.getDay()]}
                          </Text>
                          <Text style={[styles.dayNumber, selected && styles.dayActiveText]}>
                            {d.getDate()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* CONTENT */}
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator size="large" color="#1E4DB3" style={{ marginTop: 40 }} />
            ) : meetings.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="calendar-outline" size={40} color="#CBD5E1" />
                </View>
                <Text style={styles.empty}>No meetings planned</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {meetings.map((m, index) => (
                  <View
                    key={`${m.pre_plan_id ?? "pre"}-${m.post_plan_id ?? "post"}-${index}`}
                    style={[styles.card, getCardStyle(m.callstatus)]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.customer} numberOfLines={1}>{m.customer}</Text>
                        <Text style={styles.customerIdText}>
                          ID: {m.customer_id} • {m.activity || "Task"}
                        </Text>
                      </View>

                      <View style={styles.badgeRow}>
                        {m.post_plan_id && (
                          <Pressable
                            style={styles.mailIconBtn}
                            onPress={() => openMailDraft(m.post_plan_id)}
                          >
                            <Ionicons name="mail-outline" size={14} color="#1E4DB3" />
                          </Pressable>
                        )}

                        {m.ai_generated === true && (
                          <View style={styles.aiBadge}>
                            <Ionicons name="sparkles" size={10} color="#7C3AED" />
                            <Text style={styles.aiText}>AI</Text>
                          </View>
                        )}

                        <View style={[styles.statusBadge, getStatusBadgeStyle(m.callstatus)]}>
                          <Text style={styles.statusText}>
                            {m.callstatus?.toUpperCase() || "PLAN"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {m.description && (
                      <Text style={styles.descriptionText} numberOfLines={2}>
                        {m.description}
                      </Text>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.metaContainer}>
                      <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={16} color="#64748B" />
                        <Text style={styles.metaText}>
                          {m.plan_time ||
                            (m.from_time
                              ? `${m.from_time.substring(0, 5)} - ${m.to_time.substring(0, 5)}`
                              : "Not Scheduled")}
                        </Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Ionicons
                          name={m.plan_mode?.toLowerCase() === "online"
                            ? "videocam-outline"
                            : "location-outline"}
                          size={16}
                          color="#64748B"
                        />
                        <Text style={styles.metaText}>{m.plan_mode || "Physical"}</Text>
                      </View>
                    </View>

                    <View style={styles.footerRow}>
                      {m.callstatus?.toLowerCase() !== "met" && (
                        <View style={styles.actionRow}>
                          <Pressable
                            style={styles.editBtn}
                            onPress={() =>
                              router.push({
                                pathname: "/(tabs)/add-plan-screen",
                                params: {
                                  pre_plan_id: String(m.pre_plan_id ?? ""),
                                  meeting: JSON.stringify(m),
                                  date: getKey(selectedDate),
                                },
                              })
                            }
                          >
                            <Ionicons name="create-outline" size={18} color="#1E4DB3" />
                            <Text style={styles.editText}>Edit Plan</Text>
                          </Pressable>

                          <Pressable
                            style={styles.deleteBtn}
                            onPress={() => handleDelete(m.post_plan_id, m.pre_plan_id)}
                          >
                            <Ionicons name="trash-outline" size={18} color="#DC2626" />
                          </Pressable>
                        </View>
                      )}

                      {m.callstatus?.toLowerCase() === "not met" && (
                        <Pressable
                          style={styles.convertBtn}
                          onPress={() =>
                            router.push({
                              pathname: "/(tabs)/meeting-entry",
                              params: {
                                meetingDate: getKey(selectedDate),
                                postPlanId: m.post_plan_id,
                                pre_plan_id: m.pre_plan_id ?? "",
                                customer_id: m.customer_id ?? "",
                                meeting: JSON.stringify(m),
                              },
                            })
                          }
                        >
                          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                          <Text style={styles.convertText}>Check-in Meeting</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: 20, padding: 10, marginBottom: 20, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#051539" },
  headerSub: { fontSize: 12, color: "#64748B", fontWeight: "700" },
  iconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#051539", alignItems: "center", justifyContent: "center" },

  daysRow: { flexDirection: "row", justifyContent: "space-between" },
  dayPill: { width: 46, height: 62, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5, 21, 57, 0.8)" },
  daySelected: { backgroundColor: "#fff", elevation: 6 },
  dayName: { fontSize: 10, color: "rgba(255,255,255,0.6)" },
  dayNumber: { fontSize: 18, fontWeight: "800", color: "#fff" },
  dayActiveText: { color: "#051539" },

  content: { flex: 1, backgroundColor: "#F1F5F9", borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 20, marginHorizontal: -16, marginBottom: -16 },

  card: { padding: 18, borderRadius: 24, marginBottom: 16, backgroundColor: "#fff", elevation: 3, borderWidth: 1, borderColor: "#E2E8F0" },
  cardMet: { borderLeftWidth: 6, borderLeftColor: "#10B981" },
  cardNotMet: { borderLeftWidth: 6, borderLeftColor: "#EF4444" },
  cardDefault: { borderLeftWidth: 6, borderLeftColor: "#3B82F6" },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  customer: { fontSize: 17, fontWeight: "800", color: "#1E293B", flex: 1 },
  customerIdText: { fontSize: 12, color: "#64748B", fontWeight: "600" },

  badgeRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  mailIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusMet: { backgroundColor: "#DCFCE7" },
  statusNotMet: { backgroundColor: "#FEE2E2" },
  statusDefault: { backgroundColor: "#E0E7FF" },
  statusText: { fontSize: 9, fontWeight: "900", color: "#1E293B" },

  aiBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F3FF", paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#DDD6FE" },
  aiText: { fontSize: 9, fontWeight: "900", color: "#7C3AED", marginLeft: 3 },

  descriptionText: { fontSize: 13, color: "#64748B", marginBottom: 10, lineHeight: 18 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 15 },

  metaContainer: { gap: 8, marginBottom: 15 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaText: { fontSize: 14, color: "#475569", fontWeight: "600" },

  footerRow: { gap: 10 },
  actionRow: { flexDirection: "row", gap: 10 },
  editBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#EFF6FF", paddingVertical: 12, borderRadius: 14, gap: 6 },
  deleteBtn: { width: 50, alignItems: "center", justifyContent: "center", backgroundColor: "#FEF2F2", borderRadius: 14 },
  editText: { color: "#1E4DB3", fontWeight: "800" },

  convertBtn: { flexDirection: "row", backgroundColor: "#059669", padding: 14, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8 },
  convertText: { fontWeight: "800", color: "#fff" },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  empty: { color: "#94A3B8", fontWeight: "700", fontSize: 16 },
});
