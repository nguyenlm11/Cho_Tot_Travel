import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome } from 'react-native-vector-icons';
import { colors } from '../../constants/Colors';

export default function FilterModal({
    visible,
    onClose,
    priceFrom,
    priceTo,
    selectedStar,
    setPriceFrom,
    setPriceTo,
    setSelectedStar,
}) {
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
        if (tempSelectedStar === star) {
            setTempSelectedStar(null);
        } else {
            setTempSelectedStar(star);
        }
    };

    const handleConfirm = () => {
        setPriceFrom(tempPriceFrom);
        setPriceTo(tempPriceTo);
        setSelectedStar(tempSelectedStar);
        onClose();
    };

    const handleClose = () => {
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
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.modalBackground}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <FontAwesome name="close" size={20} color="#4A4A4A" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Lọc</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Giá phòng mỗi đêm</Text>
                        <View style={styles.row}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập giá"
                                keyboardType="numeric"
                                value={tempPriceFrom}
                                onChangeText={setTempPriceFrom}
                            />
                            <Text style={styles.toText}>Đến</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập giá"
                                keyboardType="numeric"
                                value={tempPriceTo}
                                onChangeText={setTempPriceTo}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Hạng sao</Text>
                        <View style={styles.row}>
                            {starOptions.map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    style={[
                                        styles.starButton,
                                        tempSelectedStar === star && styles.selectedStar,
                                    ]}
                                    onPress={() => selectStar(star)}
                                >
                                    <Text
                                        style={
                                            tempSelectedStar === star
                                                ? styles.selectedStarText
                                                : styles.starText
                                        }
                                    >
                                        {star} sao
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                            <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyButton} onPress={handleConfirm}>
                            <Text style={styles.applyButtonText}>Áp dụng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalContainer: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 100,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
    },
    toText: {
        marginHorizontal: 5,
    },
    starButton: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
    },
    selectedStar: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    starText: {
        color: 'gray',
    },
    selectedStarText: {
        color: colors.textThird,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    clearButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 5,
        marginRight: 10,
        alignItems: 'center',
    },
    clearButtonText: {
        color: 'black',
    },
    applyButton: {
        flex: 1,
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    applyButtonText: {
        color: colors.textThird,
    },
});