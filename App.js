import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigations/RootNavigator';
import 'react-native-gesture-handler';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { SearchProvider } from './contexts/SearchContext';

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
    <SearchProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SearchProvider>
  );
}
