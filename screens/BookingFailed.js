import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import bookingApi from '../services/api/bookingApi';
import homeStayApi from '../services/api/homeStayApi';

export default function BookingFailed() {
    const navigation = useNavigation();
    const route = useRoute();
    const { bookingId, errorCode, error, isBookingService = false, onPaymentComplete, homeStayId: routeHomeStayId } = route.params || {};
    const [loading, setLoading] = useState(false);
    const [commissionRate, setCommissionRate] = useState(null);
    const [loadingCommission, setLoadingCommission] = useState(true);
    const [homeStayId, setHomeStayId] = useState(routeHomeStayId);
    const [bookingDetails, setBookingDetails] = useState(null);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!bookingId) {
                setLoadingCommission(false);
                return;
            }
            if (homeStayId) { return }
            try {
                const response = await bookingApi.getBookingDetails(bookingId);
                if (response.success && response.data) {
                    setBookingDetails(response.data);
                    if (response.data.homeStay && response.data.homeStay.homeStayID) {
                        setHomeStayId(response.data.homeStay.homeStayID);
                    }
                }
            } catch (error) {
                console.error('Error fetching booking details:', error);
            }
        };
        fetchBookingDetails();
    }, [bookingId, homeStayId]);

    useEffect(() => {
        const fetchCommissionRate = async () => {
            if (!homeStayId) {
                setLoadingCommission(false);
                return;
            }
            try {
                const response = await homeStayApi.getCommissionRateByHomeStay(homeStayId);
                try {
                    setCommissionRate(response.data);
                } catch (parseError) {
                    console.error('Error processing commission rate:', parseError);
                }
            } catch (error) {
                console.error('Error fetching commission rate:', error);
            } finally {
                setLoadingCommission(false);
            }
        };
        fetchCommissionRate();
    }, [homeStayId]);

    const errorMessages = {
        '02': 'Merchant không hợp lệ (kiểm tra lại vnp_TmnCode)',
        '03': 'Dữ liệu gửi sang không đúng định dạng',
        '04': 'Khởi tạo GD không thành công do website đang bị tạm khóa',
        '08': 'Hệ thống đang bảo trì',
        '13': 'Xác thực chữ ký không thành công',
        '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
        '51': 'Tài khoản không đủ số dư để thực hiện giao dịch',
        '65': 'Tài khoản của quý khách đã vượt quá hạn mức giao dịch trong ngày',
        '75': 'Ngân hàng thanh toán đang bảo trì',
        '79': 'KH nhập sai mật khẩu xác thực giao dịch',
        '99': 'Lỗi không xác định'
    };

    const getErrorMessage = () => {
        if (error) return error;
        if (errorCode && errorMessages[errorCode]) {
            return errorMessages[errorCode];
        }
        return 'Giao dịch không thành công. Vui lòng thử lại sau.';
    };

    const processPayment = async (useFullPayment) => {
        try {
            setLoading(true);

            let response;
            if (isBookingService) {
                response = await bookingApi.getBookingServicePaymentUrl(bookingId, true);
            } else {
                response = await bookingApi.getPaymentUrl(bookingId, useFullPayment);
            }

            if (response.success && response.paymentUrl) {
                navigation.navigate('PaymentWebView', {
                    paymentUrl: response.paymentUrl,
                    bookingId: bookingId,
                    onPaymentComplete: onPaymentComplete,
                    isFullPayment: useFullPayment,
                    isBookingService: isBookingService,
                    homeStayId: homeStayId
                });
            } else {
                throw new Error(response.error || 'Không thể tạo URL thanh toán');
            }
        } catch (error) {
            console.error('Lỗi khi tạo URL thanh toán:', error);
            const errorMessage = error.message || 'Không thể xử lý thanh toán. Vui lòng thử lại sau.';
            Alert.alert('Lỗi', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleTryAgain = () => {
        if (isBookingService) {
            processPayment(true);
            return;
        }
        const depositPercentage = commissionRate && commissionRate.platformShare ? Math.round(commissionRate.platformShare * 100) : 20;
        Alert.alert(
            'Chọn hình thức thanh toán',
            `Bạn muốn thanh toán đầy đủ hay chỉ đặt cọc ${depositPercentage}%?`,
            [
                { text: 'Thanh toán đầy đủ', onPress: () => processPayment(true) },
                { text: `Đặt cọc ${depositPercentage}%`, onPress: () => processPayment(false) },
                { text: 'Hủy', style: 'cancel' }
            ]
        );
    };

    const handleGoHome = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: 'MainTabs',
                        state: {
                            routes: [
                                { name: 'HomeTabs', state: { routes: [{ name: 'Home' }], index: 0 } }
                            ],
                            index: 0
                        }
                    }
                ],
            })
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.error} />
            <LinearGradient
                colors={[colors.error || '#FF5252', '#FF8A80']}
                style={styles.background}
            />
            <View style={styles.content}>
                <View style={styles.failIcon}>
                    <LinearGradient
                        colors={[colors.error || '#FF5252', '#FF8A80']}
                        style={styles.iconCircle}
                    >
                        <FontAwesome5 name="times" size={50} color="#fff" />
                    </LinearGradient>
                </View>
                <Text style={styles.title}>Thanh toán thất bại! </Text>
                <Text style={styles.message}>{getErrorMessage()}</Text>
                <View style={styles.bookingInfo}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mã đặt phòng:</Text>
                        <Text style={styles.infoValue}>{bookingId || "Không có thông tin"}</Text>
                    </View>
                    {errorCode && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Mã lỗi:</Text>
                            <Text style={styles.infoValue}>{errorCode}</Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Trạng thái:</Text>
                        <View style={styles.statusContainer}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Chưa thanh toán</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, loading && styles.disabledButton]}
                        onPress={handleTryAgain}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>Thanh toán lại</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={handleGoHome}
                        disabled={loading}
                    >
                        <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        width: '90%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    failIcon: {
        marginBottom: 20,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.error || '#FF5252',
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    bookingInfo: {
        width: '100%',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 15,
        color: '#666',
    },
    infoValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error || '#FF5252',
        marginRight: 5,
    },
    statusText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.error || '#FF5252',
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: 'transparent',
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 