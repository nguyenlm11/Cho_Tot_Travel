import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome } from 'react-native-vector-icons';
import { colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, SlideOutDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function GuestModal({ visible, onClose, rooms, adults, children, setRooms, setAdults, setChildren }) {
    const [tempRooms, setTempRooms] = useState(rooms);
    const [tempAdults, setTempAdults] = useState(adults);
    const [tempChildren, setTempChildren] = useState(children);

    const handleClose = () => {
        setTempRooms(rooms);
        setTempAdults(adults);
        setTempChildren(children);
        onClose();
    };

    const handleSave = () => {
        setRooms(tempRooms);
        setAdults(tempAdults);
        setChildren(tempChildren);
        onClose();
    };

    const handleIncrement = (setter, value, max) => {
        if (value < max) setter(value + 1);
    };

    const handleDecrement = (setter, value, min) => {
        if (value > min) setter(value - 1);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <Animated.View
                entering={FadeInDown}
                style={styles.modalBackground}
            >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardView}
                >
                    <Animated.View
                        entering={FadeInDown}
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
                            <Text style={styles.modalTitle}>Số lượng khách & phòng</Text>
                        </LinearGradient>

                        <View style={styles.content}>
                            {/* Rooms Selection */}
                            <View style={styles.selectionCard}>
                                <View style={styles.selectionInfo}>
                                    <View style={styles.iconContainer}>
                                        <FontAwesome name="bed" size={24} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.selectionTitle}>Số phòng</Text>
                                        <Text style={styles.selectionDesc}>Tối đa 5 phòng</Text>
                                    </View>
                                </View>
                                <View style={styles.counterContainer}>
                                    <TouchableOpacity
                                        style={[styles.counterButton, tempRooms <= 1 && styles.counterButtonDisabled]}
                                        onPress={() => handleDecrement(setTempRooms, tempRooms, 1)}
                                        disabled={tempRooms <= 1}
                                    >
                                        <FontAwesome name="minus" size={20} color={tempRooms <= 1 ? '#ccc' : colors.primary} />
                                    </TouchableOpacity>
                                    <Text style={styles.counterText}>{tempRooms}</Text>
                                    <TouchableOpacity
                                        style={[styles.counterButton, tempRooms >= 5 && styles.counterButtonDisabled]}
                                        onPress={() => handleIncrement(setTempRooms, tempRooms, 5)}
                                        disabled={tempRooms >= 5}
                                    >
                                        <FontAwesome name="plus" size={20} color={tempRooms >= 5 ? '#ccc' : colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Adults Selection */}
                            <View style={styles.selectionCard}>
                                <View style={styles.selectionInfo}>
                                    <View style={styles.iconContainer}>
                                        <FontAwesome name="user" size={24} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.selectionTitle}>Người lớn</Text>
                                        <Text style={styles.selectionDesc}>Từ 13 tuổi trở lên</Text>
                                    </View>
                                </View>
                                <View style={styles.counterContainer}>
                                    <TouchableOpacity
                                        style={[styles.counterButton, tempAdults <= 1 && styles.counterButtonDisabled]}
                                        onPress={() => handleDecrement(setTempAdults, tempAdults, 1)}
                                        disabled={tempAdults <= 1}
                                    >
                                        <FontAwesome name="minus" size={20} color={tempAdults <= 1 ? '#ccc' : colors.primary} />
                                    </TouchableOpacity>
                                    <Text style={styles.counterText}>{tempAdults}</Text>
                                    <TouchableOpacity
                                        style={[styles.counterButton, tempAdults >= 10 && styles.counterButtonDisabled]}
                                        onPress={() => handleIncrement(setTempAdults, tempAdults, 10)}
                                        disabled={tempAdults >= 10}
                                    >
                                        <FontAwesome name="plus" size={20} color={tempAdults >= 10 ? '#ccc' : colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Children Selection */}
                            <View style={styles.selectionCard}>
                                <View style={styles.selectionInfo}>
                                    <View style={styles.iconContainer}>
                                        <FontAwesome name="child" size={24} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.selectionTitle}>Trẻ em</Text>
                                        <Text style={styles.selectionDesc}>Dưới 13 tuổi</Text>
                                    </View>
                                </View>
                                <View style={styles.counterContainer}>
                                    <TouchableOpacity
                                        style={[styles.counterButton, tempChildren <= 0 && styles.counterButtonDisabled]}
                                        onPress={() => handleDecrement(setTempChildren, tempChildren, 0)}
                                        disabled={tempChildren <= 0}
                                    >
                                        <FontAwesome name="minus" size={20} color={tempChildren <= 0 ? '#ccc' : colors.primary} />
                                    </TouchableOpacity>
                                    <Text style={styles.counterText}>{tempChildren}</Text>
                                    <TouchableOpacity
                                        style={[styles.counterButton, tempChildren >= 5 && styles.counterButtonDisabled]}
                                        onPress={() => handleIncrement(setTempChildren, tempChildren, 5)}
                                        disabled={tempChildren >= 5}
                                    >
                                        <FontAwesome name="plus" size={20} color={tempChildren >= 5 ? '#ccc' : colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <LinearGradient
                                colors={[colors.primary, colors.primary + 'E6']}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.saveButtonText}>Xác nhận</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </KeyboardAvoidingView>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: 'hidden',
    },
    header: {
        padding: 20,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    content: {
        padding: 20,
    },
    selectionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    selectionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    selectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    selectionDesc: {
        fontSize: 13,
        color: '#666',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterButtonDisabled: {
        backgroundColor: '#f5f5f5',
    },
    counterText: {
        fontSize: 16,
        fontWeight: '500',
        marginHorizontal: 15,
        minWidth: 20,
        textAlign: 'center',
    },
    saveButton: {
        margin: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
