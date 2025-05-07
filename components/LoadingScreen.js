import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';

const LoadingScreen = ({ message = 'Đang tải thông tin...', subMessage = 'Vui lòng đợi trong giây lát...' }) => {
    return (
        <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
                <View style={styles.loadingIconContainer}>
                    <MaterialCommunityIcons 
                        name="home-search" 
                        size={60} 
                        color={colors.primary} 
                    />
                    <ActivityIndicator 
                        size="large" 
                        color={colors.primary} 
                        style={styles.activityIndicator} 
                    />
                </View>
                <View>
                    <Text style={styles.loadingText}>{message}</Text>
                    <Text style={styles.loadingSubtext}>{subMessage}</Text>
                </View>
            </View>
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
    activityIndicator: {
        marginTop: 20,
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