import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import authApi from '../services/api/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SecurityScreen() {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');

    // Secure text entry states
    const [secureCurrentPassword, setSecureCurrentPassword] = useState(true);
    const [secureNewPassword, setSecureNewPassword] = useState(true);
    const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

    // Form validation errors
    const [errors, setErrors] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    // Load username from storage when component mounts
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    setUsername(user.username || '');
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadUserData();
    }, []);

    // Password validation function
    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[0-9])(?=.*[\W_]).{8,}$/;
        return passwordRegex.test(password);
    };

    // Form validation
    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
        };

        // Validate username
        if (!username) {
            Alert.alert(
                "Lỗi",
                "Không thể xác định tên đăng nhập. Vui lòng đăng nhập lại.",
                [{ text: "OK", onPress: () => navigation.navigate('Login') }]
            );
            return false;
        }

        // Validate current password
        if (!currentPassword) {
            newErrors.currentPassword = 'Mật khẩu hiện tại không được để trống';
            isValid = false;
        }

        // Validate new password
        if (!newPassword) {
            newErrors.newPassword = 'Mật khẩu mới không được để trống';
            isValid = false;
        } else if (!validatePassword(newPassword)) {
            newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự, 1 số và 1 ký tự đặc biệt';
            isValid = false;
        }

        // Validate confirm password
        if (newPassword !== confirmNewPassword) {
            newErrors.confirmNewPassword = 'Mật khẩu xác nhận không khớp';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Handle password change
    const handleChangePassword = async () => {
        // Clear previous messages
        setApiError('');
        setApiSuccess('');

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Prepare data for API call
            const changePasswordData = {
                username,
                currentPassword,
                newPassword,
                confirmNewPassword: newPassword
            };

            // Call API to change password
            const response = await authApi.changePassword(changePasswordData);

            // Handle success
            setApiSuccess('Đổi mật khẩu thành công!');

            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');

            // Show success alert
            Alert.alert(
                "Thành công",
                "Mật khẩu của bạn đã được thay đổi thành công.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );

        } catch (error) {
            // Handle error
            setApiError(error.message || 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with back button */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Bảo mật tài khoản</Text>
                    <View style={styles.placeholder} />
                </View>

                <Animated.View
                    entering={FadeInDown.delay(200).duration(500)}
                    style={styles.contentContainer}
                >
                    {/* Security icon */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={styles.iconBackground}
                        >
                            <Ionicons name="shield-checkmark" size={40} color="#fff" />
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>Đổi mật khẩu</Text>
                    <Text style={styles.subtitle}>
                        Cập nhật mật khẩu của bạn để bảo vệ tài khoản
                    </Text>

                    {/* Error message */}
                    {apiError ? (
                        <Animated.View
                            entering={FadeInUp.duration(300)}
                            style={styles.apiErrorContainer}
                        >
                            <Ionicons name="alert-circle" size={20} color={colors.error} />
                            <Text style={styles.apiErrorText}>{apiError}</Text>
                        </Animated.View>
                    ) : null}

                    {/* Success message */}
                    {apiSuccess ? (
                        <Animated.View
                            entering={FadeInUp.duration(300)}
                            style={styles.apiSuccessContainer}
                        >
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <Text style={styles.apiSuccessText}>{apiSuccess}</Text>
                        </Animated.View>
                    ) : null}

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {/* Current Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
                            <View style={[styles.inputBox, errors.currentPassword && styles.inputBoxError]}>
                                <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Mật khẩu hiện tại"
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry={secureCurrentPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => setSecureCurrentPassword(!secureCurrentPassword)}
                                    style={styles.eyeIcon}
                                    disabled={isLoading}
                                >
                                    <Ionicons
                                        name={secureCurrentPassword ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.currentPassword ? (
                                <Text style={styles.errorText}>{errors.currentPassword}</Text>
                            ) : null}
                        </View>

                        {/* New Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                            <View style={[styles.inputBox, errors.newPassword && styles.inputBoxError]}>
                                <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Mật khẩu mới"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={secureNewPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => setSecureNewPassword(!secureNewPassword)}
                                    style={styles.eyeIcon}
                                    disabled={isLoading}
                                >
                                    <Ionicons
                                        name={secureNewPassword ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.newPassword ? (
                                <Text style={styles.errorText}>{errors.newPassword}</Text>
                            ) : null}
                            <Text style={styles.passwordHint}>
                                Mật khẩu phải có ít nhất 8 ký tự, bao gồm 1 số và 1 ký tự đặc biệt
                            </Text>
                        </View>

                        {/* Confirm New Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
                            <View style={[styles.inputBox, errors.confirmNewPassword && styles.inputBoxError]}>
                                <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Xác nhận mật khẩu mới"
                                    value={confirmNewPassword}
                                    onChangeText={setConfirmNewPassword}
                                    secureTextEntry={secureConfirmPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
                                    style={styles.eyeIcon}
                                    disabled={isLoading}
                                >
                                    <Ionicons
                                        name={secureConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmNewPassword ? (
                                <Text style={styles.errorText}>{errors.confirmNewPassword}</Text>
                            ) : null}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleChangePassword}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitButtonGradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.submitButtonText}>Cập nhật mật khẩu</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Security Tips */}
                    <View style={styles.securityTipsContainer}>
                        <Text style={styles.securityTipsTitle}>Lời khuyên bảo mật</Text>

                        <View style={styles.securityTipItem}>
                            <View style={styles.securityTipIcon}>
                                <MaterialIcons name="security" size={18} color={colors.primary} />
                            </View>
                            <Text style={styles.securityTipText}>
                                Sử dụng mật khẩu mạnh với ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                            </Text>
                        </View>

                        <View style={styles.securityTipItem}>
                            <View style={styles.securityTipIcon}>
                                <MaterialIcons name="update" size={18} color={colors.primary} />
                            </View>
                            <Text style={styles.securityTipText}>
                                Thay đổi mật khẩu của bạn thường xuyên, ít nhất 3 tháng một lần
                            </Text>
                        </View>

                        <View style={styles.securityTipItem}>
                            <View style={styles.securityTipIcon}>
                                <MaterialIcons name="warning" size={18} color={colors.primary} />
                            </View>
                            <Text style={styles.securityTipText}>
                                Không sử dụng cùng một mật khẩu cho nhiều tài khoản khác nhau
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 10,
        backgroundColor: '#fff',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    placeholder: {
        width: 40,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 30,
    },
    apiErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.error + '15',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    apiErrorText: {
        color: colors.error,
        marginLeft: 10,
        flex: 1,
    },
    apiSuccessContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success + '15',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    apiSuccessText: {
        color: colors.success,
        marginLeft: 10,
        flex: 1,
    },
    formContainer: {
        marginBottom: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F8FA',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#F0F0F0',
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
        color: colors.textPrimary,
    },
    eyeIcon: {
        padding: 10,
    },
    errorText: {
        color: colors.error,
        fontSize: 12,
        marginTop: 5,
        marginLeft: 5,
    },
    passwordHint: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 5,
        marginLeft: 5,
    },
    submitButton: {
        marginTop: 10,
    },
    submitButtonGradient: {
        flexDirection: 'row',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    securityTipsContainer: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 20,
    },
    securityTipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 15,
    },
    securityTipItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    securityTipIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    securityTipText: {
        flex: 1,
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
});