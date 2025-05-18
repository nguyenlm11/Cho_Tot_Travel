import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Image, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useCart } from '../contexts/CartContext';
import { colors } from '../constants/Colors';
import Animated, { SlideInRight, FadeInDown, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function CartBadge({ params = {} }) {
    const navigation = useNavigation();
    const { getCartCount, getRoomsByParams, removeRoomFromCart, fetchRoomPrice, checkDateType, getPriceByDateType } = useCart();
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0);
    const [roomPrices, setRoomPrices] = useState({});
    const [showPriceBreakdown, setShowPriceBreakdown] = useState({});
    const [dateTypes, setDateTypes] = useState({});
    const [datePrices, setDatePrices] = useState({});
    const safeParams = params || {};
    const cartCount = getCartCount(safeParams);
    const selectedRooms = getRoomsByParams(safeParams);

    const calculateNumberOfNights = useCallback((room) => {
        if (!room || !room.checkInDate || !room.checkOutDate) return 1;
        const checkIn = new Date(room.checkInDate);
        const checkOut = new Date(room.checkOutDate);
        const diffTime = Math.abs(checkOut - checkIn);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    }, []);

    const getDateCountsByType = useCallback((room) => {
        const result = {
            normal: { count: 0, price: 0 },
            weekend: { count: 0, price: 0 },
            special: { count: 0, price: 0 }
        };
        if (!room || !room.checkInDate || !room.checkOutDate) return result;
        const checkIn = new Date(room.checkInDate);
        const nights = calculateNumberOfNights(room);
        for (let i = 0; i < nights; i++) {
            const currentDate = new Date(checkIn);
            currentDate.setDate(currentDate.getDate() + i);
            const dateString = currentDate.toISOString().split('T')[0];
            const key = `${room.roomID}_${dateString}`;
            const dateType = dateTypes[key];
            const datePrice = datePrices[key] || 0;
            if (dateType === 0) {
                result.normal.count++;
                result.normal.price += datePrice;
            } else if (dateType === 1) {
                result.weekend.count++;
                result.weekend.price += datePrice;
            } else if (dateType === 2) {
                result.special.count++;
                result.special.price += datePrice;
            } else {
                result.normal.count++;
                result.normal.price += datePrice;
            }
        }
        return result;
    }, [calculateNumberOfNights, dateTypes, datePrices]);

    useEffect(() => {
        const fetchPrices = async () => {
            if (selectedRooms.length === 0) {
                setTotalPrice(0);
                return;
            }
            setLoading(true);
            try {
                const pricePromises = selectedRooms.map(room => fetchRoomPrice(room));
                const prices = await Promise.all(pricePromises);
                const newRoomPrices = {};
                let total = 0;
                selectedRooms.forEach((room, index) => {
                    const price = prices[index];
                    if (price !== null && price !== undefined) {
                        newRoomPrices[room.roomID] = price;
                        total += price;
                    } else {
                        newRoomPrices[room.roomID] = room.price || 0;
                        total += room.price || 0;
                    }
                });
                setRoomPrices(newRoomPrices);
                setTotalPrice(total);
            } catch (error) {
                const newRoomPrices = {};
                let total = 0;
                selectedRooms.forEach(room => {
                    newRoomPrices[room.roomID] = room.price || 0;
                    total += room.price || 0;
                });
                setRoomPrices(newRoomPrices);
                setTotalPrice(total);
            } finally {
                setLoading(false);
            }
        };
        fetchPrices();
    }, [selectedRooms.map(room => room.roomID).join(','), fetchRoomPrice]);

    useEffect(() => {
        const fetchDateTypes = async () => {
            if (selectedRooms.length === 0) return;
            const newDateTypes = {};
            const newDatePrices = {};
            for (const room of selectedRooms) {
                if (!room || !room.checkInDate || !room.checkOutDate) continue;
                const checkIn = new Date(room.checkInDate);
                const nights = calculateNumberOfNights(room);
                for (let i = 0; i < nights; i++) {
                    const currentDate = new Date(checkIn);
                    currentDate.setDate(currentDate.getDate() + i);
                    const dateString = currentDate.toISOString().split('T')[0];
                    const key = `${room.roomID}_${dateString}`;
                    if (!newDateTypes[key]) {
                        const dateType = await checkDateType(dateString, room.rentalId, room.roomTypeID);
                        newDateTypes[key] = dateType;
                        const price = await getPriceByDateType(room.roomTypeID, dateType);
                        newDatePrices[key] = price;
                    }
                }
            }
            setDateTypes(newDateTypes);
            setDatePrices(newDatePrices);
        };
        fetchDateTypes();
    }, [selectedRooms, checkDateType, getPriceByDateType, calculateNumberOfNights]);

    const handleViewCart = () => setModalVisible(true);
    const handleProceedToCheckout = () => {
        setModalVisible(false);
        navigation.navigate('Checkout', safeParams);
    };

    const handleRemoveRoom = (roomID) => removeRoomFromCart(roomID);
    if (cartCount === 0) return null;
    const renderRoomItem = ({ item }) => {
        const roomPrice = roomPrices[item.roomID] !== undefined
            ? roomPrices[item.roomID]
            : (item.price || 0);
        const dateCounts = getDateCountsByType(item);
        const hasDateTypes = dateCounts.normal.count > 0 || dateCounts.weekend.count > 0 || dateCounts.special.count > 0;
        const togglePriceBreakdown = () => {
            setShowPriceBreakdown(prev => ({
                ...prev,
                [item.roomID]: !prev[item.roomID]
            }));
        };
        return (
            <View style={styles.roomItem}>
                <Image
                    source={{ uri: item.image || 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg' }}
                    style={styles.roomImage}
                />
                <View style={styles.roomInfo}>
                    <Text style={styles.roomTypeName}>{item.roomTypeName}</Text>
                    <Text style={styles.roomNumber}>Phòng {item.roomNumber}</Text>

                    {loading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <View style={styles.priceDetails}>
                            {hasDateTypes && (
                                <TouchableOpacity
                                    style={styles.priceDetailsToggle}
                                    onPress={togglePriceBreakdown}
                                >
                                    <Text style={styles.priceDetailsToggleText}>
                                        {showPriceBreakdown[item.roomID] ? 'Ẩn chi tiết giá' : 'Xem chi tiết giá'}
                                    </Text>
                                    <FontAwesome
                                        name={showPriceBreakdown[item.roomID] ? 'chevron-up' : 'chevron-down'}
                                        size={12}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                            )}
                            {showPriceBreakdown[item.roomID] && (
                                <View style={styles.priceBreakdown}>
                                    {hasDateTypes && (
                                        <>
                                            {dateCounts.normal.count > 0 && (
                                                <View style={styles.priceBreakdownRow}>
                                                    <Text style={styles.priceBreakdownLabel}>Ngày thường ({dateCounts.normal.count} đêm):</Text>
                                                    <Text style={styles.priceBreakdownValue}>
                                                        {dateCounts.normal.price.toLocaleString()}₫
                                                    </Text>
                                                </View>
                                            )}
                                            {dateCounts.weekend.count > 0 && (
                                                <View style={styles.priceBreakdownRow}>
                                                    <Text style={styles.priceBreakdownLabel}>Cuối tuần ({dateCounts.weekend.count} đêm):</Text>
                                                    <Text style={styles.priceBreakdownValue}>
                                                        {dateCounts.weekend.price.toLocaleString()}₫
                                                    </Text>
                                                </View>
                                            )}
                                            {dateCounts.special.count > 0 && (
                                                <View style={styles.priceBreakdownRow}>
                                                    <Text style={styles.priceBreakdownLabel}>Ngày đặc biệt ({dateCounts.special.count} đêm):</Text>
                                                    <Text style={styles.priceBreakdownValue}>
                                                        {dateCounts.special.price.toLocaleString()}₫
                                                    </Text>
                                                </View>
                                            )}
                                        </>
                                    )}
                                </View>
                            )}
                            <View style={styles.totalPriceRow}>
                                <Text style={styles.totalPriceLabel}>Tổng giá:</Text>
                                <Text style={styles.totalPriceValue}>{roomPrice.toLocaleString('vi-VN')}₫</Text>
                            </View>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveRoom(item.roomID)}
                >
                    <BlurView intensity={80} tint="dark" style={styles.removeButtonBlur}>
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
            </View>
        );
    };

    const renderCartModal = () => (
        <Modal
            visible={modalVisible}
            transparent={true}
            animationType="none"
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalBackground}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

                <Animated.View
                    style={styles.modalContainer}
                    entering={FadeInDown}
                    exiting={SlideOutDown}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primary + 'E6']}
                        style={styles.modalHeader}
                    >
                        <Text style={styles.modalTitle}>Phòng đã chọn</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <BlurView intensity={80} tint="dark" style={styles.closeButtonBlur}>
                                <FontAwesome name="close" size={16} color="#fff" />
                            </BlurView>
                        </TouchableOpacity>
                    </LinearGradient>

                    <FlatList
                        data={selectedRooms}
                        keyExtractor={(item) => item.id}
                        renderItem={renderRoomItem}
                        contentContainerStyle={styles.roomsList}
                        ListEmptyComponent={
                            <View style={styles.emptyCart}>
                                <Text style={styles.emptyCartText}>Không có phòng nào trong giỏ</Text>
                            </View>
                        }
                    />

                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryInfo}>
                            <Text style={styles.summaryText}>Tổng cộng ({cartCount} phòng)</Text>
                            <Text style={styles.summaryPrice}>
                                {loading ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    `${totalPrice.toLocaleString('vi-VN')}₫`
                                )}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.checkoutButton}
                            onPress={handleProceedToCheckout}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.checkoutButtonGradient}
                            >
                                <Text style={styles.checkoutButtonText}>Tiến hành đặt phòng</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );

    return (
        <>
            <Animated.View
                style={styles.container}
                entering={SlideInRight.springify()}
            >
                <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                    <View style={styles.contentContainer}>
                        <View style={styles.infoContainer}>
                            <View style={styles.countContainer}>
                                <Text style={styles.countText}>{cartCount}</Text>
                            </View>
                            <Text style={styles.totalText}>
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    `${totalPrice.toLocaleString('vi-VN')}₫`
                                )}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.viewButton} onPress={handleViewCart}>
                            <Text style={styles.viewButtonText}>Xem</Text>
                            <Ionicons name="chevron-forward" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </Animated.View>
            {renderCartModal()}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 100,
    },
    blurContainer: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#333',
    },
    contentContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countContainer: {
        backgroundColor: colors.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    countText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    totalText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    viewButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginRight: 4,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    closeButtonBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roomsList: {
        padding: 12,
    },
    roomItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    roomImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
    },
    roomInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    roomTypeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    roomNumber: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    priceDetails: {
        marginTop: 4,
    },
    priceDetailsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        borderRadius: 4,
    },
    priceDetailsToggleText: {
        color: colors.primary,
        fontSize: 12,
        marginRight: 4,
    },
    priceBreakdown: {
        marginTop: 4,
        marginBottom: 4,
    },
    priceBreakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    priceBreakdownLabel: {
        fontSize: 13,
        color: '#666',
    },
    priceBreakdownValue: {
        fontSize: 13,
        color: '#333',
    },
    totalPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
        paddingTop: 2,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    totalPriceLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    totalPriceValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
    },
    removeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        alignSelf: 'center',
    },
    removeButtonBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCart: {
        padding: 24,
        alignItems: 'center',
    },
    emptyCartText: {
        fontSize: 16,
        color: '#666',
    },
    summaryContainer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        padding: 16,
    },
    summaryInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 14,
        color: '#666',
    },
    summaryPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    checkoutButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    checkoutButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
    },
    checkoutButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
}); 