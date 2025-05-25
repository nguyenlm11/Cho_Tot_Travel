import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';
const DetailRoomScreen = ({ route }) => {
  const { image, title, size, guests, beds, price, rentalName } = route.params;
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: image }} style={styles.mainImage} />
      <View style={styles.contentContainer}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomTitle}>{title}</Text>
          <Text style={styles.rentalName}>Căn hộ: {rentalName}</Text>
          <Text style={styles.roomSize}>{size}</Text>
          <View style={styles.infoRow}><FontAwesome5 name="user-friends" size={16} /><Text style={styles.infoText}>{guests}</Text></View>
          <View style={styles.infoRow}><FontAwesome5 name="bed" size={16} /><Text style={styles.infoText}>{beds}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện nghi chính</Text>
          <Text style={styles.bulletPoint}>• Dọn phòng</Text>
          <Text style={styles.bulletPoint}>• Dịch vụ chỉnh trang phòng buổi tối</Text>
          <Text style={styles.bulletPoint}>• Dịch vụ phòng 24h</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện nghi phòng</Text>
          <Text style={styles.bulletPoint}>• Máy lạnh</Text>
          <Text style={styles.bulletPoint}>• Nước đóng chai miễn phí</Text>
          <Text style={styles.bulletPoint}>• Ấm điện</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trang bị phòng tắm</Text>
          <Text style={styles.bulletPoint}>• Bồn tắm</Text>
          <Text style={styles.bulletPoint}>• Vòi tắm đứng</Text>
          <Text style={styles.bulletPoint}>• Đồ vệ sinh cá nhân</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Về phòng này</Text>
          <Text style={styles.bulletPoint}>• Food & Drink - 24-hour room service, minibar, and free bottled water</Text>
          <Text style={styles.bulletPoint}>• Sleep - Premium bedding, blackout drapes/curtains, and turndown service</Text>
        </View>

        <View style={styles.pricingSection}>
          <Text style={styles.dateText}>Ngày: 02/02/2022 - 04/02/2022</Text>
          <Text style={styles.detailText}>Số phòng: 2</Text>
          <Text style={styles.detailText}>2 Phòng/đêm: 3.600.000 đ</Text>
          <Text style={styles.detailText}>Giá tiền cho 2 đêm: 7.200.000 đ</Text>
          <Text style={styles.totalPrice}>Tổng giá tiền: 8.000.000 đ</Text>
          <Text style={styles.taxInfo}>Đã bao gồm thuế</Text>
        </View>

        <TouchableOpacity style={styles.bookingButton} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.buttonText}>Đặt phòng</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mainImage: {
    width: '100%',
    height: 200,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  roomInfo: {
    marginBottom: 16,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3
  },
  roomSize: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    marginBottom: 4,
  },
  pricingSection: {
    marginTop: 16,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 8,
  },
  taxInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  bookingButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rentalName: {
    fontSize: 15,
    color: colors.primary,
    marginBottom: 6,
    fontWeight: '500'
  },
});

export default DetailRoomScreen;