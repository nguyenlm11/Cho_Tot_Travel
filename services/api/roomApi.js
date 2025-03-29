import apiClient, { handleError } from '../config';

const roomApi = {
    // Lấy tất cả loại phòng theo HomeStayRentalID
    getAllRoomTypesByRentalId: async (rentalId) => {
        try {
            const response = await apiClient.get(`/api/RoomType/GetAllRoomTypeByHomeStayRentalID/${rentalId}`);
            return response.data.data || response.data || [];
        } catch (error) {
            console.error('Error fetching room types:', error.response?.data || error.message);
            throw new Error(handleError(error));
        }
    },

    // Lọc danh sách phòng theo loại phòng và khoảng thời gian
    filterRoomsByRoomTypeAndDates: async (roomTypeId, checkInDate, checkOutDate) => {
        try {
            const response = await apiClient.get('/api/rooms/FilterRoomsByRoomTypeAndDates', {
                params: {
                    roomTypeId,
                    checkInDate,
                    checkOutDate
                }
            });
            
            // Kiểm tra và trả về dữ liệu
            if (response.data && response.data.data) {
                return response.data.data;
            }
            
            return [];
        } catch (error) {
            console.error('Error filtering rooms:', error.response?.data || error.message);
            throw new Error(handleError(error));
        }
    },
};

export default roomApi; 