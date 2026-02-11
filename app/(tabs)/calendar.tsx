import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

/* ================= TYPES ================= */
interface Meeting {
  pre_plan_id?: string;
  post_plan_id?: string;
  customer: string;
  customer_id: string;
  activity?: string;
  description?: string;
  callstatus?: string;
  plan_time?: string;
  from_time?: string;
  to_time?: string;
  plan_mode?: string;
  ai_generated?: boolean | string | number;
}

/* ================= BACKGROUND ================= */
const BG_IMAGE = require("../../assets/images/bg.png");

/* ================= HELPERS ================= */
const pad = (n: number) => String(n).padStart(2, "0");
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const getKey = (d: Date) =>
  `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
};

const getWeekDates = (centerDate: Date) => {
  const dates: Date[] = [];
  const center = new Date(centerDate);
  center.setHours(0, 0, 0, 0);
  
  // Start from 3 days before center
  for (let i = -3; i <= 3; i++) {
    const date = new Date(center);
    date.setDate(center.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

const isAIGenerated = (value: any): boolean => {
  return value === true || value === "true" || value === 1 || value === "1";
};

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
  const { width: screenWidth } = Dimensions.get("window");
  const CONTAINER_PADDING = 32;
  const WEEK_WIDTH = screenWidth - CONTAINER_PADDING;

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [currentWeekCenter, setCurrentWeekCenter] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [transcriptMap, setTranscriptMap] = useState<
  Record<string, { job_id: string; status: string }>
>({});

  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const isScrollingRef = useRef(false);

  // Generate 3 weeks: previous, current, next
  const weeks = [
    getWeekDates(new Date(currentWeekCenter.getTime() - 7 * 24 * 60 * 60 * 1000)),
    getWeekDates(currentWeekCenter),
    getWeekDates(new Date(currentWeekCenter.getTime() + 7 * 24 * 60 * 60 * 1000)),
  ];

  // Auto-scroll to center week on mount and week change
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: WEEK_WIDTH, animated: false });
    }, 100);
  }, [currentWeekCenter, WEEK_WIDTH]);

  /* ================= FETCH ================= */
  const fetchMeetings = useCallback(async (date: Date) => {
    const key = getKey(date);
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("crmUserId");
      if (!userId) {
        Alert.alert("Error", "User session expired");
        setMeetings([]);
        return;
      }

      const resp = await aiApi.get("/calendar/view", {
        params: {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          user_id: userId,
        },
      });
     const checkTranscript = async (prePlanId: string) => {
  try {
    const userId = await AsyncStorage.getItem("crmUserId");
    if (!userId) return;

    const resp = await aiApi.get("/meeting_transcription/status", {
      params: {
        user_id: userId,
        pre_plan_id: prePlanId,
      },
    });

    const data = resp?.data;

    if (data?.job_id) {
      setTranscriptMap((prev) => ({
        ...prev,
        [prePlanId]: {
          job_id: data.job_id,
          status: data.status,
        },
      }));
    }
  } catch (e) {
    console.log("Transcript check failed:", e);
  }
};

      const calendar = resp.data?.calendar_meetings || {};
      const data = Array.isArray(calendar[key]) ? calendar[key] : [];
      
      setMeetings(data);
      

data.forEach((m: Meeting) => {
  if (m.pre_plan_id) {
    checkTranscript(m.pre_plan_id);
  }
});


    } catch (err) {
      console.error("Fetch meetings error:", err);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const loadData = async () => {
        if (isActive) {
          await fetchMeetings(selectedDate);
        }
      };
      
      loadData();
      
      return () => {
        isActive = false;
      };
    }, [fetchMeetings, selectedDate])
  );

  /* ================= SCROLL HANDLING ================= */
  const handleScrollEnd = (event: any) => {
    if (isScrollingRef.current) return;
    
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / WEEK_WIDTH);
    
    if (page === 0) {
      // Scrolled to previous week
      isScrollingRef.current = true;
      const newCenter = new Date(currentWeekCenter);
      newCenter.setDate(currentWeekCenter.getDate() - 7);
      setCurrentWeekCenter(newCenter);
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 300);
    } else if (page === 2) {
      // Scrolled to next week
      isScrollingRef.current = true;
      const newCenter = new Date(currentWeekCenter);
      newCenter.setDate(currentWeekCenter.getDate() + 7);
      setCurrentWeekCenter(newCenter);
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 300);
    }
  };

  /* ================= DELETE ================= */
  const deleteMeeting = async (postPlanId: string, prePlanId?: string) => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("crmUserId");
      if (!userId) {
        Alert.alert("Error", "User session expired");
        return;
      }
      const planId = prePlanId || postPlanId;
      await aiApi.delete("/calendar/delete-meeting", {
        params: {
          pre_plan_id: planId,
          user_id: userId.toUpperCase(),
        },
      });
      await fetchMeetings(selectedDate);
      Alert.alert("Success", "Meeting deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      Alert.alert("Error", "Failed to delete meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (postPlanId: string, prePlanId?: string) => {
    Alert.alert("Delete Meeting", "Are you sure you want to delete this meeting?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => deleteMeeting(postPlanId, prePlanId) 
      },
    ]);
  };

  /* ================= MAIL NAVIGATION ================= */
  const openMailDraft = (postPlanId?: string) => {
    if (!postPlanId) {
      Alert.alert("Error", "Cannot create mail draft - meeting ID missing");
      return;
    }
    router.push({
      pathname: "/mail-draft",
      params: { post_plan_id: String(postPlanId) },
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    fetchMeetings(date);
  };

  return (
    <ImageBackground source={BG_IMAGE} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>

          {/* HEADER */}
          <View style={styles.headerBar}>
            <Pressable 
              onPress={() => router.back()} 
              style={styles.iconBtn}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
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
            <ScrollView 
              ref={scrollRef} 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScrollEnd}
              scrollEventThrottle={16}
            >
              {weeks.map((week, weekIndex) => (
                <View key={`week-${weekIndex}`} style={{ width: WEEK_WIDTH }}>
                  <View style={styles.daysRow}>
                    {week.map((date, dayIndex) => {
                      const isSelected = isSameDay(date, selectedDate);
                      const isToday = isSameDay(date, new Date());
                      
                      return (
                        <Pressable
                          key={`${weekIndex}-${dayIndex}-${date.toISOString()}`}
                          onPress={() => handleDateSelect(date)}
                          style={[
                            styles.dayPill,
                            isSelected && styles.daySelected,
                            isToday && !isSelected && styles.dayToday
                          ]}
                          accessibilityLabel={`Select ${dayNames[date.getDay()]} ${date.getDate()}`}
                          accessibilityRole="button"
                        >
                          <Text style={[
                            styles.dayName, 
                            isSelected && styles.dayActiveText,
                            isToday && !isSelected && styles.dayTodayText
                          ]}>
                            {dayNames[date.getDay()]}
                          </Text>
                          <Text style={[
                            styles.dayNumber, 
                            isSelected && styles.dayActiveText,
                            isToday && !isSelected && styles.dayTodayText
                          ]}>
                            {date.getDate()}
                          </Text>
                          {isToday && !isSelected && (
                            <View style={styles.todayDot} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.actionButtonContainer}>
            <Pressable
              style={[styles.quickActionBtn, { backgroundColor: "#1E4DB3" }]}
              onPress={() => router.push({ 
                pathname: "/(tabs)/add-plan-screen", 
                params: { date: getKey(selectedDate) } 
              })}
              accessibilityLabel="Add new plan"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Add Plan</Text>
            </Pressable>
            <Pressable
              style={[styles.quickActionBtn, { backgroundColor: "#051539" }]}
              onPress={() => router.push({ pathname: "/(tabs)/meeting-entry" })}
              accessibilityLabel="Add new meeting"
              accessibilityRole="button"
            >
              <Ionicons name="videocam-outline" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Add Meeting</Text>
            </Pressable>
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
                <Text style={styles.emptySubtext}>
                  {getKey(selectedDate)}
                </Text>
              </View>
            ) : (
              <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {meetings.map((m, index) => (
                  <View
                    key={`meeting-${m.pre_plan_id || m.post_plan_id || index}-${index}`}
                    style={[styles.card, getCardStyle(m.callstatus)]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.customer} numberOfLines={1}>
                          {m.customer}
                        </Text>
                        <Text style={styles.customerIdText}>
                          ID: {m.customer_id} • {m.activity || "Task"}
                        </Text>
                      </View>
                      
                      <View style={styles.badgeRow}>
                        {/* Mail Draft Button - only show if post_plan_id exists */}
                        {m.post_plan_id && (
                          <Pressable
                            style={styles.mailIconBtn}
                            onPress={() => openMailDraft(m.post_plan_id)}
                            accessibilityLabel="Create mail draft"
                            accessibilityRole="button"
                          >
                            <Ionicons name="mail-outline" size={14} color="#1E4DB3" />
                          </Pressable>
                        )}

                        {/* AI Badge */}
                        {isAIGenerated(m.ai_generated) && (
                          <View style={styles.aiBadge}>
                            <Ionicons name="sparkles" size={10} color="#7C3AED" />
                            <Text style={styles.aiText}>AI</Text>
                          </View>
                        )}
                        
                        {/* Status Badge */}
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
                          {m.plan_time || (m.from_time ? `${m.from_time.substring(0,5)} - ${m.to_time?.substring(0,5) || ''}` : "Not Scheduled")}
                        </Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Ionicons 
                          name={m.plan_mode?.toLowerCase() === 'online' ? "videocam-outline" : "location-outline"} 
                          size={16} 
                          color="#64748B" 
                        />
                        <Text style={styles.metaText}>
                          {m.plan_mode || "Physical"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.footerRow}>
                      {m.callstatus?.toLowerCase() !== "met" && (
                        <View style={styles.actionRow}>
                          <Pressable
                            style={styles.editBtn}
                            onPress={() => router.push({
                              pathname: "/(tabs)/add-plan-screen",
                              params: { 
                                pre_plan_id: String(m.pre_plan_id ?? ""), 
                                meeting: JSON.stringify(m), 
                                date: getKey(selectedDate) 
                              },
                            })}
                            accessibilityLabel="Edit plan"
                            accessibilityRole="button"
                          >
                            <Ionicons name="create-outline" size={18} color="#1E4DB3" />
                            <Text style={styles.editText}>Edit Plan</Text>
                          </Pressable>
                          <Pressable 
                            style={styles.deleteBtn} 
                            onPress={() => handleDelete(m.post_plan_id!, m.pre_plan_id)}
                            accessibilityLabel="Delete meeting"
                            accessibilityRole="button"
                          >
                            <Ionicons name="trash-outline" size={18} color="#DC2626" />
                          </Pressable>
                        </View>
                      )}

                      {m.callstatus?.toLowerCase() === "not met" && (
  <View style={styles.notMetActionRow}>
    {/* Check-in button */}
    <Pressable
      style={styles.convertBtn}
      onPress={() => router.push({
        pathname: "/(tabs)/meeting-entry",
        params: { 
          meetingDate: getKey(selectedDate), 
          postPlanId: m.post_plan_id!, 
          pre_plan_id: m.pre_plan_id ?? "", 
          customer_id: m.customer_id ?? "", 
          meeting: JSON.stringify(m) 
        },
      })}
      accessibilityLabel="Check in meeting"
      accessibilityRole="button"
    >
      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
      <Text style={styles.convertText}>Check-in</Text>
    </Pressable>

    {/* Record button */}
    <Pressable
      style={styles.smallRecordBtn}
      onPress={() => router.push({
        pathname: "/meeting-recording",
        params: { 
          pre_plan_id: String(m.pre_plan_id ?? m.post_plan_id ?? "") 
        },
      })}
      accessibilityLabel="Record meeting"
      accessibilityRole="button"
    >
      <Ionicons name="mic-outline" size={18} color="#fff" />
      <Text style={styles.smallRecordText}>Record</Text>
    </Pressable>
  </View>
)}


                      {/* RECORDING BUTTON - Only show for "met" status */}
                      {m.callstatus?.toLowerCase() === "met" && (
                        <Pressable
                          style={styles.recordBtn}
                          onPress={() => router.push({
                            pathname: "/meeting-recording",
                            params: { pre_plan_id: String(m.pre_plan_id ?? m.post_plan_id ?? "") },
                          })}
                          accessibilityLabel="Record meeting audio"
                          accessibilityRole="button"
                        >
                          <Ionicons name="mic-outline" size={20} color="#fff" />
                          <Text style={styles.recordText}>Record Audio</Text>
                        </Pressable>
                      )}{/* VIEW TRANSCRIPT BUTTON */}
{m.pre_plan_id &&
  transcriptMap[m.pre_plan_id]?.status === "completed" && (
    <Pressable
      style={[styles.smallRecordBtn, { backgroundColor: "#1E4DB3" }]}
      onPress={() =>
        router.push({
          pathname: "/meeting-transcription-status",
          params: {
            job_id: transcriptMap[m.pre_plan_id].job_id,
          },
        })
      }
      accessibilityRole="button"
    >
      <Ionicons name="document-text-outline" size={18} color="#fff" />
      <Text style={styles.smallRecordText}>View Transcript</Text>
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
  headerBar: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    padding: 10, 
    marginBottom: 20, 
    elevation: 2 
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: '#051539' },
  headerSub: { fontSize: 12, color: "#64748B", fontWeight: '700' },
  iconBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: "#051539", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  daysRow: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    paddingHorizontal: 4
  },
  dayPill: { 
    width: 46, 
    height: 62, 
    borderRadius: 15, 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "rgba(5, 21, 57, 0.8)",
    position: "relative"
  },
  daySelected: { 
    backgroundColor: "#fff", 
    elevation: 6,
    shadowColor: "#1E4DB3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dayToday: {
    backgroundColor: "rgba(30, 77, 179, 0.9)",
    borderWidth: 2,
    borderColor: "#fff"
  },
  dayName: { fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  dayNumber: { fontSize: 18, fontWeight: "800", color: "#fff", marginTop: 2 },
  dayActiveText: { color: "#051539" },
  dayTodayText: { color: "#fff" },
  todayDot: {
    position: "absolute",
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fff"
  },
  actionButtonContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickActionBtn: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 14, 
    borderRadius: 16, 
    gap: 8, 
    elevation: 3 
  },
  quickActionText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  content: { 
    flex: 1, 
    backgroundColor: "#F1F5F9", 
    borderTopLeftRadius: 36, 
    borderTopRightRadius: 36, 
    padding: 20, 
    marginHorizontal: -16, 
    marginBottom: -16 
  },
  card: { 
    padding: 18, 
    borderRadius: 24, 
    marginBottom: 16, 
    backgroundColor: "#fff", 
    elevation: 3, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  cardMet: { borderLeftWidth: 6, borderLeftColor: "#10B981" },
  cardNotMet: { borderLeftWidth: 6, borderLeftColor: "#EF4444" },
  cardDefault: { borderLeftWidth: 6, borderLeftColor: "#3B82F6" },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  customer: { fontSize: 17, fontWeight: "800", color: '#1E293B', flex: 1 },
  customerIdText: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
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
  aiBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F5F3FF', 
    paddingHorizontal: 7, 
    paddingVertical: 4, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#DDD6FE' 
  },
  aiText: { fontSize: 9, fontWeight: '900', color: '#7C3AED', marginLeft: 3 },
  descriptionText: { 
    fontSize: 13, 
    color: '#64748B', 
    marginBottom: 10, 
    lineHeight: 18 
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 15 },
  metaContainer: { gap: 8, marginBottom: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaText: { fontSize: 14, color: "#475569", fontWeight: '600' },
  footerRow: { gap: 10 },
  actionRow: { flexDirection: "row", gap: 10 },
  editBtn: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: 'center', 
    backgroundColor: "#EFF6FF", 
    paddingVertical: 12, 
    borderRadius: 14, 
    gap: 6 
  },
  deleteBtn: { 
    width: 50, 
    alignItems: "center", 
    justifyContent: 'center', 
    backgroundColor: "#FEF2F2", 
    borderRadius: 14 
  },
  notMetActionRow: {
  flexDirection: "row",
  gap: 10,
},

smallRecordBtn: {
  flexDirection: "row",
  backgroundColor: "#7C3AED",
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
},

smallRecordText: {
  fontWeight: "800",
  color: "#fff",
},

  editText: { color: "#1E4DB3", fontWeight: "800" },
  convertBtn: { 
    flexDirection: "row", 
    backgroundColor: "#059669", 
    padding: 14, 
    borderRadius: 16, 
    alignItems: "center", 
    justifyContent: 'center', 
    gap: 8 
  },
  convertText: { fontWeight: "800", color: "#fff" },
  recordBtn: { 
    flexDirection: "row", 
    backgroundColor: "#7C3AED", 
    padding: 14, 
    borderRadius: 16, 
    alignItems: "center", 
    justifyContent: 'center', 
    gap: 8 
  },
  recordText: { fontWeight: "800", color: "#fff" },
  emptyWrap: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 60 
  },
  emptyIconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#E2E8F0', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  empty: { color: "#94A3B8", fontWeight: '700', fontSize: 16 },
  emptySubtext: { color: "#CBD5E1", fontWeight: '500', fontSize: 12, marginTop: 4 },
});