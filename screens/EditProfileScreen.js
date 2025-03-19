import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView,
    Platform, StatusBar, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import authApi from '../services/api/authApi';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        name: '',
        address: '',
        phone: '',
        role: '',
        userId: ''
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await authApi.getCurrentUser();
            if (userData) {
                setFormData({
                    username: userData.username || '',
                    email: userData.email || '',
                    name: userData.name || '',
                    address: userData.address || '',
                    phone: userData.phone || '',
                    role: userData.role || '',
                    userId: userData.userId || ''
                });
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            setApiError('Không thể tải thông tin người dùng');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Vui lòng nhập tên đăng nhập';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập họ tên';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10}$/.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        setApiError('');
        setApiSuccess('');

        try {
            await authApi.updateUserInfo(formData);
            setApiSuccess('Cập nhật thông tin thành công!');
            setTimeout(() => {
                navigation.goBack();
            }, 1500);
        } catch (error) {
            setApiError(error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderHeader = () => (
        <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.header}
        >
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <BlurView intensity={80} tint="light" style={styles.blurButton}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </BlurView>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
            <View style={styles.placeholder} />
        </LinearGradient>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {renderHeader()}

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    entering={FadeInDown.delay(100)}
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

                    {/* Username Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Tên đăng nhập</Text>
                        <View style={[
                            styles.inputBox,
                            errors.username && styles.inputBoxError
                        ]}>
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color={colors.textSecondary}
                                style={styles.icon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập tên đăng nhập"
                                value={formData.username.trim()}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, username: text }));
                                    if (errors.username) {
                                        setErrors(prev => ({ ...prev, username: '' }));
                                    }
                                }}
                            />
                        </View>
                        {errors.username && (
                            <Text style={styles.errorText}>{errors.username}</Text>
                        )}
                    </View>

                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Họ và tên</Text>
                        <View style={[
                            styles.inputBox,
                            errors.name && styles.inputBoxError
                        ]}>
                            <Ionicons
                                name="person"
                                size={20}
                                color={colors.textSecondary}
                                style={styles.icon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập họ và tên"
                                value={formData.name}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, name: text }));
                                    if (errors.name) {
                                        setErrors(prev => ({ ...prev, name: '' }));
                                    }
                                }}
                            />
                        </View>
                        {errors.name && (
                            <Text style={styles.errorText}>{errors.name}</Text>
                        )}
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <View style={[
                            styles.inputBox,
                            errors.email && styles.inputBoxError
                        ]}>
                            <MaterialIcons
                                name="email"
                                size={20}
                                color={colors.textSecondary}
                                style={styles.icon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập địa chỉ email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email.trim()}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, email: text }));
                                    if (errors.email) {
                                        setErrors(prev => ({ ...prev, email: '' }));
                                    }
                                }}
                            />
                        </View>
                        {errors.email && (
                            <Text style={styles.errorText}>{errors.email}</Text>
                        )}
                    </View>

                    {/* Phone Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Số điện thoại</Text>
                        <View style={[
                            styles.inputBox,
                            errors.phone && styles.inputBoxError
                        ]}>
                            <FontAwesome5
                                name="phone-alt"
                                size={18}
                                color={colors.textSecondary}
                                style={styles.icon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập số điện thoại"
                                keyboardType="phone-pad"
                                value={formData.phone.trim()}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, phone: text }));
                                    if (errors.phone) {
                                        setErrors(prev => ({ ...prev, phone: '' }));
                                    }
                                }}
                            />
                        </View>
                        {errors.phone && (
                            <Text style={styles.errorText}>{errors.phone}</Text>
                        )}
                    </View>

                    {/* Address Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Địa chỉ</Text>
                        <View style={styles.inputBox}>
                            <Ionicons
                                name="location-outline"
                                size={20}
                                color={colors.textSecondary}
                                style={styles.icon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập địa chỉ"
                                value={formData.address.trim()}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={styles.submitButtonGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Lưu thay đổi</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    formSection: {
        paddingHorizontal: 24,
        paddingTop: 30,
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
        marginTop: 20,
        marginBottom: 30,
        borderRadius: 15,
        overflow: 'hidden',
        width: '100%',
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
});