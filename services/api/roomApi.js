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

    // Thêm hàm để lấy phòng theo loại phòng và rentalId
    getRoomsByTypeAndRental: async (roomTypeId, rentalId) => {
        try {
            // Log để kiểm tra
            console.log(`Fetching rooms for roomTypeId: ${roomTypeId}, rentalId: ${rentalId}`);
            
            const response = await apiClient.get(`/api/Room/GetRoomsByRoomTypeIdAndRentalId`, {
                params: {
                    roomTypeId: roomTypeId,
                    rentalId: rentalId
                }
            });
            
            if (response.status === 200) {
                // Log để kiểm tra response
                console.log("Rooms API response:", response.data);
                return response.data;
            }
            
            return [];
        } catch (error) {
            console.error("API Error in getRoomsByTypeAndRental:", error);
            throw new Error(handleError(error));
        }
    },
};

export default roomApi; 