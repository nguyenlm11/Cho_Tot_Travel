import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import homeStayApi from '../services/api/homeStayApi';

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

    // Tải dữ liệu giỏ hàng từ AsyncStorage khi khởi động
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

    // Lưu homeStayId và rentalId hiện tại
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

    // Cập nhật homestay hiện tại
    const setHomeStay = (homeStayId) => {
        setCurrentHomeStayId(homeStayId);
    };

    // Cập nhật rental hiện tại
    const setRental = (rentalId) => {
        setCurrentRentalId(rentalId);
    };

    // Thêm phòng vào giỏ với đúng thông tin cần thiết cho API
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

    // Lọc phòng theo loại phòng và homestay/rental
    const getRoomsByType = (roomTypeId, params = {}) => {
        return cartItems.filter(item => {
            // Kiểm tra nếu roomTypeId là undefined, không lọc theo loại phòng
            const matchesRoomType = roomTypeId ? item.roomTypeID === roomTypeId : true;

            // Kiểm tra homeStayId và rentalId (nếu có)
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

    // Lọc tất cả phòng của một homestay/rental
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

            // Nếu không có tham số nào được chỉ định, trả về tất cả các phòng
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

    // Check xem một phòng đã trong giỏ chưa
    const isRoomInCart = (roomID) => {
        return cartItems.some(item => item.roomID === roomID);
    };

    // Tạo đối tượng dữ liệu booking theo định dạng API
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

        // Tạo đối tượng booking theo định dạng API
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

    // Hàm lấy giá phòng từ API
    const fetchRoomPrice = async (room) => {
        try {
            if (!room.checkInDate || !room.checkOutDate || !room.roomTypeID) {
                return null;
            }
            
            const checkInDate = new Date(room.checkInDate).toISOString().split('T')[0];
            const checkOutDate = new Date(room.checkOutDate).toISOString().split('T')[0];
            const homeStayRentalId = room.rentalId;
            const roomTypeId = room.roomTypeID;
            
            // Tạo key để lưu vào cache
            const priceKey = `${checkInDate}_${checkOutDate}_${homeStayRentalId || 'null'}_${roomTypeId}`;
            
            // Kiểm tra xem đã có giá trong cache chưa
            if (roomPrices[priceKey]) {
                return roomPrices[priceKey];
            }
            
            // Nếu đang có request đang chạy cho cặp tham số này, chờ kết quả từ request đó
            if (pendingRequests.current[priceKey]) {
                return pendingRequests.current[priceKey];
            }
            
            // Tạo một promise mới và lưu vào danh sách pending
            pendingRequests.current[priceKey] = new Promise(async (resolve) => {
                try {
                    const result = await homeStayApi.getTotalPrice(
                        checkInDate,
                        checkOutDate,
                        homeStayRentalId,
                        roomTypeId
                    );
                    
                    if (result.success && result.data) {
                        // Lưu giá vào cache
                        setRoomPrices(prev => ({
                            ...prev,
                            [priceKey]: result.data
                        }));
                        resolve(result.data);
                    } else {
                        resolve(null);
                    }
                } catch (err) {
                    console.error('Lỗi khi lấy giá phòng:', err);
                    resolve(null);
                } finally {
                    // Xóa request khỏi danh sách pending
                    delete pendingRequests.current[priceKey];
                }
            });
            
            return pendingRequests.current[priceKey];
        } catch (error) {
            console.error('Lỗi khi lấy giá phòng:', error);
            return null;
        }
    };
    
    // Hàm tính tổng giá cho tất cả phòng đã chọn
    const calculateTotalPrice = async (params = {}) => {
        const rooms = getRoomsByParams(params);
        let total = 0;
        
        for (const room of rooms) {
            const price = await fetchRoomPrice(room);
            if (price) {
                total += price;
            } else {
                // Sử dụng giá mặc định từ room nếu không lấy được từ API
                total += room.price || 0;
            }
        }
        
        return total;
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
                calculateTotalPrice
            }}
        >
            {children}
        </CartContext.Provider>
    );
}; 