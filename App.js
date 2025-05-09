import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigations/RootNavigator';
import 'react-native-gesture-handler';
import * as Updates from 'expo-updates';
import { SearchProvider } from './contexts/SearchContext';
import { StatusBar, View, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './constants/Colors';
import { UserProvider } from './contexts/UserContext';
import { CartProvider } from './contexts/CartContext';

const AppContent = () => {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Splash');

  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');
        console.log('Initial auth check - Token exists:', !!token, 'UserId exists:', !!userId);

        if (token) {
          try {
            const userString = await AsyncStorage.getItem('user');
            if (userString) {
              const userData = JSON.parse(userString);
              // console.log('User data found in storage', userData);
            }
            setInitialRoute('MainTabs');
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            setInitialRoute('MainTabs');
          }
        } else if (userId) {
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const authApi = require('./services/api/authApi').default;
              await authApi.refreshToken();
              setInitialRoute('MainTabs');
            } catch (refreshError) {
              console.error('Error refreshing token on startup:', refreshError);
              setInitialRoute('Onboarding');
            }
          } else {
            setInitialRoute('Onboarding');
          }
        } else {
          setInitialRoute('Onboarding');
        }
      } catch (error) {
        console.error('Error checking initial auth:', error);
        setInitialRoute('Onboarding');
      } finally {
        setIsReady(true);
      }
    };
    checkInitialAuth();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textSecondary }}>
          Đang tải ứng dụng...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <RootNavigator initialRouteName={initialRoute} />
    </NavigationContainer>
  );
};

export default function App() {

  // async function checkForUpdates() {
  //   try {
  //     const update = await Updates.checkForUpdateAsync();
  //     if (update.isAvailable) {
  //       await Updates.fetchUpdateAsync();
  //       alert('Cập nhật mới đã được tải xuống. Ứng dụng sẽ khởi động lại.');
  //       await Updates.reloadAsync();
  //     }
  //   } catch (e) {
  //     console.error(e);
  //     alert('Đã xảy ra lỗi khi kiểm tra cập nhật.');
  //   }
  // }

  // useEffect(() => {
  //   checkForUpdates();
  // }, []);

  return (
    <CartProvider>
      <UserProvider>
        <SearchProvider>
          <AppContent />
        </SearchProvider>
      </UserProvider>
    </CartProvider>
  );
}