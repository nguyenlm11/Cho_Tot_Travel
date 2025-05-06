import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Dimensions, SafeAreaView, TextInput } from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, SlideOutDown } from 'react-native-reanimated';
import { useSearch } from '../../contexts/SearchContext';
import LocationSearchModal from './LocationSearchModal';
import CalendarModal from './CalendarModal';
import GuestModal from './GuestModal';
import FilterModal from './FilterModal';
import homeStayApi from '../../services/api/homeStayApi';

const { width, height } = Dimensions.get('window');

const EditSearchModal = ({ visible, onClose }) => {
    const { currentSearch, updateCurrentSearch, updateSearchResults } = useSearch();
    const [isLoading, setIsLoading] = useState(false);

    const [isLocationModalVisible, setLocationModalVisible] = useState(false);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [isGuestModalVisible, setGuestModalVisible] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);

    const [localSearch, setLocalSearch] = useState({ ...currentSearch });

    useEffect(() => {
        if (visible && currentSearch) { setLocalSearch({ ...currentSearch }); }
    }, [visible, currentSearch]);

    // Format selected date
    const [selectedDate, setSelectedDate] = useState(() => {
        if (!currentSearch?.checkInDate) return new Date().toISOString().split('T')[0];
        try {
            const dateParts = currentSearch.checkInDate.split(', ')[1].split('/');
            if (dateParts.length !== 3) return new Date().toISOString().split('T')[0];
            const [day, month, year] = dateParts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } catch (error) {
            console.error("Error parsing date:", error);
            return new Date().toISOString().split('T')[0];
        }
    });

    const handleDateSelect = (dateInfo) => {
        setSelectedDate(dateInfo.dateString);
        setLocalSearch({
            ...localSearch,
            checkInDate: dateInfo.formattedDate,
            checkOutDate: dateInfo.formattedCheckOutDate,
            formattedCheckIn: dateInfo.dateString,
            formattedCheckOut: dateInfo.checkOutDateString
        });
        setCalendarVisible(false);
    };

    const handleLocationSelected = (selectedLocation) => {
        setLocalSearch({
            ...localSearch,
            location: selectedLocation.description,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude
        });
        setLocationModalVisible(false);
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

    const handleFilterUpdate = (newPriceFrom, newPriceTo, newSelectedStar) => {
        setLocalSearch({
            ...localSearch,
            priceFrom: newPriceFrom,
            priceTo: newPriceTo,
            selectedStar: newSelectedStar
        });
        setFilterModalVisible(false);
    };

    const handleSubmitSearch = async () => {
        if (!localSearch) {
            Alert.alert("Lỗi", "Không có dữ liệu tìm kiếm");
            return;
        }
        setIsLoading(true);
        try {
            updateCurrentSearch(localSearch);
            let formattedCheckIn = localSearch.formattedCheckIn;
            let formattedCheckOut = localSearch.formattedCheckOut;

            if (!formattedCheckIn || !formattedCheckOut) {
                try {
                    const checkInDateParts = localSearch.checkInDate.split(', ')[1].split('/');
                    const checkOutDateParts = localSearch.checkOutDate.split(', ')[1].split('/');
                    formattedCheckIn = `${checkInDateParts[2]}-${checkInDateParts[1].padStart(2, '0')}-${checkInDateParts[0].padStart(2, '0')}`;
                    formattedCheckOut = `${checkOutDateParts[2]}-${checkOutDateParts[1].padStart(2, '0')}-${checkOutDateParts[0].padStart(2, '0')}`;
                } catch (error) {
                    console.error("Error formatting dates:", error);
                    Alert.alert("Lỗi", "Không thể định dạng ngày tìm kiếm");
                    setIsLoading(false);
                    return;
                }
            }

            const filterParams = {
                CheckInDate: formattedCheckIn,
                CheckOutDate: formattedCheckOut,
                NumberOfAdults: localSearch.adults,
                NumberOfChildren: localSearch.children,
                Latitude: localSearch.latitude,
                Longitude: localSearch.longitude,
                MaxDistance: 10
            };
            const results = await homeStayApi.filterHomeStays(filterParams);
            updateSearchResults(results);
            onClose();
        } catch (error) {
            console.error("Search error:", error);
            Alert.alert(
                "Lỗi tìm kiếm",
                `Không thể tìm kiếm: ${error.message || "Lỗi không xác định"}`,
                [{ text: "Đóng" }]
            );
        } finally {
            setIsLoading(false);
        }
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
                    <Text style={styles.modalTitle}>Chỉnh sửa tìm kiếm</Text>
                    <Text style={styles.modalSubtitle}>Điều chỉnh thông tin để tìm phòng phù hợp</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <View style={styles.closeButtonContainer}>
                        <FontAwesome name="close" size={20} color="#fff" />
                    </View>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    <Text style={styles.sectionTitle}>Thông tin tìm kiếm</Text>

                    <TouchableOpacity
                        style={styles.searchCard}
                        onPress={() => setLocationModalVisible(true)}
                    >
                        <View style={styles.searchIconContainer}>
                            <Ionicons name="location-outline" size={22} color="#fff" />
                        </View>
                        <View style={styles.searchContent}>
                            <Text style={styles.searchLabel}>Địa điểm</Text>
                            <Text style={styles.searchText} numberOfLines={1}>
                                {localSearch?.location || "Chọn địa điểm"}
                            </Text>
                        </View>
                        <View style={styles.editIconContainer}>
                            <MaterialIcons name="edit" size={18} color={colors.primary} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.searchCard}
                        onPress={() => setCalendarVisible(true)}
                    >
                        <View style={styles.searchIconContainer}>
                            <Ionicons name="calendar-outline" size={22} color="#fff" />
                        </View>
                        <View style={styles.searchContent}>
                            <Text style={styles.searchLabel}>Ngày</Text>
                            <Text style={styles.searchText}>
                                {localSearch?.checkInDate && localSearch?.checkOutDate ? (
                                    <Text>
                                        <Text style={styles.highlightText}>{localSearch.checkInDate.split(', ')[1]}</Text> - <Text style={styles.highlightText}>{localSearch.checkOutDate.split(', ')[1]}</Text>
                                    </Text>
                                ) : (
                                    "Chọn ngày"
                                )}
                            </Text>
                            {localSearch?.numberOfNights > 0 && (
                                <Text style={styles.nightsText}>{localSearch.numberOfNights} đêm</Text>
                            )}
                        </View>
                        <View style={styles.editIconContainer}>
                            <MaterialIcons name="edit" size={18} color={colors.primary} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.searchCard}
                        onPress={() => setGuestModalVisible(true)}
                    >
                        <View style={styles.searchIconContainer}>
                            <Ionicons name="people-outline" size={22} color="#fff" />
                        </View>
                        <View style={styles.searchContent}>
                            <Text style={styles.searchLabel}>Khách</Text>
                            <Text style={styles.searchText}>
                                {localSearch?.adults ? (
                                    <Text>
                                        <Text style={styles.highlightText}>{localSearch.adults}</Text> người lớn
                                        {localSearch.children > 0 ?
                                            <Text>, <Text style={styles.highlightText}>{localSearch.children}</Text> trẻ em</Text> :
                                            ''}
                                    </Text>
                                ) : (
                                    "Số lượng khách"
                                )}
                            </Text>
                        </View>
                        <View style={styles.editIconContainer}>
                            <MaterialIcons name="edit" size={18} color={colors.primary} />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.sectionTitle}>Tùy chọn bộ lọc</Text>

                    <TouchableOpacity
                        style={styles.searchCard}
                        onPress={() => setFilterModalVisible(true)}
                    >
                        <View style={styles.searchIconContainer}>
                            <Ionicons name="filter-outline" size={22} color="#fff" />
                        </View>
                        <View style={styles.searchContent}>
                            <Text style={styles.searchLabel}>Bộ lọc</Text>
                            {!localSearch?.priceFrom && !localSearch?.priceTo && !localSearch?.selectedStar ? (
                                <Text style={styles.searchText}>Tất cả</Text>
                            ) : (
                                <>
                                    {(localSearch?.priceFrom || localSearch?.priceTo) && (
                                        <View style={styles.filterItem}>
                                            <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
                                            <Text style={styles.filterText}>
                                                {`${localSearch?.priceFrom?.toLocaleString() || 0}đ - ${localSearch?.priceTo?.toLocaleString() || 'Max'}đ`}
                                            </Text>
                                        </View>
                                    )}
                                    {localSearch?.selectedStar && (
                                        <View style={styles.filterItem}>
                                            <Ionicons name="star" size={14} color={colors.textSecondary} />
                                            <Text style={styles.filterText}>
                                                {`${localSearch.selectedStar} sao`}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                        <View style={styles.editIconContainer}>
                            <MaterialIcons name="edit" size={18} color={colors.primary} />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSubmitSearch}
                    disabled={isLoading}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.searchButtonGradient}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="search" size={20} color="#fff" />
                                <Text style={styles.searchButtonText}>Tìm kiếm</Text>
                            </>
                        )}
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
            hardwareAccelerated={true}
        >
            <Animated.View
                entering={FadeInDown}
                style={styles.modalBackground}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : "height"}
                    style={styles.keyboardView}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    {renderBackground()}
                    {renderModalContent()}
                </KeyboardAvoidingView>
            </Animated.View>

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
            />

            <GuestModal
                visible={isGuestModalVisible}
                onClose={() => { setGuestModalVisible(false) }}
                adults={localSearch?.adults || 1}
                children={localSearch?.children || 0}
                setAdults={handleAdultsUpdate}
                setChildren={handleChildrenUpdate}
            />

            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                priceFrom={localSearch?.priceFrom || ''}
                priceTo={localSearch?.priceTo || ''}
                selectedStar={localSearch?.selectedStar || null}
                setPriceFrom={(value) => handleFilterUpdate(value, localSearch?.priceTo, localSearch?.selectedStar)}
                setPriceTo={(value) => handleFilterUpdate(localSearch?.priceFrom, value, localSearch?.selectedStar)}
                setSelectedStar={(value) => handleFilterUpdate(localSearch?.priceFrom, localSearch?.priceTo, value)}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        height: Platform.OS === 'android' ? '70%' : height * 0.7,
        overflow: 'hidden',
        ...Platform.select({
            android: {
                elevation: 5,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
        }),
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        marginLeft: 5,
    },
    searchCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            android: {
                elevation: 2,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
        }),
    },
    searchIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    searchContent: {
        flex: 1,
    },
    searchLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },
    searchText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    highlightText: {
        fontWeight: 'bold',
    },
    nightsText: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    filterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    filterText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 5,
    },
    editIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(77, 89, 220, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 5,
    },
    footer: {
        padding: 18,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    searchButton: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 54,
    },
    searchButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 10,
    },
});

export default EditSearchModal;
