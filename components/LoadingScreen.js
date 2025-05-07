import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors } from '../constants/Colors';

const LoadingScreen = ({ message = 'Đang tải thông tin...', subMessage = 'Vui lòng đợi trong giây lát...' }) => {
    return (
        <View style={styles.loadingContainer}>
            <Animated.View 
                entering={FadeInDown.delay(100)} 
                style={styles.loadingContent}
            >
                <View style={styles.loadingIconContainer}>
                    <MaterialCommunityIcons 
                        name="home-search" 
                        size={60} 
                        color={colors.primary} 
                    />
                    <View style={styles.loadingDots}>
                        <Animated.View 
                            entering={FadeInDown.delay(200)} 
                            style={[styles.loadingDot, { backgroundColor: colors.primary }]} 
                        />
                        <Animated.View 
                            entering={FadeInDown.delay(300)} 
                            style={[styles.loadingDot, { backgroundColor: colors.secondary }]} 
                        />
                        <Animated.View 
                            entering={FadeInDown.delay(400)} 
                            style={[styles.loadingDot, { backgroundColor: colors.primary }]} 
                        />
                    </View>
                </View>
                <Animated.View entering={FadeInDown.delay(100)}>
                    <Text style={styles.loadingText}>{message}</Text>
                    <Text style={styles.loadingSubtext}>{subMessage}</Text>
                </Animated.View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingContent: {
        alignItems: 'center',
        padding: 20,
    },
    loadingIconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    loadingDots: {
        flexDirection: 'row',
        marginTop: 20,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default LoadingScreen; 