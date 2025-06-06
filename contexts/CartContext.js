import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import homeStayApi from '../services/api/homeStayApi';
import apiClient from '../services/config';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);
export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentHomeStayId, setCurrentHomeStayId] = useState(null);
    const [roomPrices, setRoomPrices] = useState({});
    const [roomTypePricings, setRoomTypePricings] = useState({});
    const pendingRequests = React.useRef({});
    const pendingPricingRequests = React.useRef({});

    useEffect(() => {
        const loadCart = async () => {
            try {
                const [savedCart, homeStayId] = await Promise.all([
                    AsyncStorage.getItem('roomCart'),
                    AsyncStorage.getItem('currentHomeStayId')
                ]);
                if (savedCart) setCartItems(JSON.parse(savedCart));
                if (homeStayId) setCurrentHomeStayId(parseInt(homeStayId));
            } catch (error) {
                console.error('Lỗi khi tải giỏ phòng:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCart();
    }, []);

    useEffect(() => {
        if (loading) return;
        const saveCart = async () => {
            try {
                await AsyncStorage.setItem('roomCart', JSON.stringify(cartItems));
            } catch (error) {
                console.error('Lỗi khi lưu giỏ phòng:', error);
            }
        };
        saveCart();
    }, [cartItems, loading]);

    useEffect(() => {
        if (loading) return;
        const saveIds = async () => {
            try {
                if (currentHomeStayId) {
                    await AsyncStorage.setItem('currentHomeStayId', currentHomeStayId.toString());
                }
            } catch (error) {
                console.error('Lỗi khi lưu ID:', error);
            }
        };
        saveIds();
    }, [currentHomeStayId, loading]);

    const setHomeStay = useCallback((homeStayId) => {
        setCurrentHomeStayId(homeStayId);
    }, []);

    const addRoomToCart = useCallback((room, roomType, params = {}, checkInDate, checkOutDate) => {
        const formattedCheckIn = checkInDate ? new Date(checkInDate).toISOString() : new Date().toISOString();
        const formattedCheckOut = checkOutDate ? new Date(checkOutDate).toISOString() : new Date(Date.now() + 86400000).toISOString();

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.roomID === room.roomID);
            if (existingItem) return prevItems;
            if (prevItems.length > 0) {
                const firstItemHomeStayId = prevItems[0].homeStayID;
                if (params.homeStayId !== firstItemHomeStayId) {
                    console.warn('Không thể thêm phòng từ homestay khác vào giỏ hàng');
                    return prevItems;
                }
            }

            const cartItem = {
                id: `${room.roomID}_${Date.now()}`,
                roomID: room.roomID,
                roomNumber: room.roomNumber,
                roomTypeID: roomType?.roomTypeID || 0,
                homeStayTypeID: room.homeStayTypeID || 0,
                homeStayID: params.homeStayId || null,
                rentalId: room.rentalId || params.rentalId || null,
                rentalName: room.rentalName || params.rentalName || 'Không xác định',
                price: room.price || 0,
                image: room.imageRooms?.[0]?.image,
                roomTypeName: roomType?.name,
                checkInDate: formattedCheckIn,
                checkOutDate: formattedCheckOut,
            };
            console.log('cartItem: ', cartItem);
            return [...prevItems, cartItem];
        });
    }, []);

    const removeRoomFromCart = useCallback((roomID) => {
        setCartItems(prevItems => prevItems.filter(item => item.roomID !== roomID));
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const getRoomsByType = useCallback((roomTypeId, params = {}) => {
        return cartItems.filter(item => {
            const matchesRoomType = roomTypeId ? item.roomTypeID === roomTypeId : true;
            let matchesHomeStay = true;
            if (params.homeStayId) {
                matchesHomeStay = item.homeStayID === params.homeStayId;
            }
            return matchesRoomType && matchesHomeStay;
        });
    }, [cartItems]);

    const getRoomsByParams = useCallback((params = {}) => {
        if (!params || !params.homeStayId) {
            return cartItems;
        }
        return cartItems.filter(item => {
            let matchesHomeStay = true;
            if (params.homeStayId) {
                matchesHomeStay = item.homeStayID === params.homeStayId;
            }
            return matchesHomeStay;
        });
    }, [cartItems]);

    const getCartCount = useCallback((params = null) => {
        if (!params) {
            return cartItems.length;
        }
        const selectedRooms = getRoomsByParams(params);
        return selectedRooms.length;
    }, [cartItems, getRoomsByParams]);

    const isRoomInCart = useCallback((roomID) => {
        return cartItems.some(item => item.roomID === roomID);
    }, [cartItems]);

    const createBookingData = useCallback((accountID, numberOfAdults, numberOfChildren) => {
        if (!currentHomeStayId) return null;
        if (cartItems.length === 0) return null;
        const bookingDetails = cartItems.map(cartItem => {
            console.log('Creating booking detail for room:', cartItem.roomNumber);
            console.log('Room rentalId:', cartItem.rentalId);
            const detail = {
                rentalId: cartItem.rentalId,
                roomTypeID: cartItem.roomTypeID,
                roomID: cartItem.roomID,
                checkInDate: cartItem.checkInDate,
                checkOutDate: cartItem.checkOutDate
            };
            return detail;
        });

        const booking = {
            numberOfChildren: numberOfChildren || 0,
            numberOfAdults: numberOfAdults || 0,
            accountID: accountID || "string",
            homeStayID: currentHomeStayId,
            bookingDetails: bookingDetails,
            bookingOfServices: {
                bookingServicesDetails: []
            }
        };
        return booking;
    }, [currentHomeStayId, cartItems]);

    const fetchRoomPrice = useCallback(async (room) => {
        try {
            if (!room || !room.checkInDate || !room.checkOutDate || !room.roomTypeID) {
                return room?.price || 0;
            }
            const checkInDate = new Date(room.checkInDate).toISOString().split('T')[0];
            const checkOutDate = new Date(room.checkOutDate).toISOString().split('T')[0];
            const homeStayRentalId = room.rentalId;
            const roomTypeId = room.roomTypeID;
            const priceKey = `${checkInDate}_${checkOutDate}_${homeStayRentalId || 'null'}_${roomTypeId}`;
            if (roomPrices[priceKey]) {
                return roomPrices[priceKey];
            }
            if (pendingRequests.current[priceKey]) {
                return pendingRequests.current[priceKey];
            }
            pendingRequests.current[priceKey] = new Promise(async (resolve) => {
                try {
                    const result = await homeStayApi.getTotalPrice(
                        checkInDate,
                        checkOutDate,
                        homeStayRentalId,
                        roomTypeId
                    );
                    if (result?.success && result.data !== null && result.data !== undefined) {
                        setRoomPrices(prev => ({
                            ...prev,
                            [priceKey]: result.data
                        }));
                        resolve(result.data);
                    } else {
                        resolve(room.price || 0);
                    }
                } catch (err) {
                    console.error('Lỗi khi lấy giá phòng:', err);
                    resolve(room.price || 0);
                } finally {
                    delete pendingRequests.current[priceKey];
                }
            });
            return pendingRequests.current[priceKey];
        } catch (error) {
            console.error('Lỗi khi lấy giá phòng:', error);
            return room.price || 0;
        }
    }, [roomPrices]);

    const calculateTotalPrice = useCallback(async (params = {}) => {
        const rooms = getRoomsByParams(params);
        const prices = await Promise.all(
            rooms.map(room => fetchRoomPrice(room))
        );

        return prices.reduce((sum, price, index) => {
            return sum + (price || rooms[index].price || 0);
        }, 0);
    }, [getRoomsByParams, fetchRoomPrice]);

    const checkDateType = useCallback(async (dateTime, homeStayRentalId, roomTypeId) => {
        try {
            const result = await homeStayApi.getDateType(dateTime, homeStayRentalId, roomTypeId);
            if (result?.success) {
                return result.data;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }, []);

    const getPriceByDateType = useCallback(async (roomTypeId, dateType) => {
        try {
            if (roomTypePricings[roomTypeId]) {
                const pricings = roomTypePricings[roomTypeId];
                const pricing = pricings.find(p => p.dayType === dateType);
                if (pricing) {
                    return pricing.rentPrice;
                }
                if (dateType === 1 || dateType === 2) {
                    const normalPricing = pricings.find(p => p.dayType === 0);
                    return normalPricing ? normalPricing.rentPrice : 0;
                }
                return 0;
            }
            if (pendingPricingRequests.current[roomTypeId]) {
                const pricings = await pendingPricingRequests.current[roomTypeId];
                const pricing = pricings.find(p => p.dayType === dateType);
                if (pricing) {
                    return pricing.rentPrice;
                }
                if (dateType === 1 || dateType === 2) {
                    const normalPricing = pricings.find(p => p.dayType === 0);
                    return normalPricing ? normalPricing.rentPrice : 0;
                }
                return 0;
            }
            pendingPricingRequests.current[roomTypeId] = apiClient.get(`/api/homestay/GetAllPricingByRoomType/${roomTypeId}`)
                .then(response => {
                    const pricingData = response.data.data || [];
                    setRoomTypePricings(prev => ({
                        ...prev,
                        [roomTypeId]: pricingData
                    }));
                    return pricingData;
                })
                .catch(error => {
                    return [];
                })
                .finally(() => {
                    setTimeout(() => {
                        delete pendingPricingRequests.current[roomTypeId];
                    }, 5000);
                });
            const pricings = await pendingPricingRequests.current[roomTypeId];
            const pricing = pricings.find(p => p.dayType === dateType);
            if (pricing) {
                return pricing.rentPrice;
            }
            // Nếu không tìm thấy pricing cho dayType 1 hoặc 2, sử dụng giá ngày thường
            if (dateType === 1 || dateType === 2) {
                const normalPricing = pricings.find(p => p.dayType === 0);
                return normalPricing ? normalPricing.rentPrice : 0;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }, [roomTypePricings]);

    const cartContextValue = useMemo(() => ({
        cartItems,
        currentHomeStayId,
        setHomeStay,
        addRoomToCart,
        removeRoomFromCart,
        clearCart,
        getRoomsByType,
        getRoomsByParams,
        getCartCount,
        isRoomInCart,
        createBookingData,
        fetchRoomPrice,
        calculateTotalPrice,
        checkDateType,
        getPriceByDateType
    }), [
        cartItems,
        currentHomeStayId,
        setHomeStay,
        addRoomToCart,
        removeRoomFromCart,
        clearCart,
        getRoomsByType,
        getRoomsByParams,
        getCartCount,
        isRoomInCart,
        createBookingData,
        fetchRoomPrice,
        calculateTotalPrice,
        checkDateType,
        getPriceByDateType
    ]);

    return (
        <CartContext.Provider value={cartContextValue}>
            {children}
        </CartContext.Provider>
    );
}; 