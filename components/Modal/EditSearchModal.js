import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { FontAwesome } from 'react-native-vector-icons';
import { colors } from '../../constants/Colors';
import { useSearch } from '../../contexts/SearchContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

import LocationSearchModal from './LocationSearchModal';
import CalendarModal from './CalendarModal';
import GuestModal from './GuestModal';
import FilterModal from './FilterModal';

const EditSearchModal = ({ visible, onClose }) => {
    const { currentSearch, updateCurrentSearch } = useSearch();

    const [isLocationModalVisible, setLocationModalVisible] = useState(false);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [isGuestModalVisible, setGuestModalVisible] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        const dateStr = currentSearch.checkInDate;
        if (!dateStr) return new Date().toISOString().split('T')[0];

        const dateParts = dateStr.split(', ')[1].split('/');
        if (dateParts.length !== 3) return new Date().toISOString().split('T')[0];

        const [day, month, year] = dateParts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    });

    const handleDateSelect = (date, nights) => {
        updateCurrentSearch({
            checkInDate: date.formattedDate,
            numberOfNights: nights
        });
        setSelectedDate(date.dateString);

        const checkOut = new Date(date.dateString);
        checkOut.setDate(checkOut.getDate() + nights);
        const checkOutText = `${checkOut.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${checkOut.getDate()}/${checkOut.getMonth() + 1}/${checkOut.getFullYear()}`;
        updateCurrentSearch({
            checkOutDate: checkOutText
        });
        setCalendarVisible(false);
    };

    const handleLocationSelected = (selectedLocation) => {
        updateCurrentSearch({
            location: selectedLocation.description,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
        });
        setLocationModalVisible(false);
    };

    const handleSearch = () => {
        console.log("Search Parameters:", currentSearch);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <Animated.View
                entering={FadeIn}
                style={styles.modalBackground}
            >
                <Animated.View
                    entering={SlideInDown}
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
                        <Text style={styles.modalTitle}>Chỉnh sửa tìm kiếm</Text>
                    </LinearGradient>

                    <View style={styles.searchSection}>
                        <TouchableOpacity
                            style={styles.searchInput}
                            onPress={() => setLocationModalVisible(true)}
                        >
                            <View style={styles.iconContainer}>
                                <Icon name="location-outline" size={22} color={colors.textPrimary} />
                            </View>
                            <View style={styles.inputContent}>
                                <Text style={styles.inputTitle}>Điểm đến, khách sạn</Text>
                                <Text style={styles.inputText} numberOfLines={2} ellipsizeMode="tail">
                                    {currentSearch.location}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.searchInput}
                            onPress={() => setCalendarVisible(true)}
                        >
                            <View style={styles.iconContainer}>
                                <Icon name="calendar-outline" size={22} color={colors.textPrimary} />
                            </View>
                            <View style={styles.inputContent}>
                                <Text style={styles.inputTitle}>Ngày nhận và trả phòng</Text>
                                <Text style={styles.inputText}>
                                    {currentSearch.checkInDate} - {currentSearch.checkOutDate}
                                </Text>
                                <Text style={[styles.inputTitle, { marginTop: 5 }]}>
                                    Số đêm nghỉ: {' '}
                                    <Text style={styles.inputText}>{currentSearch.numberOfNights} đêm</Text>
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.guestInput}
                            onPress={() => setGuestModalVisible(true)}
                        >
                            <View style={styles.iconContainer}>
                                <Icon name="people-outline" size={22} color={colors.textPrimary} />
                            </View>
                            <View style={styles.inputContent}>
                                <Text style={styles.inputTitle}>Số phòng và khách</Text>
                                <Text style={styles.inputText}>
                                    {currentSearch.rooms} phòng, {currentSearch.adults} người lớn
                                    {currentSearch.children > 0 ? `, ${currentSearch.children} trẻ em` : ''}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.filterInput}
                            onPress={() => setFilterModalVisible(true)}
                        >
                            <View style={styles.iconContainer}>
                                <Icon name="filter-outline" size={22} color={colors.textPrimary} />
                            </View>
                            <View style={styles.inputContent}>
                                <Text style={styles.inputTitle}>Bộ lọc</Text>
                                <Text style={styles.inputText}>
                                    {currentSearch.priceFrom ? `${currentSearch.priceFrom.toLocaleString()}đ` : ''}
                                    {currentSearch.priceFrom && currentSearch.priceTo ? ' - ' : ''}
                                    {currentSearch.priceTo ? `${currentSearch.priceTo.toLocaleString()}đ` : ''}
                                    {(currentSearch.priceFrom || currentSearch.priceTo) && currentSearch.selectedStar ? ' | ' : ''}
                                    {currentSearch.selectedStar ? `${currentSearch.selectedStar} sao` : 'Chọn bộ lọc'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={handleSearch}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.primary + 'E6']}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.searchButtonText}>Tìm kiếm</Text>
                            </LinearGradient>
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
                        numberOfNights={currentSearch.numberOfNights}
                        setNumberOfNights={(nights) => updateCurrentSearch({ numberOfNights: nights })}
                    />

                    <GuestModal
                        visible={isGuestModalVisible}
                        onClose={() => setGuestModalVisible(false)}
                        rooms={currentSearch.rooms}
                        adults={currentSearch.adults}
                        children={currentSearch.children}
                        setRooms={(rooms) => updateCurrentSearch({ rooms })}
                        setAdults={(adults) => updateCurrentSearch({ adults })}
                        setChildren={(children) => updateCurrentSearch({ children })}
                    />

                    <FilterModal
                        visible={isFilterModalVisible}
                        onClose={() => setFilterModalVisible(false)}
                        priceFrom={currentSearch.priceFrom}
                        priceTo={currentSearch.priceTo}
                        selectedStar={currentSearch.selectedStar}
                        setPriceFrom={(priceFrom) => updateCurrentSearch({ priceFrom })}
                        setPriceTo={(priceTo) => updateCurrentSearch({ priceTo })}
                        setSelectedStar={(selectedStar) => updateCurrentSearch({ selectedStar })}
                    />
                </Animated.View>
            </Animated.View >
        </Modal >
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    searchSection: {
        padding: 20,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    searchInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 15,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    dateInput: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 15,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    guestInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 15,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    filterInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 15,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    inputContent: {
        flex: 1,
    },
    inputTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    inputText: {
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: 'bold',
    },
    nightsText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    searchButton: {
        marginTop: 8,
        borderRadius: 15,
        overflow: 'hidden',
    },
    gradientButton: {
        padding: 16,
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default EditSearchModal;
