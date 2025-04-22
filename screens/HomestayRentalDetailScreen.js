import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, ActivityIndicator, FlatList, Dimensions, Platform, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, } from 'react-native-reanimated';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/Colors';
import homeStayApi from '../services/api/homeStayApi';
import ImageViewer from '../components/ImageViewer';

const { width } = Dimensions.get('window');

export default function HomestayRentalDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { rentalId, homeStayId } = route.params;
    console.log('homeStayId', homeStayId);
    const [rental, setRental] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchRentalDetail();
    }, [rentalId]);

    const fetchRentalDetail = async () => {
        setLoading(true);
        try {
            const response = await homeStayApi.getHomeStayRentalDetail(rentalId);
            if (response && response.data) {
                setRental(response.data);
                setError(null);
            } else {
                setError('Không tìm thấy thông tin căn hộ');
            }
        } catch (err) {
            console.error('Error fetching rental detail:', err);
            setError('Không thể tải thông tin. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookNow = () => {
        if (!rental) return;

        const bookingData = {
            homeStayId: homeStayId,
            homeStayTypeID: rental.id || rental.homeStayRentalID,
            homeStayName: rental.name,
            homeStayImage: rental.images?.[0] || rental.imageHomeStayRentals?.[0]?.image,
            price: price || defaultPricing?.rentPrice || defaultPricing?.unitPrice || 0,
            rentWhole: true,
            services: rental.pricing?.map(p => ({
                id: p.id,
                name: p.description,
                price: p.rentPrice || p.unitPrice || 0,
                quantity: 1
            })) || []
        };

        console.log('Booking data:', bookingData);

        navigation.navigate('WholeHomestayCheckout', { bookingData });
    };

    const handleViewRoomTypes = () => {
        navigation.navigate('RoomType', {
            rentalId: rental.homeStayRentalID,
            homeStayId: homeStayId,
        });
    };

    const handleShare = async () => {
        if (!rental) return;
        try {
            await Share.share({
                message: `Xem Homestay "${rental.name}" tại ${rental.homeStayName}. Một địa điểm nghỉ dưỡng tuyệt vời!`,
                url: `https://yourappdomain.com/rental/${rentalId}`,
                title: rental.name,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const renderCoverImageItem = ({ item, index }) => (
        <TouchableOpacity
            style={styles.coverImageItem}
            onPress={() => {
                setCurrentImageIndex(index);
                setImageViewerVisible(true);
            }}
            activeOpacity={0.9}
        >
            <Image source={{ uri: item.uri }} style={styles.coverImage} resizeMode="cover" />
            <LinearGradient
                colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.3)']}
                style={styles.imageGradient}
            />
        </TouchableOpacity>
    );

    const renderImageIndicator = (images) => (
        <View style={styles.imageIndicator}>
            {images.map((_, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.indicatorTouchable}
                    onPress={() => {
                        setCurrentImageIndex(index);
                        flatListRef.current?.scrollToIndex({
                            index,
                            animated: true,
                            viewPosition: 0.5,
                        });
                    }}
                >
                    <View
                        style={[
                            styles.indicatorDot,
                            currentImageIndex === index && styles.indicatorDotActive
                        ]}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );

    const handleViewableItemsChanged = React.useCallback(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentImageIndex(viewableItems[0].index);
        }
    }, []);

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={60} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchRentalDetail}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const defaultPricing = rental?.pricing?.find(p => p.isDefault) || rental?.pricing?.[0];
    const price = defaultPricing?.rentPrice || defaultPricing?.unitPrice;
    const images = rental.imageHomeStayRentals.map(img => ({ uri: img.image }));
    if (images.length === 0) {
        images.push({ uri: 'https://res.cloudinary.com/dzjofylpf/image/upload/v1742915319/HomeStayImages/placeholder.jpg' });
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <BlurView intensity={70} tint="dark" style={styles.blurButton}>
                        <Icon name="chevron-back" size={24} color="#fff" />
                    </BlurView>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                >
                    <BlurView intensity={70} tint="dark" style={styles.blurButton}>
                        <Icon name="share-social-outline" size={22} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <View style={styles.coverImageContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        renderItem={renderCoverImageItem}
                        keyExtractor={(_, index) => `cover-${index}`}
                        onViewableItemsChanged={handleViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                    />
                    {renderImageIndicator(images)}
                </View>

                <View style={styles.contentContainer}>
                    <Animated.View
                        entering={FadeInDown.delay(200)}
                        style={styles.titleSection}
                    >
                        <View style={styles.nameContainer}>
                            <Text style={styles.name}>{rental.name}</Text>
                            <Text style={styles.homestayName}>{rental.homeStayName}</Text>
                        </View>

                        <View style={styles.typeBadgeContainer}>
                            <LinearGradient
                                colors={[colors.primary + '30', colors.primary + '15']}
                                style={styles.typeBadge}
                            >
                                <FontAwesome5
                                    name={rental.rentWhole ? "home" : "door-open"}
                                    size={14}
                                    color={colors.primary}
                                />
                                <Text style={styles.typeBadgeText}>
                                    {rental.rentWhole ? "Nguyên căn" : "Từng phòng"}
                                </Text>
                            </LinearGradient>
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(300)}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <Text style={styles.sectionTitle}>Tiện nghi</Text>
                            </View>
                        </View>

                        <View style={styles.amenitiesGrid}>
                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <FontAwesome5 name="bed" size={18} color={colors.primary} />
                                </View>
                                <Text style={styles.amenityText}>{rental.numberBedRoom} phòng ngủ</Text>
                            </View>

                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <FontAwesome5 name="bath" size={18} color={colors.primary} />
                                </View>
                                <Text style={styles.amenityText}>{rental.numberBathRoom} phòng tắm</Text>
                            </View>

                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <MaterialIcons name="kitchen" size={20} color={colors.primary} />
                                </View>
                                <Text style={styles.amenityText}>{rental.numberKitchen} bếp</Text>
                            </View>

                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <MaterialIcons name="wifi" size={20} color={colors.primary} />
                                </View>
                                <Text style={styles.amenityText}>{rental.numberWifi} wifi</Text>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(350)}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <Text style={styles.sectionTitle}>Sức chứa</Text>
                            </View>
                        </View>

                        <View style={styles.capacityContainer}>
                            <LinearGradient
                                colors={[colors.primary + '10', colors.primary + '05']}
                                style={styles.capacityCard}
                            >
                                <View style={styles.capacityRow}>
                                    <View style={styles.capacityItem}>
                                        <MaterialIcons name="person" size={22} color={colors.primary} />
                                        <Text style={styles.capacityText}>{rental.maxAdults} người lớn</Text>
                                    </View>
                                    <View style={styles.capacityDivider} />
                                    <View style={styles.capacityItem}>
                                        <MaterialIcons name="child-care" size={22} color={colors.primary} />
                                        <Text style={styles.capacityText}>{rental.maxChildren} trẻ em</Text>
                                    </View>
                                </View>
                                <View style={styles.totalCapacity}>
                                    <MaterialIcons name="groups" size={22} color={colors.primary} />
                                    <Text style={styles.totalCapacityText}>Tối đa {rental.maxPeople} khách</Text>
                                </View>
                            </LinearGradient>
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(400)}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <Text style={styles.sectionTitle}>Mô tả</Text>
                            </View>
                        </View>

                        <View style={styles.descriptionContainer}>
                            <Text
                                style={styles.descriptionText}
                                numberOfLines={expanded ? undefined : 4}
                            >
                                {rental.description}
                            </Text>

                            {rental.description.length > 150 && (
                                <TouchableOpacity
                                    style={styles.readMoreButton}
                                    onPress={() => setExpanded(!expanded)}
                                >
                                    <Text style={styles.readMoreText}>
                                        {expanded ? 'Thu gọn' : 'Xem thêm'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>

                    {rental.rentWhole && rental.pricing && rental.pricing.length > 0 && (
                        <Animated.View
                            entering={FadeInDown.delay(450)}
                            style={styles.section}
                        >
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleContainer}>
                                    <Text style={styles.sectionTitle}>Bảng giá</Text>
                                </View>
                            </View>

                            <View style={styles.priceCardsContainer}>
                                {rental.pricing.map((pricing, index) => (
                                    <Animated.View
                                        key={index}
                                        entering={FadeInDown.delay(50 * index)}
                                        style={styles.serviceCard}
                                    >
                                        <View style={styles.serviceContentContainer}>
                                            <View style={styles.serviceHeaderContainer}>
                                                <View style={styles.priceNameContainer}>
                                                    <Text style={styles.serviceName}>
                                                        {pricing.description}
                                                    </Text>
                                                </View>
                                                <Text style={styles.servicePrice}>
                                                    {pricing.rentPrice?.toLocaleString('vi-VN')}₫
                                                </Text>
                                            </View>
                                            <View style={styles.pricingDetailsContainer}>
                                                <View style={styles.pricingDetailItem}>
                                                    <FontAwesome5 name="dollar-sign" size={12} color="#666" />
                                                    <Text style={styles.serviceDescription}>
                                                        Giá đơn vị: {pricing.unitPrice?.toLocaleString('vi-VN')}₫
                                                    </Text>
                                                </View>
                                                {pricing.note && (
                                                    <View style={styles.pricingDetailItem}>
                                                        <FontAwesome5 name="info-circle" size={12} color="#666" />
                                                        <Text style={styles.serviceDescription}>
                                                            {pricing.note}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </Animated.View>
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    {/* Spacer to ensure content isn't hidden behind booking section */}
                    <View style={styles.bottomSpacer} />
                </View>
            </ScrollView>

            {/* Floating Booking Section */}
            <Animated.View
                entering={FadeIn}
                style={styles.bookingSection}
            >
                <BlurView intensity={80} tint="light" style={styles.bookingBlur}>
                    {rental.rentWhole ? (
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>Giá mỗi đêm</Text>
                            <Text style={styles.price}>{price?.toLocaleString('vi-VN')}₫</Text>
                            <Text style={styles.priceNote}>Đã bao gồm thuế và phí</Text>
                        </View>
                    ) : (
                        <View style={styles.priceContainer}></View>
                    )}

                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={rental.rentWhole ? handleBookNow : handleViewRoomTypes}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.bookButtonText}>
                                {rental.rentWhole ? 'Đặt ngay' : 'Xem loại phòng'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </BlurView>
            </Animated.View>

            {/* Image Viewer Modal */}
            <ImageViewer
                visible={imageViewerVisible}
                images={images}
                initialIndex={currentImageIndex}
                onClose={() => setImageViewerVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 48 : 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
    },
    shareButton: {
        width: 40,
        height: 40,
    },
    blurButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    scrollView: {
        flex: 1,
    },
    coverImageContainer: {
        height: 300,
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    coverImageItem: {
        width: width,
        height: 300,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    imageGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    imageIndicator: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    indicatorTouchable: {
        padding: 5,
    },
    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    indicatorDotActive: {
        width: 16,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    contentContainer: {
        padding: 16,
        paddingTop: 20,
    },
    titleSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    nameContainer: {
        flex: 1,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    homestayName: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    typeBadgeContainer: {
        marginLeft: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    typeBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    serviceCard: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    serviceContentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    serviceHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    servicePrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    serviceDescription: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    amenityItem: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: colors.primary + '08',
        borderRadius: 10,
        padding: 10,
    },
    amenityIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    amenityText: {
        fontSize: 15,
        color: '#555',
        fontWeight: '500',
    },
    capacityContainer: {
        width: '100%',
    },
    capacityCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    capacityRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    capacityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: colors.primary + '10',
        borderRadius: 20,
    },
    capacityDivider: {
        height: '100%',
        width: 1,
        backgroundColor: colors.primary + '30',
    },
    capacityText: {
        fontSize: 15,
        color: '#555',
        fontWeight: '500',
    },
    totalCapacity: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.primary + '20',
    },
    totalCapacityText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#444',
    },
    descriptionContainer: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderColor: 'rgba(0,0,0,0.05)',
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#555',
    },
    readMoreButton: {
        marginTop: 8,
        alignSelf: 'flex-start',
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    readMoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    bookingSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
    bookingBlur: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        marginVertical: 2,
    },
    priceNote: {
        fontSize: 12,
        color: '#888',
    },
    bookButton: {
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    gradientButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.primary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: '#ff6b6b',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 90,
    },
    priceCardsContainer: {
        marginTop: 8,
    },
    priceNameContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    pricingDetailsContainer: {
        marginTop: 4,
    },
    pricingDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
});