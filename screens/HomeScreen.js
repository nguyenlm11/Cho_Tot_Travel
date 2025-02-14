import React, { useState } from 'react';
import * as Location from "expo-location";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Linking, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CalendarModal from '../components/Modal/CalendarModal';
import GuestModal from '../components/Modal/GuestModal';
import FilterModal from '../components/Modal/FilterModal';
import LocationSearchModal from '../components/Modal/LocationSearchModal';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSearch } from '../contexts/SearchContext';

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
        <ScrollView style={styles.container}>
            <LinearGradient
                colors={[colors.primary, colors.primary + 'CC']}
                style={styles.header}>
                <Animated.Text
                    entering={FadeIn}
                    style={styles.logo}>Logo</Animated.Text>
                <TouchableOpacity>
                    <Icon name="notifications-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <Animated.View
                entering={FadeInDown.delay(300)}
                style={styles.searchSection}>
                <TouchableOpacity style={styles.searchInput} onPress={() => setLocationModalVisible(true)}>
                    <Icon name="location-outline" size={20} color="#4A4A4A" />
                    <View>
                        <Text style={styles.inputTitle}>Điểm đến, khách sạn</Text>
                        <Text style={styles.inputText} numberOfLines={2} ellipsizeMode="tail">{location}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.dateInput} onPress={() => setCalendarVisible(true)}>
                    <Icon name="calendar-outline" size={20} color="#4A4A4A" />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '95%' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputTitle}>Ngày nhận phòng</Text>
                            <Text style={styles.inputText}>{checkInDate}</Text>
                            <Text style={[styles.inputTitle, { marginTop: 8 }]}>Ngày trả phòng: <Text style={styles.inputText}>{checkOutDate}</Text></Text>
                        </View>
                        <View style={{ justifyContent: 'center' }}>
                            <Text style={styles.inputTitle}>Số đêm nghỉ</Text>
                            <Text style={styles.inputText}>{numberOfNights} đêm</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.dateInput} onPress={() => setGuestModalVisible(true)}>
                    <Icon name="people-outline" size={20} color="#4A4A4A" />
                    <View>
                        <Text style={styles.inputTitle}>Số phòng và khách</Text>
                        <Text style={styles.inputText}>{rooms} phòng, {adults} người lớn{children > 0 ? `, ${children} trẻ em` : ''}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.filterInput} onPress={() => setFilterModalVisible(true)}>
                    <Icon name="filter-outline" size={20} color="#4A4A4A" />
                    <View>
                        <Text style={styles.inputTitle}>Bộ lọc</Text>
                        <Text style={styles.inputText}>
                            {priceFrom ? `${priceFrom}đ` : ''}
                            {priceFrom && priceTo ? ' - ' : ''}
                            {priceTo ? `${priceTo}đ` : ''}
                            {priceFrom || priceTo ? ', ' : ''}
                            {selectedStar ? `${selectedStar} sao` : ''}
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
                    onPress={handleSearch}
                    disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.searchButtonText}>Tìm kiếm</Text>
                    )}
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

            {renderSearchHistory()}

            <View style={styles.promotionSection}>
                <Text style={styles.sectionTitle}>Ưu đãi</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Image
                        style={styles.promotionImage}
                        source={{ uri: 'https://images.ctfassets.net/wv75stsetqy3/3YYXFh9btLYusTPBXVSkKB/8524b1f010e3a1ef770b1a7909dc9113/Best_Things_to_Do_in_Vung_Tau.jpg?q=60&fit=fill&fm=webp' }}
                    />
                    <Image
                        style={styles.promotionImage}
                        source={{ uri: 'https://images.ctfassets.net/wv75stsetqy3/3YYXFh9btLYusTPBXVSkKB/8524b1f010e3a1ef770b1a7909dc9113/Best_Things_to_Do_in_Vung_Tau.jpg?q=60&fit=fill&fm=webp' }}
                    />
                    <Image
                        style={styles.promotionImage}
                        source={{ uri: 'https://images.ctfassets.net/wv75stsetqy3/3YYXFh9btLYusTPBXVSkKB/8524b1f010e3a1ef770b1a7909dc9113/Best_Things_to_Do_in_Vung_Tau.jpg?q=60&fit=fill&fm=webp' }}
                    />
                </ScrollView>
            </View>

            <View style={styles.popularSection}>
                <Text style={styles.sectionTitle}>Điểm đến phổ biến</Text>
                <View style={styles.popularGrid}>
                    <View style={styles.popularItem}>
                        <Image
                            style={styles.popularImage}
                            source={{ uri: 'https://images.ctfassets.net/wv75stsetqy3/3YYXFh9btLYusTPBXVSkKB/8524b1f010e3a1ef770b1a7909dc9113/Best_Things_to_Do_in_Vung_Tau.jpg?q=60&fit=fill&fm=webp' }}
                        />
                        <Text style={styles.popularText}>Tên điểm đến</Text>
                    </View>
                    <View style={styles.popularItem}>
                        <Image
                            style={styles.popularImage}
                            source={{ uri: 'https://images.ctfassets.net/wv75stsetqy3/3YYXFh9btLYusTPBXVSkKB/8524b1f010e3a1ef770b1a7909dc9113/Best_Things_to_Do_in_Vung_Tau.jpg?q=60&fit=fill&fm=webp' }}
                        />
                        <Text style={styles.popularText}>Tên điểm đến</Text>
                    </View>
                    <View style={styles.popularItem}>
                        <Image
                            style={styles.popularImage}
                            source={{ uri: 'https://images.ctfassets.net/wv75stsetqy3/3YYXFh9btLYusTPBXVSkKB/8524b1f010e3a1ef770b1a7909dc9113/Best_Things_to_Do_in_Vung_Tau.jpg?q=60&fit=fill&fm=webp' }}
                        />
                        <Text style={styles.popularText}>Tên điểm đến</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    logo: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    searchSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginTop: -20,
        marginHorizontal: 16,
        borderRadius: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        transform: [{ translateY: 0 }],
    },
    searchInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    filterInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    inputText: {
        fontSize: 15,
        color: '#495057',
        marginLeft: 8,
        fontWeight: '600',
    },
    inputTitle: {
        fontSize: 14,
        color: '#6c757d',
        marginLeft: 8,
        marginBottom: 4
    },
    searchButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    searchButtonDisabled: {
        backgroundColor: colors.primary + '80',
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    recentSearch: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#212529',
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
    promotionSection: {
        padding: 20,
    },
    promotionImage: {
        width: 280,
        height: 160,
        borderRadius: 15,
        marginRight: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    popularSection: {
        padding: 20,
        paddingBottom: 30,
    },
    popularGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    popularItem: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    popularImage: {
        width: '100%',
        height: 200,
        borderRadius: 15,
    },
    popularText: {
        position: 'absolute',
        bottom: 16,
        left: 12,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: 8,
        borderRadius: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    clearText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
