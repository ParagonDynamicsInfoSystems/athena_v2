import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import RenderHTML from "react-native-render-html";
import aiApi from "../hooks/aiApi";

const USER_ID = "E0044";

type MailProvider = "google" | "outlook" | null;

export default function MailDraftPage() {
  const { post_plan_id } = useLocalSearchParams<{ post_plan_id?: string }>();
  const router = useRouter();
  const richRef = useRef<RichEditor>(null);

  const [loading, setLoading] = useState(true);
  const [notGenerated, setNotGenerated] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const [provider, setProvider] = useState<MailProvider>(null);

  const [draftId, setDraftId] = useState("");
  const [subject, setSubject] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [body, setBody] = useState("");

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    init();
  }, [post_plan_id]);

  const init = async () => {
    if (!post_plan_id) return;

    try {
      setLoading(true);

      const prefRes = await aiApi.get(
        `preferences/is-onboarded?user_id=${USER_ID}`
      );

      const data = prefRes?.data;
      if (data?.google_services_connected) {
        setProvider("google");
      } else if (data?.outlook_services_connected) {
        setProvider("outlook");
      } else {
        Alert.alert("Error", "No email service connected");
        return;
      }

      await loadDraft(
        data?.google_services_connected ? "google" : "outlook"
      );
    } catch {
      setNotGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- LOAD DRAFT ---------------- */
  const loadDraft = async (mailProvider: MailProvider) => {
    setNotGenerated(false);

    const draftUrl =
      mailProvider === "google"
        ? `calendar/draft/${post_plan_id}?user_id=${USER_ID}`
        : `calendar/outlook/${post_plan_id}?user_id=${USER_ID}`;

    try {
      const res = await aiApi.get(draftUrl);

      if (!res?.data?.success) {
        setNotGenerated(true);
        return;
      }

      const d = res.data.data;
      setDraftId(d.draft_id);
      setSubject(d.subject || "");
      setTo((d.to || []).join(", "));
      setCc((d.cc || []).join(", "));
      setBody(d.body_html || d.snippet || "");
    } catch {
      setNotGenerated(true);
    }
  };

  /* ---------------- SAVE DRAFT ---------------- */
  const saveDraft = async (silent = false) => {
    if (!draftId || !provider) return;

    const editUrl =
      provider === "google"
        ? `email-ai/google/edit-draft?user_id=${USER_ID}`
        : `email-ai/outlook/edit-draft?user_id=${USER_ID}`;

    try {
      setSaving(true);

      await aiApi.post(editUrl, {
        draft_id: draftId,
        subject,
        to: to.split(",").map(v => v.trim()).filter(Boolean),
        cc: cc.split(",").map(v => v.trim()).filter(Boolean),
        body,
        importance: "high",
      });

      if (!silent) {
        Alert.alert("Saved", "Draft updated successfully");
      }

      setEditMode(false);
    } catch {
      Alert.alert("Error", "Failed to save draft");
      throw new Error("save_failed");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- SEND MAIL ---------------- */
  const sendMail = async () => {
    if (!draftId || !provider) return;

    const sendUrl =
      provider === "google"
        ? `email-ai/google/send-draft?user_id=${USER_ID}`
        : `email-ai/outlook/send-draft?user_id=${USER_ID}`;

    try {
      setSending(true);

      await saveDraft(true);

      await aiApi.post(sendUrl, {
        draft_id: draftId,
      });

      Alert.alert("Success", "Mail sent successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to send mail");
    } finally {
      setSending(false);
    }
  };

  /* ---------------- HEADER ---------------- */
  const Header = () => (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>←</Text>
      </Pressable>

      <Text style={styles.title}>Mail Draft</Text>

      <Pressable
        onPress={editMode ? () => saveDraft(false) : () => setEditMode(true)}
      >
        <Text style={styles.editIcon}>{editMode ? "💾" : "✏️"}</Text>
      </Pressable>
    </View>
  );

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView style={styles.safe}>
      <Header />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : notGenerated ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Draft not generated yet</Text>
          <Text style={styles.emptySub}>
            We’ll notify you once it’s generated.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            value={subject}
            editable={editMode}
            onChangeText={setSubject}
            style={[styles.input, !editMode && styles.readOnly]}
          />

          <Text style={styles.label}>To</Text>
          <TextInput
            value={to}
            editable={editMode}
            onChangeText={setTo}
            style={[styles.input, !editMode && styles.readOnly]}
          />

          <Text style={styles.label}>CC</Text>
          <TextInput
            value={cc}
            editable={editMode}
            onChangeText={setCc}
            style={[styles.input, !editMode && styles.readOnly]}
          />

          <Text style={styles.label}>Mail Body</Text>

          {editMode ? (
            <>
              <RichEditor
                ref={richRef}
                initialContentHTML={body}
                style={styles.richEditor}
                onChange={setBody}
              />

              <RichToolbar
                editor={richRef}
                actions={[
                  actions.setBold,
                  actions.setItalic,
                  actions.setUnderline,
                  actions.insertBulletsList,
                  actions.insertOrderedList,
                  actions.insertLink,
                ]}
                style={styles.richToolbar}
              />
            </>
          ) : (
            <RenderHTML contentWidth={360} source={{ html: body }} />
          )}

          <View style={styles.footer}>
            <Pressable
              style={styles.sendBtn}
              onPress={sendMail}
              disabled={sending || saving}
            >
              <Text style={styles.sendTxt}>
                {sending ? "Sending..." : "Send Mail"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6FAFF" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#0D47A1",
  },
  back: { color: "#fff", fontSize: 20, fontWeight: "700" },
  title: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  editIcon: { fontSize: 20, color: "#fff" },

  content: { padding: 16 },
  label: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: "700",
    color: "#5a6b7c",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d6e0f6",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    backgroundColor: "#fff",
  },
  readOnly: { backgroundColor: "#f2f6ff" },

  richEditor: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: "#d6e0f6",
    borderRadius: 8,
    marginTop: 6,
  },
  richToolbar: {
    backgroundColor: "#f2f6ff",
    borderRadius: 8,
    marginTop: 6,
  },

  footer: { marginTop: 28 },
  sendBtn: {
    backgroundColor: "#F57C00",
    padding: 14,
    borderRadius: 12,
  },
  sendTxt: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
    fontSize: 16,
  },

  empty: {
    marginTop: 80,
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#15314a" },
  emptySub: {
    marginTop: 6,
    color: "#6f7a88",
    textAlign: "center",
  },
});
