import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, RefreshControl, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import roomApi from '../services/api/roomApi';
import { useCart } from '../contexts/CartContext';
import CartBadge from '../components/CartBadge';
import DropdownMenuTabs from '../components/DropdownMenuTabs';
import LoadingScreen from '../components/LoadingScreen';

const palette = {
    primary: colors.primary,
    secondary: colors.secondary,
    background: '#f8f9fa',
    card: '#ffffff',
    cardBorder: '#eaeaea',
    text: { dark: '#2c3e50', medium: '#546e7a', light: '#78909c' },
};

export default function RoomTypeScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const homeStayId = route.params?.homeStayId;
    const rentalId = route.params?.rentalId;
    const rentalName = route.params?.rentalName;
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const { getRoomsByType, getCartCount, setHomeStay } = useCart();

    useEffect(() => {
        fetchRoomTypes();
    }, [homeStayId]);

    useEffect(() => {
        if (homeStayId) {
            setHomeStay(homeStayId);
        }
    }, [homeStayId, rentalId]);

    const fetchRoomTypes = async () => {
        setLoading(true);
        try {
            const data = await roomApi.getAllRoomTypesByRentalId(rentalId);
            if (Array.isArray(data) && data.length > 0) {
                setRoomTypes(data);
                setError(null);
            } else {
                setRoomTypes([]);
                setError('Không tìm thấy loại phòng nào');
            }
        } catch (err) {
            setError('Không thể tải thông tin loại phòng. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchRoomTypes();
        setRefreshing(false);
    }, []);

    const params = {};
    if (homeStayId) params.homeStayId = homeStayId;
    if (rentalId) params.rentalId = rentalId;

    const handleSelectRoom = (roomType) => {
        const navParams = { roomTypeId: roomType.roomTypesID, roomTypeName: roomType.name, rentalName: rentalName, people: roomType.maxPeople };
        if (homeStayId) navParams.homeStayId = homeStayId;
        if (rentalId) navParams.rentalId = rentalId;
        navigation.navigate('ListRoom', navParams);
    };

    const RoomTypeCard = ({ item, index }) => {
        const defaultPricing = item.pricings?.find(p => p.isDefault) || item.pricings?.[0];
        const roomTypeID = item.roomTypesID;
        const selectedRoomsCount = getRoomsByType(roomTypeID, params).length;

        return (
            <Animated.View
                style={styles.cardContainer}
                entering={FadeInDown.delay(index * 100).springify()}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleSelectRoom(item)}
                >
                    <Animated.View style={styles.roomCard}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: item.imageRoomTypes?.[0]?.image || 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg' }}
                                style={styles.roomImage}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
                                style={styles.imageGradient}
                            />
                            <View style={styles.roomTypeBadge}>
                                <Text style={styles.roomTypeText}>{item.name}</Text>
                            </View>
                        </View>

                        <View style={styles.roomInfo}>
                            <View style={styles.roomHeader}>
                                <View style={styles.roomStatsContainer}>
                                    <View style={styles.statItem}>
                                        <View style={styles.statIconContainer}>
                                            <FontAwesome5 name="users" size={14} color={palette.primary} />
                                        </View>
                                        <View style={styles.statInfo}>
                                            <Text style={styles.statValue}>{item.maxPeople} </Text>
                                            <Text style={styles.statLabel}>Người tối đa</Text>
                                        </View>
                                    </View>

                                    <View style={styles.statDivider} />

                                    <View style={styles.statItem}>
                                        <View style={styles.statIconContainer}>
                                            <MaterialIcons name="calendar-today" size={16} color={palette.primary} />
                                        </View>
                                        <View style={styles.statInfo}>
                                            <Text style={styles.statValue}>
                                                {defaultPricing?.rentPrice?.toLocaleString()}
                                            </Text>
                                            <Text style={styles.statLabel}>/đêm</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.viewPriceDetailButton}
                                            onPress={() => navigation.navigate('PriceDetail', { roomType: item })}
                                        >
                                            <MaterialIcons name="arrow-forward-ios" size={14} color={palette.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.roomDescription} numberOfLines={2}>
                                {item.description || 'Không có mô tả'}
                            </Text>

                            <View style={styles.bottomSection}>
                                <View style={styles.infoContainer}>
                                    <View style={styles.infoItem}>
                                        <MaterialIcons name="child-care" size={16} color={palette.text.medium} />
                                        <Text style={styles.infoText}>{item.maxChildren || 0} trẻ em</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <MaterialIcons name="person" size={16} color={palette.text.medium} />
                                        <Text style={styles.infoText}>{item.maxAdults || 0} người lớn</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.selectButton}
                                    onPress={() => handleSelectRoom(item)}
                                >
                                    <LinearGradient
                                        colors={[palette.primary, palette.secondary]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.gradientButton}
                                    >
                                        <Text style={styles.selectButtonText}>
                                            {selectedRoomsCount > 0 ? 'Đã chọn' : 'Chọn phòng'}
                                        </Text>
                                        {selectedRoomsCount > 0 && (
                                            <View style={styles.selectedBadge}>
                                                <Text style={styles.selectedBadgeText}>{selectedRoomsCount}</Text>
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        );
    };
    if (loading) { return <LoadingScreen message="Đang tải thông tin phòng..." />; }
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color={palette.text.medium} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchRoomTypes}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={palette.primary} />
            <LinearGradient
                colors={[palette.primary, palette.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Animated.View
                    entering={FadeInDown.delay(300).springify()}
                    style={styles.headerTitleContainer}
                >
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        Danh sách loại phòng
                    </Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                        {rentalName}
                    </Text>
                </Animated.View>
                <DropdownMenuTabs
                    iconStyle={styles.menuButton}
                />
            </LinearGradient>

            <FlatList
                data={roomTypes}
                renderItem={({ item, index }) => <RoomTypeCard item={item} index={index} />}
                keyExtractor={item => item.roomTypesID.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[palette.primary]}
                        tintColor={palette.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="hotel" size={48} color={palette.text.medium} />
                        <Text style={styles.emptyText}>Không có loại phòng nào</Text>
                    </View>
                }
            />
            {getCartCount(params) > 0 && (
                <View style={styles.cartBadgeContainer}>
                    <CartBadge params={params} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginTop: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginHorizontal: 16,
    },
    listContent: {
        padding: 16,
    },
    cardContainer: {
        marginBottom: 16,
    },
    roomCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
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
    imageContainer: {
        height: 200,
        position: 'relative',
    },
    roomImage: {
        width: '100%',
        height: '100%',
    },
    imageGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    roomTypeBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    roomTypeText: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.primary,
    },
    roomInfo: {
        padding: 16,
    },
    roomHeader: {
        marginBottom: 16,
    },
    roomStatsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 12,
        padding: 12,
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    statInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.text.dark,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: palette.text.medium,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: 12,
    },
    viewPriceDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    roomDescription: {
        fontSize: 14,
        color: palette.text.medium,
        marginBottom: 16,
        lineHeight: 20,
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoContainer: {
        flexDirection: 'row',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    infoText: {
        fontSize: 14,
        color: palette.text.medium,
        marginLeft: 4,
    },
    selectButton: {
        flex: 1,
        marginLeft: 16,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    selectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    selectedBadge: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    selectedBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: palette.primary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    errorText: {
        fontSize: 16,
        color: palette.text.medium,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: palette.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        color: palette.text.medium,
        textAlign: 'center',
        marginTop: 16,
    },
    cartBadgeContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        zIndex: 1000,
        elevation: 10,
    }
}); 