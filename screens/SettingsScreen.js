import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [locationEnabled, setLocationEnabled] = useState(true);

    useEffect(() => {
        // Lấy thông tin người dùng từ AsyncStorage
        const loadUserData = async () => {
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    setUserName(parsedUser.name || parsedUser.userName || 'Người dùng');
                    setUserEmail(parsedUser.email || '');
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadUserData();
    }, []);

    const handleLogout = async () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await logout();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại.');
                        } finally {
                            setIsLoading(false);
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const renderSettingItem = (icon, title, subtitle, action, rightComponent = null) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={action}
            disabled={rightComponent !== null}
        >
            <View style={styles.settingIconContainer}>
                {icon}
            </View>
            <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {rightComponent || (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang đăng xuất...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cài đặt</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* User Profile Section */}
                <View style={styles.profileSection}>
                    <Image
                        // source={require('../assets/avatar-placeholder.png')} 
                        style={styles.profileImage}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{userName}</Text>
                        <Text style={styles.profileEmail}>{userEmail}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editProfileButton}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <Text style={styles.editProfileText}>Chỉnh sửa</Text>
                    </TouchableOpacity>
                </View>

                {/* Settings Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tài khoản</Text>
                    {renderSettingItem(
                        <Ionicons name="person-outline" size={22} color={colors.primary} />,
                        'Thông tin cá nhân',
                        'Cập nhật thông tin cá nhân của bạn',
                        () => navigation.navigate('EditProfile')
                    )}
                    {renderSettingItem(
                        <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />,
                        'Bảo mật',
                        'Đổi mật khẩu, xác thực hai yếu tố',
                        () => navigation.navigate('Security')
                    )}
                    {renderSettingItem(
                        <Ionicons name="notifications-outline" size={22} color={colors.primary} />,
                        'Thông báo',
                        'Quản lý thông báo',
                        null,
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#D1D1D6', true: colors.primary + '80' }}
                            thumbColor={notificationsEnabled ? colors.primary : '#F4F3F4'}
                        />
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ứng dụng</Text>
                    {renderSettingItem(
                        <Ionicons name="moon-outline" size={22} color={colors.primary} />,
                        'Chế độ tối',
                        'Thay đổi giao diện ứng dụng',
                        null,
                        <Switch
                            value={darkModeEnabled}
                            onValueChange={setDarkModeEnabled}
                            trackColor={{ false: '#D1D1D6', true: colors.primary + '80' }}
                            thumbColor={darkModeEnabled ? colors.primary : '#F4F3F4'}
                        />
                    )}
                    {renderSettingItem(
                        <Ionicons name="location-outline" size={22} color={colors.primary} />,
                        'Vị trí',
                        'Cho phép ứng dụng truy cập vị trí',
                        null,
                        <Switch
                            value={locationEnabled}
                            onValueChange={setLocationEnabled}
                            trackColor={{ false: '#D1D1D6', true: colors.primary + '80' }}
                            thumbColor={locationEnabled ? colors.primary : '#F4F3F4'}
                        />
                    )}
                    {renderSettingItem(
                        <Ionicons name="language-outline" size={22} color={colors.primary} />,
                        'Ngôn ngữ',
                        'Thay đổi ngôn ngữ ứng dụng',
                        () => navigation.navigate('Language')
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Khác</Text>
                    {renderSettingItem(
                        <Ionicons name="help-circle-outline" size={22} color={colors.primary} />,
                        'Trợ giúp & Hỗ trợ',
                        'Liên hệ với chúng tôi, FAQ',
                        () => navigation.navigate('Help')
                    )}
                    {renderSettingItem(
                        <Ionicons name="document-text-outline" size={22} color={colors.primary} />,
                        'Điều khoản & Chính sách',
                        'Điều khoản sử dụng, chính sách bảo mật',
                        () => navigation.navigate('Terms')
                    )}
                    {renderSettingItem(
                        <Ionicons name="information-circle-outline" size={22} color={colors.primary} />,
                        'Về ứng dụng',
                        'Phiên bản, thông tin ứng dụng',
                        () => navigation.navigate('About')
                    )}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>

                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    profileImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F0F0F0',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 15,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    profileEmail: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 3,
    },
    editProfileButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: colors.primary + '15',
    },
    editProfileText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '500',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 10,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingTextContainer: {
        flex: 1,
        marginLeft: 15,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textPrimary,
    },
    settingSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF1F0',
        borderRadius: 15,
    },
    logoutText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
    },
    versionContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    versionText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: colors.textSecondary,
    },
});