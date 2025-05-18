import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform, StatusBar, ImageBackground } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import bookingApi from '../services/api/bookingApi';
import { colors } from '../constants/Colors';
import homeStayApi from '../services/api/homeStayApi';
import LoadingScreen from '../components/LoadingScreen';

const BookingDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { bookingId } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState(null);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [cancellationPolicy, setCancellationPolicy] = useState(null);
    const [commissionRate, setCommissionRate] = useState(null);

    const bookingStatusMapping = useMemo(() => ({
        0: { label: 'Chờ thanh toán', color: '#FFA500', bgColor: '#FFF8E1', icon: 'time-outline' },
        1: { label: 'Chờ nhận phòng', color: '#4CAF50', bgColor: '#E8F5E9', icon: 'checkmark-circle-outline' },
        2: { label: 'Đang lưu trú', color: '#2196F3', bgColor: '#E3F2FD', icon: 'home-outline' },
        3: { label: 'Đã trả phòng', color: '#9C27B0', bgColor: '#F3E5F5', icon: 'exit-outline' },
        4: { label: 'Đã hủy', color: '#F44336', bgColor: '#FFEBEE', icon: 'close-circle-outline' },
        5: { label: 'Đồng ý hoàn tiền', color: '#607D8B', bgColor: '#ECEFF1', icon: 'alert-circle-outline' },
        6: { label: 'Yêu cầu hoàn tiền', color: '#FF5722', bgColor: '#FBE9E7', icon: 'cash-outline' }
    }), []);

    const paymentStatusMapping = useMemo(() => ({
        0: { label: 'Chưa thanh toán', color: '#F44336', bgColor: '#FFEBEE', icon: 'card-outline' },
        1: { label: 'Đã đặt cọc', color: '#FF9800', bgColor: '#FFF3E0', icon: 'cash-outline' },
        2: { label: 'Đã thanh toán', color: '#4CAF50', bgColor: '#E8F5E9', icon: 'checkmark-circle-outline' },
        3: { label: 'Đã hoàn tiền', color: '#9C27B0', bgColor: '#F3E5F5', icon: 'refresh-outline' }
    }), []);

    const fetchBookingDetails = useCallback(async () => {
        try {
            setLoading(true);
            if (!bookingId) {
                setError('Không tìm thấy mã đặt phòng');
                return;
            }
            const response = await bookingApi.getBookingDetails(bookingId);
            if (response.success) {
                setBookingData(response.data);
                setError(null);
            } else {
                setError(response.error || 'Không tìm thấy thông tin đặt phòng');
            }
        } catch (error) {
            setError('Đã có lỗi xảy ra khi tải thông tin đặt phòng');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    const fetchCancellationPolicy = useCallback(async (homeStayId) => {
        try {
            const response = await homeStayApi.getCancellationPolicy(homeStayId);
            setCancellationPolicy(response.data.data);
        } catch (error) {
            console.error('Error fetching cancellation policy:', error);
        }
    }, []);

    const fetchCommissionRate = useCallback(async (homeStayId) => {
        try {
            if (!homeStayId) {
                console.log("Warning: homeStayId is null or undefined in fetchCommissionRate");
                return;
            }
            const response = await homeStayApi.getCommissionRateByHomeStay(homeStayId);
            try {
                setCommissionRate(response.data);
            } catch (parseError) {
                setCommissionRate(null);
            }
        } catch (error) {
            setCommissionRate(null);
        }
    }, []);

    useEffect(() => {
        fetchBookingDetails();
    }, [fetchBookingDetails]);

    useEffect(() => {
        if (bookingData && bookingData.homeStay && bookingData.homeStay.homeStayID) {
            fetchCancellationPolicy(bookingData.homeStay.homeStayID);
            fetchCommissionRate(bookingData.homeStay.homeStayID);
        } else if (bookingData) {
            console.log("bookingData available but homeStayID is missing");
        }
    }, [bookingData, fetchCancellationPolicy, fetchCommissionRate]);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }, []);

    const formatDateTime = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }, []);

    const formatCurrency = useCallback((amount) => {
        return amount ? amount.toLocaleString('vi-VN') + 'đ' : '0đ';
    }, []);

    const calculateDays = useCallback((checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }, []);

    const handleCancelBooking = useCallback(async () => {
        if (!bookingData || !cancellationPolicy) {
            Alert.alert('Lỗi', 'Không thể lấy thông tin đặt phòng hoặc chính sách hủy');
            return;
        }
        if (bookingData.status === 0 && bookingData.paymentStatus === 0) {
            Alert.alert(
                'Xác nhận hủy đặt phòng',
                'Bạn chưa thanh toán đặt phòng này. Bạn có chắc chắn muốn hủy?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Xác nhận',
                        onPress: async () => {
                            try {
                                setLoading(true);
                                const result = await bookingApi.changeBookingStatus(bookingId, 4, bookingData.paymentStatus);
                                if (result.success) {
                                    Alert.alert('Thành công', 'Đã hủy đặt phòng thành công');
                                    fetchBookingDetails();
                                } else {
                                    Alert.alert('Lỗi', result.error || 'Không thể cập nhật trạng thái đặt phòng');
                                }
                            } catch (error) {
                                Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật trạng thái đặt phòng');
                            } finally {
                                setLoading(false);
                            }
                        }
                    }
                ]
            );
            return;
        }
        const checkInDate = new Date(bookingData.bookingDetails?.[0]?.checkInDate);
        const currentDate = new Date();
        const daysUntilCheckIn = Math.ceil((checkInDate - currentDate) / (1000 * 60 * 60 * 24));
        const canRefund = daysUntilCheckIn >= cancellationPolicy.dayBeforeCancel;
        const newStatus = canRefund ? 6 : 4;
        let message = '';
        if (canRefund) {
            message = `Bạn có thể hủy và được hoàn ${cancellationPolicy.refundPercentage * 100}% tiền đặt phòng vì còn ${daysUntilCheckIn} ngày trước khi nhận phòng.`;
        } else {
            message = `Bạn đã quá ngày được hoàn tiền, nếu hủy sẽ không được hoàn tiền.`;
        }
        Alert.alert(
            'Xác nhận hủy đặt phòng',
            message,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const result = await bookingApi.changeBookingStatus(bookingId, newStatus, bookingData.paymentStatus);
                            if (result.success) {
                                Alert.alert(
                                    'Thành công',
                                    canRefund ? 'Đã gửi yêu cầu hoàn trả thành công' : 'Đã hủy đặt phòng thành công'
                                );
                                fetchBookingDetails();
                            } else {
                                Alert.alert('Lỗi', result.error || 'Không thể cập nhật trạng thái đặt phòng');
                            }
                        } catch (error) {
                            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật trạng thái đặt phòng');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }, [bookingData, cancellationPolicy, bookingId, fetchBookingDetails]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchBookingDetails();
        setRefreshing(false);
    }, [fetchBookingDetails]);

    const processPayment = useCallback(async (bookingId, isFullPayment) => {
        if (processingPayment) return;
        try {
            setProcessingPayment(true);
            const response = await bookingApi.getPaymentUrl(bookingId, isFullPayment);
            if (response.success && response.paymentUrl) {
                const homeStayId = bookingData?.homeStay?.homeStayID;
                navigation.navigate('PaymentWebView', {
                    paymentUrl: response.paymentUrl,
                    bookingId: bookingId,
                    onPaymentComplete: fetchBookingDetails,
                    isFullPayment: isFullPayment,
                    isBookingService: false,
                    homeStayId: homeStayId
                });
            } else {
                Alert.alert('Lỗi', response.error || 'Không thể tạo URL thanh toán');
            }
        } catch (error) {
            console.error('Lỗi khi tạo URL thanh toán:', error);
            Alert.alert('Lỗi', 'Không thể tạo URL thanh toán');
        } finally {
            setProcessingPayment(false);
        }
    }, [processingPayment, navigation, fetchBookingDetails, bookingData]);

    const handlePayNow = useCallback(async (bookingId) => {
        if (processingPayment) return;
        const depositPercentage = commissionRate && commissionRate.platformShare ? Math.round(commissionRate.platformShare * 100) : 20;
        Alert.alert(
            'Chọn phương thức thanh toán',
            `Bạn muốn thanh toán đầy đủ hay chỉ đặt cọc ${depositPercentage}%?`,
            [
                { text: 'Thanh toán đầy đủ', onPress: () => processPayment(bookingId, true) },
                { text: 'Thanh toán đặt cọc', onPress: () => processPayment(bookingId, false) },
                { text: 'Hủy', style: 'cancel' }
            ]
        );
    }, [processingPayment, processPayment, commissionRate]);

    const renderStatus = (status, statusMapping) => {
        const statusInfo = statusMapping[status] || {
            label: 'Không xác định',
            color: '#757575',
            bgColor: '#F5F5F5',
            icon: 'help-circle-outline'
        };
        return (
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} style={styles.statusIcon} />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                </Text>
            </View>
        );
    };

    const renderBookingDetails = () => {
        if (!bookingData) return null;
        const depositPercentage = commissionRate && commissionRate.platformShare ? Math.round(commissionRate.platformShare * 100) : 20;
        const hasServices = bookingData.bookingServices && bookingData.bookingServices.length > 0;
        return (
            <View style={styles.detailsContainer}>
                <View style={styles.bookingHeaderCard}>
                    <LinearGradient
                        colors={['#f7f9fc', '#edf1f7']}
                        style={styles.bookingHeader}
                    >
                        <View style={styles.bookingIdContainer}>
                            <Text style={styles.bookingIdLabel}>Mã đặt phòng</Text>
                            <Text style={styles.bookingIdValue}>#{bookingData.bookingID}</Text>
                        </View>
                        <View style={styles.bookingDateContainer}>
                            <Text style={styles.bookingDateLabel}>Ngày đặt</Text>
                            <Text style={styles.bookingDateValue}>{formatDateTime(bookingData.bookingDate)}</Text>
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.statusCardsContainer}>
                    <View style={styles.statusCard}>
                        <Text style={styles.statusCardTitle}>Trạng thái đặt phòng</Text>
                        {renderStatus(bookingData.status, bookingStatusMapping)}
                    </View>
                    <View style={styles.statusCard}>
                        <Text style={styles.statusCardTitle}>Trạng thái thanh toán</Text>
                        {renderStatus(bookingData.paymentStatus, paymentStatusMapping)}
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <ImageBackground
                        source={{ uri: 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg' }}
                        style={styles.homestayImageBg}
                        imageStyle={styles.homestayImage}
                    >
                        <LinearGradient
                            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                            style={styles.homestayImageOverlay}
                        >
                            <View style={styles.homestayContent}>
                                <View style={styles.homestayNameContainer}>
                                    <FontAwesome5 name="home" size={16} color="#FFF" />
                                    <Text style={styles.homestayName}>
                                        {bookingData.homeStay?.name || 'Không có thông tin'}
                                    </Text>
                                </View>
                                <Text style={styles.homestayAddress} numberOfLines={2}>
                                    <Ionicons name="location" size={14} color="#FFF" /> {bookingData.homeStay?.address || 'Không có thông tin'}
                                </Text>
                            </View>
                        </LinearGradient>
                    </ImageBackground>
                </View>

                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="person" size={22} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        <View style={styles.contactInfoContainer}>
                            <View style={styles.contactInfoRow}>
                                <View style={styles.contactInfoIconContainer}>
                                    <MaterialIcons name="person" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.contactInfoTextContainer}>
                                    <Text style={styles.contactInfoLabel}>Họ và tên</Text>
                                    <Text style={styles.contactInfoValue}>{bookingData.account?.name || 'Không có thông tin'}</Text>
                                </View>
                            </View>

                            <View style={styles.contactInfoRow}>
                                <View style={styles.contactInfoIconContainer}>
                                    <MaterialIcons name="email" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.contactInfoTextContainer}>
                                    <Text style={styles.contactInfoLabel}>Email</Text>
                                    <Text style={styles.contactInfoValue}>{bookingData.account?.email || 'Không có thông tin'}</Text>
                                </View>
                            </View>

                            <View style={styles.contactInfoRow}>
                                <View style={styles.contactInfoIconContainer}>
                                    <MaterialIcons name="phone" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.contactInfoTextContainer}>
                                    <Text style={styles.contactInfoLabel}>Điện thoại</Text>
                                    <Text style={styles.contactInfoValue}>{bookingData.account?.phone || 'Không có thông tin'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="hotel" size={22} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Chi tiết đặt phòng</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        <View style={styles.dateGuestCard}>
                            <View style={styles.bookingDatesContainer}>
                                <View style={styles.dateColumn}>
                                    <Text style={styles.dateTitle}>Nhận phòng</Text>
                                    <View style={styles.dateValueContainer}>
                                        <Ionicons name="calendar" size={16} color={colors.primary} />
                                        <Text style={styles.dateValue}>{formatDate(bookingData.bookingDetails?.[0]?.checkInDate)}</Text>
                                    </View>
                                </View>

                                <View style={styles.dateArrowContainer}>
                                    <View style={styles.dateLineDashed}></View>
                                    <View style={styles.nightsCircle}>
                                        <Text style={styles.nightsText}>
                                            {calculateDays(bookingData.bookingDetails?.[0]?.checkInDate, bookingData.bookingDetails?.[0]?.checkOutDate)}
                                        </Text>
                                        <Text style={styles.nightsLabel}>đêm</Text>
                                    </View>
                                </View>

                                <View style={styles.dateColumn}>
                                    <Text style={styles.dateTitle}>Trả phòng</Text>
                                    <View style={styles.dateValueContainer}>
                                        <Ionicons name="calendar" size={16} color={colors.primary} />
                                        <Text style={styles.dateValue}>{formatDate(bookingData.bookingDetails?.[0]?.checkOutDate)}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.guestInfoContainer}>
                                <View style={styles.guestCountContainer}>
                                    <Ionicons name="people" size={18} color={colors.primary} />
                                    <Text style={styles.guestCount}>
                                        {bookingData.numberOfAdults} người lớn
                                        {bookingData.numberOfChildren > 0 ? `, ${bookingData.numberOfChildren} trẻ em` : ''}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.roomsListTitle}>Thông tin phòng</Text>
                        {bookingData.bookingDetails && bookingData.bookingDetails.map((detail, index) => {
                            return (
                                <View key={detail.bookingDetailID} style={styles.roomCard}>
                                    <View style={styles.roomHeader}>
                                        <View style={styles.roomTitleContainer}>
                                            <MaterialIcons name="bed" size={20} color={colors.primary} />
                                            <Text style={styles.roomTitle}>
                                                {detail.rooms !== null ? 
                                                    `${detail.rooms.roomTypeName} ${detail.rooms.roomNumber} - ${detail.homeStayRentals?.name}` : 
                                                    detail.homeStayRentals?.name
                                                }
                                            </Text>
                                        </View>
                                        <Text style={styles.roomTotalPrice}>Tổng giá: {formatCurrency(detail.totalAmount)}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                <View style={[styles.sectionCard, styles.paymentCard]}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="payment" size={22} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        {bookingData.paymentStatus === 1 && (
                            <>
                                <View style={styles.paymentItem}>
                                    <Text style={styles.paymentLabel}>Đã đặt cọc ({depositPercentage}%)</Text>
                                    <Text style={styles.paymentValue}>{formatCurrency(bookingData.bookingDeposit)}</Text>
                                </View>

                                <View style={styles.paymentItem}>
                                    <Text style={styles.paymentLabel}>Còn lại</Text>
                                    <Text style={styles.paymentValue}>{formatCurrency(bookingData.remainingBalance)}</Text>
                                </View>

                                <View style={styles.divider}></View>
                            </>
                        )}
                        <View style={styles.paymentTotal}>
                            <Text style={styles.paymentTotalLabel}>Tổng cộng</Text>
                            <Text style={styles.paymentTotalValue}>{formatCurrency(bookingData.total)}</Text>
                        </View>
                    </View>
                </View>

                {hasServices && (
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="room-service" size={22} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Dịch vụ đã đặt</Text>
                        </View>
                        <View style={styles.sectionContent}>
                            <TouchableOpacity
                                style={styles.viewServicesButton}
                                onPress={() => navigation.navigate('BookingService', {
                                    bookingId: bookingId,
                                    homestayId: bookingData?.homeStay?.homeStayID,
                                    checkInDate: bookingData?.bookingDetails?.[0]?.checkInDate,
                                    checkOutDate: bookingData?.bookingDetails?.[0]?.checkOutDate
                                })}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.secondary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.viewServicesButtonText}>Xem dịch vụ đã đặt</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderCancellationPolicy = () => {
        if (!cancellationPolicy) return null;
        return (
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="policy" size={22} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Chính sách hủy phòng</Text>
                </View>
                <View style={styles.sectionContent}>
                    <View style={styles.policyContainer}>
                        <View style={styles.policyCard}>
                            <View style={styles.policyIconContainer}>
                                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                            </View>
                            <View style={styles.policyTextContainer}>
                                <Text style={styles.policyTitle}>Hoàn tiền</Text>
                                <Text style={styles.policyDescription}>
                                    Hủy trước {cancellationPolicy.dayBeforeCancel} ngày check-in
                                </Text>
                                <Text style={styles.policyAmount}>
                                    Hoàn {cancellationPolicy.refundPercentage * 100}% tiền đặt phòng
                                </Text>
                            </View>
                        </View>
                        <View style={styles.policyDivider} />
                        <View style={styles.policyCard}>
                            <View style={[styles.policyIconContainer, { backgroundColor: '#FFEBEE' }]}>
                                <MaterialIcons name="cancel" size={18} color="#F44336" />
                            </View>
                            <View style={styles.policyTextContainer}>
                                <Text style={styles.policyTitle}>Không hoàn tiền</Text>
                                <Text style={styles.policyDescription}>
                                    Hủy trong vòng {cancellationPolicy.dayBeforeCancel} ngày check-in
                                </Text>
                                <Text style={styles.policyAmount}>
                                    Không được hoàn tiền
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderActionButtons = () => {
        if (!bookingData) return null;
        const canCancel = bookingData.status === 0 || bookingData.status === 1;
        const canPay = bookingData.paymentStatus === 0 && bookingData.status === 0;
        const canAddService = bookingData.status === 1 || bookingData.status === 2;
        if (!canCancel && !canPay && !canAddService) return null;
        return (
            <View style={styles.actionButtons}>
                {canCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelBooking}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#fff', '#fff']}
                            style={styles.cancelButtonGradient}
                        >
                            <Ionicons name="close-circle-outline" size={20} color="#FF5252" />
                            <Text style={styles.cancelButtonText}>Hủy đặt phòng</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {canPay && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handlePayNow(bookingId)}
                        disabled={processingPayment}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.actionButtonGradient}
                        >
                            {processingPayment ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="card-outline" size={20} color="#FFF" />
                                    <Text style={styles.actionButtonText}>Thanh toán ngay</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {canAddService && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('BookingService', {
                            bookingId: bookingId,
                            homestayId: bookingData?.homeStay?.homeStayID,
                            checkInDate: bookingData?.bookingDetails?.[0]?.checkInDate,
                            checkOutDate: bookingData?.bookingDetails?.[0]?.checkOutDate
                        })}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.actionButtonGradient}
                        >
                            <Ionicons name="cart-outline" size={20} color="#FFF" />
                            <Text style={styles.actionButtonText}>Dịch vụ đặt thêm</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.replace('HomeTabs', { screen: 'Booking' })}
                >
                    <BlurView intensity={80} tint="light" style={styles.blurButton}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
                <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
                    Chi tiết đặt phòng
                </Text>
                <View style={styles.placeholder} />
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.content}>
                    {loading ? (
                        <LoadingScreen
                            message="Đang tải thông tin đặt phòng"
                            subMessage="Vui lòng đợi trong giây lát..."
                        />
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={60} color="#FF5252" />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchBookingDetails}>
                                <Text style={styles.retryButtonText}>Thử lại</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        renderBookingDetails()
                    )}
                    {!loading && !error && renderCancellationPolicy()}
                </View>
            </ScrollView>
            {!loading && !error && renderActionButtons()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    blurButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerText: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginHorizontal: 10,
    },
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    content: { padding: 16 },
    detailsContainer: { marginBottom: 20 },
    bookingHeaderCard: {
        marginBottom: 16,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
    },
    bookingIdContainer: {
        flex: 1,
    },
    bookingIdLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    bookingIdValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    bookingDateContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    bookingDateLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    bookingDateValue: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textPrimary,
    },
    statusCardsContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    statusCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 4,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    statusCardTitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusIcon: {
        marginRight: 6
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginLeft: 12,
    },
    sectionContent: {
        padding: 16
    },
    roomCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    roomTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    roomTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginLeft: 8,
        flex: 1,
    },
    roomTotalPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    homestayImageBg: {
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
    },
    homestayImage: {
        flex: 1,
    },
    homestayImageOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 16,
    },
    homestayContent: {
        justifyContent: 'flex-end',
    },
    homestayNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    homestayName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 5
    },
    homestayAddress: {
        fontSize: 14,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 5
    },
    dateGuestCard: { marginBottom: 16 },
    bookingDatesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateColumn: { flex: 3 },
    dateTitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 8,
        textAlign: 'center',
    },
    dateValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        justifyContent: 'center',
    },
    dateValue: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
        marginLeft: 6,
    },
    dateArrowContainer: {
        flex: 2,
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        height: 40,
    },
    dateLineDashed: {
        width: '100%',
        height: 1,
        backgroundColor: '#e0e0e0',
        position: 'absolute',
        top: 20,
    },
    nightsCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary + '40',
    },
    nightsText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
    },
    nightsLabel: {
        fontSize: 10,
        color: colors.primary,
    },
    guestInfoContainer: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    guestCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    guestCount: {
        fontSize: 14,
        color: colors.textPrimary,
        marginLeft: 8,
    },
    roomsListTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    contactInfoContainer: { borderRadius: 12 },
    contactInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 4,
    },
    contactInfoIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactInfoTextContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    contactInfoLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    contactInfoValue: {
        fontSize: 15,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    paymentCard: {
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    paymentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    paymentLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    paymentValue: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 12,
    },
    paymentTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentTotalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    paymentTotalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    policyContainer: {
        gap: 12,
    },
    policyCard: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    policyIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    policyTextContainer: {
        flex: 1,
    },
    policyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    policyDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    policyAmount: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.primary,
    },
    policyDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 8,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        textAlign: 'center',
        color: '#757575',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    actionButtons: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cancelButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    cancelButtonText: {
        color: '#FF5252',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    },
    actionButton: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    },
    viewServicesButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
    },
    viewServicesButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default BookingDetailScreen;