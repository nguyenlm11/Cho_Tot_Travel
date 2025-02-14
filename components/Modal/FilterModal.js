import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { FontAwesome } from 'react-native-vector-icons';
import { colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInUp, SlideOutDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function FilterModal({ visible, onClose, priceFrom, priceTo, selectedStar, setPriceFrom, setPriceTo, setSelectedStar }) {
    const [tempPriceFrom, setTempPriceFrom] = useState(priceFrom);
    const [tempPriceTo, setTempPriceTo] = useState(priceTo);
    const [tempSelectedStar, setTempSelectedStar] = useState(selectedStar);

    const starOptions = [1, 2, 3, 4, 5];

    useEffect(() => {
        if (visible) {
            setTempPriceFrom(priceFrom);
            setTempPriceTo(priceTo);
            setTempSelectedStar(selectedStar);
        }
    }, [visible, priceFrom, priceTo, selectedStar]);

    const selectStar = (star) => {
        setTempSelectedStar(tempSelectedStar === star ? null : star);
    };

    const handleConfirm = () => {
        setPriceFrom(tempPriceFrom);
        setPriceTo(tempPriceTo);
        setSelectedStar(tempSelectedStar);
        onClose();
    };

    const clearFilters = () => {
        setTempPriceFrom('');
        setTempPriceTo('');
        setTempSelectedStar(null);
    };

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent
            onRequestClose={onClose}
        >
            <Animated.View
                entering={FadeIn}
                style={styles.modalBackground}
            >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    style={styles.keyboardView}
                >
                    <Animated.View
                        entering={SlideInUp}
                        exiting={SlideOutDown}
                        style={styles.modalContainer}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.primary + 'E6']}
                            style={styles.header}
                        >
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                                    <FontAwesome name="close" size={20} color="#fff" />
                                </BlurView>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Bộ lọc tìm kiếm</Text>
                        </LinearGradient>

                        <View style={styles.content}>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Khoảng giá mỗi đêm</Text>
                                <View style={styles.priceInputContainer}>
                                    <View style={styles.priceInput}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Giá từ"
                                            keyboardType="numeric"
                                            value={tempPriceFrom}
                                            onChangeText={setTempPriceFrom}
                                        />
                                        <Text style={styles.currency}>đ</Text>
                                    </View>
                                    <Text style={styles.separator}>-</Text>
                                    <View style={styles.priceInput}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Giá đến"
                                            keyboardType="numeric"
                                            value={tempPriceTo}
                                            onChangeText={setTempPriceTo}
                                        />
                                        <Text style={styles.currency}>đ</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Hạng sao</Text>
                                <View style={styles.starContainer}>
                                    {starOptions.map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => selectStar(star)}
                                            style={styles.starButton}
                                        >
                                            <LinearGradient
                                                colors={tempSelectedStar === star
                                                    ? [colors.primary, colors.primary + 'E6']
                                                    : ['#fff', '#f8f9fa']}
                                                style={styles.starGradient}
                                            >
                                                <Text style={[
                                                    styles.starText,
                                                    tempSelectedStar === star && styles.selectedStarText
                                                ]}>
                                                    {star} sao
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                                <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                                <LinearGradient
                                    colors={[colors.primary, colors.primary + 'E6']}
                                    style={styles.gradientConfirmButton}
                                >
                                    <Text style={styles.confirmButtonText}>Áp dụng</Text>
                                </LinearGradient>
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    keyboardView: {
        flex: 1,
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    currency: {
        fontSize: 16,
        color: '#666',
        marginLeft: 4,
    },
    separator: {
        marginHorizontal: 12,
        fontSize: 16,
        color: '#666',
    },
    starContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    starButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    starGradient: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    starText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    selectedStarText: {
        color: '#fff',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    },
    clearButton: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    clearButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
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
});