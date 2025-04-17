import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, SafeAreaView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import serviceApi from '../../services/api/serviceApi';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../constants/Colors';
import CalendarModal from './CalendarModal';

const ServicesModal = ({ visible, onClose, selectedServices = [], onSelect, homestayId, homeStayId }) => {
  const [localSelectedServices, setLocalSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDates, setSelectedDates] = useState({});
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  const actualHomeStayId = homestayId || homeStayId;

  useEffect(() => {
    if (visible && actualHomeStayId) {
      fetchServices();
    }
  }, [visible, actualHomeStayId]);

  useEffect(() => {
    if (visible) {
      setLocalSelectedServices(selectedServices);
      const dates = {};
      selectedServices.forEach(service => {
        dates[service.servicesID] = {
          date: service.date
        };
      });
      setSelectedDates(dates);
    }
  }, [visible, selectedServices]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await serviceApi.getAllServices(actualHomeStayId);
      setServices(result.data || []);
    } catch (error) {
      setError('Đã xảy ra lỗi khi tải dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service) => {
    const isAlreadySelected = localSelectedServices.some(
      s => s.servicesID === service.servicesID
    );
    const newSelected = isAlreadySelected
      ? localSelectedServices.filter(s => s.servicesID !== service.servicesID)
      : [...localSelectedServices, {
        ...service,
        quantity: 1,
        startDate: null,
        endDate: null,
        rentHour: 0
      }];
    setLocalSelectedServices(newSelected);
  };

  const updateServiceQuantity = (serviceId, newQuantity) => {
    if (newQuantity < 1) return;

    const service = services.find(s => s.servicesID === serviceId);
    if (newQuantity > service.quantity) return;

    const updatedServices = localSelectedServices.map(service => {
      if (service.servicesID === serviceId) {
        return { ...service, quantity: newQuantity };
      }
      return service;
    });
    setLocalSelectedServices(updatedServices);
  };

  const handleDateSelect = (dateObject) => {
    console.log('handleDateSelect - Date object received:', dateObject);

    const actualStartDateString = dateObject?.dateString;
    const actualEndDateString = dateObject?.checkOutDateString;
    console.log('handleDateSelect - Extracted startDateString:', actualStartDateString);
    console.log('handleDateSelect - Extracted endDateString:', actualEndDateString);

    if (selectedServiceId && actualStartDateString && actualEndDateString) {
      const newStartDate = new Date(actualStartDateString);
      const newEndDate = new Date(actualEndDateString);
      console.log('handleDateSelect - Parsed Start Date:', newStartDate);
      console.log('handleDateSelect - Parsed End Date:', newEndDate);

      if (isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
        console.error('handleDateSelect - Invalid date strings extracted:', actualStartDateString, actualEndDateString);
        setCalendarVisible(false);
        return;
      }

      const updatedServices = localSelectedServices.map(service => {
        if (service.servicesID === selectedServiceId) {
          return {
            ...service,
            startDate: newStartDate.toISOString(),
            endDate: newEndDate.toISOString()
          };
        }
        return service;
      });
      setLocalSelectedServices(updatedServices);
      setCalendarVisible(false);
    } else {
      console.log('handleDateSelect - Condition not met (selectedServiceId or dates missing)');
      setCalendarVisible(false);
    }
  };

  const openCalendar = (serviceId) => {
    setSelectedServiceId(serviceId);
    setCalendarVisible(true);
  };

  const calculateTotalPrice = () => {
    return localSelectedServices.reduce((total, service) => {
      return total + (service.servicesPrice * service.quantity);
    }, 0);
  };

  const handleSave = () => {
    if (onSelect) {
      const servicesToSave = localSelectedServices.map(selected => {
        const originalService = services.find(s => s.servicesID === selected.servicesID);
        return {
          quantity: selected.quantity,
          servicesID: selected.servicesID,
          startDate: selected.startDate,
          endDate: selected.endDate,
          rentHour: selected.rentHour || 0,
          servicesName: originalService?.servicesName || 'Không rõ',
          servicesPrice: originalService?.servicesPrice || 0
        };
      });
      console.log('ServicesModal - Saving services with display info:', servicesToSave);
      onSelect(servicesToSave);
    }
    onClose();
  };

  const formatDate = (dateString) => {
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
  };

  const renderServiceItem = (item, index) => {
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
          onPress={() => toggleService(item)}
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
              {isSelected && (
                <View style={styles.dateContainer}>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => openCalendar(item.servicesID)}
                  >
                    <Text style={styles.dateLabel}>Thời gian sử dụng:</Text>
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
  };

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
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  dateContainer: {
    marginTop: 8,
    borderRadius: 8,
  },
  dateButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dateLabel: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  datePlaceholder: {
    color: '#999',
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
});

export default ServicesModal;
