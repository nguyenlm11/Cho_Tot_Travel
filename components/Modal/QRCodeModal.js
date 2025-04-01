import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';

const QRCodeModal = ({ visible, bookingId, onClose }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Nút đóng */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>

                    {/* Tiêu đề */}
                    <Text style={styles.modalTitle}>Mã QR đặt phòng</Text>
                    <Text style={styles.bookingIdText}>#{bookingId}</Text>

                    {/* QR Code */}
                    <View style={styles.qrContainer}>
                        <QRCode
                            value={bookingId ? bookingId.toString() : 'N/A'}
                            size={200}
                            color={colors.textPrimary}
                            backgroundColor="#fff"
                        />
                    </View>

                    {/* Hướng dẫn */}
                    <Text style={styles.instructionText}>
                        Quét mã này trên website để xác nhận đặt phòng
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Lớp phủ mờ
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '85%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    bookingIdText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    qrContainer: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 20,
    },
    instructionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default QRCodeModal;