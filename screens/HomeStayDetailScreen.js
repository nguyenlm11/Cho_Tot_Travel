import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, StatusBar, FlatList, ActivityIndicator, Share, Linking, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5, FontAwesome6 } from 'react-native-vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import homeStayApi from '../services/api/homeStayApi';
import { colors } from '../constants/Colors';
import ImageViewer from '../components/ImageViewer';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function HomestayDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id: homestayId } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [homestay, setHomestay] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchHomestayDetail();
  }, [homestayId]);

  const fetchHomestayDetail = async () => {
    setLoading(true);
    try {
      const response = await homeStayApi.getHomeStayDetail(homestayId);
      if (response && response.data) {
        setHomestay(response.data);
      } else {
        setError('Không tìm thấy thông tin homestay');
      }
    } catch (err) {
      console.error('Error fetching homestay detail:', err);
      setError('Không thể tải thông tin homestay. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleListRoom = () => {
    navigation.navigate('ListRoom', { homestayId });
  };

  const handleShare = async () => {
    if (!homestay) return;

    try {
      await Share.share({
        message: `Xem Homestay "${homestay.name}" tại địa chỉ: ${homestay.address}. Một địa điểm nghỉ dưỡng tuyệt vời!`,
        url: `https://yourappdomain.com/homestay/${homestayId}`,
        title: homestay.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleOpenMap = () => {
    if (!homestay) return;
    
    // Chuyển đến MapScreen với tọa độ và thông tin của homestay
    navigation.navigate('MapScreen', {
      latitude: homestay.latitude,
      longitude: homestay.longitude,
      title: homestay.name,
      address: homestay.address
    });
  };

  // Thêm hàm mới để mở ứng dụng bản đồ trên thiết bị
  const openDeviceMap = () => {
    if (!homestay) return;
    
    const { latitude, longitude } = homestay;
    const label = encodeURIComponent(homestay.name);
    const url = Platform.select({
      ios: `maps:${latitude},${longitude}?q=${label}`,
      android: `geo:${latitude},${longitude}?q=${label}`,
    });
    
    Linking.openURL(url);
  };

  // Render service item
  const renderServiceItem = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(50 * index)}
      style={styles.serviceCard}
    >
      <LinearGradient
        colors={[colors.secondary + '20', colors.secondary + '05']}
        style={styles.serviceIconContainer}
      >
        <Icon name="pricetag-outline" size={24} color={colors.secondary} />
      </LinearGradient>

      <View style={styles.serviceContentContainer}>
        <View style={styles.serviceHeaderContainer}>
          <Text style={styles.serviceName}>{item.servicesName}</Text>
          <Text style={styles.servicePrice}>{item.servicesPrice.toLocaleString()}đ</Text>
        </View>
        <Text style={styles.serviceDescription}>{item.description}</Text>
      </View>
    </Animated.View>
  );

  // Render cover image item
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

  // Render image indicator dots
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

  // Handle flat list scroll
  const handleViewableItemsChanged = React.useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchHomestayDetail}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = homestay.imageHomeStays.map(img => ({ uri: img.image }));
  if (images.length === 0) {
    images.push({ uri: 'https://res.cloudinary.com/dzjofylpf/image/upload/v1742915319/HomeStayImages/placeholder.jpg' });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.headerButtons}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <BlurView intensity={80} style={styles.blurButton}>
            <Icon name="chevron-back" size={24} color="#fff" />
          </BlurView>
        </TouchableOpacity>

        <View style={styles.rightButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
            <BlurView intensity={80} style={styles.blurButton}>
              <Icon name="share-social-outline" size={22} color="#fff" />
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={styles.coverContainer}>
          <FlatList
            ref={flatListRef}
            data={images}
            renderItem={renderCoverImageItem}
            keyExtractor={(_, index) => `cover-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
          {renderImageIndicator(images)}

          <View style={styles.imageCountBadge}>
            <TouchableOpacity
              onPress={() => setImageViewerVisible(true)}
              style={styles.imageCountButton}
            >
              <Icon name="images-outline" size={18} color="#fff" />
              <Text style={styles.imageCountText}>{currentImageIndex + 1}/{images.length}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <View style={styles.titleWrapper}>
              <Text style={styles.hotelName}>{homestay.name}</Text>
              <View style={styles.locationRow}>
                <Icon name="location-outline" size={18} color="#666" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {homestay.area || 'Không xác định'}
                </Text>
              </View>
            </View>

            <View style={styles.ratingContainer}>
              <Text style={styles.ratingScore}>4.8</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialIcons
                    key={star}
                    name="star"
                    size={14}
                    color={star <= 5 ? "#FFD700" : "#e0e0e0"}
                  />
                ))}
                <Text style={styles.reviewCount}>(0 đánh giá)</Text>
              </View>
            </View>
          </View>

          {/* Address Section */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.addressSection}
          >
            <View style={styles.addressContainer}>
              <Icon name="location" size={22} color={colors.primary} />
              <View style={styles.addressTextContainer}>
                <Text style={styles.addressText} numberOfLines={2}>
                  {homestay.address}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.mapButton} onPress={openDeviceMap}>
              <Text style={styles.mapButtonText}>Mở bản đồ</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Map Preview */}
          <Animated.View
            entering={FadeInDown.delay(250)}
            style={styles.mapContainer}
          >
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: homestay.latitude,
                longitude: homestay.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={true}
              zoomEnabled={true}
            >
              <Marker
                coordinate={{
                  latitude: homestay.latitude,
                  longitude: homestay.longitude,
                }}
                title={homestay.name}
              />
            </MapView>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.9)']}
              style={styles.mapGradient}
            />
            <TouchableOpacity
              style={styles.fullMapButton}
              onPress={handleOpenMap}
            >
              <Text style={styles.fullMapButtonText}>Xem bản đồ đầy đủ</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Services Section */}
          {homestay.services && homestay.services.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(300)}
              style={styles.section}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <MaterialCommunityIcons name="room-service-outline" size={24} color={colors.primary} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Dịch vụ</Text>
                </View>
                {homestay.services.length > 2 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => setServicesExpanded(!servicesExpanded)}
                  >
                    <Text style={styles.viewAllText}>
                      {servicesExpanded ? 'Thu gọn' : 'Xem tất cả'}
                    </Text>
                    <FontAwesome6 name={servicesExpanded ? 'angle-up' : 'angle-right'} size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.servicesContainer}>
                <FlatList
                  data={servicesExpanded ? homestay.services : homestay.services.slice(0, 2)}
                  renderItem={renderServiceItem}
                  keyExtractor={(item, index) => `service-${index}`}
                  scrollEnabled={false}
                />

                {servicesExpanded && (
                  <View style={styles.sectionFooter}>
                    <Text style={styles.sectionNote}>
                      * Giá dịch vụ có thể thay đổi, vui lòng liên hệ chủ nhà để biết thêm chi tiết
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Reviews Section */}
          <Animated.View
            entering={FadeInDown.delay(350)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialIcons name="star-rate" size={24} color="#FFD700" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Đánh giá</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('ReviewScreen', { homestayId })}
              >
                <Text style={styles.viewAllText}>Xem tất cả</Text>
                <FontAwesome6 name="angle-right" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* If there are no reviews yet */}
            <View style={styles.noReviewContainer}>
              <Icon name="chatbubble-ellipses-outline" size={48} color="#ddd" />
              <Text style={styles.noReviewText}>Chưa có đánh giá nào</Text>
              <Text style={styles.noReviewSubtext}>Hãy là người đầu tiên đánh giá homestay này</Text>

              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={() => navigation.navigate('WriteReview', { homestayId })}
              >
                <Text style={styles.writeReviewText}>Viết đánh giá</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <FontAwesome5 name="info-circle" size={22} color={colors.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Mô tả</Text>
              </View>
            </View>

            <View style={styles.descriptionContainer}>
              <Text
                style={styles.descriptionText}
                numberOfLines={expanded ? undefined : 4}
              >
                {homestay.description}
              </Text>

              {homestay.description.length > 150 && (
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
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Cover image carousel styles
  coverContainer: {
    height: height * 0.4,
    position: 'relative',
  },
  coverImageItem: {
    width: width,
    height: '100%',
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
  // Image indicator styles
  imageIndicator: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  indicatorTouchable: {
    padding: 5, // More touch area
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageCountText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  // Header buttons styles
  headerButtons: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
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
  },
  // Content styles
  contentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 10,
  },
  hotelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 4,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  // Address section styles
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addressContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 10,
    alignItems: 'center'
  },
  addressTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    color: '#666',
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    marginTop: 2,
  },
  mapButton: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  // Map styles
  mapContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  fullMapButton: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  fullMapButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  // Services styles
  servicesContainer: {
    marginTop: 5,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceContentContainer: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
  },
  sectionFooter: {
    marginTop: 10,
    paddingHorizontal: 5,
  },
  sectionNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  // Reviews styles
  noReviewContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  noReviewText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
  },
  noReviewSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  writeReviewButton: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  writeReviewText: {
    color: colors.primary,
    fontWeight: '600',
  },
  descriptionContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  readMoreButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  readMoreText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  bottomSpacer: {
    height: 80,
  },
  bookingSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  bookingBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 2,
  },
  priceNote: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  bookButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});