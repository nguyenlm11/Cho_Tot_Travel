import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Dimensions, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/Colors";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

export default function RegisterScreen() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [secureText, setSecureText] = useState(true);
    const [secureTextConfirm, setSecureTextConfirm] = useState(true);
    const navigation = useNavigation();

    const [errors, setErrors] = useState({
        username: false,
        email: false,
        password: false,
        confirmPassword: false
    });

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[0-9])(?=.*[\W_]).{8,}$/;
        return passwordRegex.test(password);
    };

    const handleRegister = () => {
        let newErrors = {
            username: username.trim() === "",
            email: !validateEmail(email),
            password: !validatePassword(password),
            confirmPassword: password !== confirmPassword
        };

        setErrors(newErrors);

        const hasError = Object.values(newErrors).some(error => error);
        if (!hasError) {
            console.log("Đăng ký thành công");
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Background Wave */}
                    <Svg height={height * 0.6} width={width} style={styles.wave}>
                        <Path
                            fill={colors.primary}
                            d="M0,320 C180,368 700,200 720,280 C940,384 1200,240 1440,320 L1440,0 L0,0 Z"
                        />
                    </Svg>
                    <Text style={styles.welcomeText}>Đăng ký{"\n"}tài khoản mới</Text>

                    {/* Input Fields */}
                    <View style={styles.inputContainer}>
                        <View style={styles.title}>
                            <Text style={styles.titleText}>Đăng ký</Text>
                        </View>
                        {/* Username Input */}
                        <View style={[styles.inputBox, errors.username && styles.errorBorder]}>
                            <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Tên người dùng"
                                value={username}
                                onChangeText={setUsername}
                                keyboardType="default"
                            />
                        </View>
                        {errors.username && <Text style={styles.errorText}>Tên người dùng không được để trống</Text>}

                        {/* Email Input */}
                        <View style={[styles.inputBox, errors.email && styles.errorBorder]}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                            />
                        </View>
                        {errors.email && <Text style={styles.errorText}>Email không hợp lệ</Text>}

                        {/* Password Input */}
                        <View style={[styles.inputBox, errors.password && styles.errorBorder]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mật khẩu"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={secureText}
                            />
                            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                                <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {errors.password && <Text style={styles.errorText}>Mật khẩu phải có ít nhất 8 ký tự, 1 số và 1 ký tự đặc biệt</Text>}

                        {/* Confirm Password Input */}
                        <View style={[styles.inputBox, errors.confirmPassword && styles.errorBorder]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Xác nhận mật khẩu"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={secureTextConfirm}
                            />
                            <TouchableOpacity onPress={() => setSecureTextConfirm(!secureTextConfirm)} style={styles.eyeIcon}>
                                <Ionicons name={secureTextConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmPassword && <Text style={styles.errorText}>Mật khẩu không khớp</Text>}
                    </View>

                    <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
                        <Text style={styles.loginText}>Đăng ký</Text>
                    </TouchableOpacity>

                    <Text style={styles.orText}>hoặc</Text>

                    <TouchableOpacity style={styles.signUpButton} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.signUpText}>Đăng nhập</Text>
                    </TouchableOpacity>
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
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    wave: {
        position: "absolute",
        top: 0,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: "bold",
        color: "white",
        position: "absolute",
        top: height * 0.2,
        left: 20,
    },
    inputContainer: {
        width: "100%",
        marginTop: height * 0.377,
    },
    title: {
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 20,
    },
    titleText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: colors.primary
    },
    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    errorBorder: {
        borderWidth: 1,
        borderColor: "red",
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },
    errorText: {
        color: "red",
        fontSize: 14,
        marginBottom: 10,
        marginTop: -15,
    },
    eyeIcon: {
        padding: 10,
    },
    forgot: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 15,
    },
    forgotText: {
        color: "blue",
        fontSize: 15,
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: colors.primary,
        width: "100%",
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    loginText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    orText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginVertical: 15,
    },
    signUpButton: {
        borderWidth: 1,
        borderColor: colors.primary,
        width: "100%",
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: "center",
    },
    signUpText: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: "bold",
    },
});

