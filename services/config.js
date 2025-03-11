import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: 'http://192.168.2.17:7221',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động thêm token vào header
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Hàm xử lý lỗi chung
const handleError = (error) => {
  if (error.response) {
    // Lỗi từ server với mã trạng thái
    const status = error.response.status;
    const data = error.response.data;

    if (status === 400) {
      return data.message || 'Yêu cầu không hợp lệ';
    } else if (status === 401) {
      return 'Bạn cần đăng nhập để thực hiện hành động này';
    } else if (status === 403) {
      return 'Bạn không có quyền thực hiện hành động này';
    } else if (status === 404) {
      return 'Không tìm thấy tài nguyên yêu cầu';
    } else if (status === 500) {
      return 'Lỗi máy chủ, vui lòng thử lại sau';
    }

    return data.message || 'Có lỗi xảy ra';
  } else if (error.request) {
    // Không nhận được phản hồi từ server
    return 'Không thể kết nối đến máy chủ, vui lòng kiểm tra kết nối mạng';
  } else {
    // Lỗi khi thiết lập request
    return error.message || 'Có lỗi xảy ra khi gửi yêu cầu';
  }
};

// Hàm xử lý lỗi xác thực
const handleAuthError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 400) {
      if (data.message && data.message.includes('username')) {
        return 'Tên đăng nhập đã tồn tại';
      } else if (data.message && data.message.includes('email')) {
        return 'Email đã được sử dụng';
      } else if (data.message && data.message.includes('password')) {
        return 'Mật khẩu không đáp ứng yêu cầu bảo mật';
      }
      return data.message || 'Thông tin đăng nhập không hợp lệ';
    } else if (status === 401) {
      return 'Tên đăng nhập hoặc mật khẩu không chính xác';
    } else if (status === 403) {
      return 'Tài khoản của bạn không có quyền truy cập';
    } else if (status === 404) {
      return 'Không tìm thấy tài khoản';
    }
  }

  return handleError(error);
};

export { handleError, handleAuthError };
export default apiClient; 