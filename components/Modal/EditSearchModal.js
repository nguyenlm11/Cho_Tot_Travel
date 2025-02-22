import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { FontAwesome } from 'react-native-vector-icons';
import { colors } from '../../constants/Colors';
import { useSearch } from '../../contexts/SearchContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

import LocationSearchModal from './LocationSearchModal';
import CalendarModal from './CalendarModal';
import GuestModal from './GuestModal';
import FilterModal from './FilterModal';

const EditSearchModal = ({ visible, onClose }) => {
    const { currentSearch, updateCurrentSearch } = useSearch();
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(false);
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

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            await updateCurrentSearch({
                location: currentSearch.location,
                checkInDate: currentSearch.checkInDate,
                checkOutDate: currentSearch.checkOutDate,
                numberOfNights: currentSearch.numberOfNights,
                rooms: currentSearch.rooms,
                adults: currentSearch.adults,
                children: currentSearch.children,
                priceFrom: currentSearch.priceFrom,
                priceTo: currentSearch.priceTo,
                selectedStar: currentSearch.selectedStar,
                latitude: currentSearch.latitude,
                longitude: currentSearch.longitude
            });

            await new Promise(resolve => setTimeout(resolve, 1500));

            navigation.navigate('Results');
            onClose();
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalBackground}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                <View style={styles.modalWrapper}>
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
                            <Text style={styles.modalTitle}>Chỉnh sửa tìm kiếm</Text>
                        </LinearGradient>

                        <ScrollView
                            style={styles.content}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.searchSection}>
                                <TouchableOpacity
                                    style={styles.searchCard}
                                    onPress={() => setLocationModalVisible(true)}
                                >
                                    <View style={styles.searchIconContainer}>
                                        <Icon name="location-outline" size={22} color={colors.primary} />
                                    </View>
                                    <View style={styles.searchContent}>
                                        <Text style={styles.searchLabel}>Địa điểm</Text>
                                        <Text
                                            style={styles.searchText}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            {currentSearch.location || "Bạn muốn đi đâu?"}
                                        </Text>
                                    </View>
                                    <Icon name="chevron-forward" size={20} color="#999" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.searchCard}
                                    onPress={() => setCalendarVisible(true)}
                                >
                                    <View style={styles.searchIconContainer}>
                                        <Icon name="calendar-outline" size={22} color={colors.primary} />
                                    </View>
                                    <View style={styles.searchContent}>
                                        <Text style={styles.searchLabel}>Ngày</Text>
                                        <Text style={styles.searchText}>
                                            {currentSearch.checkInDate ? `${currentSearch.checkInDate} • ${currentSearch.numberOfNights} đêm` : "Chọn ngày"}
                                        </Text>
                                    </View>
                                    <Icon name="chevron-forward" size={20} color="#999" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.searchCard}
                                    onPress={() => setGuestModalVisible(true)}
                                >
                                    <View style={styles.searchIconContainer}>
                                        <Icon name="people-outline" size={22} color={colors.primary} />
                                    </View>
                                    <View style={styles.searchContent}>
                                        <Text style={styles.searchLabel}>Khách & Phòng</Text>
                                        <Text style={styles.searchText}>
                                            {currentSearch.rooms ?
                                                `${currentSearch.rooms} phòng • ${currentSearch.adults} người lớn${currentSearch.children > 0 ? ` • ${currentSearch.children} trẻ em` : ''}`
                                                : "Số lượng khách"}
                                        </Text>
                                    </View>
                                    <Icon name="chevron-forward" size={20} color="#999" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.searchCard}
                                    onPress={() => setFilterModalVisible(true)}
                                >
                                    <View style={styles.searchIconContainer}>
                                        <Icon name="filter-outline" size={22} color={colors.primary} />
                                    </View>
                                    <View style={styles.searchContent}>
                                        <Text style={styles.searchLabel}>Bộ lọc</Text>
                                        <Text style={styles.searchText}>
                                            {!currentSearch.priceFrom && !currentSearch.priceTo && !currentSearch.selectedStar ? (
                                                'Tất cả'
                                            ) : (
                                                <>
                                                    {currentSearch.priceFrom || currentSearch.priceTo ?
                                                        `${currentSearch.priceFrom?.toLocaleString() || 0}đ - ${currentSearch.priceTo?.toLocaleString() || 'Max'}đ` : ''}
                                                    {currentSearch.selectedStar ?
                                                        (currentSearch.priceFrom || currentSearch.priceTo ? ' • ' : '') + `${currentSearch.selectedStar} sao` : ''}
                                                </>
                                            )}
                                        </Text>
                                    </View>
                                    <Icon name="chevron-forward" size={20} color="#999" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
                                    onPress={handleSearch}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={[colors.primary, colors.primary + 'E6']}
                                        style={styles.gradientButton}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Icon name="search-outline" size={20} color="#fff" />
                                                <Text style={styles.searchButtonText}>Tìm kiếm</Text>
                                            </>
                                        )}
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
                        </ScrollView>
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: 'hidden',
        maxHeight: '85%',
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
        padding: 15,
    },
    searchSection: {
        padding: 15,
    },
    searchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    searchContent: {
        flex: 1,
    },
    searchLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    searchText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    searchButton: {
        marginTop: 15,
        borderRadius: 10,
        overflow: 'hidden',
    },
    searchButtonDisabled: {
        opacity: 0.7,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default EditSearchModal;
