import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
      this.log("Current connection state:", this.connection.state);
      this.log("Current connection ID:", this.connection.connectionId);
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

        const hubUrl = `${this.baseUrl}/chatHub`;
        this.log("Creating new connection object to:", hubUrl);

        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => accessToken,
            skipNegotiation: false,
            transport: signalR.HttpTransportType.WebSockets
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000, 15000])
          .configureLogging(signalR.LogLevel.Debug)
          .build();

        this.connection.onclose((error) => {
          this.log("Connection closed", error);
          this.notifyConnectionStatus(false);
        });

        this.connection.onreconnecting((error) => {
          this.log("Reconnecting...", error);
          this.notifyConnectionStatus(false);
        });

        this.connection.onreconnected((connectionId) => {
          this.log("Reconnected with ID:", connectionId);
          this.notifyConnectionStatus(true);
        });

        this._setupEventHandlers();
        this.log("Starting connection...");

        try {
          await this.connection.start();
          this.connectionId = this.connection.connectionId;
          this.log("Connection started successfully with ID:", this.connectionId);

          try {
            this.log("Testing connection by invoking method...");
            await this.connection.invoke("TestConnection");
            this.log("Connection test successful");
          } catch (error) {
            this.log("Connection test failed:", error);
          }

          await this.registerCurrentUser();
          this.retryCount = 0;
          this.isConnecting = false;
          this.notifyConnectionStatus(true);
          resolve(this.connection);
        } catch (startError) {
          this.log("Error starting connection:", startError);
          throw startError;
        }
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
      this.log("Registering user with ID:", userId);

      if (!userId) {
        this.log("No user ID available for registration");
        return false;
      }

      await this.connection.invoke('RegisterUser', userId);
      this.log("User registration successful");
      return true;
    } catch (error) {
      this.log("User registration failed:", error);
      return false;
    }
  }

  async sendMessage(receiverId, text, homestayId) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      this.log('Connection is not established');
      return false;
    }

    try {
      const userString = await AsyncStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      const senderId = user?.userId || user?.AccountID;
      const senderName = user?.accountName || user?.userName || 'Customer';

      if (!senderId) {
        throw new Error('Sender ID is not available');
      }

      this.log('Sending message via SignalR:', { 
        senderId, 
        receiverId, 
        text, 
        senderName, 
        homestayId,
        connectionId: this.connection.connectionId,
        connectionState: this.connection.state
      });

      // Log before invoking
      this.log('Invoking SendMessage on Hub...');
      await this.connection.invoke('SendMessage', senderId, receiverId, text, senderName, homestayId, null);
      this.log('SendMessage invoked successfully');
      return true;
    } catch (error) {
      this.log('Error sending message:', error);
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
    this.log('Registering new message callback');
    this.onMessageReceivedCallbacks.push(callback);
    return () => {
      this.log('Unregistering message callback');
      this.onMessageReceivedCallbacks = this.onMessageReceivedCallbacks.filter(cb => cb !== callback);
    };
  }

  onUserStatusChanged(callback) {
    this.log('Registering new status callback');
    this.onUserStatusChangedCallbacks.push(callback);
    return () => {
      this.log('Unregistering status callback');
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
    this.log('Registering new conversation callback');
    this.onNewConversationCallbacks.push(callback);
    return () => {
      this.log('Unregistering conversation callback');
      this.onNewConversationCallbacks = this.onNewConversationCallbacks.filter(cb => cb !== callback);
    };
  }

  onMessageRead(callback) {
    this.log('Registering new message read callback');
    this.onMessageReadCallbacks.push(callback);
    return () => {
      this.log('Unregistering message read callback');
      this.onMessageReadCallbacks = this.onMessageReadCallbacks.filter(cb => cb !== callback);
    };
  }

  _setupEventHandlers() {
    if (!this.connection) {
      this.log('Cannot setup event handlers: connection is null');
      return;
    }
    this.log("Setting up event handlers");

    // Log all available hub methods
    this.log("Available hub methods:", this.connection.hubConnection?.hubProtocol?.methods);

    // Remove existing handlers
    this.connection.off('ReceiveMessage');
    this.connection.off('MessageRead');
    this.connection.off('NewConversation');

    // Add new handlers
    this.connection.on('ReceiveMessage', (senderId, content, sentAt, messageId, conversationId) => {
      this.log('Received message event from Hub:', { 
        senderId, 
        content, 
        sentAt, 
        messageId, 
        conversationId,
        connectionId: this.connection.connectionId,
        connectionState: this.connection.state
      });

      if (!messageId) {
        this.log('Skipping message without ID');
        return;
      }

      // Log raw parameters
      this.log('Raw message parameters:', {
        senderId: typeof senderId,
        content: typeof content,
        sentAt: typeof sentAt,
        messageId: typeof messageId,
        conversationId: typeof conversationId
      });

      // Convert parameters to match expected format
      const message = {
        senderID: senderId,
        content: content || '',
        sentAt: sentAt ? new Date(sentAt).toISOString() : new Date().toISOString(),
        messageID: messageId,
        conversationID: conversationId,
      };

      this.log('Processed message:', message);
      this.log('Number of registered callbacks:', this.onMessageReceivedCallbacks.length);

      // Call all registered callbacks
      this.onMessageReceivedCallbacks.forEach((callback, index) => {
        try {
          this.log(`Calling message callback ${index + 1}`);
          callback(message);
          this.log(`Message callback ${index + 1} completed`);
        } catch (error) {
          this.log(`Error in message callback ${index + 1}:`, error);
        }
      });
    });

    // Add logging for other events
    this.connection.on('NewConversation', (conversationData) => {
      this.log('New conversation received from Hub:', {
        conversationData,
        connectionId: this.connection.connectionId,
        connectionState: this.connection.state
      });
      this.log('Raw conversation data type:', typeof conversationData);
      this.onNewConversationCallbacks.forEach((callback, index) => {
        try {
          this.log(`Calling conversation callback ${index + 1}`);
          callback(conversationData);
          this.log(`Conversation callback ${index + 1} completed`);
        } catch (error) {
          this.log(`Error in conversation callback ${index + 1}:`, error);
        }
      });
    });

    this.connection.on('MessageRead', (messageId, conversationId) => {
      this.log('Message marked as read from Hub:', {
        messageId,
        conversationId,
        connectionId: this.connection.connectionId,
        connectionState: this.connection.state
      });
      this.log('Raw message read parameters:', {
        messageId: typeof messageId,
        conversationId: typeof conversationId
      });
      this.onMessageReadCallbacks.forEach((callback, index) => {
        try {
          this.log(`Calling message read callback ${index + 1}`);
          callback(messageId, conversationId);
          this.log(`Message read callback ${index + 1} completed`);
        } catch (error) {
          this.log(`Error in message read callback ${index + 1}:`, error);
        }
      });
    });

    // Add error handler
    this.connection.onreconnecting((error) => {
      this.log("Reconnecting due to error:", error);
    });

    this.connection.onclose((error) => {
      this.log("Connection closed due to error:", error);
    });

    this.log("Event handlers setup completed");
  }

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

  log(...args) {
    if (this.debug) {
      console.log("[SignalR]", ...args);
    }
  }

  isConnected() {
    const connected = this.connection && this.connection.state === signalR.HubConnectionState.Connected;
    this.log("Connection state:", this.connection?.state, "Connected:", connected);
    return connected;
  }
}

const signalRService = new SignalRService();
export default signalRService;