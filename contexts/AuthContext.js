import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authApi from '../services/api/authApi';

// Tạo context
const AuthContext = createContext();

// Custom hook để sử dụng AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kiểm tra xem người dùng đã đăng nhập chưa khi ứng dụng khởi động
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authApi.getUserInfo();
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Đăng ký tài khoản mới
  const register = async (userData) => {
    setError(null);
    try {
      // Chỉ trả về dữ liệu đăng ký, không lưu vào state
      return await authApi.register(userData);
    } catch (error) {
      setError(error.message || 'Đăng ký thất bại');
      throw error;
    }
  };

  // Xác nhận tài khoản bằng OTP
  const confirmAccount = async (email, code) => {
    setError(null);
    try {
      const response = await authApi.confirmAccount(email, code);
      // Lưu thông tin người dùng vào state sau khi xác nhận OTP thành công
      setUser(response);
      return response;
    } catch (error) {
      setError(error.message || 'Xác minh tài khoản thất bại');
      throw error;
    }
  };

  // Gửi lại mã OTP
  const resendOTP = async (email) => {
    setError(null);
    try {
      return await authApi.resendOTP(email);
    } catch (error) {
      setError(error.message || 'Gửi lại OTP thất bại');
      throw error;
    }
  };

  // Đăng nhập
  const login = async (credentials) => {
    setError(null);
    try {
      const response = await authApi.login(credentials);
      // Lưu thông tin người dùng vào state sau khi đăng nhập thành công
      setUser(response);
      return response;
    } catch (error) {
      setError(error.message || 'Đăng nhập thất bại');
      throw error;
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Kiểm tra xác thực
  const checkAuth = async () => {
    try {
      return await authApi.checkAuth();
    } catch (error) {
      console.error('Error checking auth:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        confirmAccount,
        resendOTP,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 