import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Image, StatusBar, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import authApi from '../services/api/authApi';

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
        // Reset errors
        setApiError("");
        setEmailError("");
        
        // Validate email
        if (!email.trim()) {
            setEmailError("Vui lòng nhập email");
            return;
        }
        
        if (!validateEmail(email)) {
            setEmailError("Email không hợp lệ");
            return;
        }
        
        // Email is valid, proceed with API call
        setIsLoading(true);
        
        try {
            // Call API to request reset token
            const response = await authApi.forgotPassword(email);
            
            // Check if response contains token
            if (response && response.token) {
                // Navigate to reset password screen with email and token
                navigation.navigate('ResetPassword', { 
                    email: email,
                    resetToken: response.token 
                });
            } else {
                // If no token in response, still navigate but show message
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    
                    <Animated.View 
                        entering={FadeInDown.duration(1000).springify()}
                        style={styles.headerContainer}
                    >
                        {/* <Image source={require('../assets/forgot-password.png')} style={styles.image} /> */}
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
                            <View style={styles.apiErrorContainer}>
                                <Text style={styles.apiErrorText}>{apiError}</Text>
                            </View>
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
                            />
                        </View>
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

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
                                    <Text style={styles.submitText}>Gửi yêu cầu</Text>
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 20,
    },
    image: {
        width: 250,
        height: 250,
        resizeMode: 'contain',
    },
    formContainer: {
        paddingHorizontal: 30,
    },
    titleContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    titleText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 10,
    },
    subtitleText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    apiErrorContainer: {
        backgroundColor: colors.error + '20',
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },
    apiErrorText: {
        color: colors.error,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 55,
        backgroundColor: '#F9F9F9',
    },
    inputBoxError: {
        borderColor: colors.error,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        marginTop: -10,
        marginBottom: 15,
        marginLeft: 5,
    },
    submitButton: {
        marginTop: 20,
        height: 55,
        borderRadius: 10,
        overflow: 'hidden',
    },
    disabledButton: {
        opacity: 0.7,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginLinkText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '500',
    },
}); 