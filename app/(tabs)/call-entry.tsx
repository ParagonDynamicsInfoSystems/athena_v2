import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ImageBackground,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const bgImage = require("../../assets/images/bg.png");

export default function CallEntryAddScreen() {
  const router = useRouter();

  /* ================= LOCATION ================= */
  const [locationText, setLocationText] = useState("Fetching location...");
  const [tempLocation, setTempLocation] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);

  /* ================= MANDATORY ================= */
  const [visitDate, setVisitDate] = useState<Date | null>(null);
  const [showVisitPicker, setShowVisitPicker] = useState(false);
  const [contactPerson, setContactPerson] = useState("");
  const [customer, setCustomer] = useState("");
  const [salesType, setSalesType] = useState("");

  /* ================= OTHER ================= */
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [termOfSale, setTermOfSale] = useState("");
  const [nature, setNature] = useState("HOT");
  const [callStatus, setCallStatus] = useState("MATERIALISED");
  const [transport, setTransport] = useState("SEA");
  const [serviceType, setServiceType] = useState("EXPORT");
  const [division, setDivision] = useState<string[]>([]);

  /* ================= GPS ================= */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({});
      const addr = await Location.reverseGeocodeAsync(pos.coords);
      if (addr.length > 0) {
        const a = addr[0];
        setLocationText(`${a.subregion || a.city}, ${a.region}`);
      }
    })();
  }, []);

  const saveManualLocation = async () => {
    if (!tempLocation) return;
    setLocationText(tempLocation);
    setShowLocationModal(false);
  };

  const toggleDivision = (d: string) => {
    setDivision((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const submit = () => {
    if (!visitDate || !contactPerson || !customer || !salesType) {
      Alert.alert("Missing Fields", "Please fill all mandatory fields");
      return;
    }
    Alert.alert("Success", "Call Entry Saved");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <ImageBackground source={bgImage} style={{ flex: 1 }} resizeMode="cover">
        <View style={styles.overlay} />

        {/* ================= FIXED WHITE TOP ================= */}
        <View style={styles.topWhiteSection}>
          {/* HEADER */}
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Add Call Entry</Text>

            <TouchableOpacity
              style={styles.locationBox}
              onPress={() => {
                setTempLocation(locationText);
                setShowLocationModal(true);
              }}
            >
              <Ionicons name="location" size={14} />
              <Text style={styles.locationText}>{locationText}</Text>
            </TouchableOpacity>
          </View>

          {/* MANDATORY CARD */}
          <View style={styles.mandatoryCard}>
            <Text style={styles.sectionTitle}>Mandatory Details</Text>

            <TouchableOpacity
              style={styles.visitDateRow}
              onPress={() => setShowVisitPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} />
              <Text style={styles.visitDateText}>
                {visitDate
                  ? visitDate.toISOString().split("T")[0]
                  : "Select Visit Date *"}
              </Text>
            </TouchableOpacity>

            <View style={styles.mandatoryGrid}>
              <TextInput
                placeholder="Contact Person *"
                style={styles.mandatoryInput}
                value={contactPerson}
                onChangeText={setContactPerson}
              />

              <TextInput
                placeholder="Customer *"
                style={styles.mandatoryInput}
                value={customer}
                onChangeText={setCustomer}
              />

              <TextInput
                placeholder="Sales Type *"
                style={styles.mandatoryInputFull}
                value={salesType}
                onChangeText={setSalesType}
              />
            </View>
          </View>
        </View>

        {showVisitPicker && (
          <DateTimePicker
            value={visitDate || new Date()}
            mode="date"
            onChange={(_, d) => {
              setShowVisitPicker(false);
              if (d) setVisitDate(d);
            }}
          />
        )}

        {/* ================= SCROLLABLE CONTENT ================= */}
        <ScrollView contentContainerStyle={styles.scrollArea}>
          <Section title="Address">
            <Input label="Address" value={address} onChange={setAddress} multiline />
            <Input label="Area" value={area} onChange={setArea} />
            <Input label="Term of Sale" value={termOfSale} onChange={setTermOfSale} multiline />
          </Section>

          <Section title="Call Details">
            <Radio label="Nature of Call" options={["HOT", "MEDIUM", "COLD"]} value={nature} onChange={setNature} />
            <Radio label="Call Status" options={["MATERIALISED", "NOT MATERIALISED"]} value={callStatus} onChange={setCallStatus} />
            <Radio label="Transportation Mode" options={["SEA", "AIR"]} value={transport} onChange={setTransport} />
            <Radio label="Service Type" options={["EXPORT", "IMPORT"]} value={serviceType} onChange={setServiceType} />
          </Section>

          <Section title="Division">
            <View style={styles.divisionGrid}>
              {["CHA", "CDL", "3PL", "PROJECT CARGO", "TPTR", "FFW", "LINES", "CONTAINER SALES"].map((d) => (
                <TouchableOpacity key={d} style={styles.divisionItem} onPress={() => toggleDivision(d)}>
                  <Ionicons name={division.includes(d) ? "checkbox" : "square-outline"} size={18} />
                  <Text>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          <TouchableOpacity style={styles.submitBtn} onPress={submit}>
            <Text style={styles.submitText}>SAVE CALL ENTRY</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* LOCATION MODAL */}
        <Modal visible={showLocationModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.sectionTitle}>Change Location</Text>
              <Input label="Location" value={tempLocation} onChange={setTempLocation} />
              <TouchableOpacity style={styles.primaryBtn} onPress={saveManualLocation}>
                <Text style={{ color: "#fff" }}>Save Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ================= REUSABLE ================= */

const Section = ({ title, children }: any) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Input = ({ label, value, onChange, multiline }: any) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && { height: 80 }]}
      value={value}
      onChangeText={onChange}
      multiline={multiline}
    />
  </View>
);

const Radio = ({ label, options, value, onChange }: any) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.row}>
      {options.map((o: string) => (
        <TouchableOpacity key={o} style={styles.radio} onPress={() => onChange(o)}>
          <Ionicons name={value === o ? "radio-button-on" : "radio-button-off"} size={18} />
          <Text>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },

  topWhiteSection: {
    backgroundColor: "#fff",
    paddingBottom: 12,
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginLeft: 10,
  },

  locationBox: { alignItems: "flex-end", maxWidth: 140 },
  locationText: { fontSize: 11 },

  mandatoryCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  visitDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  visitDateText: { fontWeight: "600" },

  mandatoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  mandatoryInput: {
    width: "48%",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 8,
  },

  mandatoryInputFull: {
    width: "100%",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 8,
  },

  scrollArea: { padding: 16, paddingBottom: 60 },

  section: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },

  sectionTitle: { fontWeight: "700", marginBottom: 12 },

  label: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 6 },

  row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  radio: { flexDirection: "row", alignItems: "center", gap: 6 },

  divisionGrid: { flexDirection: "row", flexWrap: "wrap" },
  divisionItem: { width: "33.33%", flexDirection: "row", alignItems: "center", gap: 6 },

  submitBtn: {
    backgroundColor: "#16A34A",
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 10,
  },

  submitText: { color: "#fff", fontWeight: "700" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  primaryBtn: { backgroundColor: "#2563EB", padding: 12, borderRadius: 20, alignItems: "center" },
});
