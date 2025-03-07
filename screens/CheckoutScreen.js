import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSearch } from '../contexts/SearchContext';
import ServicesModal from '../components/Modal/ServicesModal';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/Colors';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import WebView from 'react-native-webview';
import axios from 'axios';
// import { BASE_URL } from '../config';

const CheckoutScreen = () => {
  const { currentSearch } = useSearch();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
  });
  const [isServicesModalVisible, setIsServicesModalVisible] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('vnpay');
  const navigation = useNavigation();

  const handleServicesChange = (services) => {
    setSelectedServices(services);
  };

  const handleCheckout = async () => {
    if (!formData.fullName || !formData.phone || !formData.email) {
      alert('Vui lòng điền đầy đủ thông tin người đặt!');
      return;
    }

    if (!selectedPaymentMethod) {
      alert('Vui lòng chọn phương thức thanh toán!');
      return;
    }

    const totalAmount =
      500000 * (currentSearch?.numberOfNights || 0) +
      selectedServices.reduce((total, service) => total + parseInt(service.price), 0);

    const checkoutData = {
      orderInfo: `Thanh toán đặt phòng tại The Imperial Vũng Tàu - ${formData.fullName}`,
      amount: totalAmount,
      // returnUrl: `${BASE_URL}/payment-return`,
      paymentMethod: selectedPaymentMethod,
      customerInfo: formData,
      bookingDetails: {
        rooms: currentSearch?.rooms,
        nights: currentSearch?.numberOfNights,
        adults: currentSearch?.adults,
        children: currentSearch?.children,
        checkInDate: currentSearch?.checkInDate,
        checkOutDate: currentSearch?.checkOutDate,
        services: selectedServices,
      },
    };

    setLoading(true);
    // try {
    //   const response = await axios.post(`${BASE_URL}/create-payment`, checkoutData, {
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     timeout: 10000,
    //   });
    //   setPaymentUrl(response.data.paymentUrl);
    // } catch (error) {
    //   if (error.code === 'ECONNABORTED') {
    //     alert('Hết thời gian kết nối đến server. Vui lòng thử lại!');
    //   } else if (error.response) {
    //     alert(`Lỗi từ server: ${error.response.data.message || 'Không xác định'}`);
    //   } else {
    //     alert('Không thể kết nối đến server. Kiểm tra mạng của bạn!');
    //   }
    //   console.error('Lỗi khi tạo thanh toán:', error);
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleWebViewNavigation = (navState) => {
    const { url } = navState;
    if (url.includes('imperial-hotel-app.herokuapp.com/payment-return')) {
      const params = new URLSearchParams(url.split('?')[1]);
      const responseCode = params.get('vnp_ResponseCode');
      setPaymentUrl(null);
      if (responseCode === '00') {
        alert('Thanh toán thành công!');
        navigation.navigate('BookingSuccess', {
          bookingDetails: {
            ...formData,
            paymentMethod: selectedPaymentMethod,
            totalAmount: (
              500000 * (currentSearch?.numberOfNights || 0) +
              selectedServices.reduce((total, service) => total + parseInt(service.price), 0)
            ).toLocaleString(),
          },
        });
      } else {
        alert(`Thanh toán thất bại! Mã lỗi: ${responseCode}`);
        navigation.navigate('BookingFailed', { errorCode: responseCode });
      }
    }
  };

  if (paymentUrl) {
    return (
      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleWebViewNavigation}
          style={styles.webview}
        />
      </View>
    );
  }

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
        {/* Hotel Info Card */}
        <View style={styles.card}>
          <Image
            source={{ uri: 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg' }}
            style={styles.hotelImage}
          />
          <View style={styles.hotelDetails}>
            <Text style={styles.hotelName}>Smile Apartment District 2</Text>
            <View style={styles.infoRow}>
              <Icon name="bed-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                {currentSearch?.rooms} phòng • {currentSearch?.numberOfNights} đêm
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="people-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                {currentSearch?.adults} người lớn
                {currentSearch?.children > 0 ? `, ${currentSearch.children} trẻ em` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Check-in/Check-out Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Thời gian đặt phòng</Text>
          </View>
          <View style={styles.dateRow}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Ngày nhận phòng</Text>
              <View style={styles.dateContent}>
                <Text style={styles.dateText}>{currentSearch?.checkInDate}</Text>
              </View>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Ngày trả phòng</Text>
              <View style={styles.dateContent}>
                <Text style={styles.dateText}>{currentSearch?.checkOutDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="restaurant-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Dịch vụ thêm</Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsServicesModalVisible(true)}
          >
            <Icon name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.addButtonText}>Thêm dịch vụ</Text>
          </TouchableOpacity>

          {selectedServices.length > 0 && (
            <View style={styles.servicesList}>
              {selectedServices.map((service) => (
                <View key={service.id} style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                  </View>
                  <Text style={styles.servicePrice}>{service.price.toLocaleString()} đ</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="person-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Thông tin người đặt</Text>
          </View>
          <View style={styles.inputContainer}>
            <Icon name="person-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              placeholderTextColor="#999"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            />
          </View>
          <View style={styles.inputContainer}>
            <Icon name="call-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
          </View>
          <View style={styles.inputContainer}>
            <Icon name="mail-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              value={formData.email}
              autoCapitalize="none"
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="wallet-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              selectedPaymentMethod === 'vnpay' && styles.paymentMethodSelected
            ]}
            onPress={() => setSelectedPaymentMethod('vnpay')}
          >
            <View style={styles.paymentMethodLeft}>
              <Image
                source={{ uri: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR.png' }}
                style={styles.paymentMethodIcon}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.paymentMethodName}>VNPay</Text>
                <Text style={styles.paymentMethodDesc}>Thanh toán qua VNPay QR hoặc thẻ ATM/Visa/Master</Text>
              </View>
            </View>
            <View style={[
              styles.paymentRadio,
              selectedPaymentMethod === 'vnpay' && styles.paymentRadioSelected
            ]}>
              {selectedPaymentMethod === 'vnpay' && (
                <View style={styles.paymentRadioInner} />
              )}
            </View>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              selectedPaymentMethod === 'cod' && styles.paymentMethodSelected
            ]}
            onPress={() => setSelectedPaymentMethod('cod')}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={styles.codIconContainer}>
                <Icon name="cash-outline" size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.paymentMethodName}>Thanh toán khi nhận phòng</Text>
                <Text style={styles.paymentMethodDesc}>Thanh toán trực tiếp tại lễ tân khách sạn</Text>
              </View>
            </View>
            <View style={[
              styles.paymentRadio,
              selectedPaymentMethod === 'cod' && styles.paymentRadioSelected
            ]}>
              {selectedPaymentMethod === 'cod' && (
                <View style={styles.paymentRadioInner} />
              )}
            </View>
          </TouchableOpacity> */}
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="card-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giá phòng</Text>
            <Text style={styles.summaryValue}>
              {(576000 * (currentSearch?.numberOfNights || 0)).toLocaleString()} đ
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dịch vụ thêm</Text>
            <Text style={styles.summaryValue}>
              {selectedServices
                .reduce((total, service) => total + parseInt(service.price), 0)
                .toLocaleString()} đ
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalAmount}>
              {(
                576000 * (currentSearch?.numberOfNights || 0) +
                selectedServices.reduce((total, service) => total + parseInt(service.price), 0)
              ).toLocaleString()} đ
            </Text>
          </View>
        </View>

        {/* Confirmation */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.confirmationRow}
            onPress={() => setIsConfirmed(!isConfirmed)}
          >
            <View
              style={[styles.checkbox, isConfirmed && styles.checkboxSelected]}
            >
              {isConfirmed && <Icon name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.confirmationText}>
              Tôi xác nhận thông tin đặt phòng trên là chính xác
            </Text>
          </TouchableOpacity>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (!isConfirmed || loading) && styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={!isConfirmed || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={[
                styles.checkoutButtonText,
                (!isConfirmed || loading) && styles.checkoutButtonTextDisabled,
              ]}
            >
              {selectedPaymentMethod === 'vnpay' ? 'Thanh toán ngay' : 'Xác nhận đặt phòng'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <ServicesModal
        visible={isServicesModalVisible}
        onClose={() => setIsServicesModalVisible(false)}
        selectedServices={selectedServices}
        onServicesChange={handleServicesChange}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    marginTop: -20,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  hotelImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  hotelDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateBlock: {
    flex: 1,
    marginHorizontal: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
  },
  servicesList: {
    marginTop: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceName: {
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
  },
  servicePrice: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  paymentMethodOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  paymentMethodSelected: {
    borderColor: colors.primary,
    backgroundColor: '#f0f7ff',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  codIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentMethodDesc: {
    fontSize: 13,
    color: '#666',
  },
  paymentRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentRadioSelected: {
    borderColor: colors.primary,
  },
  paymentRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
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
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  confirmationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#f0f0f0',
    elevation: 0,
    shadowOpacity: 0,
  },
  checkoutButtonTextDisabled: {
    color: '#999',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default CheckoutScreen;