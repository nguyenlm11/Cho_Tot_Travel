import apiClient, { handleAuthError } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const saveAuthData = async (data) => {
  if (!data) return null;

  try {
    if (data.token || data['access-token']) {
      const accessToken = data.token || data['access-token'];
      await AsyncStorage.setItem('token', accessToken);
      console.log('Token saved successfully:', accessToken.substring(0, 10) + '...');
    }

    if (data.refreshToken || data['refresh-token']) {
      const refreshToken = data.refreshToken || data['refresh-token'];
      await AsyncStorage.setItem('refreshToken', refreshToken);
      console.log('Refresh token saved successfully');
    }

    try {
      const token = data.token || data['access-token'];
      const userInfo = token ? getUserFromToken(token) : {};

      const normalizedData = {
        ...data,
        token: data.token || data['access-token'],
        refreshToken: data.refreshToken || data['refresh-token']
      };

      delete normalizedData['access-token'];
      delete normalizedData['refresh-token'];

      const userData = {
        ...normalizedData,
        ...userInfo
      };

      const userDataString = JSON.stringify(userData);
      await AsyncStorage.setItem('user', userDataString);
      console.log('User data saved successfully, length:', userDataString.length);
      
      if (userInfo.userId) {
        await AsyncStorage.setItem('userId', userInfo.userId.toString());
      }
      
      return userData;
    } catch (error) {
      console.error('Error saving user data:', error);
      const userDataString = JSON.stringify(data);
      await AsyncStorage.setItem('user', userDataString);
      return data;
    }
  } catch (error) {
    console.error('Critical error saving auth data:', error);
    return data;
  }
};

const getUserFromToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    return {
      userId: decoded.AccountID,
      email: decoded.email,
      username: decoded.given_name,
      role: decoded.role,
      exp: decoded.exp
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return {};
  }
};

const validateCustomerRole = (userData) => {
  if (!userData || userData.role !== 'Customer') {
    throw new Error('Tài khoản không có quyền truy cập. Chỉ khách hàng mới được phép đăng nhập.');
  }
};

const authApi = {
  register: async (userData) => {
    try {
      const response = await apiClient.post('/api/account/register-Customer', userData);
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  confirmAccount: async (email, code) => {
    try {
      const response = await apiClient.post(`/api/account/confirmation/${email}/${code}`);
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  resendOTP: async (email) => {
    try {
      const response = await apiClient.post(`/api/account/resend-otp/${email}`);
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/account/login', credentials);
      const token = response.data.token || response.data['access-token'];
      if (token) {
        const userData = getUserFromToken(token);
        validateCustomerRole(userData);
      }
      await saveAuthData(response.data);
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  refreshToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (!token || !refreshToken) {
        throw new Error('Không có token để làm mới');
      }

      const response = await apiClient.post('/api/account/resetToken', {
        accessToken: token,
        refreshToken
      });

      const userData = await saveAuthData(response.data);
      return userData;
    } catch (error) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      throw new Error(handleAuthError(error));
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/api/account/Reset-Password-Token', { email });
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  resetPassword: async (resetData) => {
    try {
      const response = await apiClient.post('/api/account/Reset-Password', resetData);
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  changePassword: async (changeData) => {
    try {
      const response = await apiClient.post('/api/account/change-password', changeData);
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Checking auth, token exists:', !!token);
      
      if (!token) {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          console.log('Found userId, attempting to refresh session');
          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              await authApi.refreshToken();
              return true;
            }
          } catch (refreshError) {
            console.error('Failed to refresh token from userId:', refreshError);
            await AsyncStorage.removeItem('userId');
          }
        }
        return false;
      }

      try {
        const decoded = getUserFromToken(token);
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.log('Token expired, trying to refresh');
          try {
            await authApi.refreshToken();
            return true;
          } catch (refreshError) {
            console.error('Error refreshing token:', refreshError);
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('userId');
            return false;
          }
        }
        return true;
      } catch (tokenError) {
        console.error('Error decoding token:', tokenError);
        try {
          await authApi.refreshToken();
          return true;
        } catch (refreshError) {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('userId');
          return false;
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      return false;
    }
  },

  logout: async () => {
    try {
      const keysToRemove = [
        'token', 
        'refreshToken', 
        'user', 
        'userId',
      ];
      
      const results = await Promise.all(
        keysToRemove.map(async (key) => {
          try {
            await AsyncStorage.removeItem(key);
            console.log(`Successfully removed ${key} from storage`);
            return { key, success: true };
          } catch (error) {
            console.error(`Error removing ${key}:`, error);
            return { key, success: false, error };
          }
        })
      );
      
      const allSuccessful = results.every(result => result.success);
      if (!allSuccessful) {
        console.warn('Some items could not be removed during logout', 
          results.filter(r => !r.success).map(r => r.key));
      }
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      throw new Error('Có lỗi xảy ra khi đăng xuất');
    }
  },

  getUserInfo: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Có lỗi xảy ra khi lấy thông tin người dùng');
    }
  },

  updateUserInfo: async (userData) => {
    try {
      if (!userData.userId) {
        throw new Error('Thiếu userId để cập nhật thông tin người dùng');
      }
      const { userId, ...updateData } = userData;

      const response = await apiClient.put(`/api/account/Update-Account?userId=${userId}`, {
        userName: updateData.username,
        email: updateData.email,
        name: updateData.name,
        address: updateData.address,
        phone: updateData.phone,
        role: updateData.role
      });

      const currentUserData = await AsyncStorage.getItem('user');
      if (currentUserData) {
        const parsedUserData = JSON.parse(currentUserData);
        const updatedUserData = {
          ...parsedUserData,
          ...updateData,
          userId
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
      }
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

};

export default authApi; 