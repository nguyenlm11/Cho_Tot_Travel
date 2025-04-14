import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Platform, Alert, Image, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { colors } from '../constants/Colors';
import roomApi from '../services/api/roomApi';
import CalendarModal from '../components/Modal/CalendarModal';
import { useSearch } from '../contexts/SearchContext';
import { useCart } from '../contexts/CartContext';
import CartBadge from '../components/CartBadge';

const RoomItem = React.memo(({ item, index, onSelectRoom, isSelected }) => {
    const scale = useSharedValue(1);

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.97, { damping: 15 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 15 });
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <Animated.View
            style={[styles.itemContainer, animatedStyle]}
            entering={FadeInDown.delay(index * 80).springify()}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => onSelectRoom(item)}
            >
                <Animated.View
                    style={[styles.roomCard, isSelected && styles.selectedRoomCard]}>
                    <View style={styles.roomImageContainer}>
                        <Image
                            source={{ uri: 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg' }}
                            style={styles.roomImage}
                        />
                        <LinearGradient
                            colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.5)']}
                            style={styles.imageOverlay}
                        />
                        <View style={styles.roomNumberContainer}>
                            <LinearGradient
                                colors={[isSelected ? colors.secondary : colors.primary, isSelected ? colors.primary : colors.secondary]}
                                style={styles.roomNumberBadge}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.roomNumberText}>Phòng {item.roomNumber}</Text>
                            </LinearGradient>
                        </View>
                    </View>

                    <View style={styles.roomContent}>
                        <View style={styles.roomInfoSection}>
                            <Text style={styles.roomName}>Phòng {item.roomNumber}</Text>
                        </View>
                    </View>

                    {isSelected && (
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.selectedBadge}
                        >
                            <FontAwesome5 name="check-circle" size={16} color="#fff" solid />
                            <Text style={styles.selectedBadgeText}>Đã chọn</Text>
                        </LinearGradient>
                    )}
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
});

RoomItem.propTypes = {
    item: PropTypes.shape({
        roomID: PropTypes.number.isRequired,
        roomNumber: PropTypes.string.isRequired,
    }).isRequired,
    index: PropTypes.number.isRequired,
    onSelectRoom: PropTypes.func.isRequired,
    isSelected: PropTypes.bool.isRequired,
};

const FilterHeader = React.memo(({ onPress, checkInDate, checkOutDate }) => {
    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'Chưa chọn';

        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Định dạng không hợp lệ';
        }

        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }, []);

    return (
        <View style={styles.filterHeader}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
            >
                <TouchableOpacity style={styles.filterChip} onPress={onPress}>
                    <Ionicons name="calendar-outline" size={20} color="#ffffff" />
                    <Text style={styles.filterText}>
                        {formatDate(checkInDate)} - {formatDate(checkOutDate)}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
});

FilterHeader.propTypes = {
    onPress: PropTypes.func.isRequired,
    checkInDate: PropTypes.string,
    checkOutDate: PropTypes.string,
};

const LoadingState = React.memo(() => (
    <View style={styles.loadingContainer}>
        <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
    </View>
));

const EmptyState = React.memo(({ onRetry }) => (
    <View style={styles.emptyContainer}>
        <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6598/6598519.png' }}
            style={styles.emptyImage}
            resizeMode="contain"
        />
        <Text style={styles.emptyTitle}>Không tìm thấy phòng phù hợp</Text>
        <Text style={styles.emptyText}>
            Không có phòng nào phù hợp với tiêu chí tìm kiếm của bạn.
            Hãy thử thay đổi ngày hoặc tìm kiếm khác.
        </Text>
        <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
        >
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.retryButtonGradient}
            >
                <Text style={styles.retryText}>Thay đổi tìm kiếm</Text>
            </LinearGradient>
        </TouchableOpacity>
    </View>
));

EmptyState.propTypes = {
    onRetry: PropTypes.func.isRequired,
};

export default function ListRoomScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { currentSearch, updateCurrentSearch } = useSearch();
    const { addRoomToCart, removeRoomFromCart, isRoomInCart, getCartCount, clearCart } = useCart();

    const { roomTypeId, roomTypeName, homeStayId, rentalId } = route.params || {};

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCalendarVisible, setCalendarVisible] = useState(false);

    const params = useMemo(() => {
        const result = {};
        if (homeStayId) result.homeStayId = homeStayId;
        if (rentalId) result.rentalId = rentalId;
        return result;
    }, [homeStayId, rentalId]);

    const formattedCheckInDate = useMemo(() => 
        currentSearch?.checkInDate ? currentSearch.checkInDate.split(', ')[1] : null,
        [currentSearch?.checkInDate]
    );
    const formattedCheckOutDate = useMemo(() => 
        currentSearch?.checkOutDate ? currentSearch.checkOutDate.split(', ')[1] : null,
        [currentSearch?.checkOutDate]
    );

    const fetchRooms = useCallback(async () => {
        if (!roomTypeId) {
            setError("Không tìm thấy thông tin loại phòng");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const data = await roomApi.filterRoomsByRoomTypeAndDates(
                roomTypeId,
                currentSearch.formattedCheckIn,
                currentSearch.formattedCheckOut
            );
            if (Array.isArray(data) && data.length > 0) {
                setRooms(data);
            } else {
                setRooms([]);
                setError('Không tìm thấy phòng nào phù hợp');
            }
        } catch (err) {
            console.error('Error fetching rooms:', err);
            setError('Không thể tải thông tin phòng. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    }, [roomTypeId, currentSearch.formattedCheckIn, currentSearch.formattedCheckOut]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const toggleRoomSelection = useCallback((room) => {
        if (isRoomInCart(room.roomID)) {
            removeRoomFromCart(room.roomID);
        } else {
            addRoomToCart(
                room,
                { roomTypeID: roomTypeId, name: roomTypeName },
                params,
                currentSearch?.formattedCheckIn,
                currentSearch?.formattedCheckOut
            );
        }
    }, [isRoomInCart, removeRoomFromCart, addRoomToCart, roomTypeId, roomTypeName, params, currentSearch]);

    const handleDateSelect = useCallback(async (dateInfo) => {
        const updatedSearch = {
            ...currentSearch,
            checkInDate: dateInfo.formattedDate,
            formattedCheckIn: dateInfo.dateString,
            checkOutDate: dateInfo.formattedCheckOutDate,
            formattedCheckOut: dateInfo.checkOutDateString,
        };
        updateCurrentSearch(updatedSearch);
        setCalendarVisible(false);
        clearCart();
        setLoading(true);
        await fetchRooms();
    }, [currentSearch, updateCurrentSearch, clearCart, fetchRooms]);

    const renderRoomItem = useCallback(({ item, index }) => {
        const isSelected = isRoomInCart(item.roomID);
        return (
            <RoomItem
                item={item}
                index={index}
                isSelected={isSelected}
                onSelectRoom={toggleRoomSelection}
            />
        );
    }, [isRoomInCart, toggleRoomSelection]);

    const handleOpenCalendar = useCallback(() => {
        setCalendarVisible(true);
    }, []);

    const handleCloseCalendar = useCallback(() => {
        setCalendarVisible(false);
    }, []);

    if (loading) {
        return <LoadingState />;
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
                    <BlurView intensity={70} tint="dark" style={styles.backButtonBlur}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
                <Animated.Text
                    entering={FadeInDown.delay(300).springify()}
                    style={styles.headerTitle}
                    numberOfLines={1}
                >
                    {roomTypeName}
                </Animated.Text>
                <View style={styles.rightPlaceholder} />
            </LinearGradient>
            <FilterHeader
                onPress={handleOpenCalendar}
                checkInDate={formattedCheckInDate}
                checkOutDate={formattedCheckOutDate}
            />
            <FlatList
                data={rooms}
                keyExtractor={(item) => `room-${item.roomID}`}
                renderItem={renderRoomItem}
                contentContainerStyle={[
                    styles.listContainer,
                    { paddingBottom: getCartCount(params) > 0 ? 80 : 16 }
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={!loading && error ? <EmptyState onRetry={handleOpenCalendar} /> : null}
            />
            <CartBadge params={params} />
            <CalendarModal
                visible={isCalendarVisible}
                onClose={handleCloseCalendar}
                onDateSelect={handleDateSelect}
                selectedDate={currentSearch?.checkInDate}
            />
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonBlur: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    rightPlaceholder: {
        width: 40,
    },
    filterHeader: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    filterScrollContent: {
        paddingHorizontal: 15,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    filterText: {
        color: '#fff',
        marginLeft: 6,
        fontSize: 14,
    },
    listContainer: {
        paddingBottom: 100,
    },
    itemContainer: {
        marginHorizontal: 16,
        marginBottom: 12,
    },
    roomCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    selectedRoomCard: {
        borderColor: colors.primary,
        borderWidth: 2,
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    roomContent: {
        padding: 16,
        paddingTop: 24,
    },
    roomImageContainer: {
        position: 'relative',
    },
    roomImage: {
        width: '100%',
        height: 150,
        borderRadius: 16,
        resizeMode: 'cover',
    },
    roomNumberContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
    },
    roomNumberBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    roomNumberText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    roomInfoSection: {
        marginTop: 6,
    },
    roomName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#444',
    },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    selectedBadgeText: {
        color: '#fff',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.primary,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 24,
    },
    emptyImage: {
        width: 200,
        height: 150,
        resizeMode: 'contain',
        marginBottom: 16,
        opacity: 0.6,
        borderRadius: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    retryButtonGradient: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 16,
    },
});