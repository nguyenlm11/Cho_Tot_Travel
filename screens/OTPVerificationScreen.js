import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StatusBar, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import authApi from '../services/api/authApi';

const { width, height } = Dimensions.get('window');
const scale = width / 375;

export default function OTPVerificationScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { email, message } = route.params;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(message || '');
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);

    useEffect(() => {
        startCountdown();
        setTimeout(() => {
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        }, 500);
    }, []);

    const startCountdown = () => {
        setCanResend(false);
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown((prevCount) => {
                if (prevCount <= 1) {
                    clearInterval(timer);
                    setCanResend(true);
                    return 0;
                }
                return prevCount - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    };

    const handleOtpChange = (text, index) => {
        if (!/^\d*$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text && index < 5) {
            inputRefs.current[index + 1].focus();
        }
        if (text && index === 5 && newOtp.every(digit => digit)) {
            setTimeout(() => handleVerifyOTP(), 300);
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerifyOTP = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setApiError('Vui lòng nhập đủ 6 số OTP');
            return;
        }
        setIsLoading(true);
        setApiError('');
        try {
            await authApi.confirmAccount(email, otpCode);
            Alert.alert(
                'Thành công',
                'Xác thực email thành công! Vui lòng đăng nhập để tiếp tục.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        }
                    }
                ]
            );
        } catch (error) {
            setApiError(error.message || 'Mã OTP không chính xác');
            setOtp(['', '', '', '', '', '']);
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;
        setIsLoading(true);
        setApiError('');
        try {
            await authApi.resendOTP(email);
            startCountdown();
            setOtp(['', '', '', '', '', '']);
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
            Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email của bạn');
        } catch (error) {
            setApiError('Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={colors.primary}
                translucent={true}
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <Animated.View
                        entering={FadeIn.duration(500)}
                        style={styles.backgroundContainer}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={styles.headerBackground}
                        >
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <BlurView intensity={30} style={styles.blurButton}>
                                    <Ionicons name="arrow-back" size={24} color="#fff" />
                                </BlurView>
                            </TouchableOpacity>

                            <Animated.View
                                entering={FadeInDown.duration(1000).springify()}
                                style={styles.headerContainer}
                            >
                                <View style={styles.logoContainer}>
                                    <Ionicons name="mail-unread" size={Math.min(width * 0.12, 45)} color={colors.primary} />
                                </View>
                            </Animated.View>

                            <Animated.View
                                entering={FadeInDown.delay(200).duration(800)}
                                style={styles.wavyBackground}
                            />
                        </LinearGradient>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInUp.delay(200).duration(1000).springify()}
                        style={styles.formContainer}
                    >
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleText}>Xác thực OTP</Text>
                            <Text style={styles.subtitleText}>
                                Vui lòng nhập mã 6 số đã được gửi đến
                            </Text>
                            <Text style={styles.emailText}>{email}</Text>
                        </View>

                        {apiError ? (
                            <Animated.View
                                entering={FadeIn.duration(300)}
                                style={styles.apiErrorContainer}
                            >
                                <Ionicons name="alert-circle" size={20} color="#D32F2F" style={styles.errorIcon} />
                                <Text style={styles.apiErrorText}>{apiError}</Text>
                            </Animated.View>
                        ) : null}

                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={ref => inputRefs.current[index] = ref}
                                    style={styles.otpInput}
                                    value={digit}
                                    onChangeText={(text) => handleOtpChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectTextOnFocus
                                    editable={!isLoading}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.verifyButton, isLoading && styles.disabledButton]}
                            onPress={handleVerifyOTP}
                            disabled={isLoading || otp.some(digit => !digit)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>Xác nhận</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.arrowIcon} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>
                                Không nhận được mã?
                            </Text>
                            <TouchableOpacity
                                onPress={handleResendOTP}
                                disabled={!canResend || isLoading}
                            >
                                <Text style={[
                                    styles.resendButton,
                                    (!canResend || isLoading) && styles.disabledText
                                ]}>
                                    {canResend ? 'Gửi lại' : `Gửi lại sau ${countdown}s`}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.primary,
    },
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollContainer: {
        flexGrow: 1,
    },
    backgroundContainer: {
        width: '100%',
        height: height * 0.32,
    },
    headerBackground: {
        width: '100%',
        height: '100%',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
    },
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    wavyBackground: {
        position: 'absolute',
        bottom: -20,
        left: 0,
        right: 0,
        height: 50,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 15,
        left: 15,
        zIndex: 10,
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
    logoContainer: {
        width: Math.min(width * 0.32, 140),
        height: Math.min(width * 0.32, 140),
        borderRadius: Math.min(width * 0.16, 70),
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
    },
    formContainer: {
        width: "100%",
        marginTop: 10,
        paddingHorizontal: width * 0.06,
        backgroundColor: '#fff',
    },
    titleContainer: {
        marginBottom: 25,
        alignItems: 'center',
    },
    titleText: {
        fontSize: Math.max(24, scale * 26),
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 5,
    },
    subtitleText: {
        fontSize: Math.max(15, scale * 15),
        color: colors.textSecondary,
        textAlign: 'center',
    },
    emailText: {
        fontSize: Math.max(16, scale * 16),
        fontWeight: '600',
        color: colors.primary,
        marginTop: 5,
    },
    apiErrorContainer: {
        backgroundColor: "#FFEBEE",
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorIcon: {
        marginRight: 10,
    },
    apiErrorText: {
        color: "#D32F2F",
        fontSize: 14,
        flex: 1,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
        marginTop: 10,
    },
    otpInput: {
        width: width * 0.12,
        height: width * 0.15,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        textAlign: 'center',
        fontSize: Math.max(22, scale * 22),
        fontWeight: '600',
        color: colors.textPrimary,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    verifyButton: {
        width: "100%",
        height: Math.max(55, scale * 55),
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 20,
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    gradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: 'row',
    },
    buttonText: {
        color: "white",
        fontSize: Math.max(18, scale * 18),
        fontWeight: "600",
        marginRight: 8,
    },
    arrowIcon: {
        marginLeft: 5,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    resendText: {
        fontSize: Math.max(15, scale * 15),
        color: colors.textSecondary,
    },
    resendButton: {
        fontSize: Math.max(15, scale * 15),
        fontWeight: '600',
        color: colors.primary,
        marginLeft: 8,
    },
    disabledText: {
        opacity: 0.5,
    },
});