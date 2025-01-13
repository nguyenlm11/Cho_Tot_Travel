import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from 'react-native-vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import EditSearchModal from '../components/Modal/EditSearchModal';

export default function ResultScreen({ route }) {
    const {
        location: initialLocation,
        checkInDate: initialCheckInDate,
        checkOutDate: initialCheckOutDate,
        numberOfNights: initialNumberOfNights,
        rooms: initialRooms,
        adults: initialAdults,
        children: initialChildren,
        priceFrom: initialPriceFrom,
        priceTo: initialPriceTo,
        selectedStar: initialSelectedStar,
        latitude: initialLatitude,
        longitude: initialLongitude,
    } = route.params;

    const [location, setLocation] = useState(initialLocation);
    const [checkInDate, setCheckInDate] = useState(initialCheckInDate);
    const [checkOutDate, setCheckOutDate] = useState(initialCheckOutDate);
    const [numberOfNights, setNumberOfNights] = useState(initialNumberOfNights);
    const [rooms, setRooms] = useState(initialRooms);
    const [adults, setAdults] = useState(initialAdults);
    const [children, setChildren] = useState(initialChildren);
    const [priceFrom, setPriceFrom] = useState(initialPriceFrom);
    const [priceTo, setPriceTo] = useState(initialPriceTo);
    const [selectedStar, setSelectedStar] = useState(initialSelectedStar);
    const [latitude, setLatitude] = useState(initialLatitude);
    const [longitude, setLongitude] = useState(initialLongitude);
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const navigation = useNavigation();

    const mockData = [
        {
            id: '1',
            image: 'https://images.ctfassets.net/wv75stsetqy3/3YYXFh9btLYusTPBXVSkKB/8524b1f010e3a1ef770b1a7909dc9113/Best_Things_to_Do_in_Vung_Tau.jpg?q=60&fit=fill&fm=webp',
            name: 'The Hammock Hotel Global City',
            rating: 4,
            address: 'Quận 2, Thành phố Hồ Chí Minh',
            distance: '7.17 km từ địa điểm hiện tại',
            features: ['Đưa đón sân bay', 'Dịch vụ trả phòng cấp tốc'],
            price: '1.058.201 VND',
            originalPrice: '1.599.999 VND',
            availability: 'Chỉ còn 3 phòng có giá này!',
        },
        {
            id: '2',
            image: 'https://via.placeholder.com/150',
            name: 'Smiley Apartment District 2',
            rating: 3,
            address: 'Quận 2, Thành phố Hồ Chí Minh',
            distance: '8.71 km từ địa điểm hiện tại',
            features: ['Nhà bếp mini', 'Sân thượng/Sân hiên'],
            price: '355.555 VND',
            originalPrice: '420.000 VND',
            availability: 'Chỉ còn 1 phòng có giá này!',
        },
        {
            id: '3',
            image: 'https://via.placeholder.com/150',
            name: 'Smiley Apartment District 2',
            rating: 3,
            address: 'Quận 2, Thành phố Hồ Chí Minh',
            distance: '8.71 km từ địa điểm hiện tại',
            features: ['Nhà bếp mini', 'Sân thượng/Sân hiên'],
            price: '355.555 VND',
            originalPrice: '420.000 VND',
            availability: 'Chỉ còn 1 phòng có giá này!',
        },
    ];

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <View style={styles.starContainer}>
                {Array.from({ length: fullStars }).map((_, index) => (
                    <Ionicons key={`full-${index}`} name="star" size={14} color="#FFD700" />
                ))}
                {hasHalfStar && <Ionicons name="star-half" size={14} color="#FFD700" />}
                {Array.from({ length: emptyStars }).map((_, index) => (
                    <Ionicons key={`empty-${index}`} name="star-outline" size={14} color="#888" />
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={20} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">{location || "Quay lại"}</Text>
            </View>

            <View style={styles.hrLine} />

            <View style={styles.filterBar}>
                <TouchableOpacity style={styles.filterItem}>
                    <Ionicons name="calendar-outline" size={22} color="#ffffff" />
                    <Text style={styles.filterText}>{checkInDate}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterItem}>
                    <Ionicons name="moon-outline" size={20} color="#ffffff" />
                    <Text style={styles.filterText}>
                        {numberOfNights}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterItem}>
                    <MaterialCommunityIcons name="door" size={22} color="#ffffff" />
                    <Text style={styles.filterText}>{rooms}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterItem}>
                    <Ionicons name="people-outline" size={22} color="#ffffff" />
                    <Text style={styles.filterText}>
                        {adults}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sortButton} onPress={() => setEditModalVisible(true)}>
                    <Ionicons name="chevron-down-circle-outline" size={25} color="#ffffff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={mockData}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image style={styles.image} source={{ uri: item.image }} />
                        <View style={styles.info}>
                            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                            {renderStars(item.rating)}
                            <Text style={styles.address}>{item.address}</Text>
                            <Text style={styles.distance}>{item.distance}</Text>
                            <View style={styles.features}>
                                {item.features.map((feature, index) => (
                                    <Text key={index} style={styles.feature}>{feature}</Text>
                                ))}
                            </View>
                            <View style={styles.priceContainer}>
                                <Text style={styles.price}>{item.price}</Text>
                                <Text style={styles.originalPrice}>{item.originalPrice}</Text>
                            </View>
                            <Text style={styles.availability}>{item.availability}</Text>
                        </View>
                    </View>
                )}
            />

            <EditSearchModal
                visible={isEditModalVisible}
                onClose={() => setEditModalVisible(false)}
                location={location}
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                numberOfNights={numberOfNights}
                rooms={rooms}
                adults={adults}
                children={children}
                priceFrom={priceFrom}
                priceTo={priceTo}
                selectedStar={selectedStar}
                latitude={latitude}
                longitude={longitude}
                setLocation={setLocation}
                setCheckInDate={setCheckInDate}
                setCheckOutDate={setCheckOutDate}
                setNumberOfNights={setNumberOfNights}
                setRooms={setRooms}
                setAdults={setAdults}
                setChildren={setChildren}
                setPriceFrom={setPriceFrom}
                setPriceTo={setPriceTo}
                setSelectedStar={setSelectedStar}
                setLatitude={setLatitude}
                setLongitude={setLongitude}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        backgroundColor: colors.primary,
        padding: 15,
        paddingTop: 70,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    hrLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#D1D1D1',
    },
    filterBar: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    filterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10
    },
    filterText: {
        marginLeft: 5,
        fontSize: 16,
        color: '#ffffff'
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10
    },
    card: {
        margin: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    image: {
        width: '100%',
        height: 150,
    },
    info: {
        padding: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    starContainer: {
        flexDirection: 'row',
        marginVertical: 5,
    },
    starFilled: {
        color: '#FFD700',
        marginRight: 2,
    },
    starEmpty: {
        color: '#ccc',
        marginRight: 2,
    },
    address: {
        fontSize: 14,
        color: '#777',
    },
    distance: {
        fontSize: 12,
        color: '#555',
        marginBottom: 5,
    },
    features: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    feature: {
        backgroundColor: '#f0f0f0',
        color: '#555',
        fontSize: 12,
        padding: 5,
        borderRadius: 5,
        marginRight: 5,
        marginBottom: 5,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#E53935',
        marginRight: 10,
    },
    originalPrice: {
        fontSize: 14,
        color: '#aaa',
        textDecorationLine: 'line-through',
    },
    availability: {
        fontSize: 12,
        color: '#E53935',
    },
});
