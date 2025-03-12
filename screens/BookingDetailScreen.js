import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons, Feather } from 'react-native-vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export default function BookingDetailScreen({ route }) {
    const { hotelName, bookingCode, price, status, statusColor } = route.params;
    const navigation = useNavigation();

    const [showGuestInfo, setShowGuestInfo] = useState(false);
    const [showPriceDetails, setShowPriceDetails] = useState(false);

    const renderHeader = () => (
        <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.header}
        >
            <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
            >
                <BlurView intensity={80} tint="light" style={styles.blurButton}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </BlurView>
            </TouchableOpacity>
            <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
                {hotelName}
            </Text>
            <View style={styles.placeholder} />
        </LinearGradient>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            {renderHeader()}

            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View 
                    entering={FadeInDown.delay(100)}
                    style={styles.content}
                >
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>{status}</Text>
                    </View>

                    {/* Thông tin phòng */}
                    <View style={styles.card}>
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={styles.cardHeader}
                        >
                            <FontAwesome5 name="hotel" size={20} color="#fff" />
                            <Text style={styles.cardTitle}>{hotelName}</Text>
                        </LinearGradient>

                        <View style={styles.cardContent}>
                            <Text style={styles.roomTitle}>
                                Phòng Superior, 2 giường đơn, quang cảnh thành phố
                            </Text>
                            <Text style={styles.roomSubtitle}>240m²</Text>

                            <View style={styles.infoRow}>
                                <FontAwesome5 name="moon" size={18} color={colors.textSecondary} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Số đêm</Text>
                                    <Text style={styles.infoValue}>1 đêm</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <FontAwesome5 name="user" size={18} color={colors.textSecondary} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Khách</Text>
                                    <Text style={styles.infoValue}>1 người lớn</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <Ionicons name="bed-outline" size={20} color={colors.textSecondary} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Loại giường</Text>
                                    <Text style={styles.infoValue}>2 giường đơn</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <FontAwesome5 name="clock" size={18} color={colors.textSecondary} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Nhận phòng</Text>
                                    <Text style={styles.infoValue}>
                                        Thứ Ba, 04/03/2025 (15:00 - 03:00)
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <FontAwesome5 name="clock" size={18} color={colors.textSecondary} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Trả phòng</Text>
                                    <Text style={styles.infoValue}>
                                        Thứ Tư, 05/03/2025 (trước 11:00)
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <MaterialIcons name="confirmation-number" size={20} color={colors.textSecondary} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Mã đặt chỗ</Text>
                                    <Text style={styles.bookingCode}>{bookingCode}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Thông tin khách */}
                    <Animated.View 
                        entering={FadeInDown.delay(200)}
                        style={styles.card}
                    >
                        <TouchableOpacity 
                            style={styles.sectionHeader}
                            onPress={() => setShowGuestInfo(!showGuestInfo)}
                        >
                            <View style={styles.sectionTitleContainer}>
                                <FontAwesome5 name="user-circle" size={20} color={colors.primary} />
                                <Text style={styles.sectionTitle}>Thông tin khách</Text>
                            </View>
                            <Ionicons 
                                name={showGuestInfo ? "chevron-up" : "chevron-down"} 
                                size={24} 
                                color={colors.primary} 
                            />
                        </TouchableOpacity>

                        {showGuestInfo && (
                            <View style={styles.cardContent}>
                                <View style={styles.infoRow}>
                                    <FontAwesome5 name="user" size={18} color={colors.textSecondary} />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Tên khách hàng</Text>
                                        <Text style={styles.infoValue}>NGUYEN VAN A</Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <FontAwesome5 name="phone-alt" size={18} color={colors.textSecondary} />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Số điện thoại</Text>
                                        <Text style={styles.infoValue}>0327953466</Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <Feather name="mail" size={18} color={colors.textSecondary} />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Email</Text>
                                        <Text style={styles.infoValue}>lmn050103@gmail.com</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </Animated.View>

                    {/* Chi tiết giá */}
                    <Animated.View 
                        entering={FadeInDown.delay(300)}
                        style={styles.card}
                    >
                        <TouchableOpacity 
                            style={styles.sectionHeader}
                            onPress={() => setShowPriceDetails(!showPriceDetails)}
                        >
                            <View style={styles.sectionTitleContainer}>
                                <MaterialIcons name="payment" size={20} color={colors.primary} />
                                <Text style={styles.sectionTitle}>Chi tiết giá</Text>
                            </View>
                            <Ionicons 
                                name={showPriceDetails ? "chevron-up" : "chevron-down"} 
                                size={24} 
                                color={colors.primary} 
                            />
                        </TouchableOpacity>

                        {showPriceDetails && (
                            <View style={styles.cardContent}>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Giá phòng (1 đêm)</Text>
                                    <Text style={styles.priceValue}>1.000.000 đ</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Phí dịch vụ</Text>
                                    <Text style={styles.priceValue}>100.000 đ</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Thuế</Text>
                                    <Text style={styles.priceValue}>126.000 đ</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Tổng tiền</Text>
                                    <Text style={styles.totalValue}>{price}</Text>
                                </View>
                            </View>
                        )}
                    </Animated.View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    blurButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerText: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginHorizontal: 10,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginBottom: 20,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 20,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 10,
    },
    cardContent: {
        padding: 15,
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 5,
    },
    roomSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoContent: {
        marginLeft: 15,
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    bookingCode: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: 10,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priceLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    priceValue: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
});