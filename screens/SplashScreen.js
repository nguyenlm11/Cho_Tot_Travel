import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, withSequence, withDelay } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const navigation = useNavigation();
    const logoScale = useSharedValue(0);
    const logoOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);

    useEffect(() => {
        // Animate logo
        logoScale.value = withSequence(
            withTiming(1.2, { duration: 500 }),
            withSpring(1, {
                damping: 8,
                stiffness: 100
            })
        );

        // Animate logo opacity
        logoOpacity.value = withTiming(1, { duration: 1000 });

        // Animate text with delay
        textOpacity.value = withDelay(
            500,
            withTiming(1, { duration: 800 })
        );

        // Navigate after animation
        const timer = setTimeout(() => {
            navigation.replace('Onboarding');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigation]);

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [
            {
                translateY: withSpring(textOpacity.value * 0, {
                    damping: 8,
                    stiffness: 100
                })
            }
        ],
    }));

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" />
            <LinearGradient
                colors={['#42d451', '#30B53E', '#229631']}
                style={styles.gradient}
            >
                <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                    <Image
                        source={require('../assets/icon.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
                    <Text style={styles.title}>Chỗ Tốt Travel</Text>
                    <Text style={styles.subtitle}>Khám phá thế giới cùng chúng tôi</Text>
                </Animated.View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Version 0.0.1</Text>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: width * 0.4,
        height: width * 0.4,
        tintColor: '#fff',
    },
    textContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        paddingHorizontal: 20,
        letterSpacing: 0.5,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        letterSpacing: 1,
    },
});
