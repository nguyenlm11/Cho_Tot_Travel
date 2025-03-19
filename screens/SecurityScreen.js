import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, StatusBar, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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

    const validateForm = () => {
        const newErrors = {};

        if (!currentPassword) {
            newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
        }

        if (!newPassword) {
            newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
        } else if (!/^(?=.*[0-9])(?=.*[\W_]).{8,}$/.test(newPassword)) {
            newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm số và ký tự đặc biệt';
        }

        if (!confirmNewPassword) {
            newErrors.confirmNewPassword = 'Vui lòng xác nhận mật khẩu mới';
        } else if (confirmNewPassword !== newPassword) {
            newErrors.confirmNewPassword = 'Mật khẩu xác nhận không khớp';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        setApiError('');
        setApiSuccess('');

        try {
            await authApi.changePassword({
                username,
                currentPassword,
                newPassword,
                confirmNewPassword
            });

            setApiSuccess('Đổi mật khẩu thành công!');
            
            setTimeout(() => {
                Alert.alert(
                    'Thành công',
                    'Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại với mật khẩu mới.',
                    [
                        {
                            text: 'OK',
                            onPress: async () => {
                                await authApi.logout();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                });
                            }
                        }
                    ]
                );
            }, 1500);
        } catch (error) {
            setApiError(error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
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
                <Text style={styles.headerTitle}>Bảo mật</Text>
                <View style={styles.placeholder} />
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Icon Section */}
                    <Animated.View 
                        entering={FadeInDown.delay(100)}
                        style={styles.logoContainer}
                    >
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.iconBackground}
                            >
                                <Ionicons name="shield-checkmark" size={40} color="#fff" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.logoTitle}>Thay đổi mật khẩu</Text>
                        <Text style={styles.logoSubtitle}>
                            Vui lòng nhập mật khẩu mới khác với mật khẩu hiện tại
                        </Text>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        entering={FadeInDown.delay(300)}
                        style={styles.formSection}
                    >
                        {/* API Messages */}
                        {apiError && (
                            <View style={styles.apiErrorContainer}>
                                <Ionicons name="alert-circle" size={20} color={colors.error} />
                                <Text style={styles.apiErrorText}>{apiError}</Text>
                            </View>
                        )}
                        {apiSuccess && (
                            <View style={styles.apiSuccessContainer}>
                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                <Text style={styles.apiSuccessText}>{apiSuccess}</Text>
                            </View>
                        )}

                        {/* Current Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
                            <View style={[
                                styles.inputBox,
                                errors.currentPassword && styles.inputBoxError
                            ]}>
                                <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập mật khẩu hiện tại"
                                    secureTextEntry={secureCurrentPassword}
                                    value={currentPassword.trim()}
                                    onChangeText={setCurrentPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => setSecureCurrentPassword(!secureCurrentPassword)}
                                >
                                    <Ionicons
                                        name={secureCurrentPassword ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.currentPassword && (
                                <Text style={styles.errorText}>{errors.currentPassword}</Text>
                            )}
                        </View>

                        {/* New Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                            <View style={[
                                styles.inputBox,
                                errors.newPassword && styles.inputBoxError
                            ]}>
                                <Ionicons name="key-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập mật khẩu mới"
                                    secureTextEntry={secureNewPassword}
                                    value={newPassword.trim()}
                                    onChangeText={setNewPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => setSecureNewPassword(!secureNewPassword)}
                                >
                                    <Ionicons
                                        name={secureNewPassword ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.newPassword && (
                                <Text style={styles.errorText}>{errors.newPassword}</Text>
                            )}
                        </View>

                        {/* Confirm New Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
                            <View style={[
                                styles.inputBox,
                                errors.confirmNewPassword && styles.inputBoxError
                            ]}>
                                <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Xác nhận mật khẩu mới"
                                    secureTextEntry={secureConfirmPassword}
                                    value={confirmNewPassword.trim()}
                                    onChangeText={setConfirmNewPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
                                >
                                    <Ionicons
                                        name={secureConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmNewPassword && (
                                <Text style={styles.errorText}>{errors.confirmNewPassword}</Text>
                            )}
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
                                end={{ x: 1, y: 1 }}
                                style={styles.submitButtonGradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.submitButtonText}>Đổi mật khẩu</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Security Tips - Moved to bottom */}
                    <Animated.View
                        entering={FadeInDown.delay(400)}
                        style={styles.securityTipsContainer}
                    >
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
    scrollView: {
        flex: 1,
    },
    logoContainer: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 10,
    },
    iconContainer: {
        marginBottom: 16,
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
    logoTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    logoSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    formSection: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    apiErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.error + '15',
        borderRadius: 15,
        padding: 16,
        marginBottom: 25,
    },
    apiErrorText: {
        color: colors.error,
        marginLeft: 12,
        flex: 1,
        fontSize: 15,
    },
    apiSuccessContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success + '15',
        borderRadius: 15,
        padding: 16,
        marginBottom: 25,
    },
    apiSuccessText: {
        color: colors.success,
        marginLeft: 12,
        flex: 1,
        fontSize: 15,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 10,
        marginLeft: 4,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingHorizontal: 20,
        height: 60,
        borderWidth: 1,
        borderColor: '#E0E0E0',
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
    inputBoxError: {
        borderColor: colors.error,
        borderWidth: 1.5,
    },
    icon: {
        marginRight: 15,
        opacity: 0.7,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: colors.textPrimary,
        letterSpacing: 0.5,
    },
    errorText: {
        color: colors.error,
        fontSize: 13,
        marginTop: 8,
        marginLeft: 8,
        fontWeight: '500',
    },
    submitButton: {
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
    submitButtonGradient: {
        flexDirection: 'row',
        height: 58,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        marginRight: 10,
        letterSpacing: 0.5,
    },
    securityTipsContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 24,
        marginBottom: 30,
        padding: 20,
        borderRadius: 15,
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
    securityTipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 16,
    },
    securityTipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingRight: 10,
    },
    securityTipIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    securityTipText: {
        flex: 1,
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
});