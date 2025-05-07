import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import EditSearchModal from '../components/Modal/EditSearchModal';
import { ScrollView } from 'react-native-gesture-handler';
import { useSearch } from '../contexts/SearchContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import LoadingScreen from '../components/LoadingScreen';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

const ResultCard = React.memo(({ item, index, onPress }) => {
    const hasImages = item.imageHomeStays && Array.isArray(item.imageHomeStays) && item.imageHomeStays.length > 0;
    const imageUrl = hasImages && item.imageHomeStays[0]?.image
        ? item.imageHomeStays[0].image
        : 'https://via.placeholder.com/300?text=No+Image';

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100)}
            style={styles.cardContainer}
        >
            <View style={styles.card}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.cardImage}
                    />
                    {item.sumRate && (
                        <View style={styles.ratingBadge}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                                style={styles.ratingGradient}
                            >
                                <Ionicons name="star" size={14} color="#FFD700" />
                                <Text style={styles.ratingBadgeText}>{item.sumRate.toFixed(1)}</Text>
                            </LinearGradient>
                        </View>
                    )}
                    <View style={styles.imageOverlay}>
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.3)']}
                            style={styles.gradient}
                        />
                    </View>
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.areaContainer}>
                            <Ionicons name="map-outline" size={14} color={colors.primary} />
                            <Text style={styles.areaText}>{item.area}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={16} color={colors.primary} />
                        <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
                    </View>

                    <View style={styles.priceContainer}>
                        <View style={styles.priceInfo}>
                            <Text style={styles.priceLabel}>Giá từ</Text>
                            <Text style={styles.priceValue}>{item.defaultRentPrice?.toLocaleString() || '0'}đ</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={onPress}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                style={styles.viewButtonGradient}
                            >
                                <Text style={styles.viewButtonText}>Xem chi tiết</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
});

export default function ResultScreen() {
    const { currentSearch, searchResults } = useSearch();
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditModalVisible, setEditModalVisible] = useState(false);

    const validResults = searchResults?.filter(item =>
        item &&
        item.name &&
        item.imageHomeStays &&
        Array.isArray(item.imageHomeStays) &&
        item.imageHomeStays.length > 0
    ) || [];

    const renderItem = useCallback(({ item, index }) => (
        <ResultCard
            item={item}
            index={index}
            onPress={() => navigation.navigate('HomeStayDetail', { id: item.homeStayID })}
        />
    ), [navigation]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={[colors.primary, colors.primary + 'E6']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={28} color='#fff' />
                    </TouchableOpacity>
                    <Text style={styles.headerText} numberOfLines={1}>
                        {currentSearch?.location || 'Kết quả tìm kiếm'}
                    </Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setEditModalVisible(true)}
                    >
                        <Ionicons name="options-outline" size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    <TouchableOpacity style={styles.filterChip}>
                        <Ionicons name="calendar-outline" size={20} color="#ffffff" />
                        <Text style={styles.filterText}>
                            {currentSearch?.checkInDate || 'Ngày nhận phòng'} - {currentSearch?.checkOutDate || 'Ngày trả phòng'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.filterChip}>
                        <Ionicons name="people-outline" size={20} color="#ffffff" />
                        <Text style={styles.filterText}>
                            {currentSearch?.adults || 1} người lớn
                            {currentSearch?.children > 0 ? `, ${currentSearch.children} trẻ em` : ''}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </LinearGradient>

            {isLoading ? (
                <LoadingScreen 
                    message="Đang tìm kiếm homestay"
                    subMessage="Vui lòng đợi trong giây lát..."
                />
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
    },
    header: {
        paddingTop: isIOS ? 44 : StatusBar.currentHeight || 0,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerText: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        marginHorizontal: 12,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterScrollContent: {
        paddingRight: 16,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
    },
    filterText: {
        marginLeft: 8,
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    listContainer: {
        padding: 10,
    },
    cardContainer: {
        marginBottom: 20,
        marginHorizontal: 5,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    imageContainer: {
        position: 'relative',
        height: height * 0.25,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
    },
    ratingBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    ratingGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    ratingBadgeText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    cardContent: {
        padding: 16,
    },
    titleContainer: {
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
        lineHeight: 24,
    },
    areaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    areaText: {
        marginLeft: 4,
        fontSize: 13,
        color: colors.primary,
        fontWeight: '600',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        backgroundColor: '#f8f9fa',
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
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    priceInfo: {
        flex: 1,
        marginRight: 16,
    },
    priceLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.primary,
    },
    viewButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    viewButtonGradient: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
    },
    noResultsText: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.primary,
        marginTop: 24,
        marginBottom: 12,
        textAlign: 'center',
    },
    noResultsSubtext: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    retryButton: {
        width: width * 0.8,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    retryButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
