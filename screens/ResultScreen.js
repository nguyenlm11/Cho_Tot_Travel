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
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const navigation = useNavigation();

    const mockData = [
        {
            id: '1',
            name: 'Khách sạn Pullman Vũng Tàu',
            rating: 5,
            price: '2.000.000 đ',
            image: 'https://images.ctfassets.net/wv75stsetqy3/3YYXFh9btLYusTPBXVSkKB/8524b1f010e3a1ef770b1a7909dc9113/Best_Things_to_Do_in_Vung_Tau.jpg?q=60&fit=fill&fm=webp',
        },
        {
            id: '2',
            name: 'Khách sạn Imperial Vũng Tàu',
            rating: 4.7,
            price: '3.500.000 đ',
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Vungtau.jpg/1200px-Vungtau.jpg',
        },
        {
            id: '3',
            name: 'Khách sạn Malibu Vũng Tàu',
            rating: 3.8,
            price: '1.800.000 đ',
            image: 'https://media.vneconomy.vn/images/upload/2023/03/08/310495-malii.jpg',
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
                            <Text style={styles.priceContainer}>
                                <Text style={styles.price}>{item.price}</Text>
                                <Text> / phòng / đêm</Text>
                            </Text>
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
        flexDirection: 'row',
        margin: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    image: {
        width: 125,
        height: 125,
        borderRadius: 8
    },
    info: {
        flex: 1,
        padding: 10
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
    },
    starContainer: {
        flexDirection: 'row',
        marginVertical: 5
    },
    priceContainer: {
        fontSize: 16,
        marginTop: 10
    },
    price: {
        fontSize: 18,
        color: colors.primary,
        fontWeight: 'bold',
        marginTop: 10
    },
});
