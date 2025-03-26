import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import EditSearchModal from '../components/Modal/EditSearchModal';
import { ScrollView } from 'react-native-gesture-handler';
import { useSearch } from '../contexts/SearchContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ResultScreen() {
    const { currentSearch, searchResults } = useSearch();
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

    const handleMoveScreen = (homestayId) => {
        navigation.navigate('HomeStayDetail', { id: homestayId });
    }

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

    const renderItem = ({ item, index }) => {
        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100)}
                style={styles.cardContainer}
            >
                <TouchableOpacity onPress={() => handleMoveScreen(item.homeStayID)} activeOpacity={0.9}>
                    <View style={styles.card}>
                        <Image
                            style={styles.image}
                            source={{
                                uri: 'https://bazantravel.com/cdn/medias/uploads/30/30866-khach-san-imperial-vung-tau-700x438.jpg'
                            }}
                        />
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
                                {renderStars(4.5)}
                            </View>

                            <View style={styles.locationContainer}>
                                <Ionicons name="location-outline" size={16} color={colors.primary} />
                                <Text style={styles.address} numberOfLines={2}>
                                    {item.address}
                                </Text>
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.featuresScroll}
                            >
                                <View style={styles.featureTag}>
                                    <Text style={styles.featureText}>{item.area || 'Khu vực đẹp'}</Text>
                                </View>
                                <View style={styles.featureTag}>
                                    <Text style={styles.featureText}>
                                        {item.typeOfRental === 1 ? 'Cho thuê theo ngày' : 'Cho thuê theo giờ'}
                                    </Text>
                                </View>
                                <View style={styles.featureTag}>
                                    <Text style={styles.featureText}>Wifi miễn phí</Text>
                                </View>
                            </ScrollView>

                            <View style={styles.priceSection}>
                                <View>
                                    <Text style={styles.originalPrice}>
                                        1.200.000 ₫
                                    </Text>
                                    <Text style={styles.price}>
                                        1.000.000 ₫
                                    </Text>
                                </View>
                                <Text style={styles.availability}>
                                    {item.status === 1 ? 'Có sẵn' : 'Hết phòng'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const validResults = Array.isArray(searchResults) ? searchResults : [];

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
                    {currentSearch?.location || 'Kết quả tìm kiếm'}
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
                        <Text style={styles.filterText}>{currentSearch?.checkInDate || 'Ngày nhận phòng'} - {currentSearch?.checkOutDate || 'Ngày trả phòng'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.filterChip}>
                        <Ionicons name="people-outline" size={20} color="#ffffff" />
                        <Text style={styles.filterText}>
                            {currentSearch?.adults || 1} người lớn
                            {currentSearch?.children > 0 ? `, ${currentSearch.children} trẻ em` : ''}
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
            ) : validResults.length > 0 ? (
                <FlatList
                    data={validResults}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.homeStayID?.toString() || Math.random().toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.noResultsContainer}>
                    <Ionicons name="search-outline" size={60} color={colors.primary} />
                    <Text style={styles.noResultsText}>Không tìm thấy kết quả phù hợp</Text>
                    <Text style={styles.noResultsSubtext}>Vui lòng thử lại với tiêu chí tìm kiếm khác</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => navigation.goBack()}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={styles.retryButtonGradient}
                        >
                            <Text style={styles.retryButtonText}>Tìm kiếm lại</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            <EditSearchModal
                visible={isEditModalVisible}
                onClose={() => setEditModalVisible(false)}
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
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noResultsText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    noResultsSubtext: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    retryButton: {
        width: '80%',
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 10,
    },
    retryButtonGradient: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
