import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Image, 
    KeyboardAvoidingView, 
    ScrollView, 
    Platform, 
    StatusBar, 
    ActivityIndicator, 
    Alert,
    Dimensions,
    SafeAreaView
} from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { colors } from '../constants/Colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AnimatedLottieView from 'lottie-react-native';
import Animated, { 
    FadeInDown, 
    FadeInUp, 
    FadeIn, 
    SlideInUp, 
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay
} from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const CELL_COUNT = 6;

export default function OTPVerificationScreen({ route }) {
    const { email, isNewUser = true } = route.params;
    const [otp, setOtp] = useState('');
    const [countDown, setCountDown] = useState(60);
    const [isResending, setIsResending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [timerActive, setTimerActive] = useState(true);
    const [apiError, setApiError] = useState('');
    const [verificationSuccess, setVerificationSuccess] = useState(false);

    // Animation values
    const animationProgress = useSharedValue(0);
    const cellScale = useSharedValue(1);
    
    const animationRef = useRef(null);
    const navigation = useNavigation();
    const { confirmAccount, resendOTP } = useAuth();

    const ref = useBlurOnFulfill({ value: otp, cellCount: CELL_COUNT });
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
        value: otp,
        setValue: setOtp,
    });

    // Animate cells when OTP is entered
    useEffect(() => {
        if (otp.length === CELL_COUNT) {
            cellScale.value = withSequence(
                withTiming(1.1, { duration: 100 }),
                withTiming(1, { duration: 100 })
            );
        }
    }, [otp]);

    // Countdown timer
    useEffect(() => {
        let interval;
        if (timerActive && countDown > 0) {
            interval = setInterval(() => {
                setCountDown(prevCount => prevCount - 1);
            }, 1000);
        } else if (countDown === 0) {
            setTimerActive(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [countDown, timerActive]);

    const handleVerifyOtp = async () => {
        // Reset API error
        setApiError('');
        
        if (otp.length !== CELL_COUNT) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mã OTP');
            return;
        }
        
        setIsVerifying(true);
        
        try {
            // Call API to verify OTP
            const response = await confirmAccount(email, otp);
            
            // Kiểm tra và lưu token nếu có
            if (response) {
                if (response.token || response['access-token']) {
                    const token = response.token || response['access-token'];
                    await AsyncStorage.setItem('token', token);
                }
                
                if (response.refreshToken || response['refresh-token']) {
                    const refreshToken = response.refreshToken || response['refresh-token'];
                    await AsyncStorage.setItem('refreshToken', refreshToken);
                }
                
                // Lưu thông tin người dùng
                await AsyncStorage.setItem('user', JSON.stringify(response));
            }
            
            // Show success animation
            setVerificationSuccess(true);
            if (animationRef.current) {
                animationRef.current.play();
                animationProgress.value = withTiming(1, { duration: 1500 });
            }
            
            // Sau khi nhập OTP thành công, đưa người dùng vào trực tiếp HomeScreen.js
            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            }, 2000);
        } catch (error) {
            console.error('OTP verification error:', error);
            setApiError(error.message || 'Xác minh OTP thất bại. Vui lòng thử lại.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        if (countDown > 0) return;

        // Reset API error
        setApiError('');
        setIsResending(true);

        try {
            // Call API to resend OTP
            await resendOTP(email);
            setCountDown(60);
            setTimerActive(true);
            
            // Show success toast instead of alert
            setOtp('');
            Alert.alert('Thành công', 'Mã OTP đã được gửi lại');
        } catch (error) {
            console.error('Resend OTP error:', error);
            setApiError(error.message || 'Gửi lại OTP thất bại. Vui lòng thử lại.');
        } finally {
            setIsResending(false);
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    };

    const maskedEmail = email.replace(/(.{3})(.*)(@.*)/, '$1***$3');

    // Animated style for cells
    const animatedCellStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: cellScale.value }],
        };
    });

    // Animated style for success animation
    const animatedSuccessStyle = useAnimatedStyle(() => {
        return {
            opacity: animationProgress.value,
            transform: [
                { scale: animationProgress.value },
            ],
        };
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header with back button */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            disabled={isVerifying || verificationSuccess}
                        >
                            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Xác minh OTP</Text>
                        </View>
                        
                        <View style={styles.placeholderView} />
                    </View>

                    {/* Main content */}
                    <Animated.View
                        entering={FadeInDown.duration(800).springify()}
                        style={styles.contentContainer}
                    >
                        <Image 
                            source={require('../assets/enter-OTP-bro.png')} 
                            style={styles.image} 
                            resizeMode="contain"
                        />
                        
                        <Animated.View
                            entering={FadeInUp.delay(300).duration(800).springify()}
                            style={styles.textContainer}
                        >
                            <Text style={styles.title}>Xác minh OTP</Text>
                            <Text style={styles.subtitle}>
                                Vui lòng nhập mã OTP 6 chữ số đã được gửi đến
                            </Text>
                            <Text style={styles.emailText}>{maskedEmail}</Text>
                        </Animated.View>

                        {/* API Error Message */}
                        {apiError ? (
                            <Animated.View 
                                entering={SlideInUp.duration(400)}
                                style={styles.apiErrorContainer}
                            >
                                <Ionicons name="alert-circle" size={20} color="#fff" />
                                <Text style={styles.apiErrorText}>{apiError}</Text>
                            </Animated.View>
                        ) : null}

                        {/* OTP Input */}
                        <Animated.View
                            entering={FadeInUp.delay(500).duration(800).springify()}
                            style={styles.otpContainer}
                        >
                            <CodeField
                                ref={ref}
                                {...props}
                                value={otp}
                                onChangeText={setOtp}
                                cellCount={CELL_COUNT}
                                rootStyle={styles.codeFieldRoot}
                                keyboardType="number-pad"
                                textContentType="oneTimeCode"
                                editable={!isVerifying && !verificationSuccess}
                                renderCell={({ index, symbol, isFocused }) => (
                                    <Animated.View
                                        key={index}
                                        style={[
                                            styles.cell,
                                            isFocused && styles.focusedCell,
                                            verificationSuccess && styles.successCell,
                                            otp.length === CELL_COUNT && index < CELL_COUNT && animatedCellStyle,
                                        ]}
                                        entering={FadeInDown.delay(index * 100 + 600).springify()}
                                        onLayout={getCellOnLayoutHandler(index)}
                                    >
                                        <Text style={[
                                            styles.cellText,
                                            verificationSuccess && styles.successCellText
                                        ]}>
                                            {symbol || (isFocused ? <Cursor /> : null)}
                                        </Text>
                                    </Animated.View>
                                )}
                            />

                            {/* Timer */}
                            <View style={styles.timerContainer}>
                                <Ionicons 
                                    name={timerActive ? "time-outline" : "time-outline"} 
                                    size={20} 
                                    color={timerActive ? colors.primary : colors.textSecondary} 
                                />
                                <Text style={[
                                    styles.timerText,
                                    timerActive ? styles.activeTimerText : styles.expiredTimerText
                                ]}>
                                    {timerActive 
                                        ? `Mã sẽ hết hạn sau ${formatTime(countDown)}` 
                                        : 'Mã OTP đã hết hạn'
                                    }
                                </Text>
                            </View>

                            {/* Resend Button */}
                            <TouchableOpacity
                                style={[
                                    styles.resendButton,
                                    (countDown > 0 || isResending || isVerifying || verificationSuccess) && styles.resendButtonDisabled
                                ]}
                                onPress={handleResendOtp}
                                disabled={countDown > 0 || isResending || isVerifying || verificationSuccess}
                            >
                                <Ionicons 
                                    name="refresh-outline" 
                                    size={18} 
                                    color={(countDown > 0 || isResending || isVerifying || verificationSuccess) ? colors.textSecondary : '#fff'} 
                                />
                                <Text style={[
                                    styles.resendText,
                                    (countDown > 0 || isResending || isVerifying || verificationSuccess) && styles.resendTextDisabled
                                ]}>
                                    {isResending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Verify Button */}
                        <Animated.View
                            entering={FadeInUp.delay(700).duration(800).springify()}
                            style={styles.verifyButtonContainer}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.verifyButton,
                                    (isVerifying || verificationSuccess || otp.length !== CELL_COUNT) && styles.disabledButton
                                ]}
                                onPress={handleVerifyOtp}
                                disabled={isVerifying || verificationSuccess || otp.length !== CELL_COUNT}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.secondary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradient}
                                >
                                    {isVerifying ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.verifyText}>Xác minh</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.arrowIcon} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>

                    {/* Success Animation */}
                    {verificationSuccess && (
                        <Animated.View
                            style={[styles.successOverlay, animatedSuccessStyle]}
                        >
                            <View style={styles.successContainer}>
                                <AnimatedLottieView
                                    ref={animationRef}
                                    // source={require('../assets/animations/success.json')}
                                    style={styles.successAnimation}
                                    autoPlay={false}
                                    loop={false}
                                />
                                <Animated.Text 
                                    entering={ZoomIn.delay(500).duration(500)}
                                    style={styles.successText}
                                >
                                    Xác minh thành công!
                                </Animated.Text>
                                <Animated.Text 
                                    entering={FadeIn.delay(800).duration(500)}
                                    style={styles.redirectText}
                                >
                                    Đang chuyển hướng...
                                </Animated.Text>
                            </View>
                        </Animated.View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 10,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    placeholderView: {
        width: 40,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    image: {
        width: width * 0.7,
        height: width * 0.7,
        marginTop: 10,
    },
    textContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
    },
    emailText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.primary,
        marginTop: 4,
    },
    apiErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.error,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 20,
        width: '100%',
    },
    apiErrorText: {
        color: '#fff',
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
    otpContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    codeFieldRoot: {
        width: '100%',
        marginBottom: 24,
    },
    cell: {
        width: 50,
        height: 60,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    focusedCell: {
        borderColor: colors.primary,
        backgroundColor: '#F0FFF0',
        shadowOpacity: 0.1,
        elevation: 2,
    },
    successCell: {
        borderColor: colors.success,
        backgroundColor: '#F0FFF4',
    },
    cellText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    successCellText: {
        color: colors.success,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    timerText: {
        fontSize: 16,
        marginLeft: 8,
    },
    activeTimerText: {
        color: colors.primary,
        fontWeight: '500',
    },
    expiredTimerText: {
        color: colors.error,
    },
    resendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        width: '80%',
    },
    resendButtonDisabled: {
        backgroundColor: '#F0F0F0',
    },
    resendText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },
    resendTextDisabled: {
        color: colors.textSecondary,
    },
    verifyButtonContainer: {
        width: '100%',
        marginTop: 10,
        marginBottom: 30,
    },
    verifyButton: {
        borderRadius: 30,
        overflow: 'hidden',
        height: 56,
    },
    disabledButton: {
        opacity: 0.7,
    },
    gradient: {
        flexDirection: 'row',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    arrowIcon: {
        marginLeft: 8,
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    successContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    successAnimation: {
        width: 200,
        height: 200,
    },
    successText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.success,
        marginTop: 20,
    },
    redirectText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 10,
    },
});