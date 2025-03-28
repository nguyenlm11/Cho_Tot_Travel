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
};

export default roomApi; 