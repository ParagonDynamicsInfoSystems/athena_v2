import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import erpApi from "../hooks/erpApi";

const BG_IMAGE = require("../../assets/images/bg.png");

/* ================= STATUS HELPERS ================= */
const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
        case "completed":
        case "delivered":
            return { bg: "rgba(16,185,129,0.12)", text: "#10B981" };
        case "in transit":
        case "intransit":
            return { bg: "rgba(59,130,246,0.12)", text: "#3B82F6" };
        case "pending":
        case "booked":
            return { bg: "rgba(245,158,11,0.12)", text: "#F59E0B" };
        case "cancelled":
            return { bg: "rgba(239,68,68,0.12)", text: "#EF4444" };
        default:
            return { bg: "rgba(100,116,139,0.12)", text: "#64748B" };
    }
};

/* ================= COMPONENT ================= */
const ShipmentScreen = () => {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useFocusEffect(
        useCallback(() => {
            loadShipments();
        }, [])
    );

    const loadShipments = async () => {
        try {
            setLoading(true);
            const userId = await SecureStore.getItemAsync("userId");
            if (!userId) return;

            const res = await erpApi.get(
                "/Athena/feeder/mobileApp/getShipmentDetails",
                { params: { userId } }
            );

            setList(res.data.shipmentDetails || []);
        } catch (err) {
            if (__DEV__) console.log("Shipment Error", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredList = useMemo(() => {
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter(item =>
            (item.jobNo && String(item.jobNo).toLowerCase().includes(q)) ||
            (item.customername && String(item.customername).toLowerCase().includes(q)) ||
            (item.polName && String(item.polName).toLowerCase().includes(q)) ||
            (item.podName && String(item.podName).toLowerCase().includes(q)) ||
            (item.status && String(item.status).toLowerCase().includes(q))
        );
    }, [list, search]);

    /* ================= CARD ================= */
    const renderItem = ({ item }: { item: any }) => {
        const statusColor = getStatusColor(item.status);

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                    if (item.jobNo) {
                        router.push({
                            pathname: "/(tabs)/a-track",
                            params: { jobNo: item.jobNo },
                        });
                    }
                }}
            >
                <View style={styles.card}>
                    {/* Header Row — Job No + Status */}
                    <View style={styles.cardHeader}>
                        <View style={styles.jobBadge}>
                            <MaterialCommunityIcons name="package-variant" size={16} color="#3B82F6" />
                            <Text style={styles.jobNo}>{item.jobNo || "-"}</Text>
                        </View>
                        {item.status && (
                            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                                <View style={[styles.statusDot, { backgroundColor: statusColor.text }]} />
                                <Text style={[styles.statusText, { color: statusColor.text }]}>
                                    {item.status}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Customer */}
                    <View style={styles.customerRow}>
                        <Ionicons name="business-outline" size={14} color="#94A3B8" />
                        <Text style={styles.customerName} numberOfLines={1}>
                            {item.customername || "Unknown Customer"}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Route */}
                    <View style={styles.routeRow}>
                        <View style={styles.routePoint}>
                            <View style={[styles.routeDot, { backgroundColor: "#3B82F6" }]} />
                            <View>
                                <Text style={styles.routeLabel}>POL</Text>
                                <Text style={styles.routeValue} numberOfLines={1}>{item.polName || "-"}</Text>
                            </View>
                        </View>

                        <View style={styles.routeArrow}>
                            <View style={styles.routeLine} />
                            <Ionicons name="arrow-forward" size={12} color="#CBD5E1" />
                            <View style={styles.routeLine} />
                        </View>

                        <View style={styles.routePointEnd}>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={styles.routeLabel}>POD</Text>
                                <Text style={styles.routeValue} numberOfLines={1}>{item.podName || "-"}</Text>
                            </View>
                            <View style={[styles.routeDot, { backgroundColor: "#10B981" }]} />
                        </View>
                    </View>

                    {/* Footer — Date + Action */}
                    <View style={styles.cardFooter}>
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
                            <Text style={styles.dateText}>{item.jobDate || "-"}</Text>
                        </View>
                        {item.jobNo ? (
                            <View style={styles.trackHint}>
                                <Text style={styles.trackHintText}>ERP Track</Text>
                                <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
                            </View>
                        ) : (
                            <Text style={styles.noMblText}>No Job No</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    /* ================= RENDER ================= */
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
                            <Text style={styles.headerTitle}>Shipment Details</Text>
                            <Text style={styles.headerSub}>
                                {filteredList.length} {filteredList.length === 1 ? "shipment" : "shipments"}
                            </Text>
                        </View>
                    </View>

                    {/* ===== SEARCH ===== */}
                    <View style={styles.searchSection}>
                        <View style={styles.searchWrap}>
                            <Ionicons name="search" size={20} color="#94A3B8" />
                            <TextInput
                                placeholder="Search by job no, customer, port..."
                                placeholderTextColor="#94A3B8"
                                value={search}
                                onChangeText={setSearch}
                                style={styles.searchInput}
                            />
                            {search.length > 0 && (
                                <Pressable onPress={() => setSearch("")}>
                                    <Ionicons name="close-circle" size={20} color="#94A3B8" />
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {/* ===== LIST ===== */}
                    <View style={styles.listArea}>
                        {loading ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color="#ffffff" />
                                <Text style={styles.loadingText}>Loading shipments...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredList}
                                keyExtractor={(_, index) => index.toString()}
                                renderItem={renderItem}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <View style={styles.center}>
                                        <View style={styles.emptyIcon}>
                                            <MaterialCommunityIcons name="package-variant-closed" size={48} color="rgba(255,255,255,0.3)" />
                                        </View>
                                        <Text style={styles.emptyTitle}>No Shipments Found</Text>
                                        <Text style={styles.emptySubtitle}>
                                            {search.trim()
                                                ? "Try a different search term"
                                                : "No shipment data available"
                                            }
                                        </Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
};

export default ShipmentScreen;

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

    /* Search */
    searchSection: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        gap: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 15,
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
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    jobBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(59,130,246,0.08)",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 6,
    },
    jobNo: {
        fontSize: 13,
        fontWeight: "800",
        color: "#1E40AF",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },

    /* Customer */
    customerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
    },
    customerName: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: "#1E293B",
    },

    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginBottom: 14,
    },

    /* Route */
    routeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    routePoint: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    routePointEnd: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
        flex: 1,
    },
    routeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    routeLabel: {
        fontSize: 10,
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontWeight: "700",
    },
    routeValue: {
        fontSize: 13,
        fontWeight: "700",
        color: "#334155",
        marginTop: 1,
    },
    routeArrow: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 6,
        gap: 2,
    },
    routeLine: {
        width: 12,
        height: 1.5,
        backgroundColor: "#E2E8F0",
    },

    /* Footer */
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        paddingTop: 12,
    },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    dateText: {
        fontSize: 12,
        color: "#94A3B8",
        fontWeight: "500",
    },
    trackHint: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    trackHintText: {
        fontSize: 13,
        color: "#3B82F6",
        fontWeight: "700",
    },
    noMblText: {
        fontSize: 11,
        color: "#CBD5E1",
        fontWeight: "500",
        fontStyle: "italic",
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
