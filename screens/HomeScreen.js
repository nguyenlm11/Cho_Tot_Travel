import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CalendarModal from '../components/Modal/CalendarModal';
import GuestModal from '../components/Modal/GuestModal';
import FilterModal from '../components/Modal/FilterModal';
import LocationSearchModal from '../components/Modal/LocationSearchModal';
import { colors } from '../constants/Colors';

export default function HomeScreen() {
    const [isLocationModalVisible, setLocationModalVisible] = useState(false);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [checkInDate, setCheckInDate] = useState("Chọn ngày");
    const [selectedDate, setSelectedDate] = useState(null);
    const [numberOfNights, setNumberOfNights] = useState(1);
    const [checkOutDate, setCheckOutDate] = useState("");
    const [isGuestModalVisible, setGuestModalVisible] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [location, setLocation] = useState('');
    const [longitude, setLongitude] = useState('');
    const [latitude, setLatitude] = useState('');
    const [rooms, setRooms] = useState(1);
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [priceFrom, setPriceFrom] = useState('');
    const [priceTo, setPriceTo] = useState('');
    const [selectedStar, setSelectedStar] = useState(null);
    const navigation = useNavigation();

    const handleSearch = () => {
        console.log("Location:", location);
        console.log("Check-in Date:", checkInDate);
        console.log("Check-out Date:", checkOutDate);
        console.log("Number of night:", numberOfNights);
        console.log("Rooms:", rooms);
        console.log("Adults:", adults);
        console.log("Children:", children);
        console.log("Price From:", priceFrom);
        console.log("Price To:", priceTo);
        console.log("LonTi:", longitude);
        console.log("LatTi:", latitude);

        navigation.navigate("Results", {
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
        });
    };

    useFocusEffect(
        React.useCallback(() => {
            setLocation('');
            setCheckInDate('');
            setCheckOutDate('');
            setNumberOfNights(1);
            setRooms(1);
            setAdults(1);
            setChildren(0);
            setPriceFrom(null);
            setPriceTo(null);
            setSelectedStar(null);
        }, [])
    );

    const handleDateSelect = (date) => {
        const selected = date.dateString;
        const formattedDate = new Date(selected);
        const formattedText = `${formattedDate.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${formattedDate.getDate()}/${formattedDate.getMonth() + 1}/${formattedDate.getFullYear()}`;
        setCheckInDate(formattedText);
        setSelectedDate(selected);

        const checkOut = new Date(formattedDate);
        checkOut.setDate(checkOut.getDate() + numberOfNights);
        const checkOutText = `${checkOut.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${checkOut.getDate()}/${checkOut.getMonth() + 1}/${checkOut.getFullYear()}`;
        setCheckOutDate(checkOutText);
        setCalendarVisible(false);
    };

    const handleLocationSelected = (selectedLocation) => {
        setLocation(selectedLocation.description);
        setLatitude(selectedLocation.latitude);
        setLongitude(selectedLocation.longitude);
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>Logo</Text>
                <TouchableOpacity>
                    <Icon name="notifications-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Search Section */}
            <View style={styles.searchSection}>
                <TouchableOpacity style={styles.searchInput} onPress={() => setLocationModalVisible(true)}>
                    <Icon name="location-outline" size={20} color="#4A4A4A" />
                    <View>
                        <Text style={styles.inputTitle}>Điểm đến, khách sạn</Text>
                        <Text style={styles.inputText} numberOfLines={2} ellipsizeMode="tail">{location !== null && location !== '' ? location : 'Nhập điểm đến'}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.dateInput} onPress={() => setCalendarVisible(true)}>
                    <Icon name="calendar-outline" size={20} color="#4A4A4A" />
                    <View style={{ flexDirection: 'row' }}>
                        <View>
                            <Text style={styles.inputTitle}>Ngày nhận phòng</Text>
                            <Text style={styles.inputText}>{checkInDate}</Text>
                            <Text> Ngày trả phòng: <Text>{checkOutDate}</Text></Text>
                        </View>
                        <View style={{ marginLeft: 10 }}>
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

                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>Tìm kiếm</Text>
                </TouchableOpacity>
            </View>

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

            <View style={styles.recentSearch}>
                <Text style={styles.sectionTitle}>Tra cứu gần đây</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.recentItem}>
                        <Icon name="location-outline" size={20} color="#4A4A4A" />
                        <View>
                            <Text style={styles.itemTitle}>Khách sạn Pullman Vũng Tàu</Text>
                            <Text style={styles.itemDetails}>02/02/2022 - 04/02/2022</Text>
                        </View>
                    </View>
                    <View style={styles.recentItem}>
                        <Icon name="location-outline" size={20} color="#4A4A4A" />
                        <View>
                            <Text style={styles.itemTitle}>Khách sạn Pullman Vũng Tàu</Text>
                            <Text style={styles.itemDetails}>02/02/2022 - 04/02/2022</Text>
                        </View>
                    </View>
                    <View style={styles.recentItem}>
                        <Icon name="location-outline" size={20} color="#4A4A4A" />
                        <View>
                            <Text style={styles.itemTitle}>Khách sạn Pullman Vũng Tàu</Text>
                            <Text style={styles.itemDetails}>02/02/2022 - 04/02/2022</Text>
                        </View>
                    </View>
                </ScrollView>
            </View>

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
        paddingTop: 100,
        backgroundColor: colors.primary,
    },
    logo: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    searchSection: {
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    searchInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    filterInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    inputText: {
        fontSize: 16,
        color: '#4A4A4A',
        marginLeft: 8,
        fontWeight: 'bold',
    },
    inputTitle: {
        fontSize: 16,
        color: '#888',
        marginLeft: 8,
        marginBottom: 8
    },
    searchButton: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    recentSearch: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginBottom: 8,
        marginRight: 8
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    itemDetails: {
        fontSize: 12,
        color: '#888',
    },
    promotionSection: {
        padding: 16,
    },
    promotionImage: {
        width: 200,
        height: 120,
        borderRadius: 8,
        marginRight: 8,
    },
    popularSection: {
        padding: 16,
    },
    popularGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    popularItem: {
        alignItems: 'center',
    },
    popularImage: {
        width: 120,
        height: 240,
        borderRadius: 8,
        marginBottom: 8,
    },
    popularText: {
        position: 'absolute',
        bottom: 10,
        left: 3,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
