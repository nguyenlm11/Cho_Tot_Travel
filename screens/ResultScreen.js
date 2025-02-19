import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import EditSearchModal from '../components/Modal/EditSearchModal';
import { ScrollView } from 'react-native-gesture-handler';
import { useSearch } from '../contexts/SearchContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ResultScreen() {
    const { currentSearch } = useSearch();

    const { location, checkInDate, checkOutDate, numberOfNights, rooms, adults, children, priceFrom, priceTo,
        selectedStar, latitude, longitude } = currentSearch;

    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

    const handleMoveScreen = () => {
        navigation.navigate('HomeStayDetail');
    }

    const mockData = [
        {
            id: '1',
            image: 'https://bazantravel.com/cdn/medias/uploads/30/30866-khach-san-imperial-vung-tau-700x438.jpg',
            name: 'Khách sạn Imperial Vũng Tàu',
            rating: 4.8,
            address: 'Thùy Vân, Bãi Sau, TP Vũng Tàu',
            distance: '7.17 km từ trung tâm',
            features: ['Đưa đón sân bay', 'Dịch vụ trả phòng cấp tốc', 'Hồ bơi', 'Nhà hàng'],
            price: 1058201,
            originalPrice: 1599999,
            availability: 'Chỉ còn 3 phòng trống!',
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
                    <Ionicons key={`full-${index}`} name="star" size={16} color="#FFD700" />
                ))}
                {hasHalfStar && <Ionicons name="star-half" size={16} color="#FFD700" />}
                {Array.from({ length: emptyStars }).map((_, index) => (
                    <Ionicons key={`empty-${index}`} name="star-outline" size={16} color="#888" />
                ))}
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
        );
    };

    const renderItem = ({ item, index }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100)}
            style={styles.cardContainer}
        >
            <TouchableOpacity onPress={handleMoveScreen} activeOpacity={0.9}>
                <View style={styles.card}>
                    <Image style={styles.image} source={{ uri: item.image }} />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent']}
                        style={styles.imageOverlay}
                    />
                    <View style={styles.favoriteButton}>
                        <Ionicons name="heart-outline" size={24} color="#fff" />
                    </View>
                    <View style={styles.info}>
                        <View style={styles.headerInfo}>
                            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                            {renderStars(item.rating)}
                        </View>

                        <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={16} color={colors.primary} />
                            <Text style={styles.address} numberOfLines={1}>
                                {item.address} • {item.distance}
                            </Text>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.featuresScroll}
                        >
                            {item.features.map((feature, index) => (
                                <View key={index} style={styles.featureTag}>
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.priceSection}>
                            <View>
                                <Text style={styles.originalPrice}>
                                    {item.originalPrice.toLocaleString()} ₫
                                </Text>
                                <Text style={styles.price}>
                                    {item.price.toLocaleString()} ₫
                                </Text>
                            </View>
                            <Text style={styles.availability}>{item.availability}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, colors.primary + 'E6']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={28} color='#fff' />
                </TouchableOpacity>
                <Text style={styles.headerText} numberOfLines={1}>
                    {currentSearch.location}
                </Text>
            </LinearGradient>

            <View style={styles.filterBar}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    <TouchableOpacity style={styles.filterChip}>
                        <Ionicons name="calendar-outline" size={20} color="#ffffff" />
                        <Text style={styles.filterText}>{currentSearch.checkInDate}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.filterChip}>
                        <Ionicons name="moon-outline" size={20} color="#ffffff" />
                        <Text style={styles.filterText}>{currentSearch.numberOfNights} đêm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.filterChip}>
                        <MaterialCommunityIcons name="door" size={20} color="#ffffff" />
                        <Text style={styles.filterText}>{currentSearch.rooms} phòng</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.filterChip}>
                        <Ionicons name="people-outline" size={20} color="#ffffff" />
                        <Text style={styles.filterText}>
                            {currentSearch.adults} người lớn
                            {currentSearch.children > 0 ? `, ${currentSearch.children} trẻ em` : ''}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditModalVisible(true)}
                >
                    <Ionicons name="options-outline" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={mockData}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

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
        backgroundColor: '#f8f9fa',
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
    headerText: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    filterBar: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
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
        padding: 15,
    },
    cardContainer: {
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: '100%',
        height: 200,
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    favoriteButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 8,
        borderRadius: 20,
    },
    info: {
        padding: 15,
    },
    headerInfo: {
        marginBottom: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    starContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        marginLeft: 5,
        color: '#666',
        fontSize: 14,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    address: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    featuresScroll: {
        marginBottom: 12,
    },
    featureTag: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginRight: 8,
    },
    featureText: {
        fontSize: 12,
        color: '#666',
    },
    priceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    availability: {
        fontSize: 12,
        color: '#ff4757',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
