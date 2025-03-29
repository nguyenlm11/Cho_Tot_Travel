import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { colors } from '../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function BookingSuccess() {
    const navigation = useNavigation();
    const route = useRoute();
    const { bookingId, totalPrice, roomCount, nightCount } = route.params;

    const handleGoToBookings = () => {
        navigation.navigate('BookingList');
    };

    const handleGoHome = () => {
        navigation.navigate('Home');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.background}
            />

            <Animated.View
                entering={SlideInDown.delay(300).springify()}
                style={styles.content}
            >
                <Animated.View 
                    entering={FadeInDown.delay(500)}
                    style={styles.successIcon}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.iconCircle}
                    >
                        <FontAwesome5 name="check" size={50} color="#fff" />
                    </LinearGradient>
                </Animated.View>

                <Animated.Text 
                    entering={FadeInDown.delay(700)}
                    style={styles.title}
                >
                    Đặt phòng thành công!
                </Animated.Text>

                <Animated.Text
                    entering={FadeInDown.delay(900)}
                    style={styles.message}
                >
                    Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Thông tin đặt phòng đã được gửi đến email của bạn.
                </Animated.Text>

                <Animated.View
                    entering={FadeInDown.delay(1100)}
                    style={styles.bookingInfo}
                >
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mã đặt phòng:</Text>
                        <Text style={styles.infoValue}>{bookingId}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Số phòng:</Text>
                        <Text style={styles.infoValue}>{roomCount} phòng</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Số đêm:</Text>
                        <Text style={styles.infoValue}>{nightCount} đêm</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tổng tiền:</Text>
                        <Text style={styles.infoValue}>{totalPrice.toLocaleString('vi-VN')}₫</Text>
                    </View>
                </Animated.View>

                <Animated.View
                    entering={FadeIn.delay(1300)}
                    style={styles.buttonContainer}
                >
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleGoToBookings}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>Xem đặt phòng</Text>
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
    successIcon: {
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
        color: colors.primary,
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