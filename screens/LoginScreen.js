import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Image, StatusBar, ActivityIndicator, Dimensions, SafeAreaView } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authApi from '../services/api/authApi';

const { width, height } = Dimensions.get('window');
const scale = width / 375; 

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [secureText, setSecureText] = useState(true);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const navigation = useNavigation();

    useEffect(() => {
        loadSavedCredentials();
    }, []);

    const loadSavedCredentials = async () => {
        try {
            const savedRememberMe = await AsyncStorage.getItem('rememberMe');
            const savedUsername = await AsyncStorage.getItem('savedUsername');
            if (savedRememberMe === 'true' && savedUsername) {
                setRememberMe(true);
                setUsername(savedUsername);
            }
        } catch (error) {
            console.error('Error loading saved credentials:', error);
        }
    };

    const saveCredentials = async () => {
        try {
            if (rememberMe) {
                await AsyncStorage.setItem('savedUsername', username);
                await AsyncStorage.setItem('rememberMe', 'true');
            } else {
                await AsyncStorage.multiRemove(['savedUsername', 'rememberMe']);
            }
        } catch (error) {
            console.error('Error saving credentials:', error);
        }
    };

    const handleLogin = async () => {
        if (!username || !password) {
            setApiError('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        setIsLoading(true);
        setApiError('');
        try {
            await authApi.login({ username, password });
            await saveCredentials();
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        } catch (error) {
            if (error.message.includes('không có quyền truy cập')) {
                setApiError('Chỉ tài khoản khách hàng mới được phép đăng nhập');
            } else {
                setApiError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={colors.primary}
                translucent={true}
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <Animated.View
                            entering={FadeIn.duration(500)}
                            style={styles.backgroundContainer}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                style={styles.headerBackground}
                            >
                                <Animated.View
                                    entering={FadeInDown.duration(1000).springify()}
                                    style={styles.headerContainer}
                                >
                                    <View style={styles.logoContainer}>
                                        <Image source={require('../assets/logo.png')} style={styles.image} />
                                    </View>
                                </Animated.View>

                                <Animated.View
                                    entering={FadeInDown.delay(200).duration(800)}
                                    style={styles.wavyBackground}
                                />
                            </LinearGradient>
                        </Animated.View>

                        <Animated.View
                            entering={FadeInUp.delay(200).duration(1000).springify()}
                            style={styles.formContainer}
                        >
                            <View style={styles.titleContainer}>
                                <Text style={styles.welcomeText}>Chào mừng trở lại</Text>
                                <Text style={styles.titleText}>Đăng nhập</Text>
                            </View>

                            {apiError ? (
                                <Animated.View
                                    entering={FadeIn.duration(300)}
                                    style={styles.apiErrorContainer}
                                >
                                    <Ionicons name="alert-circle" size={20} color="#D32F2F" style={styles.errorIcon} />
                                    <Text style={styles.apiErrorText}>{apiError}</Text>
                                </Animated.View>
                            ) : null}

                            <View style={styles.inputBox}>
                                <Ionicons name="person-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tên đăng nhập hoặc email"
                                    value={username.trim()}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    placeholderTextColor="#9E9E9E"
                                />
                                {username !== "" && <MaterialIcons name="check-circle" size={22} color={colors.primary} />}
                            </View>

                            <View style={styles.inputBox}>
                                <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Mật khẩu"
                                    value={password.trim()}
                                    onChangeText={setPassword}
                                    secureTextEntry={secureText}
                                    placeholderTextColor="#9E9E9E"
                                />
                                <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                                    <Ionicons
                                        name={secureText ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.optionsContainer}>
                                <TouchableOpacity
                                    style={styles.rememberContainer}
                                    onPress={() => setRememberMe(!rememberMe)}
                                >
                                    <View style={[styles.checkbox, rememberMe && styles.checkedBox]}>
                                        {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
                                    </View>
                                    <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.forgot}
                                    onPress={() => navigation.navigate('ForgotPassword')}
                                >
                                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        <Animated.View
                            entering={FadeInUp.delay(400).duration(1000).springify()}
                            style={styles.buttonsContainer}
                        >
                            <TouchableOpacity
                                style={[styles.loginButton, isLoading && styles.disabledButton]}
                                onPress={handleLogin}
                                activeOpacity={0.8}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.secondary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradient}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.loginText}>Đăng nhập</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.arrowIcon} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.registerContainer}>
                                <Text style={styles.noAccountText}>Chưa có tài khoản? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.registerText}>Đăng ký ngay</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.primary,
    },
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollContainer: {
        flexGrow: 1,
    },
    backgroundContainer: {
        width: '100%',
        height: height * 0.38,
    },
    headerBackground: {
        width: '100%',
        height: '100%',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
    },
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    wavyBackground: {
        position: 'absolute',
        bottom: -20,
        left: 0,
        right: 0,
        height: 50,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    logoContainer: {
        width: Math.min(width * 0.4, 160),
        height: Math.min(width * 0.4, 160),
        borderRadius: Math.min(width * 0.2, 80),
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
    },
    image: {
        width: Math.min(width * 0.32, 130),
        height: Math.min(width * 0.32, 130),
        resizeMode: 'contain',
    },
    formContainer: {
        width: "100%",
        marginTop: 10,
        paddingHorizontal: width * 0.06,
        backgroundColor: '#fff',
    },
    titleContainer: {
        marginBottom: 25,
    },
    welcomeText: {
        fontSize: Math.max(16, scale * 16),
        color: colors.textSecondary,
        marginBottom: 5,
    },
    titleText: {
        fontSize: Math.max(24, scale * 26),
        fontWeight: "700",
        color: colors.textPrimary,
    },
    apiErrorContainer: {
        backgroundColor: "#FFEBEE",
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorIcon: {
        marginRight: 10,
    },
    apiErrorText: {
        color: "#D32F2F",
        fontSize: 14,
        flex: 1,
    },
    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 16,
        paddingHorizontal: 15,
        paddingVertical: 14,
        marginBottom: 15,
        backgroundColor: "#FAFAFA",
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 25,
        fontSize: Math.max(16, scale * 16),
        color: colors.textPrimary,
    },
    eyeIcon: {
        padding: 5,
    },
    optionsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 5,
        marginBottom: 25,
    },
    rememberContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: colors.textSecondary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    checkedBox: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    rememberText: {
        color: colors.textSecondary,
        fontSize: Math.max(14, scale * 14),
    },
    forgot: {
        padding: 5,
    },
    forgotText: {
        color: colors.primary,
        fontSize: Math.max(14, scale * 14),
        fontWeight: "600",
    },
    buttonsContainer: {
        width: "100%",
        paddingHorizontal: width * 0.06,
        marginTop: 10,
    },
    loginButton: {
        width: "100%",
        height: Math.max(55, scale * 55),
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 20,
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    gradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: 'row',
    },
    loginText: {
        color: "white",
        fontSize: Math.max(18, scale * 18),
        fontWeight: "600",
        marginRight: 8,
    },
    arrowIcon: {
        marginLeft: 5,
    },
    registerContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 15,
        marginBottom: 30,
    },
    noAccountText: {
        color: colors.textSecondary,
        fontSize: Math.max(16, scale * 16),
    },
    registerText: {
        color: colors.primary,
        fontWeight: "600",
        fontSize: Math.max(16, scale * 16),
    },
});