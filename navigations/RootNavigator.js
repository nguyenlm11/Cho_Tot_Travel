import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import ResultScreen from '../screens/ResultScreen';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import ListRoomScreen from '../screens/ListRoomScreen';
import DetailRoomScreen from '../screens/DetailRoomScreen';
import { colors } from '../constants/Colors';
import HomeStayDetailScreen from '../screens/HomeStayDetailScreen';
import ReviewScreen from '../screens/ReviewScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import MapScreen from '../screens/MapScreen';

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
                name="Login"
                component={LoginScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="OTPVerification"
                component={OTPVerificationScreen}
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
                name="HomeStayDetail"
                component={HomeStayDetailScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="MapScreen"
                component={MapScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="ReviewScreen"
                component={ReviewScreen}
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
            <Stack.Screen
                name="ListRoom"
                component={ListRoomScreen}
                options={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: colors.primary,
                    },
                    headerTitle: "Danh sách phòng",
                    headerTintColor: colors.textThird,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            />
            <Stack.Screen
                name="DetailRoom"
                component={DetailRoomScreen}
                options={{
                    headerShown: false,
                    headerStyle: {
                        backgroundColor: colors.primary,
                    },
                    headerTitle: "Chi tiết phòng",
                    headerTintColor: colors.textThird,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            />
        </Stack.Navigator>
    );
};

export default RootNavigator;
