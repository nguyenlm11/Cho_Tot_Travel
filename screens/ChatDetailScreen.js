import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, Image, Alert, Modal, Dimensions, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/Colors';
import chatApi from '../services/api/chatApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import signalRService from '../services/signalRService';
import * as ImagePicker from 'expo-image-picker';

export default function ChatDetailScreen({ route, navigation }) {
  const { conversationId, otherUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState(null);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [viewImage, setViewImage] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: otherUser?.name || 'Trò chuyện',
      headerTitleStyle: styles.headerTitle,
      headerLeft: () => (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUser]);

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
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    let messageUnsubscribe = () => { };
    let statusUnsubscribe = () => { };
    const setupSignalR = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          await signalRService.startConnection(token);
          setConnected(signalRService.isConnected());
          messageUnsubscribe = signalRService.onMessageReceived(handleNewMessage);
          statusUnsubscribe = signalRService.onUserStatusChanged((isConnected) => {
            setConnected(isConnected);
          });
          markMessagesAsRead();
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
      } catch (error) {
        console.error('Lỗi khi dọn dẹp SignalR callbacks:', error);
      }
    };
  }, [conversationId]);

  const handleNewMessage = (message) => {
    console.log('Nhận tin nhắn mới:', message);

    if (message.conversationID === conversationId ||
      message.conversationID === `${conversationId}`) {

      const existingMessage = messages.find(m => m.messageID === message.messageID);
      if (!existingMessage) {
        setMessages(prevMessages => [...prevMessages, message]);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        markMessagesAsRead();
      }
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatApi.getMessages(conversationId);
      console.log('Tin nhắn đã tải:', data);
      const sortedMessages = data.sort((a, b) =>
        new Date(a.sentAt) - new Date(b.sentAt)
      );
      setMessages(sortedMessages);
    } catch (err) {
      console.error('Lỗi khi tải tin nhắn:', err);
      setError(err.message || 'Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!userId || !conversationId) return;

    try {
      await chatApi.markAsRead(conversationId);

      if (signalRService.isConnected()) {
        await signalRService.markMessagesAsRead(conversationId, userId);
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
    }
  };

  const pickImages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Cần quyền truy cập', 'Bạn cần cấp quyền truy cập thư viện ảnh để thực hiện chức năng này.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      console.error('Error picking images:', error);
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

    try {
      setSending(true);
      const messageText = inputText.trim();
      setInputText('');
      
      // Lưu trữ hình ảnh đã chọn và xóa state
      const imagesToSend = [...selectedImages];
      setSelectedImages([]);

      // Tạo message tạm thời với ID tạm
      const tempMessageId = `temp-${Date.now()}`;
      const now = new Date();
      const tempMessage = {
        messageID: tempMessageId,
        senderID: userId,
        receiverID: otherUser.accountID,
        content: messageText,
        sentAt: now.toISOString(),
        isRead: false,
        isSending: true,
        images: imagesToSend.map(img => img.uri) // Thêm hình ảnh tạm thời
      };

      // Thêm tin nhắn tạm vào state
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      // Scroll đến tin nhắn mới
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Lấy thông tin user để gửi
      const userString = await AsyncStorage.getItem('user');
      const user = JSON.parse(userString);
      const senderName = user.accountName || user.userName || 'Customer';
      const homeStayId = route.params.homeStayId || 1;
      
      // Gửi tin nhắn lên server
      const result = await chatApi.sendMessageMultipart(
        otherUser.accountID,
        senderName,
        userId,
        homeStayId,
        messageText,
        imagesToSend
      );
      
      console.log('Kết quả gửi tin nhắn:', result);
      
      // Cập nhật tin nhắn sau khi gửi thành công
      if (result) {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.messageID === tempMessageId
              ? { ...result, isSending: false }
              : msg
          )
        );
      }
   
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.messageID.startsWith('temp-')
            ? { ...msg, error: true }
            : msg
        )
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

  const renderMessageItem = ({ item, index }) => {
    const isOwnMessage = item.senderID === userId;
    const showDate = index === 0 || !isSameDay(new Date(messages[index - 1]?.sentAt), new Date(item.sentAt));

    // Xử lý nội dung tin nhắn và hình ảnh
    let messageContent = item.content;
    let imageURLs = [];

    // Kiểm tra và xử lý các URL hình ảnh
    if (messageContent && isImageURL(messageContent)) {
      imageURLs.push(messageContent);
      messageContent = ''; // Không hiển thị URL dưới dạng text
    }

    // Kiểm tra nếu có mảng images
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      imageURLs = [...imageURLs, ...item.images];
    }

    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.sentAt)}</Text>
          </View>
        )}
        <View style={[
          styles.messageRow,
          isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow
        ]}>
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            item.error && styles.errorMessage
          ]}>
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
                      source={{ uri: url }} 
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <View style={styles.messageFooter}>
              <Text style={styles.messageTime}>{formatTime(item.sentAt)}</Text>
              {isOwnMessage && item.isRead && (
                <Icon name="checkmark-done" size={16} color="#4FC3F7" style={styles.readIcon} />
              )}
              {isOwnMessage && item.isSending && (
                <Icon name="time-outline" size={16} color="#999" style={styles.readIcon} />
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  // Hàm kiểm tra xem một string có phải là URL hình ảnh từ Cloudinary không
  const isImageURL = (url) => {
    if (!url || typeof url !== 'string') return false;
    
    return url.includes('res.cloudinary.com') && 
           (url.includes('/ChatImages/') || 
            url.endsWith('.jpg') || 
            url.endsWith('.jpeg') || 
            url.endsWith('.png') || 
            url.endsWith('.gif'));
  };

  // Hàm xử lý khi người dùng nhấn vào hình ảnh
  const handleViewImage = (imageUrl) => {
    setViewImage(imageUrl);
  };

  // Hàm đóng modal xem hình ảnh
  const closeImageViewer = () => {
    setViewImage(null);
  };

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMessages}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {connected && (
            <View style={styles.connectionStatus}>
              <View style={styles.connectionDot} />
              <Text style={styles.connectionText}>Đang kết nối</Text>
            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={item => item.messageID}
            contentContainerStyle={styles.messageList}
            inverted={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
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
                    >
                      <Icon name="close-circle" size={24} color="#FF6B6B" />
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
            >
              <Icon name="image-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập tin nhắn..."
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
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="send" size={24} color={(inputText.trim() || selectedImages.length > 0) ? '#fff' : '#ccc'} />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Modal xem hình ảnh full-screen */}
          <Modal
            visible={viewImage !== null}
            transparent={true}
            animationType="fade"
            onRequestClose={closeImageViewer}
          >
            <View style={styles.imageViewerContainer}>
              <TouchableOpacity
                style={styles.closeImageButton}
                onPress={closeImageViewer}
              >
                <Icon name="close-circle" size={32} color="#fff" />
              </TouchableOpacity>
              
              {viewImage && (
                <Image
                  source={{ uri: viewImage }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Modal>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
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
    color: colors.textSecondary
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text
  },
  backButton: {
    marginLeft: 10
  },
  messageList: {
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  messageRow: {
    marginVertical: 5,
    flexDirection: 'row'
  },
  ownMessageRow: {
    justifyContent: 'flex-end'
  },
  otherMessageRow: {
    justifyContent: 'flex-start'
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    elevation: 1
  },
  ownMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4
  },
  errorMessage: {
    backgroundColor: '#ffebee'
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4
  },
  messageTime: {
    fontSize: 11,
    color: '#777',
    marginRight: 4
  },
  readIcon: {
    marginLeft: 2
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 10
  },
  dateText: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 12,
    color: '#555'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#f9f9f9'
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  disabledSendButton: {
    backgroundColor: '#e0e0e0'
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginRight: 5
  },
  connectionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text
  },
  imageContainer: {
    flexDirection: 'column',
    marginTop: 5,
    marginBottom: 5
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5
  },
  selectedImagesContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  selectedImagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  selectedImagesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text
  },
  clearImagesButton: {
    padding: 5,
    backgroundColor: colors.primary,
    borderRadius: 5
  },
  clearImagesText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  selectedImagesContent: {
    paddingVertical: 5
  },
  selectedImageWrapper: {
    marginRight: 10,
    position: 'relative'
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 5
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12
  },
  attachButton: {
    padding: 10
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeImageButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8
  }
});