import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/Colors';
import chatApi from '../services/api/chatApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import signalR from '@microsoft/signalr';
import signalRService from '../services/signalRService';

export default function ChatDetailScreen({ route, navigation }) {
    const { conversationId, otherUser } = route.params;
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inputText, setInputText] = useState('');
    const [userId, setUserId] = useState(null);
    const [sending, setSending] = useState(false);
    const [connected, setConnected] = useState(false);
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
        let messageUnsubscribe = () => {};
        let statusUnsubscribe = () => {};
        const setupSignalR = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    await signalRService.startConnection(token);
                    setConnected(signalRService.isConnected());
                    // await registerUser();
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

    const sendMessage = async () => {
        if (!inputText.trim() || !userId) return;
        
        try {
            setSending(true);
            const messageText = inputText.trim();
            setInputText('');
            
            const tempMessage = {
                messageID: `temp-${Date.now()}`,
                senderID: userId,
                senderName: 'Customer',
                receiverID: otherUser.accountID,
                content: messageText,
                sentAt: new Date().toISOString(),
                isRead: false,
                isSending: true
            };
            
            setMessages(prevMessages => [...prevMessages, tempMessage]);
            
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
            
            if (signalRService.isConnected()) {
                try {
                    await signalRService.connection.invoke(
                        'SendMessageToOwner',
                        conversationId,
                        messageText
                    );
                    console.log('Đã gửi tin nhắn qua SignalR');
                } catch (signalRError) {
                    console.error('Lỗi khi gửi tin nhắn qua SignalR:', signalRError);
                    await chatApi.sendMessage(conversationId, messageText);
                }
            } else {
                await chatApi.sendMessage(conversationId, messageText);
            }
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg.messageID.toString().startsWith('temp-') 
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
                        <Text style={styles.messageText}>{item.content}</Text>
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
                        keyExtractor={item => item.messageID.toString()}
                        contentContainerStyle={styles.messageList}
                        inverted={false}
                        onContentSizeChange={() => 
                            flatListRef.current?.scrollToEnd({ animated: false })
                        }
                    />
                    
                    <View style={styles.inputContainer}>
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
                                (!inputText.trim() || sending) && styles.disabledSendButton
                            ]}
                            onPress={sendMessage}
                            disabled={!inputText.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Icon name="send" size={24} color={inputText.trim() ? '#fff' : '#ccc'} />
                            )}
                        </TouchableOpacity>
                    </View>
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
    }
});
