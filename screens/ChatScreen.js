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
  const { conversationID, homeStayName, staffID, staffName, lastMessage } = conversation;
  
  return (
    <TouchableOpacity 
      style={styles.conversationItem} 
      onPress={() => onPress(conversationID, staffID, staffName, homeStayName)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {staffName?.charAt(0) || homeStayName?.charAt(0) || '?'}
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {staffName ? `${staffName} - ${homeStayName}` : homeStayName || 'Không xác định'}
        </Text>
        <Text style={styles.message} numberOfLines={1}>
          {lastMessage ? lastMessage.content : 'Chưa có tin nhắn'}
        </Text>
      </View>
      
      <View style={styles.meta}>
        {lastMessage && lastMessage.sentAt && (
          <Text style={styles.time}>{formatDate(lastMessage.sentAt)}</Text>
        )}
        
        {lastMessage && !lastMessage.isRead && lastMessage.receiverID === staffID && (
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
        const updatedConversations = [...prevConversations];
        
        updatedConversations[conversationIndex] = {
          ...updatedConversations[conversationIndex],
          lastMessage: {
            ...message,
            isRead: message.senderID === userId
          }
        };

        if (conversationIndex > 0) {
          const conversationToMove = updatedConversations.splice(conversationIndex, 1)[0];
          updatedConversations.unshift(conversationToMove);
        }

        return updatedConversations;
      } else {
        if (message.conversationID && message.senderID && message.senderID !== userId) {
          const newConversation = {
            conversationID: message.conversationID,
            homeStayName: message.homeStayName || 'Homestay',
            staffID: message.senderID,
            staffName: message.senderName || 'Nhân viên',
            lastMessage: {
              ...message,
              isRead: false
            }
          };
          
          return [newConversation, ...prevConversations];
        }
        
        loadConversations();
        return prevConversations;
      }
    });
  }, [userId]);

  const handleMessageRead = useCallback((messageId, conversationId) => {
    console.log('Tin nhắn đã được đọc:', messageId, 'trong cuộc trò chuyện:', conversationId);
    
    if (!conversationId) return;
    
    setConversations(prevConversations => {
      const updatedConversations = [...prevConversations];
      
      const conversationIndex = updatedConversations.findIndex(
        conv => conv.conversationID && conv.conversationID.toString() === conversationId.toString()
      );
      
      if (conversationIndex !== -1) {
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
      
      const sortedData = [...data].sort((a, b) => {
        const dateA = a.lastMessage?.sentAt ? new Date(a.lastMessage.sentAt) : new Date(0);
        const dateB = b.lastMessage?.sentAt ? new Date(b.lastMessage.sentAt) : new Date(0);
        return dateB - dateA;
      });
      
      setConversations(sortedData);
    } catch (err) {
      console.error('Lỗi khi tải danh sách trò chuyện:', err);
      setError(err.message || 'Không thể tải danh sách trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const handleConversationPress = (conversationId, staffId, staffName, homeStayName) => {
    console.log(conversationId, staffId, staffName, homeStayName);
    navigation.navigate('ChatDetail', {
      conversationId,
      receiverId: staffId,
      receiverName: staffName,
      homeStayName
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách trò chuyện...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Icon name="alert-circle-outline" size={70} color="#dc3545" />
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
          <Icon name="chatbubble-ellipses-outline" size={70} color="#6c757d" />
          <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={handleConversationPress}
          />
        )}
        keyExtractor={item => item.conversationID.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    padding: 16,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d'
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 10
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 25
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  },
  listContent: {
    paddingVertical: 8
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight || '#e9f7ef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057'
  },
  content: {
    flex: 1,
    justifyContent: 'center'
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4
  },
  message: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2
  },
  meta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 60
  },
  time: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  }
});