import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import chatApi from '../services/api/chatApi';
import signalRService from '../services/signalRService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/Colors';
import Icon from 'react-native-vector-icons/Ionicons';

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diff < 7) {
    return date.toLocaleDateString('vi-VN', { weekday: 'long' });
  }
  
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const ConversationItem = ({ conversation, onPress }) => {
  const { conversationID, homeStayName, ownerID, lastMessage } = conversation;
  
  return (
    <TouchableOpacity 
      style={styles.conversationItem} 
      onPress={() => onPress(conversationID, ownerID, homeStayName)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {homeStayName?.charAt(0) || '?'}
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{homeStayName || 'Không xác định'}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {lastMessage ? lastMessage.content : 'Chưa có tin nhắn'}
        </Text>
      </View>
      
      <View style={styles.meta}>
        {lastMessage && lastMessage.sentAt && (
          <Text style={styles.time}>{formatDate(lastMessage.sentAt)}</Text>
        )}
        
        {lastMessage && !lastMessage.isRead && lastMessage.receiverID !== ownerID && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function ChatScreen() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();
  
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          setUserId(user.userId || user.AccountID);
        }
      } catch (error) {
        console.error('Lỗi khi lấy ID người dùng:', error);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    let messageUnsubscribe = () => {};
    let statusUnsubscribe = () => {};
    let newConversationUnsubscribe = () => {};
    let messageReadUnsubscribe = () => {};

    const setupSignalR = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          await signalRService.startConnection(token);
          setConnected(signalRService.isConnected());
          
          messageUnsubscribe = signalRService.onMessageReceived(handleNewMessage);
          
          newConversationUnsubscribe = signalRService.onNewConversation(handleNewConversation);
          
          messageReadUnsubscribe = signalRService.onMessageRead(handleMessageRead);
          
          statusUnsubscribe = signalRService.onUserStatusChanged((isConnected) => {
            setConnected(isConnected);
            
            if (isConnected) {
              loadConversations();
            }
          });
        }
      } catch (error) {
        console.error('Lỗi khi thiết lập SignalR:', error);
      }
    };

    setupSignalR();

    return () => {
      try {
        messageUnsubscribe();
        statusUnsubscribe();
        newConversationUnsubscribe();
        messageReadUnsubscribe();
      } catch (error) {
        console.error('Lỗi khi dọn dẹp SignalR callbacks:', error);
      }
    };
  }, []);

  const handleNewConversation = useCallback((conversation) => {
    console.log('Nhận cuộc trò chuyện mới:', conversation);
    
    setConversations(prevConversations => {
      const existingIndex = prevConversations.findIndex(
        conv => conv.conversationID.toString() === conversation.conversationID.toString()
      );
      
      if (existingIndex !== -1) {
        return prevConversations;
      }
      
      return [conversation, ...prevConversations];
    });
  }, []);

  const handleNewMessage = useCallback((message) => {
    console.log('Nhận tin nhắn mới trong ChatScreen:', message);
    
    setConversations(prevConversations => {
      const conversationIndex = prevConversations.findIndex(
        conv => conv.conversationID && conv.conversationID.toString() === message.conversationID?.toString()
      );

      if (conversationIndex !== -1) {
        // Nếu tìm thấy cuộc trò chuyện, cập nhật tin nhắn cuối cùng
        const updatedConversations = [...prevConversations];
        
        updatedConversations[conversationIndex] = {
          ...updatedConversations[conversationIndex],
          lastMessage: {
            ...message,
            isRead: message.senderID === userId
          }
        };

        // Đưa cuộc trò chuyện lên đầu danh sách
        if (conversationIndex > 0) {
          const conversationToMove = updatedConversations.splice(conversationIndex, 1)[0];
          updatedConversations.unshift(conversationToMove);
        }

        return updatedConversations;
      } else {
        // Nếu không tìm thấy cuộc trò chuyện, thử tạo cuộc trò chuyện mới từ tin nhắn
        // Chỉ thực hiện nếu có đủ thông tin
        if (message.conversationID && message.senderID && message.senderID !== userId) {
          // Tạo cuộc trò chuyện mới từ tin nhắn đầu tiên
          const newConversation = {
            conversationID: message.conversationID,
            homeStayName: message.senderName || 'Người dùng mới',
            ownerID: message.senderID,
            lastMessage: {
              ...message,
              isRead: false
            }
          };
          
          // Thêm vào đầu danh sách
          return [newConversation, ...prevConversations];
        }
        
        // Nếu không đủ thông tin hoặc không phải là tin nhắn mới, tải lại danh sách
        loadConversations();
        return prevConversations;
      }
    });
  }, [userId, loadConversations]);

  const handleMessageRead = useCallback((messageId, conversationId) => {
    console.log('Tin nhắn đã được đọc:', messageId, 'trong cuộc trò chuyện:', conversationId);
    
    if (!conversationId) return;
    
    setConversations(prevConversations => {
      const updatedConversations = [...prevConversations];
      
      // Tìm cuộc trò chuyện chứa tin nhắn
      const conversationIndex = updatedConversations.findIndex(
        conv => conv.conversationID && conv.conversationID.toString() === conversationId.toString()
      );
      
      if (conversationIndex !== -1) {
        // Cập nhật trạng thái đã đọc cho tin nhắn cuối cùng
        if (updatedConversations[conversationIndex].lastMessage &&
            updatedConversations[conversationIndex].lastMessage.messageID === messageId) {
          
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            lastMessage: {
              ...updatedConversations[conversationIndex].lastMessage,
              isRead: true
            }
          };
        }
      }
      
      return updatedConversations;
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await chatApi.getConversationsByCustomerId();
      console.log('Conversations loaded:', data);
      
      // Sắp xếp cuộc trò chuyện theo thời gian tin nhắn cuối cùng (mới nhất trước)
      const sortedData = [...data].sort((a, b) => {
        const dateA = a.lastMessage?.sentAt ? new Date(a.lastMessage.sentAt) : new Date(0);
        const dateB = b.lastMessage?.sentAt ? new Date(b.lastMessage.sentAt) : new Date(0);
        return dateB - dateA; // Sắp xếp giảm dần (mới nhất trước)
      });
      
      setConversations(sortedData);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Không thể tải danh sách trò chuyện');
    } finally {
      setLoading(false);
    }
  };
  
  const handleConversationPress = (conversationId, ownerId, homeStayName) => {
    navigation.navigate('ChatDetail', {
      conversationId,
      otherUser: {
        accountID: ownerId,
        name: homeStayName
      }
    });
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadConversations}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (conversations.length === 0) {
      return (
        <View style={styles.centered}>
          <Icon name="chatbubble-ellipses-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
          <Text style={styles.emptySubText}>Các cuộc trò chuyện với chủ nhà sẽ xuất hiện ở đây</Text>
        </View>
      );
    }
    
    return (
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.conversationID.toString()}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={handleConversationPress}
          />
        )}
        refreshing={loading}
        onRefresh={loadConversations}
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trò chuyện</Text>
        {connected && (
          <View style={styles.connectionIndicator}>
            <View style={styles.connectionDot} />
            <Text style={styles.connectionText}>Đang kết nối</Text>
          </View>
        )}
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  content: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  message: {
    fontSize: 14,
    color: '#777'
  },
  meta: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5
  },
  badge: {
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    padding: 10,
    backgroundColor: colors.primary,
    borderRadius: 5
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10
  },
  emptySubText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center'
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 5
  },
  connectionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500'
  }
});