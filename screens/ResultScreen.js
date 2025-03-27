import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import EditSearchModal from '../components/Modal/EditSearchModal';
import { ScrollView } from 'react-native-gesture-handler';
import { useSearch } from '../contexts/SearchContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, } from 'react-native-reanimated';

const ResultCard = React.memo(({ item, index, onPress }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50);
    const hasImages = item.imageHomeStays && Array.isArray(item.imageHomeStays) && item.imageHomeStays.length > 0;
    const imageUrl = hasImages && item.imageHomeStays[0]?.image
        ? item.imageHomeStays[0].image
        : 'https://via.placeholder.com/300?text=No+Image';

    React.useEffect(() => {
        opacity.value = withSpring(1, { damping: 20 });
        translateY.value = withSpring(0, { damping: 20 });
    }, []);

    const handlePressIn = () => {
        scale.value = withSpring(0.97, { damping: 12 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 12 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value }
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[styles.cardContainer, animatedStyle]}
        >
            <TouchableOpacity
                onPress={() => onPress(item.homeStayID)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                <View style={styles.card}>
                    <View style={styles.imageContainer}>
                        <Image
                            style={styles.image}
                            source={{ uri: imageUrl }}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.5)']}
                            style={styles.imageOverlay}
                        />
                        {item.status === 1 && (
                            <View style={styles.statusBadge}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Đang hoạt động</Text>
                            </View>
                        )}
                        <View style={styles.priceTag}>
                            <LinearGradient
                                colors={[colors.primary, colors.primary + 'AA']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.priceGradient}
                            >
                                <Text style={styles.priceTagText}>Liên hệ để biết giá</Text>
                            </LinearGradient>
                        </View>
                    </View>

                    <View style={styles.info}>
                        <View style={styles.headerInfo}>
                            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.starContainer}>
                                {[1, 2, 3, 4].map((_, idx) => (
                                    <Ionicons key={idx} name="star" size={16} color="#FFD700" />
                                ))}
                                <Ionicons name="star-half" size={16} color="#FFD700" />
                                <Text style={styles.ratingText}>4.5</Text>
                            </View>
                        </View>

                        <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={16} color={colors.primary} />
                            <Text style={styles.address} numberOfLines={2}>
                                {item.address}
                            </Text>
                        </View>

                        <View style={styles.tagsContainer}>
                            <View style={styles.featureTag}>
                                <Ionicons name="location" size={14} color={colors.primary} />
                                <Text style={styles.featureText}>{item.area}</Text>
                            </View>
                            <View style={styles.featureTag}>
                                <Ionicons
                                    name={item.typeOfRental === 1 ? "home" : "time"}
                                    size={14}
                                    color={colors.primary}
                                />
                                <Text style={styles.featureText}>
                                    {item.typeOfRental === 1 ? 'Cho thuê theo ngày' : 'Cho thuê theo giờ'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.bookButton}
                            onPress={() => onPress(item.homeStayID)}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.primary + 'D0']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.bookButtonGradient}
                            >
                                <Text style={styles.bookButtonText}>Xem chi tiết</Text>
                                <Ionicons name="arrow-forward" size={16} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

export default function ResultScreen() {
    const { currentSearch, searchResults } = useSearch();
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

    const handleMoveScreen = useCallback((homestayId) => {
        navigation.navigate('HomeStayDetail', { id: homestayId });
    }, [navigation]);

    const renderItem = useCallback(({ item, index }) => (
        <ResultCard
            item={item}
            index={index}
            onPress={handleMoveScreen}
        />
    ), [handleMoveScreen]);

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
        marginBottom: 24,
        marginHorizontal: 4,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 16,
        shadowColor: colors.primary + '90',
        shadowOffset: { width: 0, height: 9 },
        shadowOpacity: 1,
        shadowRadius: 20,
    },
    imageContainer: {
        position: 'relative',
        height: 220,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '600',
    },
    priceTag: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        overflow: 'hidden',
        borderRadius: 20,
    },
    priceGradient: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    priceTagText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    info: {
        padding: 20,
    },
    headerInfo: {
        marginBottom: 12,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    starContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        marginLeft: 5,
        color: '#666',
        fontSize: 14,
        fontWeight: 'bold',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 12,
    },
    address: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        lineHeight: 20,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    featureTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '15',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    featureText: {
        fontSize: 13,
        color: colors.primary,
        marginLeft: 6,
        fontWeight: '500',
    },
    bookButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    bookButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
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
