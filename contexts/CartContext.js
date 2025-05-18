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
    const [currentRentalId, setCurrentRentalId] = useState(null);
    const [currentRoomTypeId, setCurrentRoomTypeId] = useState(null);
    const [roomPrices, setRoomPrices] = useState({});
    const [roomTypePricings, setRoomTypePricings] = useState({});
    const pendingRequests = React.useRef({});
    const pendingPricingRequests = React.useRef({});

    useEffect(() => {
        const loadCart = async () => {
            try {
                const [savedCart, homeStayId, rentalId] = await Promise.all([
                    AsyncStorage.getItem('roomCart'),
                    AsyncStorage.getItem('currentHomeStayId'),
                    AsyncStorage.getItem('currentRentalId')
                ]);
                if (savedCart) setCartItems(JSON.parse(savedCart));
                if (homeStayId) setCurrentHomeStayId(parseInt(homeStayId));
                if (rentalId) setCurrentRentalId(parseInt(rentalId));
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
                const updates = [];
                if (currentHomeStayId) {
                    updates.push(AsyncStorage.setItem('currentHomeStayId', currentHomeStayId.toString()));
                }
                if (currentRentalId) {
                    updates.push(AsyncStorage.setItem('currentRentalId', currentRentalId.toString()));
                }
                if (currentRoomTypeId) {
                    updates.push(AsyncStorage.setItem('currentRoomTypeId', currentRoomTypeId.toString()));
                }

                if (updates.length > 0) {
                    await Promise.all(updates);
                }
            } catch (error) {
                console.error('Lỗi khi lưu ID:', error);
            }
        };
        saveIds();
    }, [currentHomeStayId, currentRentalId, currentRoomTypeId, loading]);

    const setHomeStay = useCallback((homeStayId) => {
        setCurrentHomeStayId(homeStayId);
    }, []);

    const setRental = useCallback((rentalId) => {
        setCurrentRentalId(rentalId);
    }, []);

    const addRoomToCart = useCallback((room, roomType, params = {}, checkInDate, checkOutDate) => {
        if (params.homeStayId) {
            setCurrentHomeStayId(params.homeStayId);
        }
        if (params.rentalId) {
            setCurrentRentalId(params.rentalId);
        }
        if (params.roomTypeId) {
            setCurrentRoomTypeId(params.roomTypeId);
        }
        const formattedCheckIn = checkInDate ? new Date(checkInDate).toISOString() : new Date().toISOString();
        const formattedCheckOut = checkOutDate ? new Date(checkOutDate).toISOString() : new Date(Date.now() + 86400000).toISOString();
        const cartItem = {
            id: `${room.roomID}_${Date.now()}`,
            roomID: room.roomID,
            roomNumber: room.roomNumber,
            roomTypeID: roomType?.roomTypeID || 0,
            homeStayTypeID: room.homeStayTypeID || 0,
            homeStayID: params.homeStayId || null,
            rentalId: params.rentalId || null,
            price: room.price || 0,
            image: room.image || null,
            roomTypeName: roomType?.name,
            checkInDate: formattedCheckIn,
            checkOutDate: formattedCheckOut,
        };
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.roomID === room.roomID);
            if (existingItem) return prevItems;
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
            let matchesRental = true;
            if (params.homeStayId) {
                matchesHomeStay = item.homeStayID === params.homeStayId;
            }
            if (params.rentalId) {
                matchesRental = item.rentalId === params.rentalId;
            }
            return matchesRoomType && matchesHomeStay && matchesRental;
        });
    }, [cartItems]);

    const getRoomsByParams = useCallback((params = {}) => {
        if (!params || (!params.homeStayId && !params.rentalId)) {
            return cartItems;
        }
        return cartItems.filter(item => {
            let matchesHomeStay = true;
            let matchesRental = true;

            if (params.homeStayId) {
                matchesHomeStay = item.homeStayID === params.homeStayId;
            }
            if (params.rentalId) {
                matchesRental = item.rentalId === params.rentalId;
            }
            return matchesHomeStay && matchesRental;
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
        const roomsInCurrentHomeStay = getRoomsByParams({ homeStayId: currentHomeStayId });
        if (roomsInCurrentHomeStay.length === 0) return null;
        const bookingDetails = roomsInCurrentHomeStay.map(room => ({
            rentalId: currentRentalId,
            roomTypeID: room.roomTypeID,
            roomID: room.roomID,
            checkInDate: room.checkInDate,
            checkOutDate: room.checkOutDate
        }));
        return {
            numberOfChildren: numberOfChildren || 0,
            numberOfAdults: numberOfAdults || 0,
            accountID: accountID || "string",
            homeStayID: currentHomeStayId,
            bookingDetails: bookingDetails,
            bookingOfServices: {
                bookingServicesDetails: []
            }
        };
    }, [currentHomeStayId, currentRentalId, getRoomsByParams]);

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
                return pricing ? pricing.rentPrice : 0;
            }
            if (pendingPricingRequests.current[roomTypeId]) {
                const pricings = await pendingPricingRequests.current[roomTypeId];
                const pricing = pricings.find(p => p.dayType === dateType);
                return pricing ? pricing.rentPrice : 0;
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
            return pricing ? pricing.rentPrice : 0;
        } catch (error) {
            return 0;
        }
    }, [roomTypePricings]);

    const cartContextValue = useMemo(() => ({
        cartItems,
        currentHomeStayId,
        currentRentalId,
        setHomeStay,
        setRental,
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
        currentRentalId,
        setHomeStay,
        setRental,
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