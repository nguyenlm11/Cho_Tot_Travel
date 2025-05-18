import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, StatusBar, Animated, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import bookingApi from '../services/api/bookingApi';
import { colors } from '../constants/Colors';
import { FadeInDown, FadeIn } from 'react-native-reanimated';
import homeStayApi from '../services/api/homeStayApi';
import LoadingScreen from '../components/LoadingScreen';
import ServicesModal from '../components/Modal/ServicesModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookingServiceScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { bookingId, homestayId, checkInDate, checkOutDate } = route.params;
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState(null);
    const [services, setServices] = useState([]);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [cancellationPolicy, setCancellationPolicy] = useState(null);
    const [servicesModalVisible, setServicesModalVisible] = useState(false);
    const [selectedServices, setSelectedServices] = useState([]);

    const fetchBookingDetails = useCallback(async () => {
        try {
            setLoading(true);
            if (!bookingId) {
                return;
            }
            const response = await bookingApi.getBookingDetails(bookingId);
            if (response.success) {
                setBookingData(response.data);
                if (response.data.bookingServices) {
                    setServices(response.data.bookingServices);
                }
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

    useEffect(() => {
        fetchBookingDetails();
    }, [fetchBookingDetails]);

    useEffect(() => {
        if (bookingData && bookingData.homeStay && bookingData.homeStay.homeStayID) {
            fetchCancellationPolicy(bookingData.homeStay.homeStayID);
        } else if (homestayId) {
            fetchCancellationPolicy(homestayId);
        }
    }, [bookingData, fetchCancellationPolicy, homestayId]);

    const formatDateTime = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }, []);

    const formatCurrency = useCallback((amount) => {
        return amount ? amount.toLocaleString('vi-VN') + 'đ' : '0đ';
    }, []);

    const handleServicePayment = useCallback(async (bookingServiceId) => {
        if (processingPayment) return;
        try {
            setProcessingPayment(true);
            const response = await bookingApi.getBookingServicePaymentUrl(bookingServiceId, true);
            if (response.success) {
                const homeStayId = bookingData?.homeStay?.homeStayID || homestayId;
                navigation.navigate('PaymentWebView', {
                    paymentUrl: response.paymentUrl,
                    bookingId: bookingServiceId,
                    onPaymentComplete: fetchBookingDetails,
                    isFullPayment: true,
                    isBookingService: true,
                    homeStayId: homeStayId
                });
            } else {
                Alert.alert('Lỗi', 'Không thể tạo URL thanh toán');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể xử lý thanh toán');
        } finally {
            setProcessingPayment(false);
        }
    }, [processingPayment, navigation, fetchBookingDetails, bookingData, homestayId]);

    const handleCancelService = useCallback(async (bookingServiceId, isRefund = false) => {
        const bookingService = services.find(service => service.bookingServicesID === bookingServiceId);
        if (!bookingService) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin dịch vụ');
            return;
        }
        if (bookingService.status === 0) {
            Alert.alert(
                'Xác nhận hủy dịch vụ',
                'Bạn có chắc chắn muốn hủy dịch vụ này?',
                [
                    { text: 'Không', style: 'cancel' },
                    {
                        text: 'Có, hủy dịch vụ',
                        onPress: async () => {
                            try {
                                setLoading(true);
                                const result = await bookingApi.changeBookingServiceStatus(
                                    bookingId,
                                    bookingServiceId,
                                    bookingData ? bookingData.status : 1,
                                    bookingData ? bookingData.paymentStatus : 1,
                                    4,
                                    bookingService.paymentServiceStatus
                                );
                                if (result.success) {
                                    Alert.alert('Thành công', 'Đã hủy dịch vụ thành công');
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
            return;
        }
        if (!cancellationPolicy) {
            Alert.alert('Thông báo', 'Không tìm thấy thông tin chính sách hủy, không thể hoàn tiền');
            return;
        }
        const checkInDateObj = checkInDate ? new Date(checkInDate) : new Date(bookingData.bookingDetails?.[0]?.checkInDate);
        const currentDate = new Date();
        const daysUntilCheckIn = Math.ceil((checkInDateObj - currentDate) / (1000 * 60 * 60 * 24));
        const canRefund = daysUntilCheckIn >= cancellationPolicy.dayBeforeCancel;
        const newStatus = canRefund ? 5 : 4;
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
                                bookingData ? bookingData.status : 1,
                                bookingData ? bookingData.paymentStatus : 1,
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
    }, [bookingData, services, cancellationPolicy, bookingId, fetchBookingDetails, checkInDate]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchBookingDetails();
        setRefreshing(false);
    }, [fetchBookingDetails]);

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
                }
            } catch (asyncError) {
                console.error('Error getting accountID from AsyncStorage:', asyncError);
            }

            const serviceData = {
                bookingID: parseInt(bookingId),
                bookingServicesDate: new Date().toISOString(),
                accountID: accountID,
                homeStayID: bookingData?.homeStay?.homeStayID || homestayId || 0,
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
                        await handleServicePayment(bookingServiceId);
                    } else {
                        Alert.alert(
                            'Lỗi',
                            'Không thể thanh toán ngay, vui lòng thanh toán từ danh sách dịch vụ.',
                            [{ text: 'OK', onPress: () => fetchBookingDetails() }]
                        );
                    }
                } else {
                    Alert.alert(
                        'Thành công',
                        'Đã thêm dịch vụ thành công. Vui lòng thanh toán dịch vụ trong danh sách dịch vụ.',
                        [{ text: 'OK', onPress: () => fetchBookingDetails() }]
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
    }, [bookingId, bookingData, fetchBookingDetails, handleServicePayment, homestayId]);

    const renderServiceItem = (service, index) => {
        const getStatusInfo = (status) => {
            switch (status) {
                case 0: return { text: 'Chờ thanh toán', color: '#FF9800', bgColor: '#FFF3E0', icon: 'timer-sand' };
                case 1: return { text: 'Đã thanh toán', color: '#4CAF50', bgColor: '#E8F5E9', icon: 'check-circle' };
                case 2: return { text: 'Đang phục vụ', color: '#2196F3', bgColor: '#E3F2FD', icon: 'progress-clock' };
                case 3: return { text: 'Đã hoàn thành', color: '#9C27B0', bgColor: '#F3E5F5', icon: 'check-decagram' };
                case 4: return { text: 'Đã hủy', color: '#F44336', bgColor: '#FFEBEE', icon: 'close-circle' };
                case 5: return { text: 'Yêu cầu hoàn tiền', color: '#FF5722', bgColor: '#FBE9E7', icon: 'cash-refund' };
                case 6: return { text: 'Đồng ý hoàn tiền', color: '#9C27B0', bgColor: '#F3E5F5', icon: 'cash-check' };
                default: return { text: 'Không xác định', color: '#607D8B', bgColor: '#ECEFF1', icon: 'help-circle' };
            }
        };
        const statusInfo = getStatusInfo(service.status);
        const serviceDetail = service.bookingServicesDetails?.[0];
        const unitPrice = serviceDetail?.unitPrice || 0;
        const quantity = serviceDetail?.quantity || 1;
        const dayRent = serviceDetail?.dayRent || 1;

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).springify()}
                key={service.bookingServicesID}
                style={styles.serviceCard}
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.95)']}
                    style={styles.cardGradient}
                >
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                        <MaterialCommunityIcons name={statusInfo.icon} size={14} color={statusInfo.color} />
                        <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                            {statusInfo.text}
                        </Text>
                    </View>

                    <View style={styles.serviceHeader}>
                        <View style={styles.serviceTimeContainer}>
                            <Ionicons name="time-outline" size={16} color={colors.primary} />
                            <Text style={styles.serviceTime}>
                                {formatDateTime(service.bookingServicesDate)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.serviceInfoContainer}>
                        <View style={styles.serviceIconContainer}>
                            <Ionicons name='pricetag-outline' size={24} color={colors.textThird} />
                        </View>
                        <View style={styles.serviceInfo}>
                            <Text style={styles.serviceNameText}>
                                {serviceDetail?.services?.servicesName || 'Dịch vụ'}
                            </Text>
                            <View style={styles.serviceMetaContainer}>
                                {quantity > 0 && (
                                    <View style={styles.serviceMeta}>
                                        <MaterialCommunityIcons name="numeric" size={14} color={colors.textSecondary} />
                                        <Text style={styles.serviceMetaText}>
                                            {quantity}
                                        </Text>
                                    </View>
                                )}
                                {dayRent > 1 && (
                                    <View style={styles.serviceMeta}>
                                        <MaterialCommunityIcons name="calendar-range" size={14} color={colors.textSecondary} />
                                        <Text style={styles.serviceMetaText}>
                                            {dayRent} ngày
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.priceContainer}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Đơn giá:</Text>
                            <Text style={styles.priceValue}>{formatCurrency(unitPrice)}</Text>
                        </View>
                        {quantity > 1 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Số lượng:</Text>
                                <Text style={styles.priceValue}>{quantity}</Text>
                            </View>
                        )}
                        {dayRent > 1 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Ngày thuê:</Text>
                                <Text style={styles.priceValue}>{dayRent} ngày</Text>
                            </View>
                        )}
                        <View style={styles.servicePriceRow}>
                            <Text style={styles.servicePriceLabel}>Thành tiền:</Text>
                            <Text style={styles.servicePriceValue}>{formatCurrency(service.total)}</Text>
                        </View>
                    </View>

                    {/* Action buttons - cập nhật theo trạng thái */}
                    {service.status === 0 && (
                        <View style={styles.serviceButtons}>
                            <TouchableOpacity
                                style={styles.serviceCancelButton}
                                onPress={() => handleCancelService(service.bookingServicesID, false)}
                            >
                                <MaterialCommunityIcons name="close-circle" size={18} color="#FF5252" />
                                <Text style={styles.serviceCancelText}>Hủy dịch vụ</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.servicePayButton}
                                onPress={() => handleServicePayment(service.bookingServicesID)}
                                disabled={processingPayment}
                            >
                                {processingPayment ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="credit-card-outline" size={18} color="#fff" />
                                        <Text style={styles.servicePayText}>Thanh toán</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {service.status === 1 && (!bookingData || bookingData.status === 1 || bookingData.status === 2) && (
                        <View style={styles.serviceButtons}>
                            <TouchableOpacity
                                style={styles.serviceRefundButton}
                                onPress={() => handleCancelService(service.bookingServicesID, true)}
                            >
                                <MaterialCommunityIcons name="cash-refund" size={18} color="#fff" />
                                <Text style={styles.serviceRefundText}>Yêu cầu hủy và hoàn tiền</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </LinearGradient>
            </Animated.View>
        );
    };

    const renderNoServices = () => (
        <Animated.View
            entering={FadeIn.duration(800)}
            style={styles.emptyContainer}
        >
            <MaterialCommunityIcons name="cart-off" size={80} color="#DDD" />
            <Text style={styles.emptyText}>Bạn chưa có dịch vụ nào</Text>
            <Text style={styles.emptySubText}>Hãy thêm dịch vụ để trải nghiệm tốt hơn</Text>
        </Animated.View>
    );

    const renderActionButtons = () => {
        if (!bookingData) return null;
        const disabledStatuses = [3, 4, 5, 6];
        const canAddService = !disabledStatuses.includes(bookingData.status);
        return (
            <View style={styles.actionButtons}>
                {canAddService && (
                    <TouchableOpacity
                        style={styles.addServiceButton}
                        onPress={() => setServicesModalVisible(true)}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <MaterialCommunityIcons name="cart-plus" size={20} color="#FFF" />
                            <Text style={styles.addServiceButtonText}>Thêm dịch vụ</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <LoadingScreen
                message="Đang tải thông tin dịch vụ"
                subMessage="Vui lòng đợi trong giây lát..."
            />
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#FF5252" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchBookingDetails}>
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
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => { navigation.goBack() }}
                >
                    <BlurView intensity={80} tint="light" style={styles.blurButton}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
                <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
                    Dịch vụ đã đặt
                </Text>
                <View style={styles.placeholder} />
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <Animated.View
                    entering={FadeInDown.delay(100)}
                    style={styles.content}
                >
                    {services && services.length > 0 ? (
                        <>
                            <View style={styles.summaryContainer}>
                                <View style={styles.summaryContent}>
                                    <MaterialCommunityIcons name="check-decagram" size={22} color={colors.primary} />
                                    <Text style={styles.summaryTitle}>
                                        {services.length} dịch vụ đã đặt
                                    </Text>
                                </View>
                            </View>
                            {services.map((service, index) => renderServiceItem(service, index))}
                        </>
                    ) : (
                        renderNoServices()
                    )}
                </Animated.View>
            </ScrollView>

            {renderActionButtons()}

            <ServicesModal
                visible={servicesModalVisible}
                onClose={() => setServicesModalVisible(false)}
                selectedServices={selectedServices}
                onSelect={handleSelectServices}
                homestayId={bookingData?.homeStay?.homeStayID || homestayId}
                checkInDate={bookingData?.bookingDetails?.[0]?.checkInDate || checkInDate}
                checkOutDate={bookingData?.bookingDetails?.[0]?.checkOutDate || checkOutDate}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
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
    summaryContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    summaryContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginLeft: 8,
    },
    serviceCard: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    cardGradient: {
        padding: 16,
        position: 'relative',
    },
    statusBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    serviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    serviceTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceTime: {
        fontSize: 14,
        color: colors.primary,
        marginLeft: 6,
        fontWeight: '500',
    },
    serviceInfoContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    serviceIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    serviceInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    serviceNameText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    serviceMetaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    serviceMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 4,
    },
    serviceMetaText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    priceContainer: {
        backgroundColor: 'rgba(245, 247, 250, 0.8)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
    },
    priceValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    servicePriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    servicePriceLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    servicePriceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    serviceButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    serviceCancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#FF5252',
        borderRadius: 12,
    },
    serviceCancelText: {
        color: '#FF5252',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
    },
    servicePayButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#4CAF50',
        borderRadius: 12,
    },
    servicePayText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
    },
    serviceRefundButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#FF5252',
        borderRadius: 12,
    },
    serviceRefundText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginTop: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#555',
        marginTop: 20,
    },
    emptySubText: {
        fontSize: 14,
        color: '#777',
        marginTop: 8,
        marginBottom: 20,
        textAlign: 'center',
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
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    actionButtons: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#fff',
    },
    addServiceButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        marginBottom: 12,
    },
    addServiceButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 8,
    },
});

export default BookingServiceScreen; 