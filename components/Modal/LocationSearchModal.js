import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    StyleSheet,
    Alert,
    Modal,
    Platform,
    KeyboardAvoidingView,
    Linking,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "react-native-vector-icons";
import axios from "axios";

const API_KEY = "AlzaSyj_Ufz9Xj874DRq__j3mzQ4pkszOUmRfig";
const BASE_URL = "https://maps.gomaps.pro/maps/api/place/autocomplete/json";

const LocationSearchModal = ({ visible, onClose, onLocationSelected }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([
        "Hà Nội, Việt Nam",
        "InterContinental Danang Sun Peninsula, Đà Nẵng",
        "Khách sạn Pullman, Vũng Tàu",
    ]);

    const handleClearRecentSearches = () => {
        setRecentSearches([]);
    };

    const handleGetCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert(
                    "Quyền bị từ chối",
                    "Ứng dụng cần quyền truy cập vị trí để hoạt động. Vui lòng cấp quyền trong cài đặt.",
                    [
                        { text: "Hủy", style: "cancel" },
                        {
                            text: "Mở Cài đặt",
                            onPress: () => Linking.openSettings(),
                        },
                    ]
                );
                return;
            }

            const servicesEnabled = await Location.hasServicesEnabledAsync();
            if (!servicesEnabled) {
                Alert.alert(
                    "Dịch vụ vị trí bị tắt",
                    "Vui lòng bật Dịch vụ vị trí trên thiết bị của bạn để tiếp tục."
                );
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = currentLocation.coords;
            if (onLocationSelected) {
                onLocationSelected({
                    description: "Vị trí gần bạn",
                    latitude,
                    longitude,
                });
            }
            onClose();
        } catch (error) {
            Alert.alert(
                "Lỗi lấy vị trí",
                "Đã xảy ra lỗi khi lấy vị trí. Vui lòng thử lại."
            );
            console.error("Error getting location:", error);
        }
    };

    const handleSearch = async (text) => {
        setQuery(text);
        if (!text) {
            setResults([]);
            return;
        }

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    input: text,
                    key: API_KEY,
                    language: "vi",
                    components: "country:vn",
                },
            });

            setResults(response.data.predictions || []);
        } catch (error) {
            console.error("Error fetching places:", error.response || error.message);
        }
    };

    const handleClear = () => {
        setQuery("");
    };

    const handleSelectLocation = async (location) => {
        if (onLocationSelected) {
            try {
                const placeDetailsUrl = `https://maps.gomaps.pro/maps/api/place/details/json?place_id=${location.place_id}&key=${API_KEY}`;

                const response = await axios.get(placeDetailsUrl);
                const placeDetails = response.data.result;

                if (placeDetails && placeDetails.geometry && placeDetails.geometry.location) {
                    const { lat, lng } = placeDetails.geometry.location;
                    onLocationSelected({
                        description: location.description,
                        latitude: lat,
                        longitude: lng,
                    });
                } else {
                    Alert.alert("Không thể lấy thông tin chi tiết cho địa điểm này.");
                }
            } catch (error) {
                console.error("Error fetching place details:", error);
                Alert.alert("Lỗi", "Có lỗi khi lấy thông tin chi tiết vị trí.");
            }
        }
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalBackground}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerText}>Chọn khách sạn, điểm đến</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-outline" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchBarContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm khách sạn, điểm đến"
                            value={query}
                            onChangeText={handleSearch}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                                <Ionicons name="close-circle" size={24} color="#ccc" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {query.length > 0 && (
                        <FlatList
                            data={results}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.resultItem}
                                    onPress={() => handleSelectLocation(item)}
                                >
                                    <Ionicons name="location-outline" size={20} color="#000" />
                                    <Text style={styles.resultText}>{item.description}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}

                    <TouchableOpacity
                        style={styles.currentLocationContainer}
                        onPress={handleGetCurrentLocation}
                    >
                        <Ionicons name="location-outline" size={20} color="#000" />
                        <Text style={styles.currentLocationText}>Khách sạn gần bạn</Text>
                    </TouchableOpacity>

                    <View style={styles.recentSearchesHeader}>
                        <Text style={styles.sectionHeader}>Tìm kiếm gần đây</Text>
                        <TouchableOpacity onPress={handleClearRecentSearches}>
                            <Text style={styles.clearText}>Xóa</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={recentSearches}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.listItem}>
                                <Ionicons name="location-sharp" size={18} color="#000" />
                                <Text style={styles.listItemText}>{item}</Text>
                            </View>
                        )}
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    headerText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    searchBarContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
    },
    searchInput: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    clearButton: {
        position: "absolute",
        right: 10,
        top: "50%",
        transform: [{ translateY: -12 }],
    },
    currentLocationContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    currentLocationText: {
        marginLeft: 8,
        fontSize: 16,
    },
    recentSearchesHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 12,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: "bold",
    },
    clearText: {
        fontSize: 14,
        color: "#007BFF",
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    listItemText: {
        marginLeft: 8,
        fontSize: 16,
    },
    resultItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    resultText: {
        marginLeft: 8,
        fontSize: 16,
        color: "#333",
    },
});

export default LocationSearchModal;
