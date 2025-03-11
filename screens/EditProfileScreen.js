import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView,
    Platform, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const { user, updateUserInfo } = useAuth();

    const [userId, setUserId] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');

    // Form validation errors
    const [errors, setErrors] = useState({
        username: '',
        email: '',
        name: '',
        phone: ''
    });

    // Load user data when component mounts
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    setUserId(parsedUser.userId || parsedUser.id || '');
                    setUsername(parsedUser.given_name || parsedUser.username || '');
                    setEmail(parsedUser.email || '');
                    setName(parsedUser.name || '');
                    setAddress(parsedUser.address || '');
                    setPhone(parsedUser.phone || '');
                    setRole(parsedUser.role || '');
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                setApiError('Không thể tải thông tin người dùng');
            }
        };

        loadUserData();
    }, []);

    // Email validation
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Phone validation
    const validatePhone = (phone) => {
        const phoneRegex = /^[0-9]{10,11}$/;
        return phoneRegex.test(phone);
    };

    // Form validation
    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            username: '',
            email: '',
            name: '',
            phone: ''
        };

        // Validate username
        if (!username.trim()) {
            newErrors.username = 'Tên đăng nhập không được để trống';
            isValid = false;
        }

        // Validate email
        if (!email.trim()) {
            newErrors.email = 'Email không được để trống';
            isValid = false;
        } else if (!validateEmail(email)) {
            newErrors.email = 'Email không hợp lệ';
            isValid = false;
        }

        // Validate name
        if (!name.trim()) {
            newErrors.name = 'Họ tên không được để trống';
            isValid = false;
        }

        // Validate phone
        if (phone && !validatePhone(phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Handle profile update
    const handleUpdateProfile = async () => {
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
            const profileData = {
                userId,
                username,
                email,
                name,
                address,
                phone,
                role
            };
            
            // Call API to update profile
            await updateUserInfo(profileData);
            
            // Handle success
            setApiSuccess('Cập nhật thông tin thành công!');
            
            // Show success alert
            Alert.alert(
                "Thành công",
                "Thông tin cá nhân của bạn đã được cập nhật thành công.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
            
        } catch (error) {
            // Handle error
            setApiError(error.message || 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.');
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
                    <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                    <View style={styles.placeholder} />
                </View>

                <Animated.View
                    entering={FadeInDown.delay(200).duration(500)}
                    style={styles.contentContainer}
                >
                    {/* Title */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Thông tin cá nhân</Text>
                        <Text style={styles.subtitle}>
                            Cập nhật thông tin cá nhân của bạn
                        </Text>
                    </View>

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
                        {/* Username Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Tên đăng nhập</Text>
                            <View style={[styles.inputBox, errors.username && styles.inputBoxError]}>
                                <Ionicons name="person-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tên đăng nhập"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                            </View>
                            {errors.username ? (
                                <Text style={styles.errorText}>{errors.username}</Text>
                            ) : null}
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={[styles.inputBox, errors.email && styles.inputBoxError]}>
                                <Ionicons name="mail-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                            </View>
                            {errors.email ? (
                                <Text style={styles.errorText}>{errors.email}</Text>
                            ) : null}
                        </View>

                        {/* Full Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Họ và tên</Text>
                            <View style={[styles.inputBox, errors.name && styles.inputBoxError]}>
                                <Ionicons name="person" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Họ và tên"
                                    value={name}
                                    onChangeText={setName}
                                    editable={!isLoading}
                                />
                            </View>
                            {errors.name ? (
                                <Text style={styles.errorText}>{errors.name}</Text>
                            ) : null}
                        </View>

                        {/* Address Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Địa chỉ</Text>
                            <View style={styles.inputBox}>
                                <Ionicons name="location-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Địa chỉ"
                                    value={address}
                                    onChangeText={setAddress}
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        {/* Phone Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Số điện thoại</Text>
                            <View style={[styles.inputBox, errors.phone && styles.inputBoxError]}>
                                <Ionicons name="call-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Số điện thoại"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    editable={!isLoading}
                                />
                            </View>
                            {errors.phone ? (
                                <Text style={styles.errorText}>{errors.phone}</Text>
                            ) : null}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleUpdateProfile}
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
                                        <Text style={styles.submitButtonText}>Cập nhật thông tin</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Note */}
                    <View style={styles.noteContainer}>
                        <MaterialIcons name="info-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.noteText}>
                            Thông tin cá nhân của bạn sẽ được bảo mật và chỉ được sử dụng để cải thiện trải nghiệm của bạn trên ứng dụng.
                        </Text>
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
    titleContainer: {
        marginBottom: 25,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
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
    errorText: {
        color: colors.error,
        fontSize: 12,
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
    noteContainer: {
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 15,
    },
    noteText: {
        flex: 1,
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 10,
        lineHeight: 20,
    },
});