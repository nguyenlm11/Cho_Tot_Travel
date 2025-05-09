import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Image, StatusBar, ActivityIndicator, Alert, Dimensions, SafeAreaView } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import authApi from '../services/api/authApi';

const { width, height } = Dimensions.get('window');
const scale = width / 375;

export default function ResetPasswordScreen({ route }) {
    const { email, resetToken } = route.params;
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [secureTextPassword, setSecureTextPassword] = useState(true);
    const [secureTextConfirm, setSecureTextConfirm] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [errors, setErrors] = useState({
        username: "",
        password: "",
        confirmPassword: ""
    });
    const navigation = useNavigation();

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[0-9])(?=.*[\W_]).{8,}$/;
        return passwordRegex.test(password);
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            username: "",
            password: "",
            confirmPassword: ""
        };
        if (!username.trim()) {
            newErrors.username = "Vui lòng nhập tên đăng nhập";
            isValid = false;
        }
        if (!resetToken) {
            Alert.alert("Lỗi", "Không có mã xác nhận. Vui lòng thử lại từ đầu.");
            isValid = false;
        }
        if (!password) {
            newErrors.password = "Vui lòng nhập mật khẩu mới";
            isValid = false;
        } else if (!validatePassword(password)) {
            newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm số và ký tự đặc biệt";
            isValid = false;
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
            isValid = false;
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };

    const handleResetPassword = async () => {
        setApiError("");
        if (!validateForm()) {
            return;
        }
        setIsLoading(true);
        try {
            const resetData = {
                username,
                email,
                password,
                confirmPassword,
                token: resetToken
            };
            const response = await authApi.resetPassword(resetData);
            Alert.alert(
                "Thành công",
                "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
                [
                    {
                        text: "Đăng nhập ngay",
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );
        } catch (error) {
            console.error('Reset password error:', error);
            setApiError(error.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại sau.');
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
                                <Text style={styles.titleText}>Đặt lại mật khẩu</Text>
                                <Text style={styles.subtitleText}>
                                    Nhập thông tin để đặt lại mật khẩu của bạn
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

                            {/* Email (Readonly) */}
                            <View style={styles.inputBox}>
                                <Ionicons name="mail-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={[styles.input, { color: colors.textSecondary }]}
                                    value={email}
                                    editable={false}
                                />
                                <MaterialIcons name="lock" size={18} color={colors.textSecondary} />
                            </View>

                            {/* Username Input */}
                            <View style={[styles.inputBox, errors.username && styles.inputBoxError]}>
                                <Ionicons name="person-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tên đăng nhập"
                                    value={username}
                                    onChangeText={(text) => {
                                        setUsername(text);
                                        setErrors({ ...errors, username: "" });
                                    }}
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                    placeholderTextColor="#9E9E9E"
                                />
                                {username.trim() !== "" && (
                                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                                )}
                            </View>
                            {errors.username ? (
                                <Animated.View
                                    entering={FadeInDown.duration(300)}
                                    style={styles.errorContainer}
                                >
                                    <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                                    <Text style={styles.errorText}>{errors.username}</Text>
                                </Animated.View>
                            ) : null}

                            {/* Password and Confirm Password Row */}
                            <View style={styles.inputRow}>
                                {/* Password Input */}
                                <View style={[styles.inputBoxHalf, errors.password && styles.inputBoxError]}>
                                    <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mật khẩu mới"
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            setErrors({ ...errors, password: "" });
                                        }}
                                        secureTextEntry={secureTextPassword}
                                        editable={!isLoading}
                                        placeholderTextColor="#9E9E9E"
                                    />
                                    <TouchableOpacity 
                                        onPress={() => setSecureTextPassword(!secureTextPassword)} 
                                        style={styles.eyeIcon} 
                                        disabled={isLoading}
                                    >
                                        <Ionicons 
                                            name={secureTextPassword ? "eye-off-outline" : "eye-outline"} 
                                            size={22} 
                                            color={colors.textSecondary} 
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Confirm Password Input */}
                                <View style={[styles.inputBoxHalf, errors.confirmPassword && styles.inputBoxError]}>
                                    <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Xác nhận mật khẩu"
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
                                            setErrors({ ...errors, confirmPassword: "" });
                                        }}
                                        secureTextEntry={secureTextConfirm}
                                        editable={!isLoading}
                                        placeholderTextColor="#9E9E9E"
                                    />
                                    <TouchableOpacity 
                                        onPress={() => setSecureTextConfirm(!secureTextConfirm)} 
                                        style={styles.eyeIcon} 
                                        disabled={isLoading}
                                    >
                                        <Ionicons 
                                            name={secureTextConfirm ? "eye-off-outline" : "eye-outline"} 
                                            size={22} 
                                            color={colors.textSecondary} 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Errors for Password and Confirm Password */}
                            <View style={styles.inputRow}>
                                <View style={styles.errorContainer}>
                                    {errors.password ? (
                                        <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
                                            {errors.password}
                                        </Animated.Text>
                                    ) : null}
                                </View>
                                <View style={styles.errorContainer}>
                                    {errors.confirmPassword ? (
                                        <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
                                            {errors.confirmPassword}
                                        </Animated.Text>
                                    ) : null}
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View
                            entering={FadeInUp.delay(400).duration(1000).springify()}
                            style={styles.buttonsContainer}
                        >
                            <TouchableOpacity
                                style={[styles.submitButton, isLoading && styles.disabledButton]}
                                onPress={handleResetPassword}
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
                                            <Text style={styles.submitText}>Cập nhật mật khẩu</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.arrowIcon} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backLink}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.backLinkText}>Quay lại đăng nhập</Text>
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
        backgroundColor: "#fff",
    },
    scrollContainer: {
        flexGrow: 1,
    },
    backgroundContainer: {
        width: '100%',
        height: height * 0.28,
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
        height: 50,
        marginBottom: 10,
        backgroundColor: "#FAFAFA",
        width: '48.5%',
    },
    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 10,
        backgroundColor: "#FAFAFA",
    },
    inputBoxError: {
        borderColor: "#F44336",
        borderWidth: 1.5,
    },
    icon: {
        marginRight: 10,
        alignSelf: 'center',
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: Math.max(15, scale * 15),
        color: colors.textPrimary,
        paddingVertical: 0,
        textAlignVertical: 'center',
    },
    eyeIcon: {
        padding: 5,
        marginLeft: 5,
        alignSelf: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        width: '48.5%',
    },
    errorText: {
        color: "#F44336",
        fontSize: 12,
        marginLeft: 5,
        flex: 1,
    },
    buttonsContainer: {
        width: "100%",
        paddingHorizontal: width * 0.06,
        marginTop: 20,
        marginBottom: 30,
    },
    submitButton: {
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
    submitText: {
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
    backLink: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
    },
    backLinkText: {
        color: colors.textSecondary,
        fontSize: Math.max(16, scale * 16),
        fontWeight: "500",
    },
}); 