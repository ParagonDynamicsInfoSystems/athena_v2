import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import React, { JSX, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import aiApi from "../hooks/aiApi";

/* ---------------- CONSTANTS ---------------- */
const BRAND_COLOR = "#1D4ED8";
const ACCENT_COLOR = "#38A169";
const LIGHT_BACKGROUND = "#f4f7fb";
const CARD_COLOR = "#FFFFFF";

type ScanResponse = {
  person_name?: string | null;
  designation?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  is_existing_customer?: boolean;
};

export default function VisitingCardScannerScreen(): JSX.Element {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<ScanResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserId = async () => {
      const uid = await AsyncStorage.getItem("crmUserId");
      if (uid) setUserId(uid.toUpperCase());
    };
    loadUserId();
  }, []);

  /* -------- IMAGE SELECTION HANDLERS -------- */
  const handleImageResult = (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setEditing(null); 
    }
  };

  async function openCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false, 
    });
    handleImageResult(result);
  }

  async function openGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    handleImageResult(result);
  }

  /* -------- API SCAN HANDLER -------- */
  async function uploadImageAndScan() {
    if (!imageUri || !userId) return;

    setUploading(true);
    try {
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const formData = new FormData();
      // @ts-ignore
      formData.append("image", {
        uri: Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
        name: `scan.${fileType}`,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      });

      const resp = await aiApi.post(
        `/scanner/visiting-card?user_id=${userId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Checking both common response patterns based on your logs
      const extractedData = resp.data?.data || resp.data?.response?.data;

      if (extractedData) {
        setEditing(extractedData);
      } else {
        throw new Error("API returned success but no data was found.");
      }
    } catch (e: any) {
      console.error("Scan error:", e);
      Alert.alert("Scan failed", "Could not process card. Please try a clearer photo.");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (imageUri && userId && !editing) {
      uploadImageAndScan();
    }
  }, [imageUri, userId]);

  /* -------- SAVE HANDLER -------- */
  async function saveScannedDetails() {
    if (!editing || !userId) return;
    setSaving(true);
    try {
      await aiApi.post(`/scanner/add-details?user_id=${userId}`, editing);
      Alert.alert("Success", "Contact saved successfully!");
      setImageUri(null);
      setEditing(null);
    } catch (e: any) {
      Alert.alert("Save failed", e?.response?.data?.message || "Internal error");
    } finally {
      setSaving(false);
    }
  }

  const editFields: (keyof ScanResponse)[] = [
    "person_name", "designation", "company_name", "phone_number", "email", "website", "address"
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        <Text style={styles.title}>Card Scanner</Text>

        <View style={styles.card}>
          <View style={styles.previewBox}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <MaterialCommunityIcons name="image-search-outline" size={48} color="#cbd5e1" />
            )}
            {uploading && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator color="#fff" size="large" />
                <Text style={styles.loaderText}>Processing...</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
              <MaterialCommunityIcons name="camera" size={18} color="#fff" />
              <Text style={styles.btnText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: '#475569' }]} onPress={openGallery}>
              <MaterialCommunityIcons name="image-multiple" size={18} color="#fff" />
              <Text style={styles.btnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {editing && (
          <View style={[styles.card, styles.editorCard]}>
            <View style={styles.editorHeader}>
              <Text style={styles.cardTitle}>Verify Details</Text>
              {editing.is_existing_customer && (
                <View style={styles.badge}><Text style={styles.badgeText}>Existing</Text></View>
              )}
            </View>

            {editFields.map((field) => (
              <View key={field} style={styles.inputGroup}>
                <Text style={styles.label}>{field.replace(/_/g, " ").toUpperCase()}</Text>
                <TextInput
                  style={styles.input}
                  value={editing[field]?.toString() || ""}
                  placeholder="Not found"
                  placeholderTextColor="#94a3b8"
                  onChangeText={(text) => setEditing({ ...editing, [field]: text })}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.saveBtn} onPress={saveScannedDetails} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save to CRM</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT_BACKGROUND },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 20, color: "#1e293b" },
  card: { backgroundColor: CARD_COLOR, borderRadius: 20, padding: 16, marginBottom: 16, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1 },
  editorCard: { borderTopWidth: 4, borderTopColor: BRAND_COLOR },
  previewBox: { height: 200, borderRadius: 16, backgroundColor: "#f8fafc", overflow: "hidden", justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  previewImage: { width: "100%", height: "100%", resizeMode: "contain" },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(30, 41, 59, 0.7)", justifyContent: "center", alignItems: "center" },
  loaderText: { color: "#fff", marginTop: 10, fontWeight: "600" },
  buttonRow: { flexDirection: 'row', gap: 10 },
  cameraBtn: { flex: 1, backgroundColor: BRAND_COLOR, padding: 14, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  saveBtn: { backgroundColor: ACCENT_COLOR, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "bold" },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#334155" },
  badge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#ef4444', fontSize: 10, fontWeight: '800' },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 10, fontWeight: "800", color: "#64748b", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#f1f5f9", borderRadius: 8, padding: 10, fontSize: 14, color: "#0f172a", backgroundColor: "#f8fafc" },
});