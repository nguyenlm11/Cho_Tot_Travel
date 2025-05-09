import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, RefreshControl, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons, FontAwesome5, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import roomApi from '../services/api/roomApi';
import { useCart } from '../contexts/CartContext';
import CartBadge from '../components/CartBadge';
import DropdownMenuTabs from '../components/DropdownMenuTabs';
import LoadingScreen from '../components/LoadingScreen';

const palette = {
    primary: colors.primary,
    secondary: colors.secondary,
    background: '#f8f9fa',
    card: '#ffffff',
    cardBorder: '#eaeaea',
    text: { dark: '#2c3e50', medium: '#546e7a', light: '#78909c' },
};

export default function RoomTypeScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const homeStayId = route.params?.homeStayId;
    const rentalId = route.params?.rentalId;
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
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

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchRoomTypes();
        setRefreshing(false);
    }, []);

    const params = {};
    if (homeStayId) params.homeStayId = homeStayId;
    if (rentalId) params.rentalId = rentalId;

    console.log("RoomTypeScreen params:", params);
    console.log("Cart count:", getCartCount(params));

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

        // Cố gắng lấy roomTypeID đúng từ dữ liệu phòng
        const roomTypeID = item.roomTypeID || item.roomTypesID;
        console.log(`Room type ${item.name} ID:`, roomTypeID);
        
        const selectedRoomsCount = getRoomsByType(roomTypeID, params).length;

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
                    <Animated.View style={[styles.roomCard, { transform: [{ scale }] }]}>
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
                                    colors={[palette.primary, palette.secondary]}
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

                        <View style={styles.roomInfo}>
                            <View style={styles.roomHeader}>
                                <Text style={styles.roomName} numberOfLines={1}>{item.name}</Text>
                                <View style={styles.capacityBadge}>
                                    <FontAwesome5 name="users" size={14} color={palette.primary} />
                                    <Text style={styles.capacityText}>
                                        {item.maxPeople} người
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.roomDescription} numberOfLines={2}>
                                {item.description || 'Không có mô tả'}
                            </Text>

                            <View style={styles.amenitiesContainer}>
                                <View style={styles.amenityItem}>
                                    <View style={styles.amenityIconContainer}>
                                        <FontAwesome5 name="bed" size={14} color={palette.primary} />
                                    </View>
                                    <Text style={styles.amenityText}>{item.numberBedRoom || 0} giường</Text>
                                </View>

                                <View style={styles.amenityDivider} />

                                <View style={styles.amenityItem}>
                                    <View style={styles.amenityIconContainer}>
                                        <FontAwesome5 name="bath" size={14} color={palette.primary} />
                                    </View>
                                    <Text style={styles.amenityText}>{item.numberBathRoom || 0} phòng tắm</Text>
                                </View>

                                <View style={styles.amenityDivider} />

                                <View style={styles.amenityItem}>
                                    <View style={styles.amenityIconContainer}>
                                        <FontAwesome5 name="wifi" size={14} color={palette.primary} />
                                    </View>
                                    <Text style={styles.amenityText}>{item.numberWifi || 0} WiFi</Text>
                                </View>
                            </View>

                            <View style={styles.bottomSection}>
                                <View style={styles.infoContainer}>
                                    <View style={styles.infoItem}>
                                        <MaterialIcons name="child-care" size={16} color={palette.text.medium} />
                                        <Text style={styles.infoText}>{item.maxChildren || 0} trẻ em</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <MaterialIcons name="person" size={16} color={palette.text.medium} />
                                        <Text style={styles.infoText}>{item.maxAdults || 0} người lớn</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.selectButton}
                                    onPress={() => handleSelectRoom(item)}
                                >
                                    <LinearGradient
                                        colors={[palette.primary, palette.secondary]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.selectButtonGradient}
                                    >
                                        <Text style={styles.selectButtonText}>Chọn phòng</Text>
                                        <AntDesign name="arrowright" size={16} color="#fff" style={styles.selectIcon} />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {selectedRoomsCount > 0 && (
                            <View style={styles.selectedBadge}>
                                <LinearGradient
                                    colors={[palette.primary, palette.secondary]}
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

    if (loading && !refreshing) {
        return (
            <LoadingScreen 
                message="Đang tải thông tin phòng" 
                subMessage="Vui lòng đợi trong giây lát..." 
            />
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={palette.primary} />

            <LinearGradient
                colors={[palette.primary, palette.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
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
                    Danh sách loại phòng
                </Animated.Text>
                <DropdownMenuTabs
                    iconStyle={styles.menuButton}
                />
            </LinearGradient>

            <FlatList
                data={roomTypes}
                keyExtractor={(item) => `room-type-${item.roomTypesID}`}
                renderItem={({ item, index }) => <RoomTypeCard item={item} index={index} />}
                contentContainerStyle={[
                    styles.listContainer,
                    { paddingBottom: getCartCount(params) > 0 ? 100 : 20 }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={palette.primary}
                        colors={[palette.primary]}
                    />
                }
                ListEmptyComponent={
                    !loading && error ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="bed-outline" size={80} color={palette.text.light} />
                            <Text style={styles.emptyText}>{error}</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchRoomTypes}>
                                <LinearGradient
                                    colors={[palette.primary, palette.secondary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.retryGradient}
                                >
                                    <Text style={styles.retryText}>Thử lại</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />
            
            {getCartCount(params) > 0 && (
                <View style={styles.cartBadgeContainer}>
                    <CartBadge params={params} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
        position: 'relative',
        zIndex: 1,
        elevation: 1,
        overflow: 'visible',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    listContainer: {
        paddingTop: 20,
        paddingBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: palette.text.medium,
        marginTop: 12,
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 10,
    },
    retryGradient: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    cardContainer: {
        marginTop: 10,
        marginHorizontal: 16,
        marginBottom: 20,
    },
    roomCard: {
        backgroundColor: palette.card,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: palette.primary + '40',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: palette.cardBorder,
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
        borderRadius: 10,
        overflow: 'hidden',
    },
    priceGradient: {
        paddingHorizontal: 14,
        paddingVertical: 8,
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
        marginBottom: 10,
    },
    roomName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: palette.text.dark,
        flex: 1,
        marginRight: 10,
    },
    capacityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.primary + '15',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    capacityText: {
        fontSize: 13,
        color: palette.primary,
        fontWeight: '600',
    },
    roomDescription: {
        fontSize: 14,
        color: palette.text.medium,
        marginBottom: 16,
        lineHeight: 20,
    },
    amenitiesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: palette.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.cardBorder,
    },
    amenityItem: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'column',
    },
    amenityIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: palette.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    amenityText: {
        fontSize: 12,
        color: palette.text.medium,
        textAlign: 'center',
    },
    amenityDivider: {
        width: 1,
        height: 40,
        backgroundColor: palette.cardBorder,
        marginHorizontal: 8,
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoContainer: {
        flex: 1,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 13,
        color: palette.text.medium,
    },
    selectButton: {
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    selectButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    selectIcon: {
        marginLeft: 8,
    },
    selectButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    selectedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        borderRadius: 10,
        overflow: 'hidden',
        zIndex: 10,
        elevation: 5,
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
    cartBadgeContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        zIndex: 1000,
        elevation: 10,
    },
}); 