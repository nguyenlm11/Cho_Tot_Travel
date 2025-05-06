import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, Alert, Modal, Platform, Keyboard, KeyboardAvoidingView, Linking, Dimensions } from "react-native";
import * as Location from "expo-location";
import { Ionicons, FontAwesome } from "react-native-vector-icons";
import { colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, SlideOutDown } from 'react-native-reanimated';
import axios from "axios";
import { useSearch } from '../../contexts/SearchContext';

const { width, height } = Dimensions.get('window');
const API_KEY = "MdlDIjhDKvUnozmB9NJjiW4L5Pu5ogxX";
const BASE_URL = "https://mapapis.openmap.vn/v1/autocomplete";
const PLACE_DETAIL_URL = "https://mapapis.openmap.vn/v1/place";

const LocationSearchModal = ({ visible, onClose, onLocationSelected }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const { searchHistory, clearSearchHistory } = useSearch();
    const handleClearRecentSearches = () => {
        clearSearchHistory();
    };

    const handleClear = () => {
        setQuery("");
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
                        { text: "Mở Cài đặt", onPress: () => Linking.openSettings() },
                    ]);
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

            const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
            console.error("Error getting location:", error);
            Alert.alert(
                "Lỗi",
                "Không thể lấy vị trí hiện tại. Vui lòng thử lại sau."
            );
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
                    text: text,
                    apikey: API_KEY,
                    size: 5,
                },
            });
            setResults(response.data.features || []);
        } catch (error) {
            // Alert.alert("Lỗi", "Có lỗi khi lấy vị trí.");
        }
    };

    const handleSelectLocation = async (location) => {
        console.log("location", location);
        if (onLocationSelected) {
            try {
                const { label, id } = location.properties;
                const response = await axios.get(PLACE_DETAIL_URL, {
                    params: {
                        format: 'osm',
                        ids: id,
                        apikey: API_KEY
                    }
                });

                if (response.data && response.data.features && response.data.features.length > 0) {
                    const [lng, lat] = response.data.features[0].geometry.coordinates;

                    onLocationSelected({
                        description: label,
                        latitude: lat,
                        longitude: lng,
                    });
                } else {
                    Alert.alert("Lỗi", "Không thể lấy tọa độ cho địa chỉ này");
                }
            } catch (error) {
                console.error("Error processing location:", error);
                Alert.alert("Lỗi", "Có lỗi khi lấy thông tin vị trí.");
            }
        }
        onClose();
        setQuery("");
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.modalBackground}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <Animated.View
                        entering={FadeInDown}
                        exiting={SlideOutDown}
                        style={styles.modalContainer}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.primary + 'E6']}
                            style={styles.header}
                        >
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                                    <FontAwesome name="close" size={20} color="#fff" />
                                </BlurView>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Chọn khách sạn, điểm đến</Text>
                        </LinearGradient>

                        <View style={styles.content}>
                            <View style={styles.searchBarContainer}>
                                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Tìm khách sạn, điểm đến"
                                    placeholderTextColor="#666"
                                    value={query}
                                    onChangeText={handleSearch}
                                />
                                {query.length > 0 && (
                                    <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                                        <BlurView intensity={80} tint="light" style={styles.blurClear}>
                                            <Ionicons name="close-circle" size={20} color="#666" />
                                        </BlurView>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {query.length > 0 ? (
                                <FlatList
                                    data={results}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.resultItem}
                                            onPress={() => handleSelectLocation(item)}
                                        >
                                            <LinearGradient
                                                colors={['#fff', '#f8f9fa']}
                                                style={styles.resultGradient}
                                            >
                                                <Ionicons name="location-outline" size={20} color={colors.primary} />
                                                <Text style={styles.resultText}>{item.properties.label}</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    )}
                                    style={styles.resultsList}
                                />
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={styles.currentLocationButton}
                                        onPress={handleGetCurrentLocation}
                                    >
                                        <LinearGradient
                                            colors={['#fff', '#f8f9fa']}
                                            style={styles.locationGradient}
                                        >
                                            <View style={styles.locationIconContainer}>
                                                <Ionicons name="locate" size={20} color={colors.primary} />
                                            </View>
                                            <Text style={styles.currentLocationText}>Vị trí gần bạn</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <View style={styles.recentSection}>
                                        <View style={styles.recentHeader}>
                                            <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
                                            {searchHistory.length > 0 && (
                                                <TouchableOpacity onPress={handleClearRecentSearches}>
                                                    <Text style={styles.clearText}>Xóa tất cả</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <FlatList
                                            data={searchHistory.filter(item => item.location !== "Vị trí gần bạn").slice(0, 3)}
                                            keyExtractor={(item, index) => index.toString()}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={styles.recentItem}
                                                    onPress={() => {
                                                        onLocationSelected({
                                                            description: item.location,
                                                            latitude: item.latitude,
                                                            longitude: item.longitude
                                                        });
                                                        onClose();
                                                    }}
                                                >
                                                    <LinearGradient
                                                        colors={['#fff', '#f8f9fa']}
                                                        style={styles.recentGradient}
                                                    >
                                                        <Ionicons name="time-outline" size={20} color={colors.primary} />
                                                        <Text style={styles.recentText} numberOfLines={2}>{item.location}</Text>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                </>
                            )}
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        maxHeight: height * 0.8,
        ...Platform.select({
            android: {
                elevation: 5,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
        }),
    },
    header: {
        padding: 20,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1,
    },
    blurButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        marginLeft: 10,
    },
    blurClear: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    resultsList: {
        maxHeight: '80%',
    },
    resultItem: {
        marginBottom: 10,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    resultGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    resultText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    currentLocationButton: {
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    locationGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    locationIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f9ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    currentLocationText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    recentSection: {
        marginTop: 10,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    clearText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    recentItem: {
        marginBottom: 10,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    recentGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    recentText: {
        marginLeft: 5,
        fontSize: 16,
        color: '#333',
    },
});

export default LocationSearchModal;
