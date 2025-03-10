import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cấu hình API
const API_URL = 'http://192.168.2.17:7221';
// const API_URL = 'http://10.87.14.181:7221';
const API_TIMEOUT = 60000;

// Tạo instance axios với cấu hình cơ bản
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor cho request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Hàm xử lý lỗi API
export const handleApiError = (error, defaultMessage = 'Đã xảy ra lỗi. Vui lòng thử lại sau.') => {
  if (error.response) {
    // Lỗi từ server với status code
    const { data, status } = error.response;
    
    // Xử lý các mã lỗi phổ biến
    switch (status) {
      case 400:
        return data.message || 'Yêu cầu không hợp lệ';
      case 401:
        return data.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
      case 403:
        return data.message || 'Bạn không có quyền truy cập vào tài nguyên này';
      case 404:
        return data.message || 'Không tìm thấy tài nguyên yêu cầu';
      case 409:
        return data.message || 'Dữ liệu đã tồn tại';
      case 422:
        return data.message || 'Dữ liệu không hợp lệ';
      case 500:
        return data.message || 'Lỗi máy chủ. Vui lòng thử lại sau';
      default:
        return data.message || defaultMessage;
    }
  } else if (error.request) {
    // Không nhận được response
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng';
  } else {
    // Lỗi khi setup request
    return error.message || defaultMessage;
  }
};

// Hàm xử lý lỗi xác thực
export const handleAuthError = (error) => {
  if (error.response) {
    const { data, status } = error.response;
    
    switch (status) {
      case 400:
        return data.message || 'Thông tin đăng nhập không hợp lệ';
      case 401:
        return data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác';
      case 403:
        return data.message || 'Tài khoản của bạn đã bị khóa';
      case 404:
        return data.message || 'Tài khoản không tồn tại';
      case 409:
        return data.message || 'Email đã được sử dụng';
      case 422:
        return data.message || 'Thông tin không hợp lệ';
      default:
        return handleApiError(error, 'Đăng nhập thất bại. Vui lòng thử lại sau');
    }
  }
  
  return handleApiError(error, 'Đăng nhập thất bại. Vui lòng thử lại sau');
};

export default apiClient; 