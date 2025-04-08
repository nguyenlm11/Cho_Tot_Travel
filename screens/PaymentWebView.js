import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Platform, StatusBar, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview'
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

export default function PaymentWebView() {
    const navigation = useNavigation();
    const route = useRoute();
    const { paymentUrl, bookingId } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const webViewRef = useRef(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [processedUrls, setProcessedUrls] = useState({});
    const [loadingTime, setLoadingTime] = useState(0);
    const redirectCount = useRef(0);
    const currentUrl = useRef('');
    const backendDomains = useRef(['192.168.2.17:5139', 'localhost:5173']);

    // Khởi tạo URL ban đầu là đã được xử lý
    useEffect(() => {
        if (paymentUrl) {
            console.log("Khởi tạo URL ban đầu (PaymentWebView):", paymentUrl);
            try {
                const urlObj = new URL(paymentUrl);
                console.log("URL params:", urlObj.searchParams.toString());
                setProcessedUrls({ [paymentUrl]: true });

                if (!paymentUrl.includes('vnpayment.vn')) {
                    console.warn("URL không phải từ VNPay:", paymentUrl);
                    if (paymentUrl.includes('192.168.2.17:5139') || paymentUrl.includes('localhost')) {
                        console.error("URL trỏ về backend/localhost thay vì VNPay");
                        setError('URL thanh toán không hợp lệ: URL trỏ về backend thay vì VNPay');
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error("Lỗi phân tích URL:", err);
                setError('URL thanh toán không hợp lệ: ' + err.message);
                setLoading(false);
            }
        }
    }, [paymentUrl]);

    useEffect(() => {
        if (!paymentUrl) {
            setError('URL thanh toán không hợp lệ hoặc trống');
            setLoading(false);
        } else {
            console.log("Loading payment URL:", paymentUrl);
        }

        // Ngăn người dùng quay lại trong quá trình thanh toán
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (isProcessingPayment) {
                Alert.alert(
                    'Cảnh báo',
                    'Bạn đang trong quá trình thanh toán. Bạn có chắc chắn muốn hủy không?',
                    [
                        { text: 'Tiếp tục thanh toán', style: 'cancel', onPress: () => { } },
                        { text: 'Hủy thanh toán', style: 'destructive', onPress: () => navigation.goBack() }
                    ]
                );
                return true;
            }
            return false;
        });

        return () => {
            backHandler.remove();
        };
    }, [paymentUrl, isProcessingPayment]);

    // Thêm đếm thời gian loading
    useEffect(() => {
        let interval;
        if (loading) {
            setLoadingTime(0);
            interval = setInterval(() => {
                setLoadingTime(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [loading]);

    // Thêm timeout để hiển thị thông báo nếu tải quá lâu
    useEffect(() => {
        if (loading) {
            const timeoutId = setTimeout(() => {
                if (loading) {
                    console.log("WebView loading timeout - cảnh báo người dùng");
                    Alert.alert(
                        "Tải trang thanh toán chậm",
                        "Việc kết nối đến cổng thanh toán đang mất nhiều thời gian hơn bình thường. Bạn có muốn chuyển sang phương thức khác?",
                        [
                            {
                                text: "Quay lại",
                                style: "cancel",
                                onPress: () => navigation.goBack()
                            },
                            {
                                text: "Thử lại",
                                onPress: () => {
                                    console.log("Người dùng thử lại tải trang");
                                    setLoading(true);
                                    setLoadingTime(0);
                                    redirectCount.current = 0;
                                    webViewRef.current?.reload();
                                }
                            },
                            {
                                text: "Mở trình duyệt",
                                onPress: async () => {
                                    try {
                                        const Linking = require('react-native').Linking;
                                        await Linking.openURL(paymentUrl);

                                        setTimeout(() => {
                                            Alert.alert(
                                                "Đã mở trình duyệt",
                                                "Sau khi hoàn thành thanh toán trong trình duyệt, vui lòng quay lại ứng dụng và chọn trạng thái thanh toán của bạn.",
                                                [
                                                    {
                                                        text: "Đã thanh toán",
                                                        onPress: () => handlePaymentSuccess()
                                                    },
                                                    {
                                                        text: "Đã hủy thanh toán",
                                                        onPress: () => handlePaymentCancel()
                                                    },
                                                    {
                                                        text: "Gặp lỗi khác",
                                                        onPress: () => handlePaymentError("99")
                                                    }
                                                ]
                                            );
                                        }, 500);
                                    } catch (error) {
                                        console.error("Error opening URL in browser:", error);
                                        Alert.alert("Lỗi", "Không thể mở trình duyệt ngoài");
                                    }
                                }
                            }
                        ]
                    );
                }
            }, 10000);

            return () => clearTimeout(timeoutId);
        }
    }, [loading, paymentUrl]);

    const handleVNPayResponse = (url) => {
        console.log('Processing VNPay response:', url);
        setIsProcessingPayment(true);
        
        try {
            // Parse URL parameters
            let params = {};
            if (typeof url === 'string' && url.includes('vnp_ResponseCode=')) {
                const urlObj = new URL(url);
                urlObj.searchParams.forEach((value, key) => {
                    params[key] = value;
                });
            } else if (typeof url === 'object') {
                // If directly passed an object of parameters (from handlePaymentSuccess etc.)
                params = url;
            }
            
            console.log('VNPay params:', params);
            
            // Check response code to determine payment status
            const responseCode = params.vnp_ResponseCode || '';
            
            // Cập nhật thông tin thanh toán lên backend
            updatePaymentStatusOnBackend(params);
            
            if (responseCode === '00') {
                // Success - navigate directly to BookingSuccess
                navigation.navigate('BookingSuccess', { 
                    bookingId: bookingId,
                    transactionId: params?.vnp_TransactionNo
                });
            } else {
                // Failed - navigate directly to BookingFailed
                const errorCode = params?.vnp_ResponseCode || '99';
                navigation.navigate('BookingFailed', { 
                    bookingId: bookingId,
                    errorCode: errorCode
                });
            }
        } catch (error) {
            console.error('Error parsing VNPay response:', error);
            navigation.navigate('BookingFailed', { 
                error: 'Không thể xử lý phản hồi từ cổng thanh toán.' 
            });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Hàm gọi API backend để cập nhật trạng thái thanh toán
    const updatePaymentStatusOnBackend = async (params) => {
        try {
            if (!params) return;
            const apiUrl = 'http://192.168.2.17:5139/api/booking-checkout/vnpay-return';
            const formattedParams = {};
            Object.keys(params).forEach(key => {
                if (key.startsWith('vnp_') || key.startsWith('Vnp_')) {
                    const normalizedKey = key.startsWith('vnp_') ? key : 'vnp_' + key.substring(4);
                    
                    // Xử lý trường vnp_Amount đặc biệt
                    if (normalizedKey.toLowerCase() === 'vnp_amount' && !isNaN(params[key])) {
                        formattedParams[normalizedKey] = Number(params[key]);
                    } else {
                        formattedParams[normalizedKey] = params[key];
                    }
                } else {
                    formattedParams[key] = params[key];
                }
            });
        
            try {
                const response = await axios.get(
                    apiUrl,
                    { 
                        params: formattedParams,
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 10000
                    }
                );
                console.log('Backend payment update response:', response.data);
            } catch (error) {
                console.error('Failed to update backend about payment:', error);
            }
        } catch (error) {
            console.error('Error in updatePaymentStatusOnBackend:', error);
        }
    };

    // Update the navigation state change handler
    const handleNavigationStateChange = async (navState) => {
        console.log('Navigation state changed. URL:', navState.url);
        
        // Mark as processing to prevent back navigation
        setIsProcessingPayment(true);
        
        // Simple redirect loop detection - compare with current URL
        if (!currentUrl.current) {
            currentUrl.current = navState.url;
            redirectCount.current = 0;
        } else if (currentUrl.current !== navState.url) {
            currentUrl.current = navState.url;
            redirectCount.current += 1;
            
            if (redirectCount.current > 10) {
                console.error('Too many redirects detected');
                setError('Phát hiện vòng lặp chuyển hướng. Vui lòng thử lại sau.');
                setLoading(false);
                return false;
            }
        }
        
        // Handle VNPay callbacks
        if (navState.url && navState.url.includes('vnp_ResponseCode=')) {
            console.log('VNPay callback detected');
            handleVNPayResponse(navState.url);
            return false; // Stop WebView from navigating to this URL
        }
        
        // Always make sure loading is done eventually
        if (navState.loading === false) {
            setLoading(false);
        }
        
        return true; // Allow navigation to continue
    };

    // Simplified inject JavaScript to debug WebView
    const INJECT_JAVASCRIPT = `
    (function() {
        // Report page load and ready status to React Native
        function sendMessage(type, data) {
            window.ReactNativeWebView.postMessage(JSON.stringify({type, data}));
        }
        
        // Report initial load
        sendMessage('page_load', {
            url: window.location.href,
            title: document.title
        });
        
        // Report when page is fully loaded
        window.addEventListener('load', function() {
            sendMessage('page_ready', {url: window.location.href});
        });
        
        // Report errors
        window.addEventListener('error', function(e) {
            sendMessage('error', {message: e.message});
        });
    })();
    true;
    `;

    // Handle messages from WebView
    const handleMessage = (event) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            console.log('WebView message:', message.type);

            if (message.type === 'page_ready') {
                console.log('WebView page fully loaded:', message.data.url);
                setLoading(false);
            }
        } catch (error) {
            console.log('Raw WebView message:', event.nativeEvent.data);
        }
    };

    // Xử lý khi có lỗi trong WebView
    const handleError = (error) => {
        console.error('WebView error:', error);
        
        // Phân tích lỗi chi tiết hơn
        let errorMessage = 'Đã xảy ra lỗi khi tải trang thanh toán';
        
        if (error.nativeEvent) {
            if (error.nativeEvent.description) {
                errorMessage = error.nativeEvent.description;
            }
            
            if (error.nativeEvent.code) {
                // Xử lý các mã lỗi phổ biến
                switch (error.nativeEvent.code) {
                    case -1:
                        errorMessage = 'Không thể kết nối đến máy chủ thanh toán';
                        break;
                    case -2:
                        errorMessage = 'Yêu cầu thanh toán bị hủy';
                        break;
                    case -10:
                        errorMessage = 'Lỗi bảo mật SSL. Vui lòng thử lại';
                        break;
                    case -11:
                        errorMessage = 'Trang thanh toán không tồn tại';
                        break;
                    default:
                        errorMessage = `Lỗi tải trang (${error.nativeEvent.code}): ${error.nativeEvent.description || 'Không xác định'}`;
                }
            }
        }
        
        setError(errorMessage);
        setLoading(false);
        setIsProcessingPayment(false);
    };

    // Xử lý khi webview đã tải xong
    const handleLoadEnd = () => {
        console.log("WebView loaded completely");
        setLoading(false);
    };

    // Xử lý khi WebView bắt đầu tải
    const handleLoadStart = () => {
        console.log("WebView starts loading");
        setLoading(true);
    };

    // Thêm nút mở trình duyệt bên ngoài khi tải quá lâu
    const renderExternalBrowserButton = () => {
        if (loadingTime < 10 || !paymentUrl) return null;

        return (
            <TouchableOpacity
                style={styles.externalBrowserButton}
                onPress={() => {
                    Alert.alert(
                        "Mở trình duyệt bên ngoài",
                        "Bạn có muốn mở trang thanh toán VNPay trong trình duyệt bên ngoài không?",
                        [
                            {
                                text: "Hủy",
                                style: "cancel"
                            },
                            {
                                text: "Mở trình duyệt",
                                onPress: async () => {
                                    try {
                                        // Import Linking từ react-native
                                        const Linking = require('react-native').Linking;
                                        const canOpen = await Linking.canOpenURL(paymentUrl);

                                        if (canOpen) {
                                            await Linking.openURL(paymentUrl);
                                            // Hiển thị hướng dẫn sau khi mở trình duyệt
                                            setTimeout(() => {
                                                Alert.alert(
                                                    "Đã mở trình duyệt",
                                                    "Sau khi hoàn thành thanh toán trong trình duyệt, vui lòng quay lại ứng dụng và chọn 'Đã thanh toán'.",
                                                    [
                                                        {
                                                            text: "Đã thanh toán",
                                                            onPress: () => handlePaymentSuccess()
                                                        },
                                                        {
                                                            text: "Đã hủy",
                                                            onPress: () => handlePaymentCancel()
                                                        }
                                                    ]
                                                );
                                            }, 1000);
                                        } else {
                                            Alert.alert("Lỗi", "Không thể mở trình duyệt bên ngoài");
                                        }
                                    } catch (error) {
                                        console.error("Error opening external browser:", error);
                                        Alert.alert("Lỗi", "Không thể mở trình duyệt bên ngoài");
                                    }
                                }
                            }
                        ]
                    );
                }}
            >
                <Text style={styles.externalBrowserButtonText}>Mở trong trình duyệt</Text>
            </TouchableOpacity>
        );
    };

    // Cải thiện hiển thị loading
    const renderLoading = () => {
        if (!loading) return null;

        // Hiển thị thông báo khác nhau dựa trên thời gian đã đợi
        let loadingMessage = "Đang kết nối đến cổng thanh toán...";
        let subMessage = "Vui lòng đợi trong giây lát";

        if (loadingTime > 5) {
            loadingMessage = "Đang tải trang thanh toán...";
            subMessage = "Có thể mất nhiều thời gian hơn dự kiến";
        }

        if (loadingTime > 15) {
            loadingMessage = "Vẫn đang kết nối...";
            subMessage = "Vui lòng thử lại hoặc mở trình duyệt";
        }

        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>{loadingMessage}</Text>
                <Text style={styles.loadingSubText}>{subMessage}</Text>
                <Text style={styles.loadingTime}>{loadingTime} giây</Text>

                {loadingTime > 5 && (
                    <View style={styles.loadingButtonsContainer}>
                        <TouchableOpacity
                            style={styles.retryButtonLoading}
                            onPress={() => {
                                console.log("Thử lại tải trang từ nút retry");
                                setLoading(true);
                                setLoadingTime(0);
                                redirectCount.current = 0;
                                webViewRef.current?.reload();
                            }}
                        >
                            <Text style={styles.retryButtonText}>Thử lại</Text>
                        </TouchableOpacity>

                        {renderExternalBrowserButton()}
                    </View>
                )}
            </View>
        );
    };

    // Render lỗi
    const renderError = () => {
        if (!error) return null;
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={60} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            setError(null);
                            setLoading(true);
                            redirectCount.current = 0;
                            webViewRef.current?.reload();
                        }}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.retryButton, styles.cancelButton]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.retryButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Add missing payment result handler functions
    const handlePaymentSuccess = () => {
        const fakeSuccessParams = { vnp_ResponseCode: '00', vnp_TxnRef: bookingId };
        handleVNPayResponse(fakeSuccessParams);
    };

    const handlePaymentCancel = () => {
        const fakeCancelParams = { vnp_ResponseCode: '24', vnp_TxnRef: bookingId };
        handleVNPayResponse(fakeCancelParams);
    };

    const handlePaymentError = (errorCode = '99') => {
        const fakeErrorParams = { vnp_ResponseCode: errorCode, vnp_TxnRef: bookingId };
        handleVNPayResponse(fakeErrorParams);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Header */}
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (isProcessingPayment) {
                            Alert.alert(
                                'Cảnh báo',
                                'Bạn đang trong quá trình thanh toán. Bạn có chắc chắn muốn hủy không?',
                                [
                                    { text: 'Tiếp tục thanh toán', style: 'cancel' },
                                    { text: 'Hủy thanh toán', style: 'destructive', onPress: () => navigation.goBack() }
                                ]
                            );
                        } else {
                            navigation.goBack();
                        }
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán VNPay</Text>
                <TouchableOpacity
                    style={styles.helpButton}
                    onPress={() => {
                        Alert.alert(
                            "Trợ giúp thanh toán",
                            "Nếu gặp khó khăn khi thanh toán, bạn có thể thử các cách sau:\n\n" +
                            "• Kiểm tra kết nối mạng\n" +
                            "• Thử lại việc tải trang\n" +
                            "• Mở trang thanh toán trong trình duyệt\n" +
                            "• Liên hệ nhà cung cấp dịch vụ",
                            [{ text: "Đã hiểu" }]
                        );
                    }}
                >
                    <Ionicons name="help-circle" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* WebView */}
            {error ? renderError() : (
                <>
                    {paymentUrl ? (
                        <WebView
                            ref={webViewRef}
                            source={{ uri: paymentUrl }}
                            style={styles.webView}
                            onNavigationStateChange={handleNavigationStateChange}
                            onError={handleError}
                            onLoadEnd={handleLoadEnd}
                            onLoadStart={handleLoadStart}
                            startInLoadingState={true}
                            renderLoading={() => null}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            cacheEnabled={false}
                            sharedCookiesEnabled={true}
                            thirdPartyCookiesEnabled={true}
                            incognito={false}
                            pullToRefreshEnabled={true}
                            useWebKit={true}
                            injectedJavaScript={INJECT_JAVASCRIPT}
                            onMessage={handleMessage}
                            userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36"
                            timeoutInterval={30000}
                            applicationNameForUserAgent="ChoTotTravel/1.0"
                            originWhitelist={['*']}
                        />
                    ) : (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={60} color="#ff6b6b" />
                            <Text style={styles.errorText}>URL thanh toán không hợp lệ</Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.retryButtonText}>Quay lại</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {renderLoading()}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 30 + StatusBar.currentHeight,
        paddingBottom: 15,
        paddingHorizontal: 15,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    helpButton: {
        padding: 5,
    },
    webView: {
        flex: 1,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: colors.primary,
        fontSize: 16,
        fontWeight: '500',
    },
    loadingSubText: {
        marginTop: 5,
        color: colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    loadingTime: {
        marginTop: 5,
        color: colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 15,
        fontSize: 16,
        color: '#ff6b6b',
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    cancelButton: {
        backgroundColor: '#888',
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    retryButtonLoading: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    externalBrowserButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    externalBrowserButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
}); 