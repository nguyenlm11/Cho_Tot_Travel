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
      
      let homeStayId = null;
      try {
        const recentConvsString = await AsyncStorage.getItem('recent_conversations');
        if (recentConvsString) {
          const conversations = JSON.parse(recentConvsString);
          const conversation = conversations.find(conv => conv.conversationID === conversationId || conv.conversationID.toString() === conversationId.toString());
          if (conversation) {
            homeStayId = conversation.homeStayID;
          }
        }
      } catch (err) {
        console.error("Error getting homeStayId from AsyncStorage:", err);
      }
      
      if (!homeStayId) {
        console.error("Không tìm thấy homeStayId cho conversationId:", conversationId);
      }
      
      const response = await apiClient.put(`/api/Chat/mark-as-read`, {
        senderId: userId,
        homeStayId: homeStayId || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  markAsReadWithHomeStayId: async (homeStayId) => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      const user = JSON.parse(userString);
      const userId = user.userId || user.AccountID;
      
      const response = await apiClient.put(`/api/Chat/mark-as-read`, {
        senderId: userId,
        homeStayId: homeStayId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read with homeStayId:', error);
      throw error;
    }
  },

  sendMessageMultipart: async (receiverId, senderName, senderId, homeStayId, content, images = []) => {
    try {
      const formData = new FormData();
      formData.append('ReceiverID', receiverId);
      formData.append('SenderName', senderName);
      formData.append('SenderID', senderId);
      
      if (homeStayId) {
        formData.append('HomeStayId', homeStayId);
      }
      
      if (content) {
        formData.append('Content', content);
      }
      
      if (images && images.length > 0) {
        images.forEach((image, index) => {
          formData.append('Images', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || `image_${index}.jpg`
          });
        });
      }
      
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