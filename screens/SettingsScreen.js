import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image, Alert, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import authApi from '../services/api/authApi';
import { useUser } from '../contexts/UserContext';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { userData, refreshUserData } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [locationEnabled, setLocationEnabled] = useState(true);

    useEffect(() => {
        refreshUserData();
    }, [refreshUserData]);

    useEffect(() => {
        if (userData) {
            setUserName(userData.name || userData.userName || 'Người dùng');
            setUserEmail(userData.email || '');
        }
    }, [userData]);

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authApi.logout();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
                        }
                    }
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

    const renderHeader = () => (
        <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.header}
        >
            <Text style={styles.headerTitle}>Cài đặt</Text>
        </LinearGradient>
    );

    const renderProfileSection = () => (
        <Animated.View
            entering={FadeInDown.delay(100)}
            style={styles.profileSection}
        >
            <View style={styles.profileImageContainer}>
                <Image
                    style={styles.profileImage}
                // source={require('../assets/avatar-placeholder.png')}
                />
                <BlurView intensity={80} tint="light" style={styles.editImageButton}>
                    <Ionicons name="camera" size={20} color={colors.primary} />
                </BlurView>
            </View>
            <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userName}</Text>
                <Text style={styles.profileEmail}>{userEmail}</Text>
            </View>
            <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => navigation.navigate('EditProfile')}
            >
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.editProfileGradient}
                >
                    <Text style={styles.editProfileText}>Chỉnh sửa</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
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
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            {renderHeader()}

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {renderProfileSection()}

                {/* Account Settings */}
                <Animated.View
                    entering={FadeInDown.delay(200)}
                    style={styles.section}
                >
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
                            trackColor={{ false: '#D1D1D6', true: colors.primary + '40' }}
                            thumbColor={notificationsEnabled ? colors.primary : '#F4F3F4'}
                            ios_backgroundColor="#D1D1D6"
                        />
                    )}
                </Animated.View>

                {/* App Settings */}
                <Animated.View
                    entering={FadeInDown.delay(300)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Ứng dụng</Text>
                    {renderSettingItem(
                        <Ionicons name="moon-outline" size={22} color={colors.primary} />,
                        'Chế độ tối',
                        'Thay đổi giao diện ứng dụng',
                        null,
                        <Switch
                            value={darkModeEnabled}
                            onValueChange={setDarkModeEnabled}
                            trackColor={{ false: '#D1D1D6', true: colors.primary + '40' }}
                            thumbColor={darkModeEnabled ? colors.primary : '#F4F3F4'}
                            ios_backgroundColor="#D1D1D6"
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
                            trackColor={{ false: '#D1D1D6', true: colors.primary + '40' }}
                            thumbColor={locationEnabled ? colors.primary : '#F4F3F4'}
                            ios_backgroundColor="#D1D1D6"
                        />
                    )}
                    {renderSettingItem(
                        <Ionicons name="language-outline" size={22} color={colors.primary} />,
                        'Ngôn ngữ',
                        'Thay đổi ngôn ngữ ứng dụng',
                        () => navigation.navigate('Language')
                    )}
                </Animated.View>

                {/* Other Settings */}
                <Animated.View
                    entering={FadeInDown.delay(400)}
                    style={styles.section}
                >
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
                </Animated.View>

                {/* Logout Button */}
                <Animated.View
                    entering={FadeInDown.delay(500)}
                    style={styles.logoutSection}
                >
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                        <Text style={styles.logoutText}>Đăng xuất</Text>
                    </TouchableOpacity>

                    <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    profileSection: {
        marginTop: -20,
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        flexDirection: 'column',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0F0F0',
    },
    editImageButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        alignItems: 'center',
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 5,
    },
    profileEmail: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 15,
    },
    editProfileButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    editProfileGradient: {
        paddingVertical: 8,
        paddingHorizontal: 20,
    },
    editProfileText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 15,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '15',
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
        marginBottom: 4,
    },
    settingSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    logoutSection: {
        marginTop: 30,
        paddingHorizontal: 20,
        paddingBottom: 30,
        alignItems: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF1F0',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '100%',
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#FF3B30',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    logoutText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
    },
    versionText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: colors.textSecondary,
    },
});