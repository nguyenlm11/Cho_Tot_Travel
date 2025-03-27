import apiClient, { handleError } from '../config';

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

  // Lấy chi tiết homestay theo ID
  getHomeStayDetail: async (homestayId) => {
    try {
      const response = await apiClient.get(`/api/homestay/GetHomeStayDetail/${homestayId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching homestay detail:', error);
      throw error;
    }
  }
};

export default homeStayApi; 