import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons, Feather } from 'react-native-vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';

export default function BookingDetailScreen({ route }) {
    const { hotelName, bookingCode, price, status, statusColor } = route.params;
    const navigation = useNavigation();

    const [showGuestInfo, setShowGuestInfo] = useState(false);
    const [showPriceDetails, setShowPriceDetails] = useState(false);

    return (
        <ScrollView style={styles.container}>
            {/* Tiêu đề khách sạn */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={20} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">{hotelName}</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{status}</Text>
            </View>

            {/* Thông tin phòng */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <FontAwesome5 name="hotel" size={20} color="#ffffff" />
                    <Text style={styles.hotelName}>{hotelName}</Text>
                </View>

                <View style={styles.content}>
                    <Text style={styles.roomTitle}>
                        Phòng Superior, 2 giường đơn, quang cảnh thành phố
                    </Text>
                    <Text style={styles.roomSubtitle}>240m²</Text>

                    <View style={styles.detailRow}>
                        <View style={styles.rowHeader}>
                            <FontAwesome5 name="moon" size={20} color="#666" style={styles.icon} />
                            <Text style={styles.detailLabel}>Số đêm</Text>
                        </View>
                        <Text style={styles.detailValue}>2 đêm</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.rowHeader}>
                            <FontAwesome5 name="user" size={23} color="#666" style={styles.icon} />
                            <Text style={styles.detailLabel}>Khách</Text>
                        </View>
                        <Text style={styles.detailValue}>2 người lớn, 1 trẻ em</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.rowHeader}>
                            <Ionicons name="bed-outline" size={20} color="#666" style={styles.icon} />
                            <Text style={styles.detailLabel}>Loại giường</Text>
                        </View>
                        <Text style={styles.detailValue}>2 giường đơn, 1 giường cỡ queen</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.rowHeader}>
                            <FontAwesome5 name="clock" size={20} color="#666" style={styles.icon} />
                            <Text style={styles.detailLabel}>Nhận phòng</Text>
                        </View>
                        <Text style={styles.detailValue}>Thứ Tư, 02/02/2022 (15:00 - 03:00)</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.rowHeader}>
                            <FontAwesome5 name="clock" size={20} color="#666" style={styles.icon} />
                            <Text style={styles.detailLabel}>Trả phòng</Text>
                        </View>
                        <Text style={styles.detailValue}>Thứ Sáu, 04/02/2022 (trước 11:00)</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.rowHeader}>
                            <MaterialIcons name="confirmation-number" size={20} color="#666" style={styles.icon} />
                            <Text style={styles.detailLabel}>Mã đặt chỗ</Text>
                        </View>
                        <Text style={styles.bookingCode}>{bookingCode}</Text>
                    </View>
                </View>
            </View>

            {/* Thông tin khách */}
            <View style={styles.dropdownCard}>
                <TouchableOpacity onPress={() => setShowGuestInfo(!showGuestInfo)} style={styles.toggleRow}>
                    <Text style={styles.sectionTitle}>Thông tin khách</Text>
                    <Ionicons name={showGuestInfo ? "chevron-up" : "chevron-down"} size={20} color="#333" />
                </TouchableOpacity>
                {showGuestInfo &&
                    <>
                        <View style={styles.detailRow}>
                            <View style={styles.rowHeader}>
                                <FontAwesome5 name="user" size={20} color="#666" style={styles.icon} />
                                <Text style={styles.detailLabel}>Tên khách hàng</Text>
                            </View>
                            <Text style={styles.detailValue}>NGUYEN VAN A</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.rowHeader}>
                                <FontAwesome5 name="phone-alt" size={20} color="#666" style={styles.icon} />
                                <Text style={styles.detailLabel}>Số điện thoại</Text>
                            </View>
                            <Text style={styles.detailValue}>0327953466</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.rowHeader}>
                                <Feather name="mail" size={20} color="#666" style={styles.icon} />
                                <Text style={styles.detailLabel}>Email</Text>
                            </View>
                            <Text style={styles.detailValue}>lmn050103@gmail.com</Text>
                        </View>
                    </>
                }
            </View>

            {/* Chi tiết giá */}
            <View style={styles.dropdownCard}>
                <TouchableOpacity onPress={() => setShowPriceDetails(!showPriceDetails)} style={styles.toggleRow}>
                    <Text style={styles.sectionTitle}>Chi tiết giá</Text>
                    <Ionicons name={showPriceDetails ? "chevron-up" : "chevron-down"} size={20} color="#333" />
                </TouchableOpacity>
                {showPriceDetails && (
                    <>
                        <Text style={styles.priceDetail}>1 Pullman Vũng Tàu: 3.600.000 đ</Text>
                        <Text style={styles.priceDetail}>1 Pullman Vũng Tàu: 3.600.000 đ</Text>
                        <Text style={styles.priceDetail}>Thuế và phí: 800.000 đ</Text>
                        <Text style={styles.totalPrice}>Tổng giá: {price}</Text>
                    </>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: colors.primary,
        padding: 20,
        paddingTop: 100,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold'
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginBottom: 8,
        marginTop: 8,
        marginHorizontal: 15,
    },
    statusText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 8,
        overflow: "hidden",
        margin: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    cardHeader: {
        backgroundColor: colors.primary,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    hotelName: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 8,
    },
    content: {
        padding: 16,
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 4,
    },
    roomSubtitle: {
        fontSize: 14,
        color: "#888",
        marginBottom: 16,
    },
    detailRow: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingBottom: 12,
    },
    rowHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    icon: {
        marginRight: 8,
    },
    detailLabel: {
        fontSize: 16,
        color: "#555",
        fontWeight: "bold",
    },
    detailValue: {
        fontSize: 17,
        color: "#333",
        fontWeight: 'bold',
        paddingLeft: 28,
    },
    bookingCode: {
        fontSize: 17,
        fontWeight: "bold",
        paddingLeft: 28,
        color: "#007BFF",
    },
    dropdownCard: {
        backgroundColor: "#fff",
        borderRadius: 8,
        overflow: "hidden",
        marginLeft: 16,
        marginRight: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        padding: 15
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    priceDetail: {
        fontSize: 14,
        color: '#424242',
        marginBottom: 5,
    },
    totalPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976d2',
        marginTop: 10,
    },
});
