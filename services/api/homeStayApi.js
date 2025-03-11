import apiClient, { handleError } from '../config';

const homeStayApi = {
  // Lấy danh sách homestay
  getHomeStays: async (params) => {
    try {
      const response = await apiClient.get('/api/homestay', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleError(error));
    }
  },

  // Lấy chi tiết homestay theo ID
  getHomeStayById: async (id) => {
    try {
      const response = await apiClient.get(`/api/homestay/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleError(error));
    }
  },

  // Tìm kiếm homestay
  searchHomeStays: async (searchParams) => {
    try {
      const response = await apiClient.get('/api/homestay/search', { params: searchParams });
      return response.data;
    } catch (error) {
      throw new Error(handleError(error));
    }
  },

  // Lấy danh sách homestay nổi bật
  getFeaturedHomeStays: async () => {
    try {
      const response = await apiClient.get('/api/homestay/featured');
      return response.data;
    } catch (error) {
      throw new Error(handleError(error));
    }
  },

  // Lấy danh sách homestay theo vị trí
  getHomeStaysByLocation: async (locationId) => {
    try {
      const response = await apiClient.get(`/api/homestay/location/${locationId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleError(error));
    }
  },

  // Đánh giá homestay
  rateHomeStay: async (homeStayId, ratingData) => {
    try {
      const response = await apiClient.post(`/api/homestay/${homeStayId}/rate`, ratingData);
      return response.data;
    } catch (error) {
      throw new Error(handleError(error));
    }
  },

  // Lấy đánh giá của homestay
  getHomeStayRatings: async (homeStayId) => {
    try {
      const response = await apiClient.get(`/api/homestay/${homeStayId}/ratings`);
      return response.data;
    } catch (error) {
      throw new Error(handleError(error));
    }
  }
};

export default homeStayApi; 