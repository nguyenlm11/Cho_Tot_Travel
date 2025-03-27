import axios from 'axios';
import apiClient, { BASE_URL } from '../config';

const serviceApi = {
    getAllServices: async (homestayId) => {
        try {
            const response = await apiClient.get(`/api/Service/GetAllServices/${homestayId}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Lỗi khi lấy danh sách dịch vụ:', error);
            return {
                success: false,
                error: 'Không thể tải danh sách dịch vụ'
            };
        }
    },

    // Đặt dịch vụ
    bookService: async (bookingData) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/Service/BookService`, bookingData);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Lỗi khi đặt dịch vụ:', error);
            return {
                success: false,
                error: 'Không thể đặt dịch vụ'
            };
        }
    },

    // Kiểm tra trạng thái dịch vụ
    checkServiceStatus: async (serviceId) => {
        try {
            const response = await axios.get(`${BASE_URL}/api/Service/CheckStatus/${serviceId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái dịch vụ:', error);
            return {
                success: false,
                error: 'Không thể kiểm tra trạng thái dịch vụ'
            };
        }
    }
};

export default serviceApi; 