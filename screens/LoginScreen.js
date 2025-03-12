import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Dimensions, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Image, StatusBar, ActivityIndicator, Alert } from "react-native";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authApi from '../services/api/authApi';

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [secureText, setSecureText] = useState(true);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const navigation = useNavigation();

    // Kiểm tra và load thông tin đăng nhập đã lưu
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
            setApiError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        entering={FadeInDown.duration(1000).springify()}
                        style={styles.headerContainer}
                    >
                        <Image source={require('../assets/mobile-login.png')} style={styles.image} />
                    </Animated.View>

                    {/* Input Fields */}
                    <Animated.View
                        entering={FadeInUp.delay(200).duration(1000).springify()}
                        style={styles.formContainer}
                    >
                        <View style={styles.titleContainer}>
                            <Text style={styles.welcomeText}>Chào mừng trở lại</Text>
                            <Text style={styles.titleText}>Đăng nhập</Text>
                        </View>

                        {/* API Error Message */}
                        {apiError ? (
                            <View style={styles.apiErrorContainer}>
                                <Text style={styles.apiErrorText}>{apiError}</Text>
                            </View>
                        ) : null}

                        {/* Username/Email Input */}
                        <View style={styles.inputBox}>
                            <Ionicons name="person-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Tên đăng nhập hoặc email"
                                value={username.trim()}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                            {username !== "" && <MaterialIcons name="check-circle" size={22} color={colors.primary} />}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputBox}>
                            <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mật khẩu"
                                value={password.trim()}
                                onChangeText={setPassword}
                                secureTextEntry={secureText}
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
                                    <Text style={styles.loginText}>Đăng nhập</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.orText}>hoặc đăng nhập với</Text>
                            <View style={styles.divider} />
                        </View>

                        <View style={styles.socialButtonsContainer}>
                            <TouchableOpacity style={styles.socialButton}>
                                <FontAwesome name="google" size={22} color="#DB4437" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <FontAwesome name="facebook" size={22} color="#4267B2" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <FontAwesome name="apple" size={22} color="#000" />
                            </TouchableOpacity>
                        </View>

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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    image: {
        width: 280,
        height: 250,
        resizeMode: 'contain',
    },
    formContainer: {
        width: "100%",
        marginTop: 10,
    },
    titleContainer: {
        marginBottom: 25,
    },
    welcomeText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 5,
    },
    titleText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary
    },
    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F8FA",
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 20,
        height: 55,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 55,
        fontSize: 16,
        color: colors.textPrimary,
    },
    eyeIcon: {
        padding: 10,
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.textSecondary,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkedBox: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    rememberText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    forgot: {
        padding: 5,
    },
    forgotText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    buttonsContainer: {
        width: "100%",
    },
    loginButton: {
        width: "100%",
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    gradient: {
        paddingVertical: 16,
        alignItems: "center",
    },
    loginText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: "#E1E8ED",
    },
    orText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginHorizontal: 15,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F5F8FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 2.65,
        elevation: 1,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    noAccountText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    registerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
    },
    apiErrorContainer: {
        backgroundColor: '#FFEBEE',
        padding: 10,
        borderRadius: 10,
        marginBottom: 15,
    },
    apiErrorText: {
        color: '#D32F2F',
        fontSize: 14,
        textAlign: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
});

