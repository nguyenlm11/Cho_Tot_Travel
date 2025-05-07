import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar, FlatList, Share, Platform, Image, Linking, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import homeStayApi from '../services/api/homeStayApi';
import { colors } from '../constants/Colors';
import ImageViewer from '../components/ImageViewer';
import LoadingScreen from '../components/LoadingScreen';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function HomestayDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id: homestayId } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
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
      if (response?.data) {
        setHomestay(response.data);
      } else {
        setError('Không tìm thấy thông tin homestay');
      }
    } catch (err) {
      setError('Không thể tải thông tin homestay. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleListRoom = () => {
    navigation.navigate('HomestayRental', { homeStayId: homestayId });
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

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${homestay.latitude},${homestay.longitude}`;

    Linking.canOpenURL(googleMapsUrl).then(supported => {
      if (supported) {
        Linking.openURL(googleMapsUrl);
      } else {
        Alert.alert(
          "Lỗi",
          "Không thể mở Google Maps. Vui lòng cài đặt Google Maps trên thiết bị của bạn.",
          [{ text: "Đóng" }]
        );
      }
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const vietnamDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));

    const day = vietnamDate.getDate().toString().padStart(2, '0');
    const month = (vietnamDate.getMonth() + 1).toString().padStart(2, '0');
    const year = vietnamDate.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const renderStar = (index, rating) => {
    const fullStar = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    if (index < fullStar) {
      return <MaterialIcons name="star" size={14} color="#FFD700" />;
    } else if (index === fullStar && hasHalfStar) {
      return <MaterialIcons name="star-half" size={14} color="#FFD700" />;
    } else {
      return <MaterialIcons name="star" size={14} color="#e0e0e0" />;
    }
  };

  const renderServiceItem = ({ item }) => (
    <Animated.View entering={FadeInDown.delay(50)} style={styles.serviceCard}>
      <LinearGradient
        colors={[colors.secondary + '20', colors.secondary + '05']}
        style={styles.serviceIconContainer}
      >
        <Ionicons name="pricetag-outline" size={24} color={colors.secondary} />
      </LinearGradient>
      <View style={styles.serviceContentContainer}>
        <View style={styles.serviceHeaderContainer}>
          <Text style={styles.serviceName}>{item.servicesName || 'Không có tên'}</Text>
          <Text style={styles.servicePrice}>{item.servicesPrice?.toLocaleString() || '0'}đ</Text>
        </View>
        <Text style={styles.serviceDescription}>{item.description || 'Không có mô tả'}</Text>
      </View>
    </Animated.View>
  );

  const renderCoverImageItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.coverImageItem}
      onPress={() => {
        setCurrentImageIndex(index);
        setImageViewerVisible(true);
      }}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.coverImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
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
              currentImageIndex === index && styles.indicatorDotActive,
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

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  const handleContact = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      const userID = user?.userId || user?.AccountID;

      if (!userID) {
        Alert.alert(
          "Thông báo",
          "Vui lòng đăng nhập để liên hệ với nhân viên homestay",
          [
            { text: "Đóng" },
            {
              text: "Đăng nhập",
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        return;
      }

      if (!homestay?.staffID) {
        Alert.alert(
          "Thông báo",
          "Homestay này hiện chưa có nhân viên phụ trách. Vui lòng thử lại sau.",
          [{ text: "Đóng" }]
        );
        return;
      }

      const response = await axios.post('https://capstone-bookinghomestay.onrender.com/api/Chat/create-conversation', {
        receiverID: homestay.staffID,
        senderID: userID,
        homeStayId: homestayId,
        createdAt: new Date().toISOString()
      });

      if (response.data?.data?.conversationID) {
        navigation.navigate('ChatDetail', {
          conversationId: response.data.data.conversationID,
          receiverId: homestay.staffID,
          homeStayId: homestayId,
          homeStayName: homestay.name
        });
      } else {
        throw new Error('Không nhận được ID cuộc trò chuyện từ server');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert(
        "Lỗi",
        "Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.",
        [{ text: "Đóng" }]
      );
    }
  };

  if (loading) {
    return (
      <LoadingScreen
        message="Đang tải thông tin homestay"
        subMessage="Vui lòng đợi trong giây lát..."
      />
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchHomestayDetail}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = homestay?.imageHomeStays?.length > 0
    ? homestay.imageHomeStays.map(img => ({ uri: img.image }))
    : [{ uri: 'https://res.cloudinary.com/dzjofylpf/image/upload/v1742915319/HomeStayImages/placeholder.jpg' }];

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
            <View style={[styles.blurButton, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.rightButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.blurButton, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                <Ionicons name="share-outline" size={22} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
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
            removeClippedSubviews={true}
            initialNumToRender={3}
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
          <Animated.View entering={FadeInDown.delay(100)} style={styles.titleSection}>
            <View style={styles.titleContainer}>
              <View style={styles.titleWrapper}>
                <Text style={styles.hotelName}>{homestay?.name || 'Không có tên'}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={18} color="#666" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {homestay?.area || 'Không xác định'}
                  </Text>
                </View>
              </View>
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingScore}>{homestay?.sumRate?.toFixed(1) || '0.0'}</Text>
                <View style={styles.ratingStars}>
                  {[0, 1, 2, 3, 4].map((star) => (
                    <View key={star}>
                      {renderStar(star, homestay?.sumRate || 0)}
                    </View>
                  ))}
                </View>
                <Text style={styles.reviewCount}>({homestay?.totalRatings || 0} đánh giá)</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.addressSection}>
            <View style={styles.addressContainer}>
              <Ionicons name="location" size={22} color={colors.primary} />
              <View style={styles.addressTextContainer}>
                <Text style={styles.addressText} numberOfLines={2}>
                  {homestay?.address || 'Không có địa chỉ'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={handleOpenMap}
              >
                <Ionicons name="map-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {homestay?.services?.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <MaterialCommunityIcons name="room-service-outline" size={24} color={colors.primary} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Dịch vụ</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ServiceScreen', { homestayId })}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>Xem tất cả</Text>
                  <FontAwesome5 name="angle-right" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.servicesContainer}>
                <FlatList
                  data={homestay.services.slice(0, 2)}
                  renderItem={renderServiceItem}
                  keyExtractor={(item, index) => `service-${index}`}
                  scrollEnabled={false}
                />
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialIcons name="star-rate" size={24} color={colors.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Đánh giá</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('ReviewScreen', { homestayId })}
              >
                <Text style={styles.viewAllText}>Xem tất cả</Text>
                <FontAwesome5 name="angle-right" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingSummary}>
              <View style={styles.ratingOverall}>
                <Text style={styles.ratingOverallScore}>{homestay?.sumRate?.toFixed(1) || '0.0'}</Text>
                <View style={styles.ratingOverallStars}>
                  {[0, 1, 2, 3, 4].map((star) => (
                    <View key={star}>
                      {renderStar(star, homestay?.sumRate || 0)}
                    </View>
                  ))}
                </View>
                <Text style={styles.ratingTotalCount}>({homestay?.totalRatings || 0} đánh giá)</Text>
              </View>
            </View>

            {homestay?.latestRatings?.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ratingScrollContent}
              >
                {homestay.latestRatings.map((item) => (
                  <View key={item.ratingID} style={styles.ratingCard}>
                    <View style={styles.ratingCardHeader}>
                      <View style={styles.ratingUserInfo}>
                        <View style={styles.ratingAvatar}>
                          <Text style={styles.ratingAvatarText}>{item.username?.charAt(0)?.toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text style={styles.ratingUsername}>{item.username}</Text>
                          <Text style={styles.ratingDate}>{formatDate(item.createdAt)}</Text>
                        </View>
                      </View>
                      <View style={styles.ratingScore}>
                        <Text style={styles.ratingScoreText}>{item.sumRate.toFixed(1)}</Text>
                        <View style={styles.ratingStars}>
                          {[0, 1, 2, 3, 4].map((star) => (
                            <View key={star}>
                              {renderStar(star, item.sumRate)}
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                    {item.content && (
                      <Text style={styles.ratingContent} numberOfLines={3}>{item.content}</Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noReviewContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ddd" />
                <Text style={styles.noReviewText}>Chưa có đánh giá nào</Text>
                <Text style={styles.noReviewSubtext}>Hãy là người đầu tiên đánh giá homestay này</Text>
                <TouchableOpacity
                  style={styles.writeReviewButton}
                  onPress={() => navigation.navigate('WriteReview', { homestayId })}
                >
                  <Text style={styles.writeReviewText}>Viết đánh giá</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialIcons name="policy" size={24} color={colors.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Chính sách hoàn trả</Text>
              </View>
            </View>
            <View style={styles.policyContainer}>
              <View style={styles.policyItem}>
                <View style={styles.policyIconContainer}>
                  <MaterialIcons name="access-time" size={24} color={colors.primary} />
                </View>
                <View style={styles.policyContent}>
                  <Text style={styles.policyTitle}>Thời gian hủy</Text>
                  <Text style={styles.policyDescription}>
                    {homestay?.cancelPolicy?.dayBeforeCancel || 0} ngày trước ngày nhận phòng
                  </Text>
                </View>
              </View>
              <View style={styles.policyItem}>
                <View style={styles.policyIconContainer}>
                  <MaterialIcons name="payments" size={24} color={colors.primary} />
                </View>
                <View style={styles.policyContent}>
                  <Text style={styles.policyTitle}>Tỷ lệ hoàn tiền</Text>
                  <Text style={styles.policyDescription}>
                    {(homestay?.cancelPolicy?.refundPercentage * 100 || 0).toFixed(0)}% giá trị đặt phòng
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
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
                {homestay?.description || 'Không có mô tả'}
              </Text>
              {homestay?.description?.length > 150 && (
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

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      <Animated.View entering={FadeIn} style={styles.bookingSection}>
        <View style={styles.bookingBlur}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Giá từ</Text>
            <Text style={styles.price}>{homestay?.cheapestPrice?.toLocaleString() || '0'} ₫</Text>
            <Text style={styles.priceNote}>Đã bao gồm thuế và phí</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
              <LinearGradient
                colors={[colors.secondary, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bookButton} onPress={handleListRoom}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.bookButtonText}>Xem căn</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

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
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
  },
  scrollView: {
    flex: 1,
  },
  coverContainer: {
    height: height * 0.45,
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
  },
  contentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrapper: {
    flex: 1,
    marginRight: 10,
  },
  hotelName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  ratingContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
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
    marginTop: 4,
  },
  addressSection: {
    marginBottom: 24,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
  servicesContainer: {
    marginTop: 5,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    lineHeight: 20,
  },
  ratingSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  ratingOverall: {
    alignItems: 'center',
  },
  ratingOverallScore: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.primary,
  },
  ratingOverallStars: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  ratingTotalCount: {
    fontSize: 14,
    color: '#666',
  },
  ratingScrollContent: {
    paddingRight: 20,
  },
  ratingCard: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ratingUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingScore: {
    alignItems: 'center',
  },
  ratingScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  ratingContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  policyContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  policyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 14,
    color: '#666',
  },
  descriptionContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
  },
  descriptionText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
  },
  readMoreButton: {
    alignSelf: 'center',
    marginTop: 12,
    padding: 8,
  },
  readMoreText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  bottomSpacer: {
    height: 100,
  },
  bookingSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
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
    fontSize: 24,
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
    borderRadius: 16,
    overflow: 'hidden',
    marginLeft: 16,
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
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noReviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noReviewText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  noReviewSubtext: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  writeReviewButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  writeReviewText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  contactButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginLeft: 16,
  },
  gradientButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});