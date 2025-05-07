import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, Image, Alert, Modal, Dimensions, ScrollView, Animated, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/Colors';
import chatApi from '../services/api/chatApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import signalRService from '../services/signalRService';

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
    let messageUnsubscribe = () => { };
    let statusUnsubscribe = () => { };
    const setupSignalR = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          await signalRService.startConnection(token);
          setConnected(signalRService.isConnected());
          messageUnsubscribe = signalRService.onMessageReceived(handleNewMessage);
          // markMessagesAsRead();
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
        setMessages(prevMessages => [...prevMessages, message]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
          animateNewMessage(newIndex);
        }, 100);
        // markMessagesAsRead();
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
    } catch (err) {
      setError(err.message || 'Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

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
    try {
      setSending(true);
      const messageText = inputText.trim();
      setInputText('');
      const imagesToSend = [...selectedImages];
      setSelectedImages([]);
      const userString = await AsyncStorage.getItem('user');
      const user = JSON.parse(userString);
      const userID = user?.userId || user?.AccountID;
      const senderName = user.accountName || user.userName || 'Customer';
      await chatApi.sendMessageMultipart(
        receiverId,
        senderName,
        userID,
        homeStayId,
        messageText,
        imagesToSend
      );
      // loadMessages();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
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
    <View style={styles.customHeader}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {homeStayName || 'Trò chuyện'}
        </Text>
      </View>
    </View>
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
        <View style={[styles.messageRow, isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow]}>
          {!isOwnMessage && (
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {homeStayName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={[styles.messageBubble, isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble]}>
            {messageContent ? (
              <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>{messageContent}</Text>
            ) : null}
            {imageURLs.length > 0 && (
              <View style={styles.imageContainer}>
                {imageURLs.map((url, imgIndex) => (
                  <TouchableOpacity key={`img-${imgIndex}-${item.messageID}`} onPress={() => setViewImage(url)} activeOpacity={0.9}>
                    <Image source={{ uri: url }} style={styles.messageImage} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>{formatTime(item.sentAt)}</Text>
            </View>
          </View>
        </View>
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

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
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
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={item => item.messageID}
              contentContainerStyle={styles.messageList}
              inverted={false}
              showsVerticalScrollIndicator={false}
              initialNumToRender={20}
              maxToRenderPerBatch={10}
              windowSize={10}
              refreshing={false}
              onRefresh={loadMessages}
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
                placeholderTextColor="#6c757d"
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
                  <Icon name="send" size={22} color={(inputText.trim() || selectedImages.length > 0) ? '#fff' : '#ccc'} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
      <Modal
        visible={viewImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewImage(null)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.closeImageButton}
            onPress={() => setViewImage(null)}
            activeOpacity={0.7}
          >
            <Icon name="close" size={28} color="#fff" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
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
    color: '#6c757d',
    fontWeight: '500'
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20
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
    elevation: 3
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
    elevation: 5
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 6
  },
  headerInfo: {
    flexDirection: 'column',
    flex: 1,
    marginLeft: 6
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row'
  },
  otherMessageRow: {
    justifyContent: 'flex-start'
  },
  ownMessageRow: {
    justifyContent: 'flex-end'
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  ownMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 5
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5
  },
  errorMessage: {
    backgroundColor: '#ffe3e6'
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22
  },
  ownMessageText: {
    color: '#fff'
  },
  otherMessageText: {
    color: '#212529'
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.8)'
  },
  otherMessageTime: {
    color: 'rgba(0,0,0,0.5)'
  },
  readIcon: { marginLeft: 2 },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 12
  },
  dateText: {
    backgroundColor: 'rgba(108, 117, 125, 0.15)',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 5,
    fontSize: 13,
    color: '#495057',
    fontWeight: '500'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3
  },
  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 10,
    backgroundColor: '#f8f9fa',
    fontSize: 16
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  disabledSendButton: {
    backgroundColor: '#e9ecef'
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight || '#e9f7ef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057'
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
  selectedImagesContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef'
  },
  selectedImagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  selectedImagesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057'
  },
  clearImagesButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  clearImagesText: {
    color: '#dc3545',
    fontWeight: '600',
    fontSize: 13
  },
  selectedImagesContent: { paddingVertical: 8 },
  selectedImageWrapper: {
    marginRight: 12,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  selectedImage: {
    width: 90,
    height: 90,
    borderRadius: 8
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
    elevation: 2
  },
  attachButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: 5
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
    borderRadius: 10
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeImageButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8
  },
});