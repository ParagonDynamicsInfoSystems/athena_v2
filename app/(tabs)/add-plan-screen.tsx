import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import aiApi from "../hooks/aiApi";

/* ================= BACKGROUND ================= */
const BG_IMAGE = require("../../assets/images/bg.png");

/* ================= PLAN MODES ================= */
const PLAN_MODES = [
  { label: "Online", value: 1 },
  { label: "Direct Meet", value: 2 },
  { label: "Phone", value: 3 },
  { label: "Business Courtesy", value: 4 },
  { label: "Business Entertainment", value: 5 },
];

/* ================= HELPERS ================= */
const pad = (n: number) => String(n).padStart(2, "0");

const formatDate = (d: Date) =>
  `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

const formatTime = (d: Date) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/* ✅ FULL DATETIME (REQUIRED BY BACKEND) */
const formatDateTime = (date: Date, time: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(time.getHours())}:${pad(time.getMinutes())}:00`;

const parseDDMMYYYY = (s?: string) => {
  if (!s) return null;
  
  // Handle DD-MM-YYYY format
  const dashParts = s.split("-");
  if (dashParts.length === 3) {
    const [first, second, third] = dashParts.map(Number);
    
    // Try DD-MM-YYYY
    if (first <= 31 && second <= 12 && third > 1900) {
      const d = new Date(third, second - 1, first);
      if (!Number.isNaN(d.getTime())) return d;
    }
    
    // Try YYYY-MM-DD
    if (first > 1900 && second <= 12 && third <= 31) {
      const d = new Date(first, second - 1, third);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  
  // Try parsing as ISO string
  const isoDate = new Date(s);
  if (!Number.isNaN(isoDate.getTime())) return isoDate;
  
  return null;
};

const parseHHMMSS = (s?: string) => {
  if (!s) return null;
  
  // Remove any date part if present (e.g., "2026-01-23 10:30:00")
  const timePart = s.includes(" ") ? s.split(" ")[1] : s;
  
  const [hh, mm] = timePart.split(":").map(Number);
  if (hh === undefined || mm === undefined || hh > 23 || mm > 59) return null;
  
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
};

const normalizePlanMode = (pm: any): number | null => {
  if (pm === null || pm === undefined || pm === "") return null;
  const n = Number(pm);
  return PLAN_MODES.some(p => p.value === n) ? n : null;
};

export default function AddPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const didPrefill = useRef<string>("");

  /* ================= EDIT MODE ================= */
  const prePlanId =
    typeof params.pre_plan_id === "string" && params.pre_plan_id.trim() !== ""
      ? params.pre_plan_id
      : undefined;
  const isEdit = !!prePlanId;

  // Create a unique key for this navigation to detect when params change
  const paramsKey = `${prePlanId || "new"}-${params.meeting ? "has-meeting" : "no-meeting"}-${params.date || "no-date"}`;

  /* ================= STATE ================= */
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<
    { id: string; name: string }[]
  >([]);

  const [customerName, setCustomerName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [activity, setActivity] = useState("");
  const [planMode, setPlanMode] = useState<number | null>(null);

  const [dateObj, setDateObj] = useState(new Date());
  const [fromTime, setFromTime] = useState(() => {
    const now = new Date();
    now.setHours(9, 0, 0, 0); // Default 9:00 AM
    return now;
  });
  const [toTime, setToTime] = useState(() => {
    const now = new Date();
    now.setHours(10, 0, 0, 0); // Default 10:00 AM
    return now;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);

  const [loading, setLoading] = useState(false);

  // Updated validation: require customer selection and plan mode
  const canSubmit = !!selectedCustomerId && planMode !== null;

  /* ================= LOAD CUSTOMERS ================= */
  useEffect(() => {
    (async () => {
      try {
        const userId = await AsyncStorage.getItem("crmUserId");
        if (!userId) return;

        const res = await aiApi.get("/crm_data/customers", {
          params: { user_id: userId.toUpperCase() },
        });

        const list =
          res.data?.customers_interacted
            ?.filter((c: any) => c.customer_id && c.cust_name) // Filter out null/undefined entries
            ?.map((c: any) => ({
              id: String(c.customer_id || ""),
              name: String(c.cust_name || ""),
            })) || [];

        setCustomers(list);
        setFilteredCustomers(list);
      } catch (error) {
        console.error("Failed to load customers:", error);
      }
    })();
  }, []);

  /* ================= PREFILL ================= */
  useEffect(() => {
    // Only prefill if params have changed (new navigation)
    if (didPrefill.current === paramsKey) return;
    didPrefill.current = paramsKey;

    console.log("Prefilling with params:", params);

    // Parse meeting JSON if provided (from calendar edit button)
    let meetingData: any = null;
    if (typeof params.meeting === "string" && params.meeting) {
      try {
        meetingData = JSON.parse(params.meeting);
        console.log("Parsed meeting data:", meetingData);
      } catch (e) {
        console.error("Failed to parse meeting JSON", e);
      }
    }

    // Prefer meeting data over individual params
    if (meetingData) {
      console.log("Prefilling from meeting data");
      
      // Customer - try multiple field names
      if (meetingData.customer) {
        setCustomerName(String(meetingData.customer));
      } else if (meetingData.customer_name) {
        setCustomerName(String(meetingData.customer_name));
      }
      if (meetingData.customer_id) {
        setSelectedCustomerId(String(meetingData.customer_id));
      }

      // Activity
      if (meetingData.activity) {
        setActivity(String(meetingData.activity));
      }

      // Date - try multiple sources
      let dateSet = false;
      if (meetingData.date) {
        const d = parseDDMMYYYY(String(meetingData.date));
        if (d) {
          setDateObj(d);
          dateSet = true;
          console.log("Set date from meeting.date:", d);
        }
      }
      if (!dateSet && params.date) {
        const d = parseDDMMYYYY(params.date as string);
        if (d) {
          setDateObj(d);
          console.log("Set date from params.date:", d);
        }
      }

      // Times - handle both from_time/to_time and plan_time
      if (meetingData.from_time) {
        const ft = parseHHMMSS(String(meetingData.from_time));
        if (ft) {
          setFromTime(ft);
          console.log("Set from_time:", ft);
        }
      } else if (meetingData.plan_time) {
        const ft = parseHHMMSS(String(meetingData.plan_time));
        if (ft) {
          setFromTime(ft);
          console.log("Set from_time from plan_time:", ft);
        }
      }

      if (meetingData.to_time) {
        const tt = parseHHMMSS(String(meetingData.to_time));
        if (tt) {
          setToTime(tt);
          console.log("Set to_time:", tt);
        }
      } else if (meetingData.plan_time) {
        // Use plan_time + 1 hour for to_time if not available
        const ft = parseHHMMSS(String(meetingData.plan_time));
        if (ft) {
          const tt = new Date(ft);
          tt.setHours(tt.getHours() + 1);
          setToTime(tt);
          console.log("Set to_time (plan_time + 1h):", tt);
        }
      }

      // Plan Mode
      if (meetingData.plan_mode !== undefined && meetingData.plan_mode !== null) {
        const normalized = normalizePlanMode(meetingData.plan_mode);
        setPlanMode(normalized);
        console.log("Set plan_mode:", normalized);
      }
    } else {
      // Fallback to individual params if no meeting JSON
      console.log("Prefilling from individual params");
      
      if (params.customer_name) {
        setCustomerName(String(params.customer_name));
      }
      if (params.customer_id) {
        setSelectedCustomerId(String(params.customer_id));
      }
      if (params.activity) {
        setActivity(String(params.activity));
      }

      const d = parseDDMMYYYY(params.date as string);
      if (d) {
        setDateObj(d);
        console.log("Set date from params:", d);
      }

      const ft = parseHHMMSS(params.from_time as string);
      if (ft) setFromTime(ft);

      const tt = parseHHMMSS(params.to_time as string);
      if (tt) setToTime(tt);

      if (params.plan_mode !== undefined) {
        setPlanMode(normalizePlanMode(params.plan_mode));
      }
    }
  }, [paramsKey]);

  /* ================= CUSTOMER SEARCH ================= */
  const handleCustomerChange = (text: string) => {
    setCustomerName(text);
    if (isEdit) return;

    const searchText = text.toLowerCase();
    const filtered = customers.filter(
      c =>
        (c.name && c.name.toLowerCase().includes(searchText)) ||
        (c.id && c.id.toLowerCase().includes(searchText))
    );

    setFilteredCustomers(filtered);
    setShowCustomerDropdown(filtered.length > 0);
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!canSubmit) {
      Alert.alert("Validation Error", "Please select a customer and plan mode");
      return;
    }

    // Validate time range
    if (toTime <= fromTime) {
      Alert.alert("Validation Error", "End time must be after start time");
      return;
    }

    try {
      setLoading(true);

      const userId =
        (typeof params.user_id === "string" && params.user_id) ||
        (await AsyncStorage.getItem("crmUserId"));

      if (!userId) {
        Alert.alert("Error", "User session expired");
        return;
      }

      if (isEdit && prePlanId) {
        /* 🔒 EDIT API */
        await aiApi.put("/calendar/edit-meeting", null, {
          params: {
            pre_plan_id: prePlanId,
            user_id: userId.toUpperCase(),
            customer_id: selectedCustomerId,
            customer_name: customerName,
            activity: activity || undefined,
            date: formatDate(dateObj),
            plan_mode: planMode,
            from_time: formatDateTime(dateObj, fromTime),
            to_time: formatDateTime(dateObj, toTime),
          },
        });
        Alert.alert("✅ Success", "Meeting updated successfully");
        router.back();
      } else {
        /* ➕ ADD API */
        await aiApi.post("/calendar/add-meeting", null, {
          params: {
            user_id: userId.toUpperCase(),
            customer_id: selectedCustomerId,
            activity: activity || undefined,
            date: formatDate(dateObj),
            plan_mode: planMode,
            from_time: formatDateTime(dateObj, fromTime),
            to_time: formatDateTime(dateObj, toTime),
          },
        });
        Alert.alert("✅ Success", "Meeting added successfully");

        // Clear all fields after successful add
        setCustomerName("");
        setSelectedCustomerId(null);
        setActivity("");
        setPlanMode(null);
        setDateObj(new Date());
        const defaultFrom = new Date();
        defaultFrom.setHours(9, 0, 0, 0);
        setFromTime(defaultFrom);
        const defaultTo = new Date();
        defaultTo.setHours(10, 0, 0, 0);
        setToTime(defaultTo);
        setShowCustomerDropdown(false);
        setShowPlanDropdown(false);
        
        // Navigate back to calendar
        router.replace("/(tabs)/calendar");
      }
    } catch (e: any) {
      console.error("Save error:", e);
      Alert.alert("Error", e?.response?.data?.message || e?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <ImageBackground source={BG_IMAGE} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#051539" />
              </Pressable>
              <Text style={styles.headerTitle}>
                {isEdit ? "Edit Plan" : "Add plan"}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.card}>
              {/* CUSTOMER */}
              <Text style={styles.label}>
                Customer <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  value={customerName}
                  editable={!isEdit}
                  placeholder="Search customer by name or ID"
                  placeholderTextColor="#94A3B8"
                  onChangeText={handleCustomerChange}
                  onFocus={() => !isEdit && setShowCustomerDropdown(true)}
                />
                {selectedCustomerId && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.checkIcon} />
                )}
              </View>

              {!isEdit &&
                showCustomerDropdown &&
                filteredCustomers.length > 0 && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {filteredCustomers.slice(0, 5).map(c => (
                        <Pressable
                          key={c.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setCustomerName(c.name);
                            setSelectedCustomerId(c.id);
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <Text style={styles.customerName}>{c.name}</Text>
                          <Text style={styles.customerId}>ID: {c.id}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

              {/* ACTIVITY */}
              <Text style={styles.label}>Activity</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="clipboard-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  value={activity}
                  editable={!isEdit}
                  placeholder="Enter activity description"
                  placeholderTextColor="#94A3B8"
                  onChangeText={setActivity}
                />
              </View>

              {/* DATE */}
              <Text style={styles.label}>
                Date <Text style={styles.required}>*</Text>
              </Text>
              <Pressable
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <View style={[styles.input, styles.inputWithIcon]}>
                  <Text style={styles.inputText}>{formatDate(dateObj)}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748B" style={styles.chevronIcon} />
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={dateObj}
                  mode="date"
                  onChange={(_, d) => {
                    setShowDatePicker(false);
                    if (d) setDateObj(d);
                  }}
                />
              )}

              {/* FROM TIME */}
              <Text style={styles.label}>
                From Time <Text style={styles.required}>*</Text>
              </Text>
              <Pressable
                style={styles.inputContainer}
                onPress={() => setShowFromPicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <View style={[styles.input, styles.inputWithIcon]}>
                  <Text style={styles.inputText}>{formatTime(fromTime)}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748B" style={styles.chevronIcon} />
              </Pressable>

              {showFromPicker && (
                <DateTimePicker
                  value={fromTime}
                  mode="time"
                  onChange={(_, d) => {
                    setShowFromPicker(false);
                    if (d) setFromTime(d);
                  }}
                />
              )}

              {/* TO TIME */}
              <Text style={styles.label}>
                To Time <Text style={styles.required}>*</Text>
              </Text>
              <Pressable
                style={styles.inputContainer}
                onPress={() => setShowToPicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <View style={[styles.input, styles.inputWithIcon]}>
                  <Text style={styles.inputText}>{formatTime(toTime)}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748B" style={styles.chevronIcon} />
              </Pressable>

              {showToPicker && (
                <DateTimePicker
                  value={toTime}
                  mode="time"
                  onChange={(_, d) => {
                    setShowToPicker(false);
                    if (d) setToTime(d);
                  }}
                />
              )}

              {/* PLAN MODE */}
              <Text style={styles.label}>
                Plan Mode <Text style={styles.required}>*</Text>
              </Text>
              <Pressable
                style={styles.inputContainer}
                onPress={() => setShowPlanDropdown(!showPlanDropdown)}
              >
                <Ionicons name="options-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <View style={[styles.input, styles.inputWithIcon]}>
                  <Text style={[styles.inputText, !planMode && styles.placeholderText]}>
                    {PLAN_MODES.find(p => p.value === planMode)?.label || "Select plan mode"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748B" style={styles.chevronIcon} />
              </Pressable>

              {showPlanDropdown && (
                <View style={styles.dropdownContainer}>
                  {PLAN_MODES.map(m => (
                    <Pressable
                      key={m.value}
                      style={[
                        styles.dropdownItem,
                        planMode === m.value && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setPlanMode(m.value);
                        setShowPlanDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        planMode === m.value && styles.dropdownItemTextSelected
                      ]}>
                        {m.label}
                      </Text>
                      {planMode === m.value && (
                        <Ionicons name="checkmark" size={20} color="#1E4DB3" />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {/* SAVE */}
              <Pressable
                style={[
                  styles.saveBtn,
                  (!canSubmit || loading) && styles.saveBtnDisabled,
                ]}
                disabled={!canSubmit || loading}
                onPress={handleSave}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={isEdit ? "checkmark-circle-outline" : "add-circle-outline"} size={22} color="#fff" />
                    <Text style={styles.saveText}>
                      {isEdit ? "Update Meeting" : "Add Meeting"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    elevation: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#051539",
  },
  card: { 
    backgroundColor: "#fff", 
    borderRadius: 24, 
    padding: 20,
    elevation: 3,
  },
  label: { 
    marginTop: 16, 
    marginBottom: 8, 
    color: "#1E293B",
    fontWeight: "700",
    fontSize: 14,
  },
  required: {
    color: "#EF4444",
    fontWeight: "900",
  },
  inputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    height: 50,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    flex: 1,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    zIndex: 1,
  },
  checkIcon: {
    position: "absolute",
    right: 14,
  },
  chevronIcon: {
    position: "absolute",
    right: 14,
  },
  inputText: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "600",
  },
  placeholderText: {
    color: "#94A3B8",
    fontWeight: "400",
  },
  dropdownContainer: {
    marginTop: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    maxHeight: 200,
    overflow: "hidden",
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownItemSelected: {
    backgroundColor: "#EFF6FF",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
  },
  dropdownItemTextSelected: {
    color: "#1E4DB3",
    fontWeight: "700",
  },
  customerName: { 
    fontWeight: "700",
    color: "#1E293B",
    fontSize: 15,
  },
  customerId: { 
    fontSize: 12, 
    color: "#64748B",
    marginTop: 2,
  },
  saveBtn: {
    marginTop: 28,
    backgroundColor: "#1E4DB3",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.5,
    elevation: 0,
  },
  saveText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 16,
  },
});