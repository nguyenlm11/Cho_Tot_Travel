import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import roomApi from '../services/api/roomApi';
import { useCart } from '../contexts/CartContext';
import CartBadge from '../components/CartBadge';

export default function RoomTypeScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const homeStayId = route.params?.homeStayId;
    const rentalId = route.params?.rentalId;
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getRoomsByType, getCartCount, setHomeStay, setRental } = useCart();

    useEffect(() => {
        fetchRoomTypes();
    }, [homeStayId]);

    useEffect(() => {
        if (homeStayId) {
            setHomeStay(homeStayId);
        }
        if (rentalId) {
            setRental(rentalId);
        }
    }, [homeStayId, rentalId]);

    const fetchRoomTypes = async () => {
        setLoading(true);
        try {
            const data = await roomApi.getAllRoomTypesByRentalId(rentalId);
            if (Array.isArray(data) && data.length > 0) {
                setRoomTypes(data);
                setError(null);
            } else {
                setRoomTypes([]);
                setError('Không tìm thấy loại phòng nào');
            }
        } catch (err) {
            console.error('Error fetching room types:', err);
            setError('Không thể tải thông tin loại phòng. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const params = {};
    if (homeStayId) params.homeStayId = homeStayId;
    if (rentalId) params.rentalId = rentalId;
    const handleSelectRoom = (roomType) => {
        const navParams = { roomTypeId: roomType.roomTypesID, roomTypeName: roomType.name };
        if (homeStayId) navParams.homeStayId = homeStayId;
        if (rentalId) navParams.rentalId = rentalId;
        navigation.navigate('ListRoom', navParams);
    };

    const RoomTypeCard = ({ item, index }) => {
        const scale = useSharedValue(1);
        const handlePressIn = () => {
            scale.value = withSpring(0.98);
        };

        const handlePressOut = () => {
            scale.value = withSpring(1);
        };

        const defaultPricing = item.pricings?.find(p => p.isDefault) || item.pricings?.[0];
        const price = defaultPricing?.rentPrice || defaultPricing?.unitPrice;

        const selectedRoomsCount = getRoomsByType(item.roomTypeID, params).length;

        return (
            <Animated.View
                style={styles.cardContainer}
                entering={FadeInDown.delay(index * 100).springify()}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                >
                    <Animated.View style={[styles.roomCard]}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={{
                                    uri: item.imageRoomTypes?.[0]?.image ||
                                        'https://res.cloudinary.com/dzjofylpf/image/upload/v1742915319/HomeStayImages/placeholder.jpg'
                                }}
                                style={styles.roomImage}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
                                style={styles.imageGradient}
                            />
                            <View style={styles.priceBadge}>
                                <LinearGradient
                                    colors={[colors.primary + 'CC', colors.secondary + 'CC']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.priceGradient}
                                >
                                    <Text style={styles.priceText}>
                                        {price?.toLocaleString('vi-VN')}₫
                                        <Text style={styles.perNightText}>/đêm</Text>
                                    </Text>
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Room Info */}
                        <View style={styles.roomInfo}>
                            <View style={styles.roomHeader}>
                                <Text style={styles.roomName}>{item.name}</Text>
                                <View style={styles.capacityBadge}>
                                    <FontAwesome5 name="users" size={14} color={colors.primary} />
                                    <Text style={styles.capacityText}>
                                        {item.maxPeople} người
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.roomDescription} numberOfLines={2}>
                                {item.description}
                            </Text>

                            <View style={styles.amenitiesContainer}>
                                <View style={styles.amenityItem}>
                                    <View style={styles.amenityIconContainer}>
                                        <FontAwesome5 name="bed" size={14} color={colors.primary} />
                                    </View>
                                    <Text style={styles.amenityText}>{item.numberBedRoom}</Text>
                                </View>

                                <View style={styles.amenityItem}>
                                    <View style={styles.amenityIconContainer}>
                                        <FontAwesome5 name="bath" size={14} color={colors.primary} />
                                    </View>
                                    <Text style={styles.amenityText}>{item.numberBathRoom}</Text>
                                </View>

                                <View style={styles.amenityItem}>
                                    <View style={styles.amenityIconContainer}>
                                        <FontAwesome5 name="wifi" size={14} color={colors.primary} />
                                    </View>
                                    <Text style={styles.amenityText}>{item.numberWifi}</Text>
                                </View>
                                <View style={styles.amenityDivider} />
                                <View style={styles.amenityItem}>
                                    <View style={styles.amenityIconContainer}>
                                        <MaterialIcons name="person" size={14} color={colors.primary} />
                                    </View>
                                    <Text style={styles.amenityText}>{item.maxAdults}</Text>
                                </View>

                                <View style={styles.amenityItem}>
                                    <View style={styles.amenityIconContainer}>
                                        <MaterialIcons name="child-care" size={14} color={colors.primary} />
                                    </View>
                                    <Text style={styles.amenityText}>{item.maxChildren}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.selectButton}
                                onPress={() => handleSelectRoom(item)}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.secondary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.selectButtonGradient}
                                >
                                    <FontAwesome5 name="check-circle" size={16} color="#fff" style={styles.selectIcon} />
                                    <Text style={styles.selectButtonText}>Chọn phòng</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {selectedRoomsCount > 0 && (
                            <View style={styles.selectedBadge}>
                                <LinearGradient
                                    colors={[colors.primary, colors.secondary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.selectedBadgeGradient}
                                >
                                    <Text style={styles.selectedBadgeText}>{selectedRoomsCount} phòng đã chọn</Text>
                                </LinearGradient>
                            </View>
                        )}
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải thông tin phòng...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            <LinearGradient
                colors={[colors.primary, colors.primary + 'E6']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Animated.Text
                    entering={FadeInDown.delay(300).springify()}
                    style={styles.headerTitle}
                    numberOfLines={1}
                >
                    Danh sách phòng
                </Animated.Text>
                <View style={styles.rightPlaceholder} />
            </LinearGradient>

            <FlatList
                data={roomTypes}
                keyExtractor={(item) => `room-type-${item.roomTypesID}`}
                renderItem={({ item, index }) => <RoomTypeCard item={item} index={index} />}
                contentContainerStyle={[
                    styles.listContainer,
                    { paddingBottom: getCartCount(params) > 0 ? 80 : 16 }
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !loading && error ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="bed-outline" size={80} color={colors.textSecondary} />
                            <Text style={styles.emptyText}>{error}</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchRoomTypes}>
                                <Text style={styles.retryText}>Thử lại</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />
            <CartBadge params={params} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    rightPlaceholder: {
        width: 40,
    },
    listContainer: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    cardContainer: {
        marginTop: 10,
        marginHorizontal: 14,
        marginBottom: 20,
    },
    roomCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 16,
        shadowColor: colors.primary + '90',
        shadowOffset: { width: 0, height: 9 },
        shadowOpacity: 1,
        shadowRadius: 20,
    },
    imageContainer: {
        height: 180,
        width: '100%',
        position: 'relative',
    },
    roomImage: {
        width: '100%',
        height: '100%',
    },
    imageGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    priceBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    priceGradient: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    priceText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    perNightText: {
        fontSize: 12,
        fontWeight: 'normal',
    },
    roomInfo: {
        padding: 16,
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    roomName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    capacityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    capacityText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    roomDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    amenitiesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 10,
        paddingHorizontal: 8,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 8,
    },
    amenityItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    amenityIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    amenityText: {
        fontSize: 12,
        color: '#555',
    },
    amenityDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: 4,
    },
    selectButton: {
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    selectButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
    },
    selectIcon: {
        marginRight: 8,
    },
    selectButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    selectedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        borderRadius: 12,
        overflow: 'hidden',
        zIndex: 10,
    },
    selectedBadgeGradient: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    selectedBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
}); 