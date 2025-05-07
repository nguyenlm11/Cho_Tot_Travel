import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Platform, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ratingApi from '../services/api/ratingApi';
import LoadingScreen from '../components/LoadingScreen';

const STATUSBAR_HEIGHT = StatusBar.currentHeight || (Platform.OS === 'ios' ? 44 : 0);

const palette = {
    primary: colors.primary,
    secondary: colors.secondary,
    background: '#ffffff',
    card: '#f8f9fa',
    cardBorder: '#eaeaea',
    text: { dark: '#2c3e50', medium: '#546e7a', light: '#78909c' },
    accent: '#00acc1',
    success: '#4caf50',
    warning: '#ffc107',
    danger: '#f44336',
};

export default function ReviewScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { homestayId } = route.params;
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [ratingStats, setRatingStats] = useState({
        cleanliness: 0,
        service: 0,
        facility: 0
    });
    const [filterActive, setFilterActive] = useState('all');

    useEffect(() => {
        fetchReviews();
    }, [homestayId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await ratingApi.getRatingsByHomeStay(homestayId);
            if (response.success) {
                const { reviews, totalReviews } = response.data;
                setReviews(reviews);
                setTotalReviews(totalReviews);

                if (reviews.length > 0) {
                    const total = reviews.reduce((sum, review) => sum + review.sumRate, 0);
                    setAverageRating(total / reviews.length);

                    setRatingStats({
                        cleanliness: calculateAverage(reviews, 'cleaningRate'),
                        service: calculateAverage(reviews, 'serviceRate'),
                        facility: calculateAverage(reviews, 'facilityRate')
                    });
                }
            } else {
                setError(response.error || 'Đã xảy ra lỗi khi tải dữ liệu');
            }
        } catch (err) {
            setError('Không thể tải đánh giá. Vui lòng thử lại sau.');
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateAverage = (reviews, field) => {
        if (!reviews.length) return 0;
        const total = reviews.reduce((sum, review) => sum + (review[field] || 0), 0);
        return total / reviews.length;
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        const vietnamDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
        return vietnamDate.toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });
    };

    const renderStars = (rating) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => {
                    if (star <= Math.floor(rating)) {
                        return <FontAwesome key={star} name="star" size={16} color="#FFD700" style={{ marginRight: 2 }} />;
                    } else if (star - 0.5 <= rating) {
                        return <FontAwesome key={star} name="star-half-o" size={16} color="#FFD700" style={{ marginRight: 2 }} />;
                    } else {
                        return <FontAwesome key={star} name="star-o" size={16} color="#FFD700" style={{ marginRight: 2 }} />;
                    }
                })}
            </View>
        );
    };

    const renderRatingBar = ({ label, score, icon }) => (
        <View style={styles.ratingItem}>
            <View style={styles.ratingLabelContainer}>
                <MaterialIcons name={icon} size={16} color={palette.primary} style={styles.ratingIcon} />
                <Text style={styles.ratingLabel}>{label}</Text>
                <Text style={styles.ratingScore}>{score.toFixed(1)}</Text>
            </View>
            <View style={styles.ratingBarContainer}>
                <LinearGradient
                    colors={[palette.primary, palette.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.ratingBar, { width: `${score * 20}%` }]}
                />
            </View>
        </View>
    );

    const filterReviews = (filter) => {
        setFilterActive(filter);
    };

    const getFilteredReviews = () => {
        if (filterActive === 'all') {
            return reviews;
        } else if (filterActive === '5') {
            return reviews.filter(review => Math.floor(review.sumRate) === 5);
        } else if (filterActive === '4') {
            return reviews.filter(review => Math.floor(review.sumRate) === 4);
        } else if (filterActive === '3') {
            return reviews.filter(review => Math.floor(review.sumRate) === 3);
        } else if (filterActive === 'photos') {
            return reviews.filter(review => review.imageRatings && review.imageRatings.length > 0);
        }
        return reviews;
    };

    if (loading) {
        return (
            <LoadingScreen
                message="Đang tải đánh giá"
                subMessage="Vui lòng đợi trong giây lát..."
            />
        );
    }

    if (error) {
        return (
            <>
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={26} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Đánh giá</Text>
                            <Text style={styles.headerSubtitle}>Xem đánh giá của khách hàng</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>

                <View style={styles.errorContainer}>
                    <View style={styles.errorIconContainer}>
                        <LinearGradient
                            colors={[palette.danger + '20', palette.danger + '05']}
                            style={styles.errorIconGradient}
                        >
                            <Ionicons name="alert-circle-outline" size={60} color={palette.danger} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.errorTitle}>Đã xảy ra lỗi</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchReviews}>
                        <LinearGradient
                            colors={[palette.primary, palette.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.retryGradient}
                        >
                            <Text style={styles.retryText}>Thử lại</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </>
        );
    }

    if (reviews.length === 0) {
        return (
            <>
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={26} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Đánh giá</Text>
                            <Text style={styles.headerSubtitle}>Xem đánh giá của khách hàng</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>

                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <LinearGradient
                            colors={[palette.primary + '20', palette.primary + '05']}
                            style={styles.emptyIconGradient}
                        >
                            <Ionicons name="star-outline" size={60} color={palette.primary} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
                    <Text style={styles.emptySubtitle}>Homestay này chưa có đánh giá từ khách hàng</Text>

                    <TouchableOpacity
                        style={styles.backHomeButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backHomeText}>Quay lại thông tin Homestay</Text>
                    </TouchableOpacity>
                </View>
            </>
        );
    }

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <View style={styles.container}>
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="chevron-back" size={26} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Đánh giá</Text>
                            <Text style={styles.headerSubtitle}>Xem đánh giá của khách hàng</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.ratingOverview}>
                        <View style={styles.ratingScoreSection}>
                            <View style={styles.scoreCircle}>
                                <Text style={styles.scoreValue}>{averageRating.toFixed(1)}</Text>
                                <Text style={styles.scoreMax}>/5</Text>
                            </View>

                            <View style={styles.scoreDetails}>
                                <Text style={styles.totalReviewsText}>{totalReviews} đánh giá</Text>
                                {renderStars(averageRating)}
                            </View>
                        </View>

                        <View style={styles.ratingCategories}>
                            {renderRatingBar({
                                label: 'Vệ sinh',
                                score: ratingStats.cleanliness,
                                icon: 'cleaning-services'
                            })}
                            {renderRatingBar({
                                label: 'Dịch vụ',
                                score: ratingStats.service,
                                icon: 'room-service'
                            })}
                            {renderRatingBar({
                                label: 'Tiện nghi',
                                score: ratingStats.facility,
                                icon: 'hotel'
                            })}
                        </View>
                    </View>

                    <View style={styles.filterSection}>
                        <Text style={styles.sectionTitle}>Đánh giá từ khách hàng</Text>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterScrollContent}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    filterActive === 'all' && styles.filterButtonActive
                                ]}
                                onPress={() => filterReviews('all')}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    filterActive === 'all' && styles.filterButtonTextActive
                                ]}>Tất cả</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    filterActive === '5' && styles.filterButtonActive
                                ]}
                                onPress={() => filterReviews('5')}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    filterActive === '5' && styles.filterButtonTextActive
                                ]}>5 sao</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    filterActive === '4' && styles.filterButtonActive
                                ]}
                                onPress={() => filterReviews('4')}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    filterActive === '4' && styles.filterButtonTextActive
                                ]}>4 sao</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    filterActive === '3' && styles.filterButtonActive
                                ]}
                                onPress={() => filterReviews('3')}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    filterActive === '3' && styles.filterButtonTextActive
                                ]}>3 sao</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    filterActive === 'photos' && styles.filterButtonActive
                                ]}
                                onPress={() => filterReviews('photos')}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    filterActive === 'photos' && styles.filterButtonTextActive
                                ]}>Có hình ảnh</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    <View style={styles.reviewsSection}>
                        <FlatList
                            data={getFilteredReviews()}
                            keyExtractor={(item) => item.ratingID.toString()}
                            scrollEnabled={false}
                            renderItem={({ item, index }) => (
                                <Animated.View
                                    entering={FadeInDown.delay(index * 100)}
                                    style={styles.reviewCard}
                                >
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewAvatar}>
                                            <Text style={styles.avatarText}>
                                                {item.username?.charAt(0)?.toUpperCase() || 'U'}
                                            </Text>
                                        </View>
                                        <View style={styles.reviewInfo}>
                                            <Text style={styles.userName}>{item.username}</Text>
                                            <Text style={styles.reviewDate}>
                                                {formatDateTime(item.createdAt)}
                                            </Text>
                                        </View>
                                        <View style={styles.reviewRating}>
                                            <Text style={styles.ratingValue}>{item.sumRate.toFixed(1)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.reviewDetails}>
                                        <View style={styles.detailsRow}>
                                            <View style={styles.detailItem}>
                                                <Text style={styles.detailLabel}>Vệ sinh:</Text>
                                                <Text style={styles.detailValue}>{item.cleaningRate}</Text>
                                            </View>
                                            <View style={styles.detailItem}>
                                                <Text style={styles.detailLabel}>Dịch vụ:</Text>
                                                <Text style={styles.detailValue}>{item.serviceRate}</Text>
                                            </View>
                                            <View style={styles.detailItem}>
                                                <Text style={styles.detailLabel}>Tiện nghi:</Text>
                                                <Text style={styles.detailValue}>{item.facilityRate}</Text>
                                            </View>
                                        </View>

                                        {renderStars(item.sumRate)}
                                    </View>

                                    {item.content && (
                                        <View style={styles.reviewContent}>
                                            <Text style={styles.commentText}>{item.content}</Text>
                                        </View>
                                    )}

                                    {item.imageRatings && item.imageRatings.length > 0 && (
                                        <View style={styles.imageContainer}>
                                            {item.imageRatings.map((img) => (
                                                <TouchableOpacity key={img.imageRatingID}>
                                                    <Image
                                                        source={{ uri: img.image }}
                                                        style={styles.reviewImage}
                                                    />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </Animated.View>
                            )}
                        />
                        {getFilteredReviews().length === 0 && (
                            <View style={styles.noFilterResultsContainer}>
                                <Ionicons name="search-outline" size={40} color={palette.text.light} />
                                <Text style={styles.noFilterResultsText}>Không tìm thấy đánh giá phù hợp</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.bottomSpace} />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.footerButton}
                        onPress={() => navigation.goBack()}
                    >
                        <LinearGradient
                            colors={[palette.primary, palette.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.footerButtonText}>
                                Quay lại thông tin homestay
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    content: {
        flex: 1,
    },
    ratingOverview: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: palette.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: palette.cardBorder,
    },
    ratingScoreSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: palette.cardBorder,
    },
    scoreCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: palette.primary,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    scoreMax: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        alignSelf: 'flex-end',
        marginBottom: 4,
    },
    scoreDetails: {
        marginLeft: 16,
    },
    totalReviewsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: palette.text.dark,
        marginBottom: 6,
    },
    starsContainer: {
        flexDirection: 'row',
    },
    ratingCategories: {
        marginTop: 16,
    },
    ratingItem: {
        marginBottom: 16,
    },
    ratingLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingIcon: {
        marginRight: 6,
    },
    ratingLabel: {
        flex: 1,
        fontSize: 14,
        color: palette.text.medium,
    },
    ratingScore: {
        fontSize: 16,
        fontWeight: 'bold',
        color: palette.text.dark,
    },
    ratingBarContainer: {
        height: 6,
        width: '100%',
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
    },
    ratingBar: {
        height: 6,
        borderRadius: 3,
    },
    filterSection: {
        marginTop: 24,
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: palette.text.dark,
        marginBottom: 16,
    },
    filterScrollContent: {
        paddingBottom: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: palette.card,
        marginRight: 8,
        borderWidth: 1,
        borderColor: palette.cardBorder,
    },
    filterButtonActive: {
        backgroundColor: palette.primary,
        borderColor: palette.primary,
    },
    filterButtonText: {
        fontSize: 14,
        color: palette.text.medium,
    },
    filterButtonTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    reviewsSection: {
        marginTop: 16,
        marginHorizontal: 16,
    },
    reviewCard: {
        backgroundColor: palette.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: palette.cardBorder,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    reviewInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.text.dark,
        marginBottom: 2,
    },
    reviewDate: {
        fontSize: 12,
        color: palette.text.light,
    },
    reviewRating: {
        backgroundColor: palette.primary + '15',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    ratingValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: palette.primary,
    },
    reviewDetails: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: palette.cardBorder,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 13,
        color: palette.text.light,
        marginRight: 4,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: palette.text.dark,
    },
    reviewContent: {
        marginTop: 12,
        padding: 12,
        backgroundColor: palette.card + '80',
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: palette.primary + '40',
    },
    commentText: {
        fontSize: 14,
        color: palette.text.medium,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 16,
    },
    reviewImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        margin: 4,
    },
    bottomSpace: {
        height: 80,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: palette.background,
        borderTopWidth: 1,
        borderTopColor: palette.cardBorder,
        paddingTop: 12,
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    footerButton: {
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    gradientButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    footerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorIconContainer: {
        marginBottom: 24,
    },
    errorIconGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: palette.text.dark,
        marginBottom: 12,
    },
    errorText: {
        color: palette.text.medium,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    retryButton: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    retryGradient: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    retryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyIconContainer: {
        marginBottom: 24,
    },
    emptyIconGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: palette.text.dark,
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 16,
        color: palette.text.medium,
        textAlign: 'center',
        marginBottom: 32,
    },
    backHomeButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        backgroundColor: palette.primary,
    },
    backHomeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noFilterResultsContainer: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.cardBorder,
    },
    noFilterResultsText: {
        fontSize: 16,
        color: palette.text.medium,
        marginTop: 12,
        textAlign: 'center',
    },
});