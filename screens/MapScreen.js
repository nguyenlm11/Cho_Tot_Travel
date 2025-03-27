import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Linking, StatusBar, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout, UrlTile, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { Ionicons, MaterialIcons } from 'react-native-vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';

const API_KEY = "MdlDIjhDKvUnozmB9NJjiW4L5Pu5ogxX";

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
    const [routeSteps, setRouteSteps] = useState([]);
    const [showRoute, setShowRoute] = useState(false);
    const [showDirections, setShowDirections] = useState(false);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [routeInfo, setRouteInfo] = useState({
        distance: '',
        duration: ''
    });
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

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
                Alert.alert(
                    'Quyền vị trí',
                    'Ứng dụng cần quyền truy cập vị trí của bạn để hiển thị bản đồ đầy đủ',
                    [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Cài đặt', onPress: () => Linking.openSettings() }
                    ]
                );
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setUserLocation({
                latitude,
                longitude,
            });
            calculateAirDistance({ latitude, longitude }, destinationCoordinate);
        } catch (error) {
            console.error('Lỗi lấy vị trí:', error);
        }
    };

    const calculateAirDistance = (origin, destination) => {
        const R = 6371; // Bán kính Trái Đất, km
        const dLat = (destination.latitude - origin.latitude) * Math.PI / 180;
        const dLon = (destination.longitude - origin.longitude) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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
            if (status !== 'granted') {
                Alert.alert('Quyền vị trí', 'Ứng dụng cần quyền truy cập vị trí của bạn');
                return null;
            }
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

    const decodePolyline = (encoded) => {
        if (!encoded) {
            return [];
        }
        const poly = [];
        let index = 0, len = encoded.length;
        let lat = 0, lng = 0;
        while (index < len) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);

            const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;
            const point = {
                latitude: lat * 1e-5,
                longitude: lng * 1e-5
            };
            poly.push(point);
        }
        return poly;
    };

    const fetchRoute = async () => {
        const currentLocation = await getUserLocation();
        if (!currentLocation) return;
        setUserLocation(currentLocation);
        setShowRoute(true);
        setLoadingRoute(true);

        const url = `https://mapapis.openmap.vn/v1/direction?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destinationCoordinate.latitude},${destinationCoordinate.longitude}&vehicle=car&alternatives=true&apikey=${API_KEY}`;
        try {
            const response = await axios.get(url);

            if (response.data && response.data.routes && response.data.routes.length > 0) {
                const route = decodePolyline(response.data.routes[0].overview_polyline.points);
                setRouteCoordinates(route);

                const steps = response.data.routes[0].legs[0].steps || [];
                const formattedSteps = steps.map(step => {
                    let instruction = step.html_instructions ?
                        step.html_instructions.replace(/<[^>]*>/g, '') :
                        'Di chuyển tiếp theo';

                    instruction = instruction
                        .replace(/Turn right/g, 'Rẽ phải')
                        .replace(/Turn left/g, 'Rẽ trái')
                        .replace(/Head north/g, 'Đi về hướng Bắc')
                        .replace(/Head south/g, 'Đi về hướng Nam')
                        .replace(/Head east/g, 'Đi về hướng Đông')
                        .replace(/Head west/g, 'Đi về hướng Tây')
                        .replace(/Continue/g, 'Tiếp tục')
                        .replace(/straight/g, 'thẳng')
                        .replace(/onto/g, 'vào')
                        .replace(/Destination/g, 'Điểm đến')
                        .replace(/will be/g, 'sẽ ở')
                        .replace(/on the right/g, 'bên phải')
                        .replace(/on the left/g, 'bên trái');

                    if (instruction.indexOf('Rẽ') === -1 &&
                        instruction.indexOf('Đi') === -1 &&
                        instruction.indexOf('Tiếp tục') === -1 &&
                        instruction.indexOf('Điểm đến') === -1) {
                        instruction = 'Tiếp tục đi thẳng';
                    }
                    return {
                        instruction: instruction,
                        distance: step.distance ? step.distance.text.replace('km', 'km').replace('m', 'm') : '',
                        duration: step.duration ? step.duration.text.replace('mins', 'phút').replace('min', 'phút') : '',
                        startLocation: step.start_location ? {
                            latitude: step.start_location.lat,
                            longitude: step.start_location.lng
                        } : null,
                        endLocation: step.end_location ? {
                            latitude: step.end_location.lat,
                            longitude: step.end_location.lng
                        } : null,
                        polyline: step.polyline ? decodePolyline(step.polyline.points) : []
                    };
                });
                setRouteSteps(formattedSteps);
                setCurrentStepIndex(0);

                const distance = response.data.routes[0].legs[0].distance.text.replace('km', 'km').replace('m', 'm') || '';
                const duration = response.data.routes[0].legs[0].duration.text.replace('mins', 'phút').replace('min', 'phút') || '';
                setRouteInfo({
                    distance,
                    duration
                });

                if (mapRef.current) {
                    mapRef.current.fitToCoordinates(route, {
                        edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
                        animated: true,
                    });
                }
            } else {
                Alert.alert("Thông báo", "Không thể lấy tuyến đường từ API");
                setShowRoute(false);
            }
        } catch (error) {
            console.error("Lỗi tải tuyến đường:", error);
            Alert.alert("Thông báo", "Không thể tải tuyến đường");
        } finally {
            setLoadingRoute(false);
        }
    };

    const handleCenterMap = () => {
        if (mapRef.current) {
            if (showRoute && routeCoordinates.length > 0) {
                mapRef.current.fitToCoordinates(routeCoordinates, {
                    edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
                    animated: true,
                });
            } else if (userLocation) {
                mapRef.current.fitToCoordinates(
                    [userLocation, destinationCoordinate],
                    {
                        edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
                        animated: true
                    }
                );
            } else {
                mapRef.current.animateToRegion({
                    latitude: destinationCoordinate.latitude,
                    longitude: destinationCoordinate.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }, 500);
            }
        }
    };

    const goToNextStep = () => {
        if (currentStepIndex < routeSteps.length - 1) {
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);

            if (mapRef.current && routeSteps[nextIndex].startLocation) {
                mapRef.current.animateToRegion({
                    latitude: routeSteps[nextIndex].startLocation.latitude,
                    longitude: routeSteps[nextIndex].startLocation.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }, 500);
            }
        }
    };

    const goToPreviousStep = () => {
        if (currentStepIndex > 0) {
            const prevIndex = currentStepIndex - 1;
            setCurrentStepIndex(prevIndex);

            if (mapRef.current && routeSteps[prevIndex].startLocation) {
                mapRef.current.animateToRegion({
                    latitude: routeSteps[prevIndex].startLocation.latitude,
                    longitude: routeSteps[prevIndex].startLocation.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }, 500);
            }
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
                    urlTemplate={`https://maptiles.openmap.vn/styles/day-v1/tiles/{z}/{x}/{y}.png?apikey=${API_KEY}`}
                    maximumZ={19}
                    flipY={false}
                />

                {showRoute && routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeWidth={3}
                        strokeColor={colors.primary}
                        lineDashPattern={[0]}
                    />
                )}

                {showDirections && routeSteps.length > 0 && routeSteps[currentStepIndex].polyline?.length > 0 && (
                    <Polyline
                        coordinates={routeSteps[currentStepIndex].polyline}
                        strokeWidth={6}
                        strokeColor="#FF9800"
                        lineDashPattern={[0]}
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

                {showDirections && routeSteps.length > 0 && routeSteps[currentStepIndex].startLocation && (
                    <Marker coordinate={routeSteps[currentStepIndex].startLocation}>
                        <View style={styles.stepMarker}>
                            <MaterialIcons name="directions" size={24} color="#FF9800" />
                        </View>
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

            {/* Bottom Panel */}
            <Animated.View
                entering={FadeInDown}
                style={styles.bottomPanel}
            >
                {!showDirections && (
                    <>
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

                            <TouchableOpacity
                                style={styles.navigateButton}
                                onPress={() => {
                                    if (showRoute && routeSteps.length > 0) {
                                        setShowDirections(true);
                                    } else {
                                        fetchRoute().then(() => {
                                            setShowDirections(true);
                                        });
                                    }
                                }}
                                activeOpacity={0.8}
                                disabled={loadingRoute}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.primary + 'E6']}
                                    style={styles.gradientButton}
                                >
                                    <MaterialIcons name="navigation" size={18} color="#fff" />
                                    <Text style={styles.navigateButtonText}>Chỉ đường chi tiết</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {showDirections && routeSteps.length > 0 && (
                    <View style={styles.directionsContainer}>
                        <View style={styles.directionsHeader}>
                            <TouchableOpacity
                                style={styles.closeDirectionsButton}
                                onPress={() => setShowDirections(false)}
                            >
                                <Ionicons name="arrow-back" size={22} color={colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.directionsTitle}>Chỉ đường chi tiết</Text>
                            <Text style={styles.stepCounter}>
                                {currentStepIndex + 1}/{routeSteps.length}
                            </Text>
                        </View>

                        <View style={styles.stepContainer}>
                            <View style={styles.stepIconContainer}>
                                <MaterialIcons name="directions" size={24} color="#FF9800" />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepInstruction}>
                                    {routeSteps[currentStepIndex].instruction}
                                </Text>
                                <View style={styles.stepInfoRow}>
                                    <Text style={styles.stepDistance}>
                                        {routeSteps[currentStepIndex].distance}
                                    </Text>
                                    <Text style={styles.stepDuration}>
                                        {routeSteps[currentStepIndex].duration}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.navigationControls}>
                            <TouchableOpacity
                                style={[
                                    styles.navButton,
                                    currentStepIndex === 0 && styles.disabledButton
                                ]}
                                onPress={goToPreviousStep}
                                disabled={currentStepIndex === 0}
                            >
                                <MaterialIcons
                                    name="arrow-back"
                                    size={22}
                                    color={currentStepIndex === 0 ? "#aaa" : colors.primary}
                                />
                                <Text
                                    style={[
                                        styles.navButtonText,
                                        currentStepIndex === 0 && styles.disabledButtonText
                                    ]}
                                >
                                    Trước
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.navButton,
                                    currentStepIndex === routeSteps.length - 1 && styles.disabledButton
                                ]}
                                onPress={goToNextStep}
                                disabled={currentStepIndex === routeSteps.length - 1}
                            >
                                <Text
                                    style={[
                                        styles.navButtonText,
                                        currentStepIndex === routeSteps.length - 1 && styles.disabledButtonText
                                    ]}
                                >
                                    Tiếp
                                </Text>
                                <MaterialIcons
                                    name="arrow-forward"
                                    size={22}
                                    color={currentStepIndex === routeSteps.length - 1 ? "#aaa" : colors.primary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
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
    activeButton: {
        backgroundColor: '#666',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginLeft: 5,
    },
    activeButtonText: {
        color: '#fff',
    },
    navigateButton: {
        flex: 1,
        borderRadius: 10,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    navigateButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
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
    stepMarker: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FF9800',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },
    directionsContainer: {
        padding: 15,
    },
    directionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    closeDirectionsButton: {
        padding: 5,
    },
    directionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    stepCounter: {
        fontSize: 14,
        color: '#666',
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
    },
    stepIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    stepContent: {
        flex: 1,
    },
    stepInstruction: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
        marginBottom: 6,
    },
    stepInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepDistance: {
        fontSize: 13,
        color: '#666',
    },
    stepDuration: {
        fontSize: 13,
        color: '#666',
    },
    navigationControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    navButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginHorizontal: 5,
    },
    disabledButton: {
        backgroundColor: '#f5f5f5',
    },
    disabledButtonText: {
        color: '#aaa',
    }
});