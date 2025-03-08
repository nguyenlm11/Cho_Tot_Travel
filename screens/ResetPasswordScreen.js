import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Image, StatusBar, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import authApi from '../services/api/authApi';

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
        // Reset API error
        setApiError("");
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Form is valid, proceed with API call
        setIsLoading(true);
        
        try {
            // Call API to reset password
            const resetData = {
                username,
                email,
                password,
                confirmPassword,
                token: resetToken
            };
            
            const response = await authApi.resetPassword(resetData);
            
            // Show success message
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
                        {/* <Image source={require('../assets/reset-password.png')} style={styles.image} /> */}
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
                            <View style={styles.apiErrorContainer}>
                                <Text style={styles.apiErrorText}>{apiError}</Text>
                            </View>
                        ) : null}
                        
                        {/* Email (Readonly) */}
                        <View style={styles.inputBox}>
                            <Ionicons name="mail-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={[styles.input, { color: colors.textSecondary }]}
                                value={email}
                                editable={false}
                            />
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
                                    setErrors({...errors, username: ""});
                                }}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>
                        {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
                        
                        {/* Password Input */}
                        <View style={[styles.inputBox, errors.password && styles.inputBoxError]}>
                            <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mật khẩu mới"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setErrors({...errors, password: ""});
                                }}
                                secureTextEntry={secureTextPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity 
                                onPress={() => setSecureTextPassword(!secureTextPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons 
                                    name={secureTextPassword ? "eye-off-outline" : "eye-outline"} 
                                    size={22} 
                                    color={colors.textSecondary} 
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                        
                        {/* Confirm Password Input */}
                        <View style={[styles.inputBox, errors.confirmPassword && styles.inputBoxError]}>
                            <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Xác nhận mật khẩu"
                                value={confirmPassword}
                                onChangeText={(text) => {
                                    setConfirmPassword(text);
                                    setErrors({...errors, confirmPassword: ""});
                                }}
                                secureTextEntry={secureTextConfirm}
                                editable={!isLoading}
                            />
                            <TouchableOpacity 
                                onPress={() => setSecureTextConfirm(!secureTextConfirm)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons 
                                    name={secureTextConfirm ? "eye-off-outline" : "eye-outline"} 
                                    size={22} 
                                    color={colors.textSecondary} 
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

                        {/* Token Info */}
                        {resetToken ? (
                            <View style={styles.tokenInfoContainer}>
                                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                                <Text style={styles.tokenInfoText}>
                                    Mã xác nhận đã được tự động điền
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.tokenInfoContainer}>
                                <Ionicons name="warning-outline" size={20} color={colors.warning} />
                                <Text style={styles.tokenWarningText}>
                                    Không có mã xác nhận. Vui lòng kiểm tra email của bạn hoặc yêu cầu mã mới.
                                </Text>
                            </View>
                        )}

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
                                    <Text style={styles.submitText}>Đặt lại mật khẩu</Text>
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
    eyeIcon: {
        padding: 10,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        marginTop: -10,
        marginBottom: 15,
        marginLeft: 5,
    },
    tokenInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '10',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
    },
    tokenInfoText: {
        color: colors.primary,
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    tokenWarningText: {
        color: colors.warning,
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
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