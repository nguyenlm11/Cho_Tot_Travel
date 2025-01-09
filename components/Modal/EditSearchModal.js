import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LocationSearchModal from './LocationSearchModal';
import CalendarModal from './CalendarModal';
import GuestModal from './GuestModal';
import FilterModal from './FilterModal';
import { FontAwesome } from 'react-native-vector-icons';
import { colors } from '../../constants/Colors';

const EditSearchModal = ({
    visible,
    onClose,
    location,
    checkInDate,
    checkOutDate,
    numberOfNights,
    rooms,
    adults,
    children,
    priceFrom,
    priceTo,
    selectedStar,
    setLocation,
    setCheckInDate,
    setCheckOutDate,
    setNumberOfNights,
    setRooms,
    setAdults,
    setChildren,
    setPriceFrom,
    setPriceTo,
    setSelectedStar,
}) => {

    const [isLocationModalVisible, setLocationModalVisible] = useState(false);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [isGuestModalVisible, setGuestModalVisible] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(checkInDate);

    const handleDateSelect = (date) => {
        const selected = date.dateString;
        const formattedDate = new Date(selected);
        const formattedText = `${formattedDate.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${formattedDate.getDate()}/${formattedDate.getMonth() + 1}/${formattedDate.getFullYear()}`;
        setCheckInDate(formattedText);
        setSelectedDate(selected);

        const checkOut = new Date(formattedDate);
        checkOut.setDate(checkOut.getDate() + numberOfNights);
        const checkOutText = `${checkOut.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${checkOut.getDate()}/${checkOut.getMonth() + 1}/${checkOut.getFullYear()}`;
        setCheckOutDate(checkOutText);
        setCalendarVisible(false);
    };

    const handleLocationSelected = (selectedLocation) => {
        setLocation(selectedLocation.description);
        console.log("Selected Location:", selectedLocation);
        console.log("Latitude:", selectedLocation.latitude);
        console.log("Longitude:", selectedLocation.longitude);
    };

    const handleSearch = () => {
        console.log("Search Parameters:");
        console.log("Location:", location);
        console.log("Check-in Date:", checkInDate);
        console.log("Check-out Date:", checkOutDate);
        console.log("Number of Nights:", numberOfNights);
        console.log("Rooms:", rooms);
        console.log("Adults:", adults);
        console.log("Children:", children);
        console.log("Price Range:", priceFrom, "-", priceTo);
        console.log("Star Rating:", selectedStar);
    }

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <FontAwesome name="close" size={20} color="#4A4A4A" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Chọn số phòng và khách</Text>

                    <View style={styles.searchSection}>
                        <TouchableOpacity style={styles.searchInput} onPress={() => setLocationModalVisible(true)}>
                            <Icon name="location-outline" size={20} color="#4A4A4A" />
                            <View>
                                <Text style={styles.inputTitle}>Điểm đến, khách sạn</Text>
                                <Text style={styles.inputText} numberOfLines={2} ellipsizeMode="tail">{location !== null && location !== '' ? location : 'Nhập điểm đến'}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.dateInput} onPress={() => setCalendarVisible(true)}>
                            <Icon name="calendar-outline" size={20} color="#4A4A4A" />
                            <View style={{ flexDirection: 'row' }}>
                                <View>
                                    <Text style={styles.inputTitle}>Ngày nhận phòng</Text>
                                    <Text style={styles.inputText}>{checkInDate}</Text>
                                    <Text> Ngày trả phòng: <Text>{checkOutDate}</Text></Text>
                                </View>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.inputTitle}>Số đêm nghỉ</Text>
                                    <Text style={styles.inputText}>{numberOfNights} đêm</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.dateInput} onPress={() => setGuestModalVisible(true)}>
                            <Icon name="people-outline" size={20} color="#4A4A4A" />
                            <View>
                                <Text style={styles.inputTitle}>Số phòng và khách</Text>
                                <Text style={styles.inputText}>{rooms} phòng, {adults} người lớn{children > 0 ? `, ${children} trẻ em` : ''}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.filterInput} onPress={() => setFilterModalVisible(true)}>
                            <Icon name="filter-outline" size={20} color="#4A4A4A" />
                            <View>
                                <Text style={styles.inputTitle}>Bộ lọc</Text>
                                <Text style={styles.inputText}>
                                    {priceFrom ? `${priceFrom}đ` : ''}
                                    {priceFrom && priceTo ? ' - ' : ''}
                                    {priceTo ? `${priceTo}đ` : ''}
                                    {priceFrom || priceTo ? ', ' : ''}
                                    {selectedStar ? `${selectedStar} sao` : ''}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.searchButton} onPress={() => { handleSearch(); onClose() }}>
                            <Text style={styles}>Tìm kiếm</Text>
                        </TouchableOpacity>
                    </View>

                    <LocationSearchModal
                        visible={isLocationModalVisible}
                        onClose={() => setLocationModalVisible(false)}
                        onLocationSelected={handleLocationSelected}
                    />
                    <CalendarModal
                        visible={isCalendarVisible}
                        onClose={() => setCalendarVisible(false)}
                        onDateSelect={handleDateSelect}
                        selectedDate={selectedDate}
                        numberOfNights={numberOfNights}
                        setNumberOfNights={setNumberOfNights}
                    />
                    <GuestModal
                        visible={isGuestModalVisible}
                        onClose={() => setGuestModalVisible(false)}
                        rooms={rooms}
                        adults={adults}
                        children={children}
                        setRooms={setRooms}
                        setAdults={setAdults}
                        setChildren={setChildren}
                    />

                    <FilterModal
                        visible={isFilterModalVisible}
                        onClose={() => setFilterModalVisible(false)}
                        priceFrom={priceFrom}
                        priceTo={priceTo}
                        selectedStar={selectedStar}
                        setPriceFrom={setPriceFrom}
                        setPriceTo={setPriceTo}
                        setSelectedStar={setSelectedStar}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        elevation: 5,
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
    searchInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    filterInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    inputText: {
        fontSize: 16,
        color: '#4A4A4A',
        marginLeft: 8,
        fontWeight: 'bold',
    },
    inputTitle: {
        fontSize: 16,
        color: '#888',
        marginLeft: 8,
        marginBottom: 8
    },
    searchButton: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default EditSearchModal;
