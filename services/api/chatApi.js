import apiClient, { handleError } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const chatApi = {
  getConversationsByCustomerId: async () => {
    try {
      // Lấy thông tin người dùng từ AsyncStorage
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

  sendMessage: async (conversationId, content) => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      const user = JSON.parse(userString);
      const userId = user.userId || user.AccountID;

      const response = await apiClient.post(`/api/Chat/send-message`, {
        conversationId,
        senderId: userId,
        content
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      throw new Error(handleError(error));
    }
  },
};

export default chatApi; 