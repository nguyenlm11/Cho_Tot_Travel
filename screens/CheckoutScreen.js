import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSearch } from '../contexts/SearchContext';
import { useUser } from '../contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/Colors';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';
import bookingApi from '../services/api/bookingApi';
import ServicesModal from '../components/Modal/ServicesModal';

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const homeStayId = route.params?.homeStayId;
  const rentalId = route.params?.rentalId;
  const { currentSearch } = useSearch();
  const { userData } = useUser();
  const { getRoomsByParams, clearCart } = useCart();

  const params = {};
  if (homeStayId) params.homeStayId = homeStayId;
  if (rentalId) params.rentalId = rentalId;

  const [formData, setFormData] = useState({
    fullName: userData?.name || '',
    phone: userData?.phone || '',
    email: userData?.email || '',
  });

  const [paymentMethod, setPaymentMethod] = useState(0);
  const [loading, setLoading] = useState(false);
  const selectedRooms = getRoomsByParams(params);
  const numberOfNights = calculateNumberOfNights();
  const [selectedServices, setSelectedServices] = useState([]);
  const [servicesModalVisible, setServicesModalVisible] = useState(false);

  const calculateRoomTotal = () => {
    return selectedRooms.reduce((sum, room) => sum + (room.price || 0), 0) * numberOfNights;
  };

  const calculateServiceTotal = () => {
    return selectedServices.reduce((sum, service) => sum + (service.servicesPrice || 0), 0);
  };

  const calculateTotal = () => {
    return calculateRoomTotal() + calculateServiceTotal();
  };

  function calculateNumberOfNights() {
    if (!selectedRooms || selectedRooms.length === 0) return 1;
    const checkIn = new Date(selectedRooms[0].checkInDate);
    const checkOut = new Date(selectedRooms[0].checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  }

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleServicesChange = (newSelectedServices) => {
    setSelectedServices(newSelectedServices);
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.phone || !formData.email) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin để đặt phòng');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Thông báo', 'Email không hợp lệ');
      return false;
    }
    const phoneRegex = /^(0|\+84)(\d{9,10})$/;
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert('Thông báo', 'Số điện thoại không hợp lệ');
      return false;
    }
    return true;
  };

  const createBookingData = () => {
    if (!selectedRooms || selectedRooms.length === 0) {
      Alert.alert('Thông báo', 'Bạn chưa chọn phòng nào');
      return null;
    }

    if (!homeStayId) {
      Alert.alert('Thông báo', 'Không tìm thấy thông tin homestay');
      return null;
    }

    const bookingDetails = selectedRooms.map(room => ({
      homeStayTypeID: rentalId || room.rentalId || 0,
      roomTypeID: room.roomTypeID || 0,
      roomID: room.roomID,
      checkInDate: room.checkInDate,
      checkOutDate: room.checkOutDate
    }));

    const bookingServicesDetails = selectedServices.map(service => ({
      quantity: 1,
      servicesID: service.servicesID
    }));

    const bookingData = {
      numberOfChildren: currentSearch?.children || 0,
      numberOfAdults: currentSearch?.adults || 1,
      accountID: userData?.userID,
      homeStayID: homeStayId,
      bookingDetails: bookingDetails,
      bookingOfServices: {
        bookingServicesDetails: bookingServicesDetails
      }
    };
    console.log('Booking data:', JSON.stringify(bookingData, null, 2));
    return bookingData;
  };

  const handleBooking = async () => {
    if (!validateForm()) return;
    const bookingData = createBookingData();
    if (!bookingData) return;
    setLoading(true);
    try {
      const result = await bookingApi.createBooking(bookingData, paymentMethod);

      if (result.success) {
        clearCart();
        Alert.alert(
          'Đặt phòng thành công',
          `Mã đặt phòng của bạn là: ${result.data.bookingID || 'BK' + Date.now()}`,
          [
            {
              text: 'Xem đặt phòng',
              onPress: () => navigation.navigate('BookingList')
            },
            {
              text: 'OK',
              onPress: () => navigation.navigate('HomeTabs')
            }
          ]
        );
      } else {
        Alert.alert('Đặt phòng thất bại', result.error || 'Đã xảy ra lỗi khi đặt phòng');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Đặt phòng thất bại', 'Đã xảy ra lỗi không mong muốn');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodSelector = () => {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 0 && styles.paymentOptionSelected
            ]}
            onPress={() => setPaymentMethod(0)}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 0 && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Thanh toán đầy đủ</Text>
              <Text style={styles.paymentOptionDescription}>Thanh toán toàn bộ số tiền ngay bây giờ</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 1 && styles.paymentOptionSelected
            ]}
            onPress={() => setPaymentMethod(1)}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 1 && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Đặt cọc</Text>
              <Text style={styles.paymentOptionDescription}>Đặt cọc một phần và thanh toán phần còn lại sau</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderServicesSection = () => {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dịch vụ thêm</Text>
        <View>
          <TouchableOpacity
            style={styles.addServiceButton}
            onPress={() => setServicesModalVisible(true)}
          >
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10']}
              style={styles.addServiceButtonInner}
            >
              <Icon name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.addServiceButtonText}>
                {selectedServices.length > 0
                  ? `Đã chọn ${selectedServices.length} dịch vụ - Nhấn để sửa`
                  : 'Thêm dịch vụ'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {selectedServices.length > 0 && (
            <View style={styles.selectedServicesList}>
              {selectedServices.map(service => (
                <View
                  key={`service-${service.servicesID}`}
                  style={styles.selectedServiceItem}
                >
                  <Text style={styles.selectedServiceName}>{service.servicesName}</Text>
                  <Text style={styles.selectedServicePrice}>
                    {(service.servicesPrice || 0).toLocaleString('vi-VN')}₫
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSelectedRooms = () => {
    return selectedRooms.map(room => (
      <View key={room.id} style={styles.roomItem}>
        <Image
          source={{ uri: room.image || 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg' }}
          style={styles.roomImage}
        />
        <View style={styles.roomDetails}>
          <Text style={styles.roomTypeName}>{room.roomTypeName}</Text>
          <Text style={styles.roomNumber}>Phòng {room.roomNumber}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.roomPrice}>{room.price || '0'}₫</Text>
            <Text style={styles.priceUnit}>/đêm</Text>
          </View>
        </View>
      </View>
    ));
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
        {/* Phòng đã chọn */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Phòng đã chọn</Text>
          {renderSelectedRooms()}
        </View>

        {/* Thời gian lưu trú */}
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

        {/* Thông tin người đặt */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin người đặt</Text>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => handleInputChange('fullName', text)}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#999"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Nhập email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
        {renderServicesSection()}
        {renderPaymentMethodSelector()}

        {/* Tổng cộng */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số phòng:</Text>
            <Text style={styles.summaryValue}>{selectedRooms.length} phòng</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số đêm:</Text>
            <Text style={styles.summaryValue}>{numberOfNights} đêm</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền phòng:</Text>
            <Text style={styles.summaryValue}>{calculateRoomTotal() || '0'}₫</Text>
          </View>

          {selectedServices.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng tiền dịch vụ:</Text>
              <Text style={styles.summaryValue}>{calculateServiceTotal() || '0'}₫</Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalPrice}>{calculateTotal() || '0'}₫</Text>
          </View>

          {paymentMethod === 1 && (
            <View style={styles.summaryRow}>
              <Text style={styles.depositLabel}>Đặt cọc (30%):</Text>
              <Text style={styles.depositPrice}>{Math.round(calculateTotal() * 0.3) || '0'}₫</Text>
            </View>
          )}
        </View>

        {/* Nút đặt phòng */}
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.disabledButton]}
          onPress={handleBooking}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.bookButtonText}>
                  {paymentMethod === 0 ? 'Thanh toán đầy đủ' : 'Đặt cọc ngay'}
                </Text>
                <Icon name="chevron-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Thông tin thanh toán</Text>
          <Text style={styles.infoText}>
            {paymentMethod === 0 ? (
              `• Thanh toán đầy đủ ngay bây giờ\n• Không mất phí khi hủy trước 24 giờ\n• Giá đã bao gồm thuế và phí dịch vụ`
            ) : (
              `• Đặt cọc 30% ngay bây giờ\n• Thanh toán số tiền còn lại khi nhận phòng\n• Tiền cọc không được hoàn lại khi hủy`
            )}
          </Text>
        </View>
      </Animated.View>

      {/* Thêm Modal dịch vụ */}
      <ServicesModal
        visible={servicesModalVisible}
        onClose={() => setServicesModalVisible(false)}
        selectedServices={selectedServices}
        onServicesChange={handleServicesChange}
        homestayId={homeStayId}
      />
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
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  roomDetails: {
    flex: 1,
    marginLeft: 12,
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
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
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
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  addServiceButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  addServiceButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  addServiceButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  selectedServicesList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  selectedServiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedServiceName: {
    fontSize: 15,
    color: '#333',
  },
  selectedServicePrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
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
  summaryCard: {
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
  summaryDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
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
  depositLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    fontStyle: 'italic',
  },
  depositPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
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
  disabledButton: {
    opacity: 0.7,
  },
  gradientButton: {
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
});

export default CheckoutScreen;