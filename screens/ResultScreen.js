import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from 'react-native-vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import EditSearchModal from '../components/Modal/EditSearchModal';
import { ScrollView } from 'react-native-gesture-handler';
import { useSearch } from '../contexts/SearchContext';

export default function ResultScreen() {
    const { currentSearch } = useSearch();
    
    const {
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
    } = currentSearch;

    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const navigation = useNavigation();

    const handleMoveScreen = () => {
        navigation.navigate('HomeStayDetail');
    }

    const mockData = [
        {
            id: '1',
            image: 'https://bazantravel.com/cdn/medias/uploads/30/30866-khach-san-imperial-vung-tau-700x438.jpg',
            name: 'Khách sạn Imperial Vũng Tàu',
            rating: 5,
            address: 'Thùy Vân, Bãi Sau, TP Vũng Tàu',
            distance: '7.17 km từ địa điểm hiện tại',
            features: ['Đưa đón sân bay', 'Dịch vụ trả phòng cấp tốc'],
            price: 1058201,
            originalPrice: 1599999,
            availability: 'Chỉ còn 3 phòng có giá này!',
        },
        {
            id: '2',
            image: 'https://bazantravel.com/cdn/medias/uploads/30/30866-khach-san-imperial-vung-tau-700x438.jpg',
            name: 'Smiley Apartment District 2',
            rating: 5,
            address: 'Quận 2, Thành phố Hồ Chí Minh',
            distance: '8.71 km từ địa điểm hiện tại',
            features: ['Nhà bếp mini', 'Sân thượng/Sân hiên', 'Đưa đón sân bay', 'Dịch vụ trả phòng cấp tốc'],
            price: 355555,
            originalPrice: 420000,
            availability: 'Chỉ còn 1 phòng có giá này!',
        },
        {
            id: '3',
            image: 'https://bazantravel.com/cdn/medias/uploads/30/30866-khach-san-imperial-vung-tau-700x438.jpg',
            name: 'Smiley Apartment District 2',
            rating: 3.5,
            address: 'Quận 2, Thành phố Hồ Chí Minh',
            distance: '8.71 km từ địa điểm hiện tại',
            features: ['Nhà bếp mini', 'Sân thượng/Sân hiên'],
            price: 355555,
            originalPrice: 420000,
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
                    <Ionicons name="chevron-back" size={25} color='#fff' />
                </TouchableOpacity>
                <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">{location}</Text>
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
                            <TouchableOpacity onPress={handleMoveScreen}>
                                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                                {renderStars(item.rating)}
                                <Text style={styles.address}>{item.address} | {item.distance}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.features}>
                                    {item.features.map((feature, index) => (
                                        <Text key={index} style={styles.feature}>{feature}</Text>
                                    ))}
                                </ScrollView>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.originalPrice}>{item.originalPrice.toLocaleString()} VNĐ</Text>
                                    <Text style={styles.price}>{item.price.toLocaleString()} VNĐ</Text>
                                </View>
                            </TouchableOpacity>
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
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    starContainer: {
        flexDirection: 'row',
        marginVertical: 5,
    },
    starFilled: {
        color: colors.starColor,
        marginRight: 2,
    },
    starEmpty: {
        color: colors.textSecondary,
        marginRight: 2,
    },
    address: {
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: 10,
    },
    features: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    feature: {
        backgroundColor: colors.borderColor,
        color: colors.textSecondary,
        fontSize: 12,
        padding: 5,
        borderRadius: 10,
        marginRight: 5,
        marginBottom: 5,
    },
    priceContainer: {
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    originalPrice: {
        fontSize: 14,
        color: colors.textSecondary,
        textDecorationLine: 'line-through',
        marginBottom: 8,
    },
});
