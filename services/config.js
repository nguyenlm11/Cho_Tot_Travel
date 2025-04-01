import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: 'http://192.168.2.17:5139',
  // baseURL: 'http://hungnv.iselab.cloud:7221',
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
    const status = error.response.status;
    const data = error.response.data;
    // Kiểm tra nếu data là chuỗi, dùng trực tiếp; nếu là object, dùng data.message
    const errorMessage = typeof data === 'string' ? data : data.message || 'Có lỗi xảy ra';
    if (status === 400) {
      return errorMessage || 'Yêu cầu không hợp lệ';
    } else if (status === 401) {
      return 'Bạn cần đăng nhập để thực hiện hành động này';
    } else if (status === 403) {
      return 'Bạn không có quyền thực hiện hành động này';
    } else if (status === 404) {
      return 'Không tìm thấy tài nguyên yêu cầu';
    } else if (status === 500) {
      return 'Lỗi máy chủ, vui lòng thử lại sau';
    }

    return errorMessage;
  } else if (error.request) {
    return 'Không thể kết nối đến máy chủ, vui lòng kiểm tra kết nối mạng';
  } else {
    return error.message || 'Có lỗi xảy ra khi gửi yêu cầu';
  }
};

// Hàm xử lý lỗi xác thực
const handleAuthError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 400) {
      const errorMessage = typeof data === 'string' ? data : data.message || 'Thông tin đăng nhập không hợp lệ';
      if (errorMessage.includes('username')) {
        return 'Tên đăng nhập đã tồn tại';
      } else if (errorMessage.includes('confirm')) {
        return 'Bạn cần xác nhận email trước khi đăng nhập';
      } else if (errorMessage.includes('email')) {
        return 'Email đã được sử dụng';
      } else if (errorMessage.includes('password')) {
        return 'Mật khẩu không đáp ứng yêu cầu bảo mật';
      }
      return errorMessage; // Trả về thông báo lỗi gốc nếu không khớp
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