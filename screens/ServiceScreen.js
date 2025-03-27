import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from 'react-native-vector-icons';
import Animated, { FadeIn, FadeInRight, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import serviceApi from '../services/api/serviceApi';

export default function ServiceScreen({ route, navigation }) {
    const { homestayId } = route.params;
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const scrollY = useSharedValue(0);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        const result = await serviceApi.getAllServices(homestayId);
        if (result.success) {
            setServices(result.data);
            setError(null);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
            height: interpolate(
                scrollY.value,
                [0, 100],
                [Platform.OS === 'ios' ? 120 : 100, Platform.OS === 'ios' ? 80 : 60],
                'clamp'
            ),
            opacity: interpolate(scrollY.value, [0, 100], [1, 0.9], 'clamp'),
        };
    });

    const renderServiceItem = ({ item, index }) => {
        const isEven = index % 2 === 0;
        return (
            <Animated.View
                entering={FadeInRight.delay(index * 100)}
                style={[
                    styles.serviceCard,
                    { marginLeft: isEven ? 0 : 8, marginRight: isEven ? 8 : 0 }
                ]}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: item.imageServices[0]?.image }}
                        style={styles.serviceImage}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.gradient}
                    />
                    <View style={styles.priceTag}>
                        <Text style={styles.priceText}>
                            {item.servicesPrice.toLocaleString('vi-VN')}đ
                        </Text>
                        {item.unitPrice !== item.servicesPrice && (
                            <Text style={styles.originalPriceText}>
                                {item.unitPrice.toLocaleString('vi-VN')}đ
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.serviceContent}>
                    <View style={styles.serviceHeader}>
                        <Text style={styles.serviceName} numberOfLines={1}>
                            {item.servicesName}
                        </Text>
                        <View style={styles.statusContainer}>
                            <View style={[
                                styles.statusDot,
                                { backgroundColor: item.status ? '#4CAF50' : '#FF5722' }
                            ]} />
                            <Text style={styles.statusText}>
                                {item.status ? 'Đang phục vụ' : 'Tạm ngưng'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.serviceDescription} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <TouchableOpacity
                        style={styles.bookButton}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.primary + 'E6']}
                            style={styles.gradientButton}
                        >
                            <MaterialIcons name="add-shopping-cart" size={20} color="#fff" />
                            <Text style={styles.bookButtonText}>Đặt dịch vụ</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải dịch vụ...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={60} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchServices}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primary + 'E6']}
                        style={styles.gradientButton}
                    >
                        <MaterialIcons name="refresh" size={20} color="#fff" />
                        <Text style={styles.retryText}>Thử lại</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Animated Header */}
            <Animated.View style={[styles.header, headerAnimatedStyle]}>
                <LinearGradient
                    colors={[colors.primary, colors.primary + 'E6']}
                    style={styles.headerGradient}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        Dịch vụ của homestay
                    </Text>

                    <View style={styles.headerRight} />
                </LinearGradient>
            </Animated.View>

            {/* Service List */}
            <Animated.FlatList
                data={services}
                renderItem={renderServiceItem}
                keyExtractor={item => item.servicesID.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                numColumns={2}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                ListHeaderComponent={() => (
                    <View style={styles.listHeader}>
                        <Text style={styles.totalServices}>
                            {services.length} dịch vụ có sẵn
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerRight: {
        width: 44,
    },
    listContainer: {
        padding: 15,
        paddingTop: Platform.OS === 'ios' ? 130 : 110,
    },
    listHeader: {
        marginBottom: 15,
    },
    totalServices: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    serviceCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    imageContainer: {
        height: 160,
        width: '100%',
        position: 'relative',
    },
    serviceImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    priceTag: {
        position: 'absolute',
        bottom: 10,
        left: 10,
    },
    priceText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    originalPriceText: {
        color: '#fff',
        fontSize: 12,
        textDecorationLine: 'line-through',
        opacity: 0.8,
    },
    serviceContent: {
        padding: 12,
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        color: '#666',
    },
    serviceDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 12,
    },
    bookButton: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 15,
    },
    retryButton: {
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 10,
    },
    retryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
}); 