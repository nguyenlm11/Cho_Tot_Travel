import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, StatusBar, RefreshControl, Dimensions, Platform, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn, useSharedValue, withSpring } from 'react-native-reanimated';
import homeStayApi from '../services/api/homeStayApi';
import { colors } from '../constants/Colors';
import { useSearch } from '../contexts/SearchContext';
import RentalFilterModal from '../components/Modal/RentalFilterModal';
import DropdownMenuTabs from '../components/DropdownMenuTabs';
import LoadingScreen from '../components/LoadingScreen';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

export default function HomestayRentalScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { homeStayId: homestayId } = route.params;
    const { currentSearch } = useSearch();
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [homestayInfo, setHomestayInfo] = useState(null);
    const [searchParams, setSearchParams] = useState({
        checkInDate: currentSearch?.checkInDate,
        checkOutDate: currentSearch?.checkOutDate,
        formattedCheckIn: currentSearch?.formattedCheckIn,
        formattedCheckOut: currentSearch?.formattedCheckOut,
        adults: currentSearch?.adults,
        children: currentSearch?.children,
    });

    useEffect(() => {
        fetchHomestayRentals();
        fetchHomestayInfo();
    }, [homestayId]);

    const fetchHomestayInfo = async () => {
        try {
            const response = await homeStayApi.getHomeStayDetail(homestayId);
            if (response?.data) {
                setHomestayInfo(response.data);
            }
        } catch (error) {
            console.log('Error fetching homestay info:', error);
        }
    };

    const fetchHomestayRentals = async () => {
        setLoading(true);
        try {
            const filterParams = {
                HomeStayID: homestayId,
                RentWhole: null,
                CheckInDate: currentSearch?.formattedCheckIn,
                CheckOutDate: currentSearch?.formattedCheckOut,
                NumberOfAdults: currentSearch?.adults || 1,
                NumberOfChildren: currentSearch?.children || 0,
            };
            const results = await homeStayApi.getHomeStayRentals(filterParams);
            if (Array.isArray(results)) {
                setRentals(results);
                setError(null);
            } else {
                setRentals([]);
                setError('Không tìm thấy thông tin căn hộ cho thuê');
            }
        } catch (err) {
            console.error('Error fetching homestay rentals:', err);
            setError('Không thể tải thông tin căn hộ. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchHomestayRentals();
    };

    const handleApplyFilter = async (filterParams) => {
        setLoading(true);
        try {
            const apiParams = {
                HomeStayID: homestayId,
                RentWhole: null,
                CheckInDate: filterParams.CheckInDate,
                CheckOutDate: filterParams.CheckOutDate,
                NumberOfAdults: filterParams.NumberOfAdults,
                NumberOfChildren: filterParams.NumberOfChildren,
            };
            const results = await homeStayApi.getHomeStayRentals(apiParams);
            if (Array.isArray(results)) {
                setRentals(results);
                setError(null);
            } else {
                setRentals([]);
                setError('Không tìm thấy thông tin căn hộ cho thuê');
            }
        } catch (err) {
            console.error('Error applying filter:', err);
            setError('Không thể tải thông tin căn hộ. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const updateSearchParams = (newParams) => {
        setSearchParams(prev => ({
            ...prev,
            ...newParams
        }));
    };

    const RentalItemCard = ({ item, index }) => {
        const scale = useSharedValue(1);
        const handlePressIn = () => { scale.value = withSpring(0.98) };
        const handlePressOut = () => { scale.value = withSpring(1) };
        const defaultPricing = item.pricing?.find(p => p.isDefault) || item.pricing?.[0];
        const price = defaultPricing?.rentPrice || defaultPricing?.unitPrice;
        const rentalType = item.rentWhole ? "Nguyên căn" : "Từng phòng";

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).springify()}
                style={styles.cardContainer}
            >
                <TouchableOpacity
                    activeOpacity={0.95}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={styles.cardTouchable}
                >
                    <View style={styles.cardHeader}>
                        <Image
                            source={{
                                uri: item.imageHomeStayRentals?.[0]?.image ||
                                    'https://via.placeholder.com/300x200?text=No+Image'
                            }}
                            style={styles.cardImage}
                            resizeMode="cover"
                        />

                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={styles.imageGradient}
                        />

                        <View style={styles.typeBadge}>
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.typeBadgeGradient}
                            >
                                <Text style={styles.typeBadgeText}>{rentalType}</Text>
                            </LinearGradient>
                        </View>

                        <View style={styles.priceContainer}>
                            <Text style={styles.priceAmount}>
                                {price?.toLocaleString('vi-VN')}đ
                            </Text>
                            <Text style={styles.priceUnit}>/đêm</Text>
                        </View>
                    </View>

                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { marginBottom: 6 }]} numberOfLines={2}>
                            {item.name}
                        </Text>

                        <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.locationText} numberOfLines={1}>
                                {item.description || "Không có mô tả"}
                            </Text>
                        </View>
                        <View style={styles.cardDivider} />
                        <View style={styles.amenitiesGrid}>
                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <FontAwesome5 name="bed" size={14} color={colors.primary} />
                                </View>
                                <Text style={styles.amenityText}>{item.numberBedRoom} phòng ngủ</Text>
                            </View>

                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <FontAwesome5 name="bath" size={14} color={colors.primary} />
                                </View>
                                <Text style={styles.amenityText}>{item.numberBathRoom} phòng tắm</Text>
                            </View>

                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <MaterialIcons name="kitchen" size={14} color={colors.primary} />
                                </View>
                                <Text style={styles.amenityText}>{item.numberKitchen} bếp</Text>
                            </View>

                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <MaterialIcons name="wifi" size={14} color={colors.primary} />
                                </View>
                                <Text style={styles.amenityText}>{item.numberWifi} wifi</Text>
                            </View>
                        </View>

                        <View style={styles.capacityBadge}>
                            <MaterialIcons name="people-alt" size={16} color="#666" />
                            <Text style={styles.capacityText}>
                                Tối đa {item.maxPeople} khách • {item.maxAdults} người lớn • {item.maxChildren} trẻ em
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.viewDetailsButton}
                            onPress={() => navigation.navigate('HomestayRentalDetail', { rentalId: item.homeStayRentalID, homeStayId: homestayId })}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.viewDetailsGradient}
                            >
                                <Text style={styles.viewDetailsText}>Xem chi tiết</Text>
                                <Ionicons name="chevron-forward" size={16} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const HeaderComponent = () => (
        <View style={styles.headerComponentContainer}>
            {homestayInfo && (
                <View style={styles.homestayInfoSection}>
                    <Text style={styles.homestayName}>{homestayInfo.name}</Text>
                    {homestayInfo.address && (
                        <View style={styles.addressRow}>
                            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                            <Text style={styles.addressText} numberOfLines={1}>
                                {homestayInfo.address}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.filterContainer}>
                <Text style={styles.filterTitle}>Thông tin tìm kiếm</Text>

                <View style={styles.filterChipContainer}>
                    <TouchableOpacity
                        style={styles.filterChip}
                        onPress={() => setFilterModalVisible(true)}
                    >
                        <View style={styles.filterChipIcon}>
                            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.filterChipContent}>
                            <Text style={styles.filterChipLabel}>Ngày</Text>
                            <Text style={styles.filterChipText} numberOfLines={1}>
                                {currentSearch?.checkInDate?.split(', ')[1] || 'Chọn ngày'} - {currentSearch?.checkOutDate?.split(', ')[1] || '...'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.filterChip}
                        onPress={() => setFilterModalVisible(true)}
                    >
                        <View style={styles.filterChipIcon}>
                            <Ionicons name="people-outline" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.filterChipContent}>
                            <Text style={styles.filterChipLabel}>Khách</Text>
                            <Text style={styles.filterChipText} numberOfLines={1}>
                                {currentSearch.adults || 1} người lớn
                                {currentSearch.children > 0 ? `, ${currentSearch.children} trẻ em` : ''}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.resultCountContainer}>
                <Text style={styles.resultCount}>
                    {rentals.length > 0
                        ? `Tìm thấy ${rentals.length} căn phù hợp`
                        : "Không tìm thấy căn phù hợp"}
                </Text>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons name="options-outline" size={20} color={colors.primary} />
                    <Text style={styles.filterButtonText}>Lọc</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent={true}
            />

            <View style={styles.header}>
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>Danh sách căn hộ</Text>

                        <DropdownMenuTabs
                            iconStyle={styles.menuButton}
                            iconColor="#fff"
                        />
                    </View>
                </LinearGradient>
            </View>

            {loading ? (
                <LoadingScreen
                    message="Đang tải danh sách căn hộ"
                    subMessage="Vui lòng đợi trong giây lát..."
                />
            ) : error ? (
                <Animated.View
                    entering={ZoomIn.delay(200)}
                    style={styles.errorContainer}
                >
                    <Ionicons name="alert-circle-outline" size={80} color={colors.error} />
                    <Text style={styles.errorTitle}>Rất tiếc!</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchHomestayRentals}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <FlatList
                    data={rentals}
                    keyExtractor={(item, index) => `rental-${item.homeStayRentalID || ''}-${index}`}
                    renderItem={({ item, index }) => <RentalItemCard item={item} index={index} />}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={<HeaderComponent />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <Animated.View
                            entering={FadeInDown.delay(400)}
                            style={styles.emptyContainer}
                        >
                            <Image
                                source={{ uri: 'https://res.cloudinary.com/dzjofylpf/image/upload/v1742915319/HomeStayImages/empty_search.png' }}
                                style={styles.emptyImage}
                            />
                            <Text style={styles.emptyText}>Không tìm thấy căn hộ phù hợp</Text>
                            <Text style={styles.emptySubtext}>Vui lòng thử lại với tiêu chí tìm kiếm khác</Text>
                            <TouchableOpacity
                                style={styles.changeFilterButton}
                                onPress={() => setFilterModalVisible(true)}
                            >
                                <Text style={styles.changeFilterText}>Thay đổi tìm kiếm</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    }
                />
            )}

            <RentalFilterModal
                visible={isFilterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                searchParams={searchParams}
                onApplyFilter={(filterParams) => {
                    updateSearchParams({
                        adults: filterParams.NumberOfAdults,
                        children: filterParams.NumberOfChildren,
                        formattedCheckIn: filterParams.CheckInDate,
                        formattedCheckOut: filterParams.CheckOutDate
                    });
                    handleApplyFilter(filterParams);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight + 10,
        paddingBottom: 15,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        flex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingTop: Platform.OS === 'ios' ? 90 : 90 + (StatusBar.currentHeight || 0),
        paddingBottom: 20,
    },
    headerComponentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 15,
    },
    homestayInfoSection: {
        marginBottom: 15,
    },
    homestayName: {
        fontSize: isSmallDevice ? 20 : 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    filterContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    filterChipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 10,
        marginBottom: 8,
        width: isSmallDevice ? '100%' : '48%',
        marginBottom: isSmallDevice ? 8 : 0,
    },
    filterChipIcon: {
        marginRight: 8,
    },
    filterChipContent: {
        flex: 1,
    },
    filterChipLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    filterChipText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    resultCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    resultCount: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
        color: colors.primary,
    },
    cardContainer: {
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    cardTouchable: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        position: 'relative',
        height: 160,
        width: '100%',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    typeBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    typeBadgeGradient: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    typeBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    priceContainer: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    priceAmount: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    priceUnit: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginLeft: 2,
        marginBottom: 1,
    },
    cardContent: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 6,
        flex: 1,
    },
    cardDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 12,
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    amenityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        marginBottom: 8,
    },
    amenityIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    amenityText: {
        fontSize: 13,
        color: '#555',
    },
    capacityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
    },
    capacityText: {
        fontSize: 13,
        color: '#555',
        marginLeft: 8,
        flex: 1,
    },
    viewDetailsButton: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    viewDetailsGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    },
    viewDetailsText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginRight: 6,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    errorTitle: {
        marginTop: 10,
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    errorText: {
        marginTop: 8,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: colors.primary,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    emptyImage: {
        width: 180,
        height: 180,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    emptySubtext: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    changeFilterButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    changeFilterText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});