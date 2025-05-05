import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUser } from '../contexts/UserContext';
import bookingApi from '../services/api/bookingApi';
import moment from 'moment';
import QRCodeModal from '../components/Modal/QRCodeModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
moment.locale('vi');

const STATUS_MAPPING = {
    0: { text: 'Chưa thanh toán', color: '#FAD961', icon: 'time-outline' },
    1: { text: 'Đã thanh toán', color: '#4CAF50', icon: 'checkmark-circle' },
    2: { text: 'Đang phục vụ', color: '#29B6F6', icon: 'sync-outline' },
    3: { text: 'Hoàn thành', color: '#8BC34A', icon: 'checkmark-done-circle' },
    4: { text: 'Đã hủy', color: '#F44336', icon: 'close-circle' },
    5: { text: 'Không đến', color: '#9E9E9E', icon: 'remove-circle' },
    6: { text: 'Yêu cầu hoàn trả', color: '#FF9800', icon: 'cash-outline' }
};

const CACHE_DURATION = 5 * 60 * 1000;

const BookingItem = React.memo(({ item, index, onPress, onQRPress }) => {
    const navigation = useNavigation();
    const formattedDate = useMemo(() =>
        moment(item.bookingDate).isValid()
            ? moment(item.bookingDate).format('DD/MM/YYYY')
            : 'Không xác định'
        , [item.bookingDate]);

    const formattedTotal = useMemo(() =>
        typeof item.total === 'number'
            ? item.total.toLocaleString('vi-VN')
            : '0'
        , [item.total]);

    return (
        <Animated.View
            entering={FadeInDown.delay(Math.min(index * 50, 500)).springify()}
            style={[
                styles.bookingCard,
                { borderTopWidth: 15, borderTopColor: STATUS_MAPPING[item.status]?.color }
            ]}
        >
            <TouchableOpacity
                onPress={() => onQRPress(item.bookingID)}
                style={styles.bookingContent}
                activeOpacity={0.8}
            >
                <View style={styles.cardHeaderSection}>
                    <TouchableOpacity
                        style={styles.hotelInfoContainer}
                        onPress={() => onPress(item.bookingID)}
                    >
                        <Ionicons name="bed" size={22} color={colors.primary} style={styles.hotelIcon} />
                        <Text style={styles.hotelName} numberOfLines={1}>
                            {item.homeStay?.name || 'Không có tên'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.statusContainer}>
                        <LinearGradient
                            colors={[STATUS_MAPPING[item.status]?.color, shadeColor(STATUS_MAPPING[item.status]?.color, -20)]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.statusBadge}
                        >
                            <Ionicons name={STATUS_MAPPING[item.status]?.icon} size={16} color="#fff" />
                            <Text style={styles.statusText}>{STATUS_MAPPING[item.status]?.text}</Text>
                        </LinearGradient>
                    </View>
                </View>

                <View style={styles.cardBodySection}>
                    <View style={styles.bookingInfoRow}>
                        <View style={styles.bookingInfoItem}>
                            <Text style={styles.bookingInfoLabel}>Mã đặt phòng</Text>
                            <Text style={styles.bookingInfoValue}>#{item.bookingID || 'N/A'}</Text>
                        </View>

                        <View style={styles.bookingInfoItem}>
                            <Text style={styles.bookingInfoLabel}>Ngày đặt</Text>
                            <Text style={styles.bookingInfoValue}>{formattedDate}</Text>
                        </View>
                    </View>

                    {item.bookingDetails?.[0] && (
                        <View style={styles.bookingDatesContainer}>
                            <View style={styles.dateBox}>
                                <Text style={styles.dateBoxLabel}>Nhận phòng</Text>
                                <Text style={styles.dateBoxValue}>
                                    {moment(item.bookingDetails[0].checkInDate).format('DD/MM/YYYY')}
                                </Text>
                            </View>

                            <Ionicons name="arrow-forward" size={16} color="#999" style={styles.dateArrow} />

                            <View style={styles.dateBox}>
                                <Text style={styles.dateBoxLabel}>Trả phòng</Text>
                                <Text style={styles.dateBoxValue}>
                                    {moment(item.bookingDetails[0].checkOutDate).format('DD/MM/YYYY')}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.guestInfoContainer}>
                        <Text style={styles.guestInfoLabel}>
                            <Ionicons name="people-outline" size={14} color="#666" /> {item.numberOfAdults || 0} người lớn
                        </Text>
                        {item.numberOfChildren > 0 && (
                            <Text style={styles.guestInfoLabel}>
                                <Ionicons name="person-outline" size={14} color="#666" /> {item.numberOfChildren} trẻ em
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.cardFooterSection}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Tổng thanh toán</Text>
                        <Text style={styles.totalPrice}>{formattedTotal}₫</Text>
                    </View>

                    <View style={styles.actionsContainer}>
                        {item.status === 3 && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.reviewButton]}
                                onPress={() => navigation.navigate('Review', { bookingId: item.bookingID, homeStayID: item.homeStayID })}
                            >
                                <Ionicons name="star-outline" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Đánh giá</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.actionButton, styles.detailButton]}
                            onPress={() => onPress(item.bookingID)}
                        >
                            <Text style={styles.actionButtonText}>Xem chi tiết</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.item.bookingID === nextProps.item.bookingID &&
        prevProps.item.status === nextProps.item.status &&
        prevProps.item.total === nextProps.item.total
    );
});

// Tách component FilterTab để tối ưu render
const FilterTab = React.memo(({ status, value, onPress, isActive }) => (
    <TouchableOpacity
        style={[styles.tabItem, isActive && styles.activeTab]}
        onPress={onPress}
    >
        <Ionicons
            name={value.icon}
            size={14}
            color={isActive ? '#fff' : '#666'}
            style={styles.tabIcon}
        />
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
            {value.text}
        </Text>
        {isActive && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
));

export default function BookingListScreen() {
    const navigation = useNavigation();
    const { userData } = useUser();
    const [filterStatus, setFilterStatus] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState({
        initial: true,
        refresh: false,
        filter: false
    });
    const [error, setError] = useState(null);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState(0);

    const fetchBookings = useCallback(async (forceRefresh = false) => {
        if (!userData?.userID) {
            setLoading(prev => ({ ...prev, initial: false }));
            setBookings([]);
            return;
        }

        try {
            setLoading(prev => ({ ...prev, initial: true }));

            // Kiểm tra thời gian từ lần fetch cuối cùng
            const now = Date.now();
            const timeSinceLastFetch = now - lastFetchTime;
            const shouldUseCache = !forceRefresh && timeSinceLastFetch < CACHE_DURATION;

            if (shouldUseCache) {
                const cached = await AsyncStorage.getItem(`bookings_${userData.userID}`);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    if (now - timestamp < CACHE_DURATION) {
                        setBookings(data);
                        setLoading(prev => ({ ...prev, initial: false }));
                        return;
                    }
                }
            }

            const result = await bookingApi.getBookingsByAccountID(userData.userID);
            if (result?.success && Array.isArray(result.data)) {
                const sortedBookings = result.data.sort((a, b) =>
                    new Date(b.bookingDate) - new Date(a.bookingDate)
                );

                setBookings(prevBookings => {
                    const newBookings = [...sortedBookings];
                    AsyncStorage.setItem(`bookings_${userData.userID}`, JSON.stringify({
                        data: newBookings,
                        timestamp: now
                    })).catch(console.error);
                    return newBookings;
                });
                setLastFetchTime(now);
            } else {
                setBookings([]);
                setError('Dữ liệu đặt phòng không hợp lệ');
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách đặt phòng:', error);
            setError('Không thể tải danh sách đặt phòng');
        } finally {
            setLoading(prev => ({ ...prev, initial: false }));
        }
    }, [userData?.userID, lastFetchTime]);

    // Thêm useEffect để fetch data khi component mount
    useEffect(() => {
        fetchBookings(true);
    }, []);

    // Thêm useEffect để fetch data khi screen được focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            // Kiểm tra thời gian từ lần fetch cuối cùng
            const now = Date.now();
            const timeSinceLastFetch = now - lastFetchTime;

            // Nếu đã quá 30 giây kể từ lần fetch cuối cùng, fetch lại data
            if (timeSinceLastFetch > 30000) {
                fetchBookings(true);
            }
        });

        return unsubscribe;
    }, [navigation, fetchBookings, lastFetchTime]);

    const groupedBookingsList = useMemo(() => {
        if (!Array.isArray(bookings)) return [];

        const filtered = filterStatus !== null
            ? bookings.filter(booking => booking.status === parseInt(filterStatus))
            : bookings;

        const grouped = {};
        filtered.forEach(booking => {
            if (!booking.bookingDate) return;
            const month = moment(booking.bookingDate).format('MM/YYYY');
            grouped[month] = grouped[month] || [];
            grouped[month].push(booking);
        });

        return Object.entries(grouped)
            .map(([month, monthBookings]) => ({
                month,
                bookings: monthBookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
            }))
            .sort((a, b) => {
                const [monthA, yearA] = a.month.split('/');
                const [monthB, yearB] = b.month.split('/');
                return new Date(yearB, monthB - 1) - new Date(yearA, monthA - 1);
            });
    }, [bookings, filterStatus]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBookings(true).finally(() => setRefreshing(false));
    }, [fetchBookings]);

    const handleBookingPress = useCallback((bookingId) => {
        navigation.navigate('BookingDetail', { bookingId });
    }, [navigation]);

    const handleQRPress = useCallback((bookingId) => {
        setSelectedBookingId(bookingId);
        setModalVisible(true);
    }, []);

    const handleFilterPress = useCallback((status) => {
        setFilterStatus(status);
        setLoading(prev => ({ ...prev, filter: true }));
        setTimeout(() => {
            setLoading(prev => ({ ...prev, filter: false }));
        }, 300);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Đặt phòng của tôi</Text>
                    <Text style={styles.headerSubtitle}>Quản lý tất cả các đặt phòng của bạn</Text>
                </View>
            </LinearGradient>

            <View style={styles.filterTabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScrollContainer}
                >
                    <FilterTab
                        status={null}
                        value={{ text: 'Tất cả', icon: 'apps-outline' }}
                        onPress={() => handleFilterPress(null)}
                        isActive={filterStatus === null}
                    />
                    {Object.entries(STATUS_MAPPING).map(([key, value]) => (
                        <FilterTab
                            key={key}
                            status={parseInt(key)}
                            value={value}
                            onPress={() => handleFilterPress(parseInt(key))}
                            isActive={filterStatus === parseInt(key)}
                        />
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={groupedBookingsList}
                keyExtractor={(item) => item.month}
                renderItem={({ item: group }) => (
                    <View style={styles.monthGroup}>
                        <View style={styles.monthHeaderContainer}>
                            <Text style={styles.monthHeader}>
                                {formatMonthYear(group.month)}
                            </Text>
                            <View style={styles.bookingCount}>
                                <Text style={styles.bookingCountText}>
                                    {group.bookings.length} đặt phòng
                                </Text>
                            </View>
                        </View>
                        {group.bookings.map((booking, index) => (
                            <BookingItem
                                key={booking.bookingID}
                                item={booking}
                                index={index}
                                onPress={handleBookingPress}
                                onQRPress={handleQRPress}
                            />
                        ))}
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading.initial && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
                            <Text style={styles.emptyTitle}>Chưa có đặt phòng nào</Text>
                            <Text style={styles.emptyText}>
                                {error || 'Bạn chưa có đặt phòng nào. Hãy bắt đầu đặt phòng ngay!'}
                            </Text>
                            <TouchableOpacity
                                style={styles.exploreButton}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={styles.exploreButtonText}>Khám phá ngay</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
                ListFooterComponent={
                    (loading.initial || loading.filter) && (
                        <View style={styles.loadingContent}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>
                                {loading.filter ? 'Đang lọc...' : 'Đang tải danh sách đặt phòng...'}
                            </Text>
                        </View>
                    )
                }
            />

            <QRCodeModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                bookingId={selectedBookingId}
            />
        </View>
    );
}

function formatMonthYear(monthYear) {
    const [month, year] = monthYear.split('/');
    return `Tháng ${month} năm ${year}`;
}

function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = (R > 0) ? R : 0;
    G = (G > 0) ? G : 0;
    B = (B > 0) ? B : 0;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    headerContent: {
        width: '100%',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    filterTabsContainer: {
        marginTop: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    tabScrollContainer: { paddingVertical: 8 },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabIcon: { marginRight: 6 },
    activeTab: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    tabText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    activeIndicator: { display: 'none' },
    listContainer: {
        paddingTop: 10,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    monthSection: { marginBottom: 20 },
    monthHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingLeft: 4,
    },
    monthHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    bookingCount: {
        backgroundColor: colors.primary + '20',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    bookingCountText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
    },
    bookingCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    bookingContent: { padding: 0 },
    cardHeaderSection: {
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
    },
    hotelInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        flex: 1,
    },
    hotelIcon: { marginRight: 10 },
    hotelName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
        flex: 1,
    },
    statusContainer: { alignSelf: 'flex-start' },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '700',
        marginLeft: 6,
    },
    cardBodySection: { padding: 16 },
    bookingInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    bookingInfoItem: { flex: 1 },
    bookingInfoLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    bookingInfoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    bookingDatesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    dateBox: { flex: 1 },
    dateBoxLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    dateBoxValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    dateArrow: { marginHorizontal: 80 },
    guestInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    guestInfoLabel: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    cardFooterSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        padding: 16,
    },
    priceContainer: { flex: 1 },
    priceLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    totalPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    reviewButton: {
        backgroundColor: '#FFC107',
    },
    detailButton: {
        backgroundColor: colors.secondary,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 15,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    browseButton: {
        borderRadius: 12,
        overflow: 'hidden',
        width: 200,
    },
    browseButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    noResultsContainer: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noResultsText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 20,
    },
    resetFilterButton: {
        backgroundColor: colors.primary + '20',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    resetFilterText: {
        color: colors.primary,
        fontWeight: '600',
    },
    filterLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    monthGroup: {
        marginBottom: 20,
    },
    listContent: {
        paddingTop: 10,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    exploreButton: {
        backgroundColor: colors.primary,
        paddingVertical: 15,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginTop: 20,
    },
    exploreButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});