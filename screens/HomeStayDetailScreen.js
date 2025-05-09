import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar, FlatList, Platform, Image, Linking, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5, Ionicons, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import homeStayApi from '../services/api/homeStayApi';
import { colors } from '../constants/Colors';
import ImageViewer from '../components/ImageViewer';
import LoadingScreen from '../components/LoadingScreen';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropdownMenuTabs from '../components/DropdownMenuTabs';

const { width, height } = Dimensions.get('window');

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

  const calculateAverageRatings = (ratings) => {
    if (!ratings || ratings.length === 0) return { cleanliness: 0, service: 0, facility: 0 };
    let totalCleanliness = 0;
    let totalService = 0;
    let totalFacility = 0;
    ratings.forEach(rating => {
      totalCleanliness += rating.cleaningRate || 0;
      totalService += rating.serviceRate || 0;
      totalFacility += rating.facilityRate || 0;
    });

    return {
      cleanliness: totalCleanliness / ratings.length,
      service: totalService / ratings.length,
      facility: totalFacility / ratings.length
    };
  };

  const renderServiceGridItem = (item, index) => (
    <View style={styles.serviceGridItem} key={index}>
      <LinearGradient
        colors={[palette.secondary + '15', palette.secondary + '05']}
        style={styles.serviceIconContainer}
      >
        <Ionicons name="pricetag-outline" size={20} color={palette.secondary} />
      </LinearGradient>
      <View style={styles.serviceContentContainer}>
        <Text style={styles.serviceNameGrid}>{item.servicesName || 'Không có tên'}</Text>
        <Text style={styles.servicePriceGrid}>{item.servicesPrice?.toLocaleString() || '0'}đ</Text>
      </View>
    </View>
  );

  const renderRatingGridItem = (item, index) => (
    <View style={styles.ratingGridItem} key={index}>
      <View style={styles.ratingGridHeader}>
        <View style={styles.ratingAvatar}>
          <Text style={styles.ratingAvatarText}>{item.username?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </View>
        <View style={styles.ratingGridInfo}>
          <Text style={styles.ratingUsername} numberOfLines={1}>{item.username}</Text>
          <Text style={styles.ratingDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.ratingScoreBadge}>
          <Text style={styles.ratingGridScore}>{item.sumRate.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.ratingStarsContainer}>
        {[0, 1, 2, 3, 4].map((star) => (
          <View key={star} style={{ marginRight: 4 }}>
            {renderStar(star, item.sumRate)}
          </View>
        ))}
      </View>
      {item.content && (
        <View style={styles.ratingContentContainer}>
          <Text style={styles.ratingContent} numberOfLines={3}>{item.content}</Text>
        </View>
      )}
    </View>
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
        colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.5)']}
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
        // Lưu thông tin cuộc trò chuyện mới tạm thời, để có thể hiển thị khi quay lại màn hình chat
        try {
          const existingConvsString = await AsyncStorage.getItem('recent_conversations');
          const existingConvs = existingConvsString ? JSON.parse(existingConvsString) : [];

          // Thêm cuộc trò chuyện mới vào danh sách
          const newConv = {
            conversationID: response.data.data.conversationID,
            homeStayID: homestayId,
            homeStayName: homestay.name,
            staff: {
              staffIdAccount: homestay.staffID,
              staffName: homestay.staffName || "Nhân viên"
            },
            lastMessage: null
          };

          const updatedConvs = [newConv, ...existingConvs.filter(c =>
            c.conversationID !== response.data.data.conversationID
          )];

          await AsyncStorage.setItem('recent_conversations', JSON.stringify(updatedConvs));
        } catch (err) {
          console.log('Error saving recent conversation:', err);
        }

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
            <View style={styles.blurButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.rightButtons}>
            <DropdownMenuTabs style={{ marginLeft: 8 }} iconStyle={styles.blurButton} />
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
          <View style={styles.titleSection}>
            <View style={styles.titleContainer}>
              <View style={styles.titleWrapper}>
                <Text style={styles.hotelName}>{homestay?.name || 'Không có tên'}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={18} color={palette.text.light} />
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
          </View>

          <View style={styles.addressSection}>
            <View style={styles.addressContainer}>
              <View style={styles.addressIconContainer}>
                <Ionicons name="location" size={22} color={palette.primary} />
              </View>
              <View style={styles.addressTextContainer}>
                <Text style={styles.addressLabel}>Địa chỉ</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {homestay?.address || 'Không có địa chỉ'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={handleOpenMap}
              >
                <Ionicons name="map-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {homestay?.services?.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <MaterialCommunityIcons name="room-service-outline" size={24} color={palette.primary} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Dịch vụ</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ServiceScreen', { homestayId })}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>Xem tất cả</Text>
                  <AntDesign name="arrowright" size={16} color={palette.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.serviceGrid}>
                {homestay.services.slice(0, 4).map((item, index) =>
                  renderServiceGridItem(item, index)
                )}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialIcons name="star-rate" size={24} color={palette.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Đánh giá</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('ReviewScreen', { homestayId })}
              >
                <Text style={styles.viewAllText}>Xem tất cả</Text>
                <AntDesign name="arrowright" size={16} color={palette.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingSummary}>
              <View style={styles.ratingOverallContainer}>
                <View style={styles.ratingScoreCircle}>
                  <Text style={styles.ratingOverallScore}>{homestay?.sumRate?.toFixed(1) || '0.0'}</Text>
                </View>

                <View style={styles.ratingDetailsContainer}>
                  <Text style={styles.ratingScoreLabel}>Điểm đánh giá</Text>
                  <View style={styles.ratingOverallStars}>
                    {[0, 1, 2, 3, 4].map((star) => (
                      <View key={star} style={{ marginHorizontal: 2 }}>
                        {renderStar(star, homestay?.sumRate || 0)}
                      </View>
                    ))}
                  </View>
                  <View style={styles.ratingCountContainer}>
                    <MaterialIcons name="people" size={16} color={palette.text.light} />
                    <Text style={styles.ratingTotalCount}>{homestay?.totalRatings || 0} lượt đánh giá</Text>
                  </View>
                </View>
              </View>

              {homestay?.latestRatings?.length > 0 && (
                <View style={styles.ratingSummaryFooter}>
                  {(() => {
                    const avgRatings = calculateAverageRatings(homestay.latestRatings);
                    return (
                      <>
                        <View style={styles.ratingSummaryStat}>
                          <Text style={styles.ratingSummaryStatLabel}>Vệ sinh</Text>
                          <View style={styles.ratingSummaryStatValue}>
                            <Text style={styles.ratingSummaryStatScore}>{avgRatings.cleanliness.toFixed(1)}</Text>
                            <MaterialIcons name="cleaning-services" size={14} color={palette.secondary} />
                          </View>
                        </View>

                        <View style={styles.ratingSummaryDivider} />

                        <View style={styles.ratingSummaryStat}>
                          <Text style={styles.ratingSummaryStatLabel}>Dịch vụ</Text>
                          <View style={styles.ratingSummaryStatValue}>
                            <Text style={styles.ratingSummaryStatScore}>{avgRatings.service.toFixed(1)}</Text>
                            <MaterialIcons name="room-service" size={14} color={palette.secondary} />
                          </View>
                        </View>

                        <View style={styles.ratingSummaryDivider} />

                        <View style={styles.ratingSummaryStat}>
                          <Text style={styles.ratingSummaryStatLabel}>Tiện nghi</Text>
                          <View style={styles.ratingSummaryStatValue}>
                            <Text style={styles.ratingSummaryStatScore}>{avgRatings.facility.toFixed(1)}</Text>
                            <MaterialIcons name="hotel" size={14} color={palette.secondary} />
                          </View>
                        </View>
                      </>
                    );
                  })()}
                </View>
              )}
            </View>

            {homestay?.latestRatings?.length > 0 ? (
              <View style={styles.ratingGrid}>
                {homestay.latestRatings.slice(0, 3).map((item, index) =>
                  renderRatingGridItem(item, index)
                )}

                {homestay.totalRatings > 3 && (
                  <TouchableOpacity
                    style={styles.viewMoreRatingsButton}
                    onPress={() => navigation.navigate('ReviewScreen', { homestayId })}
                  >
                    <Text style={styles.viewMoreRatingsText}>Xem thêm {homestay.totalRatings - 3} đánh giá</Text>
                    <AntDesign name="arrowright" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.noReviewContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ddd" />
                <Text style={styles.noReviewText}>Chưa có đánh giá nào</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialIcons name="policy" size={24} color={palette.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Chính sách hoàn trả</Text>
              </View>
            </View>
            <View style={styles.policyContainer}>
              <View style={styles.policyItem}>
                <View style={styles.policyIconContainer}>
                  <MaterialIcons name="access-time" size={24} color={palette.primary} />
                </View>
                <View style={styles.policyContent}>
                  <Text style={styles.policyTitle}>Thời gian hủy</Text>
                  <Text style={styles.policyDescription}>
                    {homestay?.cancelPolicy?.dayBeforeCancel || 0} ngày trước ngày nhận phòng
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.policyItem}>
                <View style={styles.policyIconContainer}>
                  <MaterialIcons name="payments" size={24} color={palette.primary} />
                </View>
                <View style={styles.policyContent}>
                  <Text style={styles.policyTitle}>Tỷ lệ hoàn tiền</Text>
                  <Text style={styles.policyDescription}>
                    {(homestay?.cancelPolicy?.refundPercentage * 100 || 0).toFixed(0)}% giá trị đặt phòng
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <FontAwesome5 name="info-circle" size={22} color={palette.primary} style={styles.sectionIcon} />
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
                  <AntDesign name={expanded ? "up" : "down"} size={14} color={palette.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      <View style={styles.bookingSection}>
        <View style={styles.bookingBlur}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Giá từ</Text>
            <Text style={styles.price}>{homestay?.cheapestPrice?.toLocaleString() || '0'} <Text style={styles.priceCurrency}>₫</Text></Text>
            <Text style={styles.priceNote}>Đã bao gồm thuế và phí</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
              <LinearGradient
                colors={[palette.secondary, palette.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bookButton} onPress={handleListRoom}>
              <LinearGradient
                colors={[palette.primary, palette.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gradientButton, styles.bookGradientButton]}
              >
                <Text style={styles.bookButtonText}>Xem căn</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  ratingContainer: {
    alignItems: 'center',
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  ratingScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: palette.primary,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: palette.text.light,
    marginTop: 6,
  },
  addressSection: {
    marginBottom: 28,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  addressTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  addressLabel: {
    fontSize: 13,
    color: palette.text.light,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
    color: palette.text.dark,
    lineHeight: 22,
    fontWeight: '500',
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  section: {
    marginBottom: 28,
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: palette.primary,
    marginRight: 6,
    fontWeight: '600',
  },

  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceGridItem: {
    width: '48%',
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceContentContainer: {
    flex: 1,
  },
  serviceNameGrid: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text.dark,
    marginBottom: 4,
  },
  servicePriceGrid: {
    fontSize: 14,
    fontWeight: 'bold',
    color: palette.secondary,
  },

  ratingGrid: {
    marginTop: 8,
  },
  ratingGridItem: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  ratingGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingGridInfo: {
    flex: 1,
  },
  ratingUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text.dark,
    marginBottom: 2,
  },
  ratingDate: {
    fontSize: 12,
    color: palette.text.light,
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  ratingScoreBadge: {
    backgroundColor: palette.primary + '15',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingGridScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: palette.primary,
  },
  ratingContentContainer: {
    backgroundColor: palette.card + '80',
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary + '40',
  },
  ratingContent: {
    fontSize: 14,
    color: palette.text.medium,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  ratingSummary: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 0,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    overflow: 'hidden',
  },
  ratingOverallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: palette.card,
  },
  ratingScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  ratingDetailsContainer: {
    flex: 1,
  },
  ratingScoreLabel: {
    fontSize: 14,
    color: palette.text.medium,
    marginBottom: 6,
    fontWeight: '500',
  },
  ratingOverallScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ratingOverallStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ratingCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingTotalCount: {
    fontSize: 14,
    color: palette.text.light,
    marginLeft: 4,
  },
  ratingSummaryFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: palette.cardBorder,
    paddingVertical: 12,
    backgroundColor: palette.primary + '05',
  },
  ratingSummaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  ratingSummaryStatLabel: {
    fontSize: 12,
    color: palette.text.medium,
    marginBottom: 4,
  },
  ratingSummaryStatValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingSummaryStatScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: palette.text.dark,
    marginRight: 4,
  },
  ratingSummaryDivider: {
    width: 1,
    backgroundColor: palette.cardBorder,
    marginHorizontal: 8,
  },
  viewMoreRatingsButton: {
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 4,
  },
  viewMoreRatingsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  policyContainer: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  policyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.primary + '15',
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
    color: palette.text.dark,
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 14,
    color: palette.text.medium,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: palette.cardBorder,
    marginVertical: 12,
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
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: palette.primary + '10',
  },
  readMoreText: {
    color: palette.primary,
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
    backgroundColor: palette.background,
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
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  contactButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    elevation: 4,
    shadowColor: palette.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bookButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gradientButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookGradientButton: {
    paddingHorizontal: 24,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noReviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  noReviewText: {
    color: palette.text.medium,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: palette.danger,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  retryButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.primary,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});