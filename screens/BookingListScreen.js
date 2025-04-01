import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl, ScrollView } from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useUser } from '../contexts/UserContext';
import bookingApi from '../services/api/bookingApi';
import moment from 'moment';
import QRCodeModal from '../components/Modal/QRCodeModal';
moment.locale('vi');

const STATUS_MAPPING = {
    0: { text: 'Đang xử lý', color: '#FAD961', icon: 'time-outline' },
    1: { text: 'Đã thanh toán', color: '#4CAF50', icon: 'checkmark-circle' },
    2: { text: 'Đang phục vụ', color: '#29B6F6', icon: 'sync-outline' },
    3: { text: 'Hoàn thành', color: '#8BC34A', icon: 'checkmark-done-circle' },
    4: { text: 'Đã hủy', color: '#F44336', icon: 'close-circle' },
    5: { text: 'Không đến', color: '#9E9E9E', icon: 'remove-circle' }
};

export default function BookingListScreen() {
    const navigation = useNavigation();
    const { userData } = useUser();
    const [filterStatus, setFilterStatus] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [groupedBookingsList, setGroupedBookingsList] = useState([]);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    console.log(bookings);

    useEffect(() => {
        fetchBookings();
    }, [userData]);

    useEffect(() => {
        processBookings();
    }, [bookings, filterStatus]);

    const fetchBookings = async () => {
        if (!userData?.userID) {
            setLoading(false);
            setBookings([]);
            return;
        }
        setLoading(true);
        try {
            const result = await bookingApi.getBookingsByAccountID(userData.userID);
            if (result && result.success) {
                if (Array.isArray(result.data)) {
                    setBookings(result.data);
                } else {
                    setBookings([]);
                    setError('Dữ liệu đặt phòng không hợp lệ');
                }
            } else {
                setBookings([]);
                setError(result?.error || 'Không nhận được dữ liệu hợp lệ');
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setBookings([]);
            setError('Đã xảy ra lỗi khi tải danh sách đặt phòng');
        } finally {
            setLoading(false);
        }
    };

    const processBookings = () => {
        if (!Array.isArray(bookings)) {
            setGroupedBookingsList([]);
            return;
        }
        const filtered = filterStatus !== null
            ? bookings.filter(booking => booking.status === parseInt(filterStatus))
            : bookings;
        const grouped = {};
        filtered.forEach(booking => {
            try {
                if (!booking.bookingDate) return;

                const month = moment(booking.bookingDate).format('MM/YYYY');
                grouped[month] = grouped[month] || [];
                grouped[month].push(booking);
            } catch (err) {
                console.error('Error processing booking:', err);
            }
        });

        const groupedList = Object.entries(grouped)
            .map(([month, monthBookings]) => ({
                month,
                bookings: monthBookings
            }))
            .sort((a, b) => {
                const [monthA, yearA] = a.month.split('/');
                const [monthB, yearB] = b.month.split('/');
                return new Date(yearB, monthB - 1) - new Date(yearA, monthA - 1);
            });
        setGroupedBookingsList(groupedList);
    };

    const renderHeader = () => (
        <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.header}
        >
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Đặt phòng của tôi</Text>
            </View>
        </LinearGradient>
    );

    const renderBookingItem = ({ item, index }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={[
                styles.bookingCard,
                { borderTopWidth: 20, borderTopColor: STATUS_MAPPING[item.status]?.color || '#999' }
            ]}
        >
            <TouchableOpacity
                onPress={() => {
                    setSelectedBookingId(item.bookingID);
                    setModalVisible(true);
                }}
                style={styles.bookingContent}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeaderSection}>
                    <View style={styles.hotelInfoContainer}>
                        <Ionicons name="bed" size={22} color={colors.primary} style={styles.hotelIcon} />
                        <Text style={styles.hotelName} numberOfLines={1}>
                            {item.homeStay?.name || 'Không có tên'}
                        </Text>
                    </View>

                    <View style={styles.statusContainer}>
                        <LinearGradient
                            colors={[STATUS_MAPPING[item.status]?.color || '#999', shadeColor(STATUS_MAPPING[item.status]?.color || '#999', -20)]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.statusBadge}
                        >
                            <Ionicons
                                name={STATUS_MAPPING[item.status]?.icon || 'information-circle'}
                                size={16}
                                color="#fff"
                            />
                            <Text style={styles.statusText}>
                                {STATUS_MAPPING[item.status]?.text || 'Không xác định'}
                            </Text>
                        </LinearGradient>
                    </View>
                </View>

                {/* Card Body Section */}
                <View style={styles.cardBodySection}>
                    <View style={styles.bookingInfoRow}>
                        <View style={styles.bookingInfoItem}>
                            <Text style={styles.bookingInfoLabel}>Mã đặt phòng</Text>
                            <Text style={styles.bookingInfoValue}>#{item.bookingID || 'N/A'}</Text>
                        </View>

                        <View style={styles.bookingInfoItem}>
                            <Text style={styles.bookingInfoLabel}>Ngày đặt</Text>
                            <Text style={styles.bookingInfoValue}>
                                {moment(item.bookingDate).isValid()
                                    ? moment(item.bookingDate).format('DD/MM/YYYY')
                                    : 'Không xác định'
                                }
                            </Text>
                        </View>
                    </View>

                    {item.bookingDetails && item.bookingDetails[0] && (
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
                        <Ionicons name="people-outline" size={18} color="#666" />
                        <Text style={styles.guestInfoText}>
                            {item.numberOfAdults || 0} người lớn
                            {item.numberOfChildren > 0 ? `, ${item.numberOfChildren} trẻ em` : ''}
                        </Text>
                    </View>
                </View>

                {/* Card Footer Section */}
                <View style={styles.cardFooterSection}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Tổng thanh toán</Text>
                        <Text style={styles.totalPrice}>
                            {typeof item.total === 'number'
                                ? item.total.toLocaleString('vi-VN')
                                : '0'
                            }₫
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.viewDetailsBtn}>
                        <Text style={styles.viewDetailsText}>Chi tiết</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Animated.View entering={FadeInUp.delay(300).springify()}>
                <FontAwesome6 name="list-check" size={70} color="#ddd" />
            </Animated.View>
            <Animated.Text entering={FadeInUp.delay(400).springify()} style={styles.emptyTitle}>
                Chưa có đặt phòng nào
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(500).springify()} style={styles.emptyText}>
                Các đơn đặt phòng của bạn sẽ xuất hiện ở đây
            </Animated.Text>
            <Animated.View entering={FadeInUp.delay(600).springify()}>
                <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => navigation.navigate('Home')}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.browseButtonText}>Tìm kiếm phòng</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
                {renderHeader()}
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Đang tải danh sách đặt phòng...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            {renderHeader()}
            <View style={styles.filterTabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScrollContainer}
                >
                    <TouchableOpacity
                        style={[
                            styles.tabItem,
                            filterStatus === null && styles.activeTab
                        ]}
                        onPress={() => setFilterStatus(null)}
                    >
                        <Text style={[
                            styles.tabText,
                            filterStatus === null && styles.activeTabText
                        ]}>
                            Tất cả
                        </Text>
                        {filterStatus === null && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>

                    {Object.entries(STATUS_MAPPING).map(([key, value]) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.tabItem,
                                filterStatus === parseInt(key) && styles.activeTab
                            ]}
                            onPress={() => setFilterStatus(parseInt(key))}
                        >
                            <Text style={[
                                styles.tabText,
                                filterStatus === parseInt(key) && styles.activeTabText
                            ]}>
                                {value.text}
                            </Text>
                            {filterStatus === parseInt(key) && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <FontAwesome6 name="triangle-exclamation" size={60} color="#F44336" />
                    <Text style={styles.errorTitle}>Đã xảy ra lỗi</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.retryButtonText}>Thử lại</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : bookings.length === 0 ? (
                renderEmptyList()
            ) : (
                <FlatList
                    data={groupedBookingsList}
                    keyExtractor={(item) => item.month}
                    renderItem={({ item: { month, bookings }, index }) => (
                        <Animated.View
                            entering={FadeIn.delay(index * 100)}
                            style={styles.monthSection}
                        >
                            <View style={styles.monthHeaderContainer}>
                                <Text style={styles.monthHeader}>{formatMonthYear(month)}</Text>
                                <View style={styles.bookingCount}>
                                    <Text style={styles.bookingCountText}>{bookings.length}</Text>
                                </View>
                            </View>
                            {bookings.map((booking, idx) => (
                                <View key={booking.bookingID.toString()}>
                                    {renderBookingItem({ item: booking, index: idx })}
                                </View>
                            ))}
                        </Animated.View>
                    )}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    ListEmptyComponent={() => (
                        <View style={styles.noResultsContainer}>
                            <Ionicons name="search" size={60} color="#ddd" />
                            <Text style={styles.noResultsText}>
                                Không tìm thấy đơn đặt phòng nào {filterStatus !== null ? `với trạng thái "${STATUS_MAPPING[filterStatus]?.text}"` : ''}
                            </Text>
                            {filterStatus !== null && (
                                <TouchableOpacity
                                    style={styles.resetFilterButton}
                                    onPress={() => setFilterStatus(null)}
                                >
                                    <Text style={styles.resetFilterText}>Xem tất cả</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                />
            )}
            <QRCodeModal
                visible={modalVisible}
                bookingId={selectedBookingId}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

// Helper function để định dạng tháng/năm thành "Tháng 4, 2023"
function formatMonthYear(monthYear) {
    const [month, year] = monthYear.split('/');
    return `Tháng ${month}, ${year}`;
}

// Helper function để làm tối màu
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

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
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerContent: { flex: 1 },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
        textAlign: 'center',
    },
    filterTabsContainer: {
        marginTop: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    tabItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activeTab: { backgroundColor: colors.primary },
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
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    bookingContent: {
        padding: 0,
    },
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
        marginBottom: 12,
        flex: 1,
    },
    hotelIcon: {
        marginRight: 10,
    },
    hotelName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
        flex: 1,
    },
    statusContainer: {
        alignSelf: 'flex-start',
    },
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
    cardBodySection: {
        padding: 16,
    },
    bookingInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    bookingInfoItem: {
        flex: 1,
    },
    bookingInfoLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    bookingInfoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    bookingDatesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    dateBox: {
        flex: 1,
    },
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
    dateArrow: {
        marginHorizontal: 10,
    },
    guestInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    guestInfoText: {
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
    priceContainer: {
        flex: 1,
    },
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
    viewDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4f8',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    viewDetailsText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
        marginRight: 4,
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
    }
});