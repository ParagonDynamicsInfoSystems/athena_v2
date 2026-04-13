import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ImageBackground,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import erpApi from "../hooks/erpApi";

const BG_IMAGE = require("../../assets/images/bg.png");

/* ================= MAIN COMPONENT ================= */
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
    const [details, setDetails] = useState<any>(null);
    const [detailVisible, setDetailVisible] = useState(false);

    useEffect(() => {
        const loadUserId = async () => {
            try {
                const id = await SecureStore.getItemAsync("userId");
                setUserId(id);
            } catch (e) {
                if (__DEV__) console.log("Error loading userId", e);
            }
        };
        loadUserId();
    }, []);

    useEffect(() => {
        const getPolPod = async () => {
            try {
                setLoading(true);
                const res = await erpApi.get("/Athena/standardcharge/aodList");
                if (__DEV__) {
                    console.log("POL DATA:", res.data?.lCommonUtilityBean);
                    console.log("POD DATA:", res.data?.commonUtilityBean);
                }

                const mapPorts = (arr: any[]) =>
                    (arr || []).map(p => ({
                        code: p.code || p.portCode || p.value,
                        text: p.text || p.portName || p.label,
                    }));

                setPolList(mapPorts(res.data?.lCommonUtilityBean));
                setPodList(mapPorts(res.data?.commonUtilityBean));
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
                const items = res.data?.lQuotationBean || [];
                if (__DEV__ && items.length > 0) {
                    console.log("TARIFF ITEM SAMPLE:", JSON.stringify(items[0], null, 2));
                }
                setList(items);
            } catch {
                Alert.alert("Error", "Failed to load Tariffs");
            } finally {
                setLoading(false);
            }
        };
        getList1();
    }, [userId]);

    const fetchTariffDetails = async (item: any) => {
        try {
            setLoading(true);
            const id = item.chargeid;
            const res = await erpApi.get(
                `/Athena/feeder/mobileApp/tarifview?traiffid=${id}`
            );
            if (res.data?.success) {
                setDetails(res.data.lQuotationBean?.[0]);
                setDetailVisible(true);
            } else {
                Alert.alert("Error", "No data found");
            }
        } catch (err) {
            if (__DEV__) console.log("DETAIL ERROR:", err);
            Alert.alert("Error", "Failed to fetch details");
        } finally {
            setLoading(false);
        }
    };

    const filteredList = useMemo(() => {
        const matchPort = (itemCode: any, itemName: any, selected: any) => {
            if (!selected) return true;
            const selCode = String(selected.code ?? "").toLowerCase().trim();
            const selText = String(selected.text ?? "").toLowerCase().trim();
            const ic = String(itemCode ?? "").toLowerCase().trim();
            const iname = String(itemName ?? "").toLowerCase().trim();
            return ic === selCode ||
                ic === selText ||
                (iname.length > 0 && selText.length > 0 && (iname.includes(selText) || selText.includes(iname)));
        };

        return list.filter(item =>
            matchPort(item.pol, item.polName, selectedPol) &&
            matchPort(item.pod, item.podName, selectedPod)
        );
    }, [list, selectedPol, selectedPod]);

    const hasFilters = selectedPol || selectedPod;

    /* ================= TARIFF CARD ================= */
    const renderItem = ({ item, index }: any) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => fetchTariffDetails(item)}
            style={styles.cardWrapper}
        >
            <View style={styles.card}>
                {/* Card Header — Route */}
                <View style={styles.cardRoute}>
                    <View style={styles.portBadge}>
                        <MaterialCommunityIcons name="ferry" size={16} color="#3B82F6" />
                        <Text style={styles.portCode} numberOfLines={1}>{item.polName || item.pol || "-"}</Text>
                    </View>

                    <View style={styles.routeArrow}>
                        <View style={styles.routeLine} />
                        <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
                        <View style={styles.routeLine} />
                    </View>

                    <View style={[styles.portBadge, styles.portBadgePod]}>
                        <Ionicons name="location" size={14} color="#10B981" />
                        <Text style={styles.portCode} numberOfLines={1}>{item.podName || item.pod || "-"}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Card Body — Details */}
                <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Carrier</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>{item.carrier || "-"}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Service</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>{item.serviceName || "-"}</Text>
                    </View>
                </View>

                {/* Tap Indicator */}
                <View style={styles.tapHint}>
                    <Text style={styles.tapHintText}>Tap for details</Text>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                </View>
            </View>
        </TouchableOpacity>
    );

    /* ================= MAIN RENDER ================= */
    return (
        <View style={styles.root}>
            <ImageBackground source={BG_IMAGE} style={styles.flex1}>
                <View style={styles.overlay} />

                <SafeAreaView style={styles.flex1}>
                    {/* ===== HEADER ===== */}
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </Pressable>

                        <View style={styles.headerText}>
                            <Text style={styles.headerTitle}>Sea Tariffs</Text>
                            <Text style={styles.headerSub}>
                                {filteredList.length} {filteredList.length === 1 ? "tariff" : "tariffs"} found
                            </Text>
                        </View>

                        {hasFilters && (
                            <TouchableOpacity
                                style={styles.clearBtn}
                                onPress={() => { setSelectedPol(null); setSelectedPod(null); }}
                            >
                                <Ionicons name="close-circle" size={16} color="#EF4444" />
                                <Text style={styles.clearText}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ===== FILTER SELECTORS ===== */}
                    <View style={styles.filterSection}>
                        <TouchableOpacity
                            style={[styles.filterBtn, selectedPol && styles.filterBtnActive]}
                            onPress={() => setPolModal(true)}
                        >
                            <View style={styles.filterIcon}>
                                <MaterialCommunityIcons name="ferry" size={18} color={selectedPol ? "#3B82F6" : "#64748B"} />
                            </View>
                            <View style={styles.filterContent}>
                                <Text style={styles.filterLabel}>Port of Loading</Text>
                                <Text
                                    style={[styles.filterValue, selectedPol && styles.filterValueActive]}
                                    numberOfLines={1}
                                >
                                    {selectedPol?.text || "Select POL"}
                                </Text>
                            </View>
                            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterBtn, selectedPod && styles.filterBtnActive]}
                            onPress={() => setPodModal(true)}
                        >
                            <View style={[styles.filterIcon, selectedPod && styles.filterIconActive]}>
                                <Ionicons name="location" size={18} color={selectedPod ? "#10B981" : "#64748B"} />
                            </View>
                            <View style={styles.filterContent}>
                                <Text style={styles.filterLabel}>Port of Discharge</Text>
                                <Text
                                    style={[styles.filterValue, selectedPod && styles.filterValueActive]}
                                    numberOfLines={1}
                                >
                                    {selectedPod?.text || "Select POD"}
                                </Text>
                            </View>
                            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {/* ===== LIST ===== */}
                    <View style={styles.listArea}>
                        {loading ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color="#ffffff" />
                                <Text style={styles.loadingText}>Loading tariffs...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredList}
                                keyExtractor={(_, i) => i.toString()}
                                renderItem={renderItem}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.listContent}
                                ListEmptyComponent={
                                    <View style={styles.center}>
                                        <View style={styles.emptyIcon}>
                                            <MaterialCommunityIcons name="ship-wheel" size={48} color="rgba(255,255,255,0.3)" />
                                        </View>
                                        <Text style={styles.emptyTitle}>No Tariffs Found</Text>
                                        <Text style={styles.emptySubtitle}>
                                            {hasFilters
                                                ? "Try adjusting your port filters"
                                                : "No sea tariff data available"
                                            }
                                        </Text>
                                    </View>
                                }
                            />
                        )}
                    </View>

                    {/* ===== PORT SELECTION MODALS ===== */}
                    <SearchModal
                        visible={polModal}
                        data={polList}
                        title="Port of Loading"
                        icon="ferry"
                        iconColor="#3B82F6"
                        onSelect={(v: any) => { setSelectedPol(v); setPolModal(false); }}
                        onClose={() => setPolModal(false)}
                    />

                    <SearchModal
                        visible={podModal}
                        data={podList}
                        title="Port of Discharge"
                        icon="location"
                        iconColor="#10B981"
                        onSelect={(v: any) => { setSelectedPod(v); setPodModal(false); }}
                        onClose={() => setPodModal(false)}
                    />

                    {/* ===== DETAIL MODAL ===== */}
                    <DetailModal
                        visible={detailVisible}
                        details={details}
                        onClose={() => setDetailVisible(false)}
                    />
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
};

/* ================= DETAIL MODAL ================= */
const DetailModal = ({ visible, details, onClose }: any) => (
    <Modal visible={visible} animationType="slide" transparent>
        <View style={detailStyles.backdrop}>
            <View style={detailStyles.sheet}>
                {/* Handle */}
                <View style={detailStyles.handle} />

                {/* Header */}
                <View style={detailStyles.header}>
                    <View>
                        <Text style={detailStyles.title}>Tariff Details</Text>
                        <Text style={detailStyles.subtitle}>{details?.chargeNo || ""}</Text>
                    </View>
                    <Pressable onPress={onClose} style={detailStyles.closeIcon}>
                        <Ionicons name="close" size={20} color="#64748B" />
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={detailStyles.body}>
                    {/* Route Section */}
                    <View style={detailStyles.routeCard}>
                        <View style={detailStyles.routeEndpoint}>
                            <View style={[detailStyles.dot, { backgroundColor: "#3B82F6" }]} />
                            <View>
                                <Text style={detailStyles.routeLabel}>Origin</Text>
                                <Text style={detailStyles.routePort}>{details?.polName || "-"}</Text>
                            </View>
                        </View>
                        <View style={detailStyles.routeConnector}>
                            <View style={detailStyles.routeDash} />
                            <MaterialCommunityIcons name="ferry" size={20} color="#94A3B8" />
                            <View style={detailStyles.routeDash} />
                        </View>
                        <View style={detailStyles.routeEndpoint}>
                            <View style={[detailStyles.dot, { backgroundColor: "#10B981" }]} />
                            <View>
                                <Text style={detailStyles.routeLabel}>Destination</Text>
                                <Text style={detailStyles.routePort}>{details?.podName || "-"}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Info Grid */}
                    <View style={detailStyles.infoGrid}>
                        <InfoCell label="Carrier" value={details?.carrier} icon="boat-outline" />
                        <InfoCell label="Validity" value={details?.validityDate} icon="calendar-outline" />
                        <InfoCell label="Term" value={details?.term} icon="document-text-outline" />
                        <InfoCell label="Charge No" value={details?.chargeNo} icon="pricetag-outline" />
                    </View>

                    {/* Charges */}
                    {(details?.chargeDtl?.length ?? 0) > 0 && (
                        <>
                            <Text style={detailStyles.sectionTitle}>Charges Breakdown</Text>
                            {details.chargeDtl.map((item: any, idx: number) => (
                                <View key={idx} style={detailStyles.chargeRow}>
                                    <View style={detailStyles.chargeIndex}>
                                        <Text style={detailStyles.chargeIndexText}>{idx + 1}</Text>
                                    </View>
                                    <View style={detailStyles.chargeInfo}>
                                        <Text style={detailStyles.chargeRate}>{item.rate ?? "-"}</Text>
                                        <Text style={detailStyles.chargeUnit}>
                                            {item.qty ?? "-"} x {item.unit ?? "-"}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </ScrollView>

                {/* Close Button */}
                <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose}>
                    <Text style={detailStyles.closeBtnText}>Close</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

/* ================= INFO CELL ================= */
const InfoCell = ({ label, value, icon }: { label: string; value?: string; icon: string }) => (
    <View style={detailStyles.infoCell}>
        <Ionicons name={icon as any} size={16} color="#94A3B8" />
        <Text style={detailStyles.infoCellLabel}>{label}</Text>
        <Text style={detailStyles.infoCellValue}>{value || "-"}</Text>
    </View>
);

/* ================= SEARCH MODAL ================= */
const SearchModal = ({ visible, data, title, icon, iconColor, onSelect, onClose }: any) => {
    const [search, setSearch] = useState("");

    const prevVisible = useRef(false);
    useEffect(() => {
        if (visible && !prevVisible.current) {
            setSearch("");
        }
        prevVisible.current = visible;
    }, [visible]);

    const filtered = useMemo(() =>
        (data || []).filter((i: any) => {
            const itemText = String(i?.text || "").toLowerCase();
            const searchText = String(search || "").toLowerCase();
            return itemText.includes(searchText);
        }),
    [data, search]);

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <ImageBackground source={BG_IMAGE} style={styles.flex1}>
                <View style={styles.overlay} />
                <SafeAreaView style={styles.flex1}>
                    <View style={modalStyles.container}>
                        {/* Header */}
                        <View style={modalStyles.header}>
                            <Pressable onPress={onClose} style={styles.backBtn}>
                                <Ionicons name="chevron-back" size={24} color="#fff" />
                            </Pressable>
                            <View style={styles.headerText}>
                                <Text style={styles.headerTitle}>{title}</Text>
                                <Text style={styles.headerSub}>{filtered.length} ports available</Text>
                            </View>
                        </View>

                        {/* Search */}
                        <View style={modalStyles.searchWrap}>
                            <Ionicons name="search" size={20} color="#94A3B8" style={modalStyles.searchIcon} />
                            <TextInput
                                placeholder="Search port name..."
                                placeholderTextColor="#94A3B8"
                                value={search}
                                onChangeText={setSearch}
                                style={modalStyles.searchInput}
                            />
                            {search.length > 0 && (
                                <Pressable onPress={() => setSearch("")}>
                                    <Ionicons name="close-circle" size={20} color="#94A3B8" />
                                </Pressable>
                            )}
                        </View>

                        {/* List */}
                        <FlatList
                            data={filtered}
                            keyExtractor={(_, i) => i.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={modalStyles.option}
                                    onPress={() => { onSelect(item); setSearch(""); }}
                                >
                                    <View style={[modalStyles.optionIcon, { backgroundColor: `${iconColor}15` }]}>
                                        {icon === "ferry" ? (
                                            <MaterialCommunityIcons name="ferry" size={16} color={iconColor} />
                                        ) : (
                                            <Ionicons name={icon} size={16} color={iconColor} />
                                        )}
                                    </View>
                                    <Text style={modalStyles.optionText}>{item.text}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.center}>
                                    <Ionicons name="search-outline" size={40} color="rgba(255,255,255,0.3)" />
                                    <Text style={styles.emptySubtitle}>No ports match your search</Text>
                                </View>
                            }
                        />
                    </View>
                </SafeAreaView>
            </ImageBackground>
        </Modal>
    );
};

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    root: { flex: 1 },
    flex1: { flex: 1 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(10, 11, 30, 0.78)",
    },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backBtn: {
        width: 45,
        height: 45,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.12)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    headerText: { flex: 1 },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#fff",
        letterSpacing: 0.3,
    },
    headerSub: {
        fontSize: 13,
        color: "rgba(255,255,255,0.55)",
        fontWeight: "500",
        marginTop: 2,
    },
    clearBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(239,68,68,0.12)",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 4,
    },
    clearText: {
        color: "#EF4444",
        fontWeight: "700",
        fontSize: 12,
    },

    /* Filters */
    filterSection: {
        paddingHorizontal: 20,
        marginBottom: 8,
        gap: 10,
    },
    filterBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    filterBtnActive: {
        backgroundColor: "rgba(255,255,255,0.12)",
        borderColor: "rgba(59,130,246,0.3)",
    },
    filterIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.08)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    filterIconActive: {
        backgroundColor: "rgba(16,185,129,0.12)",
    },
    filterContent: { flex: 1 },
    filterLabel: {
        fontSize: 10,
        color: "rgba(255,255,255,0.45)",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        fontWeight: "700",
    },
    filterValue: {
        fontSize: 15,
        color: "rgba(255,255,255,0.6)",
        fontWeight: "600",
        marginTop: 2,
    },
    filterValueActive: {
        color: "#fff",
    },

    /* List */
    listArea: { flex: 1 },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 40,
    },

    /* Card */
    cardWrapper: { marginBottom: 14 },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 18,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    cardRoute: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    portBadge: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(59,130,246,0.08)",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 6,
    },
    portBadgePod: {
        backgroundColor: "rgba(16,185,129,0.08)",
    },
    portCode: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1E293B",
        flex: 1,
    },
    routeArrow: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 8,
        gap: 2,
    },
    routeLine: {
        width: 10,
        height: 1.5,
        backgroundColor: "#CBD5E1",
    },
    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 14,
    },
    detailGrid: {
        flexDirection: "row",
        gap: 12,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontWeight: "700",
        marginBottom: 3,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
    },
    tapHint: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: 12,
        gap: 2,
    },
    tapHintText: {
        fontSize: 11,
        color: "#94A3B8",
        fontWeight: "500",
    },

    /* States */
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 60,
    },
    loadingText: {
        marginTop: 12,
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "500",
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.06)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "rgba(255,255,255,0.7)",
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.4)",
        textAlign: "center",
    },
});

/* ================= DETAIL MODAL STYLES ================= */
const detailStyles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: "88%",
        paddingBottom: 20,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#E2E8F0",
        alignSelf: "center",
        marginTop: 12,
        marginBottom: 8,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0F172A",
    },
    subtitle: {
        fontSize: 13,
        color: "#94A3B8",
        fontWeight: "500",
        marginTop: 2,
    },
    closeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F1F5F9",
        justifyContent: "center",
        alignItems: "center",
    },
    body: {
        paddingHorizontal: 24,
    },

    /* Route */
    routeCard: {
        backgroundColor: "#F8FAFC",
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    routeEndpoint: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    routeLabel: {
        fontSize: 10,
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontWeight: "700",
    },
    routePort: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1E293B",
    },
    routeConnector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingLeft: 4,
        gap: 6,
    },
    routeDash: {
        width: 20,
        height: 1.5,
        backgroundColor: "#CBD5E1",
    },

    /* Info Grid */
    infoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 20,
    },
    infoCell: {
        width: "47%",
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        padding: 12,
        gap: 4,
    },
    infoCellLabel: {
        fontSize: 10,
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontWeight: "700",
    },
    infoCellValue: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1E293B",
    },

    /* Charges */
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 12,
    },
    chargeRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        gap: 12,
    },
    chargeIndex: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: "#EEF2FF",
        justifyContent: "center",
        alignItems: "center",
    },
    chargeIndexText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#6366F1",
    },
    chargeInfo: { flex: 1 },
    chargeRate: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1E293B",
    },
    chargeUnit: {
        fontSize: 12,
        color: "#94A3B8",
        fontWeight: "500",
        marginTop: 2,
    },

    /* Close */
    closeBtn: {
        marginHorizontal: 24,
        marginTop: 16,
        backgroundColor: "#0F172A",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    closeBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});

/* ================= MODAL STYLES ================= */
const modalStyles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
    },
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: "#fff",
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        gap: 12,
    },
    optionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        color: "#fff",
        fontWeight: "600",
    },
});

export default SeaTariffPage;
