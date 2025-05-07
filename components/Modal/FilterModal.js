import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, SlideOutDown } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FilterModal = ({ visible, onClose, priceFrom, priceTo, selectedStar, setPriceFrom, setPriceTo, setSelectedStar }) => {
    const [localPriceFrom, setLocalPriceFrom] = useState(priceFrom);
    const [localPriceTo, setLocalPriceTo] = useState(priceTo);
    const [localSelectedStar, setLocalSelectedStar] = useState(selectedStar);

    useEffect(() => {
        if (visible) {
            setLocalPriceFrom(priceFrom);
            setLocalPriceTo(priceTo);
            setLocalSelectedStar(selectedStar);
        }
    }, [visible, priceFrom, priceTo, selectedStar]);

    const handlePriceFromChange = (value) => {
        setLocalPriceFrom(value);
        if (value && localPriceTo && parseInt(value) > parseInt(localPriceTo)) {
            setLocalPriceTo(value);
        }
    };

    const handlePriceToChange = (value) => {
        setLocalPriceTo(value);
        if (value && localPriceFrom && parseInt(value) < parseInt(localPriceFrom)) {
            setLocalPriceFrom(value);
        }
    };

    const handleApply = () => {
        setPriceFrom(localPriceFrom);
        setPriceTo(localPriceTo);
        setSelectedStar(localSelectedStar);
        onClose();
    };

    const handleReset = () => {
        setLocalPriceFrom('');
        setLocalPriceTo('');
        setLocalSelectedStar(null);
    };

    const renderBackground = () => {
        if (Platform.OS === 'ios') {
            return <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />;
        }
        return <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />;
    };

    const renderModalContent = () => (
        <Animated.View
            entering={Platform.OS === 'ios' ? FadeInDown : undefined}
            exiting={Platform.OS === 'ios' ? SlideOutDown : undefined}
            style={styles.modalContainer}
        >
            <LinearGradient
                colors={[colors.primary, colors.primary + 'E6']}
                style={styles.header}
            >
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.modalTitle}>Bộ lọc tìm kiếm</Text>
                    <Text style={styles.modalSubtitle}>Điều chỉnh bộ lọc để tìm phòng phù hợp</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <View style={styles.closeButtonContainer}>
                        <FontAwesome name="close" size={20} color="#fff" />
                    </View>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {/* Price Range Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Khoảng giá</Text>
                    <View style={styles.priceInputContainer}>
                        <View style={styles.priceInputWrapper}>
                            <Text style={styles.priceLabel}>Từ</Text>
                            <View style={styles.priceInput}>
                                <TextInput
                                    style={styles.input}
                                    value={localPriceFrom}
                                    onChangeText={handlePriceFromChange}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#999"
                                />
                                <Text style={styles.currency}>đ</Text>
                            </View>
                        </View>
                        <View style={styles.priceSeparator} />
                        <View style={styles.priceInputWrapper}>
                            <Text style={styles.priceLabel}>Đến</Text>
                            <View style={styles.priceInput}>
                                <TextInput
                                    style={styles.input}
                                    value={localPriceTo}
                                    onChangeText={handlePriceToChange}
                                    keyboardType="numeric"
                                    placeholder="Không giới hạn"
                                    placeholderTextColor="#999"
                                />
                                <Text style={styles.currency}>đ</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.presetTitle}>Hoặc chọn khoảng giá có sẵn</Text>
                    <View style={styles.pricePresets}>
                        <TouchableOpacity
                            style={[styles.pricePreset, localPriceFrom === '200000' && localPriceTo === '500000' && styles.pricePresetActive]}
                            onPress={() => {
                                setLocalPriceFrom('200000');
                                setLocalPriceTo('500000');
                            }}
                        >
                            <Text style={[styles.pricePresetText, localPriceFrom === '200000' && localPriceTo === '500000' && styles.pricePresetTextActive]}>
                                200K - 500K
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pricePreset, localPriceFrom === '500000' && localPriceTo === '1000000' && styles.pricePresetActive]}
                            onPress={() => {
                                setLocalPriceFrom('500000');
                                setLocalPriceTo('1000000');
                            }}
                        >
                            <Text style={[styles.pricePresetText, localPriceFrom === '500000' && localPriceTo === '1000000' && styles.pricePresetTextActive]}>
                                500K - 1M
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pricePreset, localPriceFrom === '1000000' && localPriceTo === '2000000' && styles.pricePresetActive]}
                            onPress={() => {
                                setLocalPriceFrom('1000000');
                                setLocalPriceTo('2000000');
                            }}
                        >
                            <Text style={[styles.pricePresetText, localPriceFrom === '1000000' && localPriceTo === '2000000' && styles.pricePresetTextActive]}>
                                1M - 2M
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pricePreset, localPriceFrom === '2000000' && localPriceTo === '5000000' && styles.pricePresetActive]}
                            onPress={() => {
                                setLocalPriceFrom('2000000');
                                setLocalPriceTo('5000000');
                            }}
                        >
                            <Text style={[styles.pricePresetText, localPriceFrom === '2000000' && localPriceTo === '5000000' && styles.pricePresetTextActive]}>
                                2M - 5M
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Rating Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Đánh giá</Text>
                    <View style={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                style={[styles.ratingButton, localSelectedStar === star && styles.ratingButtonActive]}
                                onPress={() => setLocalSelectedStar(localSelectedStar === star ? null : star)}
                            >
                                <Ionicons
                                    name="star"
                                    size={24}
                                    color={localSelectedStar === star ? colors.primary : '#E0E0E0'}
                                />
                                <Text style={[styles.ratingText, localSelectedStar === star && styles.ratingTextActive]}>
                                    {star}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleReset}
                >
                    <Text style={styles.resetButtonText}>Đặt lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApply}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.applyButtonGradient}
                    >
                        <Text style={styles.applyButtonText}>Áp dụng</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.modalBackground}>
                {renderBackground()}
                {renderModalContent()}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: Platform.OS === 'android' ? '60%' : height * 0.6,
        overflow: 'hidden',
    },
    header: {
        paddingTop: 25,
        paddingBottom: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1,
    },
    closeButtonContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    priceInputWrapper: {
        width: '45%',
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    priceInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        padding: 0,
    },
    currency: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    priceSeparator: {
        width: 20,
        height: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 12,
    },
    presetTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    pricePresets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-between',
    },
    pricePreset: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    pricePresetActive: {
        backgroundColor: colors.primary + '10',
        borderColor: colors.primary,
    },
    pricePresetText: {
        fontSize: 13,
        color: '#666',
    },
    pricePresetTextActive: {
        color: colors.primary,
        fontWeight: '500',
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    ratingButton: {
        alignItems: 'center',
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        width: '18%',
    },
    ratingButtonActive: {
        backgroundColor: colors.primary + '10',
    },
    ratingText: {
        marginTop: 4,
        fontSize: 12,
        color: '#666',
    },
    ratingTextActive: {
        color: colors.primary,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    },
    resetButton: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resetButtonText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '600',
    },
    applyButton: {
        flex: 2,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    applyButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});

export default FilterModal;