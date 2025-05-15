import apiClient, { BASE_URL } from '../config';

const serviceApi = {
    getAllServices: async (homestayId) => {
        if (!homestayId) {
            console.error('Missing homestayId parameter in getAllServices');
            return {
                success: false,
                error: 'Thiếu tham số homestayId'
            };
        }

        try {
            const response = await apiClient.get(`/api/Service/GetAllServices/${homestayId}`);
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