import React, { useState } from 'react';
import * as Location from "expo-location";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Linking, ActivityIndicator, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CalendarModal from '../components/Modal/CalendarModal';
import GuestModal from '../components/Modal/GuestModal';
import FilterModal from '../components/Modal/FilterModal';
import LocationSearchModal from '../components/Modal/LocationSearchModal';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSearch } from '../contexts/SearchContext';

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
    defaultCheckOut.setDate(defaultCheckOut.getDate() + numberOfNights);
    const formattedCheckOut = `${defaultCheckOut.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${defaultCheckOut.getDate()}/${defaultCheckOut.getMonth() + 1}/${defaultCheckOut.getFullYear()}`;

    const [isLocationModalVisible, setLocationModalVisible] = useState(false);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [checkInDate, setCheckInDate] = useState(formattedToday);
    const [checkOutDate, setCheckOutDate] = useState(formattedCheckOut);
    const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
    const [numberOfNights, setNumberOfNights] = useState('');
    const [isGuestModalVisible, setGuestModalVisible] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [location, setLocation] = useState(1);
    const [longitude, setLongitude] = useState('');
    const [latitude, setLatitude] = useState('');
    const [rooms, setRooms] = useState(1);
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [priceFrom, setPriceFrom] = useState('');
    const [priceTo, setPriceTo] = useState('');
    const [selectedStar, setSelectedStar] = useState(null);
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(false);
    const { updateCurrentSearch, addToSearchHistory, searchHistory, clearSearchHistory } = useSearch();

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const searchData = {
                location,
                checkInDate,
                checkOutDate,
                numberOfNights,
                rooms,
                adults,
                children,
                priceFrom,
                priceTo,
                selectedStar,
                latitude,
                longitude,
            };
            updateCurrentSearch(searchData);
            addToSearchHistory(searchData);

            await new Promise(resolve => setTimeout(resolve, 1500));
            navigation.navigate("Results", searchData);
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.");
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
            setNumberOfNights(1);
            setRooms(1);
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

    const handleDateSelect = (date, nights) => {
        setCheckInDate(date.formattedDate);
        setSelectedDate(date.dateString);
        setNumberOfNights(nights);

        const checkOut = new Date(date.dateString);
        checkOut.setDate(checkOut.getDate() + nights);
        const checkOutText = `${checkOut.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${checkOut.getDate()}/${checkOut.getMonth() + 1}/${checkOut.getFullYear()}`;
        setCheckOutDate(checkOutText);
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
                <Text style={styles.sectionTitle}>Tra cứu gần đây</Text>
                {searchHistory.length > 0 && (
                    <TouchableOpacity onPress={clearSearchHistory}>
                        <Text style={styles.clearText}>Xóa tất cả</Text>
                    </TouchableOpacity>
                )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {searchHistory.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.recentItem}
                        onPress={() => {
                            updateCurrentSearch(item);
                            navigation.navigate("Results", item);
                        }}
                    >
                        <Icon name="location-outline" size={20} color="#4A4A4A" />
                        <View>
                            <Text style={styles.itemTitle}>{item.location}</Text>
                            <Text style={styles.itemDetails}>
                                {item.checkInDate} - {item.checkOutDate}
                            </Text>
                            <Text style={styles.itemDetails}>
                                {item.rooms} phòng, {item.adults} người lớn
                                {item.children > 0 ? `, ${item.children} trẻ em` : ''}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <LinearGradient
                colors={[colors.primary, colors.primary + 'CC']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Animated.Text
                        entering={FadeIn}
                        style={styles.welcomeText}
                    >
                        Chào mừng bạn!
                    </Animated.Text>
                    <Text style={styles.subText}>Tìm homestay cho chuyến đi của bạn</Text>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
                    <Icon name="notifications-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Search Section */}
            <Animated.View
                entering={FadeInDown.delay(300)}
                style={styles.searchSection}
            >
                {/* Location Search */}
                <TouchableOpacity
                    style={styles.searchCard}
                    onPress={() => setLocationModalVisible(true)}
                >
                    <View style={styles.searchIconContainer}>
                        <Icon name="location-outline" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.searchContent}>
                        <Text style={styles.searchLabel}>Địa điểm</Text>
                        <Text
                            style={styles.searchText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {location || "Bạn muốn đi đâu?"}
                        </Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                {/* Date Selection */}
                <TouchableOpacity
                    style={styles.searchCard}
                    onPress={() => setCalendarVisible(true)}
                >
                    <View style={styles.searchIconContainer}>
                        <Icon name="calendar-outline" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.searchContent}>
                        <Text style={styles.searchLabel}>Ngày</Text>
                        <Text style={styles.searchText}>
                            {checkInDate ? `${checkInDate} • ${numberOfNights} đêm` : "Chọn ngày"}
                        </Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                {/* Guest Selection */}
                <TouchableOpacity
                    style={styles.searchCard}
                    onPress={() => setGuestModalVisible(true)}
                >
                    <View style={styles.searchIconContainer}>
                        <Icon name="people-outline" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.searchContent}>
                        <Text style={styles.searchLabel}>Khách & Phòng</Text>
                        <Text style={styles.searchText}>
                            {rooms ?
                                `${rooms} phòng • ${adults} người lớn${children > 0 ? ` • ${children} trẻ em` : ''}`
                                : "Số lượng khách"}
                        </Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                {/* Filter Selection */}
                <TouchableOpacity
                    style={styles.searchCard}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <View style={styles.searchIconContainer}>
                        <Icon name="filter-outline" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.searchContent}>
                        <Text style={styles.searchLabel}>Bộ lọc</Text>
                        <Text style={styles.searchText}>
                            {!priceFrom && !priceTo && !selectedStar ? (
                                'Tất cả'
                            ) : (
                                <>
                                    {priceFrom || priceTo ? `${priceFrom?.toLocaleString() || 0}đ - ${priceTo?.toLocaleString() || 'Max'}đ` : ''}
                                    {selectedStar ? (priceFrom || priceTo ? ' • ' : '') + `${selectedStar} sao` : ''}
                                </>
                            )}
                        </Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                {/* Search Button */}
                <TouchableOpacity
                    style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
                    onPress={handleSearch}
                    disabled={isLoading}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primary + 'E6']}
                        style={styles.gradientButton}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Icon name="search-outline" size={20} color="#fff" />
                                <Text style={styles.searchButtonText}>Tìm kiếm</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

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
                numberOfNights={numberOfNights}
                setNumberOfNights={setNumberOfNights}
            />
            <GuestModal
                visible={isGuestModalVisible}
                onClose={() => setGuestModalVisible(false)}
                rooms={rooms}
                adults={adults}
                children={children}
                setRooms={setRooms}
                setAdults={setAdults}
                setChildren={setChildren}
            />

            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                priceFrom={priceFrom}
                priceTo={priceTo}
                selectedStar={selectedStar}
                setPriceFrom={setPriceFrom}
                setPriceTo={setPriceTo}
                setSelectedStar={setSelectedStar}
            />

            {/* Trending Homestays */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Homestay nổi bật</Text>
                    <TouchableOpacity style={styles.viewAllButton}>
                        <Text style={styles.viewAllText}>Xem tất cả</Text>
                        <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.homestaysScroll}
                >
                    {trendingHomestays.map((homestay, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.homestayCard}
                        >
                            <Image
                                source={{ uri: homestay.image }}
                                style={styles.homestayImage}
                            />
                            <View style={styles.homestayContent}>
                                <Text style={styles.homestayName}>{homestay.name}</Text>
                                <View style={styles.locationRow}>
                                    <Icon name="location-outline" size={14} color="#666" />
                                    <Text style={styles.locationText}>{homestay.location}</Text>
                                </View>
                                <View style={styles.ratingRow}>
                                    <Icon name="star" size={14} color="#FFD700" />
                                    <Text style={styles.ratingText}>{homestay.rating}</Text>
                                    <Text style={styles.reviewCount}>({homestay.reviews} đánh giá)</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={styles.price}>{homestay.price}đ</Text>
                                    <Text style={styles.perNight}>/đêm</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Promotion Section */}
            <TouchableOpacity style={styles.promotionBanner}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                    style={styles.promotionGradient}
                >
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945' }}
                        style={styles.promotionImage}
                    />
                    <View style={styles.promotionContent}>
                        <Text style={styles.promotionTitle}>Ưu đãi mùa hè</Text>
                        <Text style={styles.promotionDesc}>Giảm đến 30% cho đặt phòng từ 2 đêm</Text>
                        <View style={styles.promotionButton}>
                            <Text style={styles.promotionButtonText}>Xem ngay</Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            {renderSearchHistory()}
        </ScrollView>
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
    notificationButton: {
        position: 'absolute',
        top: 60,
        right: 20,
    },
    searchSection: {
        marginTop: -25,
        marginHorizontal: 20,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    searchContent: {
        flex: 1,
    },
    searchLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    searchText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    searchButton: {
        marginTop: 15,
        borderRadius: 10,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    recentSearch: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        marginRight: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        minWidth: 250,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#495057',
    },
    itemDetails: {
        fontSize: 12,
        color: '#6c757d',
        marginTop: 4,
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewAllText: {
        fontSize: 14,
        color: colors.primary,
        marginRight: 5,
    },
    homestaysScroll: {
        padding: 10,
    },
    homestayCard: {
        width: width * 0.7,
        backgroundColor: '#fff',
        borderRadius: 15,
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    homestayImage: {
        width: '100%',
        height: 180,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    homestayContent: {
        padding: 15,
    },
    homestayName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    locationText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 4,
        marginRight: 4,
    },
    reviewCount: {
        fontSize: 13,
        color: '#666',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    perNight: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    promotionBanner: {
        margin: 20,
        height: 150,
        borderRadius: 15,
        overflow: 'hidden',
    },
    promotionGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    promotionImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    promotionContent: {
        flex: 1,
        padding: 20,
    },
    promotionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    promotionDesc: {
        fontSize: 14,
        color: '#fff',
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
        color: colors.primary,
        fontWeight: '500',
    },
    clearText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    searchButtonDisabled: {
        opacity: 0.7,
    },
});
