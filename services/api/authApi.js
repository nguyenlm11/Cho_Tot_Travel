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
      username: decoded.given_name,
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
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        // Token đã hết hạn, thử refresh
        try {
          await authApi.refreshToken();
          return true;
        } catch (refreshError) {
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
      throw new Error('Có lỗi xảy ra khi đăng xuất');
    }
  },

  // Lấy thông tin người dùng
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

  // Cập nhật thông tin người dùng
  updateUserInfo: async (userData) => {
    try {
      // Kiểm tra xem có userId không
      if (!userData.userId) {
        throw new Error('Thiếu userId để cập nhật thông tin người dùng');
      }

      // Tách userId ra khỏi userData để sử dụng trong query parameter
      const { userId, ...userDataWithoutId } = userData;

      // Gọi API cập nhật thông tin người dùng với userId là query parameter
      const response = await apiClient.put(`/api/account/Update-Account?userId=${userId}`, userDataWithoutId);

      // Cập nhật thông tin trong AsyncStorage
      const currentUserData = await AsyncStorage.getItem('user');
      if (currentUserData) {
        const parsedUserData = JSON.parse(currentUserData);
        const updatedUserData = {
          ...parsedUserData,
          ...userDataWithoutId,
          userId // Đảm bảo userId vẫn được giữ lại
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