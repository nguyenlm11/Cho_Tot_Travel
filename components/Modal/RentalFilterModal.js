import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, KeyboardAvoidingView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, SlideOutDown } from 'react-native-reanimated';
import { colors } from '../../constants/Colors';
import CalendarModal from './CalendarModal';
import GuestModal from './GuestModal';
import { useSearch } from '../../contexts/SearchContext';

const { height } = Dimensions.get('window');

const RentalFilterModal = ({ visible, onClose, searchParams, onApplyFilter }) => {
    const [localSearch, setLocalSearch] = useState({ ...currentSearch });
    const [isCalendarModalVisible, setCalendarModalVisible] = useState(false);
    const [isGuestModalVisible, setGuestModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { currentSearch, updateCurrentSearch } = useSearch();

    useEffect(() => {
        if (visible && searchParams) {
            setLocalSearch({ ...searchParams });
        }
    }, [visible, searchParams]);

    const handleDateSelect = (dateInfo) => {
        const updatedSearch = {
            ...localSearch,
            checkInDate: dateInfo.formattedDate,
            formattedCheckIn: dateInfo.dateString,
            checkOutDate: dateInfo.formattedCheckOutDate,
            formattedCheckOut: dateInfo.checkOutDateString,
        };
        setLocalSearch(updatedSearch);
        updateCurrentSearch(updatedSearch);
        setCalendarModalVisible(false);
    };

    const handleAdultsUpdate = (newAdults) => {
        setLocalSearch(prevState => ({
            ...prevState,
            adults: newAdults
        }));
    };

    const handleChildrenUpdate = (newChildren) => {
        setLocalSearch(prevState => ({
            ...prevState,
            children: newChildren
        }));
    };

    const handleApplyFilter = async () => {
        if (!localSearch) {
            Alert.alert("Lỗi", "Không có dữ liệu tìm kiếm");
            return;
        }
        setIsLoading(true);
        try {
            updateCurrentSearch(localSearch);
            const filterParams = {
                CheckInDate: localSearch.formattedCheckIn,
                CheckOutDate: localSearch.formattedCheckOut,
                NumberOfAdults: localSearch.adults,
                NumberOfChildren: localSearch.children
            };
            if (onApplyFilter) {
                await onApplyFilter(filterParams);
            }
            onClose();
        } catch (error) {
            console.error("Error applying filter:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi áp dụng bộ lọc");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setLocalSearch({ ...searchParams });
        updateCurrentSearch(searchParams);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
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
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.modalTitle}>Chỉnh sửa tìm kiếm</Text>
                                <Text style={styles.modalSubtitle}>Điều chỉnh thông tin để tìm phòng phù hợp</Text>
                            </View>
                            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                                    <FontAwesome name="close" size={20} color="#fff" />
                                </BlurView>
                            </TouchableOpacity>
                        </LinearGradient>

                        <View style={styles.contentContainer}>
                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={() => setCalendarModalVisible(true)}
                            >
                                <View style={styles.optionContent}>
                                    <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                                    <View style={styles.optionTextContainer}>
                                        <Text style={styles.optionLabel}>Nhận - Trả phòng</Text>
                                        <Text style={styles.optionValue}>
                                            {localSearch?.checkInDate && localSearch?.checkOutDate ? (
                                                <Text>
                                                    <Text style={styles.highlightText}>{localSearch.checkInDate.split(', ')[1]}</Text> - <Text style={styles.highlightText}>{localSearch.checkOutDate.split(', ')[1]}</Text>
                                                </Text>
                                            ) : (
                                                "Chọn ngày"
                                            )}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.editIconContainer}>
                                    <MaterialIcons name="edit" size={18} color={colors.primary} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={() => setGuestModalVisible(true)}
                            >
                                <View style={styles.optionContent}>
                                    <Ionicons name="people-outline" size={24} color={colors.primary} />
                                    <View style={styles.optionTextContainer}>
                                        <Text style={styles.optionLabel}>Khách</Text>
                                        <Text style={styles.optionValue}>
                                            <Text style={styles.highlightText}>{localSearch.adults}</Text> người lớn
                                            {localSearch.children > 0 ?
                                                <Text>, <Text style={styles.highlightText}>{localSearch.children}</Text> trẻ em</Text> :
                                                ''}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.editIconContainer}>
                                    <MaterialIcons name="edit" size={18} color={colors.primary} />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={handleApplyFilter}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={[colors.primary, colors.secondary]}
                                        style={styles.gradientButton}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.applyButtonText}>Áp dụng</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </Animated.View>

            <CalendarModal
                visible={isCalendarModalVisible}
                onClose={() => setCalendarModalVisible(false)}
                onDateSelect={handleDateSelect}
                selectedDate={localSearch?.checkInDate}
            />

            <GuestModal
                visible={isGuestModalVisible}
                onClose={() => {
                    setGuestModalVisible(false);
                    if (localSearch) { updateCurrentSearch(localSearch) }
                }}
                adults={localSearch?.adults || 1}
                children={localSearch?.children || 0}
                setAdults={handleAdultsUpdate}
                setChildren={handleChildrenUpdate}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: height * 0.4,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
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
    blurButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    contentContainer: {
        padding: 16,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionTextContainer: {
        marginLeft: 12,
    },
    optionLabel: {
        fontSize: 14,
        color: '#666',
    },
    optionValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 2,
    },
    highlightText: {
        fontWeight: 'bold',
    },
    editIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        marginTop: 24,
    },
    applyButton: {
        width: '100%',
        height: 50,
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default RentalFilterModal;