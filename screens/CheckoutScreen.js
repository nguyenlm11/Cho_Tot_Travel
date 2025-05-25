import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSearch } from '../contexts/SearchContext';
import { useUser } from '../contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/Colors';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';
import bookingApi from '../services/api/bookingApi';
import homeStayApi from '../services/api/homeStayApi';

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const homeStayId = route.params?.homeStayId;
  const rentalId = route.params?.rentalId;
  const { currentSearch } = useSearch();
  const { userData } = useUser();
  const { getRoomsByParams, clearCart, fetchRoomPrice, checkDateType, getPriceByDateType } = useCart();

  const params = useMemo(() => {
    const p = {};
    if (homeStayId) p.homeStayId = homeStayId;
    if (rentalId) p.rentalId = rentalId;
    return p;
  }, [homeStayId, rentalId]);

  const [isFullPayment, setIsFullPayment] = useState(true);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(true);
  const [roomPrices, setRoomPrices] = useState({});
  const [showPriceBreakdown, setShowPriceBreakdown] = useState({});
  const [dateTypes, setDateTypes] = useState({});
  const [datePrices, setDatePrices] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [commissionRate, setCommissionRate] = useState(null);
  const [loadingCommission, setLoadingCommission] = useState(true);

  const selectedRooms = useMemo(() => getRoomsByParams(params), [getRoomsByParams, params]);

  const numberOfNights = useMemo(() => {
    if (!selectedRooms || selectedRooms.length === 0) return 1;
    const checkIn = new Date(selectedRooms[0].checkInDate);
    const checkOut = new Date(selectedRooms[0].checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  }, [selectedRooms]);

  useEffect(() => {
    const fetchPrices = async () => {
      if (selectedRooms.length === 0) {
        setTotalPrice(0);
        setCalculating(false);
        return;
      }
      setCalculating(true);
      try {
        const pricePromises = selectedRooms.map(room => fetchRoomPrice(room));
        const prices = await Promise.all(pricePromises);
        const newRoomPrices = {};
        let total = 0;
        selectedRooms.forEach((room, index) => {
          const price = prices[index];
          if (price !== null && price !== undefined) {
            newRoomPrices[room.roomID] = price;
            total += price;
          } else {
            newRoomPrices[room.roomID] = room.price || 0;
            total += room.price || 0;
          }
        });
        setRoomPrices(newRoomPrices);
        setTotalPrice(total);
      } catch (error) {
        const newRoomPrices = {};
        let total = 0;
        selectedRooms.forEach(room => {
          newRoomPrices[room.roomID] = room.price || 0;
          total += room.price || 0;
        });
        setRoomPrices(newRoomPrices);
        setTotalPrice(total);
      } finally {
        setCalculating(false);
      }
    };
    fetchPrices();
  }, [selectedRooms, fetchRoomPrice]);

  useEffect(() => {
    const fetchCommissionRate = async () => {
      if (!homeStayId) {
        setLoadingCommission(false);
        return;
      }
      try {
        const response = await homeStayApi.getCommissionRateByHomeStay(homeStayId);
        setCommissionRate(response.data);
      } catch (error) {
        console.error('Error fetching commission rate:', error);
      } finally {
        setLoadingCommission(false);
      }
    };
    fetchCommissionRate();
  }, [homeStayId]);

  useEffect(() => {
    const fetchDateTypes = async () => {
      if (selectedRooms.length === 0) return;
      const newDateTypes = {};
      const newDatePrices = {};
      for (const room of selectedRooms) {
        if (!room || !room.checkInDate || !room.checkOutDate) continue;
        const checkIn = new Date(room.checkInDate);
        const nights = calculateNumberOfNights();
        for (let i = 0; i < nights; i++) {
          const currentDate = new Date(checkIn);
          currentDate.setDate(currentDate.getDate() + i);
          const dateString = currentDate.toISOString().split('T')[0];
          const key = `${room.roomID}_${dateString}`;
          if (!newDateTypes[key]) {
            const dateType = await checkDateType(dateString, room.rentalId || rentalId, room.roomTypeID);
            newDateTypes[key] = dateType;
            const price = await getPriceByDateType(room.roomTypeID, dateType);
            newDatePrices[key] = price;
          }
        }
      }
      setDateTypes(newDateTypes);
      setDatePrices(newDatePrices);
    };
    fetchDateTypes();
  }, [selectedRooms, checkDateType, getPriceByDateType]);

  const getDateCountsByType = useCallback((room) => {
    const result = {
      normal: { count: 0, price: 0 },
      weekend: { count: 0, price: 0 },
      special: { count: 0, price: 0 }
    };
    if (!room || !room.checkInDate || !room.checkOutDate) return result;
    const checkIn = new Date(room.checkInDate);
    const nights = numberOfNights;
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkIn);
      currentDate.setDate(currentDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      const key = `${room.roomID}_${dateString}`;
      const dateType = dateTypes[key];
      const datePrice = datePrices[key] || 0;
      if (dateType === 0) {
        result.normal.count++;
        result.normal.price += datePrice;
      } else if (dateType === 1) {
        result.weekend.count++;
        result.weekend.price += datePrice;
      } else if (dateType === 2) {
        result.special.count++;
        result.special.price += datePrice;
      } else {
        result.normal.count++;
        result.normal.price += datePrice;
      }
    }
    return result;
  }, [numberOfNights, dateTypes, datePrices]);

  const getRoomPrice = useCallback((roomID) => {
    if (calculating) return null;
    return roomPrices[roomID] !== undefined
      ? roomPrices[roomID]
      : selectedRooms.find(room => room.roomID === roomID)?.price || 0;
  }, [calculating, roomPrices, selectedRooms]);

  function calculateNumberOfNights() {
    if (!selectedRooms || selectedRooms.length === 0) return 1;
    const checkIn = new Date(selectedRooms[0].checkInDate);
    const checkOut = new Date(selectedRooms[0].checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  }

  const createBookingData = useCallback(() => {
    if (!selectedRooms || selectedRooms.length === 0) {
      Alert.alert('Thông báo', 'Bạn chưa chọn phòng nào');
      return null;
    }
    if (!homeStayId) {
      Alert.alert('Thông báo', 'Không tìm thấy thông tin homestay');
      return null;
    }
    console.log('Selected rooms:', JSON.stringify(selectedRooms, null, 2));
    const bookingDetails = selectedRooms.map(room => {
      console.log('Creating booking detail for room:', room.roomNumber);
      console.log('Room rentalId:', room.rentalId);
      return {
        homeStayTypeID: room.rentalId,
        roomTypeID: room.roomTypeID || 0,
        roomID: room.roomID,
        checkInDate: room.checkInDate,
        checkOutDate: room.checkOutDate
      };
    });
    console.log('Final booking details:', JSON.stringify(bookingDetails, null, 2));
    return {
      numberOfChildren: currentSearch?.children || 0,
      numberOfAdults: currentSearch?.adults || 1,
      accountID: userData?.userID,
      homeStayID: homeStayId,
      bookingDetails: bookingDetails
    };
  }, [selectedRooms, homeStayId, currentSearch, userData]);

  const getDepositAmount = useMemo(() => {
    if (!commissionRate || commissionRate === null) {
      return totalPrice * 0.3;
    }
    return totalPrice * commissionRate.platformShare;
  }, [totalPrice, commissionRate]);

  const handlePayment = async (bookingId) => {
    setLoading(true);
    try {
      const paymentResult = await bookingApi.getPaymentUrl(bookingId, isFullPayment);
      if (paymentResult.success && paymentResult.paymentUrl) {
        navigation.navigate('PaymentWebView', {
          paymentUrl: paymentResult.paymentUrl,
          bookingId: bookingId
        });
      } else {
        if (paymentResult.nullRefError ||
          (paymentResult.error && paymentResult.error.includes('NullReference')) ||
          (paymentResult.data && typeof paymentResult.data === 'string' &&
            paymentResult.data.includes('NullReference'))) {

          Alert.alert(
            'Đặt phòng thành công',
            'Đặt phòng đã được xác nhận nhưng không thể thanh toán online vào lúc này. Bạn có thể thanh toán sau hoặc liên hệ với chủ homestay.',
            [
              { text: 'Xem đặt phòng', onPress: () => navigation.navigate('BookingList') },
              { text: 'Quay lại', onPress: () => navigation.navigate('HomeTabs') }
            ]
          );
          return;
        }
        throw new Error(paymentResult.error || "Không thể tạo liên kết thanh toán");
      }
    } catch (paymentError) {
      Alert.alert(
        'Lỗi thanh toán',
        `Không thể khởi tạo thanh toán (${paymentError.message || "Lỗi từ hệ thống"}). Bạn có thể xem chi tiết đặt phòng trong danh sách đặt phòng.`,
        [
          { text: 'Xem đặt phòng', onPress: () => navigation.navigate('BookingList') },
          { text: 'Quay lại', onPress: () => navigation.navigate('HomeTabs') }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    const bookingData = createBookingData();
    if (!bookingData) return;
    setLoading(true);
    try {
      const result = await bookingApi.createBooking(bookingData, 1);
      if (result.success) {
        clearCart();
        const bookingId = result.data?.data;

        if (!bookingId) {
          throw new Error("Không nhận được mã đặt phòng từ máy chủ");
        }
        handlePayment(bookingId);
      } else {
        Alert.alert('Đặt phòng thất bại', result.error || 'Đã xảy ra lỗi khi đặt phòng');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Đặt phòng thất bại', 'Đã xảy ra lỗi không mong muốn');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodSelector = () => {
    const defaultRate = 0.3;
    const platformShare = commissionRate?.platformShare || defaultRate;
    const depositPercentage = Math.round(platformShare * 100);

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              isFullPayment && styles.paymentOptionSelected
            ]}
            onPress={() => setIsFullPayment(true)}
          >
            <View style={styles.radioButton}>
              {isFullPayment && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Thanh toán đầy đủ</Text>
              {calculating || loadingCommission ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.paymentOptionDescription}>
                  Thanh toán toàn bộ số tiền {totalPrice.toLocaleString('vi-VN')}đ
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              !isFullPayment && styles.paymentOptionSelected
            ]}
            onPress={() => setIsFullPayment(false)}
          >
            <View style={styles.radioButton}>
              {!isFullPayment && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Đặt cọc</Text>
              {calculating || loadingCommission ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.paymentOptionDescription}>
                  Thanh toán {depositPercentage}% đặt cọc {getDepositAmount.toLocaleString('vi-VN')}đ
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRoomItem = useCallback((room) => {
    const roomPrice = getRoomPrice(room.roomID);
    const details = getDateCountsByType(room);
    const hasDateTypes = details.normal.count > 0 || details.weekend.count > 0 || details.special.count > 0;
    const togglePriceBreakdown = () => {
      setShowPriceBreakdown(prev => ({
        ...prev,
        [room.roomID]: !prev[room.roomID]
      }));
    };

    return (
      <View key={room.id || room.roomID} style={styles.roomItem}>
        <Image
          source={{ uri: room.image || 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg' }}
          style={styles.roomImage}
        />
        <View style={styles.roomDetails}>
          <View style={styles.roomInfo}>
          <Text style={styles.roomTypeName}>{room?.roomTypeName} - {room?.rentalName}</Text>
            <Text style={styles.roomNumber}>Phòng {room?.roomNumbe}</Text>
          </View>

          {calculating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.priceDetails}>
              {hasDateTypes && (
                <TouchableOpacity
                  style={styles.priceDetailsToggle}
                  onPress={togglePriceBreakdown}
                >
                  <Text style={styles.priceDetailsToggleText}>
                    {showPriceBreakdown[room.roomID] ? 'Ẩn chi tiết giá' : 'Xem chi tiết giá'}
                  </Text>
                  <Icon
                    name={showPriceBreakdown[room.roomID] ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}

              {showPriceBreakdown[room.roomID] && (
                <View style={styles.priceBreakdown}>
                  {hasDateTypes && (
                    <>
                      {details.normal.count > 0 && (
                        <View style={styles.priceBreakdownRow}>
                          <Text style={styles.priceBreakdownLabel}>Ngày thường ({details.normal.count} đêm):</Text>
                          <Text style={styles.priceBreakdownValue}>
                            {details.normal.price.toLocaleString('vi-VN')}₫
                          </Text>
                        </View>
                      )}

                      {details.weekend.count > 0 && (
                        <View style={styles.priceBreakdownRow}>
                          <Text style={styles.priceBreakdownLabel}>Cuối tuần ({details.weekend.count} đêm):</Text>
                          <Text style={styles.priceBreakdownValue}>
                            {details.weekend.price.toLocaleString('vi-VN')}₫
                          </Text>
                        </View>
                      )}

                      {details.special.count > 0 && (
                        <View style={styles.priceBreakdownRow}>
                          <Text style={styles.priceBreakdownLabel}>Ngày đặc biệt ({details.special.count} đêm):</Text>
                          <Text style={styles.priceBreakdownValue}>
                            {details.special.price.toLocaleString('vi-VN')}₫
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              <View style={styles.totalPriceRow}>
                <Text style={styles.totalPriceLabel}>Tổng giá:</Text>
                <Text style={styles.totalPriceValue}>{roomPrice?.toLocaleString('vi-VN')}₫</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }, [calculating, getRoomPrice, showPriceBreakdown, getDateCountsByType]);

  const renderSelectedRooms = () => {
    const roomsToDisplay = showAllRooms
      ? selectedRooms
      : selectedRooms.slice(0, 3);
    const hasMoreRooms = selectedRooms.length > 3;

    return (
      <>
        {roomsToDisplay.map(renderRoomItem)}

        {hasMoreRooms && !showAllRooms && (
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => setShowAllRooms(true)}
          >
            <Text style={styles.viewMoreText}>Xem tất cả {selectedRooms.length} phòng</Text>
            <Icon name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {showAllRooms && selectedRooms.length > 3 && (
          <TouchableOpacity
            style={styles.viewLessButton}
            onPress={() => setShowAllRooms(false)}
          >
            <Text style={styles.viewMoreText}>Thu gọn</Text>
            <Icon name="chevron-up" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[colors.primary, colors.primary]}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Animated.Text entering={FadeIn} style={styles.headerTitle}>
          Xác nhận đặt phòng
        </Animated.Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <Animated.View entering={FadeInDown.delay(300)} style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Phòng đã chọn</Text>
          {renderSelectedRooms()}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thời gian lưu trú</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Nhận phòng</Text>
              <Text style={styles.dateValue}>
                {selectedRooms.length > 0
                  ? new Date(selectedRooms[0].checkInDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })
                  : currentSearch?.checkInDate || 'Chưa xác định'}
              </Text>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Trả phòng</Text>
              <Text style={styles.dateValue}>
                {selectedRooms.length > 0
                  ? new Date(selectedRooms[0].checkOutDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })
                  : currentSearch?.checkOutDate || 'Chưa xác định'}
              </Text>
            </View>
          </View>
          <Text style={styles.stayDuration}>Thời gian lưu trú: {numberOfNights} đêm</Text>
        </View>

        {renderPaymentMethodSelector()}
        <View style={styles.totalContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phòng ({selectedRooms.length})</Text>
            {calculating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View>
                <Text style={styles.summaryValue}>
                  {totalPrice.toLocaleString('vi-VN')}đ
                </Text>
                <Text style={styles.summaryValueNote}>Tổng giá thuê</Text>
              </View>
            )}
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số đêm</Text>
            <Text style={styles.summaryValue}>{numberOfNights} đêm</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            {calculating || loadingCommission ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.totalPrice}>
                {isFullPayment ? totalPrice.toLocaleString('vi-VN') : getDepositAmount.toLocaleString('vi-VN')}đ
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.bookButton, (loading || calculating) && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={loading || calculating}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.bookButtonText}>
                  {isFullPayment ? 'Thanh toán đầy đủ' : 'Đặt cọc ngay'}
                </Text>
                <Icon name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Thông tin thanh toán</Text>
          <Text style={styles.infoText}>
            {isFullPayment ? (
              `• Thanh toán đầy đủ tổng giá thuê ngay bây giờ\n• Không mất phí khi hủy trước 24 giờ\n• Giá đã bao gồm thuế và phí dịch vụ`
            ) : (
              `• Đặt cọc tổng giá thuê ngay bây giờ\n• Thanh toán số tiền còn lại khi nhận phòng\n• Tiền cọc không được hoàn lại khi hủy`
            )}
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  roomItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
  },
  roomImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  roomDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  roomInfo: {
    marginBottom: 8,
  },
  roomTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roomNumber: {
    fontSize: 14,
    color: '#666',
  },
  priceDetails: {
    marginTop: 4,
  },
  priceDetailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceDetailsToggleText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 8,
  },
  totalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalPriceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPriceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dateDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  stayDuration: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  paymentOptions: {
    marginTop: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  totalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  summaryValueNote: {
    fontSize: 10,
    color: '#888',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  bookButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bookButtonDisabled: {
    opacity: 0.7,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  viewLessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  viewMoreText: {
    color: colors.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  priceBreakdown: {
    marginTop: 8,
    marginBottom: 8,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceBreakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceBreakdownValue: {
    fontSize: 14,
    color: '#333',
  },
});

export default CheckoutScreen;