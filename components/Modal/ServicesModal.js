import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/Colors';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function ServicesModal({ visible, onClose, selectedServices, onServicesChange }) {
  const [localSelectedServices, setLocalSelectedServices] = useState([]);

  useEffect(() => {
    setLocalSelectedServices(selectedServices);
  }, [selectedServices]);

  const services = [
    {
      id: 1,
      name: 'Dịch vụ giặt ủi',
      price: 150000,
      icon: 'shirt-outline',
      description: 'Giặt ủi trong ngày'
    },
    {
      id: 2,
      name: 'Dịch vụ spa',
      price: 300000,
      icon: 'flower-outline',
      description: 'Massage và chăm sóc da'
    },
    {
      id: 3,
      name: 'Dịch vụ ăn sáng',
      price: 100000,
      icon: 'restaurant-outline',
      description: 'Buffet sáng từ 6:00-10:00'
    },
    {
      id: 4,
      name: 'Dịch vụ đưa đón',
      price: 200000,
      icon: 'car-outline',
      description: 'Đưa đón sân bay'
    },
    {
      id: 5,
      name: 'Dịch vụ gym',
      price: 80000,
      icon: 'barbell-outline',
      description: 'Phòng tập gym hiện đại'
    },
  ];

  const toggleService = (service) => {
    let newSelected;
    if (localSelectedServices.find(s => s.id === service.id)) {
      newSelected = localSelectedServices.filter(s => s.id !== service.id);
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
    const isSelected = localSelectedServices.find(s => s.id === item.id);

    return (
      <Animated.View
        entering={FadeInDown.delay(item.id * 100)}
      >
        <TouchableOpacity
          style={[styles.serviceItem, isSelected && styles.serviceItemSelected]}
          onPress={() => toggleService(item)}
        >
          <View style={styles.serviceLeft}>
            <View style={[styles.serviceIconContainer, isSelected && styles.serviceIconContainerSelected]}>
              <Icon name={item.icon} size={24} color={isSelected ? '#fff' : colors.primary} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{item.name}</Text>
              <Text style={styles.serviceDescription}>{item.description}</Text>
            </View>
          </View>
          <View style={styles.serviceRight}>
            <Text style={[styles.servicePrice, isSelected && styles.servicePriceSelected]}>
              {item.price.toLocaleString()} đ
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
      animationType="slide"
      transparent={true}
    >
      <Animated.View style={styles.container}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={[colors.primary, colors.primary + 'CC']}
            style={styles.header}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Icon name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Animated.Text
              entering={FadeIn}
              style={styles.headerTitle}
            >
              Dịch vụ thêm
            </Animated.Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Lưu</Text>
            </TouchableOpacity>
          </LinearGradient>

          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.content}
          >
            <FlatList
              data={services}
              renderItem={renderService}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.servicesList}
            />
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  servicesList: {
    padding: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceItemSelected: {
    backgroundColor: colors.primary + '10',
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary + '10',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceIconContainerSelected: {
    backgroundColor: colors.primary,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
  },
  serviceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 15,
    color: '#666',
    marginRight: 12,
    fontWeight: '500',
  },
  servicePriceSelected: {
    color: colors.primary,
    fontWeight: '600',
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
});
