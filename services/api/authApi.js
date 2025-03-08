import apiClient, { handleAuthError } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

// Hàm tiện ích để lưu thông tin xác thực
const saveAuthData = async (data) => {
  if (!data) return null;
  
  // Lưu token - hỗ trợ cả hai cách đặt tên token
  if (data.token || data['access-token']) {
    const accessToken = data.token || data['access-token'];
    await AsyncStorage.setItem('token', accessToken);
  }
  
  // Lưu refresh token - hỗ trợ cả hai cách đặt tên
  if (data.refreshToken || data['refresh-token']) {
    const refreshToken = data.refreshToken || data['refresh-token'];
    await AsyncStorage.setItem('refreshToken', refreshToken);
  }
  
  // Lưu thông tin người dùng
  try {
    // Lấy token để giải mã
    const token = data.token || data['access-token'];
    
    // Giải mã JWT để lấy thông tin
    const userInfo = token ? getUserFromToken(token) : {};
    
    // Chuẩn hóa dữ liệu để đảm bảo tính nhất quán
    const normalizedData = {
      ...data,
      token: data.token || data['access-token'],
      refreshToken: data.refreshToken || data['refresh-token']
    };
    
    // Xóa các key không cần thiết
    delete normalizedData['access-token'];
    delete normalizedData['refresh-token'];
    
    // Kết hợp thông tin từ response và token
    const userData = {
      ...normalizedData,
      ...userInfo
    };
    
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Error saving user data:', error);
    await AsyncStorage.setItem('user', JSON.stringify(data));
    return data;
  }
};

// Lấy thông tin người dùng từ token
const getUserFromToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    return {
      email: decoded.email,
      username: decoded.sub || decoded.username,
      role: decoded.role,
      exp: decoded.exp
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return {};
  }
};

const authApi = {
  // Đăng ký tài khoản
  register: async (userData) => {
    try {
      const response = await apiClient.post('/api/account/register-Customer', userData);
      
      // Kiểm tra xem response có chứa token không
      if (response.data && (response.data.token || response.data['access-token'])) {
        // Nếu có token, lưu ngay lập tức
        await saveAuthData(response.data);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  // Xác nhận tài khoản bằng OTP
  confirmAccount: async (email, code) => {
    try {
      const response = await apiClient.post(`/api/account/confirmation/${email}/${code}`);
      
      // Lấy dữ liệu đăng ký tạm thời nếu có
      const tempRegistrationData = await AsyncStorage.getItem('tempRegistration');
      let combinedData = response.data;
      
      if (tempRegistrationData) {
        const registrationData = JSON.parse(tempRegistrationData);
        combinedData = {
          ...registrationData,
          ...response.data
        };
        // Xóa dữ liệu tạm thời sau khi đã kết hợp
        await AsyncStorage.removeItem('tempRegistration');
      }
      
      // Lưu thông tin người dùng và token
      const userData = await saveAuthData(combinedData);
      return userData;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  // Gửi lại mã OTP
  resendOTP: async (email) => {
    try {
      const response = await apiClient.post(`/api/account/resend-otp/${email}`);
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  // Đăng nhập
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/account/login', credentials);
      // Lưu thông tin người dùng và token
      const userData = await saveAuthData(response.data);
      return userData;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  // Làm mới token
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
      // Xóa token nếu refresh thất bại
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      throw new Error(handleAuthError(error));
    }
  },

  // Quên mật khẩu - Yêu cầu token reset
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/api/account/Reset-Password-Token', { email });
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  // Đặt lại mật khẩu với token
  resetPassword: async (resetData) => {
    try {
      const response = await apiClient.post('/api/account/Reset-Password', resetData);
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  // Đổi mật khẩu
  changePassword: async (changeData) => {
    try {
      const response = await apiClient.post('/api/account/change-password', changeData);
      return response.data;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },
  
  // Kiểm tra xác thực
  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return false;
      
      // Kiểm tra token có hết hạn chưa
      const decoded = getUserFromToken(token);
      if (!decoded.exp) return false;
      
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        // Token đã hết hạn, thử làm mới token
        try {
          await authApi.refreshToken();
          return true;
        } catch (error) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking auth:', error);
      return false;
    }
  },
  
  // Đăng xuất
  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  },
  
  // Lấy thông tin người dùng
  getUserInfo: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  },
  
  // Lấy thông tin từ token
  decodeToken: (token) => {
    return getUserFromToken(token);
  }
};

export default authApi; 