import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { FontAwesome } from 'react-native-vector-icons';
import { colors } from '../../constants/Colors';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function CalendarModal({ visible, onClose, onDateSelect, selectedDate, numberOfNights }) {
    const [step, setStep] = useState(1);
    const [tempDate, setTempDate] = useState(selectedDate);
    const [tempNights, setTempNights] = useState(numberOfNights);

    React.useEffect(() => {
        if (visible) {
            setStep(1);
            if (selectedDate) {
                const date = new Date(selectedDate);
                if (!isNaN(date.getTime())) {
                    setTempDate(date.toISOString().split('T')[0]);
                } else {
                    setTempDate(new Date().toISOString().split('T')[0]);
                }
            } else {
                setTempDate(new Date().toISOString().split('T')[0]);
            }
            setTempNights(numberOfNights || 1);
        }
    }, [visible, selectedDate, numberOfNights]);

    const calculateCheckoutDate = (checkInDate, nights) => {
        const checkOut = new Date(checkInDate);
        if (!isNaN(checkOut.getTime())) {
            checkOut.setDate(checkOut.getDate() + nights);
            return checkOut.toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
        }
        return '';
    };

    const handleIncrease = () => {
        if (tempNights < 30) {
            setTempNights(prev => prev + 1);
        }
    };

    const handleDecrease = () => {
        if (tempNights > 1) {
            setTempNights(prev => prev - 1);
        }
    };

    const handleConfirm = () => {
        const formattedDate = new Date(tempDate);
        const formattedText = `${formattedDate.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${formattedDate.getDate()}/${formattedDate.getMonth() + 1}/${formattedDate.getFullYear()}`;
        onDateSelect({ dateString: tempDate, formattedDate: formattedText }, tempNights);
    };

    const handleDayPress = (day) => {
        setTempDate(day.dateString);
        setStep(2);
    };

    const handleBack = () => setStep(1);

    const handleModalClose = () => {
        setStep(1);
        onClose();
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step === 1 && styles.activeStepDot]} />
            <View style={[styles.stepLine, step === 2 && styles.activeStepLine]} />
            <View style={[styles.stepDot, step === 2 && styles.activeStepDot]} />
        </View>
    );

    return (
        <Modal animationType="none" transparent={true} visible={visible} onRequestClose={handleModalClose}>
            <Animated.View
                entering={FadeIn}
                style={styles.modalBackground}
            >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <Animated.View
                    entering={SlideInUp}
                    exiting={SlideOutDown}
                    style={styles.calendarContainer}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primary + 'E6']}
                        style={styles.header}
                    >
                        <TouchableOpacity style={styles.closeButton} onPress={handleModalClose}>
                            <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                                <FontAwesome name="close" size={20} color="#fff" />
                            </BlurView>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {step === 1 ? 'Chọn ngày nhận phòng' : 'Chọn số đêm nghỉ'}
                        </Text>
                        {renderStepIndicator()}
                    </LinearGradient>

                    {step === 1 ? (
                        <Animated.View entering={FadeIn}>
                            <Calendar
                                minDate={new Date().toISOString().split('T')[0]}
                                markedDates={{
                                    [tempDate]: { selected: true, selectedColor: colors.primary }
                                }}
                                onDayPress={handleDayPress}
                                monthFormat={'MM/yyyy'}
                                markingType={'simple'}
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
                            <View style={styles.continueButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.continueButton, !tempDate && styles.disabledButton]}
                                    onPress={() => setStep(2)}
                                    disabled={!tempDate}
                                >
                                    <LinearGradient
                                        colors={[colors.primary, colors.primary + 'E6']}
                                        style={styles.gradientButton}
                                    >
                                        <Text style={styles.confirmButtonText}>Tiếp tục</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    ) : (
                        <Animated.View
                            entering={FadeIn}
                            style={styles.nightsSelectionContainer}
                        >
                            <Text style={styles.nightsTitle}>Số đêm nghỉ</Text>
                            <View style={styles.stayDurationContainer}>
                                <TouchableOpacity
                                    style={[styles.durationButton, tempNights <= 1 && styles.disabledButton]}
                                    onPress={handleDecrease}
                                    disabled={tempNights <= 1}
                                >
                                    <FontAwesome name="minus" size={20} color={tempNights <= 1 ? '#ccc' : colors.primary} />
                                </TouchableOpacity>
                                <View style={styles.nightsDisplay}>
                                    <Text style={styles.nightsNumber}>{tempNights}</Text>
                                    <Text style={styles.nightsText}>đêm</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.durationButton, tempNights >= 30 && styles.disabledButton]}
                                    onPress={handleIncrease}
                                    disabled={tempNights >= 30}
                                >
                                    <FontAwesome name="plus" size={20} color={tempNights >= 30 ? '#ccc' : colors.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.datePreview}>
                                <View style={styles.dateRow}>
                                    <Text style={styles.dateLabel}>Nhận phòng:</Text>
                                    <Text style={styles.dateValue}>
                                        {new Date(tempDate).toLocaleDateString('vi-VN', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                </View>
                                <View style={[styles.dateRow, styles.checkoutRow]}>
                                    <Text style={styles.dateLabel}>Trả phòng:</Text>
                                    <Text style={[styles.dateValue, styles.checkoutDate]}>
                                        {calculateCheckoutDate(tempDate, tempNights)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                                    <Text style={styles.backButtonText}>Quay lại</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                                    <LinearGradient
                                        colors={[colors.primary, colors.primary + 'E6']}
                                        style={styles.gradientButton}
                                    >
                                        <Text style={styles.confirmButtonText}>Xác nhận</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}
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
    calendarContainer: {
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
    nightsSelectionContainer: {
        padding: 20,
    },
    nightsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    stayDurationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    durationButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    disabledButton: {
        backgroundColor: '#f5f5f5',
        elevation: 0,
    },
    nightsDisplay: {
        marginHorizontal: 30,
        alignItems: 'center',
    },
    nightsNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
    },
    nightsText: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    datePreview: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
        marginBottom: 30,
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
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    backButton: {
        flex: 1,
        marginRight: 10,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary,
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
    backButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    continueButtonContainer: {
        padding: 20,
        paddingTop: 0,
    },
    continueButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    disabledButton: {
        opacity: 0.5,
    },
});