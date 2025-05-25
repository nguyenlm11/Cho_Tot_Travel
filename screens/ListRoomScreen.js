import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform, Image, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import roomApi from '../services/api/roomApi';
import CalendarModal from '../components/Modal/CalendarModal';
import { useSearch } from '../contexts/SearchContext';
import { useCart } from '../contexts/CartContext';
import CartBadge from '../components/CartBadge';
import LoadingScreen from '../components/LoadingScreen';
import DropdownMenuTabs from '../components/DropdownMenuTabs';
import ImageViewer from '../components/ImageViewer';

const isIOS = Platform.OS === 'ios';
const STATUSBAR_HEIGHT = isIOS ? 44 : StatusBar.currentHeight;

const RoomItem = React.memo(({ item, index, onSelectRoom, isSelected }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isImageViewerVisible, setImageViewerVisible] = useState(false);
    const handleOpenImageViewer = () => { setImageViewerVisible(true) };
    const handleCloseImageViewer = () => { setImageViewerVisible(false) };
    const images = item?.imageRooms?.length > 0 ? item.imageRooms.map(img => ({ uri: img.image })) : [{ uri: 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg' }];

    return (
        <Animated.View
            style={styles.itemContainer}
            entering={FadeInDown.delay(index * 80).springify()}
        >
            <Animated.View
                style={[styles.roomCard, isSelected && styles.selectedRoomCard]}>
                <TouchableOpacity
                    style={styles.roomImageContainer}
                    onPress={handleOpenImageViewer}
                    activeOpacity={0.9}
                >
                    <Image
                        source={{ uri: item?.imageRooms[currentImageIndex]?.image || 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg' }}
                        style={styles.roomImage}
                        resizeMode="cover"
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
                            <Text style={styles.roomNumberText}>{item.rentPrice.toLocaleString()}đ</Text>
                            <Text style={styles.perNightText}>/đêm</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.roomNumberContainer2}>
                        <View style={styles.roomTypeBadge}>
                            <Text style={styles.roomTypeText}>Phòng {item.roomNumber}</Text>
                        </View>
                    </View>

                    {item.imageRooms.length > 1 && (
                        <View style={styles.imageIndicator}>
                            {item.imageRooms.map((_, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.indicatorDot,
                                        idx === currentImageIndex && styles.indicatorDotActive
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.roomContent}>
                    <View style={styles.roomInfoSection}>
                        <Text style={styles.roomName}>Phòng {item.roomNumber}</Text>
                        <View style={styles.roomFeatures}>
                            <View style={styles.featureItem}>
                                <MaterialIcons name="king-bed" size={16} color={colors.textSecondary} />
                                <Text style={styles.featureText}>{item.roomTypeName}</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.selectButton, isSelected && styles.selectedButton]}
                        onPress={() => onSelectRoom(item)}
                    >
                        <Text style={[styles.selectButtonText, isSelected && styles.selectedButtonText]}>
                            {isSelected ? 'Đã chọn' : 'Chọn phòng'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ImageViewer
                visible={isImageViewerVisible}
                onClose={handleCloseImageViewer}
                images={images}
                initialIndex={currentImageIndex}
            />
        </Animated.View>
    );
});

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
        <Animated.View
            style={styles.filterHeader}
            entering={FadeIn.delay(200).springify()}
        >
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
        </Animated.View>
    );
});

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

export default function ListRoomScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { currentSearch, updateCurrentSearch } = useSearch();
    const { addRoomToCart, removeRoomFromCart, isRoomInCart, clearCart } = useCart();
    const { roomTypeId, roomTypeName, homeStayId, rentalId, rentalName } = route.params || {};
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
            const roomType = {
                roomTypeID: roomTypeId,
                name: roomTypeName
            };
            addRoomToCart(
                room,
                roomType,
                {
                    homeStayId,
                    rentalId: rentalId,
                    rentalName: rentalName
                },
                currentSearch.formattedCheckIn,
                currentSearch.formattedCheckOut
            );
        }
    }, [roomTypeId, roomTypeName, homeStayId, rentalName, currentSearch, addRoomToCart, removeRoomFromCart, isRoomInCart]);

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
        return <LoadingScreen message="Đang tải danh sách phòng" subMessage="Vui lòng đợi trong giây lát..." />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <View style={styles.container}>
                <LinearGradient
                    colors={[colors.primary, colors.primary + 'E6']}
                    style={styles.header}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        {isIOS ? (
                            <BlurView intensity={70} tint="dark" style={styles.backButtonBlur}>
                                <Ionicons name="chevron-back" size={24} color="#fff" />
                            </BlurView>
                        ) : (
                            <View style={styles.backButtonAndroid}>
                                <Ionicons name="chevron-back" size={24} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Animated.Text
                        entering={FadeInDown.delay(300).springify()}
                        style={styles.headerTitle}
                        numberOfLines={1}
                    >
                        {roomTypeName}
                    </Animated.Text>
                    <DropdownMenuTabs
                        iconStyle={styles.menuButton}
                    />
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
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={!loading && error ? <EmptyState onRetry={handleOpenCalendar} /> : null}
                    refreshing={loading}
                    onRefresh={fetchRooms}
                />

                <View style={styles.cartBadgeContainer}>
                    <CartBadge params={params} />
                </View>
            </View>

            <CalendarModal
                visible={isCalendarVisible}
                onClose={handleCloseCalendar}
                onDateSelect={handleDateSelect}
                selectedDate={currentSearch?.checkInDate}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0,
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 10,
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
    backButtonAndroid: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    filterHeader: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingBottom: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    filterScrollContent: { paddingHorizontal: 15 },
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
        paddingTop: 16,
        paddingBottom: 120,
    },
    itemContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    roomCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    selectedRoomCard: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    roomContent: {
        padding: 16,
        paddingTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roomImageContainer: {
        position: 'relative',
        height: 180,
    },
    roomImage: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    roomNumberContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
    },
    roomNumberContainer2: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
    },
    roomNumberBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    roomNumberText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    perNightText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginLeft: 2,
    },
    roomTypeBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    roomTypeText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    roomInfoSection: {
        flex: 1,
        marginRight: 12,
    },
    roomName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    roomFeatures: {
        flexDirection: 'row',
        marginTop: 4,
        marginBottom: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    featureText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    selectButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.primary,
        minWidth: 100,
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: colors.secondary,
    },
    selectButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    selectedButtonText: {
        color: '#fff',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    emptyImage: {
        width: 200,
        height: 150,
        resizeMode: 'contain',
        marginBottom: 24,
        opacity: 0.6,
        borderRadius: 8,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 15,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    retryButtonGradient: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    cartBadgeContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
    },
});