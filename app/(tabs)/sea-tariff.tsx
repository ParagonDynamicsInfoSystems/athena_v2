import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    ImageBackground,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import erpApi from "../hooks/erpApi";

const BG_IMAGE = require("../../assets/images/bg.png");

const SeaTariffPage = () => {
    const [polList, setPolList] = useState<any[]>([]);
    const [podList, setPodList] = useState<any[]>([]);
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedPol, setSelectedPol] = useState<any>(null);
    const [selectedPod, setSelectedPod] = useState<any>(null);

    const [polModal, setPolModal] = useState(false);
    const [podModal, setPodModal] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const loadUserId = async () => {
            try {
                if (Platform.OS === "web") {
                    const id = localStorage.getItem("userId");
                    setUserId(id);
                } else {
                    const id = await AsyncStorage.getItem("userId");
                    setUserId(id);
                }
            } catch (e) {
                console.log("Error loading userId", e);
            }
        };
        loadUserId();
    }, []);

    useEffect(() => {
        const getPolPod = async () => {
            try {
                setLoading(true);
                const res = await erpApi.get("/Athena/standardcharge/aodList");
                setPolList(res.data?.lCommonUtilityBean || []);
                setPodList(res.data?.commonUtilityBean || []);
            } catch (err) {
                Alert.alert("Error", "Failed to load Port list");
            } finally {
                setLoading(false);
            }
        };
        getPolPod();
    }, []);

    useEffect(() => {
        const getList1 = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const res = await erpApi.get(`/Athena/app/airtariff/listseamob?id=${userId}`);
                setList(res.data?.lQuotationBean || []);
            } catch {
                Alert.alert("Error", "Failed to load Tariffs");
            } finally {
                setLoading(false);
            }
        };
        getList1();
    }, [userId]);

    const filteredList = useMemo(() => {
        return list.filter(item => {
            const polMatch = selectedPol ? item.pol === selectedPol.code : true;
            const podMatch = selectedPod ? item.pod === selectedPod.code : true;
            return polMatch && podMatch;
        });
    }, [list, selectedPol, selectedPod]);

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <Row label="POL Name" value={item.polName} />
            <Row label="POD Name" value={item.podName} />
            <Row label="Carrier" value={item.carrier} />
            <Row label="Service" value={item.serviceName} />
        </View>
    );

    return (
        <ImageBackground source={BG_IMAGE} style={styles.flex1}>
            <SafeAreaView style={styles.flex1}>
                <View style={styles.container}>
                    {/* CENTERED HEADER */}
                    <View style={headerStyles.headerBar}>
                        <Pressable onPress={() => router.back()} style={headerStyles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </Pressable>

                        <View style={headerStyles.titleContainer}>
                            <Text style={headerStyles.headerTitle}>Sea Tariffs</Text>
                        </View>

                        {(selectedPol || selectedPod) && (
                            <TouchableOpacity 
                                style={headerStyles.clearBtn} 
                                onPress={() => { setSelectedPol(null); setSelectedPod(null); }}
                            >
                                <Text style={headerStyles.clearText}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* DROPDOWNS */}
                    <View style={styles.filterSection}>
                        <TouchableOpacity style={styles.select} onPress={() => setPolModal(true)}>
                            <Text style={styles.labelSmall}>Port of Loading (POL)</Text>
                            <Text style={styles.selectText} numberOfLines={1}>
                                {selectedPol?.text || "Select POL"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.select} onPress={() => setPodModal(true)}>
                            <Text style={styles.labelSmall}>Port of Discharge (POD)</Text>
                            <Text style={styles.selectText} numberOfLines={1}>
                                {selectedPod?.text || "Select POD"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* LIST */}
                    <FlatList
                        data={filteredList}
                        keyExtractor={(_, i) => i.toString()}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<Text style={styles.emptyText}>No tariffs found for this route.</Text>}
                    />

                    {/* MODALS */}
                    <SearchModal
                        visible={polModal}
                        data={polList}
                        title="Select POL"
                        onSelect={(v: any) => { setSelectedPol(v); setPolModal(false); }}
                        onClose={() => setPolModal(false)}
                    />

                    <SearchModal
                        visible={podModal}
                        data={podList}
                        title="Select POD"
                        onSelect={(v: any) => { setSelectedPod(v); setPodModal(false); }}
                        onClose={() => setPodModal(false)}
                    />
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
};

/* ================= SEARCH MODAL COMPONENT ================= */
const SearchModal = ({ visible, data, title, onSelect, onClose }: any) => {
    const [search, setSearch] = useState("");

    const filtered = data.filter((i: any) => {
        const itemText = (i?.text ?? "").toString().trim().toLowerCase();
        const searchText = (search ?? "").toString().trim().toLowerCase();
        return itemText.includes(searchText);
    });

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <ImageBackground source={BG_IMAGE} style={styles.flex1}>
                <SafeAreaView style={styles.flex1}>
                    <View style={styles.modalContent}>
                        <View style={headerStyles.headerBar}>
                            <View style={headerStyles.titleContainer}>
                                <Text style={headerStyles.headerTitle}>{title}</Text>
                            </View>
                        </View>

                        <TextInput
                            placeholder="Search port name..."
                            placeholderTextColor="#999"
                            value={search}
                            onChangeText={setSearch}
                            style={styles.search}
                        />

                        <FlatList
                            data={filtered}
                            keyExtractor={(_, i) => i.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.option}
                                    onPress={() => { onSelect(item); setSearch(""); }}
                                >
                                    <Text style={styles.optionText}>{item.text}</Text>
                                </TouchableOpacity>
                            )}
                        />

                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={{ color: "#fff", fontWeight: 'bold' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </ImageBackground>
        </Modal>
    );
};

/* ================= SMALL COMPONENT ================= */
const Row = ({ label, value }: any) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || "-"}</Text>
    </View>
);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    flex1: { flex: 1 },
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
    filterSection: { marginBottom: 15 },
    select: {
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    labelSmall: { fontSize: 10, color: '#003366', fontWeight: 'bold', marginBottom: 2 },
    selectText: { color: "#333", fontSize: 15 },
    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#003366',
        elevation: 3,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    label: { fontWeight: "600", color: '#777', fontSize: 13 },
    value: { color: "#333", fontWeight: '700', fontSize: 13 },
    modalContent: { flex: 1, padding: 20 },
    search: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 15,
    },
    option: {
        backgroundColor: "rgba(255,255,255,0.8)",
        padding: 16,
        borderRadius: 10,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    optionText: { fontSize: 16, color: '#333' },
    closeBtn: {
        backgroundColor: "#003366",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
    },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#666', fontSize: 16 },
});

const headerStyles = StyleSheet.create({
    headerBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center", // Horizontal center for children
        backgroundColor: "rgba(244, 244, 250, 0.9)",
        borderRadius: 15,
        height: 60, // Fixed height helps centering
        paddingHorizontal: 16,
        marginBottom: 15,
    },
    titleContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: "800", 
        color: "#051539",
        textAlign: 'center' 
    },
    iconBtn: {
        position: "absolute",
        left: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#051539",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    clearBtn: {
        position: "absolute",
        right: 16,
        zIndex: 10,
    },
    clearText: { 
        color: '#003366', 
        fontWeight: 'bold',
        fontSize: 14 
    }
});

export default SeaTariffPage;