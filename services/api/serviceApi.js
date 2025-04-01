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
};

export default serviceApi; 