import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import Animated, { FadeInDown, SlideOutDown } from 'react-native-reanimated';
import { Ionicons as Icon } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { FontAwesome } from 'react-native-vector-icons';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function FilterModal({ visible, onClose, priceFrom, priceTo, selectedStar, setPriceFrom, setPriceTo, setSelectedStar }) {
    const [tempPriceFrom, setTempPriceFrom] = useState(priceFrom || 100000);
    const [tempPriceTo, setTempPriceTo] = useState(priceTo || 5000000);
    const [tempSelectedStar, setTempSelectedStar] = useState(selectedStar);

    const MIN_PRICE = 100000;
    const MAX_PRICE = 5000000;
    const starOptions = [1, 2, 3, 4, 5];

    const handleSave = () => {
        setPriceFrom(tempPriceFrom);
        setPriceTo(tempPriceTo);
        setSelectedStar(tempSelectedStar);
        onClose();
    };

    const handleClearFilters = () => {
        setTempPriceFrom(100000);
        setTempPriceTo(5000000);
        setTempSelectedStar(null);
    };

    const formatPrice = (price) => {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <Animated.View
                entering={FadeInDown}
                style={styles.modalBackground}
            >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                                    <FontAwesome name="close" size={20} color="#fff" />
                                </BlurView>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Bộ lọc tìm kiếm</Text>
                        </LinearGradient>

                        <ScrollView style={styles.content}>
                            {/* Price Range Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Khoảng giá</Text>
                                <View style={styles.priceRangeContainer}>
                                    <View style={styles.priceDisplay}>
                                        <Text style={styles.priceLabel}>Từ</Text>
                                        <Text style={styles.priceValue}>
                                            {formatPrice(tempPriceFrom)}đ
                                        </Text>
                                    </View>
                                    <View style={styles.priceDisplay}>
                                        <Text style={styles.priceLabel}>Đến</Text>
                                        <Text style={styles.priceValue}>
                                            {formatPrice(tempPriceTo)}đ
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.sliderContainer}>
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={MIN_PRICE}
                                        maximumValue={MAX_PRICE}
                                        value={tempPriceFrom}
                                        onValueChange={(value) => setTempPriceFrom(Math.round(value / 100000) * 100000)}
                                        minimumTrackTintColor={colors.primary}
                                        maximumTrackTintColor="#ddd"
                                        thumbTintColor={colors.primary}
                                    />
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={MIN_PRICE}
                                        maximumValue={MAX_PRICE}
                                        value={tempPriceTo}
                                        onValueChange={(value) => setTempPriceTo(Math.round(value / 100000) * 100000)}
                                        minimumTrackTintColor={colors.primary}
                                        maximumTrackTintColor="#ddd"
                                        thumbTintColor={colors.primary}
                                    />
                                </View>
                            </View>

                            {/* Star Rating Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Hạng sao</Text>
                                <View style={styles.starContainer}>
                                    {starOptions.map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => setTempSelectedStar(star === tempSelectedStar ? null : star)}
                                            style={[
                                                styles.starButton,
                                                tempSelectedStar === star && styles.starButtonActive
                                            ]}
                                        >
                                            <Text style={[
                                                styles.starButtonText,
                                                tempSelectedStar === star && styles.starButtonTextActive
                                            ]}>
                                                {star} <FontAwesome name="star" size={16} color={tempSelectedStar === star ? '#fff' : colors.primary} />
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.clearFilterButton}
                                onPress={handleClearFilters}
                            >
                                <Icon name="refresh" size={20} color={colors.primary} />
                                <Text style={styles.clearFilterText}>Đặt lại</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSave}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.primary + 'E6']}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.saveButtonText}>Áp dụng</Text>
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
        maxHeight: '90%',
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
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    priceRangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    priceDisplay: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 10,
        minWidth: '45%',
    },
    priceLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.primary,
    },
    sliderContainer: {
        marginTop: 10,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    starContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    starButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        backgroundColor: colors.primary + '10',
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    starButtonActive: {
        backgroundColor: colors.primary,
    },
    starButtonText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '500',
    },
    starButtonTextActive: {
        color: '#fff',
    },
    buttonContainer: {
        flexDirection: 'row',
        padding: 20,
        paddingTop: 0,
        gap: 12,
    },
    clearFilterButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        backgroundColor: colors.primary + '10',
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    clearFilterText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
    },
    saveButton: {
        flex: 2,
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
    clearButton: {
        position: 'absolute',
        right: 15,
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        opacity: 0.9,
    },
});