import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Platform, Alert, Image, } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import roomApi from '../services/api/roomApi';
import moment from 'moment';
import CalendarModal from '../components/Modal/CalendarModal';
import { useSearch } from '../contexts/SearchContext';

export default function ListRoomScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { rentalId, roomTypeId, roomTypeName } = route.params;
    const { currentSearch, updateCurrentSearch } = useSearch();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const formattedCheckInDate = currentSearch?.checkInDate ?
        currentSearch.checkInDate.split(', ')[1] : null;
    const formattedCheckOutDate = currentSearch?.checkOutDate ?
        currentSearch.checkOutDate.split(', ')[1] : null;

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        if (!roomTypeId || !currentSearch?.formattedCheckIn || !currentSearch?.formattedCheckOut) {
            setError('Thiếu thông tin để tìm phòng. Vui lòng thử lại.');
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await roomApi.filterRoomsByRoomTypeAndDates(
                roomTypeId,
                currentSearch.formattedCheckIn,
                currentSearch.formattedCheckOut
            );
            if (Array.isArray(data) && data.length > 0) {
                setRooms(data);
                setError(null);
            } else {
                setRooms([]);
                setError('Không tìm thấy phòng nào phù hợp trong thời gian này');
            }
        } catch (err) {
            console.error('Error fetching rooms:', err);
            setError('Không thể tải thông tin phòng. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setIsUpdating(false);
        }
    };

    const toggleRoomSelection = (room) => {
        setSelectedRooms(prevSelected => {
            const isSelected = prevSelected.some(item => item.roomID === room.roomID);
            if (isSelected) {
                return prevSelected.filter(item => item.roomID !== room.roomID);
            } else {
                return [...prevSelected, room];
            }
        });
    };

    const handleProcessBooking = () => {
        if (selectedRooms.length === 0) return;
        const roomIDs = selectedRooms.map(room => room.roomID);
        navigation.navigate('Checkout', {
            rentalId,
            roomTypeId,
            roomIDs,
            checkInDate: currentSearch.formattedCheckIn,
            checkOutDate: currentSearch.formattedCheckOut,
        });
    };

    const handleDateSelect = (dateInfo) => {
        const updatedSearch = {
            ...currentSearch,
            checkInDate: dateInfo.formattedDate,
            formattedCheckIn: dateInfo.dateString,
            checkOutDate: dateInfo.formattedCheckOutDate,
            formattedCheckOut: dateInfo.checkOutDateString,
        };
        updateCurrentSearch(updatedSearch);
        setCalendarVisible(false);
    };

    const updateSearch = () => {
        if (!currentSearch?.formattedCheckIn || !currentSearch?.formattedCheckOut) {
            Alert.alert("Thông báo", "Vui lòng chọn đầy đủ ngày check-in và check-out");
            return;
        }
        setIsUpdating(true);
        setSelectedRooms([]);
        fetchRooms();
    };

    const RoomItem = ({ item, index }) => {
        const scale = useSharedValue(1);
        const isSelected = selectedRooms.some(room => room.roomID === item.roomID);
        const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 15 }) };
        const handlePressOut = () => { scale.value = withSpring(1, { damping: 15 }) };
        const handleSelectRoom = () => { toggleRoomSelection(item) };

        const animatedStyle = useAnimatedStyle(() => {
            return {
                transform: [{ scale: scale.value }],
            };
        });

        return (
            <Animated.View
                style={styles.itemContainer}
                entering={FadeInDown.delay(index * 80).springify()}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleSelectRoom}
                >
                    <Animated.View
                        style={[styles.roomCard, isSelected && styles.selectedRoomCard, animatedStyle]}>
                        <View style={styles.roomImageContainer}>
                            <Image
                                source={{ uri: item.image || 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg' }}
                                style={styles.roomImage}
                            />
                            <View style={styles.roomNumberContainer}>
                                <LinearGradient
                                    colors={[isSelected ? colors.secondary : colors.primary, isSelected ? colors.primary : colors.secondary]}
                                    style={styles.roomNumberBadge}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.roomNumberText}>{item.roomNumber}</Text>
                                </LinearGradient>
                            </View>
                        </View>

                        <View style={styles.roomContent}>
                            <View style={styles.roomInfoSection}>
                                <Text style={styles.roomName}>Phòng {item.roomNumber}</Text>
                            </View>

                            <View style={styles.roomDetailsContainer}>
                                <View style={styles.featureContainer}>
                                    <View style={styles.featureItem}>
                                        <LinearGradient
                                            colors={[colors.primary + '20', colors.primary + '10']}
                                            style={styles.featureIconContainer}
                                        >
                                            <FontAwesome5 name="bed" size={14} color={colors.primary} />
                                        </LinearGradient>
                                        <Text style={styles.featureText}>{item.beds} giường</Text>
                                    </View>

                                    <View style={styles.featureItem}>
                                        <LinearGradient
                                            colors={[colors.primary + '20', colors.primary + '10']}
                                            style={styles.featureIconContainer}
                                        >
                                            <FontAwesome5 name="calendar-check" size={14} color={colors.primary} />
                                        </LinearGradient>
                                        <Text style={styles.featureText}>Có sẵn</Text>
                                    </View>
                                </View>
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
    };

    const FilterHeader = () => (
        <Animated.View style={styles.filterBar}>
            <View style={styles.filterChipsContainer}>
                <TouchableOpacity
                    style={styles.filterChip}
                    onPress={() => setCalendarVisible(true)}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
                        style={styles.filterChipGradient}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#fff" />
                        <Text style={styles.filterText}>
                            {formattedCheckInDate || 'Ngày nhận'} - {formattedCheckOutDate || 'Ngày trả'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.editButton}
                onPress={updateSearch}
                disabled={isUpdating}
            >
                <BlurView intensity={80} tint="dark" style={styles.editButtonBlur}>
                    {isUpdating ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <View style={styles.editButtonContent}>
                            <Ionicons name="refresh-outline" size={18} color="#fff" />
                            <Text style={styles.editButtonText}>Cập nhật</Text>
                        </View>
                    )}
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );

    const LoadingState = () => (
        <View style={styles.loadingContainer}>
            <View style={styles.loadingIconContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
        </View>
    );

    const EmptyState = () => (
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
                onPress={() => setCalendarVisible(true)}
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
    );

    const renderBookingFooter = () => {
        const totalRooms = selectedRooms.length;
        const totalPrice = selectedRooms.reduce((sum, room) => sum + room.price, 0);

        return (
            <Animated.View style={styles.bookingFooter}>
                <TouchableOpacity
                    style={[styles.proceedButton, totalRooms === 0 && styles.disabledButton]}
                    onPress={handleProcessBooking}
                    disabled={totalRooms === 0}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.proceedButtonGradient}
                    >
                        <Text style={styles.proceedButtonText}>
                            {totalRooms > 0 ? `Đặt ${totalRooms} phòng` : 'Chọn phòng'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    if (loading && !refreshing && !isUpdating) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
                <LinearGradient
                    colors={[colors.primary + '30', colors.primary + '10']}
                    style={styles.loadingIconContainer}
                >
                    <ActivityIndicator size="large" color={colors.primary} />
                </LinearGradient>
                <Text style={styles.loadingText}>Đang tìm phòng trống...</Text>
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
            <FilterHeader />
            <FlatList
                data={rooms}
                keyExtractor={(item) => `room-${item.roomID}`}
                renderItem={({ item, index }) => <RoomItem item={item} index={index} />}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={!loading && error ? <EmptyState /> : null}
            />
            {renderBookingFooter()}
            <CalendarModal
                visible={isCalendarVisible}
                onClose={() => setCalendarVisible(false)}
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
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.primary + 'DD',
    },
    filterChipsContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    filterChip: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        marginRight: 8,
    },
    filterChipGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    filterText: {
        color: '#fff',
        marginLeft: 6,
        fontWeight: '500',
    },
    editButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    editButtonBlur: {
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        overflow: 'hidden',
    },
    editButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    editButtonText: {
        color: '#fff',
        fontWeight: '500',
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
    roomDetailsContainer: {
        marginTop: 8,
        padding: 12,
        backgroundColor: colors.primary + '05',
        borderRadius: 12,
    },
    featureContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureIconContainer: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 14,
        color: '#444',
        fontWeight: '500',
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
    bookingFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    proceedButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    disabledButton: {
        opacity: 0.7,
    },
    proceedButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    proceedButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        marginRight: 6,
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
});