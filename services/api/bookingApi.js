import apiClient from '../config';

const bookingApi = {
    createBooking: async (bookingData, paymentMethod) => {
        try {
            const response = await apiClient.post(`/api/booking-checkout/CreateBooking?paymentMethod=${paymentMethod}`, bookingData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Lỗi khi tạo booking:', error);
            if (error.response) {
                return {
                    success: false,
                    error: error.response.data?.message || 'Lỗi từ server khi tạo booking',
                    status: error.response.status,
                    data: error.response.data
                };
            }
            else if (error.request) {
                return {
                    success: false,
                    error: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
                    networkError: true
                };
            }
            else {
                return {
                    success: false,
                    error: error.message || 'Có lỗi xảy ra khi tạo booking',
                };
            }
        }
    },

    getBookingsByAccountID: async (accountID) => {
        try {
            const response = await apiClient.get(`/api/booking-bookingservices/GetBookingByAccountID/${accountID}`);
            let bookingsData = [];
            if (Array.isArray(response.data)) {
                bookingsData = response.data;
            } else if (response.data && typeof response.data === 'object') {
                if (response.data.data && Array.isArray(response.data.data)) {
                    bookingsData = response.data.data;
                } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
                    bookingsData = response.data.bookings;
                }
            }
            return {
                success: true,
                data: bookingsData
            };
        } catch (error) {
            return {
                success: false,
                error: 'Không thể tải thông tin đặt phòng của tài khoản',
                data: []
            };
        }
    },

    checkUserHasBookedHomestay: async (accountID, homestayId) => {
        try {
            if (!accountID) {
                return {
                    success: false,
                    hasBooked: false,
                    error: 'Thiếu thông tin người dùng'
                };
            }
            const response = await apiClient.get(`/api/booking-bookingservices/GetBookingByAccountID/${accountID}`);
            let bookingsData = [];
            if (Array.isArray(response.data)) {
                bookingsData = response.data;
            } else if (response.data && typeof response.data === 'object') {
                if (response.data.data && Array.isArray(response.data.data)) {
                    bookingsData = response.data.data;
                } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
                    bookingsData = response.data.bookings;
                }
            }
            const hasBookedHomestay = bookingsData.some(booking => {
                return booking.homeStayID === parseInt(homestayId) ||
                    booking.homeStayID === homestayId ||
                    (booking.homeStayID && homestayId &&
                        booking.homeStayID.toString() === homestayId.toString());
            });
            return {
                success: true,
                hasBooked: hasBookedHomestay,
                bookings: bookingsData
            };
        } catch (error) {
            console.error('Lỗi khi kiểm tra booking:', error);
            return {
                success: false,
                hasBooked: false,
                error: 'Không thể kiểm tra thông tin đặt phòng'
            };
        }
    }
};

export default bookingApi;