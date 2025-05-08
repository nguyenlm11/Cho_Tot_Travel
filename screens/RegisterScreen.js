import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Image, StatusBar, ActivityIndicator, Dimensions, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/Colors";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import authApi from '../services/api/authApi';

const { width, height } = Dimensions.get('window');
const scale = width / 375;

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
        setErrors(newErrors)
        const hasError = Object.values(newErrors).some(error => error);
        if (hasError) {
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        setApiError('');
        if (!validateForm()) {return;}
        setIsLoading(true);
        try {
            await authApi.register({
                userName: username,
                email,
                password,
                name,
                address,
                phone,
                bankAccountNumber: 'string',
                taxCode: 'string',
            });
            navigation.navigate('OTPVerification', {
                email,
                isNewUser: true,
                message: 'Vui lòng kiểm tra email của bạn để lấy mã xác thực'
            });
        } catch (error) {
            setApiError(error.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
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
                        keyboardShouldPersistTaps="handled"
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
                                <Text style={styles.titleText}>Tạo tài khoản</Text>
                                <Text style={styles.subtitleText}>Nhập thông tin để đăng ký tài khoản mới</Text>
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

                            {/* Username and Name Row */}
                            <View style={styles.inputRow}>
                                <View style={[styles.inputBoxHalf, errors.username && styles.errorBorder]}>
                                    <Ionicons name="person-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Tên đăng nhập"
                                        value={username.trim()}
                                        onChangeText={setUsername}
                                        keyboardType="default"
                                        autoCapitalize="none"
                                        editable={!isLoading}
                                        placeholderTextColor="#9E9E9E"
                                    />
                                </View>

                                <View style={[styles.inputBoxHalf, errors.name && styles.errorBorder]}>
                                    <Ionicons name="person-circle-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Họ và tên"
                                        value={name}
                                        onChangeText={setName}
                                        keyboardType="default"
                                        editable={!isLoading}
                                        placeholderTextColor="#9E9E9E"
                                    />
                                </View>
                            </View>
                            
                            {/* Errors for Username and Name */}
                            <View style={styles.inputRow}>
                                <View style={styles.errorContainer}>
                                    {errors.username && (
                                        <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
                                            Tên đăng nhập không được để trống
                                        </Animated.Text>
                                    )}
                                </View>
                                <View style={styles.errorContainer}>
                                    {errors.name && (
                                        <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
                                            Họ và tên không được để trống
                                        </Animated.Text>
                                    )}
                                </View>
                            </View>

                            {/* Email and Phone Row */}
                            <View style={styles.inputRow}>
                                <View style={[styles.inputBoxHalf, errors.email && styles.errorBorder]}>
                                    <Ionicons name="mail-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email"
                                        value={email.trim()}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isLoading}
                                        placeholderTextColor="#9E9E9E"
                                    />
                                </View>

                                <View style={[styles.inputBoxHalf, errors.phone && styles.errorBorder]}>
                                    <Ionicons name="call-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Số điện thoại"
                                        value={phone.trim()}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                        editable={!isLoading}
                                        placeholderTextColor="#9E9E9E"
                                    />
                                </View>
                            </View>
                            
                            {/* Errors for Email and Phone */}
                            <View style={styles.inputRow}>
                                <View style={styles.errorContainer}>
                                    {errors.email && (
                                        <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
                                            Email không hợp lệ
                                        </Animated.Text>
                                    )}
                                </View>
                                <View style={styles.errorContainer}>
                                    {errors.phone && (
                                        <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
                                            Số điện thoại không hợp lệ (10-11 số)
                                        </Animated.Text>
                                    )}
                                </View>
                            </View>

                            {/* Address */}
                            <View style={[styles.inputBox, errors.address && styles.errorBorder]}>
                                <Ionicons name="location-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Địa chỉ"
                                    value={address}
                                    onChangeText={setAddress}
                                    keyboardType="default"
                                    editable={!isLoading}
                                    placeholderTextColor="#9E9E9E"
                                />
                            </View>
                            {errors.address && (
                                <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
                                    Địa chỉ không được để trống
                                </Animated.Text>
                            )}

                            {/* Password and Confirm Password Row */}
                            <View style={styles.inputRow}>
                                <View style={[styles.inputBoxHalf, errors.password && styles.errorBorder]}>
                                    <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mật khẩu"
                                        value={password.trim()}
                                        onChangeText={setPassword}
                                        secureTextEntry={secureText}
                                        editable={!isLoading}
                                        placeholderTextColor="#9E9E9E"
                                    />
                                    <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon} disabled={isLoading}>
                                        <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.inputBoxHalf, errors.confirmPassword && styles.errorBorder]}>
                                    <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Xác nhận mật khẩu"
                                        value={confirmPassword.trim()}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={secureTextConfirm}
                                        editable={!isLoading}
                                        placeholderTextColor="#9E9E9E"
                                    />
                                    <TouchableOpacity onPress={() => setSecureTextConfirm(!secureTextConfirm)} style={styles.eyeIcon} disabled={isLoading}>
                                        <Ionicons name={secureTextConfirm ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            
                            {/* Errors for Password and Confirm Password */}
                            <View style={styles.inputRow}>
                                <View style={styles.errorContainer}>
                                    {errors.password && (
                                        <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
                                            Mật khẩu phải có ít nhất 8 ký tự, 1 số và 1 ký tự đặc biệt
                                        </Animated.Text>
                                    )}
                                </View>
                                <View style={styles.errorContainer}>
                                    {errors.confirmPassword && (
                                        <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
                                            Mật khẩu không khớp
                                        </Animated.Text>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.termsContainer}
                                onPress={() => setAgreed(!agreed)}
                                disabled={isLoading}
                            >
                                <View style={[styles.checkbox, agreed && styles.checkedBox, errors.terms && styles.errorCheckbox]}>
                                    {agreed && <Ionicons name="checkmark" size={16} color="#fff" />}
                                </View>
                                <Text style={styles.termsText}>
                                    Tôi đồng ý với <Text style={styles.termsHighlight}>Điều khoản</Text> và <Text style={styles.termsHighlight}>Chính sách bảo mật</Text>
                                </Text>
                            </TouchableOpacity>
                            {errors.terms && (
                                <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
                                    Bạn phải đồng ý với điều khoản và điều kiện
                                </Animated.Text>
                            )}
                        </Animated.View>

                        <Animated.View
                            entering={FadeInUp.delay(400).duration(1000).springify()}
                            style={styles.buttonsContainer}
                        >
                            <TouchableOpacity
                                style={[styles.registerButton, isLoading && styles.disabledButton]}
                                onPress={handleRegister}
                                disabled={isLoading}
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
                                            <Text style={styles.registerButtonText}>Đăng ký</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.arrowIcon} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.loginContainer}>
                                <Text style={styles.haveAccountText}>Đã có tài khoản? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.loginText}>Đăng nhập</Text>
                                </TouchableOpacity>
                            </View>
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
        backgroundColor: "#fff",
    },
    scrollContainer: {
        flexGrow: 1,
    },
    backgroundContainer: {
        width: '100%',
        height: height * 0.28, // Smaller header for register screen
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
    image: {
        width: Math.min(width * 0.24, 110),
        height: Math.min(width * 0.24, 110),
        resizeMode: 'contain',
    },
    formContainer: {
        width: "100%",
        paddingHorizontal: width * 0.06,
        backgroundColor: '#fff',
    },
    titleContainer: {
        marginBottom: 20,
    },
    titleText: {
        fontSize: Math.max(22, scale * 24),
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 5,
    },
    subtitleText: {
        fontSize: Math.max(14, scale * 15),
        color: colors.textSecondary,
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
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    inputBoxHalf: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 14 : 12,
        marginBottom: 10,
        backgroundColor: "#FAFAFA",
        width: '48.5%',  // Slightly adjusted width
    },
    errorContainer: {
        width: '48.5%',
        paddingRight: 5,
    },
    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 16,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 14 : 12,
        marginBottom: 10,
        backgroundColor: "#FAFAFA",
    },
    errorBorder: {
        borderColor: "#F44336",
        borderWidth: 1.5,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 25,
        fontSize: Math.max(15, scale * 15),
        color: colors.textPrimary,
    },
    eyeIcon: {
        padding: 5,
    },
    errorText: {
        color: "#F44336",
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 5,
    },
    termsContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginVertical: 15,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: colors.textSecondary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        marginTop: 2,
    },
    checkedBox: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    errorCheckbox: {
        borderColor: "#F44336",
    },
    termsText: {
        fontSize: Math.max(14, scale * 14),
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 20,
    },
    termsHighlight: {
        color: colors.primary,
        fontWeight: "600",
    },
    buttonsContainer: {
        width: "100%",
        paddingHorizontal: width * 0.06,
        marginTop: 10,
        marginBottom: 30,
    },
    registerButton: {
        width: "100%",
        height: Math.max(55, scale * 55),
        borderRadius: 16,
        overflow: "hidden",
        marginVertical: 15,
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    gradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: 'row',
    },
    registerButtonText: {
        color: "white",
        fontSize: Math.max(18, scale * 18),
        fontWeight: "600",
        marginRight: 8,
    },
    arrowIcon: {
        marginLeft: 5,
    },
    disabledButton: {
        opacity: 0.7,
    },
    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 10,
    },
    haveAccountText: {
        color: colors.textSecondary,
        fontSize: Math.max(16, scale * 16),
    },
    loginText: {
        color: colors.primary,
        fontWeight: "600",
        fontSize: Math.max(16, scale * 16),
    },
});