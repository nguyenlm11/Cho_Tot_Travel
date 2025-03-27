import apiClient, { handleError } from '../config';

const homeStayApi = {
  // Lọc homestay theo vị trí, ngày, số người, và khoảng cách
  filterHomeStays: async (filterParams) => {
    try {
      const cleanParams = {};
      for (const key in filterParams) {
        if (filterParams[key] !== null && filterParams[key] !== undefined) {
          cleanParams[key] = filterParams[key];
        }
      }
      const response = await apiClient.get('/api/HomeStay/filter', { params: cleanParams });
      // console.log('API Response:', response.data);
      const results = response.data.data || response.data || [];
      // console.log('Processed Results:', results);
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