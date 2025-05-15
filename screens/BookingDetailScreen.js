import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform, StatusBar, Animated, Modal } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import bookingApi from '../services/api/bookingApi';
import { colors } from '../constants/Colors';
import { FadeInDown } from 'react-native-reanimated';
import homeStayApi from '../services/api/homeStayApi';
import LoadingScreen from '../components/LoadingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        5: { label: 'Không đến', color: '#607D8B', bgColor: '#ECEFF1', icon: 'alert-circle-outline' },
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
            console.error('Error fetching booking details:', error);
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
                console.error('Error processing commission rate:', parseError);
                setCommissionRate(null);
            }
        } catch (error) {
            console.error('Error fetching commission rate:', error);
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
                                if (bookingData.bookingServices?.length > 0) {
                                    const serviceStatusPromises = bookingData.bookingServices.map(service =>
                                        bookingApi.changeBookingServiceStatus(
                                            bookingId,
                                            service.bookingServicesID,
                                            bookingData.status,
                                            bookingData.paymentStatus,
                                            4,
                                            service.paymentServiceStatus
                                        )
                                    );
                                    await Promise.all(serviceStatusPromises);
                                }

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
        if (bookingData.paymentStatus === 1) {
            if (canRefund) {
                message = `Bạn có thể hủy và được hoàn 100% tiền đặt cọc vì còn ${daysUntilCheckIn} ngày trước khi nhận phòng.`;
            } else {
                message = `Bạn đã quá ngày được hoàn tiền, nếu hủy sẽ không được hoàn tiền đặt cọc.`;
            }
        } else if (bookingData.paymentStatus === 2) {
            if (canRefund) {
                message = `Bạn có thể hủy và được hoàn ${cancellationPolicy.refundPercentage * 100}% tiền đặt phòng vì còn ${daysUntilCheckIn} ngày trước khi nhận phòng.`;
            } else {
                message = `Bạn đã quá ngày được hoàn tiền, nếu hủy sẽ không được hoàn tiền.`;
            }
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
                            if (bookingData.bookingServices?.length > 0) {
                                const serviceStatusPromises = bookingData.bookingServices.map(service =>
                                    bookingApi.changeBookingServiceStatus(
                                        bookingId,
                                        service.bookingServicesID,
                                        bookingData.status,
                                        bookingData.paymentStatus,
                                        4,
                                        service.paymentServiceStatus
                                    )
                                );
                                await Promise.all(serviceStatusPromises);
                            }

                            const result = await bookingApi.changeBookingStatus(bookingId, newStatus, bookingData.paymentStatus);
                            if (result.success) {
                                Alert.alert(
                                    'Thành công',
                                    canRefund
                                        ? 'Đã gửi yêu cầu hoàn trả thành công'
                                        : 'Đã hủy đặt phòng thành công'
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

                if (homeStayId) {
                    console.log("homeStayId: " + homeStayId);
                } else {
                    console.log("Warning: homeStayId is null or undefined");
                }
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

    const handleSelectServices = useCallback(async (services, paymentImmediately = false) => {
        if (!services || services.length === 0 || !bookingId) return;
        try {
            setLoading(true);
            let accountID;
            try {
                const userString = await AsyncStorage.getItem('user');
                if (userString) {
                    const userData = JSON.parse(userString);
                    accountID = userData.accountId || userData.accountID || userData.userId || userData.userID;
                    console.log('User data found, accountID:', accountID);
                }
            } catch (asyncError) {
                console.error('Error getting accountID from AsyncStorage:', asyncError);
            }

            const serviceData = {
                bookingID: parseInt(bookingId),
                bookingServicesDate: new Date().toISOString(),
                accountID: accountID,
                homeStayID: bookingData?.homeStay?.homeStayID || 0,
                bookingServicesDetails: services.map(service => {
                    let dayRent = 0;
                    if (service.startDate && service.endDate) {
                        const start = new Date(service.startDate);
                        const end = new Date(service.endDate);
                        const diffTime = Math.abs(end - start);
                        dayRent = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }

                    return {
                        quantity: service.quantity || 0,
                        servicesID: service.servicesID || 0,
                        dayRent: dayRent,
                        rentHour: service.rentHour || 0
                    };
                })
            };
            const response = await bookingApi.createBookingServices(serviceData);
            if (response.success) {
                if (paymentImmediately) {
                    const bookingServiceId = response.data?.data?.bookingServicesID;
                    if (bookingServiceId) {
                        console.log('Chuyển đến trang dịch vụ');
                        navigation.navigate('BookingService', {
                            bookingId: bookingId,
                            homestayId: bookingData?.homeStay?.homeStayID,
                            checkInDate: bookingData?.bookingDetails?.[0]?.checkInDate,
                            checkOutDate: bookingData?.bookingDetails?.[0]?.checkOutDate
                        });
                    } else {
                        Alert.alert(
                            'Lỗi',
                            'Không thể thanh toán ngay, vui lòng thanh toán từ danh sách dịch vụ.',
                            [
                                { text: 'OK', onPress: () => fetchBookingDetails() }
                            ]
                        );
                    }
                } else {
                    Alert.alert(
                        'Thành công',
                        'Đã thêm dịch vụ thành công. Vui lòng thanh toán dịch vụ trong danh sách dịch vụ.',
                        [
                            { text: 'OK', onPress: () => fetchBookingDetails() }
                        ]
                    );
                }
            } else {
                Alert.alert('Lỗi', response.error || 'Không thể thêm dịch vụ, vui lòng thử lại');
            }
        } catch (error) {
            console.error('Error adding services:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi thêm dịch vụ');
        } finally {
            setLoading(false);
        }
    }, [bookingId, bookingData, fetchBookingDetails, navigation]);

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
        return (
            <View style={styles.detailsContainer}>
                <View style={styles.bookingHeader}>
                    <View style={styles.bookingIdContainer}>
                        <Text style={styles.bookingIdLabel}>Mã đặt phòng</Text>
                        <Text style={styles.bookingIdValue}>#{bookingData.bookingID}</Text>
                    </View>
                    <View style={styles.bookingDateContainer}>
                        <Text style={styles.bookingDateLabel}>Ngày đặt</Text>
                        <Text style={styles.bookingDateValue}>{formatDateTime(bookingData.bookingDate)}</Text>
                    </View>
                </View>

                {/* Status Cards */}
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

                {/* Contact Info */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="person" size={24} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        <View style={styles.contactInfoContainer}>
                            <View style={styles.contactInfoRow}>
                                <View style={styles.contactInfoIconContainer}>
                                    <MaterialIcons name="person" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.contactInfoTextContainer}>
                                    <Text style={styles.contactInfoLabel}>Họ và tên:</Text>
                                    <Text style={styles.contactInfoValue}>{bookingData.account?.name || 'Không có thông tin'}</Text>
                                </View>
                            </View>

                            <View style={styles.contactInfoRow}>
                                <View style={styles.contactInfoIconContainer}>
                                    <MaterialIcons name="email" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.contactInfoTextContainer}>
                                    <Text style={styles.contactInfoLabel}>Email:</Text>
                                    <Text style={styles.contactInfoValue}>{bookingData.account?.email || 'Không có thông tin'}</Text>
                                </View>
                            </View>

                            <View style={styles.contactInfoRow}>
                                <View style={styles.contactInfoIconContainer}>
                                    <MaterialIcons name="phone" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.contactInfoTextContainer}>
                                    <Text style={styles.contactInfoLabel}>Điện thoại:</Text>
                                    <Text style={styles.contactInfoValue}>{bookingData.account?.phone || 'Không có thông tin'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Homestay Info */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="home" size={24} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Thông tin homestay</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        <View style={styles.homestayInfoContainer}>
                            <View style={styles.homestayInfoRow}>
                                <View style={styles.homestayInfoIconContainer}>
                                    <MaterialIcons name="business" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.homestayInfoTextContainer}>
                                    <Text style={styles.homestayInfoLabel}>Tên homestay:</Text>
                                    <Text style={styles.homestayInfoValue}>{bookingData.homeStay?.name || 'Không có thông tin'}</Text>
                                </View>
                            </View>

                            <View style={styles.homestayInfoRow}>
                                <View style={styles.homestayInfoIconContainer}>
                                    <MaterialIcons name="location-on" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.homestayInfoTextContainer}>
                                    <Text style={styles.homestayInfoLabel}>Địa chỉ:</Text>
                                    <Text numberOfLines={2} style={styles.homestayInfoValue}>{bookingData.homeStay?.address || 'Không có thông tin'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Room Details */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="hotel" size={24} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Chi tiết đặt phòng</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        {/* Common booking dates and nights */}
                        <View style={styles.bookingDatesContainer}>
                            <View style={styles.bookingDateItem}>
                                <Text style={styles.bookingDateLabel}>Ngày nhận phòng</Text>
                                <Text style={styles.bookingDateValue}>{formatDate(bookingData.bookingDetails?.[0]?.checkInDate)}</Text>
                            </View>
                            <View style={styles.bookingDateItem}>
                                <Text style={styles.bookingDateLabel}>Ngày trả phòng</Text>
                                <Text style={styles.bookingDateValue}>{formatDate(bookingData.bookingDetails?.[0]?.checkOutDate)}</Text>
                            </View>
                            <View style={styles.bookingDateItem}>
                                <Text style={styles.bookingDateLabel}>Số đêm</Text>
                                <Text style={styles.bookingDateValue}>{calculateDays(bookingData.bookingDetails?.[0]?.checkInDate, bookingData.bookingDetails?.[0]?.checkOutDate)} đêm</Text>
                            </View>
                        </View>

                        <View style={styles.bookingDatesDivider} />

                        {/* Guest Info */}
                        <View style={styles.guestInfoContainer}>
                            <Text style={styles.guestInfoLabel}>
                                <Ionicons name="people-outline" size={14} color="#666" /> {bookingData.numberOfAdults || 0} người lớn
                            </Text>
                            {bookingData.numberOfChildren > 0 && (
                                <Text style={styles.guestInfoLabel}>
                                    <Ionicons name="person-outline" size={14} color="#666" /> {bookingData.numberOfChildren} trẻ em
                                </Text>
                            )}
                        </View>

                        <View style={styles.bookingDatesDivider} />

                        {/* Room list */}
                        {bookingData.bookingDetails && bookingData.bookingDetails.map((detail, index) => {
                            const numberOfNights = calculateDays(detail.checkInDate, detail.checkOutDate);
                            const pricePerNight = numberOfNights > 0 ? detail.totalAmount / numberOfNights : 0;

                            return (
                                <View key={detail.bookingDetailID} style={styles.roomCard}>
                                    <View style={styles.roomHeader}>
                                        <View style={styles.roomTitleContainer}>
                                            <MaterialIcons name="bed" size={20} color={colors.primary} />
                                            <Text style={styles.roomTitle}>Phòng {detail.rooms?.roomNumber || index + 1}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.priceDetails}>
                                        <View style={styles.priceRow}>
                                            <Text style={styles.priceLabel}>Giá mỗi đêm:</Text>
                                            <Text style={styles.priceValue}>{formatCurrency(pricePerNight)}</Text>
                                        </View>

                                        <View style={styles.priceRow}>
                                            <Text style={styles.priceLabel}>Số đêm:</Text>
                                            <Text style={styles.priceValue}>{numberOfNights} đêm</Text>
                                        </View>

                                        <View style={styles.totalPriceRow}>
                                            <Text style={styles.totalPriceLabel}>Tổng giá:</Text>
                                            <Text style={styles.totalPriceValue}>{formatCurrency(detail.totalAmount)}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Payment Summary */}
                <View style={styles.sectionCard}>
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
                            </>
                        )}
                        <View style={styles.paymentTotal}>
                            <Text style={styles.paymentTotalLabel}>Tổng cộng</Text>
                            <Text style={styles.paymentTotalValue}>{formatCurrency(bookingData.total)}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderCancellationPolicy = () => {
        if (!cancellationPolicy) return null;

        return (
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="policy" size={24} color={colors.primary} />
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

        return (
            <View style={styles.actionButtons}>
                {canCancel && (
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
                        <Ionicons name="close-circle-outline" size={20} color="#FF5252" />
                        <Text style={styles.cancelButtonText}>Hủy đặt phòng</Text>
                    </TouchableOpacity>
                )}

                {canPay && (
                    <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => handlePayNow(bookingId)}
                        disabled={processingPayment}
                    >
                        {processingPayment ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="card-outline" size={20} color="#FFF" />
                                <Text style={styles.payButtonText}>Thanh toán ngay</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {canAddService && (
                    <TouchableOpacity
                        style={styles.addServiceButton}
                        onPress={() => navigation.navigate('BookingService', {
                            bookingId: bookingId,
                            homestayId: bookingData?.homeStay?.homeStayID,
                            checkInDate: bookingData?.bookingDetails?.[0]?.checkInDate,
                            checkOutDate: bookingData?.bookingDetails?.[0]?.checkOutDate
                        })}
                    >
                        <Ionicons name="cart-outline" size={20} color="#FFF" />
                        <Text style={styles.addServiceButtonText}>Dịch vụ đặt thêm</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <LoadingScreen
                message="Đang tải thông tin đặt phòng"
                subMessage="Vui lòng đợi trong giây lát..."
            />
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={60} color="#FF5252" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchBookingDetails}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Header */}
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace('HomeTabs', { screen: 'Booking' })}>
                    <BlurView intensity={80} tint="light" style={styles.blurButton}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
                <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
                    Chi tiết đặt phòng
                </Text>
                <View style={styles.placeholder} />
            </LinearGradient>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Animated.View
                    entering={FadeInDown.delay(100)}
                    style={styles.content}
                >
                    {renderBookingDetails()}
                    {renderCancellationPolicy()}
                </Animated.View>
            </ScrollView>

            {/* Action buttons at bottom */}
            {renderActionButtons()}
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
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    bookingIdContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginRight: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
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
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginLeft: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    bookingDateLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    bookingDateValue: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
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
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
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
    statusIcon: { marginRight: 6 },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
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
    sectionContent: { padding: 16 },
    roomCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
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
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginLeft: 8,
    },
    priceDetails: {
        marginTop: 8,
        paddingTop: 8,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
    },
    priceValue: {
        fontSize: 14,
        color: '#333',
    },
    totalPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    totalPriceLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    totalPriceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    guestInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    guestInfoLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    policyContainer: {
        gap: 12,
    },
    policyCard: { flexDirection: 'row' },
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
    serviceDates: {
        marginTop: 4,
    },
    serviceDate: {
        fontSize: 12,
        color: '#666',
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    simpleServiceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    simpleServiceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        justifyContent: 'space-between',
    },
    simpleServiceTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    simpleServiceTime: {
        fontSize: 14,
        color: '#4CAF50',
        marginLeft: 6,
        fontWeight: '500',
    },
    simpleServiceStatus: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
    },
    simpleServiceStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    simpleServiceInfo: {
        marginBottom: 12,
    },
    simpleServiceName: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    simpleServiceNameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    simpleServiceQuantity: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    simpleServiceQuantityText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    simpleServicePrice: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 16,
    },
    simpleServicePriceLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 6,
    },
    simpleServicePriceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    simpleServiceButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    simpleServiceCancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#FF5252',
        borderRadius: 8,
    },
    simpleServiceCancelText: {
        color: '#FF5252',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 4,
    },
    simpleServicePayButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
    },
    simpleServicePayText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 4,
    },
    simpleServiceRefundButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#FF0000',
        borderRadius: 8,
    },
    simpleServiceRefundText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 4,
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
    bookingDatesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
    },
    bookingDateItem: {
        flex: 1,
        alignItems: 'center',
    },
    bookingDatesDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginBottom: 16,
    },
    contactInfoContainer: { borderRadius: 8 },
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
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactInfoTextContainer: {
        flex: 1,
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    contactInfoLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: 2,
    },
    contactInfoValue: {
        fontSize: 15,
        color: colors.textPrimary,
    },
    homestayInfoContainer: { borderRadius: 8 },
    homestayInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 4,
    },
    homestayInfoIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    homestayInfoTextContainer: { flex: 1 },
    homestayInfoLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: 2,
    },
    homestayInfoValue: {
        fontSize: 15,
        color: colors.textPrimary,
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
    actionButtons: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF5252',
        marginRight: 8,
        marginBottom: 8,
        flex: 1,
    },
    cancelButtonText: {
        color: '#FF5252',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: colors.primary,
        marginRight: 8,
        marginBottom: 8,
        flex: 1,
    },
    payButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    },
    addServiceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: colors.primary,
        marginRight: 8,
        marginBottom: 8,
        flex: 1,
    },
    addServiceButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    viewAllText: {
        fontSize: 14,
        color: colors.primary,
        marginRight: 2,
    },
    viewMoreButton: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        marginTop: 8,
    },
    viewMoreText: {
        color: colors.primary,
        fontWeight: '500',
    }
});

export default BookingDetailScreen;