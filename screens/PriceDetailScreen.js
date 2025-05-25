import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import Animated, { FadeInDown } from 'react-native-reanimated';

const palette = {
    primary: colors.primary,
    secondary: colors.secondary,
    background: '#f8f9fa',
    card: '#ffffff',
    cardBorder: '#eaeaea',
    text: { dark: '#2c3e50', medium: '#546e7a', light: '#78909c' },
    error: '#e74c3c',
};

export default function PriceDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { roomType } = route.params;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const renderPriceCard = (pricing, type) => {
        if (!pricing) return null;
        const getIcon = () => {
            switch (type) {
                case 'normal':
                    return 'calendar-today';
                case 'weekend':
                    return 'weekend';
                case 'holiday':
                    return 'celebration';
                default:
                    return 'calendar-today';
            }
        };

        const getTitle = () => {
            switch (type) {
                case 'normal':
                    return 'Ngày thường';
                case 'weekend':
                    return 'Cuối tuần';
                case 'holiday':
                    return 'Ngày lễ';
                default:
                    return 'Giá phòng';
            }
        };

        const getDescription = () => {
            switch (type) {
                case 'normal':
                    return 'Thứ 2 - Thứ 6';
                case 'weekend':
                    return 'Thứ 7 & Chủ nhật';
                case 'holiday':
                    return 'Ngày lễ';
                default:
                    return '';
            }
        };

        const getColor = () => {
            switch (type) {
                case 'normal':
                    return palette.primary;
                case 'weekend':
                    return palette.secondary;
                case 'holiday':
                    return palette.error;
                default:
                    return palette.primary;
            }
        };

        return (
            <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={[styles.priceCard, { borderLeftColor: getColor() }]}
            >
                <View style={styles.priceHeader}>
                    <MaterialIcons name={getIcon()} size={20} color={getColor()} />
                    <Text style={[styles.priceTitle, { color: getColor() }]}>{getTitle()}</Text>
                </View>

                <View style={styles.priceValueContainer}>
                    <Text style={[styles.priceValue, { color: getColor() }]}>
                        {pricing.rentPrice?.toLocaleString()}
                    </Text>
                    <Text style={[styles.priceUnit, { color: getColor() }]}>₫/đêm</Text>
                </View>

                <Text style={styles.priceDescription}>{getDescription()}</Text>

                {type === 'holiday' && pricing.startDate && pricing.endDate && (
                    <View style={styles.holidayDateContainer}>
                        <Text style={styles.holidayDateLabel}>Thời gian áp dụng:</Text>
                        <Text style={styles.holidayDateText}>
                            {formatDate(pricing.startDate)} - {formatDate(pricing.endDate)}
                        </Text>
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={palette.primary} />
            <LinearGradient
                colors={[palette.primary, palette.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết giá phòng</Text>
                {/* <View /> */}
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.roomInfoContainer}>
                    <Image
                        source={{
                            uri: roomType.imageRoomTypes?.[0]?.image || 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg'
                        }}
                        style={styles.roomImage}
                        resizeMode="cover"
                    />
                    <View style={styles.roomInfo}>
                        <Text style={styles.roomName}>{roomType.name}</Text>
                        <View style={styles.roomCapacity}>
                            <MaterialIcons name="people" size={16} color={palette.text.medium} />
                            <Text style={styles.capacityText}>
                                Tối đa {roomType.maxPeople} người
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.priceSection}>
                    <Text style={styles.sectionTitle}>Bảng giá</Text>
                    {renderPriceCard(roomType.pricings?.find(p => p.dayType === 0), 'normal')}
                    {renderPriceCard(roomType.pricings?.find(p => p.dayType === 1), 'weekend')}
                    {renderPriceCard(roomType.pricings?.find(p => p.dayType === 2), 'holiday')}
                </View>

                <View style={styles.noteSection}>
                    <Text style={styles.noteTitle}>Lưu ý:</Text>
                    <View style={styles.noteItem}>
                        <MaterialIcons name="info" size={16} color={palette.primary} />
                        <Text style={styles.noteText}>
                            Giá trên chưa bao gồm thuế và phí dịch vụ
                        </Text>
                    </View>
                    <View style={styles.noteItem}>
                        <MaterialIcons name="info" size={16} color={palette.primary} />
                        <Text style={styles.noteText}>
                            Giá có thể thay đổi tùy theo mùa và thời điểm đặt phòng
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    roomInfoContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    roomImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    roomInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    roomName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: palette.text.dark,
        marginBottom: 8,
    },
    roomCapacity: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    capacityText: {
        fontSize: 14,
        color: palette.text.medium,
        marginLeft: 4,
    },
    priceSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: palette.text.dark,
        marginBottom: 12,
    },
    priceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    priceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    priceTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    priceValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    priceUnit: {
        fontSize: 16,
        marginLeft: 4,
    },
    priceDescription: {
        fontSize: 14,
        color: palette.text.medium,
    },
    holidayDateContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    holidayDateLabel: {
        fontSize: 14,
        color: palette.text.medium,
        marginBottom: 4,
    },
    holidayDateText: {
        fontSize: 14,
        color: palette.text.dark,
        fontWeight: '500',
    },
    noteSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    noteTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.text.dark,
        marginBottom: 12,
    },
    noteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    noteText: {
        flex: 1,
        fontSize: 14,
        color: palette.text.medium,
        marginLeft: 8,
    },
}); 