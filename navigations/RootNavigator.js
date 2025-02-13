import React from 'react';
import { Platform, BackHandler } from 'react-native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ResultScreen from '../screens/ResultScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import ListRoomScreen from '../screens/ListRoomScreen';
import DetailRoomScreen from '../screens/DetailRoomScreen';
import HomeStayDetailScreen from '../screens/HomeStayDetailScreen';
import ReviewScreen from '../screens/ReviewScreen';
import MapScreen from '../screens/MapScreen';

import { colors } from '../constants/Colors';

const Stack = createStackNavigator();

const defaultScreenOptions = {
    ...TransitionPresets.SlideFromRightIOS,
    gestureEnabled: true,
    headerShown: false,
    cardStyle: { backgroundColor: '#fff' },
    cardOverlayEnabled: true,
    cardStyleInterpolator: ({ current: { progress } }) => ({
        cardStyle: {
            opacity: progress.interpolate({
                inputRange: [0, 0.5, 0.9, 1],
                outputRange: [0, 0.25, 0.7, 1],
            }),
        },
        overlayStyle: {
            opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
                extrapolate: 'clamp',
            }),
        },
    }),
};

const modalScreenOptions = {
    presentation: 'modal',
    ...TransitionPresets.ModalPresentationIOS,
    headerStyle: {
        backgroundColor: colors.primary,
        elevation: 0,
        shadowOpacity: 0,
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
        fontSize: 18,
        fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    },
    headerBackTitleVisible: false,
    headerLeftContainerStyle: {
        paddingLeft: Platform.OS === 'ios' ? 10 : 0,
    },
};

const MainStack = () => {
    useFocusEffect(
        React.useCallback(() => {
            const handleBackPress = () => {
                BackHandler.exitApp();
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
            return () => subscription.remove();
        }, [])
    );

    return (
        <Stack.Navigator screenOptions={defaultScreenOptions}>
            <Stack.Screen 
                name="MainTabs" 
                component={BottomTabNavigator}
                options={{ headerShown: false }}
            />
            <Stack.Screen name="Results" component={ResultScreen} />
            <Stack.Screen name="HomeStayDetail" component={HomeStayDetailScreen} />
            <Stack.Screen name="MapScreen" component={MapScreen} />
            <Stack.Screen name="ReviewScreen" component={ReviewScreen} />
            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />

            {/* Modal Screens */}
            <Stack.Group screenOptions={modalScreenOptions}>
                <Stack.Screen 
                    name="ListRoom" 
                    component={ListRoomScreen}
                    options={{
                        headerShown: true,
                        headerTitle: "Danh sách phòng",
                    }}
                />
                <Stack.Screen 
                    name="DetailRoom" 
                    component={DetailRoomScreen}
                    options={{
                        headerShown: true,
                        headerTitle: "Chi tiết phòng",
                    }}
                />
            </Stack.Group>
        </Stack.Navigator>
    );
};

const RootNavigator = () => {
    return (
        <Stack.Navigator 
            initialRouteName="Splash"
            screenOptions={{ headerShown: false }}
        >
            {/* Auth Stack */}
            <Stack.Group>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            </Stack.Group>

            {/* Main Stack */}
            <Stack.Screen 
                name="MainTabs" 
                component={MainStack}
                options={{
                    gestureEnabled: false,
                    animationEnabled: true,
                    ...TransitionPresets.SlideFromRightIOS,
                }}
            />
        </Stack.Navigator>
    );
};

export default RootNavigator;
