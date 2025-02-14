import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions } from 'react-native';
import { FontAwesome, Ionicons } from 'react-native-vector-icons';
import { colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInUp, SlideOutDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

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

    const renderCounter = (label, value, onDecrease, onIncrease, min, max) => (
        <View style={styles.counterRow}>
            <Text style={styles.counterLabel}>{label}</Text>
            <View style={styles.counterControls}>
                <TouchableOpacity
                    onPress={onDecrease}
                    style={[styles.counterButton, value === min && styles.disabledButton]}
                    disabled={value === min}
                >
                    <LinearGradient
                        colors={value === min ? ['#f0f0f0', '#e0e0e0'] : ['#fff', '#f8f9fa']}
                        style={styles.gradientButton}
                    >
                        <Ionicons
                            name="remove"
                            size={24}
                            color={value === min ? '#C0C0C0' : colors.primary}
                        />
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.counterValueContainer}>
                    <Text style={styles.counterValue}>{value}</Text>
                </View>
                <TouchableOpacity
                    onPress={onIncrease}
                    style={[styles.counterButton, value === max && styles.disabledButton]}
                    disabled={value === max}
                >
                    <LinearGradient
                        colors={value === max ? ['#f0f0f0', '#e0e0e0'] : ['#fff', '#f8f9fa']}
                        style={styles.gradientButton}
                    >
                        <Ionicons
                            name="add"
                            size={24}
                            color={value === max ? '#C0C0C0' : colors.primary}
                        />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent={true}
            onRequestClose={handleClose}
        >
            <Animated.View
                entering={FadeIn}
                style={styles.modalBackground}
            >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                
                <Animated.View
                    entering={SlideInUp}
                    exiting={SlideOutDown}
                    style={styles.modalContainer}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primary + 'E6']}
                        style={styles.header}
                    >
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                                <FontAwesome name="close" size={20} color="#fff" />
                            </BlurView>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Chọn số phòng và khách</Text>
                    </LinearGradient>

                    <ScrollView style={styles.content}>
                        {renderCounter(
                            'Phòng',
                            tempRooms,
                            () => setTempRooms(Math.max(1, tempRooms - 1)),
                            () => setTempRooms(Math.min(8, tempRooms + 1)),
                            1,
                            8
                        )}
                        {renderCounter(
                            'Người lớn',
                            tempAdults,
                            () => setTempAdults(Math.max(1, tempAdults - 1)),
                            () => setTempAdults(Math.min(32, tempAdults + 1)),
                            1,
                            32
                        )}
                        {renderCounter(
                            'Trẻ em',
                            tempChildren,
                            () => setTempChildren(Math.max(0, tempChildren - 1)),
                            () => setTempChildren(Math.min(6, tempChildren + 1)),
                            0,
                            6
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <LinearGradient
                                colors={[colors.primary, colors.primary + 'E6']}
                                style={styles.gradientConfirmButton}
                            >
                                <Text style={styles.confirmButtonText}>Xác nhận</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        maxHeight: height * 0.9,
    },
    header: {
        padding: 20,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1,
    },
    blurButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    counterLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterButton: {
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    gradientButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterValueContainer: {
        minWidth: 50,
        alignItems: 'center',
        marginHorizontal: 12,
    },
    counterValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    confirmButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientConfirmButton: {
        padding: 16,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
});
