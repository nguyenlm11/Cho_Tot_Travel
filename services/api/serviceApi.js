import axios from 'axios';
import apiClient, { BASE_URL } from '../config';

const serviceApi = {
    getAllServices: async (homestayId) => {
        console.log(`Calling getAllServices API with homestayId: ${homestayId}`);
        
        if (!homestayId) {
            console.error('Missing homestayId parameter in getAllServices');
            return {
                success: false,
                error: 'Thiếu tham số homestayId'
            };
        }
        
        try {
            console.log(`API URL: /api/Service/GetAllServices/${homestayId}`);
            const response = await apiClient.get(`/api/Service/GetAllServices/${homestayId}`);
            console.log('API Response:', response.data);
            
            if (response.data && response.data.data) {
                return {
                    success: true,
                    data: response.data.data
                };
            } else {
                console.warn('API response missing data structure:', response.data);
                return {
                    success: true,
                    data: []
                };
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách dịch vụ:', error);
            console.error('Error response:', error.response?.data);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Không thể tải danh sách dịch vụ'
            };
        }
    },
};

export default serviceApi; 