import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import ResultScreen from '../screens/ResultScreen';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';

const Stack = createStackNavigator();

const RootNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
                gestureEnabled: true,
            }}
        >
            <Stack.Screen
                name="Splash"
                component={SplashScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="MainTabs"
                component={BottomTabNavigator}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Results"
                component={ResultScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="BookingDetail"
                component={BookingDetailScreen}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
};

export default RootNavigator;
