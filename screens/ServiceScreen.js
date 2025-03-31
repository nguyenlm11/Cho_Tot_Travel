import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Platform, StatusBar, Alert, FlatList, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import serviceApi from '../services/api/serviceApi';
import bookingApi from '../services/api/bookingApi';
import { useUser } from '../contexts/UserContext';

const SORT_OPTIONS = { DEFAULT: 'DEFAULT', PRICE_ASC: 'PRICE_ASC', PRICE_DESC: 'PRICE_DESC' };
const FILTER_OPTIONS = { ALL: 'ALL', UNDER_500K: 'UNDER_500K', FROM_500K_TO_1M: 'FROM_500K_TO_1M', ABOVE_1M: 'ABOVE_1M' };

const ServiceScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userData } = useUser();
    const { homestayId } = route.params || {};
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasBookedBefore, setHasBookedBefore] = useState(false);
    const [checkingBookingStatus, setCheckingBookingStatus] = useState(true);
    const [sortOption, setSortOption] = useState(SORT_OPTIONS.DEFAULT);
    const [filterOption, setFilterOption] = useState(FILTER_OPTIONS.ALL);
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [showFilterOptions, setShowFilterOptions] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!homestayId) {
                setError("Không tìm thấy thông tin homestay");
                setLoading(false);
                setCheckingBookingStatus(false);
                return;
            }
            if (userData && userData.userID) {
                try {
                    const bookingResult = await bookingApi.checkUserHasBookedHomestay(userData.userID, homestayId);
                    if (bookingResult.success) {
                        setHasBookedBefore(bookingResult.hasBooked);
                    }
                } catch (err) {
                    console.error("Lỗi khi kiểm tra lịch sử đặt phòng:", err);
                }
                setCheckingBookingStatus(false);
            } else {
                setCheckingBookingStatus(false);
            }
            try {
                const servicesResult = await serviceApi.getAllServices(homestayId);
                if (servicesResult.success) {
                    const data = servicesResult.data || [];
                    setServices(data);
                    setFilteredServices(data);
                } else {
                    setError(servicesResult.error || "Không thể tải dịch vụ");
                }
            } catch (err) {
                console.error("Lỗi khi tải dịch vụ:", err);
                setError("Đã xảy ra lỗi khi tải dịch vụ");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [homestayId, userData]);

    useEffect(() => {
        let filtered = [...services];
        switch (filterOption) {
            case FILTER_OPTIONS.UNDER_500K:
                filtered = filtered.filter(service => service.servicesPrice < 500000);
                break;
            case FILTER_OPTIONS.FROM_500K_TO_1M:
                filtered = filtered.filter(service => service.servicesPrice >= 500000 && service.servicesPrice <= 1000000);
                break;
            case FILTER_OPTIONS.ABOVE_1M:
                filtered = filtered.filter(service => service.servicesPrice > 1000000);
                break;
        }
        switch (sortOption) {
            case SORT_OPTIONS.PRICE_ASC:
                filtered.sort((a, b) => a.servicesPrice - b.servicesPrice);
                break;
            case SORT_OPTIONS.PRICE_DESC:
                filtered.sort((a, b) => b.servicesPrice - a.servicesPrice);
                break;
        }
        setFilteredServices(filtered);
    }, [services, filterOption, sortOption]);

    const handleServiceSelect = (service) => {
        if (!userData) {
            Alert.alert(
                "Yêu cầu đăng nhập",
                "Vui lòng đăng nhập để sử dụng dịch vụ",
                [
                    { text: "Đăng nhập ngay", onPress: () => navigation.navigate("Login") },
                    { text: "Hủy", style: "cancel" }
                ]);
            return;
        }
        if (!hasBookedBefore) {
            Alert.alert(
                "Chưa đặt phòng",
                "Bạn cần đặt phòng tại homestay này trước khi sử dụng dịch vụ.",
                [
                    { text: "Đặt phòng ngay", onPress: () => navigation.navigate("HomestayRental", { homeStayId: homestayId }) },
                    { text: "Hủy", style: "cancel" }
                ]);
            return;
        }
        navigation.navigate("BookService", {
            service: service,
            homestayId: homestayId
        });
    };

    const renderFilterOptions = () => (
        <Modal
            visible={showFilterOptions}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowFilterOptions(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.bottomModal}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Lọc theo giá</Text>
                        <TouchableOpacity onPress={() => setShowFilterOptions(false)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.modalOptionItem,
                            filterOption === FILTER_OPTIONS.ALL && styles.selectedOption
                        ]}
                        onPress={() => {
                            setFilterOption(FILTER_OPTIONS.ALL);
                            setShowFilterOptions(false);
                        }}
                    >
                        <Text style={[
                            styles.modalOptionText,
                            filterOption === FILTER_OPTIONS.ALL && styles.selectedOptionText
                        ]}>
                            Tất cả
                        </Text>
                        {filterOption === FILTER_OPTIONS.ALL && (
                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.modalOptionItem,
                            filterOption === FILTER_OPTIONS.UNDER_500K && styles.selectedOption
                        ]}
                        onPress={() => {
                            setFilterOption(FILTER_OPTIONS.UNDER_500K);
                            setShowFilterOptions(false);
                        }}
                    >
                        <Text style={[
                            styles.modalOptionText,
                            filterOption === FILTER_OPTIONS.UNDER_500K && styles.selectedOptionText
                        ]}>
                            Dưới 500.000₫
                        </Text>
                        {filterOption === FILTER_OPTIONS.UNDER_500K && (
                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.modalOptionItem,
                            filterOption === FILTER_OPTIONS.FROM_500K_TO_1M && styles.selectedOption
                        ]}
                        onPress={() => {
                            setFilterOption(FILTER_OPTIONS.FROM_500K_TO_1M);
                            setShowFilterOptions(false);
                        }}
                    >
                        <Text style={[
                            styles.modalOptionText,
                            filterOption === FILTER_OPTIONS.FROM_500K_TO_1M && styles.selectedOptionText
                        ]}>
                            Từ 500.000₫ - 1.000.000₫
                        </Text>
                        {filterOption === FILTER_OPTIONS.FROM_500K_TO_1M && (
                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.modalOptionItem,
                            filterOption === FILTER_OPTIONS.ABOVE_1M && styles.selectedOption
                        ]}
                        onPress={() => {
                            setFilterOption(FILTER_OPTIONS.ABOVE_1M);
                            setShowFilterOptions(false);
                        }}
                    >
                        <Text style={[
                            styles.modalOptionText,
                            filterOption === FILTER_OPTIONS.ABOVE_1M && styles.selectedOptionText
                        ]}>
                            Trên 1.000.000₫
                        </Text>
                        {filterOption === FILTER_OPTIONS.ABOVE_1M && (
                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderSortOptions = () => (
        <Modal
            visible={showSortOptions}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowSortOptions(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.bottomModal}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Sắp xếp theo</Text>
                        <TouchableOpacity onPress={() => setShowSortOptions(false)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.modalOptionItem,
                            sortOption === SORT_OPTIONS.DEFAULT && styles.selectedOption
                        ]}
                        onPress={() => {
                            setSortOption(SORT_OPTIONS.DEFAULT);
                            setShowSortOptions(false);
                        }}
                    >
                        <Text style={[
                            styles.modalOptionText,
                            sortOption === SORT_OPTIONS.DEFAULT && styles.selectedOptionText
                        ]}>
                            Mặc định
                        </Text>
                        {sortOption === SORT_OPTIONS.DEFAULT && (
                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.modalOptionItem,
                            sortOption === SORT_OPTIONS.PRICE_ASC && styles.selectedOption
                        ]}
                        onPress={() => {
                            setSortOption(SORT_OPTIONS.PRICE_ASC);
                            setShowSortOptions(false);
                        }}
                    >
                        <Text style={[
                            styles.modalOptionText,
                            sortOption === SORT_OPTIONS.PRICE_ASC && styles.selectedOptionText
                        ]}>
                            Giá thấp đến cao
                        </Text>
                        {sortOption === SORT_OPTIONS.PRICE_ASC && (
                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.modalOptionItem,
                            sortOption === SORT_OPTIONS.PRICE_DESC && styles.selectedOption
                        ]}
                        onPress={() => {
                            setSortOption(SORT_OPTIONS.PRICE_DESC);
                            setShowSortOptions(false);
                        }}
                    >
                        <Text style={[
                            styles.modalOptionText,
                            sortOption === SORT_OPTIONS.PRICE_DESC && styles.selectedOptionText
                        ]}>
                            Giá cao đến thấp
                        </Text>
                        {sortOption === SORT_OPTIONS.PRICE_DESC && (
                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderServiceItem = ({ item, index }) => {
        const serviceImage = item.imageServices?.[0]?.image || null;
        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).springify()}
                style={styles.serviceCard}
            >
                <TouchableOpacity
                    style={styles.serviceTouchable}
                    onPress={() => handleServiceSelect(item)}
                    activeOpacity={0.7}
                >
                    {serviceImage ? (
                        <Image
                            source={{ uri: serviceImage }}
                            style={styles.serviceImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.serviceImage, styles.servicePlaceholder]}>
                            <MaterialCommunityIcons
                                name="image-off"
                                size={24}
                                color="#999"
                            />
                        </View>
                    )}

                    <View style={styles.serviceContent}>
                        <Text style={styles.serviceName} numberOfLines={1}>
                            {item.servicesName}
                        </Text>
                        <Text style={styles.serviceDescription} numberOfLines={2}>
                            {item.description}
                        </Text>
                        <View style={styles.serviceFooter}>
                            <View style={styles.priceContainer}>
                                <Text style={styles.servicePriceLabel}>Giá dịch vụ</Text>
                                <Text style={styles.servicePrice}>
                                    {item.servicesPrice?.toLocaleString('vi-VN') || 0}₫
                                </Text>
                            </View>

                            {hasBookedBefore ? (
                                <View style={styles.bookNowButton}>
                                    <Text style={styles.bookNowText}>Đặt ngay</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                                </View>
                            ) : (
                                <View style={styles.bookRequiresButton}>
                                    <Text style={styles.bookRequiresText}>Cần đặt phòng trước</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    if (loading || checkingBookingStatus) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải dịch vụ...</Text>
            </View>
        );
    }
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Rất tiếc!</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => navigation.goBack()}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.buttonText}>Quay lại</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }
    if (services.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Không có dịch vụ</Text>
                <Text style={styles.emptyText}>Homestay này chưa cung cấp dịch vụ nào</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.buttonText}>Quay lại</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <Animated.View style={styles.header}>
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerGradient}
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Dịch vụ của homestay</Text>
                    <View style={styles.headerRight} />
                </LinearGradient>
            </Animated.View>

            <Animated.FlatList
                data={filteredServices}
                renderItem={renderServiceItem}
                keyExtractor={item => item.servicesID?.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                ListHeaderComponent={() => (
                    <View>
                        <View style={styles.filterToolbar}>
                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    filterOption !== FILTER_OPTIONS.ALL && styles.activeFilterButton
                                ]}
                                onPress={() => {
                                    setShowFilterOptions(!showFilterOptions);
                                    setShowSortOptions(false);
                                }}
                            >
                                <Ionicons
                                    name="filter"
                                    size={18}
                                    color={filterOption !== FILTER_OPTIONS.ALL ? "#fff" : colors.primary}
                                />
                                <Text
                                    style={[
                                        styles.filterButtonText,
                                        filterOption !== FILTER_OPTIONS.ALL && styles.activeFilterButtonText
                                    ]}
                                >
                                    Lọc giá
                                </Text>
                                <Ionicons
                                    name={showFilterOptions ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    color={filterOption !== FILTER_OPTIONS.ALL ? "#fff" : colors.primary}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.sortButton,
                                    sortOption !== SORT_OPTIONS.DEFAULT && styles.activeFilterButton
                                ]}
                                onPress={() => {
                                    setShowSortOptions(!showSortOptions);
                                    setShowFilterOptions(false);
                                }}
                            >
                                <MaterialIcons
                                    name="sort"
                                    size={18}
                                    color={sortOption !== SORT_OPTIONS.DEFAULT ? "#fff" : colors.primary}
                                />
                                <Text
                                    style={[
                                        styles.sortButtonText,
                                        sortOption !== SORT_OPTIONS.DEFAULT && styles.activeFilterButtonText
                                    ]}
                                >
                                    Sắp xếp
                                </Text>
                                <Ionicons
                                    name={showSortOptions ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    color={sortOption !== SORT_OPTIONS.DEFAULT ? "#fff" : colors.primary}
                                />
                            </TouchableOpacity>
                        </View>
                        {renderFilterOptions()}
                        {renderSortOptions()}
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsTitle}>Không tìm thấy dịch vụ</Text>
                        <Text style={styles.noResultsText}>Không có dịch vụ phù hợp với bộ lọc hiện tại</Text>
                        <TouchableOpacity
                            style={styles.resetFilterButton}
                            onPress={() => {
                                setFilterOption(FILTER_OPTIONS.ALL);
                                setSortOption(SORT_OPTIONS.DEFAULT);
                            }}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.resetFilterGradient}
                            >
                                <Text style={styles.resetFilterText}>Đặt lại bộ lọc</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 55 : 40,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerRight: { width: 40 },
    listContainer: {
        paddingTop: Platform.OS === 'ios' ? 110 : 95,
        paddingHorizontal: 16,
        paddingBottom: 30,
    },
    filterToolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        marginRight: 10,
    },
    activeFilterButton: { backgroundColor: colors.primary },
    filterButtonText: {
        fontSize: 14,
        color: colors.primary,
        marginHorizontal: 6,
        fontWeight: '500',
    },
    activeFilterButtonText: { color: '#fff' },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        marginRight: 10,
    },
    sortButtonText: {
        fontSize: 14,
        color: colors.primary,
        marginHorizontal: 6,
        fontWeight: '500',
    },
    selectedOption: {
        backgroundColor: colors.primary + '10',
        borderRadius: 8,
    },
    selectedOptionText: {
        fontWeight: 'bold',
        color: colors.primary,
    },
    serviceCard: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        elevation: 16,
        shadowColor: colors.primary + '90',
        shadowOffset: { width: 0, height: 9 },
        shadowOpacity: 1,
        shadowRadius: 20,
        overflow: 'hidden',
    },
    serviceTouchable: {
        flexDirection: 'row',
        position: 'relative',
        padding: 12,
    },
    serviceImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 12,
    },
    servicePlaceholder: {
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    serviceDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        lineHeight: 20,
    },
    serviceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    servicePriceLabel: {
        fontSize: 10,
        color: '#999',
        marginBottom: 2,
    },
    servicePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    bookNowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    bookNowText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
        marginRight: 4,
    },
    bookRequiresButton: {
        backgroundColor: '#f1f1f1',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    bookRequiresText: {
        fontSize: 12,
        color: '#777',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    backButton: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    gradientButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    noResultsContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        marginTop: 20,
    },
    noResultsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    noResultsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    resetFilterButton: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    resetFilterGradient: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    resetFilterText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        paddingTop: 20,
        width: '100%',
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalOptionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    modalOptionText: {
        fontSize: 16,
        color: '#444',
    },
});

export default ServiceScreen;