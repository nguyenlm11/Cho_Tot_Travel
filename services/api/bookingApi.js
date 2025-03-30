import apiClient from '../config';

const bookingApi = {
    createBooking: async (bookingData, paymentMethod) => {
        try {
            const response = await apiClient.post(`/api/booking-bookingservices/CreateBooking?paymentMethod=${paymentMethod}`, bookingData, {
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

    getUserBookings: async (accountId) => {
        try {
            const response = await apiClient.get(`/api/booking-bookingservices/GetUserBookings/${accountId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Lỗi khi lấy danh sách booking:', error);
            return {
                success: false,
                error: 'Không thể tải danh sách booking'
            };
        }
    },

    getBookingDetail: async (bookingId) => {
        try {
            const response = await apiClient.get(`/api/booking-bookingservices/GetBookingDetail/${bookingId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết booking:', error);
            return {
                success: false,
                error: 'Không thể tải chi tiết booking'
            };
        }
    },

    cancelBooking: async (bookingId) => {
        try {
            const response = await apiClient.post(`/api/booking-bookingservices/CancelBooking/${bookingId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Lỗi khi hủy booking:', error);
            return {
                success: false,
                error: 'Không thể hủy booking'
            };
        }
    }
};

export default bookingApi; 