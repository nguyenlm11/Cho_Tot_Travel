import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const notificationData = [
  {
    id: '1',
    title: 'Đặt phòng thành công',
    message: 'Bạn đã đặt phòng thành công tại Sống Xanh Homestay.',
    time: '2 giờ trước',
    read: false,
    type: 'booking'
  },
  {
    id: '2',
    title: 'Khuyến mãi mới',
    message: 'Giảm 20% cho đặt phòng trong tuần này.',
    time: '1 ngày trước',
    read: true,
    type: 'promo'
  },
  {
    id: '3',
    title: 'Đánh giá',
    message: 'Bạn có thể đánh giá kỳ nghỉ tại Sông Hồng Homestay.',
    time: '3 ngày trước',
    read: true,
    type: 'review'
  },
  {
    id: '4',
    title: 'Thanh toán',
    message: 'Bạn có một khoản thanh toán sắp đến hạn.',
    time: '1 tuần trước',
    read: true,
    type: 'payment'
  },
];

export default function NotificationScreen() {
  const renderItem = ({ item, index }) => {
    let iconName;
    let iconColor;
    
    switch (item.type) {
      case 'booking':
        iconName = 'calendar';
        iconColor = colors.primary;
        break;
      case 'promo':
        iconName = 'pricetag';
        iconColor = '#FF9500';
        break;
      case 'review':
        iconName = 'star';
        iconColor = '#FFCC00';
        break;
      case 'payment':
        iconName = 'card';
        iconColor = '#4CD964';
        break;
      default:
        iconName = 'notifications';
        iconColor = colors.primary;
    }
    
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
      >
        <TouchableOpacity 
          style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={iconName} size={22} color={iconColor} />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          {!item.read && <View style={styles.unreadIndicator} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Thông báo</Text>
      </LinearGradient>
      
      {notificationData.length > 0 ? (
        <FlatList
          data={notificationData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Bạn chưa có thông báo nào</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
}); 