import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { FontAwesome } from 'react-native-vector-icons';
import { colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, SlideOutDown } from 'react-native-reanimated';

const { height } = Dimensions.get('window');

export default function GuestModal({ visible, onClose, adults, children, setAdults, setChildren }) {
    const [tempAdults, setTempAdults] = useState(adults);
    const [tempChildren, setTempChildren] = useState(children);

    useEffect(() => {
        if (visible) {
            setTempAdults(adults);
            setTempChildren(children);
        }
    }, [visible, adults, children]);

    const incrementAdults = () => {
        if (tempAdults < 10) {
            setTempAdults(tempAdults + 1);
        }
    };

    const decrementAdults = () => {
        if (tempAdults > 1) {
            setTempAdults(tempAdults - 1);
        }
    };

    const incrementChildren = () => {
        if (tempChildren < 5) {
            setTempChildren(tempChildren + 1);
        }
    };

    const decrementChildren = () => {
        if (tempChildren > 0) {
            setTempChildren(tempChildren - 1);
        }
    };

    const handleClose = () => {
        setTempAdults(adults);
        setTempChildren(children);
        onClose();
    };

    const handleSave = () => {
        if (typeof setAdults === 'function') {
            setAdults(tempAdults);
        } else {
            console.error("GuestModal - setAdults is not a function");
        }

        if (typeof setChildren === 'function') {
            setChildren(tempChildren);
        } else {
            console.error("GuestModal - setChildren is not a function");
        }
        onClose();
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
                            <Text style={styles.modalTitle}>Số lượng khách</Text>
                        </LinearGradient>

                        <View style={styles.content}>
                            {/* Adults */}
                            <View style={styles.selectionCard}>
                                <View style={styles.selectionInfo}>
                                    <Text style={styles.selectionTitle}>Người lớn</Text>
                                    <Text style={styles.selectionSubtitle}>Từ 13 tuổi trở lên</Text>
                                </View>
                                <View style={styles.counterContainer}>
                                    <TouchableOpacity
                                        style={[styles.counterButton, tempAdults <= 1 && styles.disabledButton]}
                                        onPress={decrementAdults}
                                        disabled={tempAdults <= 1}
                                    >
                                        <FontAwesome name="minus" size={16} color={tempAdults <= 1 ? "#ccc" : colors.primary} />
                                    </TouchableOpacity>
                                    <Text style={styles.counterText}>{tempAdults}</Text>
                                    <TouchableOpacity
                                        style={[styles.counterButton, tempAdults >= 10 && styles.disabledButton]}
                                        onPress={incrementAdults}
                                        disabled={tempAdults >= 10}
                                    >
                                        <FontAwesome name="plus" size={16} color={tempAdults >= 10 ? "#ccc" : colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Children */}
                            <View style={styles.selectionCard}>
                                <View style={styles.selectionInfo}>
                                    <Text style={styles.selectionTitle}>Trẻ em</Text>
                                    <Text style={styles.selectionSubtitle}>Từ 0-12 tuổi</Text>
                                </View>
                                <View style={styles.counterContainer}>
                                    <TouchableOpacity
                                        style={[styles.counterButton, tempChildren <= 0 && styles.disabledButton]}
                                        onPress={decrementChildren}
                                        disabled={tempChildren <= 0}
                                    >
                                        <FontAwesome name="minus" size={16} color={tempChildren <= 0 ? "#ccc" : colors.primary} />
                                    </TouchableOpacity>
                                    <Text style={styles.counterText}>{tempChildren}</Text>
                                    <TouchableOpacity
                                        style={[styles.counterButton, tempChildren >= 5 && styles.disabledButton]}
                                        onPress={incrementChildren}
                                        disabled={tempChildren >= 5}
                                    >
                                        <FontAwesome name="plus" size={16} color={tempChildren >= 5 ? "#ccc" : colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
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
        maxHeight: height * 0.8,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    selectionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    selectionInfo: {
        flex: 1,
    },
    selectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    selectionSubtitle: {
        fontSize: 14,
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
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    counterText: {
        fontSize: 16,
        fontWeight: '600',
        marginHorizontal: 12,
        minWidth: 24,
        textAlign: 'center',
    },
    disabledButton: {
        backgroundColor: '#f5f5f5',
        borderColor: '#eee',
    },
    footer: {
        flexDirection: 'row',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginBottom: 20,
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 8,
        marginRight: 10,
    },
    cancelButtonText: {
        color: colors.primary,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 8,
        marginRight: 10,
        backgroundColor: colors.primary,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
