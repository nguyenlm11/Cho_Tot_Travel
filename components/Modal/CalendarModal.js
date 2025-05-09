import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Alert, Platform, KeyboardAvoidingView, SafeAreaView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { FontAwesome, Ionicons } from 'react-native-vector-icons';
import { colors } from '../../constants/Colors';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { height, width } = Dimensions.get('window');

export default function CalendarModal({ visible, onClose, onDateSelect, selectedDate }) {
    const [step, setStep] = useState(1);
    const [checkInDate, setCheckInDate] = useState(selectedDate);
    const [checkOutDate, setCheckOutDate] = useState(null);

    useEffect(() => {
        if (visible) {
            setStep(1);
            if (selectedDate) {
                const date = new Date(selectedDate);
                if (!isNaN(date.getTime())) {
                    setCheckInDate(date.toISOString().split('T')[0]);
                    setCheckOutDate(null);
                } else {
                    resetDates();
                }
            } else {
                resetDates();
            }
        }
    }, [visible, selectedDate]);

    const resetDates = () => {
        const today = new Date();
        setCheckInDate(today.toISOString().split('T')[0]);
        setCheckOutDate(null);
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    // Xử lý khi người dùng bấm vào ngày
    const handleDayPress = (day) => {
        if (step === 1) {
            setCheckInDate(day.dateString);
            setCheckOutDate(null);
        } else {
            const selectedDate = new Date(day.dateString);
            const startDate = new Date(checkInDate);
            // Kiểm tra ngày check-out phải sau ngày check-in
            if (selectedDate <= startDate) {
                Alert.alert("Lỗi", "Ngày trả phòng phải sau ngày nhận phòng");
                return;
            }
            // Kiểm tra ngày check-out không được quá 30 ngày sau ngày check-in
            const maxCheckOutDate = new Date(checkInDate);
            maxCheckOutDate.setDate(maxCheckOutDate.getDate() + 30);

            if (selectedDate > maxCheckOutDate) {
                Alert.alert("Lỗi", "Thời gian lưu trú không được quá 30 ngày");
                return;
            }
            setCheckOutDate(day.dateString);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleModalClose = () => {
        setStep(1);
        onClose();
    };

    const handleConfirm = () => {
        if (!checkInDate || !checkOutDate) return;
        const formattedCheckIn = formatDisplayDate(checkInDate);
        const formattedCheckOut = formatDisplayDate(checkOutDate);
        onDateSelect({
            dateString: checkInDate,
            formattedDate: formattedCheckIn,
            checkOutDateString: checkOutDate,
            formattedCheckOutDate: formattedCheckOut,
        });
    };

    // Hiển thị chỉ báo bước
    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step === 1 && styles.activeStepDot]} />
            <View style={[styles.stepLine, step === 2 && styles.activeStepLine]} />
            <View style={[styles.stepDot, step === 2 && styles.activeStepDot]} />
        </View>
    );

    // Tạo đánh dấu cho lịch
    const getMarkedDates = () => {
        const markedDates = {};
        if (checkInDate) {
            markedDates[checkInDate] = {
                selected: true,
                startingDay: true,
                color: colors.primary
            };
        }

        if (checkOutDate) {
            markedDates[checkOutDate] = {
                selected: true,
                endingDay: true,
                color: colors.primary
            };
        }
        // Nếu cả hai ngày đã được chọn, đánh dấu các ngày ở giữa
        if (checkInDate && checkOutDate) {
            let start = new Date(checkInDate);
            let end = new Date(checkOutDate);

            for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                const dateString = d.toISOString().split('T')[0];

                if (dateString !== checkInDate && dateString !== checkOutDate) {
                    markedDates[dateString] = {
                        selected: true,
                        color: colors.primary + '80'
                    };
                }
            }
        }
        return markedDates;
    };

    // Tính ngày tối đa cho check-out (30 ngày sau check-in)
    const getMaxDate = () => {
        if (!checkInDate) return undefined;
        const maxDate = new Date(checkInDate);
        maxDate.setDate(maxDate.getDate() + 30);
        return maxDate.toISOString().split('T')[0];
    };

    // Tính ngày tối thiểu cho check-out (ngày sau check-in)
    const getMinDate = () => {
        if (!checkInDate) return undefined;
        const minDate = new Date(checkInDate);
        minDate.setDate(minDate.getDate() + 1);
        return minDate.toISOString().split('T')[0];
    };

    return (
        <Modal 
            animationType="fade" 
            transparent={true} 
            visible={visible} 
            onRequestClose={handleModalClose}
            statusBarTranslucent={true}
            hardwareAccelerated={true}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalBackground}
                >
                    <View style={styles.overlay}>
                        <Animated.View
                            entering={FadeInDown}
                            exiting={SlideOutDown}
                            style={[
                                styles.calendarContainer,
                                Platform.OS === 'android' && styles.androidCalendarContainer
                            ]}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.primary + 'E6']}
                                style={styles.header}
                            >
                                <TouchableOpacity style={styles.closeButton} onPress={handleModalClose}>
                                    <View style={styles.blurButton}>
                                        <Ionicons name="close" size={22} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>
                                    {step === 1 ? 'Chọn ngày bắt đầu' : 'Chọn ngày kết thúc'}
                                </Text>
                                {renderStepIndicator()}
                            </LinearGradient>

                            <Animated.View entering={FadeIn} style={styles.calendarWrapper}>
                                <Calendar
                                    minDate={step === 1 ? new Date().toISOString().split('T')[0] : getMinDate()}
                                    maxDate={step === 2 ? getMaxDate() : undefined}
                                    markedDates={getMarkedDates()}
                                    onDayPress={handleDayPress}
                                    monthFormat={'MM/yyyy'}
                                    markingType={'period'}
                                    theme={{
                                        selectedDayBackgroundColor: colors.primary,
                                        selectedDayTextColor: '#fff',
                                        todayTextColor: colors.primary,
                                        arrowColor: colors.primary,
                                        textSectionTitleColor: '#333',
                                        textDayFontSize: 16,
                                        textMonthFontSize: 16,
                                        textDayHeaderFontSize: 14,
                                        'stylesheet.calendar.header': {
                                            week: { marginTop: 5, flexDirection: 'row', justifyContent: 'space-around' }
                                        }
                                    }}
                                />

                                {step === 2 && checkInDate && checkOutDate && (
                                    <View style={styles.datePreview}>
                                        <View style={styles.dateRow}>
                                            <Text style={styles.dateLabel}>Ngày nhận phòng:</Text>
                                            <Text style={styles.dateValue}>{formatDisplayDate(checkInDate)}</Text>
                                        </View>
                                        <View style={[styles.dateRow, styles.checkoutRow]}>
                                            <Text style={styles.dateLabel}>Ngày trả phòng:</Text>
                                            <Text style={[styles.dateValue, styles.checkoutDate]}>
                                                {formatDisplayDate(checkOutDate)}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {step === 1 ? (
                                    <View style={styles.continueButtonContainer}>
                                        <TouchableOpacity
                                            style={[styles.continueButton, !checkInDate && styles.disabledButton]}
                                            onPress={() => setStep(2)}
                                            disabled={!checkInDate}
                                        >
                                            <LinearGradient
                                                colors={[colors.primary, colors.secondary]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.gradientButton}
                                            >
                                                <Text style={styles.confirmButtonText}>Tiếp tục</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.backButton}
                                            onPress={handleBack}
                                        >
                                            <Text style={styles.backButtonText}>
                                                Quay lại
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.confirmButton, !checkOutDate && styles.disabledButton]}
                                            onPress={handleConfirm}
                                            disabled={!checkOutDate}
                                        >
                                            <LinearGradient
                                                colors={[colors.primary, colors.secondary]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.gradientButton}
                                            >
                                                <Text style={styles.confirmButtonText}>Xác nhận</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </Animated.View>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
    },
    calendarContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        maxHeight: height * 0.9,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 24,
                zIndex: 999,
                width: '100%',
                left: 0,
                right: 0,
                position: 'absolute',
                bottom: 0,
            }
        }),
    },
    androidCalendarContainer: {
        width: '100%',
        zIndex: 999,
        left: 0,
        right: 0,
        position: 'absolute',
        bottom: 0,
    },
    calendarWrapper: {
        backgroundColor: '#fff',
        width: '100%',
    },
    header: {
        padding: 20,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        alignItems: 'center',
        width: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    blurButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    stepDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    activeStepDot: {
        backgroundColor: '#fff',
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 5,
    },
    activeStepLine: {
        backgroundColor: '#fff',
    },
    datePreview: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
        margin: 15,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    checkoutRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    dateLabel: {
        fontSize: 15,
        color: '#666',
    },
    dateValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    checkoutDate: {
        color: colors.primary,
        fontWeight: '600',
    },
    continueButtonContainer: {
        padding: 15,
    },
    continueButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
    },
    backButton: {
        flex: 1,
        marginRight: 10,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        marginLeft: 10,
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        padding: 15,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.6,
    }
});