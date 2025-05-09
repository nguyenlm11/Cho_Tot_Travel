import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const TABS = [
  { name: 'Home', label: 'Trang chủ', icon: 'home-outline' },
  { name: 'Booking', label: 'Đặt phòng', icon: 'calendar-outline' },
  { name: 'Notification', label: 'Thông báo', icon: 'notifications-outline' },
  { name: 'Chat', label: 'Trò chuyện', icon: 'chatbubbles-outline' },
  { name: 'Settings', label: 'Cài đặt', icon: 'settings-outline' },
];

export default function DropdownMenuTabs({ style, iconStyle }) {
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation();

  const handleNavigateTab = (tabName) => {
    setVisible(false);
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'HomeTabs',
          state: {
            routes: [
              {
                name: tabName
              }
            ]
          }
        }
      ]
    });
  };

  return (
    <View style={style}>
      <TouchableOpacity onPress={() => setVisible(true)} style={iconStyle}>
        <Icon name={iconStyle ? 'menu' : 'ellipsis-vertical'} size={26} color="#fff" />
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)} activeOpacity={1}>
          <View style={[styles.menu, { position: 'absolute', top: 40, right: 16 }]}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.name}
                style={styles.menuItem}
                onPress={() => handleNavigateTab(tab.name)}
              >
                <Icon name={tab.icon} size={20} color="#333" style={{ marginRight: 10 }} />
                <Text style={styles.menuText}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    paddingVertical: 8,
    minWidth: 180,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
}); 