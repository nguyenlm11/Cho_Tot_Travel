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

  // Kiểm tra trạng thái đăng nhập khi ứng dụng khởi động
  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuthenticated = await authApi.checkAuth();
        if (isAuthenticated) {
          const userData = await authApi.getUserInfo();
          setUser(userData);
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Đăng ký
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register(userData);
      
      // Lưu dữ liệu đăng ký tạm thời để sử dụng sau khi xác nhận OTP
      await AsyncStorage.setItem('tempRegistration', JSON.stringify(userData));
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận tài khoản
  const confirmAccount = async (email, code) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authApi.confirmAccount(email, code);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authApi.login(credentials);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authApi.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật thông tin người dùng
  const updateUserInfo = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await authApi.updateUserInfo(userData);
      setUser(prev => ({ ...prev, ...userData }));
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Đổi mật khẩu
  const changePassword = async (passwordData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.changePassword(passwordData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Quên mật khẩu
  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.forgotPassword(email);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Đặt lại mật khẩu
  const resetPassword = async (resetData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.resetPassword(resetData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Giá trị context
  const value = {
    user,
    loading,
    error,
    register,
    confirmAccount,
    login,
    logout,
    updateUserInfo,
    changePassword,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 