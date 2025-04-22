import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, StatusBar, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout, UrlTile, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { Ionicons, MaterialIcons } from 'react-native-vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';

const ORS_API_KEY = '5b3ce3597851110001cf62488da097349649497fab084c37b8c4d6cc';
const ORS_API_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

export default function MapScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const mapRef = useRef(null);

    const {
        latitude = 0.0,
        longitude = 0.0,
        title = 'Không xác định',
        address = 'Địa chỉ không xác định',
    } = route.params || {};

    const [userLocation, setUserLocation] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [showRoute, setShowRoute] = useState(false);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [routeInfo, setRouteInfo] = useState({
        distance: '',
        duration: ''
    });

    const destinationCoordinate = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
    };

    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Quyền vị trí', 'Ứng dụng cần quyền truy cập vị trí của bạn');
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setUserLocation({ latitude, longitude });
            calculateAirDistance({ latitude, longitude }, destinationCoordinate);
        } catch (error) {
            console.error('Lỗi lấy vị trí:', error);
        }
    };

    const calculateAirDistance = (origin, destination) => {
        const R = 6371;
        const dLat = (destination.latitude - origin.latitude) * Math.PI / 180;
        const dLon = (destination.longitude - origin.longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(origin.latitude * Math.PI / 180) * Math.cos(destination.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        setRouteInfo({
            distance: `${distance.toFixed(1)} km`,
            duration: `${Math.round(distance * 3)} phút`
        });
    };

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return null;
            const location = await Location.getCurrentPositionAsync({});
            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };
        } catch (error) {
            console.error('Lỗi lấy vị trí:', error);
            return null;
        }
    };

    const fetchRoute = async () => {
        const currentLocation = await getUserLocation();
        if (!currentLocation) {
            Alert.alert("Thông báo", "Không thể lấy vị trí hiện tại của bạn. Vui lòng kiểm tra lại quyền truy cập vị trí.");
            return;
        }
        setUserLocation(currentLocation);
        setLoadingRoute(true);
        setShowRoute(true);

        try {
            const url = `${ORS_API_URL}`;
            const requestBody = {
                coordinates: [
                    [currentLocation.longitude, currentLocation.latitude],
                    [destinationCoordinate.longitude, destinationCoordinate.latitude]
                ],
                options: {
                    avoid_borders: "all",
                }
            };

            const response = await axios.post(url, requestBody, {
                headers: {
                    'Authorization': `Bearer ${ORS_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 3000
            });

            if (response.data?.routes?.[0]) {
                const route = response.data.routes[0];
                const decodedGeometry = decodePolyline(route.geometry);
                const routeCoords = decodedGeometry.map(coord => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));
                setRouteCoordinates(routeCoords);
                const totalDistance = route.summary.distance / 1000;
                const totalDuration = Math.round(route.summary.duration / 60);

                setRouteInfo({
                    distance: `${totalDistance.toFixed(1)} km`,
                    duration: `${totalDuration} phút`
                });

                if (mapRef.current) {
                    mapRef.current.fitToCoordinates(routeCoords, {
                        edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
                        animated: true,
                    });
                }
            } else {
                throw new Error("Không tìm thấy tuyến đường");
            }
        } catch (error) {
            console.error("Lỗi tải tuyến đường:", error);
            if (error.response) {
                console.error("Error response:", error.response.data);
            }
            Alert.alert(
                "Thông báo",
                error.message || "Không thể tải tuyến đường. Vui lòng thử lại sau."
            );
            setShowRoute(false);
        } finally {
            setLoadingRoute(false);
        }
    };

    // Helper function to decode polyline
    const decodePolyline = (encoded) => {
        const points = [];
        let index = 0, lat = 0, lng = 0;

        while (index < encoded.length) {
            let shift = 0, result = 0;
            let byte;
            do {
                byte = encoded.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                byte = encoded.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            points.push([lng * 1e-5, lat * 1e-5]);
        }

        return points;
    };

    const handleCenterMap = () => {
        if (mapRef.current && userLocation) {
            mapRef.current.fitToCoordinates(
                [userLocation, destinationCoordinate],
                {
                    edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
                    animated: true
                }
            );
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: destinationCoordinate.latitude,
                    longitude: destinationCoordinate.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
            >
                <UrlTile
                    urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maximumZ={19}
                    flipY={false}
                />

                {showRoute && routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeWidth={4}
                        strokeColor={colors.primary}
                    />
                )}

                <Marker coordinate={destinationCoordinate}>
                    <View style={styles.destinationMarker}>
                        <MaterialIcons name="location-on" size={36} color={colors.primary} />
                    </View>
                    <Callout tooltip>
                        <View style={styles.calloutContainer}>
                            <Text style={styles.calloutTitle}>{title}</Text>
                            <Text style={styles.calloutAddress}>{address}</Text>
                        </View>
                    </Callout>
                </Marker>

                {userLocation && (
                    <Marker coordinate={userLocation}>
                        <View style={styles.userMarker}>
                            <View style={styles.userMarkerDot} />
                        </View>
                        <Callout>
                            <View style={styles.calloutContainer}>
                                <Text style={styles.calloutTitle}>Vị trí của bạn</Text>
                            </View>
                        </Callout>
                    </Marker>
                )}
            </MapView>

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <BlurView intensity={80} tint="light" style={styles.blurButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.primary} />
                    </BlurView>
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <BlurView intensity={80} tint="light" style={styles.headerTitleBlur}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                    </BlurView>
                </View>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCenterMap}
                >
                    <BlurView intensity={80} tint="light" style={styles.blurButton}>
                        <Ionicons name="locate" size={22} color={colors.primary} />
                    </BlurView>
                </TouchableOpacity>
            </View>

            <View style={styles.mapControls}>
                <TouchableOpacity
                    style={styles.mapControlButton}
                    onPress={() => {
                        if (userLocation) {
                            mapRef.current.animateToRegion({
                                latitude: userLocation.latitude,
                                longitude: userLocation.longitude,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005
                            }, 500);
                        }
                    }}
                >
                    <BlurView intensity={80} tint="light" style={styles.controlBlur}>
                        <MaterialIcons name="my-location" size={22} color={colors.primary} />
                    </BlurView>
                </TouchableOpacity>
            </View>

            <Animated.View
                entering={FadeInDown}
                style={styles.bottomPanel}
            >
                <View style={styles.locationInfoContainer}>
                    <MaterialIcons name="place" size={22} color={colors.primary} />
                    <View style={styles.locationTextContainer}>
                        <Text style={styles.locationTitle} numberOfLines={1}>{title}</Text>
                        <Text style={styles.locationAddress} numberOfLines={2}>{address}</Text>
                    </View>
                </View>

                {userLocation && (
                    <View style={styles.distanceInfoContainer}>
                        <View style={styles.distanceItem}>
                            <MaterialIcons name="directions-car" size={16} color="#666" />
                            <Text style={styles.distanceText}>{routeInfo.distance}</Text>
                        </View>
                        <View style={styles.distanceItem}>
                            <MaterialIcons name="access-time" size={16} color="#666" />
                            <Text style={styles.distanceText}>{routeInfo.duration}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={[styles.directionButton, showRoute && styles.activeButton]}
                        onPress={() => {
                            if (loadingRoute) return;
                            if (showRoute) {
                                setShowRoute(false);
                            } else {
                                fetchRoute();
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        {loadingRoute ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <MaterialIcons
                                    name="directions"
                                    size={18}
                                    color={showRoute ? "#fff" : colors.primary}
                                />
                                <Text style={[
                                    styles.buttonText,
                                    showRoute && styles.activeButtonText
                                ]}>
                                    {showRoute ? 'Ẩn đường đi' : 'Hiển thị đường đi'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        zIndex: 10,
    },
    backButton: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    actionButton: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    blurButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    headerTitleContainer: {
        flex: 1,
        marginHorizontal: 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    headerTitleBlur: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    mapControls: {
        position: 'absolute',
        right: 15,
        top: Platform.OS === 'ios' ? 110 : 100,
        alignItems: 'center',
        zIndex: 5,
    },
    mapControlButton: {
        marginBottom: 10,
        borderRadius: 22,
        overflow: 'hidden',
    },
    controlBlur: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomPanel: {
        position: 'absolute',
        bottom: 20,
        left: 15,
        right: 15,
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
        paddingTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    locationInfoContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    locationTextContainer: {
        flex: 1,
        marginLeft: 10,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    locationAddress: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    distanceInfoContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    distanceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    distanceText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 5,
    },
    buttonsContainer: {
        flexDirection: 'row',
        padding: 15,
        paddingTop: 12,
    },
    directionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        paddingVertical: 12,
        borderRadius: 10,
        marginRight: 8,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginLeft: 5,
    },
    calloutContainer: {
        width: 200,
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    calloutAddress: {
        fontSize: 12,
        color: '#666',
    },
    destinationMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    userMarker: {
        height: 24,
        width: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 89, 152, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userMarkerDot: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: 'white',
    },
    activeButton: {
        backgroundColor: colors.primary,
    },
    activeButtonText: {
        color: '#fff',
    },
});