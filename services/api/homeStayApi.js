import apiClient, { handleError } from '../config';
import axios from 'axios';

const homeStayApi = {
  filterHomeStays: async (filterParams) => {
    try {
      const cleanParams = {};
      for (const key in filterParams) {
        if (filterParams[key] !== null && filterParams[key] !== undefined) {
          cleanParams[key] = filterParams[key];
        }
      }
      const response = await apiClient.get('/api/HomeStay/filter', { params: cleanParams });
      const results = response.data.data || response.data || [];
      return results;
    } catch (error) {
      console.error('Filter API Error:', error.response || error);
      throw new Error(handleError(error));
    }
  },

  getHomeStayDetail: async (homestayId) => {
    try {
      const response = await apiClient.get(`/api/homestay/GetHomeStayDetail/${homestayId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching homestay detail:', error);
      throw error;
    }
  },

  getHomeStayRentals: async (filterParams) => {
    try {
      const cleanParams = {};
      for (const key in filterParams) {
        if (filterParams[key] !== null && filterParams[key] !== undefined) {
          cleanParams[key] = filterParams[key];
        }
      }
      const response = await apiClient.get('/api/homestayrental/filter', { params: cleanParams });
      const results = response.data.data || response.data || [];
      return results;
    } catch (error) {
      console.error('Error in getHomeStayRentals:', error.response?.data || error.message);
      throw new Error(handleError(error));
    }
  },

  getHomeStayRentalDetail: async (rentalId) => {
    try {
      const response = await apiClient.get(`/api/homestayrental/GetHomeStayRentalDetail/${rentalId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error fetching rental detail:', error.response?.data || error.message);
      return {
        success: false,
        error: handleError(error)
      };
    }
  },

  getTotalPrice: async (checkInDate, checkOutDate, homeStayRentalId, roomTypeId) => {
    try {
      const params = {
        checkInDate,
        checkOutDate,
        homeStayRentalId,
        roomTypeId
      };
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      const response = await apiClient.get('/api/homestay/GetTotalPrice', { params });
      return {
        success: true,
        data: response.data?.data?.totalRentPrice || 0
      };
    } catch (error) {
      console.error('Error fetching total price:', error.response?.data || error.message);
      return {
        success: false,
        error: handleError(error)
      };
    }
  },

  getCancellationPolicy: async (homeStayId) => {
    try {
      const response = await apiClient.get(`/api/CancellationPolicy/GetByHomeStayId/${homeStayId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching cancellation policy:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể lấy thông tin chính sách hủy phòng'
      };
    }
  }
};

export default homeStayApi; 