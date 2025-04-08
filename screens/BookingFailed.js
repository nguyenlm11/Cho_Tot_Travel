import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { colors } from '../constants/Colors';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';

export default function BookingFailed() {
    const navigation = useNavigation();
    const route = useRoute();
    const { bookingId, errorCode, error } = route.params || {};

    // Mảng mã lỗi và mô tả tương ứng
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

    // Hiển thị mô tả lỗi phù hợp
    const getErrorMessage = () => {
        if (error) return error;
        if (errorCode && errorMessages[errorCode]) {
            return errorMessages[errorCode];
        }
        return 'Giao dịch không thành công. Vui lòng thử lại sau.';
    };

    const handleTryAgain = () => {
        navigation.goBack();
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
                                {
                                    name: 'HomeTabs',
                                    state: {
                                        routes: [{ name: 'Home' }],
                                        index: 0,
                                    }
                                }
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

            <Animated.View
                entering={SlideInDown.delay(300).springify()}
                style={styles.content}
            >
                <Animated.View
                    entering={FadeInDown.delay(500)}
                    style={styles.failIcon}
                >
                    <LinearGradient
                        colors={[colors.error || '#FF5252', '#FF8A80']}
                        style={styles.iconCircle}
                    >
                        <FontAwesome5 name="times" size={50} color="#fff" />
                    </LinearGradient>
                </Animated.View>

                <Animated.Text
                    entering={FadeInDown.delay(700)}
                    style={styles.title}
                >
                    Thanh toán thất bại!
                </Animated.Text>

                <Animated.Text
                    entering={FadeInDown.delay(900)}
                    style={styles.message}
                >
                    {getErrorMessage()}
                </Animated.Text>

                <Animated.View
                    entering={FadeInDown.delay(1100)}
                    style={styles.bookingInfo}
                >
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
                </Animated.View>

                <Animated.View
                    entering={FadeIn.delay(1300)}
                    style={styles.buttonContainer}
                >
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleTryAgain}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>Thử lại</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={handleGoHome}
                    >
                        <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
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
}); 