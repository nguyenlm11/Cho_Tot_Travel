import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Image, 
    ActivityIndicator,
    StatusBar,
    RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import authApi from '../services/api/authApi';
import { useUser } from '../contexts/UserContext';

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { userData, refreshUserData } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bookingsCount, setBookingsCount] = useState(0);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        setIsLoading(true);
        try {
            await refreshUserData();
            // Here you would also fetch additional user data like booking count
            // For now we'll use a placeholder
            setBookingsCount(Math.floor(Math.random() * 10));
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUserData();
        setRefreshing(false);
    };

    useEffect(() => {
        if (userData) {
            setUserName(userData.name || userData.username || 'Người dùng');
            setUserEmail(userData.email || '');
        }
    }, [userData]);

    const renderHeader = () => (
        <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.header}
        >
            <Text style={styles.headerTitle}>Tài khoản</Text>
            <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => navigation.navigate('Settings')}
            >
                <BlurView intensity={80} tint="light" style={styles.blurButton}>
                    <Ionicons name="settings-outline" size={22} color="#fff" />
                </BlurView>
            </TouchableOpacity>
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
                    source={{ uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=random' }}
                />
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

    const renderStatsSection = () => (
        <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.statsSection}
        >
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{bookingsCount}</Text>
                <Text style={styles.statLabel}>Đặt phòng</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Đã lưu</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
        </Animated.View>
    );

    const renderActionItem = (icon, title, subtitle, action) => (
        <TouchableOpacity
            style={styles.actionItem}
            onPress={action}
        >
            <View style={styles.actionIconContainer}>
                {icon}
            </View>
            <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{title}</Text>
                {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải...</Text>
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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                    />
                }
            >
                {renderProfileSection()}
                {renderStatsSection()}

                <Animated.View
                    entering={FadeInDown.delay(300)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Đặt phòng & Dịch vụ</Text>
                    {renderActionItem(
                        <Ionicons name="calendar-outline" size={22} color={colors.primary} />,
                        'Đặt phòng của tôi',
                        'Xem lịch sử đặt phòng và trạng thái',
                        () => navigation.navigate('BookingList')
                    )}
                    {renderActionItem(
                        <Ionicons name="star-outline" size={22} color={colors.primary} />,
                        'Đánh giá của tôi',
                        'Quản lý đánh giá và nhận xét',
                        () => navigation.navigate('ReviewScreen')
                    )}
                    {renderActionItem(
                        <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.primary} />,
                        'Địa điểm đã lưu',
                        'Xem các địa điểm bạn đã lưu',
                        () => navigation.navigate('SavedLocations')
                    )}
                </Animated.View>

                <Animated.View
                    entering={FadeInDown.delay(400)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Tài khoản</Text>
                    {renderActionItem(
                        <Ionicons name="person-outline" size={22} color={colors.primary} />,
                        'Thông tin cá nhân',
                        'Cập nhật thông tin cá nhân của bạn',
                        () => navigation.navigate('EditProfile')
                    )}
                    {renderActionItem(
                        <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />,
                        'Bảo mật',
                        'Đổi mật khẩu, xác thực hai yếu tố',
                        () => navigation.navigate('Security')
                    )}
                    {renderActionItem(
                        <Ionicons name="notifications-outline" size={22} color={colors.primary} />,
                        'Thông báo',
                        'Quản lý thông báo',
                        () => navigation.navigate('NotificationScreen')
                    )}
                    {renderActionItem(
                        <Ionicons name="settings-outline" size={22} color={colors.primary} />,
                        'Cài đặt',
                        'Tùy chỉnh ứng dụng',
                        () => navigation.navigate('Settings')
                    )}
                </Animated.View>

                <Animated.View
                    entering={FadeInDown.delay(500)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Hỗ trợ</Text>
                    {renderActionItem(
                        <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />,
                        'Trò chuyện với hỗ trợ viên',
                        'Liên hệ với đội ngũ hỗ trợ',
                        () => navigation.navigate('ChatScreen')
                    )}
                    {renderActionItem(
                        <Ionicons name="help-circle-outline" size={22} color={colors.primary} />,
                        'Trợ giúp & FAQ',
                        'Câu hỏi thường gặp, hướng dẫn sử dụng',
                        () => navigation.navigate('Help')
                    )}
                </Animated.View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: colors.textPrimary,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    settingsButton: {
        position: 'absolute',
        right: 15,
        top: 45,
    },
    blurButton: {
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    profileSection: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: -20,
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    profileImageContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        overflow: 'hidden',
        backgroundColor: '#F0F0F0',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    profileInfo: {
        marginLeft: 15,
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    profileEmail: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    editProfileButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    editProfileGradient: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    editProfileText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    statsSection: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    statLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: '80%',
        backgroundColor: '#E5E5E5',
        alignSelf: 'center',
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 10,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(73, 69, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.textPrimary,
    },
    actionSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    versionText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
});