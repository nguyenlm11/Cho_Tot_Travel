import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, Button } from 'react-native';
import { FontAwesome6, Ionicons } from 'react-native-vector-icons';
import { colors } from '../constants/Colors';

const bookings = [
    {
        id: '1',
        month: '01/2025',
        status: 'Đang xử lý',
        statusColor: '#FAD961',
        hotelName: 'Khách sạn Pullman Vũng Tàu',
        bookingCode: '453653657',
        price: '8.000.000 đ',
    },
    {
        id: '2',
        month: '12/2024',
        status: 'Đặt thành công',
        statusColor: '#A5D6A7',
        hotelName: 'Khách sạn Pullman Vũng Tàu',
        bookingCode: '453653657',
        price: '8.000.000 đ',
    },
    {
        id: '3',
        month: '12/2024',
        status: 'Đặt thất bại',
        statusColor: '#E57373',
        hotelName: 'Khách sạn Pullman Vũng Tàu',
        bookingCode: '453653657',
        price: '8.000.000 đ',
    },
    {
        id: '4',
        month: '11/2024',
        status: 'Đã hủy',
        statusColor: '#BDBDBD',
        hotelName: 'Khách sạn Pullman Vũng Tàu',
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

    const renderBookingItem = ({ item }) => (
        <View style={styles.bookingCard}>
            <View style={[styles.statusBadge, { backgroundColor: item.statusColor }]}>
                <Text style={styles.statusText}>{item.status}</Text>
            </View>
            <View style={styles.nameContainer}>
                <FontAwesome6 name="hotel" size={20} color="#333" />
                <Text style={styles.hotelName}>{item.hotelName}</Text>
            </View>
            <View style={styles.hrLine} />
            <View style={styles.priceContainer}>
                <Text style={styles.bookingCode}>Mã đặt chỗ: {item.bookingCode}</Text>
                <Text style={styles.price}>{item.price}</Text>
            </View>
        </View>
    );

    const renderMonthSection = ({ item: month }) => (
        <View style={styles.monthSection}>
            <Text style={styles.monthTitle}>{month}</Text>
            <FlatList
                data={filteredGroupedBookings[month]}
                keyExtractor={(item) => item.id}
                renderItem={renderBookingItem}
            />
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={Object.keys(filteredGroupedBookings)}
                keyExtractor={(item) => item}
                renderItem={renderMonthSection}
                ListHeaderComponent={() => (
                    <View style={styles.header}>
                        <Text style={styles.headerText}>Danh sách đặt phòng</Text>
                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <Ionicons name="settings-sharp" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.container}
            />

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Lọc theo trạng thái</Text>
                        {['Đang xử lý', 'Đặt thành công', 'Đặt thất bại', 'Đã hủy'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={styles.filterButton}
                                onPress={() => {
                                    setFilterStatus(status);
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={styles.filterText}>{status}</Text>
                            </TouchableOpacity>
                        ))}
                        <Button
                            title="Bỏ lọc"
                            onPress={() => {
                                setFilterStatus(null);
                                setModalVisible(false);
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 100,
        backgroundColor: colors.primary,
    },
    headerText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    monthSection: {
        marginVertical: 10,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        paddingHorizontal: 15,
    },
    bookingCard: {
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
        padding: 15,
        marginHorizontal: 15,
        marginBottom: 10,
        elevation: 2,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    hotelName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 5,
        marginBottom: 5,
        marginLeft: 8,
    },
    hrLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#D1D1D1',
        marginBottom: 8,
        marginTop: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignContent: 'center',
    },
    bookingCode: {
        fontSize: 15,
        color: '#757575',
        marginBottom: 5,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007BFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    filterButton: {
        padding: 10,
        backgroundColor: '#F1F1F1',
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginVertical: 5,
    },
    filterText: {
        fontSize: 16,
        color: '#333',
    },
});
