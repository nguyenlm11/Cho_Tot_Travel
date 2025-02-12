import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { UrlTile, Marker, Polyline, Callout } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';

const API_KEY = "MdlDIjhDKvUnozmB9NJjiW4L5Pu5ogxX";

export default function MapScreen() {
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [showRoute, setShowRoute] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const mapRef = useRef(null);
    const navigation = useNavigation();

    const destinationCoordinate = {
        latitude: 10.343964,
        longitude: 107.094963,
    };

    const getUserLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Lỗi", "Ứng dụng cần quyền truy cập vị trí để hoạt động");
            return null;
        }

        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    };

    const decodePolyline = (encoded) => {
        let points = [];
        let index = 0, len = encoded.length;
        let lat = 0, lng = 0;

        while (index < len) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
        }

        return points;
    };

    const fetchRoute = async () => {
        const currentLocation = await getUserLocation();
        if (!currentLocation) return;

        setUserLocation(currentLocation);
        setShowRoute(true);
        const url = `https://mapapis.openmap.vn/v1/direction?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destinationCoordinate.latitude},${destinationCoordinate.longitude}&vehicle=car&alternatives=true&apikey=${API_KEY}`;

        try {
            const response = await axios.get(url);

            if (response.data && response.data.routes && response.data.routes.length > 0) {
                const route = decodePolyline(response.data.routes[0].overview_polyline.points);
                setRouteCoordinates(route);

                if (mapRef.current) {
                    mapRef.current.fitToCoordinates(route, {
                        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
                        animated: true,
                    });
                }
            } else {
                Alert.alert("Lỗi", "Không thể lấy tuyến đường từ API");
                setShowRoute(false);
            }
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tải tuyến đường");
            setShowRoute(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Nút quay lại */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Quay lại</Text>
            </TouchableOpacity>

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

                {/* Marker điểm đến */}
                <Marker coordinate={destinationCoordinate}>
                    <Callout>
                        <View style={styles.calloutContainer}>
                            <Text style={styles.calloutTitle}>Khách sạn The Imperial Vũng Tàu</Text>
                        </View>
                    </Callout>
                </Marker>

                {/* Marker vị trí người dùng */}
                {userLocation && (
                    <Marker coordinate={userLocation}>
                        <Callout>
                            <View style={styles.calloutContainer}>
                                <Text style={styles.calloutTitle}>Vị trí của bạn</Text>
                            </View>
                        </Callout>
                    </Marker>
                )}

                {showRoute && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor="#007AFF"
                        strokeWidth={3}
                    />
                )}
            </MapView>

            <TouchableOpacity style={styles.button} onPress={fetchRoute}>
                <Text style={styles.buttonText}>Chỉ đường</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        backgroundColor: colors.textPrimary,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        zIndex: 10,
    },
    backButtonText: {
        color: colors.textThird,
        fontSize: 16,
        fontWeight: 'bold',
    },
    button: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginBottom: 15,
    },
    buttonText: {
        color: colors.textThird,
        fontSize: 18,
    },
    calloutContainer: {
        backgroundColor: colors.textThird,
        borderRadius: 8,
    },
    calloutTitle: {
        fontWeight: 'bold',
        fontSize: 14,
    },
});

