import apiClient, { handleError } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ratingApi = {
    getRatingsByHomeStay: async (homestayId) => {
        try {
            const response = await apiClient.get(`/api/rating/GetByHomeStay/${homestayId}`);
            if (response.data?.data) {
                return {
                    success: true,
                    data: {
                        reviews: response.data.data.item1,
                        totalReviews: response.data.data.item2
                    }
                };
            }
            return {
                success: false,
                error: 'Không có dữ liệu đánh giá'
            };
        } catch (error) {
            console.error('Error fetching ratings:', error);
            return {
                success: false,
                error: 'Không thể tải đánh giá. Vui lòng thử lại sau.'
            };
        }
    },

    createRating: async (formData) => {
        try {
            const userString = await AsyncStorage.getItem('user');
            if (!userString) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }
            const user = JSON.parse(userString);
            const userId = user.userId || user.AccountID;
            if (!userId) {
                throw new Error('Không tìm thấy ID người dùng');
            }
            const response = await apiClient.post('/api/rating/CreateRating', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.status === 201) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message
                };
            }
            throw new Error(response.data.message || 'Không thể tạo đánh giá');
        } catch (error) {
            console.error('Lỗi khi tạo đánh giá:', error);
            throw new Error(handleError(error));
        }
    },

    getRatingById: async (ratingId) => {
        try {
            const response = await apiClient.get(`/api/rating/GetById/${ratingId}`);
            if (response.data?.success && response.data?.data) {
                return {
                    success: true,
                    data: response.data.data
                };
            }
            return {
                success: false,
                error: 'Không tìm thấy đánh giá'
            };
        } catch (error) {
            console.error('Lỗi khi lấy thông tin đánh giá:', error);
            return {
                success: false,
                error: 'Không thể tải thông tin đánh giá. Vui lòng thử lại sau.'
            };
        }
    },

    updateRating: async (formData) => {
        try {
            const userString = await AsyncStorage.getItem('user');
            if (!userString) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }
            const user = JSON.parse(userString);
            const userId = user.userId || user.AccountID;
            if (!userId) {
                throw new Error('Không tìm thấy ID người dùng');
            }
            
            // Lấy ratingID từ formData
            const ratingID = formData.get('ratingID');
            
            const response = await apiClient.put(`/api/rating/UpdateRating/${ratingID}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (response.status === 200) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message || 'Cập nhật đánh giá thành công'
                };
            }
            throw new Error(response.data.message || 'Không thể cập nhật đánh giá');
        } catch (error) {
            console.error('Lỗi khi cập nhật đánh giá:', error);
            throw new Error(handleError(error));
        }
    },

    getRatingByBookingId: async (bookingId) => {
        try {
            const response = await apiClient.get(`/api/rating/GetByBookingId/${bookingId}`);
            if (response.data?.success && response.data?.data) {
                return {
                    success: true,
                    data: response.data.data
                };
            }
            return {
                success: false,
                error: 'Không tìm thấy đánh giá cho đặt phòng này'
            };
        } catch (error) {
            console.error('Lỗi khi lấy thông tin đánh giá theo booking:', error);
            return {
                success: false,
                error: 'Không thể tải thông tin đánh giá. Vui lòng thử lại sau.'
            };
        }
    },

    getRatingDetail: async (ratingId) => {
        try {
            const response = await apiClient.get(`/api/rating/GetRatingDetail/${ratingId}`);
            if (response.data?.statusCode === 200 && response.data?.data) {
                return {
                    success: true,
                    data: response.data.data
                };
            }
            return {
                success: false,
                error: 'Không tìm thấy chi tiết đánh giá'
            };
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết đánh giá:', error);
            return {
                success: false,
                error: 'Không thể tải chi tiết đánh giá. Vui lòng thử lại sau.'
            };
        }
    }
};

export default ratingApi; 