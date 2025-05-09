import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform, StatusBar, Animated, Modal } from 'react-native';
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import bookingApi from '../services/api/bookingApi';
import { colors } from '../constants/Colors';
import { FadeInDown } from 'react-native-reanimated';
import ServicesModal from '../components/Modal/ServicesModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    const [isServicesModalVisible, setIsServicesModalVisible] = useState(false);
    const [selectedServices, setSelectedServices] = useState([]);
    const [cancellationPolicy, setCancellationPolicy] = useState(null);
    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    const bookingStatusMapping = useMemo(() => ({
        0: { label: 'Chờ thanh toán', color: '#FFA500', bgColor: '#FFF8E1', icon: 'time-outline' },
        1: { label: 'Đã xác nhận', color: '#4CAF50', bgColor: '#E8F5E9', icon: 'checkmark-circle-outline' },
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

    useEffect(() => {
        fetchBookingDetails();
    }, [fetchBookingDetails]);

    useEffect(() => {
        if (bookingData?.homeStay?.homeStayID) {
            fetchCancellationPolicy(bookingData.homeStay.homeStayID);
        }
    }, [bookingData?.homeStay?.homeStayID, fetchCancellationPolicy]);

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

    const handleServiceSelected = useCallback(async (selectedServices) => {
        try {
            if (!bookingData?.homeStay?.homeStayID) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin homestay');
                return;
            }
            setLoading(true);
            const userData = await AsyncStorage.getItem('user');
            const userInfo = userData ? JSON.parse(userData) : null;
            if (!userInfo?.userId) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập để thực hiện chức năng này');
                return;
            }
            const invalidServices = selectedServices.filter(service =>
                service.serviceType === 2 && (!service.startDate || !service.endDate)
            );
            if (invalidServices.length > 0) {
                Alert.alert('Lỗi', 'Vui lòng chọn ngày cho các dịch vụ thuê theo ngày');
                return;
            }

            const bookingServiceData = {
                bookingID: bookingId,
                bookingServicesDate: new Date().toISOString(),
                accountID: userInfo.userId,
                homeStayID: bookingData.homeStay.homeStayID,
                bookingServicesDetails: selectedServices.map(service => ({
                    quantity: service.quantity,
                    servicesID: service.servicesID,
                    startDate: service.serviceType === 2 ? service.startDate : null,
                    endDate: service.serviceType === 2 ? service.endDate : null,
                    rentHour: null
                }))
            };

            const response = await bookingApi.createBookingServices(bookingServiceData);
            console.log('response', response);
            if (response.success) {
                const bookingServiceId = response.data?.data?.bookingServicesID;
                if (bookingServiceId) {
                    setIsServicesModalVisible(false);
                    handleServicePayment(bookingServiceId);
                } else {
                    Alert.alert('Lỗi', 'Không nhận được mã đặt dịch vụ');
                }
            } else {
                Alert.alert('Lỗi', response.message || 'Không thể thêm dịch vụ');
            }
        } catch (error) {
            console.error('Error adding services:', error);
            Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi thêm dịch vụ');
        } finally {
            setLoading(false);
        }
    }, [bookingId, handleServicePayment, bookingData]);

    const handleServicePayment = useCallback(async (bookingServiceId) => {
        if (processingPayment) return;
        try {
            setProcessingPayment(true);
            const response = await bookingApi.getBookingServicePaymentUrl(bookingServiceId, true);
            if (response.success) {
                navigation.navigate('PaymentWebView', {
                    paymentUrl: response.paymentUrl,
                    bookingId: bookingServiceId,
                    onPaymentComplete: fetchBookingDetails,
                    isFullPayment: true,
                    isBookingService: true
                });
            } else {
                Alert.alert('Lỗi', 'Không thể tạo URL thanh toán');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể xử lý thanh toán');
        } finally {
            setProcessingPayment(false);
        }
    }, [processingPayment, navigation, fetchBookingDetails]);

    const handleCancelService = useCallback(async (bookingServiceId, isRefund = false) => {
        if (!bookingData || !cancellationPolicy) return;

        const checkInDate = new Date(bookingData.bookingDetails?.[0]?.checkInDate);
        const currentDate = new Date();
        const daysUntilCheckIn = Math.ceil((checkInDate - currentDate) / (1000 * 60 * 60 * 24));
        const canRefund = daysUntilCheckIn >= cancellationPolicy.dayBeforeCancel;
        const newStatus = canRefund ? 5 : 4;

        const bookingService = bookingData.bookingServices.find(service => service.bookingServicesID === bookingServiceId);
        if (!bookingService) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin dịch vụ');
            return;
        }

        Alert.alert(
            'Xác nhận hủy dịch vụ',
            canRefund
                ? `Bạn có thể hủy và được hoàn ${cancellationPolicy.refundPercentage * 100}% tiền dịch vụ vì còn ${daysUntilCheckIn} ngày trước check-in`
                : `Nếu hủy sẽ không được hoàn tiền. Bạn có chắc chắn muốn hủy?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const result = await bookingApi.changeBookingServiceStatus(
                                bookingId,
                                bookingServiceId,
                                bookingData.status,
                                bookingData.paymentStatus,
                                newStatus,
                                bookingService.paymentServiceStatus
                            );

                            if (result.success) {
                                Alert.alert(
                                    'Thành công',
                                    canRefund
                                        ? 'Đã gửi yêu cầu hoàn trả thành công'
                                        : 'Đã hủy dịch vụ thành công'
                                );
                                fetchBookingDetails();
                            } else {
                                Alert.alert('Lỗi', result.error || 'Không thể cập nhật trạng thái dịch vụ');
                            }
                        } catch (error) {
                            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật trạng thái dịch vụ');
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
                navigation.navigate('PaymentWebView', {
                    paymentUrl: response.paymentUrl,
                    bookingId: bookingId,
                    onPaymentComplete: fetchBookingDetails,
                    isFullPayment: isFullPayment,
                    isBookingService: false
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
    }, [processingPayment, navigation, fetchBookingDetails]);

    const handlePayNow = useCallback(async (bookingId) => {
        if (processingPayment) return;
        Alert.alert(
            'Chọn phương thức thanh toán',
            'Bạn muốn thanh toán đầy đủ hay chỉ đặt cọc 30%?',
            [
                { text: 'Thanh toán đầy đủ', onPress: () => processPayment(bookingId, true) },
                { text: 'Thanh toán đặt cọc', onPress: () => processPayment(bookingId, false) },
                { text: 'Hủy', style: 'cancel' }
            ]
        );
    }, [processingPayment, processPayment]);

    const handleBookService = useCallback(() => {
        setIsServicesModalVisible(true);
    }, []);

    const handleRateBooking = () => {
        setRatingModalVisible(true);
    };

    const handleSubmitRating = async () => {
        if (rating === 0) {
            Alert.alert('Lỗi', 'Vui lòng chọn số sao đánh giá');
            return;
        }

        try {
            setSubmittingRating(true);
            // Replace with your actual API endpoint
            const response = await homeStayApi.rateHomeStay(
                bookingData.homeStay.homeStayID, 
                rating, 
                ratingComment
            );
            
            if (response.success) {
                Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá');
                setRatingModalVisible(false);
                fetchBookingDetails();
            } else {
                Alert.alert('Lỗi', response.error || 'Không thể gửi đánh giá');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi gửi đánh giá');
        } finally {
            setSubmittingRating(false);
        }
    };

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
                        {bookingData.bookingDetails && bookingData.bookingDetails.map((detail, index) => (
                            <View key={detail.bookingDetailID} style={styles.roomCard}>
                                <View style={styles.roomHeader}>
                                    <View style={styles.roomTitleContainer}>
                                        <MaterialIcons name="bed" size={20} color={colors.primary} />
                                        <Text style={styles.roomTitle}>Phòng {detail.rooms?.roomNumber || index + 1}</Text>
                                    </View>
                                </View>

                                <View style={styles.roomTotal}>
                                    <Text style={styles.roomTotalLabel}>Thành tiền</Text>
                                    <Text style={styles.roomTotalValue}>{formatCurrency(detail.totalAmount)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Additional Services */}
                {bookingData.bookingServices && bookingData.bookingServices.length > 0 && (
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="room-service" size={24} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Dịch vụ thêm</Text>
                        </View>
                        <View style={styles.sectionContent}>
                            {bookingData.bookingServices.map((service) =>
                                renderSimpleServiceItem(service)
                            )}
                        </View>
                    </View>
                )}

                {/* Payment Summary */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="payment" size={24} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        <View style={styles.paymentItem}>
                            <Text style={styles.paymentLabel}>Tổng tiền phòng</Text>
                            <Text style={styles.paymentValue}>{formatCurrency(bookingData.totalRentPrice)}</Text>
                        </View>

                        {bookingData.bookingServices && bookingData.bookingServices.length > 0 && (
                            <View style={styles.paymentItem}>
                                <Text style={styles.paymentLabel}>Tổng tiền dịch vụ</Text>
                                <Text style={styles.paymentValue}>
                                    {formatCurrency(
                                        bookingData.bookingServices.reduce((sum, service) => sum + (service.total || 0), 0)
                                    )}
                                </Text>
                            </View>
                        )}

                        {bookingData.paymentStatus === 1 && (
                            <>
                                <View style={styles.paymentItem}>
                                    <Text style={styles.paymentLabel}>Đã đặt cọc</Text>
                                    <Text style={styles.paymentValue}>{formatCurrency(bookingData.bookingDeposit)}</Text>
                                </View>

                                <View style={styles.paymentItem}>
                                    <Text style={styles.paymentLabel}>Còn lại</Text>
                                    <Text style={styles.paymentValue}>{formatCurrency(bookingData.remainingBalance)}</Text>
                                </View>
                            </>
                        )}

                        <View style={styles.paymentDivider} />
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
        const canBookService = bookingData.status === 1 || bookingData.status === 2;

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

                {canBookService && (
                    <TouchableOpacity
                        style={styles.serviceButton}
                        onPress={handleBookService}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                        <Text style={styles.serviceButtonText}>Thêm dịch vụ</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderSimpleServiceItem = (service) => {
        // Hàm lấy thông tin trạng thái từ mã số
        const getStatusInfo = (status) => {
            switch (status) {
                case 0: return { text: 'Chờ thanh toán', color: '#FF9800', bgColor: '#FFF3E0' };
                case 1: return { text: 'Đã thanh toán', color: '#4CAF50', bgColor: '#E8F5E9' };
                case 2: return { text: 'Đang phục vụ', color: '#2196F3', bgColor: '#E3F2FD' };
                case 3: return { text: 'Đã hoàn thành', color: '#9C27B0', bgColor: '#F3E5F5' };
                case 4: return { text: 'Đã hủy', color: '#F44336', bgColor: '#FFEBEE' };
                case 5: return { text: 'Yêu cầu hoàn tiền', color: '#FF5722', bgColor: '#FBE9E7' };
                case 6: return { text: 'Đã hoàn tiền', color: '#9C27B0', bgColor: '#F3E5F5' };
                default: return { text: 'Không xác định', color: '#607D8B', bgColor: '#ECEFF1' };
            }
        };

        const statusInfo = getStatusInfo(service.status);

        return (
            <View key={service.bookingServicesID} style={styles.simpleServiceCard}>
                {/* Header with timestamp and status */}
                <View style={styles.simpleServiceHeader}>
                    <View style={styles.simpleServiceTimeContainer}>
                        <Ionicons name="time-outline" size={16} color="#4CAF50" />
                        <Text style={styles.simpleServiceTime}>
                            {formatDateTime(service.bookingServicesDate)}
                        </Text>
                    </View>
                    <View style={[styles.simpleServiceStatus, { backgroundColor: statusInfo.bgColor }]}>
                        <Text style={[styles.simpleServiceStatusText, { color: statusInfo.color }]}>
                            {statusInfo.text}
                        </Text>
                    </View>
                </View>

                {/* Service info */}
                <View style={styles.simpleServiceInfo}>
                    <View style={styles.simpleServiceName}>
                        <Ionicons name="pricetag-outline" size={18} color="#555" />
                        <Text style={styles.simpleServiceNameText}>
                            {service.bookingServicesDetails?.[0]?.services?.servicesName || 'Dịch vụ'}
                        </Text>
                    </View>

                    <View style={styles.simpleServiceQuantity}>
                        <Ionicons name="cart-outline" size={16} color="#777" />
                        <Text style={styles.simpleServiceQuantityText}>
                            Số lượng: {service.bookingServicesDetails?.[0]?.quantity || 1}
                        </Text>
                    </View>
                </View>

                {/* Price */}
                <View style={styles.simpleServicePrice}>
                    <Text style={styles.simpleServicePriceLabel}>Thành tiền</Text>
                    <Text style={styles.simpleServicePriceValue}>
                        {formatCurrency(service.total)}
                    </Text>
                </View>

                {/* Action buttons - tuỳ theo trạng thái */}
                {service.status === 0 && (
                    <View style={styles.simpleServiceButtons}>
                        <TouchableOpacity
                            style={styles.simpleServiceCancelButton}
                            onPress={() => handleCancelService(service.bookingServicesID, false)}
                        >
                            <Ionicons name="close-circle-outline" size={18} color="#FF5252" />
                            <Text style={styles.simpleServiceCancelText}>Hủy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.simpleServicePayButton}
                            onPress={() => handleServicePayment(service.bookingServicesID)}
                            disabled={processingPayment}
                        >
                            {processingPayment ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="card-outline" size={18} color="#fff" />
                                    <Text style={styles.simpleServicePayText}>Thanh toán</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Nút yêu cầu hoàn tiền cho dịch vụ đã thanh toán */}
                {service.status === 1 && bookingData.status === 3 && (
                    <View style={styles.simpleServiceButtons}>
                        <TouchableOpacity
                            style={styles.simpleServiceRefundButton}
                            onPress={() => handleCancelService(service.bookingServicesID, true)}
                        >
                            <Text style={styles.simpleServiceRefundText}>Hủy dịch vụ</Text>
                        </TouchableOpacity>
                    </View>
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
            {renderActionButtons()}
            <ServicesModal
                visible={isServicesModalVisible}
                onClose={() => setIsServicesModalVisible(false)}
                onSelect={handleServiceSelected}
                selectedServices={selectedServices}
                homestayId={bookingData?.homeStay?.homeStayID}
                checkInDate={bookingData?.bookingDetails?.[0]?.checkInDate}
                checkOutDate={bookingData?.bookingDetails?.[0]?.checkOutDate}
            />
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
    roomTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    roomTotalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    roomTotalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    serviceItem: {
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
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    serviceHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceDate: {
        fontSize: 14,
        color: colors.textPrimary,
        marginLeft: 8,
        fontWeight: '500',
    },
    serviceStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: (status) => {
            switch (status) {
                case 0: return '#FFF3E0';  // Chờ thanh toán
                case 1: return '#E8F5E9';  // Đã thanh toán
                case 2: return '#E3F2FD';  // Đang phục vụ
                case 3: return '#F3E5F5';  // Đã hoàn thành
                case 4: return '#FFEBEE';  // Đã hủy
                case 5: return '#FBE9E7';  // Yêu cầu hoàn tiền
                case 6: return '#F3E5F5';  // Đã hoàn tiền
                default: return '#ECEFF1'; // Không xác định
            }
        }
    },
    serviceStatusText: {
        fontSize: 12,
        fontWeight: '600',
        color: (status) => {
            switch (status) {
                case 0: return '#FF9800';  // Chờ thanh toán
                case 1: return '#4CAF50';  // Đã thanh toán
                case 2: return '#2196F3';  // Đang phục vụ
                case 3: return '#9C27B0';  // Đã hoàn thành
                case 4: return '#F44336';  // Đã hủy
                case 5: return '#FF5722';  // Yêu cầu hoàn tiền
                case 6: return '#9C27B0';  // Đã hoàn tiền
                default: return '#607D8B'; // Không xác định
            }
        }
    },
    serviceDetails: { marginBottom: 12 },
    serviceDetailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    serviceDetailInfo: {
        flex: 1,
        marginRight: 16,
    },
    serviceDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: 8,
    },
    serviceDetailMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    serviceMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceMetaText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    serviceDetailPrice: { alignItems: 'flex-end' },
    serviceDetailPriceLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    serviceDetailPriceValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
    },
    serviceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    serviceTotal: { flex: 1 },
    serviceTotalLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    serviceTotalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    serviceActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    serviceActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    serviceActionIconContainer: {
        marginRight: 4,
    },
    serviceActionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    cancelButton: {
        borderColor: '#FF5252',
        backgroundColor: '#FFF',
    },
    payButton: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    refundButton: {
        borderColor: '#FF9800',
        backgroundColor: '#FFF',
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
    paymentDivider: {
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
    serviceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        marginRight: 8,
        marginBottom: 8,
        flex: 1,
    },
    serviceButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
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
    }
});

export default BookingDetailScreen;