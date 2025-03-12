import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Image, StatusBar, ActivityIndicator } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { colors } from "../constants/Colors";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authApi from '../services/api/authApi';

export default function RegisterScreen() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [secureText, setSecureText] = useState(true);
    const [secureTextConfirm, setSecureTextConfirm] = useState(true);
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const navigation = useNavigation();

    const [errors, setErrors] = useState({
        username: false,
        email: false,
        password: false,
        confirmPassword: false,
        name: false,
        address: false,
        phone: false,
        terms: false
    });

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[0-9])(?=.*[\W_]).{8,}$/;
        return passwordRegex.test(password);
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^[0-9]{10,11}$/;
        return phoneRegex.test(phone);
    };

    const validateForm = () => {
        setApiError('');
        
        let newErrors = {
            username: username.trim() === "",
            email: !validateEmail(email),
            password: !validatePassword(password),
            confirmPassword: password !== confirmPassword,
            name: name.trim() === "",
            address: address.trim() === "",
            phone: !validatePhone(phone),
            terms: !agreed
        };
        setErrors(newErrors);

        const hasError = Object.values(newErrors).some(error => error);
        if (hasError) {
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        setApiError('');
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await authApi.register({
                userName: username,
                email,
                password,
                name,
                address,
                phone
            });
            
            navigation.navigate('OTPVerification', { email, isNewUser: true });
        } catch (error) {
            setApiError(error.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
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
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        entering={FadeInDown.duration(1000).springify()}
                        style={styles.headerContainer}
                    >
                        <Image source={require('../assets/mobile-register.png')} style={styles.image} />
                    </Animated.View>

                    {/* Input Fields */}
                    <Animated.View
                        entering={FadeInUp.delay(200).duration(1000).springify()}
                        style={styles.formContainer}
                    >
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleText}>Tạo tài khoản</Text>
                            <Text style={styles.subtitleText}>Nhập thông tin để đăng ký tài khoản mới</Text>
                        </View>

                        {/* API Error Message */}
                        {apiError ? (
                            <View style={styles.apiErrorContainer}>
                                <Text style={styles.apiErrorText}>{apiError}</Text>
                            </View>
                        ) : null}

                        {/* Username Input */}
                        <View style={[styles.inputBox, errors.username && styles.errorBorder]}>
                            <Ionicons name="person-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Tên đăng nhập"
                                value={username.trim()}
                                onChangeText={setUsername}
                                keyboardType="default"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>
                        {errors.username && <Text style={styles.errorText}>Tên đăng nhập không được để trống</Text>}

                        {/* Name Input */}
                        <View style={[styles.inputBox, errors.name && styles.errorBorder]}>
                            <Ionicons name="person-circle-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Họ và tên"
                                value={name.trim()}
                                onChangeText={setName}
                                keyboardType="default"
                                editable={!isLoading}
                            />
                        </View>
                        {errors.name && <Text style={styles.errorText}>Họ và tên không được để trống</Text>}

                        {/* Email Input */}
                        <View style={[styles.inputBox, errors.email && styles.errorBorder]}>
                            <Ionicons name="mail-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email.trim()}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>
                        {errors.email && <Text style={styles.errorText}>Email không hợp lệ</Text>}

                        {/* Phone Input */}
                        <View style={[styles.inputBox, errors.phone && styles.errorBorder]}>
                            <Ionicons name="call-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Số điện thoại"
                                value={phone.trim()}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                editable={!isLoading}
                            />
                        </View>
                        {errors.phone && <Text style={styles.errorText}>Số điện thoại không hợp lệ (10-11 số)</Text>}

                        {/* Address Input */}
                        <View style={[styles.inputBox, errors.address && styles.errorBorder]}>
                            <Ionicons name="location-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Địa chỉ"
                                value={address.trim()}
                                onChangeText={setAddress}
                                keyboardType="default"
                                editable={!isLoading}
                            />
                        </View>
                        {errors.address && <Text style={styles.errorText}>Địa chỉ không được để trống</Text>}

                        {/* Password Input */}
                        <View style={[styles.inputBox, errors.password && styles.errorBorder]}>
                            <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mật khẩu"
                                value={password.trim()}
                                onChangeText={setPassword}
                                secureTextEntry={secureText}
                                editable={!isLoading}
                            />
                            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon} disabled={isLoading}>
                                <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {errors.password && <Text style={styles.errorText}>Mật khẩu phải có ít nhất 8 ký tự, 1 số và 1 ký tự đặc biệt</Text>}

                        {/* Confirm Password Input */}
                        <View style={[styles.inputBox, errors.confirmPassword && styles.errorBorder]}>
                            <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Xác nhận mật khẩu"
                                value={confirmPassword.trim()}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={secureTextConfirm}
                                editable={!isLoading}
                            />
                            <TouchableOpacity onPress={() => setSecureTextConfirm(!secureTextConfirm)} style={styles.eyeIcon} disabled={isLoading}>
                                <Ionicons name={secureTextConfirm ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmPassword && <Text style={styles.errorText}>Mật khẩu không khớp</Text>}

                        <TouchableOpacity
                            style={styles.termsContainer}
                            onPress={() => setAgreed(!agreed)}
                            disabled={isLoading}
                        >
                            <View style={[styles.checkbox, agreed && styles.checkedBox]}>
                                {agreed && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={styles.termsText}>
                                Tôi đồng ý với <Text style={styles.termsLink}>Điều khoản</Text> và <Text style={styles.termsLink}>Chính sách bảo mật</Text>
                            </Text>
                        </TouchableOpacity>
                        {errors.terms && <Text style={styles.errorText}>Bạn phải đồng ý với điều khoản dịch vụ</Text>}
                    </Animated.View>

                    <Animated.View
                        entering={FadeInUp.delay(400).duration(1000).springify()}
                        style={styles.buttonsContainer}
                    >
                        <TouchableOpacity
                            style={[styles.registerButton, isLoading && styles.disabledButton]}
                            activeOpacity={0.8}
                            onPress={handleRegister}
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
                                    <Text style={styles.registerText}>Đăng ký</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.orText}>hoặc đăng ký với</Text>
                            <View style={styles.divider} />
                        </View>

                        <View style={styles.socialButtonsContainer}>
                            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
                                <FontAwesome name="google" size={22} color="#DB4437" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
                                <FontAwesome name="facebook" size={22} color="#4267B2" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
                                <FontAwesome name="apple" size={22} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.loginContainer}>
                            <Text style={styles.haveAccountText}>Đã có tài khoản? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
                                <Text style={styles.loginLinkText}>Đăng nhập</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 25,
        paddingBottom: 30,
    },
    headerContainer: {
        alignItems: 'center',
        position: 'relative',
        paddingTop: 10,
    },
    image: {
        width: 250,
        height: 200,
        resizeMode: 'contain',
    },
    formContainer: {
        width: "100%",
    },
    titleContainer: {
        marginBottom: 20,
    },
    titleText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 15,
        color: colors.textSecondary,
    },
    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F8FA",
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 55,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    errorBorder: {
        borderWidth: 1,
        borderColor: colors.error,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 55,
        fontSize: 16,
        color: colors.textPrimary,
    },
    errorText: {
        color: colors.error,
        fontSize: 12,
        marginBottom: 10,
        marginTop: -10,
        marginLeft: 5,
    },
    eyeIcon: {
        padding: 10,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 15,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.textSecondary,
        marginRight: 10,
        marginTop: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkedBox: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    termsText: {
        flex: 1,
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    termsLink: {
        color: colors.primary,
        fontWeight: '600',
    },
    buttonsContainer: {
        width: "100%",
        marginTop: 10,
    },
    registerButton: {
        width: "100%",
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    gradient: {
        paddingVertical: 16,
        alignItems: "center",
    },
    registerText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 25,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: "#E1E8ED",
    },
    orText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginHorizontal: 15,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 25,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F5F8FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 2.65,
        elevation: 1,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    haveAccountText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    loginLinkText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
    },
    apiErrorContainer: {
        backgroundColor: '#FFEBEE',
        padding: 10,
        borderRadius: 10,
        marginBottom: 15,
    },
    apiErrorText: {
        color: '#D32F2F',
        fontSize: 14,
    },
    disabledButton: {
        opacity: 0.7,
    },
});