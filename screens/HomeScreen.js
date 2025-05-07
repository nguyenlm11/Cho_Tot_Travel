import React, { useState, useEffect } from 'react';
import * as Location from "expo-location";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Linking, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CalendarModal from '../components/Modal/CalendarModal';
import GuestModal from '../components/Modal/GuestModal';
import FilterModal from '../components/Modal/FilterModal';
import LocationSearchModal from '../components/Modal/LocationSearchModal';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useSearch } from '../contexts/SearchContext';
import authApi from '../services/api/authApi';
import homeStayApi from '../services/api/homeStayApi';
import { useUser } from '../contexts/UserContext';
import LoadingScreen from '../components/LoadingScreen';

const { width } = Dimensions.get('window');

const trendingHomestays = [
    {
        name: 'Dalat Green Valley',
        image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8',
        rating: 4.8,
        reviews: 156,
        price: '850,000',
        location: 'Đà Lạt'
    },
    {
        name: 'Vung Tau Beach House',
        image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e',
        rating: 4.9,
        reviews: 203,
        price: '1,200,000',
        location: 'Vũng Tàu'
    }
];

export default function HomeScreen() {
    const today = new Date();
    const formattedToday = `${today.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const defaultCheckOut = new Date(today);
    defaultCheckOut.setDate(defaultCheckOut.getDate() + 1);
    const formattedCheckOut = `${defaultCheckOut.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${defaultCheckOut.getDate()}/${defaultCheckOut.getMonth() + 1}/${defaultCheckOut.getFullYear()}`;

    const [isLocationModalVisible, setLocationModalVisible] = useState(false);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [checkInDate, setCheckInDate] = useState(formattedToday);
    const [checkOutDate, setCheckOutDate] = useState(formattedCheckOut);
    const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
    const [isGuestModalVisible, setGuestModalVisible] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [location, setLocation] = useState("Vị trí gần bạn");
    const [longitude, setLongitude] = useState('');
    const [latitude, setLatitude] = useState('');
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [priceFrom, setPriceFrom] = useState('');
    const [priceTo, setPriceTo] = useState('');
    const [selectedStar, setSelectedStar] = useState(null);
    const navigation = useNavigation();
    const { userData, refreshUserData } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const { updateCurrentSearch, addToSearchHistory, searchHistory, clearSearchHistory, updateSearchResults, loadHistoryResults } = useSearch();
    const [error, setError] = useState('');

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const checkInDateParts = checkInDate.split(', ')[1].split('/');
            const checkOutDateParts = checkOutDate.split(', ')[1].split('/');

            const formattedCheckIn = `${checkInDateParts[2]}-${checkInDateParts[1].padStart(2, '0')}-${checkInDateParts[0].padStart(2, '0')}`;
            const formattedCheckOut = `${checkOutDateParts[2]}-${checkOutDateParts[1].padStart(2, '0')}-${checkOutDateParts[0].padStart(2, '0')}`;

            const searchData = {
                location,
                checkInDate,
                checkOutDate,
                adults,
                children,
                priceFrom,
                priceTo,
                selectedStar,
                latitude,
                longitude,
                formattedCheckIn,
                formattedCheckOut,
                rating: selectedStar,
                minPrice: priceFrom ? parseFloat(priceFrom) : null,
                maxPrice: priceTo ? parseFloat(priceTo) : null
            };

            console.log("HomeScreen - Search data:", searchData);

            updateCurrentSearch(searchData);

            const filterParams = {
                CheckInDate: formattedCheckIn,
                CheckOutDate: formattedCheckOut,
                NumberOfAdults: adults,
                NumberOfChildren: children,
                Latitude: latitude,
                Longitude: longitude,
                MaxDistance: 10,
                Rating: selectedStar,
                MinPrice: priceFrom ? parseFloat(priceFrom) : null,
                MaxPrice: priceTo ? parseFloat(priceTo) : null
            };
            const results = await homeStayApi.filterHomeStays(filterParams);
            updateSearchResults(results);
            addToSearchHistory(searchData, results);
            navigation.navigate("Results");
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert(
                "Lỗi",
                "Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.",
                [{ text: "Đóng" }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            const fetchLocation = async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert(
                        "Quyền bị từ chối",
                        "Ứng dụng cần quyền truy cập vị trí để hoạt động. Vui lòng cấp quyền trong cài đặt.",
                        [
                            { text: "Hủy", style: "cancel" },
                            { text: "Mở Cài đặt", onPress: () => Linking.openSettings() },
                        ]);
                    return;
                }
                const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
                const reverseGeocode = await Location.reverseGeocodeAsync(position.coords);
                if (reverseGeocode.length > 0) {
                    setLocation("Vị trí gần bạn");
                }
            };

            fetchLocation();
            setLocation("Vị trí gần bạn");
            setCheckInDate(formattedToday);
            setSelectedDate(today.toISOString().split('T')[0]);
            setAdults(1);
            setChildren(0);
            setPriceFrom(null);
            setPriceTo(null);
            setSelectedStar(null);

            const checkOut = new Date(today);
            checkOut.setDate(checkOut.getDate() + 1);
            const checkOutText = `${checkOut.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${checkOut.getDate()}/${checkOut.getMonth() + 1}/${checkOut.getFullYear()}`;
            setCheckOutDate(checkOutText);
        }, [])
    );

    const handleDateSelect = (dateInfo) => {
        console.log("HomeScreen - Date selected:", dateInfo);
        setCheckInDate(dateInfo.formattedDate);
        setSelectedDate(dateInfo.dateString);
        setCheckOutDate(dateInfo.formattedCheckOutDate);
        setCalendarVisible(false);
    };

    const handleLocationSelected = (selectedLocation) => {
        setLocation(selectedLocation.description);
        setLatitude(selectedLocation.latitude);
        setLongitude(selectedLocation.longitude);
    };

    const renderSearchHistory = () => (
        <View style={styles.recentSearch}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>Tra cứu gần đây</Text>
                </View>
                {searchHistory.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearSearchHistory}
                    >
                        <Text style={styles.clearText}>Xóa tất cả</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.historyScrollContent}
            >
                {searchHistory.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.recentItem}
                        onPress={() => {
                            loadHistoryResults(item);
                            navigation.navigate("Results");
                        }}
                    >
                        <View style={styles.recentItemContent}>
                            <View style={styles.locationContainer}>
                                <Icon name="location" size={20} color={colors.primary} />
                                <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.detailsContainer}>
                                <View style={styles.dateContainer}>
                                    <Icon name="calendar-outline" size={16} color={colors.textSecondary} />
                                    <Text style={styles.dateText}>
                                        {item.checkInDate.split(', ')[1]} - {item.checkOutDate.split(', ')[1]}
                                    </Text>
                                </View>

                                <View style={styles.guestContainer}>
                                    <Icon name="people-outline" size={16} color={colors.textSecondary} />
                                    <Text style={styles.guestText}>
                                        {item.adults} người lớn
                                        {item.children > 0 ? `, ${item.children} trẻ em` : ''}
                                    </Text>
                                </View>

                                {(item.rating || item.minPrice || item.maxPrice) && (
                                    <View style={styles.filtersContainer}>
                                        {item.rating && (
                                            <View style={styles.ratingContainer}>
                                                <Icon name="star" size={14} color="#FFD700" />
                                                <Text style={styles.ratingText}>{item.rating} sao</Text>
                                            </View>
                                        )}
                                        {(item.minPrice || item.maxPrice) && (
                                            <View style={styles.priceContainer}>
                                                <Icon name="cash-outline" size={14} color={colors.primary} />
                                                <Text style={styles.priceText}>
                                                    {item.minPrice ? `${item.minPrice.toLocaleString()}đ` : '0đ'} -
                                                    {item.maxPrice ? `${item.maxPrice.toLocaleString()}đ` : 'Max'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    useEffect(() => {
        const checkAuthentication = async () => {
            setIsLoading(true);
            try {
                const isAuthenticated = await authApi.checkAuth();
                if (!isAuthenticated) {
                    await authApi.logout();
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                    return;
                }
                await refreshUserData();
            } catch (err) {
                console.error('Authentication error:', err);
                setError('Có lỗi xảy ra khi kiểm tra xác thực');
                await authApi.logout();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthentication();
    }, [navigation, refreshUserData]);

    const handleLogout = async () => {
        try {
            await authApi.logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (err) {
            console.error('Logout error:', err);
            setError('Có lỗi xảy ra khi đăng xuất');
        }
    };

    if (isLoading) {
        return (
            <LoadingScreen
                message="Đang tìm kiếm"
                subMessage="Vui lòng đợi trong giây lát..."
            />
        );
    }

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Header */}
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.welcomeText}>
                        Chào mừng, {userData?.name || userData?.username || 'Người dùng'}!
                    </Text>
                    <Text style={styles.subText}>Tìm homestay cho chuyến đi của bạn</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="log-out-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Search Section */}
            <View style={styles.searchSection}>
                <TouchableOpacity
                    style={styles.searchBar}
                    onPress={() => setLocationModalVisible(true)}
                >
                    <Icon name="search" size={20} color="#4A4A4A" />
                    <Text style={styles.searchText} numberOfLines={2}>
                        {location || "Bạn muốn đi đâu?"}
                    </Text>
                </TouchableOpacity>

                <View style={styles.dateRow}>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setCalendarVisible(true)}
                    >
                        <Icon name="calendar-outline" size={20} color="#4A4A4A" />
                        <View>
                            <Text style={styles.dateLabel}>Nhận - Trả</Text>
                            <Text style={styles.dateText}>
                                {checkInDate.split(', ')[1]} - {checkOutDate.split(', ')[1]}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.guestRow}>
                    <TouchableOpacity
                        style={styles.guestButton}
                        onPress={() => setGuestModalVisible(true)}
                    >
                        <Icon name="people-outline" size={20} color="#4A4A4A" />
                        <View>
                            <Text style={styles.guestLabel}>Khách</Text>
                            <Text style={styles.guestText}>
                                {adults + children} khách {children > 0 ? `(${adults} người lớn, ${children} trẻ em)` : ''}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setFilterModalVisible(true)}
                    >
                        <Icon name="options-outline" size={20} color="#4A4A4A" />
                        <Text style={styles.filterText}>Bộ lọc</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearch}
                    disabled={isLoading}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.searchButtonGradient}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Icon name="search" size={20} color="#fff" />
                                <Text style={styles.searchButtonText}>Tìm kiếm</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <View style={styles.scrollView}>
                {/* Recent Searches */}
                {searchHistory.length > 0 && renderSearchHistory()}

                {/* Trending Section */}
                <View style={styles.trendingSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Xu hướng tìm kiếm</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.trendingList}
                    >
                        {trendingHomestays.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.trendingItem}
                                onPress={() => navigation.navigate('HomeStayDetail', { id: index + 1 })}
                            >
                                <Image
                                    source={{ uri: item.image }}
                                    style={styles.trendingImage}
                                />
                                <View style={styles.trendingContent}>
                                    <Text style={styles.trendingName}>{item.name}</Text>
                                    <View style={styles.trendingLocation}>
                                        <Icon name="location-outline" size={14} color="#4A4A4A" />
                                        <Text style={styles.locationText}>{item.location}</Text>
                                    </View>
                                    <View style={styles.trendingRating}>
                                        <Icon name="star" size={14} color="#FFD700" />
                                        <Text style={styles.ratingText}>
                                            {item.rating} ({item.reviews} đánh giá)
                                        </Text>
                                    </View>
                                    <Text style={styles.trendingPrice}>
                                        {item.price} <Text style={styles.priceUnit}>đ/đêm</Text>
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Promotions Section */}
                <View style={styles.promotionsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Ưu đãi đặc biệt</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.promotionCard}>
                        <LinearGradient
                            colors={['#FF6B6B', '#FF8E53']}
                            style={styles.promotionGradient}
                        >
                            <View style={styles.promotionContent}>
                                <Text style={styles.promotionTitle}>Giảm 20% cho đặt phòng đầu tiên</Text>
                                <Text style={styles.promotionDescription}>
                                    Áp dụng cho khách hàng mới khi đặt phòng lần đầu tiên
                                </Text>
                                <TouchableOpacity style={styles.promotionButton}>
                                    <Text style={styles.promotionButtonText}>Sử dụng ngay</Text>
                                </TouchableOpacity>
                            </View>
                            <Image
                                // source={require('../assets/promotion.png')}
                                style={styles.promotionImage}
                            />
                        </LinearGradient>
                    </View>
                </View>
            </View>

            {/* Modals */}
            <LocationSearchModal
                visible={isLocationModalVisible}
                onClose={() => setLocationModalVisible(false)}
                onLocationSelected={handleLocationSelected}
            />

            <CalendarModal
                visible={isCalendarVisible}
                onClose={() => setCalendarVisible(false)}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
            />

            <GuestModal
                visible={isGuestModalVisible}
                onClose={() => setGuestModalVisible(false)}
                adults={adults}
                children={children}
                setAdults={setAdults}
                setChildren={setChildren}
            />

            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                priceFrom={priceFrom}
                setPriceFrom={setPriceFrom}
                priceTo={priceTo}
                setPriceTo={setPriceTo}
                selectedStar={selectedStar}
                setSelectedStar={setSelectedStar}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    subText: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    logoutButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchSection: {
        marginTop: -25,
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15,
    },
    searchText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#4A4A4A',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    dateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    dateLabel: {
        marginLeft: 10,
        fontSize: 12,
        color: '#4A4A4A',
        opacity: 0.7,
    },
    dateText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#4A4A4A',
        fontWeight: '500',
    },
    guestRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    guestButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginRight: 15,
    },
    guestLabel: {
        marginLeft: 10,
        fontSize: 12,
        color: '#4A4A4A',
        opacity: 0.7,
    },
    guestText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#4A4A4A',
        fontWeight: '500',
    },
    filterButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    filterText: {
        marginLeft: 5,
        fontSize: 14,
        color: '#4A4A4A',
        fontWeight: '500',
    },
    searchButton: {
        marginTop: 5,
    },
    searchButtonGradient: {
        flexDirection: 'row',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    scrollView: {
        flex: 1,
        paddingTop: 20,
    },
    recentSearch: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    clearButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '500',
    },
    historyScrollContent: {
        paddingRight: 20,
    },
    recentItem: {
        width: width * 0.8,
        marginRight: 15,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    recentItemContent: {
        padding: 16,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 12,
    },
    detailsContainer: {
        gap: 8,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        marginLeft: 8,
        fontSize: 14,
        color: colors.textSecondary,
    },
    guestContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    guestText: {
        marginLeft: 8,
        fontSize: 14,
        color: colors.textSecondary,
    },
    filtersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#B8860B',
        fontWeight: '500',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priceText: {
        marginLeft: 4,
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
    },
    trendingSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    trendingList: {
        marginBottom: 10,
    },
    trendingItem: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
        width: width * 0.7,
        overflow: 'hidden',
    },
    trendingImage: {
        width: '100%',
        height: 150,
    },
    trendingContent: {
        padding: 15,
    },
    trendingName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A4A4A',
        marginBottom: 5,
    },
    trendingLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    locationText: {
        fontSize: 14,
        color: '#4A4A4A',
        opacity: 0.7,
        marginLeft: 5,
    },
    trendingRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    ratingText: {
        fontSize: 14,
        color: '#4A4A4A',
        opacity: 0.7,
        marginLeft: 5,
    },
    trendingPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    priceUnit: {
        fontSize: 14,
        fontWeight: '400',
        color: '#4A4A4A',
        opacity: 0.7,
    },
    promotionsSection: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    promotionCard: {
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    promotionGradient: {
        flexDirection: 'row',
        padding: 20,
    },
    promotionContent: {
        flex: 2,
    },
    promotionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 10,
    },
    promotionDescription: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
        marginBottom: 15,
    },
    promotionButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    promotionButtonText: {
        color: '#FF6B6B',
        fontWeight: '600',
    },
    promotionImage: {
        flex: 1,
        height: 100,
        resizeMode: 'contain',
    },
    viewAllText: {
        fontSize: 14,
        color: colors.primary,
    },
});