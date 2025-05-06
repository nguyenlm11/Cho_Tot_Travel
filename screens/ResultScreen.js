import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import EditSearchModal from '../components/Modal/EditSearchModal';
import { ScrollView } from 'react-native-gesture-handler';
import { useSearch } from '../contexts/SearchContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.cardImage}
                />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.ratingText}>{item.rating || 'Chưa có đánh giá'}</Text>
                        </View>
                    </View>

                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={16} color={colors.primary} />
                        <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
                    </View>

                    <View style={styles.priceContainer}>
                        <View>
                            <Text style={styles.priceLabel}>Giá từ</Text>
                            <Text style={styles.priceValue}>{item.price?.toLocaleString() || '0'}đ</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={onPress}
                        >
                            <Text style={styles.viewButtonText}>Xem chi tiết</Text>
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
    },
    header: {
        height: 60 + (isIOS ? 44 : StatusBar.currentHeight || 0),
        paddingTop: isIOS ? 44 : StatusBar.currentHeight || 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    backButton: {
        marginRight: 15,
    },
    headerText: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    filterBar: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: colors.primary,
    },
    filterScrollContent: {
        flexGrow: 1,
        paddingRight: 10,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 10,
    },
    filterText: {
        marginLeft: 5,
        color: '#fff',
        fontSize: 14,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 10,
        // paddingBottom: 40,
    },
    cardContainer: {
        marginBottom: 15,
        marginHorizontal: 5,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardImage: {
        width: '100%',
        height: height * 0.25,
        resizeMode: 'cover',
    },
    cardContent: {
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cardTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginRight: 10,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 8,
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
        marginTop: 8,
    },
    priceLabel: {
        fontSize: 12,
        color: '#666',
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.primary,
    },
    viewButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noResultsText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.primary,
        marginTop: 20,
        marginBottom: 10,
    },
    noResultsSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        width: width * 0.8,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
    },
    retryButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
