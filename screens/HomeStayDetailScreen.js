import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import { FontAwesome6, MaterialIcons, Ionicons } from 'react-native-vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const hotelImages = [
    'https://bazantravel.com/cdn/medias/uploads/30/30866-khach-san-imperial-vung-tau-700x438.jpg',
    'https://pix5.agoda.net/hotelimages/161729/-1/c04493606f2d4d81bd0de472e27acd58.jpg',
    'https://halotravel.vn/wp-content/uploads/2020/10/khach-san-imperial-vung-tau-bbb-b-cover.jpg',
];

export default function HomeStayDetailScreen() {
    const navigation = useNavigation();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [expanded, setExpanded] = useState(false);

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

    const renderAmenityItem = ({ icon, label }) => (
        <View style={styles.amenityItem}>
            <LinearGradient
                colors={[colors.primary + '20', colors.primary + '10']}
                style={styles.amenityIconContainer}
            >
                <MaterialIcons name={icon} size={24} color={colors.primary} />
            </LinearGradient>
            <Text style={styles.amenityLabel}>{label}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                            <Image source={{ uri: item }} style={styles.hotelImage} />
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
                        
                        <TouchableOpacity style={styles.shareButton}>
                            <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                                <Ionicons name="share-outline" size={24} color="#fff" />
                            </BlurView>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                {/* Hotel Info Section */}
                <Animated.View 
                    entering={FadeInDown.delay(200)}
                    style={styles.infoSection}
                >
                    <Text style={styles.hotelName}>Khách sạn The Imperial Vũng Tàu</Text>
                    <View style={styles.ratingContainer}>
                        <View style={styles.ratingStars}>
                            {[...Array(5)].map((_, i) => (
                                <MaterialIcons key={i} name="star" size={20} color="#FFD700" />
                            ))}
                        </View>
                        <Text style={styles.ratingText}>8.6 Ấn tượng</Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.locationButton}
                        onPress={() => navigation.navigate('MapScreen')}
                    >
                        <MaterialIcons name="location-on" size={20} color={colors.primary} />
                        <Text style={styles.address}>15 Thi Sách, Vũng Tàu, Việt Nam</Text>
                        <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Amenities Section */}
                <Animated.View 
                    entering={FadeInDown.delay(300)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Tiện nghi nổi bật</Text>
                    <View style={styles.amenitiesGrid}>
                        {renderAmenityItem({ icon: 'pool', label: 'Hồ bơi' })}
                        {renderAmenityItem({ icon: 'restaurant', label: 'Nhà hàng' })}
                        {renderAmenityItem({ icon: 'wifi', label: 'Wifi miễn phí' })}
                        {renderAmenityItem({ icon: 'fitness-center', label: 'Phòng gym' })}
                        {renderAmenityItem({ icon: 'spa', label: 'Spa' })}
                        {renderAmenityItem({ icon: 'local-parking', label: 'Bãi đỗ xe' })}
                    </View>
                </Animated.View>

                {/* Reviews Section */}
                <Animated.View 
                    entering={FadeInDown.delay(400)}
                    style={styles.section}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Đánh giá</Text>
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
                        <View style={styles.reviewCard}>
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
                        </View>

                        <View style={styles.reviewCard}>
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
                        </View>
                    </ScrollView>
                </Animated.View>

                {/* Description Section */}
                <Animated.View 
                    entering={FadeInDown.delay(500)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Mô tả</Text>
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
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            {/* Bottom Booking Section */}
            <Animated.View 
                entering={FadeIn}
                style={styles.bookingSection}
            >
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
                        colors={[colors.primary, colors.primary + 'E6']}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.bookButtonText}>Chọn phòng</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
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
        height: 300,
        position: 'relative',
    },
    hotelImage: {
        width,
        height: 300,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
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
    infoSection: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
    },
    hotelName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
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
        color: '#666',
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 10,
    },
    address: {
        flex: 1,
        fontSize: 14,
        color: '#333',
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
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
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    amenityItem: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 20,
    },
    amenityIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    amenityLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    reviewsScroll: {
        marginTop: 10,
    },
    reviewCard: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 15,
        marginRight: 15,
        width: 300,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    reviewDate: {
        fontSize: 12,
        color: '#666',
    },
    reviewText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginBottom: 10,
    },
    reviewRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewScore: {
        marginLeft: 5,
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    descriptionCollapsed: {
        height: 66,
    },
    expandButton: {
        alignItems: 'center',
        marginTop: 10,
    },
    expandButtonText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    bookingSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 12,
        color: '#666',
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
    },
    priceNote: {
        fontSize: 12,
        color: '#666',
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
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});