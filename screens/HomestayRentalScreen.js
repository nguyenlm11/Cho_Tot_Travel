import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, StatusBar, RefreshControl, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn, useSharedValue, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import homeStayApi from '../services/api/homeStayApi';
import { colors } from '../constants/Colors';
import { useSearch } from '../contexts/SearchContext';
import RentalFilterModal from '../components/Modal/RentalFilterModal';

export default function HomestayRentalScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { homestayId } = route.params;
    const { currentSearch } = useSearch();
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
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
    }, [homestayId]);

    const fetchHomestayRentals = async () => {
        setLoading(true);
        try {
            const filterParams = {
                HomeStayID: homestayId,
                RentWhole: null,
                CheckInDate: searchParams.formattedCheckIn || currentSearch?.formattedCheckIn,
                CheckOutDate: searchParams.formattedCheckOut || currentSearch?.formattedCheckOut,
                NumberOfAdults: searchParams.adults || currentSearch?.adults || 1,
                NumberOfChildren: searchParams.children || currentSearch?.children || 0,
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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHomestayRentals();
    }, []);

    const handleApplyFilter = async (filterParams) => {
        setIsUpdating(true);
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
            setIsUpdating(false);
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

        const handlePressIn = () => {
            scale.value = withSpring(0.98);
        };

        const handlePressOut = () => {
            scale.value = withSpring(1);
        };
        const defaultPricing = item.pricing?.find(p => p.isDefault) || item.pricing?.[0];
        const price = defaultPricing?.rentPrice || defaultPricing?.unitPrice;
        const rentalType = item.rentWhole ? "Nguyên căn" : "Từng phòng";

        return (
            <View style={styles.rentalCard}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={styles.cardTouchable}
                >
                    <View style={styles.imageContainer}>
                        <Image
                            source={{
                                uri: item.imageHomeStayRentals?.[0]?.image ||
                                    'https://via.placeholder.com/300x200?text=No+Image'
                            }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.7)']}
                            style={styles.imageOverlay}
                        />
                        {price && (
                            <View style={styles.priceTag}>
                                <Text style={styles.priceText}>
                                    {`${price.toLocaleString('vi-VN')}₫`}
                                    <Text style={styles.nightText}>/đêm</Text>
                                </Text>
                            </View>
                        )}
                        <View style={styles.typeTag}>
                            <BlurView intensity={80} tint="dark" style={styles.typeBlur}>
                                <Text style={styles.typeText}>{rentalType}</Text>
                            </BlurView>
                        </View>
                    </View>

                    <View style={styles.contentContainer}>
                        <Text style={styles.rentalName} numberOfLines={2}>
                            {item.name}
                        </Text>
                        <Text style={styles.homestayName} numberOfLines={1}>
                            {item.homeStayName}
                        </Text>

                        <View style={styles.infoContainer}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoItem}>
                                    <FontAwesome5 name="bed" size={14} color={colors.primary} />
                                    <Text style={styles.infoText}>{item.numberBedRoom} phòng ngủ</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <FontAwesome5 name="bath" size={14} color={colors.primary} />
                                    <Text style={styles.infoText}>{item.numberBathRoom} phòng tắm</Text>
                                </View>
                            </View>
                            <View style={styles.infoRow}>
                                <View style={styles.infoItem}>
                                    <MaterialIcons name="kitchen" size={16} color={colors.primary} />
                                    <Text style={styles.infoText}>{item.numberKitchen} bếp</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <MaterialIcons name="wifi" size={16} color={colors.primary} />
                                    <Text style={styles.infoText}>{item.numberWifi} wifi</Text>
                                </View>
                            </View>
                            <View style={styles.capacityContainer}>
                                <MaterialIcons name="people" size={16} color={colors.primary} />
                                <Text style={styles.capacityText}>
                                    Tối đa {item.maxPeople} khách ({item.maxAdults} người lớn, {item.maxChildren} trẻ em)
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.viewDetailButton}
                                onPress={() => navigation.navigate('HomestayRentalDetail', { rentalId: item.homeStayRentalID })}>
                                <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                                <Ionicons name="arrow-forward" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity >
            </View >
        );
    };

    const HeaderComponent = () => (
        <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                <TouchableOpacity style={styles.filterChip}>
                    <Ionicons name="calendar-outline" size={20} color="#ffffff" />
                    <Text style={styles.filterText} numberOfLines={1}>
                        {currentSearch?.checkInDate?.split(', ')[1] || 'Ngày nhận'} - {currentSearch?.checkOutDate?.split(', ')[1] || 'Ngày trả'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.filterChip}>
                    <Ionicons name="people-outline" size={20} color="#ffffff" />
                    <Text style={styles.filterText} numberOfLines={1}>
                        {searchParams.adults || 1} người lớn
                        {searchParams.children > 0 ? `, ${searchParams.children} trẻ em` : ''}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
                style={styles.editButton}
                onPress={() => setFilterModalVisible(true)}
            >
                <Ionicons name="options-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            <LinearGradient
                colors={[colors.primary, colors.primary + 'E6']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Animated.Text
                    entering={FadeInDown.delay(300).springify()}
                    style={styles.headerTitle}
                    numberOfLines={1}
                >
                    Danh sách căn
                </Animated.Text>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons name="options-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
                </View>
            ) : error ? (
                <Animated.View
                    entering={ZoomIn.delay(200)}
                    style={styles.errorContainer}
                >
                    <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
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
                    ListEmptyComponent={
                        <Animated.View
                            entering={FadeInDown.delay(400)}
                            style={styles.emptyContainer}
                        >
                            <Ionicons name="bed-outline" size={80} color={colors.textSecondary} />
                            <Text style={styles.emptyText}>Không có phòng phù hợp</Text>
                            <Text style={styles.emptySubtext}>Vui lòng thử lại với tiêu chí khác</Text>
                        </Animated.View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        zIndex: 100,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    filterButton: {
        marginLeft: 8,
    },
    filterContainer: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 10,
    },
    filterScrollContent: {
        paddingHorizontal: 15,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    filterText: {
        color: '#fff',
        marginLeft: 6,
        fontSize: 14,
    },
    editButton: {
        padding: 10,
        marginRight: 15,
    },
    listContainer: {
        paddingBottom: 20,
    },
    rentalCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardTouchable: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    imageContainer: {
        height: 200,
        width: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    priceTag: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    priceText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    nightText: {
        fontSize: 12,
        fontWeight: 'normal',
    },
    typeTag: {
        position: 'absolute',
        top: 12,
        right: 12,
        overflow: 'hidden',
        borderRadius: 16,
    },
    typeBlur: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    typeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    contentContainer: {
        padding: 16,
    },
    rentalName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    homestayName: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 12,
    },
    infoContainer: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
    },
    viewDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: colors.primary,
        gap: 8,
    },
    viewDetailText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.primary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.error,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    statusTag: {
        position: 'absolute',
        top: 12,
        left: 12,
        overflow: 'hidden',
        borderRadius: 16,
    },
    statusBlur: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    capacityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    capacityText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
});