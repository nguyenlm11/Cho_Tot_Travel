import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SignalRService {
  constructor() {
    this.registeredEvents = new Set();
    this.connection = null;
    this.connectionId = null;
    this.connectionPromise = null;
    this.onMessageReceivedCallbacks = [];
    this.onUserStatusChangedCallbacks = [];
    this.onNewConversationCallbacks = [];
    this.onMessageReadCallbacks = [];
    this.isConnecting = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.debug = true;
    this.baseUrl = 'https://capstone-bookinghomestay.onrender.com';
  }

  async startConnection(accessToken) {
    // Nếu đang kết nối, trả về promise hiện tại
    if (this.isConnecting && this.connectionPromise) {
      this.log("Connection already in progress, returning existing promise");
      return this.connectionPromise;
    }

    // Nếu đã kết nối, trả về connection
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      this.log("Already connected, returning existing connection");
      return Promise.resolve(this.connection);
    }

    this.isConnecting = true;
    this.log("Starting new connection attempt");

    // Tạo promise
    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        // Đóng kết nối cũ nếu có
        if (this.connection) {
          this.log("Stopping existing connection first");
          try {
            await this.connection.stop();
          } catch (err) {
            this.log("Error stopping existing connection", err);
          }
          this.connection = null;
        }

        if (!accessToken) {
          throw new Error("Access token is required");
        }

        // Tạo connection mới
        this.log("Creating new connection object");
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(`${this.baseUrl}/chatHub`, {
            accessTokenFactory: () => accessToken,
            skipNegotiation: false,
            transport: signalR.HttpTransportType.WebSockets
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000, 15000])
          .configureLogging(signalR.LogLevel.Debug)
          .build();

        // Thiết lập event handlers
        this._setupEventHandlers();

        // Bắt đầu kết nối
        this.log("Starting connection...");
        await this.connection.start();
        this.connectionId = this.connection.connectionId;
        this.log("Connection started successfully with ID:", this.connectionId);

        // Đăng ký người dùng hiện tại
        await this.registerCurrentUser();

        // Reset retry count và resolve promise
        this.retryCount = 0;
        this.isConnecting = false;

        // Thông báo trạng thái kết nối
        this.notifyConnectionStatus(true);

        resolve(this.connection);
      } catch (error) {
        this.log("Connection error:", error);
        this.retryCount++;

        if (this.retryCount < this.maxRetries) {
          this.log(`Retrying (${this.retryCount}/${this.maxRetries}) in 3 seconds...`);

          // Retry sau 3 giây
          setTimeout(() => {
            this.isConnecting = false;
            this.startConnection(accessToken)
              .then(resolve)
              .catch(reject);
          }, 3000);
        } else {
          this.log("Max retries reached");
          this.isConnecting = false;
          this.connection = null;
          this.connectionPromise = null;

          // Thông báo trạng thái kết nối
          this.notifyConnectionStatus(false);

          reject(error);
        }
      }
    });

    return this.connectionPromise;
  }

  // Đăng ký người dùng hiện tại
  async registerCurrentUser() {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      this.log("Cannot register user: not connected");
      return false;
    }

    try {
      // Thay thế localStorage bằng AsyncStorage
      const userString = await AsyncStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?.userId || user?.AccountID;
      console.log("userId", userId);

      if (!userId) {
        this.log("No user ID available for registration");
        return false;
      }

      this.log("Registering user with ID:", userId);
      await this.connection.invoke('RegisterUser', userId);
      this.log("User registration successful");
      return true;
    } catch (error) {
      this.log("User registration failed:", error);
      return false;
    }
  }

  // Đánh dấu tin nhắn đã đọc
  async markMessagesAsRead(conversationId, userId) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.error('Connection is not established');
      return false;
    }
    try {
      // Gọi đúng phương thức theo backend
      await this.connection.invoke('MarkAllMessagesAsRead', conversationId, userId);
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Đăng ký callback events
  onMessageReceived(callback) {
    // XÓA tất cả callback cũ TRƯỚC khi thêm mới
    this.onMessageReceivedCallbacks = [];
    // Thêm callback mới
    this.onMessageReceivedCallbacks.push(callback);

    return () => {
      this.onMessageReceivedCallbacks = this.onMessageReceivedCallbacks.filter(cb => cb !== callback);
    };
  }

  onUserStatusChanged(callback) {
    this.onUserStatusChangedCallbacks.push(callback);
    return () => {
      this.onUserStatusChangedCallbacks = this.onUserStatusChangedCallbacks.filter(cb => cb !== callback);
    };
  }

  // Thông báo trạng thái kết nối
  notifyConnectionStatus(isConnected) {
    this.onUserStatusChangedCallbacks.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        this.log("Error in connection status callback:", error);
      }
    });
  }

  // Thêm phương thức đăng ký lắng nghe cuộc trò chuyện mới
  onNewConversation(callback) {
    // Xóa tất cả callback cũ trước khi thêm mới
    this.onNewConversationCallbacks = [];
    // Thêm callback mới
    this.onNewConversationCallbacks.push(callback);

    return () => {
      this.onNewConversationCallbacks = this.onNewConversationCallbacks.filter(cb => cb !== callback);
    };
  }

  // Thêm phương thức đăng ký lắng nghe tin nhắn đã đọc
  onMessageRead(callback) {
    // Xóa tất cả callback cũ trước khi thêm mới
    this.onMessageReadCallbacks = [];
    // Thêm callback mới
    this.onMessageReadCallbacks.push(callback);

    return () => {
      this.onMessageReadCallbacks = this.onMessageReadCallbacks.filter(cb => cb !== callback);
    };
  }

  // Thiết lập event handlers với kiểm tra trùng lặp
  _setupEventHandlers() {
    if (!this.connection) {
      console.error('Cannot setup event handlers: connection is null');
      return;
    }

    // Đảm bảo xóa event handlers cũ trước khi đăng ký mới
    this.connection.off('ReceiveMessage');
    this.connection.off('MessageRead');
    this.connection.off('NewConversation');

    // Đăng ký sự kiện nhận tin nhắn mới
    this.connection.on('ReceiveMessage', (senderId, content, sentAt, messageId, conversationId) => {
      // Nếu tin nhắn không có ID thì bỏ qua
      if (!messageId) {
        console.log('Skipping message without ID');
        return;
      }

      // Tạo đối tượng tin nhắn
      const message = {
        senderID: senderId,
        content: content || '',
        sentAt: sentAt,
        messageID: messageId,
        conversationID: conversationId
      };

      // Gọi callback - chỉ gọi callback đầu tiên vì chỉ có một
      if (this.onMessageReceivedCallbacks.length > 0) {
        try {
          this.onMessageReceivedCallbacks[0](message);
        } catch (error) {
          console.error('Error in message callback:', error);
        }
      }
    });

    // Đăng ký sự kiện cuộc trò chuyện mới
    this.connection.on('NewConversation', (conversationData) => {
      console.log('New conversation received:', conversationData);
      
      if (this.onNewConversationCallbacks.length > 0) {
        try {
          this.onNewConversationCallbacks[0](conversationData);
        } catch (error) {
          console.error('Error in new conversation callback:', error);
        }
      }
    });

    // Đăng ký sự kiện tin nhắn đã đọc
    this.connection.on('MessageRead', (messageId, conversationId) => {
      console.log('Message marked as read:', messageId, 'in conversation:', conversationId);
      
      if (this.onMessageReadCallbacks.length > 0) {
        try {
          this.onMessageReadCallbacks[0](messageId, conversationId);
        } catch (error) {
          console.error('Error in message read callback:', error);
        }
      }
    });
  }

  // Reset all events
  resetEventHandlers() {
    if (!this.connection) return;

    // Remove all registered events
    this.registeredEvents.forEach(eventName => {
      this.connection.off(eventName);
    });
    this.registeredEvents.clear();

    // Setup again
    this._setupEventHandlers();
  }

  // Dừng kết nối
  async stopConnection() {
    if (this.connection) {
      try {
        this.log("Stopping connection");
        await this.connection.stop();
        this.log("Connection stopped");
      } catch (error) {
        this.log("Error stopping connection:", error);
      } finally {
        this.connection = null;
        this.connectionId = null;
        this.connectionPromise = null;
        this.notifyConnectionStatus(false);
      }
    }
  }

  // Log helper
  log(...args) {
    if (this.debug) {
      console.log("[SignalR]", ...args);
    }
  }

  // Lấy trạng thái kết nối hiện tại
  getConnectionState() {
    if (!this.connection) return "Disconnected";
    return this.connection.state;
  }

  // Kiểm tra kết nối
  isConnected() {
    return this.connection && this.connection.state === signalR.HubConnectionState.Connected;
  }

  async checkHubStatus() {
    try {
      // Sử dụng baseUrl thay vì hardcode URL
      const response = await fetch(`${this.baseUrl}/api/health/hub`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Hub health check failed:', error);
      return false;
    }
  }
}

// Ensure singleton
const signalRService = new SignalRService();
export default signalRService;