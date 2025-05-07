import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, SafeAreaView, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import serviceApi from '../../services/api/serviceApi';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../constants/Colors';
import CalendarModal from './CalendarModal';

const ServicesModal = ({ visible, onClose, selectedServices = [], onSelect, homestayId, checkInDate, checkOutDate }) => {
  const [localSelectedServices, setLocalSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDates, setSelectedDates] = useState({});
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  // Memoize fetchServices
  const fetchServices = useCallback(async () => {
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
  }, [homestayId]);

  // Fetch services khi modal hiển thị
  useEffect(() => {
    if (visible && homestayId) {
      fetchServices();
    }
  }, [visible, homestayId, fetchServices]);

  // Khởi tạo local state khi modal hiển thị, chỉ cập nhật nếu cần
  useEffect(() => {
    if (visible) {
      console.log('Modal visible, initializing state');
      // Chỉ cập nhật nếu localSelectedServices khác
      if (JSON.stringify(localSelectedServices) !== JSON.stringify(selectedServices)) {
        console.log('Updating localSelectedServices');
        setLocalSelectedServices(selectedServices);
      }

      // Chỉ cập nhật nếu selectedDates khác
      const dates = {};
      selectedServices.forEach(service => {
        if (service.startDate && service.endDate) {
          dates[service.servicesID] = {
            startDate: service.startDate,
            endDate: service.endDate
          };
        }
      });
      if (JSON.stringify(selectedDates) !== JSON.stringify(dates)) {
        console.log('Updating selectedDates');
        setSelectedDates(dates);
      }
    }
  }, [visible, selectedServices]);

  // Memoize toggleService
  const toggleService = useCallback((service) => {
    console.log('Toggle service:', service.servicesID);
    setLocalSelectedServices(prevServices => {
      const isAlreadySelected = prevServices.some(
        s => s.servicesID === service.servicesID
      );

      if (isAlreadySelected) {
        return prevServices.filter(s => s.servicesID !== service.servicesID);
      } else {
        return [...prevServices, {
          ...service,
          quantity: 1,
          startDate: null,
          endDate: null,
          rentHour: null
        }];
      }
    });
  }, []);

  // Memoize updateServiceQuantity
  const updateServiceQuantity = useCallback((serviceId, newQuantity) => {
    if (newQuantity < 1) return;

    const service = services.find(s => s.servicesID === serviceId);
    if (newQuantity > service.quantity) return;

    setLocalSelectedServices(prevServices =>
      prevServices.map(service => {
        if (service.servicesID === serviceId) {
          return { ...service, quantity: newQuantity };
        }
        return service;
      })
    );
  }, [services]);

  // Memoize validateServiceDates
  const validateServiceDates = useCallback((service) => {
    if (service.serviceType !== 2) return true;
    if (!service.startDate || !service.endDate) return false;

    const serviceStart = new Date(service.startDate);
    const serviceEnd = new Date(service.endDate);
    const bookingStart = new Date(checkInDate);
    const bookingEnd = new Date(checkOutDate);

    serviceStart.setHours(0, 0, 0, 0);
    serviceEnd.setHours(0, 0, 0, 0);
    bookingStart.setHours(0, 0, 0, 0);
    bookingEnd.setHours(0, 0, 0, 0);

    return serviceStart >= bookingStart && serviceEnd <= bookingEnd;
  }, [checkInDate, checkOutDate]);

  // Memoize handleDateSelect
  const handleDateSelect = useCallback((dateObject) => {
    if (!selectedServiceId || !dateObject?.dateString || !dateObject?.checkOutDateString) {
      setCalendarVisible(false);
      return;
    }

    const newStartDate = new Date(dateObject.dateString);
    const newEndDate = new Date(dateObject.checkOutDateString);
    const bookingStart = new Date(checkInDate);
    const bookingEnd = new Date(checkOutDate);

    newStartDate.setHours(0, 0, 0, 0);
    newEndDate.setHours(0, 0, 0, 0);
    bookingStart.setHours(0, 0, 0, 0);
    bookingEnd.setHours(0, 0, 0, 0);

    if (newStartDate < bookingStart || newEndDate > bookingEnd) {
      Alert.alert(
        'Thông báo',
        'Ngày sử dụng dịch vụ phải nằm trong khoảng thời gian đặt phòng ' +
        `(${bookingStart.toLocaleDateString('vi-VN')} - ${bookingEnd.toLocaleDateString('vi-VN')})`
      );
      return;
    }

    setLocalSelectedServices(prevServices =>
      prevServices.map(service => {
        if (service.servicesID === selectedServiceId) {
          return {
            ...service,
            startDate: newStartDate.toISOString(),
            endDate: newEndDate.toISOString()
          };
        }
        return service;
      })
    );
    setCalendarVisible(false);
  }, [selectedServiceId, checkInDate, checkOutDate]);

  // Memoize openCalendar
  const openCalendar = useCallback((serviceId) => {
    setSelectedServiceId(serviceId);
    setCalendarVisible(true);
  }, []);

  // Memoize calculateTotalPrice
  const calculateTotalPrice = useCallback(() => {
    return localSelectedServices.reduce((total, service) => {
      return total + (service.servicesPrice * service.quantity);
    }, 0);
  }, [localSelectedServices]);

  // Memoize handleSave
  const handleSave = useCallback(() => {
    if (onSelect) {
      const invalidServices = localSelectedServices.filter(service => {
        if (service.serviceType === 2) {
          if (!service.startDate || !service.endDate) {
            return true;
          }
          if (!validateServiceDates(service)) {
            return true;
          }
        }
        return false;
      });

      if (invalidServices.length > 0) {
        Alert.alert(
          'Thông báo',
          'Vui lòng chọn ngày sử dụng dịch vụ trong khoảng thời gian đặt phòng ' +
          `(${new Date(checkInDate).toLocaleDateString('vi-VN')} - ${new Date(checkOutDate).toLocaleDateString('vi-VN')})`
        );
        return;
      }

      const servicesToSave = localSelectedServices.map(selected => {
        const originalService = services.find(s => s.servicesID === selected.servicesID);
        return {
          quantity: selected.quantity,
          servicesID: selected.servicesID,
          startDate: selected.serviceType === 0 ? null : selected.startDate,
          endDate: selected.serviceType === 0 ? null : selected.endDate,
          rentHour: null,
          servicesName: originalService?.servicesName || 'Không rõ',
          servicesPrice: originalService?.servicesPrice || 0,
          serviceType: originalService?.serviceType || 0
        };
      });
      console.log('servicesToSave', servicesToSave);
      onSelect(servicesToSave);
      onClose();
    }
  }, [localSelectedServices, services, onSelect, onClose, checkInDate, checkOutDate, validateServiceDates]);

  // Memoize formatDate
  const formatDate = useCallback((dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  // Memoize renderServiceItem
  const renderServiceItem = useCallback((item, index) => {
    if (item.quantity <= 0) return null;

    const isSelected = localSelectedServices.some(
      s => s.servicesID === item.servicesID
    );
    const selectedService = localSelectedServices.find(
      s => s.servicesID === item.servicesID
    );
    const quantity = selectedService?.quantity || 0;
    const startDate = selectedService?.startDate;
    const endDate = selectedService?.endDate;

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    return (
      <Animated.View
        key={item.servicesID}
        entering={FadeInDown.delay(index * 100).duration(500)}
        style={styles.serviceItemContainer}
      >
        <TouchableOpacity
          style={[styles.serviceItem, isSelected && styles.serviceItemSelected]}
          onPress={() => {
            console.log('Service item pressed:', item.servicesID);
            toggleService(item);
          }}
        >
          {item.imageServices && item.imageServices[0] && (
            <Image
              source={{ uri: item.imageServices[0].image }}
              style={styles.serviceImage}
            />
          )}
          <View style={styles.serviceContent}>
            <View style={styles.serviceLeft}>
              <Text style={styles.serviceName}>{item.servicesName}</Text>
              <Text style={styles.serviceDescription}>{item.description}</Text>
              <Text style={styles.serviceQuantity}>
                Số lượng còn lại: {item.quantity}
              </Text>
              {isSelected && item.serviceType === 2 && (
                <View style={styles.dateContainer}>
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      (!formattedStartDate || !formattedEndDate) && styles.dateButtonRequired
                    ]}
                    onPress={() => openCalendar(item.servicesID)}
                  >
                    <Text style={styles.dateLabel}>
                      Thời gian sử dụng:
                      <Text style={styles.requiredStar}> *</Text>
                    </Text>
                    <Text style={[
                      styles.dateText,
                      (!formattedStartDate || !formattedEndDate) && styles.datePlaceholder
                    ]}>
                      {formattedStartDate && formattedEndDate
                        ? `${formattedStartDate} - ${formattedEndDate}`
                        : 'Chọn ngày'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.serviceRight}>
              <Text style={styles.servicePrice}>
                {(item.servicesPrice || 0).toLocaleString()} đ
                {item.serviceType === 2 && <Text style={styles.perDay}>/ngày</Text>}
              </Text>
              {isSelected && (
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateServiceQuantity(item.servicesID, quantity - 1)}
                  >
                    <Icon name="remove" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateServiceQuantity(item.servicesID, quantity + 1)}
                  >
                    <Icon name="add" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Icon name="checkmark" size={16} color="#fff" />}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [localSelectedServices, toggleService, openCalendar, updateServiceQuantity, formatDate]);

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Dịch vụ bổ sung</Text>
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
                <Text style={styles.emptyText}>Không có dịch vụ nào</Text>
              </View>
            ) : (
              <ScrollView style={styles.servicesList}>
                {services.map((service, index) => renderServiceItem(service, index))}
              </ScrollView>
            )}

            <View style={styles.footer}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Tổng tiền:</Text>
                <Text style={styles.totalPrice}>
                  {calculateTotalPrice().toLocaleString()} đ
                </Text>
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.gradient}
                >
                  <Text style={styles.saveButtonText}>
                    Lưu ({localSelectedServices.length})
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
        <CalendarModal
          visible={calendarVisible}
          onClose={() => setCalendarVisible(false)}
          onDateSelect={handleDateSelect}
        />
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
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  servicesList: {
    flex: 1,
    padding: 16,
  },
  serviceItemContainer: {
    marginBottom: 12,
  },
  serviceItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  serviceContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceLeft: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  serviceQuantity: {
    fontSize: 12,
    color: '#888',
  },
  serviceRight: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  saveButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  }
});

export default ServicesModal;