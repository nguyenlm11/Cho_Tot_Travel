import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, Dimensions, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { MaterialIcons, FontAwesome5, Ionicons, AntDesign } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import homeStayApi from '../services/api/homeStayApi';
import ImageViewer from '../components/ImageViewer';
import LoadingScreen from '../components/LoadingScreen';
import DropdownMenuTabs from '../components/DropdownMenuTabs';
import { useCart } from '../contexts/CartContext';

const { width, height } = Dimensions.get('window');

const palette = {
    primary: colors.primary,
    secondary: colors.secondary,
    background: '#f8f9fa',
    card: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.05)',
    text: { dark: '#2c3e50', medium: '#546e7a', light: '#78909c' },
    accent: '#00acc1',
};

export default function HomestayRentalDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { rentalId, homeStayId } = route.params;
    const [rental, setRental] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [showAllPrices, setShowAllPrices] = useState(false);
    const { clearCart } = useCart();

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
            rentalName: rental.name,
            price: price || defaultPricing?.rentPrice,
            rentWhole: true,
            services: rental.pricing?.map(p => ({
                id: p.id,
                name: p.description,
                price: p.rentPrice || p.unitPrice || 0,
                quantity: 1
            })) || []
        };
        console.log(rental.name);
        navigation.navigate('WholeHomestayCheckout', { bookingData });
    };

    const handleViewRoomTypes = () => {
        navigation.navigate('RoomType', {
            rentalId: rental.homeStayRentalID,
            homeStayId: homeStayId,
            rentalName: rental.name,
        });
    };

    const renderImageIndicator = (images) => (
        <View style={styles.imageIndicator}>
            {images.map((_, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.indicatorTouchable}
                    onPress={() => {
                        setCurrentImageIndex(index);
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

    if (loading) {
        return (
            <LoadingScreen
                message="Đang tải thông tin căn hộ"
                subMessage="Vui lòng đợi trong giây lát..."
            />
        );
    }

    if (error) {
        return (
            <Animated.View
                entering={ZoomIn.delay(200)}
                style={styles.errorContainer}
            >
                <Ionicons name="alert-circle-outline" size={80} color="#ff6b6b" />
                <Text style={styles.errorTitle}>Rất tiếc!</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchRentalDetail}
                >
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </Animated.View>
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
            <View style={styles.headerContainer}>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <View style={styles.blurButton}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.rightButtons}>
                        <DropdownMenuTabs iconStyle={styles.blurButton} />
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={styles.coverContainer}>
                    <Image
                        source={{ uri: images[currentImageIndex].uri }}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.5)']}
                        style={styles.imageGradient}
                    />
                    {renderImageIndicator(images)}
                    <View style={styles.imageCountBadge}>
                        <TouchableOpacity
                            onPress={() => setImageViewerVisible(true)}
                            style={styles.imageCountButton}
                        >
                            <Ionicons name="images-outline" size={18} color="#fff" />
                            <Text style={styles.imageCountText}>{currentImageIndex + 1}/{images.length}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    <Animated.View
                        entering={FadeInDown.delay(200)}
                        style={styles.titleSection}
                    >
                        <View style={styles.titleContainer}>
                            <View style={styles.titleWrapper}>
                                <Text style={styles.hotelName}>{rental.name}</Text>
                                <View style={styles.locationRow}>
                                    <Ionicons name="location-outline" size={18} color={palette.text.light} />
                                    <Text style={styles.locationText} numberOfLines={1}>
                                        {rental.homeStayName}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.typeBadgeContainer}>
                                <LinearGradient
                                    colors={[colors.primary, colors.secondary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.typeBadge}
                                >
                                    <FontAwesome5
                                        name={rental.rentWhole ? "home" : "door-open"}
                                        size={14}
                                        color="#fff"
                                    />
                                    <Text style={styles.typeBadgeText}>
                                        {rental.rentWhole ? "Nguyên căn" : "Từng phòng"}
                                    </Text>
                                </LinearGradient>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(300)}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <MaterialIcons name="hotel" size={22} color={palette.primary} style={styles.sectionIcon} />
                                <Text style={styles.sectionTitle}>Tiện nghi</Text>
                            </View>
                        </View>

                        <View style={styles.amenitiesGrid}>
                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <FontAwesome5 name="bed" size={18} color={palette.primary} />
                                </View>
                                <Text style={styles.amenityText}>{rental.numberBedRoom} phòng ngủ</Text>
                            </View>

                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <FontAwesome5 name="bath" size={18} color={palette.primary} />
                                </View>
                                <Text style={styles.amenityText}>{rental.numberBathRoom} phòng tắm</Text>
                            </View>

                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <MaterialIcons name="kitchen" size={20} color={palette.primary} />
                                </View>
                                <Text style={styles.amenityText}>{rental.numberKitchen} bếp</Text>
                            </View>

                            <View style={styles.amenityItem}>
                                <View style={styles.amenityIconContainer}>
                                    <MaterialIcons name="wifi" size={20} color={palette.primary} />
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
                                <MaterialIcons name="people" size={22} color={palette.primary} style={styles.sectionIcon} />
                                <Text style={styles.sectionTitle}>Sức chứa</Text>
                            </View>
                        </View>

                        <View style={styles.capacityContainer}>
                            <View style={styles.capacityCard}>
                                <View style={styles.capacityRow}>
                                    <View style={styles.capacityItem}>
                                        <MaterialIcons name="person" size={22} color={palette.primary} />
                                        <Text style={styles.capacityText}>{rental.maxAdults} người lớn</Text>
                                    </View>
                                    <View style={styles.capacityDivider} />
                                    <View style={styles.capacityItem}>
                                        <MaterialIcons name="child-care" size={22} color={palette.primary} />
                                        <Text style={styles.capacityText}>{rental.maxChildren} trẻ em</Text>
                                    </View>
                                </View>
                                <View style={styles.totalCapacity}>
                                    <MaterialIcons name="groups" size={22} color={palette.primary} />
                                    <Text style={styles.totalCapacityText}>Tối đa {rental.maxPeople} khách</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(400)}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <MaterialIcons name="description" size={22} color={palette.primary} style={styles.sectionIcon} />
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
                                    <AntDesign name={expanded ? "up" : "down"} size={14} color={palette.primary} style={{ marginLeft: 4 }} />
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
                                    <MaterialIcons name="attach-money" size={22} color={palette.primary} style={styles.sectionIcon} />
                                    <Text style={styles.sectionTitle}>Bảng giá</Text>
                                </View>
                            </View>

                            <View style={styles.pricingContainer}>
                                {rental.pricing
                                    .slice(0, showAllPrices ? rental.pricing.length : Math.min(3, rental.pricing.length))
                                    .map((pricing, index) => {
                                        const isWeekend = pricing.dayType === 1;
                                        const isHoliday = pricing.dayType === 2;
                                        return (
                                            <Animated.View
                                                key={index}
                                                entering={FadeInDown.delay(50 * index).springify()}
                                                style={styles.pricingCard}
                                            >
                                                <View style={[
                                                    styles.pricingCardBorder,
                                                    isWeekend ? styles.weekendBorder : styles.weekdayBorder
                                                ]} />

                                                <View style={styles.pricingCardContent}>
                                                    <View style={styles.pricingCardHeader}>
                                                        <Text style={[
                                                            styles.pricingTypeBadge,
                                                            isWeekend ? styles.weekendBadge : styles.weekdayBadge
                                                        ]}>
                                                            {isWeekend ? 'CUỐI TUẦN' : isHoliday ? 'NGÀY LỄ' : 'NGÀY THƯỜNG'}
                                                        </Text>
                                                        <Text style={styles.pricingTypeDescription}>
                                                            {isWeekend ? 'Thứ 7 & Chủ nhật' : isHoliday ? 'Ngày lễ' : 'Thứ 2 - Thứ 6'}
                                                        </Text>
                                                    </View>

                                                    <View style={styles.pricingPrice}>
                                                        <Text style={[
                                                            styles.pricingPriceAmount,
                                                            isWeekend ? styles.weekendPrice : styles.weekdayPrice
                                                        ]}>
                                                            {pricing.rentPrice?.toLocaleString('vi-VN')}
                                                            <Text style={styles.pricingPriceUnit}>₫</Text>
                                                        </Text>
                                                        <Text style={styles.pricingPricePerNight}>/đêm</Text>
                                                    </View>

                                                    <Text style={styles.pricingDescription} numberOfLines={2}>
                                                        {pricing.description}
                                                    </Text>
                                                </View>
                                            </Animated.View>
                                        );
                                    })}

                                {rental.pricing.length > 3 && (
                                    <TouchableOpacity
                                        style={styles.viewMoreButton}
                                        onPress={() => setShowAllPrices(!showAllPrices)}
                                    >
                                        <Text style={styles.viewMoreText}>
                                            {showAllPrices ? 'Thu gọn' : `Xem thêm ${rental.pricing.length - 3} bảng giá`}
                                        </Text>
                                        <MaterialIcons
                                            name={showAllPrices ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                                            size={20}
                                            color={palette.primary}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </Animated.View>
                    )}

                    <View style={styles.bottomSpacer} />
                </View>
            </ScrollView>

            <View style={styles.bookingSection}>
                <View style={styles.bookingBlur}>
                    {rental.rentWhole ? (
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>Giá mỗi đêm</Text>
                            <Text style={styles.price}>{price?.toLocaleString('vi-VN')} <Text style={styles.priceCurrency}>₫</Text></Text>
                            <Text style={styles.priceNote}>Đã bao gồm thuế và phí</Text>
                        </View>
                    ) : (
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>Xem các loại phòng</Text>
                            <Text style={styles.priceNote}>Chọn phòng phù hợp với nhu cầu của bạn</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={rental.rentWhole ? handleBookNow : handleViewRoomTypes}
                    >
                        <LinearGradient
                            colors={[palette.primary, palette.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.bookButtonText}>
                                {rental.rentWhole ? 'Đặt ngay' : 'Xem loại phòng'}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

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
        backgroundColor: palette.background,
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    },
    headerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    rightButtons: {
        flexDirection: 'row',
    },
    iconButton: {
        marginHorizontal: 6,
    },
    blurButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    scrollView: {
        flex: 1,
    },
    coverContainer: {
        height: height * 0.45,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    imageGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    imageIndicator: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 30,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    indicatorTouchable: {
        padding: 5,
    },
    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 4,
    },
    indicatorDotActive: {
        backgroundColor: '#fff',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    imageCountBadge: {
        position: 'absolute',
        right: 16,
        bottom: 20,
        overflow: 'hidden',
    },
    imageCountButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageCountText: {
        color: '#fff',
        marginLeft: 6,
        fontWeight: '600',
        fontSize: 14,
    },
    contentContainer: {
        backgroundColor: palette.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -24,
        paddingHorizontal: 20,
        paddingTop: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    titleSection: {
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleWrapper: {
        flex: 1,
        marginRight: 16,
    },
    hotelName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: palette.text.dark,
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 16,
        color: palette.text.medium,
        marginLeft: 6,
        fontWeight: '500',
    },
    typeBadgeContainer: {
        marginTop: 5,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        gap: 8,
    },
    typeBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionIcon: {
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: palette.text.dark,
        letterSpacing: -0.3,
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    amenityItem: {
        width: '48%',
        backgroundColor: palette.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.cardBorder,
    },
    amenityIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: palette.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    amenityText: {
        fontSize: 15,
        color: palette.text.dark,
        fontWeight: '500',
    },
    capacityContainer: {
        width: '100%',
    },
    capacityCard: {
        backgroundColor: palette.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.cardBorder,
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: palette.primary + '08',
        borderRadius: 20,
        minWidth: '40%',
        justifyContent: 'center',
    },
    capacityDivider: {
        height: '100%',
        width: 1,
        backgroundColor: palette.cardBorder,
    },
    capacityText: {
        fontSize: 15,
        color: palette.text.dark,
        fontWeight: '500',
    },
    totalCapacity: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: palette.cardBorder,
    },
    totalCapacityText: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.text.dark,
    },
    descriptionContainer: {
        backgroundColor: palette.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: palette.cardBorder,
    },
    descriptionText: {
        fontSize: 15,
        color: palette.text.medium,
        lineHeight: 24,
    },
    readMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: palette.primary + '10',
    },
    readMoreText: {
        color: palette.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    priceCardsContainer: {
        marginTop: 8,
    },
    serviceCard: {
        flexDirection: 'row',
        marginBottom: 12,
        backgroundColor: palette.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: palette.cardBorder,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    serviceContentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    serviceHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    priceNameContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.text.dark,
    },
    servicePrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: palette.primary,
    },
    pricingDetailsContainer: {
        marginTop: 6,
    },
    pricingDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    serviceDescription: {
        fontSize: 14,
        color: palette.text.medium,
        marginLeft: 8,
    },
    bottomSpacer: {
        height: 100,
    },
    bookingSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: palette.card,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 16,
        borderTopWidth: 1,
        borderColor: palette.cardBorder,
    },
    bookingBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 14,
        color: palette.text.light,
        fontWeight: '500',
    },
    price: {
        fontSize: 26,
        fontWeight: 'bold',
        color: palette.primary,
        marginTop: 4,
    },
    priceCurrency: {
        fontSize: 20,
    },
    priceNote: {
        fontSize: 12,
        color: palette.text.light,
        marginTop: 2,
    },
    bookButton: {
        borderRadius: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: palette.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 6,
    },
    bookButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    errorTitle: {
        marginTop: 10,
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    errorText: {
        marginTop: 8,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: palette.primary,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    pricingContainer: {
        marginTop: 8,
    },
    pricingCard: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    pricingCardBorder: {
        width: 5,
    },
    weekdayBorder: {
        backgroundColor: palette.primary,
    },
    weekendBorder: {
        backgroundColor: palette.secondary,
    },
    pricingCardContent: {
        flex: 1,
        padding: 16,
    },
    pricingCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    pricingTypeBadge: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
        marginRight: 8,
    },
    weekdayBadge: {
        color: palette.primary,
        backgroundColor: palette.primary + '15',
    },
    weekendBadge: {
        color: palette.secondary,
        backgroundColor: palette.secondary + '15',
    },
    pricingTypeDescription: {
        fontSize: 13,
        color: palette.text.medium,
    },
    pricingPrice: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    pricingPriceAmount: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    weekdayPrice: {
        color: palette.primary,
    },
    weekendPrice: {
        color: palette.secondary,
    },
    pricingPriceUnit: {
        fontSize: 20,
    },
    pricingPricePerNight: {
        fontSize: 14,
        color: palette.text.light,
        marginLeft: 4,
        marginBottom: 4,
    },
    pricingDescription: {
        fontSize: 14,
        color: palette.text.medium,
        marginBottom: 10,
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.primary + '10',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 8,
    },
    viewMoreText: {
        color: palette.primary,
        fontWeight: '600',
        fontSize: 15,
        marginRight: 6,
    },
});