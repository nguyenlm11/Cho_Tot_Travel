import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { colors } from '../constants/Colors';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';

export default function BookingSuccess() {
    const navigation = useNavigation();
    const route = useRoute();
    const { bookingId, transactionId } = route.params || {};

    const handleGoToBookings = () => {
        navigation.replace('HomeTabs', {
            screen: 'Booking'
        });
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
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

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
                    Thanh toán thành công!
                </Animated.Text>

                <Animated.Text
                    entering={FadeInDown.delay(900)}
                    style={styles.message}
                >
                    Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Chúng tôi đã ghi nhận thanh toán của bạn và đã xác nhận đơn đặt phòng.
                </Animated.Text>

                <Animated.View
                    entering={FadeInDown.delay(1100)}
                    style={styles.bookingInfo}
                >
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mã đặt phòng:</Text>
                        <Text style={styles.infoValue}>{bookingId || "Không có thông tin"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mã giao dịch:</Text>
                        <Text style={styles.infoValue}>{transactionId || "Không có thông tin"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Trạng thái:</Text>
                        <View style={styles.statusContainer}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Đã thanh toán</Text>
                        </View>
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
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginRight: 5,
    },
    statusText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#4CAF50',
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