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
    if (this.isConnecting && this.connectionPromise) {
      this.log("Connection already in progress, returning existing promise");
      return this.connectionPromise;
    }

    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      this.log("Already connected, returning existing connection");
      return Promise.resolve(this.connection);
    }
    this.isConnecting = true;
    this.log("Starting new connection attempt");
    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
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
        this._setupEventHandlers();
        this.log("Starting connection...");
        await this.connection.start();
        this.connectionId = this.connection.connectionId;
        this.log("Connection started successfully with ID:", this.connectionId);
        await this.registerCurrentUser();
        this.retryCount = 0;
        this.isConnecting = false;
        this.notifyConnectionStatus(true);
        resolve(this.connection);
      } catch (error) {
        this.log("Connection error:", error);
        this.retryCount++;
        if (this.retryCount < this.maxRetries) {
          this.log(`Retrying (${this.retryCount}/${this.maxRetries}) in 3 seconds...`);
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
          this.notifyConnectionStatus(false)
          reject(error);
        }
      }
    });
    return this.connectionPromise;
  }

  async registerCurrentUser() {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      this.log("Cannot register user: not connected");
      return false;
    }

    try {
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

  async markMessagesAsRead(conversationId, userId) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.error('Connection is not established');
      return false;
    }
    try {
      await this.connection.invoke('MarkAllMessagesAsRead', conversationId, userId);
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  onMessageReceived(callback) {
    this.onMessageReceivedCallbacks = [];
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

  notifyConnectionStatus(isConnected) {
    this.onUserStatusChangedCallbacks.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        this.log("Error in connection status callback:", error);
      }
    });
  }

  onNewConversation(callback) {
    this.onNewConversationCallbacks = [];
    this.onNewConversationCallbacks.push(callback);
    return () => {
      this.onNewConversationCallbacks = this.onNewConversationCallbacks.filter(cb => cb !== callback);
    };
  }

  onMessageRead(callback) {
    this.onMessageReadCallbacks = [];
    this.onMessageReadCallbacks.push(callback);
    return () => {
      this.onMessageReadCallbacks = this.onMessageReadCallbacks.filter(cb => cb !== callback);
    };
  }

  _setupEventHandlers() {
    if (!this.connection) {
      console.error('Cannot setup event handlers: connection is null');
      return;
    }
    this.connection.off('ReceiveMessage');
    this.connection.off('MessageRead');
    this.connection.off('NewConversation');
    this.connection.on('ReceiveMessage', (senderId, content, sentAt, messageId, conversationId) => {
      if (!messageId) {
        console.log('Skipping message without ID');
        return;
      }
      const message = {
        senderID: senderId,
        content: content || '',
        sentAt: sentAt,
        messageID: messageId,
        conversationID: conversationId
      };

      if (this.onMessageReceivedCallbacks.length > 0) {
        try {
          this.onMessageReceivedCallbacks[0](message);
        } catch (error) {
          console.error('Error in message callback:', error);
        }
      }
    });

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

  log(...args) {
    if (this.debug) {
      console.log("[SignalR]", ...args);
    }
  }

  isConnected() {
    return this.connection && this.connection.state === signalR.HubConnectionState.Connected;
  }
}

const signalRService = new SignalRService();
export default signalRService;