import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Image, StatusBar, ActivityIndicator, Alert, Dimensions, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import authApi from '../services/api/authApi';

const { width, height } = Dimensions.get('window');
const scale = width / 375;

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [emailError, setEmailError] = useState("");

    const navigation = useNavigation();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleRequestResetToken = async () => {
        setApiError("");
        setEmailError("");
        if (!email.trim()) {
            setEmailError("Vui lòng nhập email");
            return;
        }
        if (!validateEmail(email)) {
            setEmailError("Email không hợp lệ");
            return;
        }
        setIsLoading(true);
        try {
            const response = await authApi.forgotPassword(email);
            if (response && response.token) {
                navigation.navigate('ResetPassword', {
                    email: email,
                    resetToken: response.token
                });
            } else {
                Alert.alert(
                    "Thông báo",
                    "Vui lòng kiểm tra email của bạn để lấy mã xác nhận đặt lại mật khẩu.",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                navigation.navigate('ResetPassword', {
                                    email: email,
                                    resetToken: ''
                                });
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Request reset token error:', error);
            setApiError(error.message || 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.');
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
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                                <Animated.View
                                    entering={FadeInDown.duration(1000).springify()}
                                    style={styles.headerContainer}
                                >
                                    <View style={styles.logoContainer}>
                                        <Image source={require('../assets/logo.png')} style={styles.image} />
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
                                <Text style={styles.titleText}>Quên mật khẩu?</Text>
                                <Text style={styles.subtitleText}>
                                    Vui lòng nhập email đã đăng ký. Chúng tôi sẽ gửi mã xác nhận để đặt lại mật khẩu.
                                </Text>
                            </View>

                            {/* API Error Message */}
                            {apiError ? (
                                <Animated.View
                                    entering={FadeIn.duration(300)}
                                    style={styles.apiErrorContainer}
                                >
                                    <Ionicons name="alert-circle" size={20} color="#D32F2F" style={styles.errorIcon} />
                                    <Text style={styles.apiErrorText}>{apiError}</Text>
                                </Animated.View>
                            ) : null}

                            {/* Email Input */}
                            <View style={[styles.inputBox, emailError && styles.inputBoxError]}>
                                <Ionicons name="mail-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        setEmailError("");
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                    placeholderTextColor="#9E9E9E"
                                />
                                {email.trim() !== "" && validateEmail(email) && (
                                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                                )}
                            </View>
                            {emailError ? (
                                <Animated.View
                                    entering={FadeInDown.duration(300)}
                                    style={styles.errorContainer}
                                >
                                    <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                                    <Text style={styles.errorText}>{emailError}</Text>
                                </Animated.View>
                            ) : null}
                        </Animated.View>

                        <Animated.View
                            entering={FadeInUp.delay(400).duration(1000).springify()}
                            style={styles.buttonsContainer}
                        >
                            <TouchableOpacity
                                style={[styles.submitButton, isLoading && styles.disabledButton]}
                                onPress={handleRequestResetToken}
                                activeOpacity={0.8}
                                disabled={isLoading}
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
                                            <Text style={styles.submitText}>Gửi yêu cầu</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.arrowIcon} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginLink}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.loginLinkText}>Quay lại đăng nhập</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </TouchableWithoutFeedback>
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
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    backgroundContainer: {
        width: '100%',
        height: height * 0.35,
    },
    headerBackground: {
        width: '100%',
        height: '100%',
    },
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '60%',
    },
    logoContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    image: {
        width: 90,
        height: 90,
        resizeMode: 'contain',
    },
    wavyBackground: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: '#fff',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    formContainer: {
        paddingHorizontal: 30,
        paddingTop: 20,
    },
    titleContainer: {
        marginBottom: 25,
        alignItems: 'center',
    },
    titleText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 10,
    },
    subtitleText: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    apiErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 20,
    },
    errorIcon: {
        marginRight: 10,
    },
    apiErrorText: {
        color: '#D32F2F',
        flex: 1,
        fontSize: 14,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 20,
        height: 60,
        backgroundColor: '#F9F9F9',
    },
    inputBoxError: {
        borderColor: colors.error,
        borderWidth: 1.5,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: colors.textPrimary,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -15,
        marginBottom: 20,
        paddingLeft: 5,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        marginLeft: 5,
    },
    buttonsContainer: {
        paddingHorizontal: 30,
        marginTop: 10,
    },
    submitButton: {
        marginTop: 10,
        borderRadius: 15,
        overflow: 'hidden',
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
    disabledButton: {
        opacity: 0.7,
    },
    gradient: {
        flexDirection: 'row',
        height: 58,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    submitText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    arrowIcon: {
        marginLeft: 10,
    },
    loginLink: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 25,
        padding: 15,
    },
    loginLinkText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
}); 