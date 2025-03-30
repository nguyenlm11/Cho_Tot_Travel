import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/Colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import serviceApi from '../../services/api/serviceApi';

export default function ServicesModal({ visible, onClose, selectedServices, onServicesChange, homestayId }) {
  const [localSelectedServices, setLocalSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && homestayId) {
      fetchServices();
    }
  }, [visible, homestayId]);

  useEffect(() => {
    if (visible) {
      const uniqueServices = [];
      const serviceIDs = new Set();
      if (selectedServices && selectedServices.length > 0) {
        selectedServices.forEach(service => {
          if (service.servicesID && !serviceIDs.has(service.servicesID)) {
            serviceIDs.add(service.servicesID);
            uniqueServices.push(service);
          }
        });
      }
      setLocalSelectedServices(uniqueServices);
    }
  }, [visible, selectedServices]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await serviceApi.getAllServices(homestayId);
      if (result.success) {
        setServices(result.data || []);
      } else {
        setError(result.error || 'Không thể tải dịch vụ');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Đã xảy ra lỗi khi tải dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service) => {
    let newSelected;
    const isAlreadySelected = localSelectedServices.some(
      s => s.servicesID === service.servicesID
    );
    if (isAlreadySelected) {
      newSelected = localSelectedServices.filter(
        s => s.servicesID !== service.servicesID
      );
    } else {
      newSelected = [...localSelectedServices, service];
    }
    setLocalSelectedServices(newSelected);
  };

  const handleSave = () => {
    onServicesChange(localSelectedServices);
    onClose();
  };

  const renderService = ({ item }) => {
    const isSelected = localSelectedServices.some(
      s => s.servicesID === item.servicesID
    );
    return (
      <Animated.View
        entering={FadeInDown.delay((item.servicesID || 0) * 50).springify()}
      >
        <TouchableOpacity
          style={[styles.serviceItem, isSelected && styles.serviceItemSelected]}
          onPress={() => toggleService(item)}
        >
          <View style={styles.serviceLeft}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{item.servicesName}</Text>
              <Text style={styles.serviceDescription}>{item.description || "Không có mô tả"}</Text>
            </View>
          </View>
          <View style={styles.serviceRight}>
            <Text style={[styles.servicePrice, isSelected && styles.servicePriceSelected]}>
              {(item.servicesPrice || 0).toLocaleString()} đ
            </Text>
            <View style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected
            ]}>
              {isSelected && <Icon name="checkmark" size={16} color="#fff" />}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            entering={FadeInDown}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dịch vụ bổ sung</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải dịch vụ...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={40} color="#e53935" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchServices}
                >
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : services.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có dịch vụ nào cho homestay này</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={services}
                  renderItem={renderService}
                  keyExtractor={item => item.servicesID.toString()}
                  contentContainerStyle={styles.servicesList}
                  showsVerticalScrollIndicator={false}
                />

                <View style={styles.footer}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <LinearGradient
                      colors={[colors.primary, colors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>
                        {localSelectedServices.length > 0
                          ? `Chọn ${localSelectedServices.length} dịch vụ`
                          : 'Không chọn dịch vụ'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    width: '90%',
    maxHeight: '80%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  servicesList: {
    padding: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  serviceItemSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  serviceLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfo: {
    marginLeft: 0,
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
  },
  serviceRight: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  servicePriceSelected: {
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
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
