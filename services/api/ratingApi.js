import apiClient, { handleError } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ratingApi = {
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
};

export default ratingApi; 