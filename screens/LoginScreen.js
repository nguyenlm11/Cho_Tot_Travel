import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Dimensions, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Image } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../constants/Colors";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [secureText, setSecureText] = useState(true);
    const navigation = useNavigation();

    const handleLogin = () => {
        console.log("Email: ", email);
        console.log("Password: ", password);
        navigation.navigate("MainTabs");
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Image source={require('../assets/mobile-login.png')} style={styles.image} />
                    {/* Input Fields */}
                    <View style={styles.inputContainer}>
                        <View style={styles.title}>
                            <Text style={styles.titleText}>Đăng nhập</Text>
                        </View>
                        {/* Email Input */}
                        <View style={styles.inputBox}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email hoặc tên người dùng"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                            />
                            {email !== "" && <MaterialIcons name="check" size={20} color={colors.primary} />}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputBox}>
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

                        <TouchableOpacity style={styles.forgot}>
                            <Text style={styles.forgotText}>Bạn quên mật khẩu?</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginText}>Đăng nhập</Text>
                    </TouchableOpacity>

                    <Text style={styles.orText}>hoặc</Text>

                    <TouchableOpacity style={styles.signUpButton} onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.signUpText}>Đăng ký</Text>
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    image: {
        width: 300,
        height: 410,
        resizeMode: 'contain',
    },
    inputContainer: {
        width: "100%",
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
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
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

