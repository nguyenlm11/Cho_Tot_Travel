import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ratingApi from '../services/api/ratingApi';

export default function ReviewScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { homestayId } = route.params;
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    useEffect(() => {
        fetchReviews();
    }, [homestayId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await ratingApi.getRatingsByHomeStay(homestayId);
            if (response.success) {
                setReviews(response.data.reviews);
                setTotalReviews(response.data.totalReviews);
                const total = response.data.reviews.reduce((sum, review) => sum + review.sumRate, 0);
                setAverageRating(total / response.data.reviews.length);
            } else {
                setError(response.error);
            }
        } catch (err) {
            setError('Không thể tải đánh giá. Vui lòng thử lại sau.');
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderRatingBar = ({ label, score }) => (
        <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>
                {label}: <Text style={styles.boldText}>{score.toFixed(1)}</Text>
            </Text>
            <LinearGradient
                colors={[colors.primary, colors.primary + '80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.ratingBar, { width: `${score * 20}%` }]}
            />
            <View style={styles.ratingBarBackground} />
        </View>
    );

    const calculateAverage = (reviews, field) => {
        if (!reviews.length) return 0;
        const total = reviews.reduce((sum, review) => sum + review[field], 0);
        return total / reviews.length;
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        // Adjust to Vietnam timezone (UTC+7)
        const vietnamDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));

        return `${vietnamDate.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })}, ${vietnamDate.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })}`;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchReviews}>
                    <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (reviews.length === 0) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.headerTop}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="chevron-back" size={28} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.headerTitle}>Xếp hạng & đánh giá</Text>
                                <Text style={styles.headerSubtitle}>Đánh giá từ khách hàng</Text>
                            </View>
                            <View style={styles.rightHeader} />
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <LinearGradient
                            colors={[colors.primary + '20', colors.primary + '10']}
                            style={styles.emptyIconGradient}
                        >
                            <Ionicons name="star-outline" size={60} color={colors.primary} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={28} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Xếp hạng & đánh giá</Text>
                            <Text style={styles.headerSubtitle}>Đánh giá từ khách hàng</Text>
                        </View>
                        <View style={styles.rightHeader} />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.travelokaSection}>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.totalReviews}>{totalReviews} đánh giá</Text>
                        <View style={styles.scoreBox}>
                            <Text style={styles.score}>{averageRating.toFixed(1)}</Text>
                            <Text style={styles.maxScore}>/5</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.ratingsContainer}>
                    <View style={styles.column}>
                        {[
                            { label: 'Vệ sinh', score: calculateAverage(reviews, 'cleaningRate') },
                            { label: 'Dịch vụ', score: calculateAverage(reviews, 'serviceRate') },
                        ].map((item, index) => (
                            <View key={`rating-1-${index}`}>
                                {renderRatingBar(item)}
                            </View>
                        ))}
                    </View>

                    <View style={styles.column}>
                        {[
                            { label: 'Tiện nghi', score: calculateAverage(reviews, 'facilityRate') },
                            { label: 'Tổng thể', score: averageRating },
                        ].map((item, index) => (
                            <View key={`rating-2-${index}`}>
                                {renderRatingBar(item)}
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>Đánh giá của khách hàng</Text>
                    <FlatList
                        data={reviews}
                        keyExtractor={(item) => item.ratingID.toString()}
                        scrollEnabled={false}
                        renderItem={({ item, index }) => (
                            <Animated.View
                                entering={FadeInDown.delay(index * 100)}
                                style={styles.reviewCard}
                            >
                                <View style={styles.reviewHeader}>
                                    <Image
                                        source={{ uri: 'https://th.bing.com/th/id/OIP.F977i9e7dMrznvOT8q8azgHaEf?w=1920&h=1164&rs=1&pid=ImgDetMain' }}
                                        style={styles.avatar}
                                    />
                                    <View style={styles.reviewInfo}>
                                        <View style={styles.nameContainer}>
                                            <Text style={styles.userName}>{item.username}</Text>
                                            <Text style={styles.reviewDate}>
                                                {formatDateTime(item.createdAt)}
                                            </Text>
                                        </View>
                                        <View style={styles.ratingContainer}>
                                            <Text style={styles.ratingScore}>{item.sumRate.toFixed(1)}</Text>
                                            <Text style={styles.ratingMax}>/5</Text>
                                        </View>
                                    </View>
                                </View>
                                {item.content && (
                                    <Text style={styles.commentText}>{item.content}</Text>
                                )}
                                {item.imageRatings && item.imageRatings.length > 0 && (
                                    <View style={styles.imageContainer}>
                                        {item.imageRatings.map((img) => (
                                            <Image
                                                key={img.imageRatingID}
                                                source={{ uri: img.image }}
                                                style={styles.reviewImage}
                                            />
                                        ))}
                                    </View>
                                )}
                            </Animated.View>
                        )}
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.footerButton}
                    onPress={() => navigation.goBack()}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primary + 'E6']}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.footerButtonText}>
                            Xem Thông tin homestay
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    headerContent: {
        width: '100%',
        alignItems: 'center'
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    backButton: { padding: 5 },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    rightHeader: { width: 28 },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    content: { flex: 1 },
    travelokaSection: {
        backgroundColor: '#E1F3D8',
        padding: 20,
    },
    scoreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalReviews: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    scoreBox: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    score: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
    },
    maxScore: {
        fontSize: 20,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    ratingsContainer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        margin: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    column: {
        flex: 1,
        marginHorizontal: 8,
    },
    ratingItem: { marginBottom: 15 },
    ratingLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    boldText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    ratingBar: {
        height: 6,
        borderRadius: 3,
        position: 'absolute',
        bottom: 0,
    },
    ratingBarBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        zIndex: -1,
    },
    reviewsSection: { padding: 15 },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    reviewInfo: {
        flex: 1,
        marginLeft: 12,
    },
    nameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    reviewDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 4,
    },
    ratingScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    ratingMax: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    commentText: {
        fontSize: 15,
        color: colors.textPrimary,
        marginTop: 12,
        lineHeight: 22,
    },
    imageContainer: {
        flexDirection: 'row',
        marginTop: 12,
    },
    reviewImage: {
        width: 100,
        height: 100,
        borderRadius: 5,
        marginRight: 8,
    },
    footer: {
        backgroundColor: '#fff',
        paddingTop: 10,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    footerButton: {
        marginHorizontal: 15,
        borderRadius: 25,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    footerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: colors.textPrimary,
        marginBottom: 20,
    },
    retryButton: {
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    retryText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    emptyIconContainer: { marginBottom: 20 },
    emptyIconGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 10,
        textAlign: 'center',
    }
});