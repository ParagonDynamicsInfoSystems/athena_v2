import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

/* ================= CONSTANT OPTIONS ================= */
const SERVICE_TYPES = [
  { label: "Import", value: "import" },
  { label: "Export", value: "export" },
];

const TRANSPORT_MODES = [
  { label: "Sea", value: "sea" },
  { label: "Air", value: "air" },
];

const DIVISIONS = [
  { label: "CHA", value: "cha" },
  { label: "CDL", value: "cdl" },
  { label: "3PL", value: "3pl" },
  { label: "Project Cargo", value: "project_cargo" },
  { label: "TPTR", value: "tptr" },
  { label: "FFW", value: "ffw" },
  { label: "Lines", value: "lines" },
  { label: "Container Sales", value: "container_sales" },
];

const PLAN_MODES = [
  { label: "Online", value: 1 },
  { label: "Direct Meet", value: 2 },
  { label: "Phone", value: 3 },
  { label: "Business Courtesy", value: 4 },
  { label: "Business Entertainment", value: 5 },
];

/* ================= HELPERS ================= */
const pad = (n: number) => String(n).padStart(2, "0");
const formatDDMMYYYY = (d: Date) =>
  `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

/* ================= COMPONENT ================= */
export default function AddMeetingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  /* ================= PARAMS FROM CALENDAR ================= */
  const prePlanId = typeof params.pre_plan_id === "string" && params.pre_plan_id.trim() !== "" 
    ? params.pre_plan_id 
    : "";
  const customerId = typeof params.customer_id === "string" ? params.customer_id : "";
  const customerName = typeof params.customer === "string" ? params.customer : "";

  /* ================= STATES ================= */
  const [customers, setCustomers] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [customerText, setCustomerText] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [locationLoading, setLocationLoading] = useState(true);

  const [contactPerson, setContactPerson] = useState("");
  const [division, setDivision] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<"import" | "export" | null>(null);
  const [transportMode, setTransportMode] = useState<"sea" | "air" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [nextCallDate, setNextCallDate] = useState<Date | null>(null);

  const [activity, setActivity] = useState("");
  const [cntryId, setCntryId] = useState(""); // Location Name
  const [mode, setMode] = useState<number | null>(null);

  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showTransportDropdown, setShowTransportDropdown] = useState(false);
  const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= RESET ON FRESH DIRECT ADD ================= */
  useFocusEffect(
    useCallback(() => {
      if (!params.pre_plan_id && !params.meeting) {
        setCustomerText("");
        setSelectedCustomerId(null);
        setCustomerEmail("");
        setContactPerson("");
        setDivision(null);
        setServiceType(null);
        setTransportMode(null);
        setRemarks("");
        setNextCallDate(null);
        setActivity("");
        setCntryId("");
        setMode(null);
        setShowCustomerDropdown(false);
      }
    }, [params.pre_plan_id, params.meeting])
  );

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
            ?.filter((c: any) => c.customer_id && c.cust_name) // Filter out null entries
            ?.map((c: any) => ({
              id: String(c.customer_id || ""),
              name: String(c.cust_name || ""),
              email: c.email_id || "",
            })) || [];

        setCustomers(list);
        setFilteredCustomers(list);
      } catch (error) {
        console.error("Failed to load customers:", error);
      }
    })();
  }, []);

  /* ================= PRE-FILL FROM CALENDAR DATA ================= */
  useEffect(() => {
    if (customerText === "") {
      let meetingData: any = null;
      try {
        if (params.meeting && typeof params.meeting === "string") {
          meetingData = JSON.parse(params.meeting);
        }
      } catch (err) {
        console.error("Failed to parse meeting data:", err);
      }

      if (meetingData) {
        if (meetingData.customer) setCustomerText(String(meetingData.customer));
        if (meetingData.customer_id) setSelectedCustomerId(String(meetingData.customer_id));
        if (meetingData.remarks) setRemarks(String(meetingData.remarks));
        if (meetingData.activity) setActivity(String(meetingData.activity));
      } else if (customerId && customerName) {
        setCustomerText(customerName);
        setSelectedCustomerId(customerId);
      }
    }
  }, [params.meeting, customerId, customerName, customerText]);

  /* ================= AUTO LOCATION & PATCH CITY ================= */
  useEffect(() => {
    (async () => {
      try {
        setLocationLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationLoading(false);
          Alert.alert("Permission Denied", "Location permission is required for this feature");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = loc.coords;
        setLatitude(latitude);
        setLongitude(longitude);

        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (geo.length > 0) {
          const g = geo[0];
          const addr = [g.name, g.street, g.city, g.region, g.postalCode, g.country]
            .filter(Boolean)
            .join(", ");
          setAddress(addr);
          
          // Automatically patch City/Location name
          if (g.city) {
            setCntryId(g.city);
          } else if (g.region) {
            setCntryId(g.region);
          }
        }
      } catch (error) {
        console.error("Location error:", error);
        Alert.alert("Location Error", "Failed to get current location");
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  /* ================= CUSTOMER INPUT ================= */
  const handleCustomerChange = (text: string) => {
    setCustomerText(text);
    setSelectedCustomerId(null);

    if (text.trim().length > 0) {
      const searchText = text.toLowerCase();
      const filtered = customers.filter(
        c =>
          (c.name && c.name.toLowerCase().includes(searchText)) ||
          (c.id && c.id.toString().toLowerCase().includes(searchText))
      );
      setFilteredCustomers(filtered);
      setShowCustomerDropdown(filtered.length > 0);
    } else {
      setShowCustomerDropdown(false);
    }
  };

  const handleSelectCustomer = (c: any) => {
    setCustomerText(c.name);
    setSelectedCustomerId(c.id);
    setCustomerEmail(c.email || "");
    setShowCustomerDropdown(false);
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    // Customer validation
    if (!selectedCustomerId && (!customerText.trim() || !customerEmail.trim())) {
      Alert.alert("Validation Error", "Please select a customer or enter name & email");
      return false;
    }
    
    // Email validation if provided
    if (!selectedCustomerId && customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        Alert.alert("Validation Error", "Please enter a valid email address");
        return false;
      }
    }
    
    if (!serviceType) {
      Alert.alert("Validation Error", "Please select a service type");
      return false;
    }
    if (!transportMode) {
      Alert.alert("Validation Error", "Please select a transportation mode");
      return false;
    }
    if (!division) {
      Alert.alert("Validation Error", "Please select a division");
      return false;
    }
    if (!contactPerson.trim()) {
      Alert.alert("Validation Error", "Please enter contact person name");
      return false;
    }
    if (!remarks.trim()) {
      Alert.alert("Validation Error", "Please enter remarks");
      return false;
    }

    // Fields required only when NOT converting from pre-plan
    if (!prePlanId) {
      if (!activity.trim()) {
        Alert.alert("Validation Error", "Please enter activity");
        return false;
      }
      if (!cntryId.trim()) {
        Alert.alert("Validation Error", "Please enter location");
        return false;
      }
      if (mode === null) {
        Alert.alert("Validation Error", "Please select a mode");
        return false;
      }
    }

    return true;
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("crmUserId");
      if (!userId) {
        Alert.alert("Error", "User session expired");
        return;
      }

      const payload: any = {
        remarks,
        contact_person: contactPerson,
        transportation_mode: transportMode,
        service_type: serviceType,
        division,
      };

      if (address) payload.address = address;
      if (latitude !== null) payload.latitude = latitude;
      if (longitude !== null) payload.longitude = longitude;
      if (nextCallDate) payload.next_call_date = formatDDMMYYYY(nextCallDate);

      if (prePlanId) {
        // Converting from pre-plan
        payload.pre_plan_id = prePlanId;
      } else {
        // Fresh meeting entry
        payload.activity = activity;
        payload.cntry_id = cntryId;
        payload.mode = mode;

        if (selectedCustomerId) {
          payload.customer_id = parseInt(selectedCustomerId);
        } else {
          payload.customer_name = customerText.trim();
          payload.customer_email = customerEmail.trim();
        }
      }

      console.log("Posting meeting with payload:", payload);

      await aiApi.post("/calendar/post-meeting", payload, {
        params: { user_id: userId.toUpperCase() },
      });

      Alert.alert("✅ Success", "Meeting posted successfully");
      router.replace("/(tabs)/calendar");
    } catch (e: any) {
      console.error("Post meeting error:", e);
      Alert.alert("Error", e?.response?.data?.message || e?.message || "Failed to post meeting");
    } finally {
      setLoading(false);
    }
  };

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
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#051539" />
              </Pressable>
              <Text style={styles.headerTitle}>
                {prePlanId ? "Convert to Meeting" : "Add Meeting"}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.card}>
              {/* CUSTOMER */}
              <View style={{ zIndex: 10 }}>
                <Text style={styles.label}>
                  Customer <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input, 
                      styles.inputWithIcon,
                      prePlanId && selectedCustomerId && styles.inputDisabled
                    ]}
                    value={customerText}
                    placeholder="Search or enter customer name"
                    placeholderTextColor="#94A3B8"
                    onChangeText={handleCustomerChange}
                    onFocus={() => !prePlanId && customerText.length > 0 && setShowCustomerDropdown(true)}
                    editable={!(prePlanId && selectedCustomerId)}
                  />
                  {selectedCustomerId && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.checkIcon} />
                  )}
                </View>

                {showCustomerDropdown && !prePlanId && filteredCustomers.length > 0 && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {filteredCustomers.slice(0, 5).map(c => (
                        <Pressable 
                          key={c.id} 
                          style={styles.dropdownItem} 
                          onPress={() => handleSelectCustomer(c)}
                        >
                          <Text style={styles.customerName}>{c.name}</Text>
                          <Text style={styles.customerId}>ID: {c.id}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {!selectedCustomerId && !prePlanId && (
                <>
                  <Text style={styles.label}>
                    Customer Email <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.inputWithIcon]}
                      value={customerEmail}
                      onChangeText={setCustomerEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="Enter customer email"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </>
              )}

              {selectedCustomerId && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={16} color="#1E4DB3" />
                  <Text style={styles.infoText}>Customer ID: {selectedCustomerId}</Text>
                </View>
              )}
              
              {prePlanId && (
                <View style={styles.infoBox}>
                  <Ionicons name="calendar" size={16} color="#1E4DB3" />
                  <Text style={styles.infoText}>Converting Pre-Plan: {prePlanId}</Text>
                </View>
              )}

              {/* CONDITIONALLY MANDATORY FIELDS */}
              {!prePlanId && (
                <>
                  <Text style={styles.label}>
                    Activity <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="clipboard-outline" size={20} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.inputWithIcon]}
                      value={activity}
                      onChangeText={setActivity}
                      placeholder="Enter activity description"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <Text style={styles.label}>
                    Location <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={20} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.inputWithIcon]}
                      value={cntryId}
                      onChangeText={setCntryId}
                      placeholder={locationLoading ? "Fetching location..." : "Enter location"}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <Text style={styles.label}>
                    Mode <Text style={styles.required}>*</Text>
                  </Text>
                  <Pressable 
                    style={styles.inputContainer} 
                    onPress={() => setShowModeDropdown(!showModeDropdown)}
                  >
                    <Ionicons name="options-outline" size={20} color="#64748B" style={styles.inputIcon} />
                    <View style={[styles.input, styles.inputWithIcon]}>
                      <Text style={[styles.inputText, mode === null && styles.placeholderText]}>
                        {PLAN_MODES.find(m => m.value === mode)?.label || "Select mode"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#64748B" style={styles.chevronIcon} />
                  </Pressable>
                  
                  {showModeDropdown && (
                    <View style={styles.dropdownContainer}>
                      {PLAN_MODES.map(m => (
                        <Pressable 
                          key={m.value} 
                          style={[styles.dropdownItem, mode === m.value && styles.dropdownItemSelected]} 
                          onPress={() => { setMode(m.value); setShowModeDropdown(false); }}
                        >
                          <Text style={[styles.dropdownText, mode === m.value && styles.dropdownTextSelected]}>
                            {m.label}
                          </Text>
                          {mode === m.value && (
                            <Ionicons name="checkmark" size={20} color="#1E4DB3" />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* LOCATION PREVIEW */}
              <Text style={styles.label}>Address Details</Text>
              <View style={styles.readOnlyBox}>
                {locationLoading ? (
                  <View style={styles.locationLoadingContainer}>
                    <ActivityIndicator color="#1E4DB3" />
                    <Text style={styles.loadingText}>Fetching location...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.addressRow}>
                      <Ionicons name="location" size={16} color="#64748B" />
                      <Text style={styles.readOnlyText}>{address || "Location not available"}</Text>
                    </View>
                    {latitude && longitude && (
                      <Text style={styles.coords}>
                        Lat: {latitude.toFixed(6)} | Lng: {longitude.toFixed(6)}
                      </Text>
                    )}
                  </>
                )}
              </View>

              {/* SERVICE TYPE */}
              <Text style={styles.label}>
                Service Type <Text style={styles.required}>*</Text>
              </Text>
              <Pressable 
                style={styles.inputContainer} 
                onPress={() => setShowServiceDropdown(!showServiceDropdown)}
              >
                <Ionicons name="briefcase-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <View style={[styles.input, styles.inputWithIcon]}>
                  <Text style={[styles.inputText, !serviceType && styles.placeholderText]}>
                    {SERVICE_TYPES.find(s => s.value === serviceType)?.label || "Select service type"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748B" style={styles.chevronIcon} />
              </Pressable>
              
              {showServiceDropdown && (
                <View style={styles.dropdownContainer}>
                  {SERVICE_TYPES.map(s => (
                    <Pressable 
                      key={s.value} 
                      style={[styles.dropdownItem, serviceType === s.value && styles.dropdownItemSelected]} 
                      onPress={() => { setServiceType(s.value as any); setShowServiceDropdown(false); }}
                    >
                      <Text style={[styles.dropdownText, serviceType === s.value && styles.dropdownTextSelected]}>
                        {s.label}
                      </Text>
                      {serviceType === s.value && (
                        <Ionicons name="checkmark" size={20} color="#1E4DB3" />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {/* TRANSPORT MODE */}
              <Text style={styles.label}>
                Transportation Mode <Text style={styles.required}>*</Text>
              </Text>
              <Pressable 
                style={styles.inputContainer} 
                onPress={() => setShowTransportDropdown(!showTransportDropdown)}
              >
                <Ionicons name="airplane-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <View style={[styles.input, styles.inputWithIcon]}>
                  <Text style={[styles.inputText, !transportMode && styles.placeholderText]}>
                    {TRANSPORT_MODES.find(t => t.value === transportMode)?.label || "Select transportation mode"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748B" style={styles.chevronIcon} />
              </Pressable>
              
              {showTransportDropdown && (
                <View style={styles.dropdownContainer}>
                  {TRANSPORT_MODES.map(t => (
                    <Pressable 
                      key={t.value} 
                      style={[styles.dropdownItem, transportMode === t.value && styles.dropdownItemSelected]} 
                      onPress={() => { setTransportMode(t.value as any); setShowTransportDropdown(false); }}
                    >
                      <Text style={[styles.dropdownText, transportMode === t.value && styles.dropdownTextSelected]}>
                        {t.label}
                      </Text>
                      {transportMode === t.value && (
                        <Ionicons name="checkmark" size={20} color="#1E4DB3" />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {/* CONTACT PERSON */}
              <Text style={styles.label}>
                Contact Person <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-circle-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, styles.inputWithIcon]} 
                  value={contactPerson} 
                  onChangeText={setContactPerson} 
                  placeholder="Enter contact person name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* DIVISION */}
              <Text style={styles.label}>
                Division <Text style={styles.required}>*</Text>
              </Text>
              <Pressable 
                style={styles.inputContainer} 
                onPress={() => setShowDivisionDropdown(!showDivisionDropdown)}
              >
                <Ionicons name="business-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <View style={[styles.input, styles.inputWithIcon]}>
                  <Text style={[styles.inputText, !division && styles.placeholderText]}>
                    {DIVISIONS.find(d => d.value === division)?.label || "Select division"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748B" style={styles.chevronIcon} />
              </Pressable>
              
              {showDivisionDropdown && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {DIVISIONS.map(d => (
                      <Pressable 
                        key={d.value} 
                        style={[styles.dropdownItem, division === d.value && styles.dropdownItemSelected]} 
                        onPress={() => { setDivision(d.value); setShowDivisionDropdown(false); }}
                      >
                        <Text style={[styles.dropdownText, division === d.value && styles.dropdownTextSelected]}>
                          {d.label}
                        </Text>
                        {division === d.value && (
                          <Ionicons name="checkmark" size={20} color="#1E4DB3" />
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* REMARKS */}
              <Text style={styles.label}>
                Remarks <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={20} color="#64748B" style={[styles.inputIcon, { top: 16 }]} />
                <TextInput 
                  style={[styles.input, styles.inputWithIcon, styles.textArea]} 
                  multiline 
                  numberOfLines={4}
                  value={remarks} 
                  onChangeText={setRemarks} 
                  placeholder="Enter meeting remarks or notes"
                  placeholderTextColor="#94A3B8"
                  textAlignVertical="top"
                />
              </View>

              {/* SAVE BUTTON */}
              <Pressable 
                style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
                onPress={handleSave} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                    <Text style={styles.saveText}>Post Meeting</Text>
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
    backgroundColor: "#F8FAFC", 
    borderRadius: 14, 
    padding: 12, 
    borderWidth: 1.5, 
    borderColor: "#E2E8F0",
    flex: 1,
    justifyContent: "center",
    minHeight: 50,
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
  inputDisabled: { 
    backgroundColor: "#F1F5F9", 
    borderColor: "#E2E8F0",
    opacity: 0.7,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  dropdownContainer: { 
    backgroundColor: "#F8FAFC", 
    borderRadius: 14, 
    marginTop: 8, 
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
  dropdownText: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
  },
  dropdownTextSelected: {
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
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  infoText: { 
    fontSize: 13, 
    color: "#1E4DB3", 
    fontWeight: "600",
    flex: 1,
  },
  readOnlyBox: { 
    backgroundColor: "#F8FAFC", 
    borderRadius: 14, 
    padding: 14, 
    borderWidth: 1.5, 
    borderColor: "#E2E8F0",
    minHeight: 60,
  },
  locationLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
  },
  addressRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  readOnlyText: { 
    fontSize: 13, 
    color: "#1E293B",
    flex: 1,
    lineHeight: 18,
  },
  coords: { 
    fontSize: 11, 
    color: "#64748B", 
    marginTop: 8,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
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