import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigations/RootNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
