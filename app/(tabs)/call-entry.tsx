import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const bgImage = require("../../assets/images/bg.png");

/* ================= MASTER DATA ================= */

const SALES_TYPES = [
  { label: "Cross Trade", value: "CROSS_TRADE" },
  { label: "Local", value: "LOCAL" },
  { label: "Nominated", value: "NOMINATED" },
  { label: "Project Cargo", value: "PROJECT_CARGO" },
];

const CALL_TYPES = [
  { label: "Direct Meet", value: "DIRECT_MEET" },
  { label: "Phone", value: "PHONE" },
  { label: "Email", value: "EMAIL" },
  { label: "Online", value: "ONLINE" },
];

/* ================= REUSABLE COMPONENTS ================= */

const ModernInput = ({ label, value, onChangeText, multiline = false, placeholder }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      style={[styles.textInput, multiline && styles.textArea]}
      multiline={multiline}
    />
  </View>
);

const ModernSelect = ({ label, value, items, onSelect }: any) => {
  const [open, setOpen] = useState(false);
  const selected = items.find((i: any) => i.value === value)?.label || "Select Option";

  const openSelect = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...items.map((i: any) => i.label), "Cancel"],
          cancelButtonIndex: items.length,
        },
        (i) => i < items.length && onSelect(items[i].value)
      );
    } else setOpen(true);
  };

  return (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={openSelect}>
          <Text style={[styles.selectBtnText, !value && { color: "#94a3b8" }]}>{selected}</Text>
          <Ionicons name="chevron-down" size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

      {Platform.OS === "android" && (
        <Modal transparent animationType="fade" visible={open}>
          <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              {items.map((i: any) => (
                <TouchableOpacity
                  key={i.value}
                  style={styles.sheetItem}
                  onPress={() => { onSelect(i.value); setOpen(false); }}
                >
                  <Text style={styles.sheetText}>{i.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
};

/* ================= MAIN SCREEN ================= */

export default function CallEntryAddScreen() {
  const router = useRouter();

  // Common Details State
  const [visitDate, setVisitDate] = useState(new Date());
  const [showVisitPicker, setShowVisitPicker] = useState(false);
  const [contactPerson, setContactPerson] = useState("");
  const [customer, setCustomer] = useState("");
  const [salesType, setSalesType] = useState("");
  const [commonAddress, setCommonAddress] = useState("");

  // Outcomes State
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Temp State for Modal
  const [temp, setTemp] = useState({
    callDate: new Date(),
    showCallDate: false,
    callType: "",
    callUpdate: "",
    actionPlan: "",
    department: "",
    followUpDate: new Date(),
    showFollowUp: false,
    fullAddress: "",
    latitude: null as number | null,
    longitude: null as number | null,
    loading: false,
  });

  useEffect(() => {
    Location.requestForegroundPermissionsAsync();
  }, []);

  /* ================= LOGIC FUNCTIONS ================= */

  const captureLocation = async () => {
    setTemp((prev) => ({ ...prev, loading: true }));
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const geo = await Location.reverseGeocodeAsync(pos.coords);
      const g = geo[0];
      const addr = [g.name, g.street, g.city, g.region].filter(Boolean).join(", ");
      
      setTemp((prev) => ({
        ...prev,
        fullAddress: addr,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        loading: false,
      }));
    } catch (e) {
      setTemp((prev) => ({ ...prev, loading: false }));
      Alert.alert("Location Error", "Could not fetch GPS coordinates.");
    }
  };

  const isAddressDifferent = () => {
    if (!commonAddress || !temp.fullAddress) return false;
    return !temp.fullAddress.toLowerCase().includes(commonAddress.toLowerCase());
  };

  const finalizeOutcome = () => {
    setOutcomes([...outcomes, temp]);
    setModalOpen(false);
    // Reset Temp
    setTemp({
      callDate: new Date(), showCallDate: false, callType: "", callUpdate: "",
      actionPlan: "", department: "", followUpDate: new Date(),
      showFollowUp: false, fullAddress: "", latitude: null, longitude: null, loading: false,
    });
  };

  const saveOutcome = () => {
    if (!temp.callType || !temp.callUpdate) {
      Alert.alert("Required", "Please fill Call Type and Update.");
      return;
    }
    if (temp.callType === "DIRECT_MEET" && !temp.latitude) {
      Alert.alert("Location", "Capture location for Direct Meet.");
      return;
    }
    if (temp.callType === "DIRECT_MEET" && isAddressDifferent()) {
      Alert.alert("Mismatch", "Location differs from Common Address. Continue?", [
        { text: "Cancel", style: "cancel" },
        { text: "Proceed", onPress: finalizeOutcome },
      ]);
      return;
    }
    finalizeOutcome();
  };

  const handleGlobalSave = () => {
    if (!contactPerson || !customer || !salesType) {
      Alert.alert("Validation", "Please fill all required common details.");
      return;
    }
    if (outcomes.length === 0) {
      Alert.alert("Missing Data", "Please add at least one call outcome.");
      return;
    }

    const payload = {
      visitDate: visitDate.toISOString(),
      contactPerson,
      customer,
      salesType,
      commonAddress,
      outcomes,
    };

    console.log("Saving Data:", payload);
    Alert.alert("Success", "Call Entry Saved!", [{ text: "OK", onPress: () => router.back() }]);
  };

  /* ================= UI RENDER ================= */

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={bgImage} style={styles.flex1}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Call Entry</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* CLIENT INFO SECTION */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Client Information</Text>

            <TouchableOpacity style={styles.datePickerRow} onPress={() => setShowVisitPicker(true)}>
              <View>
                <Text style={styles.inputLabel}>Visit Date</Text>
                <Text style={styles.dateText}>{visitDate.toLocaleDateString()}</Text>
              </View>
              <Ionicons name="calendar-outline" size={20} color="#2563eb" />
            </TouchableOpacity>

            {showVisitPicker && (
              <DateTimePicker value={visitDate} mode="date" onChange={(_, d) => { setShowVisitPicker(false); if (d) setVisitDate(d); }} />
            )}

            <ModernInput label="Contact Person *" value={contactPerson} onChangeText={setContactPerson} placeholder="John Doe" />
            <ModernInput label="Customer *" value={customer} onChangeText={setCustomer} placeholder="Company Name" />
            <ModernSelect label="Sales Type *" value={salesType} items={SALES_TYPES} onSelect={setSalesType} />
            <ModernInput label="Common Address" value={commonAddress} onChangeText={setCommonAddress} multiline placeholder="Enter default location" />
          </View>

          {/* OUTCOMES SECTION */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>CALL OUTCOMES</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{outcomes.length}</Text></View>
          </View>

          {outcomes.map((o, i) => (
            <View key={i} style={styles.outcomeCard}>
              <View style={styles.outcomeHeader}>
                <Text style={styles.outcomeType}>{o.callType.replace('_', ' ')}</Text>
                <Text style={styles.outcomeDateText}>{o.callDate.toLocaleDateString()}</Text>
              </View>
              <Text style={styles.outcomeUpdateText}>{o.callUpdate}</Text>
              {o.fullAddress && (
                <View style={styles.locRow}>
                  <Ionicons name="location-sharp" size={12} color="#94a3b8" />
                  <Text style={styles.locText} numberOfLines={1}>{o.fullAddress}</Text>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addOutcomeBtn} onPress={() => setModalOpen(true)}>
            <Ionicons name="add-circle" size={24} color="#2563eb" />
            <Text style={styles.addOutcomeBtnText}>Add Outcome</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* FINAL SAVE FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.finalSaveBtn} onPress={handleGlobalSave}>
            <Text style={styles.finalSaveBtnText}>SAVE CALL ENTRY</Text>
          </TouchableOpacity>
        </View>

        {/* ADD OUTCOME MODAL */}
        <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContent}>
            <View style={styles.modalTopBar}>
              <Text style={styles.modalTitle}>Call Outcome</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.datePickerRow, { flex: 1, marginBottom: 0 }]} onPress={() => setTemp({ ...temp, showCallDate: true })}>
                  <Text style={styles.inputLabel}>Call Date</Text>
                  <Text style={styles.dateText}>{temp.callDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.datePickerRow, { flex: 1, marginBottom: 0 }]} onPress={() => setTemp({ ...temp, showFollowUp: true })}>
                  <Text style={styles.inputLabel}>Follow Up</Text>
                  <Text style={styles.dateText}>{temp.followUpDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>

              {temp.showCallDate && <DateTimePicker value={temp.callDate} mode="date" onChange={(_, d) => { setTemp({ ...temp, showCallDate: false }); if (d) setTemp({ ...temp, callDate: d }); }} />}
              {temp.showFollowUp && <DateTimePicker value={temp.followUpDate} mode="date" onChange={(_, d) => { setTemp({ ...temp, showFollowUp: false }); if (d) setTemp({ ...temp, followUpDate: d }); }} />}

              <ModernSelect label="Call Type *" value={temp.callType} items={CALL_TYPES} onSelect={(v: any) => setTemp({ ...temp, callType: v })} />
              <ModernInput label="Call Update *" value={temp.callUpdate} onChangeText={(v: any) => setTemp({ ...temp, callUpdate: v })} multiline />
              <ModernInput label="Action Plan" value={temp.actionPlan} onChangeText={(v: any) => setTemp({ ...temp, actionPlan: v })} multiline />
              <ModernInput label="Department" value={temp.department} onChangeText={(v: any) => setTemp({ ...temp, department: v })} />

              {temp.callType === "DIRECT_MEET" && (
                <TouchableOpacity style={[styles.locCaptureBtn, temp.latitude && styles.locCaptureBtnActive]} onPress={captureLocation}>
                  {temp.loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="navigate" size={18} color={temp.latitude ? "#fff" : "#2563eb"} />
                      <Text style={[styles.locCaptureText, temp.latitude && { color: "#fff" }]}>{temp.fullAddress ? "Location Verified" : "Capture Location"}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.modalAddBtn} onPress={saveOutcome}>
                <Text style={styles.modalAddBtnText}>ADD TO LIST</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  flex1: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  scrollContent: { padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { fontSize: 16, fontWeight: "700", color: "#334155", marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: "#64748b", marginBottom: 6 },
  textInput: { backgroundColor: "#f1f5f9", borderRadius: 10, padding: 12, fontSize: 14, color: "#1e293b", borderWidth: 1, borderColor: "#e2e8f0" },
  textArea: { height: 70, textAlignVertical: "top" },
  selectBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f1f5f9", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  selectBtnText: { fontSize: 14, color: "#1e293b" },
  datePickerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#eff6ff", padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: "#dbeafe" },
  dateText: { fontSize: 14, fontWeight: "700", color: "#1e40af" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: "#94a3b8", letterSpacing: 1 },
  badge: { backgroundColor: "#2563eb", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  outcomeCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#2563eb", shadowColor: "#000", shadowOpacity: 0.03, elevation: 1 },
  outcomeHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  outcomeType: { fontSize: 12, fontWeight: "800", color: "#2563eb", textTransform: "uppercase" },
  outcomeDateText: { fontSize: 11, color: "#64748b" },
  outcomeUpdateText: { fontSize: 14, color: "#334155" },
  locRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 4 },
  locText: { fontSize: 11, color: "#94a3b8" },
  addOutcomeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, borderWidth: 2, borderColor: "#2563eb", borderStyle: "dashed", gap: 8, marginTop: 8 },
  addOutcomeBtnText: { color: "#2563eb", fontWeight: "700" },
  footer: { padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  finalSaveBtn: { backgroundColor: "#0f172a", padding: 16, borderRadius: 12, alignItems: "center" },
  finalSaveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  modalContent: { flex: 1, backgroundColor: "#fff" },
  modalTopBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  locCaptureBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 10, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#2563eb", gap: 8, marginVertical: 12 },
  locCaptureBtnActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  locCaptureText: { fontWeight: "700", color: "#2563eb" },
  modalAddBtn: { backgroundColor: "#2563eb", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10 },
  modalAddBtnText: { color: "#fff", fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  bottomSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  sheetText: { fontSize: 16, color: "#1e293b" },
});