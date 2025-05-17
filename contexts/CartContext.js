import React, { createContext, useContext, useState, useEffect } from 'react';
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
    const pendingRequests = React.useRef({});
    const [roomTypePricings, setRoomTypePricings] = useState({});
    const pendingPricingRequests = React.useRef({});

    useEffect(() => {
        const loadCart = async () => {
            try {
                const savedCart = await AsyncStorage.getItem('roomCart');
                if (savedCart) {
                    setCartItems(JSON.parse(savedCart));
                }
                const homeStayId = await AsyncStorage.getItem('currentHomeStayId');
                if (homeStayId) {
                    setCurrentHomeStayId(parseInt(homeStayId));
                }
                const rentalId = await AsyncStorage.getItem('currentRentalId');
                if (rentalId) {
                    setCurrentRentalId(parseInt(rentalId));
                }
            } catch (error) {
                console.error('Lỗi khi tải giỏ phòng:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCart();
    }, []);

    useEffect(() => {
        if (!loading) {
            const saveCart = async () => {
                try {
                    await AsyncStorage.setItem('roomCart', JSON.stringify(cartItems));
                } catch (error) {
                    console.error('Lỗi khi lưu giỏ phòng:', error);
                }
            };
            saveCart();
        }
    }, [cartItems, loading]);

    useEffect(() => {
        const saveIds = async () => {
            try {
                if (currentHomeStayId) {
                    await AsyncStorage.setItem('currentHomeStayId', currentHomeStayId.toString());
                }
                if (currentRentalId) {
                    await AsyncStorage.setItem('currentRentalId', currentRentalId.toString());
                }
                if (currentRoomTypeId) {
                    await AsyncStorage.setItem('currentRoomTypeId', currentRoomTypeId.toString());
                }
            } catch (error) {
                console.error('Lỗi khi lưu ID:', error);
            }
        };

        if (!loading) {
            saveIds();
        }
    }, [currentHomeStayId, currentRentalId, currentRoomTypeId, loading]);

    const setHomeStay = (homeStayId) => {
        setCurrentHomeStayId(homeStayId);
    };

    const setRental = (rentalId) => {
        setCurrentRentalId(rentalId);
    };

    const addRoomToCart = (room, roomType, params = {}, checkInDate, checkOutDate) => {
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
            roomTypeName: roomType?.name || "Phòng",
            checkInDate: formattedCheckIn,
            checkOutDate: formattedCheckOut,
        };

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.roomID === room.roomID);
            if (existingItem) {
                return prevItems;
            }
            return [...prevItems, cartItem];
        });
    };

    const removeRoomFromCart = (roomID) => {
        setCartItems(prevItems =>
            prevItems.filter(item => item.roomID !== roomID)
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getRoomsByType = (roomTypeId, params = {}) => {
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
    };

    const getRoomsByParams = (params = {}) => {
        return cartItems.filter(item => {
            let matchesHomeStay = true;
            let matchesRental = true;
            if (params.homeStayId) {
                matchesHomeStay = item.homeStayID === params.homeStayId;
            }
            if (params.rentalId) {
                matchesRental = item.rentalId === params.rentalId;
            }
            if (!params.homeStayId && !params.rentalId) {
                return true;
            }
            return matchesHomeStay && matchesRental;
        });
    };

    const getCartCount = (params = null) => {
        if (!params) {
            return cartItems.length;
        }
        const selectedRooms = getRoomsByParams(params);
        return selectedRooms.length;
    };

    const isRoomInCart = (roomID) => {
        return cartItems.some(item => item.roomID === roomID);
    };

    const createBookingData = (accountID, numberOfAdults, numberOfChildren) => {
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

        const bookingData = {
            numberOfChildren: numberOfChildren || 0,
            numberOfAdults: numberOfAdults || 0,
            accountID: accountID || "string",
            homeStayID: currentHomeStayId,
            bookingDetails: bookingDetails,
            bookingOfServices: {
                bookingServicesDetails: []
            }
        };
        return bookingData;
    };

    const fetchRoomPrice = async (room) => {
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

                    if (result && result.success && result.data !== null && result.data !== undefined) {
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
    };

    const calculateTotalPrice = async (params = {}) => {
        const rooms = getRoomsByParams(params);
        let total = 0;
        for (const room of rooms) {
            const price = await fetchRoomPrice(room);
            if (price) {
                total += price;
            } else {
                total += room.price || 0;
            }
        }

        return total;
    };

    const checkDateType = async (dateTime) => {
        try {
            const result = await homeStayApi.getDateType(dateTime);
            if (result && result.success) {
                return result.data;
            }
            return 0;
        } catch (error) {
            console.error('Lỗi khi kiểm tra loại ngày:', error);
            return 0;
        }
    };

    const getPriceByDateType = async (roomTypeId, dateType) => {
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

            pendingPricingRequests.current[roomTypeId] = new Promise(async (resolve) => {
                try {
                    const response = await apiClient.get(`/api/homestay/GetAllPricingByRoomType/${roomTypeId}`);
                    const pricingData = response.data.data || [];
                    
                    setRoomTypePricings(prev => ({
                        ...prev,
                        [roomTypeId]: pricingData
                    }));
                    
                    resolve(pricingData);
                    
                    const pricing = pricingData.find(p => p.dayType === dateType);
                    return pricing ? pricing.rentPrice : 0;
                } catch (error) {
                    console.error(`Error fetching pricing for roomTypeId ${roomTypeId}:`, error);
                    resolve([]);
                    return 0;
                } finally {
                    delete pendingPricingRequests.current[roomTypeId];
                }
            });
            
            const pricings = await pendingPricingRequests.current[roomTypeId];
            const pricing = pricings.find(p => p.dayType === dateType);
            return pricing ? pricing.rentPrice : 0;
        } catch (error) {
            console.error('Error in getPriceByDateType:', error);
            return 0;
        }
    };

    return (
        <CartContext.Provider
            value={{
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
            }}
        >
            {children}
        </CartContext.Provider>
    );
}; 