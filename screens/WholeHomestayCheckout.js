import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/Colors';
import bookingApi from '../services/api/bookingApi';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSearch } from '../contexts/SearchContext';
import { useUser } from '../contexts/UserContext';
import { useCart } from '../contexts/CartContext';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import homeStayApi from '../services/api/homeStayApi';

const WholeHomestayCheckout = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { bookingData } = route.params || {};
    const homeStayId = bookingData?.homeStayId;
    const rentalId = bookingData?.homeStayTypeID;
    const { currentSearch } = useSearch();
    const { userData } = useUser();
    const { clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);
    const [isFullPayment, setIsFullPayment] = useState(true);
    const [commissionRate, setCommissionRate] = useState(null);
    const [loadingCommission, setLoadingCommission] = useState(true);
    const [dateTypes, setDateTypes] = useState({});
    const [datePrices, setDatePrices] = useState({});
    const [pricingPolicies, setPricingPolicies] = useState([]);
    const [loadingPricing, setLoadingPricing] = useState(true);

    useEffect(() => {
        if (!bookingData) {
            Alert.alert('Lỗi', 'Không thể tải thông tin đặt phòng. Vui lòng thử lại.');
            navigation.goBack();
            return;
        }
    }, [bookingData, navigation]);

    useEffect(() => {
        const fetchCommissionRate = async () => {
            if (!homeStayId) return;
            try {
                const response = await homeStayApi.getCommissionRateByHomeStay(homeStayId);
                try {
                    setCommissionRate(response.data);
                    console.log("Commission Rate:", response.data);
                } catch (parseError) {
                    Alert.alert('Lỗi', 'Không thể tải tỷ lệ hoa hồng');
                }
            } catch (error) {
                Alert.alert('Lỗi', 'Không thể tải tỷ lệ hoa hồng');
            } finally {
                setLoadingCommission(false);
            }
        };
        fetchCommissionRate();
    }, [homeStayId]);

    useEffect(() => {
        const fetchPricingPolicies = async () => {
            if (!rentalId) return;
            setLoadingPricing(true);
            try {
                const result = await homeStayApi.getAllPricingByHomeStayRental(rentalId);
                if (result.success && result.data) {
                    setPricingPolicies(result.data);
                } else {
                    console.error("Failed to fetch pricing policies:", result.error);
                }
            } catch (error) {
                console.error("Error fetching pricing policies:", error);
            } finally {
                setLoadingPricing(false);
            }
        };
        fetchPricingPolicies();
    }, [rentalId]);

    useEffect(() => {
        if (!loadingPricing && pricingPolicies.length > 0) {
            calculateTotalPrice();
        }
    }, [pricingPolicies, loadingPricing, currentSearch?.checkInDate, currentSearch?.checkOutDate]);

    const checkDateType = async (dateString) => {
        try {
            const response = await homeStayApi.getDateType(dateString, rentalId);
            if (response?.success) {
                return response.data;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    };

    const getPriceByDateType = (dateType, specialDate = null) => {
        if (!pricingPolicies || pricingPolicies.length === 0) {
            return bookingData?.price;
        }
        if (dateType === 2 && specialDate) {
            const specialDateObj = new Date(specialDate);
            const specialPolicy = pricingPolicies.find(policy => {
                if (policy.dayType !== 2 || !policy.startDate || !policy.endDate) return false;
                const startDate = new Date(policy.startDate);
                const endDate = new Date(policy.endDate);
                return specialDateObj >= startDate && specialDateObj <= endDate;
            });
            if (specialPolicy) {
                return specialPolicy.rentPrice;
            }
        }
        const policy = pricingPolicies.find(p => p.dayType === dateType);
        if (policy) {
            return policy.rentPrice;
        }
        if (dateType === 1 || dateType === 2) {
            const normalPolicy = pricingPolicies.find(p => p.dayType === 0);
            return normalPolicy ? normalPolicy.rentPrice : bookingData?.price;
        }
        return bookingData?.price;
    };

    const calculateTotalPrice = () => {
        if (!bookingData || !currentSearch?.checkInDate || !currentSearch?.checkOutDate || loadingPricing) {
            setTotalPrice(0);
            setCalculating(false);
            return;
        }
        setCalculating(true);
        (async () => {
            try {
                const checkIn = new Date(convertVietnameseDateToISO(currentSearch.checkInDate));
                const nights = calculateNumberOfNights();
                let total = 0;
                const newDateTypes = {};
                const newDatePrices = {};

                for (let i = 0; i < nights; i++) {
                    const currentDate = new Date(checkIn);
                    currentDate.setDate(currentDate.getDate() + i);
                    const dateString = currentDate.toISOString().split('T')[0];
                    const key = `${rentalId}_${dateString}`;
                    const dateType = await checkDateType(dateString);
                    newDateTypes[key] = dateType;
                    const price = getPriceByDateType(dateType, dateString);
                    newDatePrices[key] = price;
                    total += price;
                }
                setDateTypes(newDateTypes);
                setDatePrices(newDatePrices);
                setTotalPrice(total);
            } catch (error) {
                const nights = calculateNumberOfNights();
                setTotalPrice(bookingData.price ? bookingData.price * nights : 0);
            } finally {
                setCalculating(false);
            }
        })();
    };

    const calculateNumberOfNights = () => {
        if (!currentSearch?.checkInDate || !currentSearch?.checkOutDate) return 1;
        const checkIn = new Date(convertVietnameseDateToISO(currentSearch.checkInDate));
        const checkOut = new Date(convertVietnameseDateToISO(currentSearch.checkOutDate));
        const diffTime = Math.abs(checkOut - checkIn);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    };

    const convertVietnameseDateToISO = (vietnameseDate) => {
        const parts = vietnameseDate.split(', ')[1].split('/');
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        const date = new Date(year, month, day);
        date.setHours(13, 40, 42, 677);
        return date.toISOString();
    };

    const createBookingData = () => {
        if (!homeStayId) {
            Alert.alert('Thông báo', 'Không tìm thấy thông tin homestay');
            return null;
        }
        const checkInDate = convertVietnameseDateToISO(currentSearch.checkInDate);
        const checkOutDate = convertVietnameseDateToISO(currentSearch.checkOutDate);
        const bookingDetails = [{
            homeStayTypeID: rentalId,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate
        }];

        const bookingData = {
            numberOfChildren: currentSearch?.children,
            numberOfAdults: currentSearch?.adults,
            accountID: userData?.userID,
            homeStayID: homeStayId,
            bookingDetails: bookingDetails
        };
        return bookingData;
    };

    const getDepositAmount = () => {
        const defaultRate = 0.3;
        if (!commissionRate || commissionRate === null || !commissionRate.platformShare) {
            return totalPrice * defaultRate;
        }
        return totalPrice * commissionRate.platformShare;
    };

    const handleBooking = async () => {
        const bookingData = createBookingData();
        if (!bookingData) return;
        setLoading(true);
        try {
            const result = await bookingApi.createBooking(bookingData, 1);
            if (result.success) {
                clearCart();
                let bookingId = null;
                if (result.data) {
                    bookingId = result.data.data;
                }
                if (!bookingId) {
                    throw new Error("Không nhận được mã đặt phòng từ máy chủ");
                }
                handlePayment(bookingId);
            } else {
                Alert.alert('Đặt phòng thất bại', result.error || 'Đã xảy ra lỗi khi đặt phòng');
            }
        } catch (error) {
            Alert.alert('Đặt phòng thất bại', 'Đã xảy ra lỗi không mong muốn');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (bookingId) => {
        setLoading(true);
        try {
            const paymentResult = await bookingApi.getPaymentUrl(bookingId, isFullPayment);
            if (paymentResult.success && paymentResult.paymentUrl) {
                navigation.navigate('PaymentWebView', {
                    paymentUrl: paymentResult.paymentUrl,
                    bookingId: bookingId,
                    homeStayId: homeStayId
                });
            } else {
                if (paymentResult.nullRefError ||
                    (paymentResult.error && paymentResult.error.includes('NullReference')) ||
                    (paymentResult.data && typeof paymentResult.data === 'string' &&
                        paymentResult.data.includes('NullReference'))) {
                    Alert.alert(
                        'Đặt phòng thành công',
                        'Đặt phòng đã được xác nhận nhưng không thể thanh toán online vào lúc này. Bạn có thể thanh toán sau hoặc liên hệ với chủ homestay.',
                        [
                            { text: 'Xem đặt phòng', onPress: () => navigation.navigate('BookingList') },
                            { text: 'Quay lại', onPress: () => navigation.navigate('HomeTabs') }
                        ]
                    );
                    return;
                }
                throw new Error(paymentResult.error || "Không thể tạo liên kết thanh toán");
            }
        } catch (paymentError) {
            Alert.alert(
                'Lỗi thanh toán',
                `Không thể khởi tạo thanh toán (${paymentError.message || "Lỗi từ hệ thống"}). Bạn có thể xem chi tiết đặt phòng trong danh sách đặt phòng.`,
                [
                    { text: 'Xem đặt phòng', onPress: () => navigation.navigate('BookingList') },
                    { text: 'Quay lại', onPress: () => navigation.navigate('HomeTabs') }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const renderHomestayInfo = () => {
        if (!bookingData) return null;
        const nights = calculateNumberOfNights();
        const getDateCountsByType = () => {
            const result = {
                normal: { count: 0, price: 0 },
                weekend: { count: 0, price: 0 },
                special: { count: 0, price: 0 }
            };
            if (!currentSearch?.checkInDate || !currentSearch?.checkOutDate) return result;
            const checkIn = new Date(convertVietnameseDateToISO(currentSearch.checkInDate));
            for (let i = 0; i < nights; i++) {
                const currentDate = new Date(checkIn);
                currentDate.setDate(currentDate.getDate() + i);
                const dateString = currentDate.toISOString().split('T')[0];
                const key = `${rentalId}_${dateString}`;
                const dateType = dateTypes[key];
                const datePrice = datePrices[key] || bookingData?.price || 0;
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
        };

        const details = getDateCountsByType();
        const hasDateTypes = details.normal.count > 0 || details.weekend.count > 0 || details.special.count > 0;

        const getPricingDescription = (dayType) => {
            return (dayType === 0 ? 'Ngày thường' : dayType === 1 ? 'Ngày cuối tuần' : 'Ngày đặc biệt');
        };

        return (
            <View style={styles.roomItem}>
                <Image
                    source={{ uri: 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg' }}
                    style={styles.roomImage}
                />
                <View style={styles.roomDetails}>
                    <View style={styles.roomInfo}>
                        <Text style={styles.roomTypeName}>{bookingData.rentalName}</Text>
                    </View>

                    {calculating || loadingPricing ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <View style={styles.priceDetails}>
                            {hasDateTypes && (
                                <View style={styles.priceBreakdown}>
                                    {details.normal.count > 0 && (
                                        <View style={styles.priceBreakdownRow}>
                                            <Text style={styles.priceBreakdownLabel}>{getPricingDescription(0)} ({details.normal.count} đêm):</Text>
                                            <Text style={styles.priceBreakdownValue}>
                                                {details.normal.price.toLocaleString('vi-VN')}₫
                                            </Text>
                                        </View>
                                    )}

                                    {details.weekend.count > 0 && (
                                        <View style={styles.priceBreakdownRow}>
                                            <Text style={styles.priceBreakdownLabel}>{getPricingDescription(1)} ({details.weekend.count} đêm):</Text>
                                            <Text style={styles.priceBreakdownValue}>
                                                {details.weekend.price.toLocaleString('vi-VN')}₫
                                            </Text>
                                        </View>
                                    )}

                                    {details.special.count > 0 && (
                                        <View style={styles.priceBreakdownRow}>
                                            <Text style={styles.priceBreakdownLabel}>{getPricingDescription(2)} ({details.special.count} đêm):</Text>
                                            <Text style={styles.priceBreakdownValue}>
                                                {details.special.price.toLocaleString('vi-VN')}₫
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            <View style={styles.totalPriceRow}>
                                <Text style={styles.totalPriceLabel}>Tổng giá:</Text>
                                <Text style={styles.totalPriceValue}>{totalPrice.toLocaleString('vi-VN')}₫</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderPaymentMethodSelector = () => {
        const defaultRate = 0.3;
        const platformShare = commissionRate?.platformShare || defaultRate;
        const depositPercentage = Math.round(platformShare * 100);
        const depositAmount = totalPrice * platformShare;

        return (
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                <View style={styles.paymentOptions}>
                    <TouchableOpacity
                        style={[
                            styles.paymentOption,
                            isFullPayment === true && styles.paymentOptionSelected
                        ]}
                        onPress={() => setIsFullPayment(true)}
                    >
                        <View style={styles.radioButton}>
                            {isFullPayment === true && <View style={styles.radioButtonInner} />}
                        </View>
                        <View style={styles.paymentOptionContent}>
                            <Text style={styles.paymentOptionTitle}>Thanh toán đầy đủ</Text>
                            {calculating || loadingCommission ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Text style={styles.paymentOptionDescription}>
                                    Thanh toán toàn bộ số tiền {totalPrice.toLocaleString('vi-VN')}đ
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.paymentOption,
                            isFullPayment === false && styles.paymentOptionSelected
                        ]}
                        onPress={() => setIsFullPayment(false)}
                    >
                        <View style={styles.radioButton}>
                            {isFullPayment === false && <View style={styles.radioButtonInner} />}
                        </View>
                        <View style={styles.paymentOptionContent}>
                            <Text style={styles.paymentOptionTitle}>Đặt cọc</Text>
                            {calculating || loadingCommission ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Text style={styles.paymentOptionDescription}>
                                    Thanh toán {depositPercentage}% đặt cọc {depositAmount.toLocaleString('vi-VN')}đ
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={[colors.primary, colors.primary]}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Animated.Text entering={FadeIn} style={styles.headerTitle}>
                    Xác nhận đặt homestay
                </Animated.Text>
                <View style={{ width: 24 }} />
            </LinearGradient>

            <Animated.View entering={FadeInDown.delay(300)} style={styles.content}>
                {/* Homestay đã chọn */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Căn đã chọn</Text>
                    {renderHomestayInfo()}
                </View>

                {/* Thời gian lưu trú */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thời gian lưu trú</Text>
                    <View style={styles.dateContainer}>
                        <View style={styles.dateItem}>
                            <Text style={styles.dateLabel}>Nhận phòng</Text>
                            <Text style={styles.dateValue}>
                                {currentSearch?.checkInDate}
                            </Text>
                        </View>
                        <View style={styles.dateDivider} />
                        <View style={styles.dateItem}>
                            <Text style={styles.dateLabel}>Trả phòng</Text>
                            <Text style={styles.dateValue}>
                                {currentSearch?.checkOutDate}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.stayDuration}>Thời gian lưu trú: {calculateNumberOfNights()} đêm</Text>
                </View>

                {renderPaymentMethodSelector()}

                {/* Tổng cộng */}
                <View style={styles.totalContainer}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Homestay ({calculateNumberOfNights()} đêm)</Text>
                        {calculating ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <View>
                                <Text style={styles.summaryValue}>
                                    {totalPrice.toLocaleString('vi-VN')}đ
                                </Text>
                                <Text style={styles.summaryValueNote}>Tổng giá thuê</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Số đêm</Text>
                        <Text style={styles.summaryValue}>{calculateNumberOfNights()} đêm</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Tổng cộng</Text>
                        {calculating || loadingCommission || loadingPricing ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={styles.totalPrice}>
                                {isFullPayment ? totalPrice.toLocaleString('vi-VN') : getDepositAmount().toLocaleString('vi-VN')}đ
                            </Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.bookButton, (loading || calculating) && styles.bookButtonDisabled]}
                    onPress={handleBooking}
                    disabled={loading || calculating}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.bookButtonGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Text style={styles.bookButtonText}>
                                    {isFullPayment ? 'Thanh toán đầy đủ' : 'Đặt cọc ngay'}
                                </Text>
                                <Icon name="arrow-forward" size={18} color="#fff" />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Thông tin thanh toán</Text>
                    <Text style={styles.infoText}>
                        {isFullPayment ? (
                            `• Thanh toán đầy đủ tổng giá thuê ngay bây giờ\n• Không mất phí khi hủy trước 24 giờ\n• Giá đã bao gồm thuế và phí dịch vụ`
                        ) : (
                            `• Đặt cọc tổng giá thuê ngay bây giờ\n• Thanh toán số tiền còn lại khi nhận phòng\n• Tiền cọc không được hoàn lại khi hủy`
                        )}
                    </Text>
                </View>
            </Animated.View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    roomItem: {
        flexDirection: 'row',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 16,
    },
    roomImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    roomDetails: {
        flex: 1,
        marginLeft: 12,
    },
    roomInfo: {
        marginBottom: 8,
    },
    roomTypeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    priceDetails: {
        marginTop: 4,
        paddingTop: 4,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 8,
    },
    priceBreakdown: {
        marginBottom: 8,
    },
    priceBreakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    priceBreakdownLabel: {
        fontSize: 14,
        color: '#666',
    },
    priceBreakdownValue: {
        fontSize: 14,
        color: '#333',
    },
    priceDetailsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    priceDetailsToggleText: {
        fontSize: 14,
        color: colors.primary,
        marginRight: 8,
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
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateItem: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    dateDivider: {
        width: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 16,
    },
    stayDuration: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    paymentOptions: {
        marginTop: 8,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 12,
    },
    paymentOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
    paymentOptionContent: {
        flex: 1,
    },
    paymentOptionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    paymentOptionDescription: {
        fontSize: 14,
        color: '#666',
    },
    totalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    summaryValueNote: {
        fontSize: 10,
        color: '#888',
        textAlign: 'right',
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    bookButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    bookButtonDisabled: {
        opacity: 0.7,
    },
    bookButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
    },
    bookButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    infoCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#eee',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});

export default WholeHomestayCheckout; 