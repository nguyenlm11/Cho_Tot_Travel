import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import serviceApi from '../../services/api/serviceApi';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { colors } from '../../constants/Colors';

const ServicesModal = ({ visible, onClose, selectedServices = [], onSelect, homestayId, checkInDate, checkOutDate }) => {
  const [localSelectedServices, setLocalSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  const totalBookingDays = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const fetchServices = async () => {
    if (!homestayId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await serviceApi.getAllServices(homestayId);
      setServices(result.data || []);
    } catch (error) {
      setError('Đã xảy ra lỗi khi tải dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && homestayId) {
      fetchServices();
    }
  }, [visible, homestayId]);

  useEffect(() => {
    if (visible) {
      setLocalSelectedServices(selectedServices || []);
    }
  }, [visible, selectedServices]);

  const toggleService = (service) => {
    if (service.quantity <= 0) {
      Alert.alert('Thông báo', 'Dịch vụ này đã hết hàng.');
      return;
    }
    setLocalSelectedServices(prevServices => {
      const isAlreadySelected = prevServices.some(s => s.servicesID === service.servicesID);
      if (isAlreadySelected) {
        return prevServices.filter(s => s.servicesID !== service.servicesID);
      } else {
        const dayRent = service.serviceType === 2 ? 1 : 0;
        return [...prevServices, {
          ...service,
          quantity: 1,
          dayRent: dayRent,
          rentHour: null
        }];
      }
    });
  };

  const updateServiceQuantity = (serviceId, newQuantity) => {
    if (newQuantity < 1) return;
    const service = services.find(s => s.servicesID === serviceId);
    if (!service) return;
    if (newQuantity > service.quantity) {
      Alert.alert('Thông báo', `Số lượng tối đa có thể chọn là ${service.quantity}.`);
      return;
    }
    setLocalSelectedServices(prevServices =>
      prevServices.map(service => {
        if (service.servicesID === serviceId) {
          return { ...service, quantity: newQuantity };
        }
        return service;
      })
    );
  };

  const updateDayRent = (serviceId, newDayRent) => {
    const maxDays = totalBookingDays();
    if (newDayRent < 1 || newDayRent > maxDays) return;
    setLocalSelectedServices(prevServices =>
      prevServices.map(service => {
        if (service.servicesID === serviceId) {
          return { ...service, dayRent: newDayRent };
        }
        return service;
      })
    );
  };

  const calculateTotalPrice = () => {
    return localSelectedServices.reduce((total, service) => {
      const multiplier = service.serviceType === 2 ? (service.dayRent) : 1;
      return total + (service.servicesPrice * service.quantity * multiplier);
    }, 0);
  };

  const handlePayment = () => {
    if (!onSelect) return;
    if (localSelectedServices.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một dịch vụ để thanh toán');
      return;
    }
    const invalidServices = localSelectedServices.filter(service =>
      service.serviceType === 2 && (!service.dayRent || service.dayRent < 1)
    );
    if (invalidServices.length > 0) {
      Alert.alert(
        'Thông báo',
        'Vui lòng chọn số ngày sử dụng cho các dịch vụ tính theo ngày'
      );
      return;
    }
    const servicesToSave = localSelectedServices.map(selected => {
      const originalService = services.find(s => s.servicesID === selected.servicesID);
      let startDate = null;
      let endDate = null;
      if (selected.serviceType === 2 && checkInDate) {
        const startDateTime = new Date(checkInDate);
        startDate = startDateTime.toISOString();
        if (selected.dayRent > 0) {
          const endDateTime = new Date(startDateTime);
          endDateTime.setDate(startDateTime.getDate() + selected.dayRent);
          endDate = endDateTime.toISOString();
        }
      }
      return {
        quantity: selected.quantity,
        servicesID: selected.servicesID,
        startDate: startDate,
        endDate: endDate,
        dayRent: selected.dayRent || 0,
        rentHour: null,
        servicesName: originalService?.servicesName || 'Không rõ',
        servicesPrice: originalService?.servicesPrice || 0,
        serviceType: originalService?.serviceType || 0
      };
    });
    onClose();
    onSelect(servicesToSave, true);
    console.log(servicesToSave);
  };

  const renderServiceItem = (item, index) => {
    const isSelected = localSelectedServices.some(s => s.servicesID === item.servicesID);
    const selectedService = localSelectedServices.find(s => s.servicesID === item.servicesID);
    const quantity = selectedService?.quantity || 0;
    const dayRent = selectedService?.dayRent || (item.serviceType === 2 ? 1 : 0);
    const isOutOfStock = item.quantity <= 0;

    return (
      <Animated.View
        key={item.servicesID}
        entering={FadeInDown.delay(index * 80).duration(300)}
        style={styles.serviceItemContainer}
      >
        <View
          style={[
            styles.serviceItem,
            isSelected && styles.serviceItemSelected,
            isOutOfStock && styles.serviceItemDisabled
          ]}
        >
          <View style={styles.serviceHeader}>
            {item.imageServices && item.imageServices[0] && (
              <Image
                source={{ uri: item.imageServices[0].image }}
                style={styles.serviceImage}
              />
            )}
            <View style={styles.serviceHeaderContent}>
              <Text style={styles.serviceName}>{item.servicesName}</Text>

              <View style={styles.serviceTags}>
                {item.serviceType === 2 ? (
                  <View style={styles.serviceTag}>
                    <Icon name="calendar-outline" size={12} color={colors.primary} />
                    <Text style={styles.serviceTagText}>Theo ngày</Text>
                  </View>
                ) : (
                  <View style={styles.serviceTag}>
                    <Icon name="checkmark-circle-outline" size={12} color="#4caf50" />
                    <Text style={styles.serviceTagText}>Trọn gói</Text>
                  </View>
                )}
                {isOutOfStock ? (
                  <View style={[styles.serviceTag, styles.outOfStockTag]}>
                    <Icon name="close-circle-outline" size={12} color="#ff4444" />
                    <Text style={[styles.serviceTagText, { color: '#ff4444' }]}>Hết hàng</Text>
                  </View>
                ) : (
                  <View style={styles.serviceTag}>
                    <Icon name="checkmark-circle-outline" size={12} color="#4caf50" />
                    <Text style={[styles.serviceTagText, { color: '#4caf50' }]}>Còn {item.quantity}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              onPress={() => !isOutOfStock && toggleService(item)}
              disabled={isOutOfStock}
            >
              {isSelected && <Icon name="checkmark" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>

          <Text style={styles.serviceDescription} numberOfLines={2}>{item.description}</Text>

          <View style={styles.servicePriceRow}>
            <View style={styles.priceContainer}>
              <Icon name="pricetag-outline" size={16} color={colors.primary} style={styles.priceIcon} />
              <Text style={styles.servicePriceLabel}>
                {item.servicesPrice ? item.servicesPrice.toLocaleString() : 0} đ{item.serviceType === 2 ? '/ngày' : ''}
              </Text>
            </View>

            {isSelected && (
              <View style={styles.selectedControls}>
                {item.serviceType === 2 && (
                  <View style={styles.controlGroup}>
                    <Text style={styles.controlLabel}>Số ngày:</Text>
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateDayRent(item.servicesID, dayRent - 1)}
                      >
                        <Icon name="remove" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{dayRent}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateDayRent(item.servicesID, dayRent + 1)}
                      >
                        <Icon name="add" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Số lượng:</Text>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateServiceQuantity(item.servicesID, quantity - 1)}
                    >
                      <Icon name="remove" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateServiceQuantity(item.servicesID, quantity + 1)}
                    >
                      <Icon name="add" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <Icon name="restaurant-outline" size={24} color={colors.primary} />
                <Text style={styles.title}>Dịch vụ bổ sung</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải dịch vụ...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={60} color="#ff4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchServices}
                >
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : services.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="cafe-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>Không có dịch vụ nào</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.servicesList}
                showsVerticalScrollIndicator={false}
              >
                {services.map((service, index) => renderServiceItem(service, index))}
                <View style={styles.listPadding} />
              </ScrollView>
            )}

            <View style={styles.footer}>
              {localSelectedServices.length > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.priceDetailsToggle}
                    onPress={() => setShowPriceDetails(!showPriceDetails)}
                  >
                    <Text style={styles.priceDetailsToggleText}>
                      {showPriceDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                    </Text>
                    <Icon
                      name={showPriceDetails ? 'chevron-down' : 'chevron-up'}
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>

                  {showPriceDetails && (
                    <Animated.View
                      entering={FadeIn.duration(300)}
                      exiting={FadeOut.duration(200)}
                      style={styles.priceBreakdownContainer}
                    >
                      <Text style={styles.priceBreakdownTitle}>Chi tiết dịch vụ đã chọn:</Text>
                      {localSelectedServices.map(service => (
                        <View key={service.servicesID} style={styles.priceBreakdownRow}>
                          <View style={styles.priceBreakdownLeft}>
                            <Text style={styles.priceBreakdownName} numberOfLines={1}>
                              {service.servicesName}
                            </Text>
                            <Text style={styles.priceBreakdownDetails}>
                              {service.servicesPrice.toLocaleString()} đ
                              {service.serviceType === 2 ? ` × ${service.dayRent} ngày` : ''}
                              {` × ${service.quantity}`}
                            </Text>
                          </View>
                          <Text style={styles.priceBreakdownAmount}>
                            {(service.servicesPrice * service.quantity * (service.serviceType === 2 ? service.dayRent : 1)).toLocaleString()} đ
                          </Text>
                        </View>
                      ))}
                    </Animated.View>
                  )}
                </>
              )}

              <View style={styles.totalContainer}>
                <View>
                  <Text style={styles.totalLabel}>Tổng tiền thanh toán:</Text>
                  <Text style={styles.totalCount}>
                    {localSelectedServices.length} dịch vụ đã chọn
                  </Text>
                </View>
                <Text style={styles.totalAmount}>
                  {calculateTotalPrice().toLocaleString()} đ
                </Text>
              </View>

              <TouchableOpacity
                style={styles.paymentButton}
                onPress={handlePayment}
                disabled={localSelectedServices.length === 0}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name="wallet-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.paymentButtonText}>
                    Thanh toán ngay
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  safeArea: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: colors.primary + '10',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
  },
  servicesList: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  serviceItemContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  serviceItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  serviceItemDisabled: {
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
    opacity: 0.8,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  serviceHeaderContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  serviceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  serviceTagText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 3,
  },
  outOfStockTag: {
    backgroundColor: '#ff444410',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  servicePriceRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIcon: {
    marginRight: 4,
  },
  servicePriceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  selectedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  controlGroup: {
    marginLeft: 12,
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 11,
    color: '#777',
    marginBottom: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 2,
  },
  quantityButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 10,
    minWidth: 16,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colors.primary + '10',
    padding: 12,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  paymentButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceDetailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 10,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
  },
  priceDetailsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
  priceBreakdownContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 12,
  },
  priceBreakdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceBreakdownLeft: {
    flex: 1,
    marginRight: 12,
  },
  priceBreakdownName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  priceBreakdownDetails: {
    fontSize: 12,
    color: '#666',
  },
  priceBreakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  listPadding: {
    height: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 4,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});

export default ServicesModal;