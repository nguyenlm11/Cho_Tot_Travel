import React, { useState, useRef } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, FlatList, Dimensions, Platform, StatusBar, Animated as RNAnimated } from 'react-native';
import { FontAwesome6, MaterialIcons, Ionicons, MaterialCommunityIcons } from 'react-native-vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import ImageViewer from '../components/ImageViewer';

const { width } = Dimensions.get('window');

const hotelImages = [
    'https://bazantravel.com/cdn/medias/uploads/30/30866-khach-san-imperial-vung-tau-700x438.jpg',
    'https://pix5.agoda.net/hotelimages/161729/-1/c04493606f2d4d81bd0de472e27acd58.jpg',
    'https://halotravel.vn/wp-content/uploads/2020/10/khach-san-imperial-vung-tau-bbb-b-cover.jpg',
];

const homestayAmenities = [
    { id: '1', icon: 'wifi', name: 'Wifi', description: 'Tốc độ cao' },
    { id: '2', icon: 'air-conditioner', name: 'Điều hòa', description: 'Tất cả phòng' },
    { id: '3', icon: 'television', name: 'TV', description: 'Smart TV' },
    { id: '4', icon: 'fridge', name: 'Tủ lạnh', description: 'Mini bar' },
    { id: '5', icon: 'bed-king', name: 'Giường King', description: 'Êm ái' },
    { id: '6', icon: 'coffee-maker', name: 'Máy pha cà phê', description: 'Miễn phí' },
    { id: '7', icon: 'parking', name: 'Bãi đỗ xe', description: 'Riêng biệt' },
    { id: '8', icon: 'shower-head', name: 'Vòi sen', description: 'Áp lực mạnh' },
];

const homestayServices = [
    { id: '1', icon: 'food-variant', name: 'Dịch vụ ăn sáng', description: 'Buffet sáng', price: 100000 },
    { id: '2', icon: 'car', name: 'Dịch vụ đưa đón', description: 'Sân bay/Ga tàu', price: 200000 },
    { id: '3', icon: 'spa', name: 'Dịch vụ spa', description: 'Massage', price: 300000 },
    { id: '4', icon: 'bike', name: 'Thuê xe đạp', description: 'Theo ngày', price: 80000 },
    { id: '5', icon: 'chef-hat', name: 'Đầu bếp riêng', description: 'Theo bữa', price: 500000 },
    { id: '6', icon: 'baby-carriage', name: 'Dịch vụ trông trẻ', description: 'Theo giờ', price: 150000 },
    { id: '7', icon: 'washing-machine', name: 'Dịch vụ giặt ủi', description: 'Theo kg', price: 90000 },
    { id: '8', icon: 'silverware-fork-knife', name: 'Đặt tiệc riêng', description: 'Theo người', price: 250000 },
];

export default function HomeStayDetailScreen() {
    const navigation = useNavigation();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
    const [servicesExpanded, setServicesExpanded] = useState(false);
    const scrollY = useRef(new RNAnimated.Value(0)).current;

    const handleListRoom = () => {
        navigation.navigate('ListRoom');
    }

    const renderImageIndicator = () => (
        <View style={styles.imageIndicator}>
            {hotelImages.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.indicatorDot,
                        currentImageIndex === index && styles.indicatorDotActive
                    ]}
                />
            ))}
        </View>
    );

    // Render tiện nghi
    const renderAmenityItem = ({ item, index }) => (
        <Animated.View 
            entering={FadeInDown.delay(50 * index)}
            style={styles.amenityItem}
        >
            <LinearGradient
                colors={[colors.primary + '20', colors.primary + '10']}
                style={styles.amenityIconContainer}
            >
                <MaterialCommunityIcons name={item.icon} size={24} color={colors.primary} />
            </LinearGradient>
            <View style={styles.itemTextContainer}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
        </Animated.View>
    );

    // Render dịch vụ
    const renderServiceItem = ({ item, index }) => (
        <Animated.View 
            entering={FadeInDown.delay(50 * index)}
            style={styles.serviceItem}
        >
            <LinearGradient
                colors={[colors.secondary + '20', colors.secondary + '10']}
                style={styles.serviceIconContainer}
            >
                <MaterialCommunityIcons name={item.icon} size={24} color={colors.secondary} />
            </LinearGradient>
            <View style={styles.itemTextContainer}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
            <Text style={styles.servicePrice}>{item.price.toLocaleString()} đ</Text>
        </Animated.View>
    );

    // Header animation
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.container}>
            {/* Animated Header */}
            <RNAnimated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
                <BlurView intensity={80} tint="light" style={styles.blurHeader}>
                    <TouchableOpacity 
                        style={styles.headerBackButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>Smile Apartment District 2</Text>
                    <TouchableOpacity style={styles.headerShareButton}>
                        <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </BlurView>
            </RNAnimated.View>

            <RNAnimated.ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                onScroll={RNAnimated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                {/* Header Image Section */}
                <View style={styles.imageContainer}>
                    <FlatList
                        data={hotelImages}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                            setCurrentImageIndex(newIndex);
                        }}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                activeOpacity={0.9}
                                onPress={() => setImageViewerVisible(true)}
                            >
                                <Image source={{ uri: item }} style={styles.hotelImage} />
                            </TouchableOpacity>
                        )}
                        keyExtractor={(_, index) => index.toString()}
                    />
                    {renderImageIndicator()}
                    
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent']}
                        style={styles.headerGradient}
                    >
                        <TouchableOpacity 
                            style={styles.backButton} 
                            onPress={() => navigation.goBack()}
                        >
                            <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                                <Ionicons name="chevron-back" size={24} color="#fff" />
                            </BlurView>
                        </TouchableOpacity>
                        
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.actionButton}>
                                <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                                    <Ionicons name="heart-outline" size={24} color="#fff" />
                                </BlurView>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={[styles.actionButton, {marginLeft: 10}]}>
                                <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                                    <Ionicons name="share-outline" size={24} color="#fff" />
                                </BlurView>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Hotel Info Section */}
                <Animated.View 
                    entering={FadeInDown.delay(200)}
                    style={styles.infoSection}
                >
                    <Text style={styles.hotelName}>Smile Apartment District 2</Text>
                    <View style={styles.ratingContainer}>
                        <View style={styles.ratingStars}>
                            {[...Array(5)].map((_, i) => (
                                <MaterialIcons key={i} name="star" size={20} color="#FFD700" />
                            ))}
                        </View>
                        <Text style={styles.ratingText}>8.6 Ấn tượng</Text>
                        <View style={styles.reviewCount}>
                            <Text style={styles.reviewCountText}>142 đánh giá</Text>
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.locationButton}
                        onPress={() => navigation.navigate('MapScreen')}
                    >
                        <MaterialIcons name="location-on" size={20} color={colors.primary} />
                        <Text style={styles.address}>Quận 2, TP Hồ Chí Minh, Việt Nam</Text>
                        <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Amenities Section - Tiện nghi */}
                <Animated.View 
                    entering={FadeInDown.delay(300)}
                    style={styles.section}
                >
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <MaterialCommunityIcons name="home-outline" size={24} color={colors.primary} style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Tiện nghi</Text>
                            <View style={styles.includedBadge}>
                                <Text style={styles.includedText}>Miễn phí</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            style={styles.viewAllButton}
                            onPress={() => setAmenitiesExpanded(!amenitiesExpanded)}
                        >
                            <Text style={styles.viewAllText}>
                                {amenitiesExpanded ? 'Thu gọn' : 'Xem tất cả'}
                            </Text>
                            <FontAwesome6 
                                name={amenitiesExpanded ? 'angle-up' : 'angle-right'} 
                                size={16} 
                                color={colors.primary} 
                            />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.itemsContainer}>
                        <FlatList
                            data={amenitiesExpanded ? homestayAmenities : homestayAmenities.slice(0, 4)}
                            renderItem={renderAmenityItem}
                            keyExtractor={item => item.id}
                            numColumns={2}
                            scrollEnabled={false}
                            contentContainerStyle={styles.itemsGrid}
                        />
                    </View>
                    
                    {amenitiesExpanded && (
                        <View style={styles.sectionFooter}>
                            <Text style={styles.sectionNote}>
                                * Tất cả tiện nghi đều đã được bao gồm trong giá phòng
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* Services Section - Dịch vụ */}
                <Animated.View 
                    entering={FadeInDown.delay(400)}
                    style={styles.section}
                >
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <MaterialCommunityIcons name="room-service-outline" size={24} color={colors.secondary} style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Dịch vụ</Text>
                            <View style={styles.paidBadge}>
                                <Text style={styles.paidText}>Có phí</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            style={styles.viewAllButton}
                            onPress={() => setServicesExpanded(!servicesExpanded)}
                        >
                            <Text style={styles.viewAllText}>
                                {servicesExpanded ? 'Thu gọn' : 'Xem tất cả'}
                            </Text>
                            <FontAwesome6 
                                name={servicesExpanded ? 'angle-up' : 'angle-right'} 
                                size={16} 
                                color={colors.primary} 
                            />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.itemsContainer}>
                        <FlatList
                            data={servicesExpanded ? homestayServices : homestayServices.slice(0, 4)}
                            renderItem={renderServiceItem}
                            keyExtractor={item => item.id}
                            numColumns={2}
                            scrollEnabled={false}
                            contentContainerStyle={styles.itemsGrid}
                        />
                    </View>
                    
                    {servicesExpanded && (
                        <View style={styles.sectionFooter}>
                            <Text style={styles.sectionNote}>
                                * Giá dịch vụ có thể thay đổi, vui lòng liên hệ chủ nhà để biết thêm chi tiết
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* Reviews Section */}
                <Animated.View 
                    entering={FadeInDown.delay(500)}
                    style={styles.section}
                >
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <MaterialIcons name="star-rate" size={24} color="#FFD700" style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Đánh giá</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.viewAllButton}
                            onPress={() => navigation.navigate('ReviewScreen')}
                        >
                            <Text style={styles.viewAllText}>Xem tất cả</Text>
                            <FontAwesome6 name="angle-right" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.reviewsScroll}
                    >
                        <Animated.View 
                            entering={FadeInRight.delay(100)}
                            style={styles.reviewCard}
                        >
                            <View style={styles.reviewHeader}>
                                <Image 
                                    source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
                                    style={styles.reviewerAvatar}
                                />
                                <View>
                                    <Text style={styles.reviewerName}>Nguyen V.A.</Text>
                                    <Text style={styles.reviewDate}>Tháng 3, 2024</Text>
                                </View>
                            </View>
                            <Text style={styles.reviewText}>
                                Khách sạn mới và đẹp, gần biển, nhân viên nhiệt tình.
                            </Text>
                            <View style={styles.reviewRating}>
                                <MaterialIcons name="star" size={16} color="#FFD700" />
                                <Text style={styles.reviewScore}>8.8</Text>
                            </View>
                        </Animated.View>

                        <Animated.View 
                            entering={FadeInRight.delay(200)}
                            style={styles.reviewCard}
                        >
                            <View style={styles.reviewHeader}>
                                <Image 
                                    source={{ uri: 'https://randomuser.me/api/portraits/women/1.jpg' }}
                                    style={styles.reviewerAvatar}
                                />
                                <View>
                                    <Text style={styles.reviewerName}>Tran T.B.</Text>
                                    <Text style={styles.reviewDate}>Tháng 3, 2024</Text>
                                </View>
                            </View>
                            <Text style={styles.reviewText}>
                                Vị trí đẹp, view biển tuyệt vời, đồ ăn ngon.
                            </Text>
                            <View style={styles.reviewRating}>
                                <MaterialIcons name="star" size={16} color="#FFD700" />
                                <Text style={styles.reviewScore}>9.0</Text>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </Animated.View>

                {/* Description Section */}
                <Animated.View 
                    entering={FadeInDown.delay(600)}
                    style={styles.section}
                >
                    <View style={styles.sectionTitleContainer}>
                        <MaterialIcons name="info-outline" size={24} color={colors.textPrimary} style={styles.sectionIcon} />
                        <Text style={styles.sectionTitle}>Mô tả</Text>
                    </View>
                    <Text 
                        style={[styles.description, !expanded && styles.descriptionCollapsed]}
                        numberOfLines={expanded ? undefined : 3}
                    >
                        Khách sạn The IMPERIAL Vũng Tàu là khách sạn 5 sao đầu tiên tại khu vực Bãi Sau, một trong những bãi biển đẹp nhất của thành phố. Với lối kiến trúc Victoria cổ điển và quý phái, khách sạn nổi bật như một điểm nhấn thượng lưu giữa lòng phố biển, tôn vinh phong cách sống sang trọng và đẳng cấp.
                    </Text>
                    <TouchableOpacity 
                        style={styles.expandButton}
                        onPress={() => setExpanded(!expanded)}
                    >
                        <Text style={styles.expandButtonText}>
                            {expanded ? 'Thu gọn' : 'Xem thêm'}
                        </Text>
                        <Ionicons 
                            name={expanded ? 'chevron-up' : 'chevron-down'} 
                            size={16} 
                            color={colors.primary} 
                            style={{marginLeft: 5}}
                        />
                    </TouchableOpacity>
                </Animated.View>
                
                {/* Padding for bottom booking section */}
                <View style={{height: 100}} />
            </RNAnimated.ScrollView>

            {/* Bottom Booking Section */}
            <Animated.View 
                entering={FadeIn}
                style={styles.bookingSection}
            >
                <BlurView intensity={80} tint="light" style={styles.bookingBlur}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Giá từ</Text>
                        <Text style={styles.price}>576.000 ₫</Text>
                        <Text style={styles.priceNote}>Đã bao gồm thuế và phí</Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.bookButton}
                        onPress={handleListRoom}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.bookButtonText}>Chọn phòng</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </BlurView>
            </Animated.View>

            {/* Image Viewer Modal */}
            <ImageViewer
                visible={imageViewerVisible}
                images={hotelImages}
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
    scrollView: {
        flex: 1,
    },
    imageContainer: {
        height: 350,
        position: 'relative',
    },
    hotelImage: {
        width,
        height: 350,
        resizeMode: 'cover',
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
        paddingHorizontal: 20,
    },
    headerActions: {
        flexDirection: 'row',
    },
    actionButton: {
        marginLeft: 5,
    },
    blurButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageIndicator: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: 4,
    },
    indicatorDotActive: {
        backgroundColor: '#fff',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    animatedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    blurHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: Platform.OS === 'ios' ? 90 : StatusBar.currentHeight + 60,
        paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight,
        paddingHorizontal: 20,
    },
    headerBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    headerShareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoSection: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    hotelName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 10,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    ratingStars: {
        flexDirection: 'row',
        marginRight: 10,
    },
    ratingText: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    reviewCount: {
        marginLeft: 10,
        backgroundColor: colors.light,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    reviewCountText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.light,
        padding: 15,
        borderRadius: 15,
    },
    address: {
        flex: 1,
        fontSize: 14,
        color: colors.textPrimary,
        marginHorizontal: 8,
    },
    section: {
        padding: 20,
        borderTopWidth: 8,
        borderTopColor: '#f8f9fa',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
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
        color: colors.textPrimary,
    },
    includedBadge: {
        backgroundColor: colors.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginLeft: 10,
    },
    includedText: {
        fontSize: 11,
        color: colors.primary,
        fontWeight: '500',
    },
    paidBadge: {
        backgroundColor: colors.secondary + '20',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginLeft: 10,
    },
    paidText: {
        fontSize: 11,
        color: colors.secondary,
        fontWeight: '500',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewAllText: {
        color: colors.primary,
        marginRight: 5,
        fontSize: 14,
        fontWeight: '500',
    },
    itemsContainer: {
        marginTop: 10,
    },
    itemsGrid: {
        paddingVertical: 10,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 6,
    },
    itemDescription: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    amenityItem: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '10',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        marginHorizontal: '1%',
    },
    amenityIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    serviceItem: {
        width: '48%',
        flexDirection: 'column',
        backgroundColor: colors.secondary + '10',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        marginHorizontal: '1%',
        minHeight: 150,
    },
    serviceIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    servicePrice: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.secondary,
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    sectionFooter: {
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: colors.light,
    },
    sectionNote: {
        fontSize: 12,
        color: colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    reviewsScroll: {
        marginTop: 10,
    },
    reviewCard: {
        backgroundColor: colors.light,
        padding: 15,
        borderRadius: 20,
        marginRight: 15,
        width: 300,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    reviewDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    reviewText: {
        fontSize: 14,
        color: colors.textPrimary,
        lineHeight: 22,
        marginBottom: 10,
    },
    reviewRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewScore: {
        marginLeft: 5,
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    description: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 24,
        marginTop: 10,
    },
    descriptionCollapsed: {
        height: 72,
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    expandButtonText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    bookingSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    bookingBlur: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
    },
    priceNote: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    bookButton: {
        width: '45%',
        borderRadius: 25,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    bookButtonText: {
        color: colors.textThird,
        fontSize: 16,
        fontWeight: 'bold',
    },
});