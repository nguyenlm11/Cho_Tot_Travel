import apiClient from '../config';

const bookingApi = {
    createBooking: async (bookingData) => {
        try {
            const response = await apiClient.post(`/api/booking-checkout/CreateBooking?paymentMethod=1`, bookingData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Lỗi khi tạo booking:', error);
            if (error.response) {
                return {
                    success: false,
                    error: error.response.data?.message || 'Lỗi từ server khi tạo booking',
                    status: error.response.status,
                    data: error.response.data
                };
            }
            else if (error.request) {
                return {
                    success: false,
                    error: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
                    networkError: true
                };
            }
            else {
                return {
                    success: false,
                    error: error.message || 'Có lỗi xảy ra khi tạo booking',
                };
            }
        }
    },

    getPaymentUrl: async (bookingId, isFullPayment = true) => {
        try {
            if (!bookingId) {
                console.error("BookingID không hợp lệ hoặc null:", bookingId);
                return {
                    success: false,
                    error: 'Mã đặt phòng không hợp lệ'
                };
            }
            console.log("Using bookingID for payment:", bookingId);
            console.log("isFullPayment:", isFullPayment);
            const numericBookingId = isNaN(Number(bookingId)) ? bookingId : Number(bookingId);
            
            try {
                const response = await apiClient.post(
                    `/api/booking-checkout/BookingPayment?bookingID=${numericBookingId}&isFullPayment=${isFullPayment}`, 
                    {},
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        timeout: 30000
                    }
                );
                console.log("Payment API response type:", typeof response.data);
                console.log("Payment API response:", response.data);
                if (typeof response.data === 'string') {
                    const urlString = response.data.trim();
                    if (urlString.startsWith('http')) {
                        console.log("URL thanh toán được phát hiện:", urlString);
                        return {
                            success: true,
                            paymentUrl: urlString
                        };
                    }
                }
                if (!response.data) {
                    console.error("API trả về dữ liệu rỗng");
                    return {
                        success: false,
                        error: 'API trả về dữ liệu rỗng, vui lòng thử lại'
                    };
                }
                let paymentUrl = null;
                if (response.data && response.data.paymentUrl) {
                    paymentUrl = response.data.paymentUrl;
                } else if (response.data && typeof response.data === 'object') {
                    for (const key in response.data) {
                        if (!response.data[key]) continue;

                        const value = response.data[key];
                        if (typeof value === 'string' &&
                            (value.startsWith('http') || value.includes('vnpayment.vn'))) {
                            const match = value.match(/(https?:\/\/[^\s]+)/);
                            paymentUrl = match ? match[0] : value;
                            paymentUrl = paymentUrl.replace(/[<>"']/g, '');
                            break;
                        }
                    }
                }
                if (paymentUrl) {
                    console.log("Final payment URL:", paymentUrl);
                    return {
                        success: true,
                        data: response.data,
                        paymentUrl: paymentUrl
                    };
                }
                
                console.error("No valid payment URL found in response:", response.data);
                if (typeof response.data === 'string' && response.data.includes('NullReferenceException')) {
                    return {
                        success: false,
                        error: 'Lỗi khi tạo URL thanh toán: NullReferenceException từ server',
                        data: response.data,
                        nullRefError: true
                    };
                }

                return {
                    success: false,
                    error: 'Không tìm thấy URL thanh toán trong phản hồi',
                    data: response.data
                };
            } catch (apiError) {
                console.error('API error:', apiError);

                if (apiError.response) {
                    console.error('API error response:', apiError.response.status, apiError.response.data);
                    
                    const errorStr = String(apiError.response.data);
                    if (errorStr.includes("Không tìm thấy booking với ID") || errorStr.includes("ID: 0")) {
                        console.log("Phát hiện lỗi bookingID không được truyền đúng. Thử cách khác...");
                        
                        try {
                            console.log("Thử lại với GET method, bookingID:", numericBookingId, "isFullPayment:", isFullPayment);
                            const retryResponse = await apiClient.get(
                                `/api/booking-checkout/BookingPayment?bookingID=${numericBookingId}&isFullPayment=${isFullPayment}`
                            );
                            
                            console.log("Retry response:", retryResponse.data);
                            
                            if (typeof retryResponse.data === 'string' && retryResponse.data.startsWith('http')) {
                                console.log("Retry succeeded! Payment URL:", retryResponse.data);
                                return {
                                    success: true,
                                    paymentUrl: retryResponse.data
                                };
                            }
                        } catch (retryError) {
                            console.error("Retry with GET method failed:", retryError);
                        }
                    }
                    
                    if (apiError.response.status === 500) {
                        return {
                            success: false,
                            error: 'Lỗi máy chủ khi tạo URL thanh toán. Vui lòng thử lại sau',
                            status: 500,
                            serverError: true,
                            bookingId: bookingId,
                            nullRefError: true
                        };
                    }
                    
                    const errorText = JSON.stringify(apiError.response.data || '');
                    if (errorText.includes('NullReferenceException') ||
                        errorText.includes('Object reference not set')) {
                        return {
                            success: false,
                            error: 'Lỗi dữ liệu từ server: Dữ liệu đặt phòng không tồn tại hoặc không hoàn chỉnh',
                            nullRefError: true,
                            status: apiError.response.status
                        };
                    }

                    return {
                        success: false,
                        error: apiError.response.data?.message || 'Lỗi từ server khi tạo URL thanh toán',
                        status: apiError.response.status
                    };
                }
                throw apiError;
            }
        } catch (error) {
            console.error('Lỗi khi lấy URL thanh toán:', error);
            if (error.request) {
                return {
                    success: false,
                    error: 'Không thể kết nối đến server để tạo URL thanh toán',
                    networkError: true
                };
            } else {
                return {
                    success: false,
                    error: error.message || 'Có lỗi xảy ra khi tạo URL thanh toán',
                    nullRefError: true
                };
            }
        }
    },

    getBookingsByAccountID: async (accountID) => {
        try {
            const response = await apiClient.get(`/api/booking-bookingservices/GetBookingByAccountID/${accountID}`);
            let bookingsData = [];
            if (Array.isArray(response.data)) {
                bookingsData = response.data;
            } else if (response.data && typeof response.data === 'object') {
                if (response.data.data && Array.isArray(response.data.data)) {
                    bookingsData = response.data.data;
                } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
                    bookingsData = response.data.bookings;
                }
            }
            return {
                success: true,
                data: bookingsData
            };
        } catch (error) {
            return {
                success: false,
                error: 'Không thể tải thông tin đặt phòng của tài khoản',
                data: []
            };
        }
    },

    checkUserHasBookedHomestay: async (accountID, homestayId) => {
        try {
            if (!accountID) {
                return {
                    success: false,
                    hasBooked: false,
                    error: 'Thiếu thông tin người dùng'
                };
            }
            const response = await apiClient.get(`/api/booking-bookingservices/GetBookingByAccountID/${accountID}`);
            let bookingsData = [];
            if (Array.isArray(response.data)) {
                bookingsData = response.data;
            } else if (response.data && typeof response.data === 'object') {
                if (response.data.data && Array.isArray(response.data.data)) {
                    bookingsData = response.data.data;
                } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
                    bookingsData = response.data.bookings;
                }
            }
            const hasBookedHomestay = bookingsData.some(booking => {
                return booking.homeStayID === parseInt(homestayId) ||
                    booking.homeStayID === homestayId ||
                    (booking.homeStayID && homestayId &&
                        booking.homeStayID.toString() === homestayId.toString());
            });
            return {
                success: true,
                hasBooked: hasBookedHomestay,
                bookings: bookingsData
            };
        } catch (error) {
            console.error('Lỗi khi kiểm tra booking:', error);
            return {
                success: false,
                hasBooked: false,
                error: 'Không thể kiểm tra thông tin đặt phòng'
            };
        }
    }
};

export default bookingApi;