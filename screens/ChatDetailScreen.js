import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, Image, Alert, Modal, Dimensions, ScrollView, Animated, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/Colors';
import chatApi from '../services/api/chatApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import signalRService from '../services/signalRService';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingScreen from '../components/LoadingScreen';

export default function ChatDetailScreen({ route, navigation }) {
  const { conversationId, receiverId, homeStayId, homeStayName } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState(null);
  const [sending, setSending] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [viewImage, setViewImage] = useState(null);
  const flatListRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const messageAnimations = useRef({}).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const getUserIdFromStorage = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          setUserId(user.userId || user.AccountID);
        } else {
          setError('Không thể xác thực người dùng.');
          setLoading(false);
        }
      } catch (e) {
        setError('Lỗi xác thực người dùng.');
        setLoading(false);
      }
    };
    getUserIdFromStorage();
  }, []);

  useEffect(() => {
    const setupSignalR = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          await signalRService.startConnection(token);
          const unsubscribe = signalRService.onMessageReceived(handleNewMessage);
          setConnected(signalRService.isConnected());
          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Error setting up SignalR:', error);
      }
    };

    setupSignalR();
  }, []);

  useEffect(() => {
    if (userId && conversationId) {
      loadMessages();
    }
  }, [userId, conversationId]);

  const animateNewMessage = (index) => {
    if (!messageAnimations[index]) {
      messageAnimations[index] = new Animated.Value(0);
    }

    messageAnimations[index].setValue(0);
    Animated.timing(messageAnimations[index], {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  const handleNewMessage = (message) => {
    if (message.conversationID === conversationId ||
      message.conversationID === `${conversationId}`) {
      const existingMessage = messages.find(m => m.messageID === message.messageID);
      if (!existingMessage) {
        const newIndex = messages.length;
        // Create new message with available data
        const newMessage = {
          ...message,
          senderID: message.senderID,
          senderName: message.senderID === userId ? 'You' : homeStayName || 'Homestay',
          receiverID: message.senderID === userId ? receiverId : userId,
          content: message.content || '',
          sentAt: message.sentAt || new Date().toISOString(),
          isRead: false,
          images: []
        };

        setMessages(prevMessages => [...prevMessages, newMessage]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
          animateNewMessage(newIndex);
        }, 100);
      }
    }
  };

  const loadMessages = async () => {
    if (!userId) {
      setError("Chưa xác thực được người dùng để tải tin nhắn.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await chatApi.getMessages(conversationId);
      const sortedMessages = data.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
      setMessages(sortedMessages);

      markMessagesAsRead();
    } catch (err) {
      setError(err.message || 'Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = useCallback(async () => {
    if (!userId || !conversationId) return;

    try {
      if (homeStayId) {
        await chatApi.markAsReadWithHomeStayId(homeStayId);
      } else {
        await chatApi.markAsRead(conversationId);
      }

      if (signalRService.isConnected()) {
        await signalRService.markMessagesAsRead(conversationId, userId);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [userId, conversationId, homeStayId]);

  useEffect(() => {
    if (userId && conversationId) {
      markMessagesAsRead();
    }
  }, [userId, conversationId, markMessagesAsRead]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages]);

  const pickImages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Cần quyền truy cập', 'Bạn cần cấp quyền truy cập thư viện ảnh để thực hiện chức năng này.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1,
        aspect: [4, 3],
      });
      if (!result.canceled) {
        const formattedImages = result.assets.map((asset) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
        }));
        setSelectedImages(formattedImages);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
    }
  };

  const removeImage = (index) => {
    setSelectedImages(currentImages =>
      currentImages.filter((_, imgIndex) => imgIndex !== index)
    );
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && selectedImages.length === 0) || !userId) return;

    let tempMessageID = Date.now().toString();

    try {
      setSending(true);
      const messageText = inputText.trim();
      setInputText('');

      const imagesToSend = selectedImages.map(img => ({
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.name || `image_${Date.now()}.jpg`,
      }));

      setSelectedImages([]);
      const userString = await AsyncStorage.getItem('user');
      const user = JSON.parse(userString);
      const userID = user?.userId || user?.AccountID;
      const senderName = user.accountName || user.userName || 'Customer';

      if (!receiverId) {
        throw new Error('ReceiverID không hợp lệ');
      }
      const tempMessage = {
        messageID: tempMessageID,
        senderID: userID,
        senderName: senderName,
        receiverID: receiverId,
        content: messageText || (imagesToSend.length > 0 ? "[Hình ảnh]" : ""),
        sentAt: new Date().toISOString(),
        isRead: false,
        images: imagesToSend.map(img => img.uri)
      };

      setMessages(prevMessages => [...prevMessages, tempMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      if (!homeStayId) {
        try {
          const conversationsString = await AsyncStorage.getItem('recent_conversations');
          const conversations = conversationsString ? JSON.parse(conversationsString) : [];
          const currentConv = conversations.find(conv => conv.conversationID === conversationId);
          if (currentConv && currentConv.homeStayID) {
            const retrievedHomeStayId = currentConv.homeStayID;
            const response = await chatApi.sendMessageMultipart(
              receiverId,
              senderName,
              userID,
              retrievedHomeStayId,
              messageText,
              imagesToSend
            );

            if (response && response.messageID) {
              setMessages(prevMessages =>
                prevMessages.map(msg =>
                  msg.messageID === tempMessage.messageID
                    ? { ...msg, messageID: response.messageID }
                    : msg
                )
              );

              try {
                const lastMessage = {
                  messageID: response.messageID,
                  senderID: userID,
                  senderName: senderName,
                  receiverID: receiverId,
                  content: messageText || (imagesToSend.length > 0 ? "[Hình ảnh]" : ""),
                  sentAt: new Date().toISOString(),
                  isRead: false
                };

                const recentConvsString = await AsyncStorage.getItem('recent_conversations');
                let recentConvs = recentConvsString ? JSON.parse(recentConvsString) : [];

                const existingIndex = recentConvs.findIndex(conv =>
                  conv.conversationID === conversationId
                );

                if (existingIndex !== -1) {
                  recentConvs[existingIndex].lastMessage = lastMessage;
                  const updatedConv = recentConvs.splice(existingIndex, 1)[0];
                  recentConvs = [updatedConv, ...recentConvs];
                }

                await AsyncStorage.setItem('recent_conversations', JSON.stringify(recentConvs));
              } catch (err) {
                console.log('Error updating last message in AsyncStorage:', err);
              }
            }

            return;
          }
        } catch (err) {
          console.log('Error retrieving homeStayId from AsyncStorage:', err);
        }

        throw new Error('HomeStayID không hợp lệ');
      }

      const response = await chatApi.sendMessageMultipart(
        receiverId,
        senderName,
        userID,
        homeStayId,
        messageText,
        imagesToSend
      );

      if (response && response.messageID) {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.messageID === tempMessage.messageID
              ? { ...msg, messageID: response.messageID }
              : msg
          )
        );

        try {
          const lastMessage = {
            messageID: response.messageID,
            senderID: userID,
            senderName: senderName,
            receiverID: receiverId,
            content: messageText || (imagesToSend.length > 0 ? "[Hình ảnh]" : ""),
            sentAt: new Date().toISOString(),
            isRead: false
          };

          const recentConvsString = await AsyncStorage.getItem('recent_conversations');
          let recentConvs = recentConvsString ? JSON.parse(recentConvsString) : [];

          const existingIndex = recentConvs.findIndex(conv =>
            conv.conversationID === conversationId
          );

          if (existingIndex !== -1) {
            recentConvs[existingIndex].lastMessage = lastMessage;
            const updatedConv = recentConvs.splice(existingIndex, 1)[0];
            recentConvs = [updatedConv, ...recentConvs];
          }

          await AsyncStorage.setItem('recent_conversations', JSON.stringify(recentConvs));
        } catch (err) {
          console.log('Error updating last message in AsyncStorage:', err);
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      // Remove temporary message if send fails
      setMessages(prevMessages =>
        prevMessages.filter(msg => msg.messageID !== tempMessage.messageID)
      );
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.header}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {homeStayName || 'Trò chuyện'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {connected ? 'Đang hoạt động' : 'Đang kết nối...'}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderMessageItem = ({ item, index }) => {
    const isOwnMessage = item.senderID === userId;
    const showDate = index === 0 || !isSameDay(new Date(messages[index - 1]?.sentAt), new Date(item.sentAt));
    let messageContent = item.content;
    let imageURLs = [];
    if (messageContent && isImageURL(messageContent)) {
      imageURLs.push(messageContent);
      messageContent = '';
    }

    // Đảm bảo images là mảng và lọc ra các URI hợp lệ
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const validImages = item.images.map(img => {
        // Nếu img là object có thuộc tính uri, lấy uri
        if (img && typeof img === 'object' && img.uri) {
          return img.uri;
        }
        // Nếu img là string, dùng trực tiếp
        else if (typeof img === 'string') {
          return img;
        }
        // Trường hợp khác, trả về null
        return null;
      }).filter(uri => uri !== null); // Lọc bỏ các giá trị null

      imageURLs = [...imageURLs, ...validImages];
    }

    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.sentAt)}</Text>
          </View>
        )}
        <Animated.View style={[styles.messageRow, isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow]}>
          {!isOwnMessage && (
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={['#70A1FF', '#1E90FF']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {homeStayName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            </View>
          )}
          {isOwnMessage ? (
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={[styles.messageBubble, styles.ownMessageBubble]}
            >
              {messageContent ? (
                <Text style={[styles.messageText, styles.ownMessageText]}>{messageContent}</Text>
              ) : null}
              {imageURLs.length > 0 && (
                <View style={styles.imageContainer}>
                  {imageURLs.map((url, imgIndex) => (
                    <TouchableOpacity
                      key={`img-${imgIndex}-${item.messageID}`}
                      onPress={() => handleViewImage(url)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: typeof url === 'string' ? url : url?.uri || null }}
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.messageFooter}>
                <Text style={[styles.messageTime, styles.ownMessageTime]}>{formatTime(item.sentAt)}</Text>
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.messageBubble, styles.otherMessageBubble]}>
              {messageContent ? (
                <Text style={styles.messageText}>{messageContent}</Text>
              ) : null}
              {imageURLs.length > 0 && (
                <View style={styles.imageContainer}>
                  {imageURLs.map((url, imgIndex) => (
                    <TouchableOpacity
                      key={`img-${imgIndex}-${item.messageID}`}
                      onPress={() => handleViewImage(url)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: typeof url === 'string' ? url : url?.uri || null }}
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.messageFooter}>
                <Text style={styles.messageTime}>{formatTime(item.sentAt)}</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </>
    );
  };

  const isImageURL = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.includes('res.cloudinary.com') &&
      (url.includes('/ChatImages/') ||
        url.endsWith('.jpg') ||
        url.endsWith('.jpeg') ||
        url.endsWith('.png') ||
        url.endsWith('.gif'));
  };

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const handleViewImage = (url) => {
    // Đảm bảo url là string
    if (typeof url === 'string') {
      setViewImage(url);
    } else if (url && typeof url === 'object' && url.uri) {
      setViewImage(url.uri);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      {renderHeader()}
      <View style={styles.mainContainer}>
        {loading ? (
          <LoadingScreen
            message="Đang tải tin nhắn..."
            subMessage="Vui lòng đợi trong giây lát"
          />
        ) : error ? (
          <View style={styles.centered}>
            <Icon name="alert-circle-outline" size={70} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadMessages}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={styles.chatContainer}>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={item => item.messageID}
                contentContainerStyle={[
                  styles.messageList,
                  { flexGrow: 1, justifyContent: 'flex-end' }
                ]}
                inverted={false}
                showsVerticalScrollIndicator={false}
                initialNumToRender={20}
                maxToRenderPerBatch={10}
                windowSize={10}
                refreshing={false}
                onRefresh={loadMessages}
                onContentSizeChange={() => {
                  if (messages.length > 0) {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }
                }}
                onLayout={() => {
                  if (messages.length > 0) {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }
                }}
              />
              {selectedImages.length > 0 && (
                <View style={styles.selectedImagesContainer}>
                  <View style={styles.selectedImagesHeader}>
                    <Text style={styles.selectedImagesTitle}>
                      Hình ảnh đã chọn ({selectedImages.length})
                    </Text>
                    <TouchableOpacity
                      style={styles.clearImagesButton}
                      onPress={() => setSelectedImages([])}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.clearImagesText}>Xóa tất cả</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.selectedImagesContent}
                  >
                    {selectedImages.map((image, index) => (
                      <View key={`selected-${index}`} style={styles.selectedImageWrapper}>
                        <Image
                          source={{ uri: image.uri }}
                          style={styles.selectedImage}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                          activeOpacity={0.7}
                        >
                          <Icon name="close-circle" size={24} color="#dc3545" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={pickImages}
                  activeOpacity={0.7}
                >
                  <Icon name="image-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Nhập tin nhắn..."
                  placeholderTextColor="#8E8E93"
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() && selectedImages.length === 0 || sending) && styles.disabledSendButton
                  ]}
                  onPress={sendMessage}
                  disabled={(!inputText.trim() && selectedImages.length === 0) || sending}
                  activeOpacity={0.7}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    (!inputText.trim() && selectedImages.length === 0) ? (
                      <Icon name="send" size={22} color="#CCCCCC" />
                    ) : (
                      <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.sendButtonGradient}
                      >
                        <Icon name="send" size={22} color="#FFFFFF" />
                      </LinearGradient>
                    )
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
      <Modal
        visible={viewImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewImage(null)}
        statusBarTranslucent={true}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.closeImageButton}
            onPress={() => setViewImage(null)}
            activeOpacity={0.7}
          >
            <Icon name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {viewImage && typeof viewImage === 'string' && (
            <Image
              source={{ uri: viewImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  chatContainer: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  headerContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 5,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#212529',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  otherMessageTime: {
    color: 'rgba(0,0,0,0.5)',
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateText: {
    backgroundColor: 'rgba(108, 117, 125, 0.15)',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 5,
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    position: 'relative',
    zIndex: 1,
  },
  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 10,
    backgroundColor: '#F8F9FA',
    fontSize: 16,
    color: '#1C1C1E',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  disabledSendButton: {
    backgroundColor: '#E5E5EA',
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  selectedImagesContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  selectedImagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedImagesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  clearImagesButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  clearImagesText: {
    color: '#dc3545',
    fontWeight: '600',
    fontSize: 13,
  },
  selectedImagesContent: {
    paddingVertical: 8,
  },
  selectedImageWrapper: {
    marginRight: 12,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
    borderRadius: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageContainer: {
    flexDirection: 'column',
    marginTop: 8,
    marginBottom: 8
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa'
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});