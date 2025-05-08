import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, StatusBar, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import chatApi from '../services/api/chatApi';
import signalRService from '../services/signalRService';
import { colors } from '../constants/Colors';
import LoadingScreen from '../components/LoadingScreen';

const ChatScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUserId(user?.userId || user?.AccountID);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };
    getUserData();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatApi.getConversationsByCustomerId();
      try {
        const recentConvsString = await AsyncStorage.getItem('recent_conversations');
        const recentConvs = recentConvsString ? JSON.parse(recentConvsString) : [];
        const combinedData = [...data];
        recentConvs.forEach(recentConv => {
          const exists = combinedData.some(conv =>
            conv.conversationID === recentConv.conversationID
          );
          if (!exists) {
            combinedData.push(recentConv);
          }
        });
        const sortedData = [...combinedData].sort((a, b) => {
          const dateA = a.lastMessage?.sentAt ? new Date(a.lastMessage.sentAt) : new Date(0);
          const dateB = b.lastMessage?.sentAt ? new Date(b.lastMessage.sentAt) : new Date(0);
          return dateB - dateA;
        });
        setConversations(sortedData);
        await AsyncStorage.removeItem('recent_conversations');
      } catch (err) {
        const sortedData = [...data].sort((a, b) => {
          const dateA = a.lastMessage?.sentAt ? new Date(a.lastMessage.sentAt) : new Date(0);
          const dateB = b.lastMessage?.sentAt ? new Date(b.lastMessage.sentAt) : new Date(0);
          return dateB - dateA;
        });
        setConversations(sortedData);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách trò chuyện:', err);
      setError(err.message || 'Không thể tải danh sách trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadConversations);
    const connectSignalR = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (!userString) return;
        const user = JSON.parse(userString);
        const userId = user?.userId || user?.AccountID;
        if (!userId) return;
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('Token not found for SignalR connection');
          return;
        }
        await signalRService.startConnection(token);
        signalRService.onMessageReceived((message) => {
          setConversations(prevConversations => {
            const conversationIndex = prevConversations.findIndex(
              conv => conv.conversationID === message.conversationID
            );
            if (conversationIndex !== -1) {
              const updatedConversations = [...prevConversations];
              updatedConversations[conversationIndex] = {
                ...updatedConversations[conversationIndex],
                lastMessage: {
                  messageID: message.messageID,
                  senderID: message.senderID,
                  senderName: message.senderName,
                  receiverID: message.receiverID,
                  content: message.content,
                  sentAt: message.sentAt,
                  isRead: false
                }
              };
              const updatedConv = updatedConversations.splice(conversationIndex, 1)[0];
              return [updatedConv, ...updatedConversations];
            }

            loadConversations();
            return prevConversations;
          });
        });
      } catch (error) {
        console.error('Error connecting SignalR:', error);
      }
    };
    connectSignalR();
    return () => {
      unsubscribe();
    };
  }, [navigation]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      }
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Hôm qua';
      }
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  const navigateToChat = (conversation) => {
    if (conversation.lastMessage && !conversation.lastMessage.isRead &&
      conversation.lastMessage.receiverID === userId) {
      try {
        if (conversation.homeStayID) {
          chatApi.markAsReadWithHomeStayId(conversation.homeStayID);
        } else {
          chatApi.markAsRead(conversation.conversationID);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }

    navigation.navigate('ChatDetail', {
      conversationId: conversation.conversationID,
      receiverId: conversation.staff?.staffIdAccount,
      receiverName: conversation.staff?.staffName || 'Staff',
      homeStayId: conversation.homeStayID,
      homeStayName: conversation.homeStayName
    });
  };

  const getAvatarColor = (name) => {
    const colors = [
      ['#FF6B81', '#FF4757'], // Red gradient
      ['#70A1FF', '#1E90FF'], // Blue gradient
      ['#7BED9F', '#2ED573'], // Green gradient
      ['#FFA502', '#FF7F50'], // Orange gradient
      ['#9B59B6', '#8E44AD'], // Purple gradient
      ['#1ABC9C', '#16A085'], // Teal gradient
      ['#FFC312', '#F79F1F'], // Yellow gradient
      ['#A3CB38', '#C4E538']  // Lime gradient
    ];

    // Create a simple hash from the name
    let hash = 0;
    if (name && name.length > 0) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }

    // Use the hash to pick a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conversation => {
    const homestayName = conversation.homeStayName?.toLowerCase() || '';
    const staffName = conversation.staff?.staffName?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return homestayName.includes(query) || staffName.includes(query);
  });

  const renderItem = ({ item, index }) => {
    const isUnread = item.lastMessage && !item.lastMessage.isRead &&
      item.lastMessage.receiverID === userId;

    const [startColor, endColor] = getAvatarColor(item.homeStayName);
    const firstLetter = (item.homeStayName || 'H').charAt(0).toUpperCase();
    const isOnline = index % 3 === 0;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigateToChat(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={[startColor, endColor]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{firstLetter}</Text>
          </LinearGradient>
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.conversationName, isUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {item.homeStayName || 'Homestay'}
            </Text>
            <Text style={styles.timestamp}>
              {item.lastMessage?.sentAt ? formatDate(item.lastMessage.sentAt) : ''}
            </Text>
          </View>

          <View style={styles.messagePreviewWrapper}>
            <Text style={[styles.messagePreview, isUnread && styles.unreadText]} numberOfLines={1}>
              {item.lastMessage
                ? item.lastMessage.content || 'Hình ảnh'
                : 'Bắt đầu trò chuyện...'}
            </Text>

            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>●</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          <Text style={styles.headerSubtitle}>Trò chuyện với nhân viên Homestay</Text>
        </View>
      </LinearGradient>

      <View style={styles.filterTabsContainer}>
        <View style={styles.tabScrollContainer}>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm tin nhắn..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {loading && !refreshing ? (
        <LoadingScreen
          message="Đang tải tin nhắn..."
          subMessage="Vui lòng đợi trong giây lát"
        />
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="chat-alert-outline" size={60} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadConversations}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : filteredConversations.length === 0 && !searchQuery ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#6FB1FC', colors.primary]}
            style={styles.emptyIconCircle}
          >
            <MaterialCommunityIcons name="chat-processing-outline" size={80} color="white" />
          </LinearGradient>
          <Text style={styles.emptyText}>
            Tin nhắn mới sẽ hiển thị ở đây
          </Text>
          <Text style={styles.emptySubText}>
            Trò chuyện với nhân viên homestay để đặt chỗ nhanh chóng
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Home')}
          >
            <LinearGradient
              colors={[colors.primary, '#3367FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreButtonGradient}
            >
              <Text style={styles.exploreButtonText}>Khám phá Homestay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : filteredConversations.length === 0 && searchQuery ? (
        <View style={styles.emptySearchContainer}>
          <Ionicons name="search-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptySearchText}>
            Không tìm thấy kết quả nào cho "{searchQuery}"
          </Text>
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>Xóa tìm kiếm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.conversationID.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerContent: {
    width: '100%',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  filterTabsContainer: {
    paddingHorizontal: 16,
  },
  tabScrollContainer: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    flex: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1C1C1E',
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 12,
    paddingRight: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  conversationName: {
    fontSize: 17,
    color: '#000',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
  },
  messagePreviewWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagePreview: {
    fontSize: 16,
    color: '#8E8E93',
    flex: 1,
  },
  staffName: {
    fontWeight: '500',
  },
  unreadText: {
    fontWeight: '700',
    color: '#000',
  },
  unreadBadge: {
    marginLeft: 6,
  },
  unreadBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 17,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  exploreButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  exploreButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptySearchText: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  clearSearchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  clearSearchText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ChatScreen;