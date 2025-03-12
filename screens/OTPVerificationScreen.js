import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator,
    Alert, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import authApi from '../services/api/authApi';

export default function OTPVerificationScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { email, isNewUser } = route.params;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);

    useEffect(() => {
        startCountdown();
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
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus next input
        if (text && index < 5) {
            inputRefs.current[index + 1].focus();
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
            // Xác thực OTP và lưu tokens
            await authApi.confirmAccount(email, otpCode);
            
            if (isNewUser) {
                // Sau khi xác thực thành công và lưu tokens, chuyển vào home
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            } else {
                // Case khác (ví dụ: reset password)
                Alert.alert(
                    'Thành công',
                    'Xác thực email thành công!',
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
            }
        } catch (error) {
            setApiError(error.message || 'Mã OTP không chính xác');
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
            Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email của bạn');
        } catch (error) {
            setApiError('Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <BlurView intensity={30} style={styles.blurButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Xác thực OTP</Text>
                <View style={styles.placeholder} />
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Animated.View
                        entering={FadeInDown.delay(100)}
                        style={styles.formContainer}
                    >
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                style={styles.iconBackground}
                            >
                                <Ionicons name="mail-unread" size={40} color="#fff" />
                            </LinearGradient>
                        </View>

                        <Text style={styles.title}>Xác thực email của bạn</Text>
                        <Text style={styles.subtitle}>
                            Vui lòng nhập mã OTP 6 số đã được gửi đến email:
                        </Text>
                        <Text style={styles.email}>{email}</Text>

                        {apiError ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color={colors.error} />
                                <Text style={styles.errorText}>{apiError}</Text>
                            </View>
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
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end= {{ x: 1, y: 1 }}
                                style={styles.gradientButton}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>Xác nhận</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginHorizontal: 20,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingVertical: 30,
    },
    formContainer: {
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 24,
        borderRadius: 30,
        ...Platform.select({
            ios: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    iconBackground: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: 24,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.error + '15',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        width: '100%',
    },
    errorText: {
        color: colors.error,
        marginLeft: 8,
        flex: 1,
        fontSize: 14,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    otpInput: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        textAlign: 'center',
        fontSize: 20,
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
        width: '100%',
        marginBottom: 20,
        borderRadius: 15,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    gradientButton: {
        flexDirection: 'row',
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resendText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    resendButton: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginLeft: 4,
    },
    disabledText: {
        opacity: 0.5,
    },
});