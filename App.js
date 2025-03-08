import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RootNavigator from './navigations/RootNavigator';
import 'react-native-gesture-handler';
import * as Updates from 'expo-updates';
import { SearchProvider } from './contexts/SearchContext';
import { StatusBar, View, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './constants/Colors';

// Component để kiểm tra trạng thái xác thực ban đầu
const AppContent = () => {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Splash');
  
  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          setInitialRoute('MainTabs');
        } else {
          setInitialRoute('Splash');
        }
      } catch (error) {
        console.error('Error checking initial auth:', error);
        setInitialRoute('Splash');
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
    <AuthProvider>
      <SearchProvider>
        <AppContent />
      </SearchProvider>
    </AuthProvider>
  );
}
