import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { FontAwesome, Ionicons } from 'react-native-vector-icons';
import { colors } from '../../constants/Colors';

export default function GuestModal({ visible, onClose, rooms, adults, children, setRooms, setAdults, setChildren }) {
    const [tempRooms, setTempRooms] = useState(rooms);
    const [tempAdults, setTempAdults] = useState(adults);
    const [tempChildren, setTempChildren] = useState(children);

    const handleConfirm = () => {
        setRooms(tempRooms);
        setAdults(tempAdults);
        setChildren(tempChildren);
        onClose();
    };

    const handleClose = () => {
        setTempRooms(rooms);
        setTempAdults(adults);
        setTempChildren(children);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <FontAwesome name="close" size={20} color="#4A4A4A" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Chọn số phòng và khách</Text>

                    <ScrollView>
                        <View style={styles.counterRow}>
                            <Text style={styles.counterLabel}>Phòng</Text>
                            <View style={styles.counterControls}>
                                <TouchableOpacity
                                    onPress={() => setTempRooms(Math.max(1, tempRooms - 1))}
                                    style={[styles.counterButton, tempRooms === 1 && styles.disabledButton]}
                                    disabled={tempRooms === 1}
                                >
                                    <Ionicons
                                        name="remove-circle-outline"
                                        size={30}
                                        color={tempRooms === 1 ? '#C0C0C0' : '#30B53E'}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.counterValue}>{tempRooms}</Text>
                                <TouchableOpacity
                                    onPress={() => setTempRooms(Math.min(8, tempAdults, tempRooms + 1))}
                                    style={[styles.counterButton, tempRooms === 8 && styles.disabledButton]}
                                    disabled={tempRooms === 8}
                                >
                                    <Ionicons
                                        name="add-circle-outline"
                                        size={30}
                                        color={tempRooms === 8 ? '#C0C0C0' : '#30B53E'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.counterRow}>
                            <Text style={styles.counterLabel}>Người lớn</Text>
                            <View style={styles.counterControls}>
                                <TouchableOpacity
                                    onPress={() => setTempAdults(Math.max(1, tempAdults - 1))}
                                    style={[styles.counterButton, tempAdults === 1 && styles.disabledButton]}
                                    disabled={tempAdults === 1}
                                >
                                    <Ionicons
                                        name="remove-circle-outline"
                                        size={30}
                                        color={tempAdults === 1 ? '#C0C0C0' : '#30B53E'}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.counterValue}>{tempAdults}</Text>
                                <TouchableOpacity
                                    onPress={() => setTempAdults(Math.min(32, tempAdults + 1))}
                                    style={[styles.counterButton, tempAdults === 32 && styles.disabledButton]}
                                    disabled={tempAdults === 32}
                                >
                                    <Ionicons
                                        name="add-circle-outline"
                                        size={30}
                                        color={tempAdults === 32 ? '#C0C0C0' : '#30B53E'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.counterRow}>
                            <Text style={styles.counterLabel}>Trẻ em</Text>
                            <View style={styles.counterControls}>
                                <TouchableOpacity
                                    onPress={() => setTempChildren(Math.max(0, tempChildren - 1))}
                                    style={[styles.counterButton, tempChildren === 0 && styles.disabledButton]}
                                    disabled={tempChildren === 0}
                                >
                                    <Ionicons
                                        name="remove-circle-outline"
                                        size={30}
                                        color={tempChildren === 0 ? '#C0C0C0' : '#30B53E'}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.counterValue}>{tempChildren}</Text>
                                <TouchableOpacity
                                    onPress={() => setTempChildren(Math.min(6, tempChildren + 1))}
                                    style={[styles.counterButton, tempChildren === 6 && styles.disabledButton]}
                                    disabled={tempChildren === 6}
                                >
                                    <Ionicons
                                        name="add-circle-outline"
                                        size={30}
                                        color={tempChildren === 6 ? '#C0C0C0' : '#30B53E'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>

                    <TouchableOpacity onPress={handleConfirm} style={styles.modalCloseButton}>
                        <Text style={styles.modalCloseButtonText}>Hoàn tất</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 100,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    counterLabel: {
        fontSize: 18,
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterButton: {
        marginHorizontal: 10,
    },
    disabledButton: {
        opacity: 0.5,
    },
    counterValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalCloseButton: {
        marginTop: 20,
        backgroundColor: colors.primary,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: colors.textThird,
        fontWeight: 'bold',
    },
});
