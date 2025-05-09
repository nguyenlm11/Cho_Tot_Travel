import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BookingListScreen from '../screens/BookingListScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationScreen from '../screens/NotificationScreen';
import { colors } from '../constants/Colors';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
    const screenOptions = ({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            switch (route.name) {
                case 'Home':
                    iconName = focused ? 'home' : 'home-outline';
                    break;
                case 'Booking':
                    iconName = focused ? 'calendar' : 'calendar-outline';
                    break;
                case 'Notification':
                    iconName = focused ? 'notifications' : 'notifications-outline';
                    break;
                case 'Chat':
                    iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    break;
                case 'Settings':
                    iconName = focused ? 'settings' : 'settings-outline';
                    break;
                default:
                    iconName = 'help-outline';
            }
            return <Icon name={iconName} size={24} color={focused ? colors.primary : '#666'} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => (
            <BlurView
                tint="light"
                intensity={100}
                style={StyleSheet.absoluteFill}
            />
        ),
    });

    return (
        <Tab.Navigator screenOptions={screenOptions}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Trang chủ',
                }}
            />
            <Tab.Screen
                name="Booking"
                component={BookingListScreen}
                options={{
                    tabBarLabel: 'Đặt phòng',
                }}
            />
            {/* <Tab.Screen
                name="Notification"
                component={NotificationScreen}
                options={{
                    tabBarLabel: 'Thông báo',
                }}
            /> */}
            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    tabBarLabel: 'Trò chuyện',
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Cài đặt',
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        height: Platform.OS === 'ios' ? 85 : 65,
        paddingHorizontal: 5,
        paddingTop: 5,
        paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopWidth: 0,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    tabBarLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: Platform.OS === 'ios' ? 0 : 4,
    },
});

export default BottomTabNavigator;
