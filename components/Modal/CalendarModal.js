import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from 'react-native-vector-icons';

export default function CalendarModal({ visible, onClose, onDateSelect, selectedDate, setNumberOfNights, numberOfNights }) {
    const handleIncrease = () => setNumberOfNights(numberOfNights + 1);
    const handleDecrease = () => setNumberOfNights(numberOfNights - 1);

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalBackground}>
                <View style={styles.calendarContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-outline" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Chọn ngày nhận phòng</Text>
                    <Calendar
                        minDate={new Date().toISOString().split('T')[0]}
                        markedDates={{
                            [selectedDate]: { selected: true, selectedColor: '#30B53E' },
                        }}
                        onDayPress={(day) => onDateSelect(day)}
                        monthFormat={'yyyy MM'}
                        markingType={'simple'}
                        theme={{
                            selectedDayBackgroundColor: '#30B53E',
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: '#30B53E',
                            arrowColor: '#333333',
                            textSectionTitleColor: '#333333',
                        }}
                    />
                    <View style={styles.stayDurationContainer}>
                        <Text style={styles.text}>Chọn số đêm nghỉ:</Text>
                        <TouchableOpacity style={styles.durationButton} onPress={handleDecrease}>
                            <Text style={styles.buttonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.text}>{numberOfNights} đêm</Text>
                        <TouchableOpacity style={styles.durationButton} onPress={handleIncrease}>
                            <Text style={styles.buttonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
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
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 100,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    calendarContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    stayDurationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    text: {
        fontSize: 16,
        marginHorizontal: 10,
    },
    durationButton: {
        backgroundColor: '#30B53E',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
});