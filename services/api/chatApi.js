import apiClient, { handleError } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const chatApi = {
  getConversationsByCustomerId: async () => {
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
      const response = await apiClient.get(`/api/Chat/conversations/by-customer/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', error);
      throw new Error(handleError(error));
    }
  },

  getMessages: async (conversationId) => {
    try {
      const response = await apiClient.get(`/api/Chat/messages/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử tin nhắn:', error);
      throw new Error(handleError(error));
    }
  },

  markAsRead: async (conversationId) => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      const user = JSON.parse(userString);
      const userId = user.userId || user.AccountID;
      console.log("userId", userId);
      console.log("conversationId", conversationId);
      const response = await apiClient.put(`/api/Chat/mark-as-read`, {
        senderId: userId,
        conversationId
      });
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  sendMessageMultipart: async (receiverId, senderName, senderId, homeStayId, content, images = []) => {
    try {
      const formData = new FormData();
      formData.append('ReceiverID', receiverId);  // ID của người nhận (chủ nhà/owner)
      formData.append('SenderName', senderName);  // Tên người gửi (người dùng hiện tại)
      formData.append('SenderID', senderId);      // ID của người gửi (người dùng hiện tại)
      
      if (homeStayId) {
        formData.append('HomeStayId', homeStayId); // ID của homestay liên quan
      }
      
      if (content) {
        formData.append('Content', content);       // Nội dung văn bản
      }
      
      // Thêm hình ảnh (nếu có)
      if (images && images.length > 0) {
        images.forEach((image, index) => {
          formData.append('Images', {
            uri: image.uri,                        // Đường dẫn URI của ảnh
            type: image.type || 'image/jpeg',      // Loại file (mặc định là JPEG)
            name: image.name || `image_${index}.jpg` // Tên file
          });
        });
      }
      
      // Gửi request dạng multipart/form-data
      const response = await apiClient.post('/api/Chat/send-message', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn multipart:', error);
      throw new Error(handleError(error));
    }
  },
};

export default chatApi; 