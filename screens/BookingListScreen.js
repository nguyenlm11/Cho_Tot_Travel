import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, Button, Platform, StatusBar } from 'react-native';
import { FontAwesome6, Ionicons } from 'react-native-vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const bookings = [
    {
        id: '1',
        month: '01/2025',
        status: 'Đang xử lý',
        statusColor: '#FAD961',
        hotelName: 'Smile Apartment District 2',
        bookingCode: '453653657',
        price: '1.226.000 đ',
    },
    {
        id: '2',
        month: '12/2024',
        status: 'Đặt thành công',
        statusColor: '#A5D6A7',
        hotelName: 'Nhà nghỉ Hoa Hồng-Vũng Tàu',
        bookingCode: '453653657',
        price: '8.000.000 đ',
    },
    {
        id: '3',
        month: '12/2024',
        status: 'Đặt thất bại',
        statusColor: '#E57373',
        hotelName: 'Nhà nghỉ Biển Xanh',
        bookingCode: '453653657',
        price: '1.000.000 đ',
    },
    {
        id: '4',
        month: '11/2024',
        status: 'Đã hủy',
        statusColor: '#BDBDBD',
        hotelName: 'Căn hộ Vinhome Grand Park',
        bookingCode: '453653657',
        price: '8.000.000 đ',
    },
    {
        id: '5',
        month: '10/2024',
        status: 'Đã hủy',
        statusColor: '#BDBDBD',
        hotelName: 'Khách sạn Pullman Vũng Tàu',
        bookingCode: '453653657',
        price: '8.000.000 đ',
    },
];

export default function BookingListScreen() {
    const navigation = useNavigation();
    const [filterStatus, setFilterStatus] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);

    const filteredBookings = filterStatus
        ? bookings.filter((booking) => booking.status === filterStatus)
        : bookings;

    const filteredGroupedBookings = filteredBookings.reduce((acc, curr) => {
        acc[curr.month] = acc[curr.month] || [];
        acc[curr.month].push(curr);
        return acc;
    }, {});

    const renderHeader = () => (
        <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.header}
        >
            <Text style={styles.headerText}>Danh sách đặt phòng</Text>
            <TouchableOpacity 
                style={styles.filterButton} 
                onPress={() => setModalVisible(true)}
            >
                <BlurView intensity={80} tint="light" style={styles.blurButton}>
                    <Ionicons name="options-outline" size={24} color="#fff" />
                </BlurView>
            </TouchableOpacity>
        </LinearGradient>
    );

    const renderBookingItem = ({ item }) => (
        <Animated.View entering={FadeInDown}>
            <TouchableOpacity
                style={styles.bookingCard}
                onPress={() =>
                    navigation.navigate('BookingDetail', {
                        id: item.id,
                        hotelName: item.hotelName,
                        bookingCode: item.bookingCode,
                        price: item.price,
                        status: item.status,
                        statusColor: item.statusColor,
                    })
                }
            >
                <View style={[styles.statusBadge, { backgroundColor: item.statusColor }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
                <View style={styles.nameContainer}>
                    <FontAwesome6 name="hotel" size={20} color={colors.textPrimary} />
                    <Text style={styles.hotelName}>{item.hotelName}</Text>
                </View>
                <View style={styles.hrLine} />
                <View style={styles.priceContainer}>
                    <Text style={styles.bookingCode}>Mã đặt chỗ: {item.bookingCode}</Text>
                    <Text style={styles.price}>{item.price}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderMonthSection = ({ item: month }) => (
        <View style={styles.monthSection}>
            <Text style={styles.monthTitle}>{month}</Text>
            <FlatList
                data={filteredGroupedBookings[month]}
                keyExtractor={(item) => item.id}
                renderItem={renderBookingItem}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            
            <FlatList
                data={Object.keys(filteredGroupedBookings)}
                keyExtractor={(item) => item}
                renderItem={renderMonthSection}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <BlurView intensity={80} tint="light" style={styles.modalOverlay}>
                    <Animated.View 
                        entering={FadeIn}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Lọc theo trạng thái</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        
                        {['Đang xử lý', 'Đặt thành công', 'Đặt thất bại', 'Đã hủy'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.filterOption,
                                    filterStatus === status && styles.filterOptionActive
                                ]}
                                onPress={() => {
                                    setFilterStatus(status);
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={[
                                    styles.filterText,
                                    filterStatus === status && styles.filterTextActive
                                ]}>{status}</Text>
                            </TouchableOpacity>
                        ))}
                        
                        <TouchableOpacity
                            style={styles.clearFilterButton}
                            onPress={() => {
                                setFilterStatus(null);
                                setModalVisible(false);
                            }}
                        >
                            <Text style={styles.clearFilterText}>Bỏ lọc</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    listContainer: {
        paddingBottom: 20,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    filterButton: {
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
    monthSection: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 15,
    },
    bookingCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
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
    statusBadge: {
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginBottom: 10,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    hotelName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: 10,
        flex: 1,
    },
    hrLine: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 12,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bookingCode: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    filterOption: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 10,
        backgroundColor: '#f5f5f5',
    },
    filterOptionActive: {
        backgroundColor: colors.primary + '20',
    },
    filterText: {
        fontSize: 16,
        color: colors.textPrimary,
    },
    filterTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    clearFilterButton: {
        marginTop: 10,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
    },
    clearFilterText: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '600',
    },
});
