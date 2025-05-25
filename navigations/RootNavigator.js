import React from 'react';
import { Platform, BackHandler } from 'react-native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ResultScreen from '../screens/ResultScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import ListRoomScreen from '../screens/ListRoomScreen';
import DetailRoomScreen from '../screens/DetailRoomScreen';
import HomeStayDetailScreen from '../screens/HomeStayDetailScreen';
import ReviewScreen from '../screens/ReviewScreen';
import MapScreen from '../screens/MapScreen';
import { colors } from '../constants/Colors';
import CheckoutScreen from '../screens/CheckoutScreen';
import SecurityScreen from '../screens/SecurityScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ServiceScreen from '../screens/ServiceScreen';
import HomestayRentalScreen from '../screens/HomestayRentalScreen';
import HomestayRentalDetailScreen from '../screens/HomestayRentalDetailScreen';
import RoomTypeScreen from '../screens/RoomTypeScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import PaymentWebView from '../screens/PaymentWebView';
import BookingSuccess from '../screens/BookingSuccess';
import BookingFailed from '../screens/BookingFailed';
import WholeHomestayCheckout from '../screens/WholeHomestayCheckout';
import WriteReviewScreen from '../screens/WriteReviewScreen';
import RatingDetailScreen from '../screens/RatingDetailScreen';
import BookingServiceScreen from '../screens/BookingServiceScreen';
import PriceDetailScreen from '../screens/PriceDetailScreen';

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
        <Stack.Navigator screenOptions={defaultScreenOptions} initialRouteName="HomeTabs">
            <Stack.Screen name="HomeTabs" component={BottomTabNavigator} />
            <Stack.Screen name="Results" component={ResultScreen} />
            <Stack.Screen name="HomeStayDetail" component={HomeStayDetailScreen} />
            <Stack.Screen name="ServiceScreen" component={ServiceScreen} />
            <Stack.Screen name="HomestayRental" component={HomestayRentalScreen} />
            <Stack.Screen name="HomestayRentalDetail" component={HomestayRentalDetailScreen} />
            <Stack.Screen name="RoomType" component={RoomTypeScreen} />
            <Stack.Screen name="MapScreen" component={MapScreen} />
            <Stack.Screen name="ReviewScreen" component={ReviewScreen} />
            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="WholeHomestayCheckout" component={WholeHomestayCheckout} />
            <Stack.Screen name="ListRoom" component={ListRoomScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="PaymentWebView" component={PaymentWebView} />
            <Stack.Screen name="BookingSuccess" component={BookingSuccess} />
            <Stack.Screen name="BookingFailed" component={BookingFailed} />
            <Stack.Screen name="Review" component={WriteReviewScreen} />
            <Stack.Screen name="RatingDetail" component={RatingDetailScreen} />
            <Stack.Screen name="BookingService" component={BookingServiceScreen} />
            <Stack.Screen name="PriceDetail" component={PriceDetailScreen} />
            {/* Modal Screens */}
            <Stack.Group screenOptions={modalScreenOptions}>
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

const RootNavigator = ({ initialRouteName = 'Splash' }) => {
    return (
        <Stack.Navigator screenOptions={defaultScreenOptions} initialRouteName="Splash">
            <Stack.Screen
                name="Splash"
                component={SplashScreen}
                listeners={({ navigation }) => ({
                    state: () => {
                        setTimeout(() => {
                            navigation.replace(initialRouteName);
                        }, 2000);
                    }
                })}
            />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="MainTabs" component={MainStack} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

export default RootNavigator;