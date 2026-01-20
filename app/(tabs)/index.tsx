import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, ProgressChart } from "react-native-chart-kit";
import aiApi from "../hooks/aiApi";

const bgImage = require("../../assets/images/bg.png");
const screenWidth = Dimensions.get("window").width;

type MetricType = "meetings" | "revenue";
type PeriodType = "monthly" | "quarterly" | "yearly";

export default function DashboardScreen() {
  const router = useRouter();

  const [metric, setMetric] = useState<MetricType>("meetings");
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  const [userName, setUserName] = useState("");
  const [splitData, setSplitData] = useState<any>(null);
  const [targetData, setTargetData] = useState<any>(null);

  const [activeSplitTab, setActiveSplitTab] = useState<PeriodType>("yearly");
  const [activeTargetTab, setActiveTargetTab] = useState<PeriodType>("yearly");

  // Location & Time states
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [address, setAddress] = useState("Loading location...");
  const [locationLoading, setLocationLoading] = useState(true);

  /* ------------------ TIME & DATE ------------------ */
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Format time: 10:30 AM
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      setCurrentTime(`${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`);
      
      // Format date: Monday, Jan 20
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setCurrentDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ------------------ LOCATION ------------------ */
  useEffect(() => {
    (async () => {
      try {
        setLocationLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== "granted") {
          setAddress("Location permission not granted");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (geo.length > 0) {
          const g = geo[0];
          const shortAddr = [g.city, g.region, g.country]
            .filter(Boolean)
            .join(", ");
          setAddress(shortAddr || "Location unavailable");
        }
      } catch (err) {
        setAddress("Unable to fetch location");
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  /* ------------------ LOAD USER ------------------ */
  useEffect(() => {
    const loadUser = async () => {
      const name = await AsyncStorage.getItem("username");
      setUserName(name || "User");
    };
    loadUser();
  }, []);

  /* ------------------ LOAD DASHBOARD ------------------ */
  const loadDashboardData = useCallback(async () => {
    try {
      setStatsLoading(true);
      const userId = await AsyncStorage.getItem("crmUserId");
      const uid = userId?.toUpperCase();

      const [splitRes, targetRes] = await Promise.all([
        aiApi.get("crm_data/meetings_split", {
          params: { user_id: uid },
        }),
        aiApi.get(`crm_data/target_status/${metric}`, {
          params: { user_id: uid },
        }),
      ]);

      setSplitData(splitRes.data);
      setTargetData(targetRes.data);
    } catch (e) {
      console.error("Dashboard Error:", e);
    } finally {
      setStatsLoading(false);
      setLoading(false);
    }
  }, [metric]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /* ------------------ TARGET HELPERS ------------------ */
  const getTargetObject = () => {
    if (!targetData) return { current: 0, target: 1 };

    if (activeTargetTab === "yearly") {
      return targetData.yearly;
    }
    return targetData[activeTargetTab]["1"];
  };

  const getTargetProgress = () => {
    const { current, target } = getTargetObject();
    const percent = current / (target || 1);

    return {
      data: [percent > 1 ? 1 : percent],
      actualPercent: Math.round(percent * 100),
      current: current.toLocaleString(),
      target: target.toLocaleString(),
    };
  };

  const getTargetBarData = () => {
    const { current, target } = getTargetObject();
    return {
      labels: ["Current", "Target"],
      datasets: [{ data: [current || 0, target || 0] }],
    };
  };

  /* ------------------ MEETING SPLIT ------------------ */
  const getMeetingSplitData = () => {
    if (!splitData) {
      return { labels: [], datasets: [{ data: [] }] };
    }

    const d =
      activeSplitTab === "yearly"
        ? splitData.yearly
        : splitData[activeSplitTab]["1"];

    return {
      labels: ["Direct", "Phone", "Business"],
      datasets: [
        {
          data: [
            d?.["Direct Meetings"] || 0,
            d?.["Phone Calls"] || 0,
            d?.["Business Meetings"] || 0,
          ],
        },
      ],
    };
  };

  /* ------------------ UI ------------------ */
  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={bgImage} style={styles.bg}>
        <View style={styles.overlay} />

        <ScrollView 
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* TIME & LOCATION HEADER */}
          <View style={styles.topBar}>
            <View style={styles.timeSection}>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={20} color="#3B82F6" />
                <Text style={styles.timeText}>{currentTime}</Text>
              </View>
              <Text style={styles.dateText}>{currentDate}</Text>
            </View>
            
            <View style={styles.locationSection}>
              <Ionicons name="location" size={18} color="#10B981" />
              <View style={styles.locationTextContainer}>
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <Text style={styles.locationText} numberOfLines={2}>{address}</Text>
                )}
              </View>
            </View>
          </View>

          {/* ENHANCED PROFILE HEADER */}
          <View style={styles.headerSection}>
            <View style={styles.profileCard}>
              <View style={styles.leftSection}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={['#3B82F6', '#1D4ED8']}
                    style={styles.avatarGradient}
                  >
                    <Ionicons name="person" size={28} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.welcomeText}>Welcome back 👋</Text>
                  <Text style={styles.nameText}>{userName}</Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
              </View>
             <TouchableOpacity
  onPress={async () => {
    try {
      await AsyncStorage.clear(); 
      // OR clear specific keys only (recommended):
      // await AsyncStorage.multiRemove(["username", "crmUserId", "token"]);

      router.replace("/(auth)/login");
    } catch (e) {
      console.error("Logout error:", e);
    }
  }}
  style={styles.logoutBtn}
>
  <Ionicons name="log-out-outline" size={22} color="#EF4444" />
</TouchableOpacity>
            </View>
          </View>

          {/* ENHANCED METRIC TOGGLE */}
          <View style={styles.metricSection}>
            <View style={styles.toggleContainer}>
              {(["meetings", "revenue"] as MetricType[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMetric(m)}
                  style={[
                    styles.toggleButton,
                    metric === m && styles.activeToggleButton,
                  ]}
                >
                  <Ionicons 
                    name={m === "meetings" ? "people" : "cash"} 
                    size={20} 
                    color={metric === m ? "#fff" : "#64748B"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.toggleLabel,
                      metric === m && styles.activeToggleLabel,
                    ]}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {statsLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loaderText}>Loading dashboard...</Text>
            </View>
          ) : (
            <>
              {/* ENHANCED TARGET CARD */}
              <View style={styles.cardContainer}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <LinearGradient
                        colors={metric === "meetings" ? ['#3B82F6', '#2563EB'] : ['#F59E0B', '#D97706']}
                        style={styles.iconBadge}
                      >
                        <Ionicons 
                          name={metric === "meetings" ? "calendar" : "trending-up"} 
                          size={20} 
                          color="#fff" 
                        />
                      </LinearGradient>
                      <Text style={styles.cardTitle}>
                        {metric === "meetings" ? "Meeting Target" : "Revenue Target"}
                      </Text>
                    </View>
                    <View style={styles.periodTabs}>
                      {["M", "Q", "Y"].map((l, i) => (
                        <TouchableOpacity
                          key={l}
                          onPress={() =>
                            setActiveTargetTab(
                              i === 0 ? "monthly" : i === 1 ? "quarterly" : "yearly"
                            )
                          }
                          style={[
                            styles.periodTab,
                            activeTargetTab.startsWith(l.toLowerCase()) &&
                              styles.activePeriodTab,
                          ]}
                        >
                          <Text
                            style={[
                              styles.periodTabText,
                              activeTargetTab.startsWith(l.toLowerCase()) &&
                                styles.activePeriodTabText,
                            ]}
                          >
                            {l}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* PROGRESS SECTION */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressChartContainer}>
                      <ProgressChart
                        data={{ data: getTargetProgress().data }}
                        width={140}
                        height={140}
                        strokeWidth={14}
                        radius={50}
                        hideLegend
                        chartConfig={{
                          backgroundGradientFrom: "#fff",
                          backgroundGradientTo: "#fff",
                          color: (o = 1) =>
                            metric === "meetings"
                              ? `rgba(16,185,129,${o})`
                              : `rgba(245,158,11,${o})`,
                        }}
                      />
                      <View style={styles.progressCenter}>
                        <Text style={styles.progressPercent}>
                          {getTargetProgress().actualPercent}%
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.statsColumn}>
                      <LinearGradient
                        colors={['#EFF6FF', '#DBEAFE']}
                        style={styles.statBox}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                        <Text style={styles.statLabel}>Current</Text>
                        <Text style={styles.statValue}>
                          {getTargetProgress().current}
                        </Text>
                      </LinearGradient>
                      
                      <LinearGradient
                        colors={['#FEF3C7', '#FDE68A']}
                        style={styles.statBox}
                      >
                        <Ionicons name="flag" size={16} color="#F59E0B" />
                        <Text style={styles.statLabel}>Target</Text>
                        <Text style={styles.statValue}>
                          {getTargetProgress().target}
                        </Text>
                      </LinearGradient>
                      
                      <View style={[
                        styles.achievementBadge,
                        { backgroundColor: getTargetProgress().actualPercent >= 100 ? '#D1FAE5' : '#FEF3C7' }
                      ]}>
                        <Ionicons 
                          name={getTargetProgress().actualPercent >= 100 ? "trophy" : "rocket"} 
                          size={14} 
                          color={getTargetProgress().actualPercent >= 100 ? "#10B981" : "#F59E0B"}
                        />
                        <Text style={[
                          styles.achievementText,
                          { color: getTargetProgress().actualPercent >= 100 ? '#059669' : '#D97706' }
                        ]}>
                          {getTargetProgress().actualPercent >= 100 ? "Achieved!" : "Keep Going!"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* BAR CHART */}
                  <View style={styles.chartWrapper}>
                    <BarChart
                      data={getTargetBarData()}
                      width={screenWidth - 64}
                      height={200}
                      fromZero
                      showValuesOnTopOfBars
                      yAxisLabel=""
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundGradientFrom: "#F8FAFC",
                        backgroundGradientTo: "#F8FAFC",
                        color: () => "#3B82F6",
                        labelColor: () => "#64748B",
                        barPercentage: 0.6,
                      }}
                      style={styles.barChart}
                    />
                  </View>
                </LinearGradient>
              </View>

              {/* ENHANCED MEETING SPLIT */}
              <View style={styles.cardContainer}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <LinearGradient
                        colors={['#8B5CF6', '#7C3AED']}
                        style={styles.iconBadge}
                      >
                        <Ionicons name="pie-chart" size={20} color="#fff" />
                      </LinearGradient>
                      <Text style={styles.cardTitle}>Meeting Split</Text>
                    </View>
                    <View style={styles.periodTabs}>
                      {["M", "Q", "Y"].map((l, i) => (
                        <TouchableOpacity
                          key={l}
                          onPress={() =>
                            setActiveSplitTab(
                              i === 0 ? "monthly" : i === 1 ? "quarterly" : "yearly"
                            )
                          }
                          style={[
                            styles.periodTab,
                            activeSplitTab.startsWith(l.toLowerCase()) &&
                              styles.activePeriodTab,
                          ]}
                        >
                          <Text
                            style={[
                              styles.periodTabText,
                              activeSplitTab.startsWith(l.toLowerCase()) &&
                                styles.activePeriodTabText,
                            ]}
                          >
                            {l}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* MEETING TYPE LEGEND */}
                  <View style={styles.legendContainer}>
                    {[
                      { label: "Direct", icon: "person", colors: ['#DBEAFE', '#BFDBFE'] },
                      { label: "Phone", icon: "call", colors: ['#EDE9FE', '#DDD6FE'] },
                      { label: "Business", icon: "briefcase", colors: ['#D1FAE5', '#A7F3D0'] },
                    ].map((item, idx) => (
                      <LinearGradient
                        key={idx}
                        colors={item.colors}
                        style={styles.legendItem}
                      >
                        <Ionicons name={item.icon as any} size={14} color="#475569" />
                        <Text style={styles.legendText}>{item.label}</Text>
                      </LinearGradient>
                    ))}
                  </View>

                  <View style={styles.chartWrapper}>
                    <BarChart
                      data={getMeetingSplitData()}
                      width={screenWidth - 64}
                      height={220}
                      fromZero
                      showValuesOnTopOfBars
                      yAxisLabel=""
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundGradientFrom: "#F8FAFC",
                        backgroundGradientTo: "#F8FAFC",
                        color: (opacity = 1, index = 0) => {
                          const colors = ['#3B82F6', '#8B5CF6', '#10B981'];
                          return colors[index % 3];
                        },
                        labelColor: () => "#64748B",
                        barPercentage: 0.7,
                      }}
                      style={styles.barChart}
                    />
                  </View>
                </LinearGradient>
              </View>
            </>
          )}
        </ScrollView>

         <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push("/VisitingCardScanner")}
      >
        <Ionicons name="scan-circle" size={30} color="#F5F7FA" />
        <Text style={styles.fabLabel}>Scan VCard</Text>
      </TouchableOpacity>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F172A" },
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.7)",
  },

  /* TOP BAR */
  topBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  timeSection: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#38A169",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  fabLabel: {
    color: "#F5F7FA",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  timeText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginLeft: 6,
  },
  dateText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginLeft: 26,
  },
  locationSection: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 11,
    color: "#0F172A",
    fontWeight: "600",
    lineHeight: 14,
  },

  /* HEADER */
  headerSection: { padding: 16, paddingTop: 8, paddingBottom: 0 },
  profileCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  leftSection: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarContainer: { marginRight: 14 },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: { flex: 1 },
  welcomeText: { fontSize: 13, color: "#64748B", marginBottom: 2 },
  nameText: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 4,
  },
  statusText: { fontSize: 11, color: "#059669", fontWeight: "600" },
  logoutBtn: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
  },

  /* METRIC TOGGLE */
  metricSection: { padding: 16, paddingTop: 16 },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  activeToggleButton: {
    backgroundColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleLabel: { fontSize: 14, fontWeight: "700", color: "#94A3B8" },
  activeToggleLabel: { color: "#fff" },

  /* CARDS */
  cardContainer: { paddingHorizontal: 16, marginBottom: 16 },
  card: {
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center" },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },

  /* PERIOD TABS */
  periodTabs: { flexDirection: "row", gap: 6 },
  periodTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  activePeriodTab: { backgroundColor: "#3B82F6" },
  periodTabText: { fontSize: 11, fontWeight: "700", color: "#64748B" },
  activePeriodTabText: { color: "#fff" },

  /* PROGRESS SECTION */
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 20,
  },
  progressChartContainer: { position: "relative" },
  progressCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercent: { fontSize: 26, fontWeight: "900", color: "#0F172A" },
  statsColumn: { flex: 1, gap: 10 },
  statBox: {
    padding: 12,
    borderRadius: 12,
    gap: 2,
  },
  statLabel: { fontSize: 10, color: "#64748B", fontWeight: "600" },
  statValue: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  achievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    gap: 4,
  },
  achievementText: { fontSize: 11, fontWeight: "700" },

  /* CHARTS */
  chartWrapper: { marginTop: 10 },
  barChart: { borderRadius: 16 },

  /* LEGEND */
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  legendText: { fontSize: 11, color: "#475569", fontWeight: "600" },

  /* LOADER */
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loaderText: { marginTop: 12, fontSize: 14, color: "#94A3B8", fontWeight: "600" },
});