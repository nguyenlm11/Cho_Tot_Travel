import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { colors } from '../constants/Colors';

export default function OTPVerificationScreen({ route }) {
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const ref = useBlurOnFulfill({ value: otp, cellCount: 6 });
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
        value: otp,
        setValue: setOtp,
    });

    const handleVerifyOtp = () => {
        console.log('Entered OTP:', otp);
    };

    const handleResendOtp = async () => {
        alert('Mã OTP đã được gửi lại');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Image source={require('../assets/enter-OTP-bro.png')} style={styles.image} />
                <Text style={styles.title}>Xác minh OTP</Text>
                <Text style={styles.subtitle}>
                    Nhập OTP được gửi đến <Text style={styles.phoneNumber}>{email}</Text>
                </Text>

                <CodeField
                    ref={ref}
                    {...props}
                    value={otp}
                    onChangeText={setOtp}
                    cellCount={6}
                    rootStyle={styles.otpContainer}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    renderCell={({ index, symbol, isFocused }) => (
                        <Text
                            key={index}
                            style={[styles.otpInput, isFocused && styles.focusedInput]}
                            onLayout={getCellOnLayoutHandler(index)}
                        >
                            {symbol || (isFocused ? <Cursor /> : null)}
                        </Text>
                    )}
                />

                <Text style={styles.resendText}>Không nhận được OTP?
                    <Text style={styles.resendLink} onPress={handleResendOtp}> Gửi lại OTP</Text>
                </Text>

                <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOtp}>
                    <Text style={styles.verifyButtonText}>Xác minh OTP</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    image: {
        width: 350,
        height: 380,
        marginBottom: 20,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 30,
    },
    phoneNumber: {
        fontWeight: 'bold',
        color: '#000',
    },
    otpContainer: {
        width: "100%",
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    otpInput: {
        width: 50,
        height: 50,
        borderWidth: 2,
        borderColor: colors.textSecondary,
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 22,
        lineHeight: 50,
    },
    focusedInput: {
        borderColor: colors.primary,
    },
    resendText: {
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: 20,
        textAlign: 'center',
    },
    resendLink: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    verifyButton: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 'auto',
    },
    verifyButtonText: {
        color: colors.textThird,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
