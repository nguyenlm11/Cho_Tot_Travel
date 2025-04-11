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

    useEffect(() => {
        if (paymentUrl) {
            try {
                setProcessedUrls({ [paymentUrl]: true });
                if (!paymentUrl.includes('vnpayment.vn')) {
                    if (paymentUrl.includes('172.20.10.4:5139') || paymentUrl.includes('localhost')) {
                        setError('URL thanh toán không hợp lệ: URL trỏ về backend thay vì VNPay');
                        setLoading(false);
                    }
                }
            } catch (err) {
                setError('URL thanh toán không hợp lệ: ' + err.message);
                setLoading(false);
            }
        }
    }, [paymentUrl]);

    useEffect(() => {
        if (!paymentUrl) {
            setError('URL thanh toán không hợp lệ hoặc trống');
            setLoading(false);
        }

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
        return () => { backHandler.remove() };
    }, [paymentUrl, isProcessingPayment]);

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

    useEffect(() => {
        if (loading) {
            const timeoutId = setTimeout(() => {
                if (loading) {
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
        setIsProcessingPayment(true);
        try {
            let params = {};
            if (typeof url === 'string' && url.includes('vnp_ResponseCode=')) {
                const urlObj = new URL(url);
                urlObj.searchParams.forEach((value, key) => {
                    params[key] = value;
                });
            } else if (typeof url === 'object') {
                params = url;
            }
            const responseCode = params.vnp_ResponseCode || '';
            updatePaymentStatusOnBackend(params);

            if (webViewRef.current) {
                try {
                    webViewRef.current.injectJavaScript(`
                        window.stop();
                        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;"><p>Đang chuyển hướng...</p></div>';
                        window.ReactNativeWebView.postMessage('WEBVIEW_CLEANUP_COMPLETE');
                        true;
                    `);
                } catch (error) {
                    console.error('Error stopping WebView:', error);
                }
            }

            setTimeout(() => {
                if (responseCode === '00') {
                    navigation.replace('BookingSuccess', {
                        bookingId: bookingId,
                        transactionId: params?.vnp_TransactionNo
                    });
                } else {
                    const errorCode = params?.vnp_ResponseCode || '99';
                    navigation.replace('BookingFailed', {
                        bookingId: bookingId,
                        errorCode: errorCode
                    });
                }
            }, 300);
        } catch (error) {
            console.error('Error processing VNPay response:', error);
            navigation.replace('BookingFailed', {
                error: 'Không thể xử lý phản hồi từ cổng thanh toán.'
            });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const updatePaymentStatusOnBackend = async (params) => {
        try {
            if (!params) return;
            const apiUrl = 'http://192.168.2.17:5139/api/booking-checkout/vnpay-return';
            const formattedParams = {};
            Object.keys(params).forEach(key => {
                if (key.startsWith('vnp_') || key.startsWith('Vnp_')) {
                    const normalizedKey = key.startsWith('vnp_') ? key : 'vnp_' + key.substring(4);
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
                await axios.get(
                    apiUrl,
                    {
                        params: formattedParams,
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 10000
                    }
                );
            } catch (error) {
                // Vẫn tiếp tục xử lý ngay cả khi gặp lỗi API
            }
        } catch (error) {
            // Bỏ qua lỗi và tiếp tục xử lý
        }
    };

    const handleNavigationStateChange = async (navState) => {
        setIsProcessingPayment(true);
        if (!currentUrl.current) {
            currentUrl.current = navState.url;
            redirectCount.current = 0;
        } else if (currentUrl.current !== navState.url) {
            currentUrl.current = navState.url;
            redirectCount.current += 1;
            if (redirectCount.current > 10) {
                setError('Phát hiện vòng lặp chuyển hướng. Vui lòng thử lại sau.');
                setLoading(false);
                return false;
            }
        }

        if (navState.url && navState.url.includes('vnp_ResponseCode=')) {
            handleVNPayResponse(navState.url);
            return false;
        }
        if (navState.loading === false) {
            setLoading(false);
        }
        return true;
    };

    const handleLoadEnd = () => { setLoading(false) };
    const handleLoadStart = () => { setLoading(true) };

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
                                        const Linking = require('react-native').Linking;
                                        const canOpen = await Linking.canOpenURL(paymentUrl);

                                        if (canOpen) {
                                            await Linking.openURL(paymentUrl);
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

    const renderLoading = () => {
        if (!loading) return null;
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

    useEffect(() => {
        return () => {
            if (webViewRef.current) {
                try {
                    webViewRef.current.injectJavaScript(`
                        window.stop();
                        document.body.innerHTML = "";
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage('WEBVIEW_UNMOUNTING');
                        }
                        true;
                    `);
                } catch (error) {
                    console.log('Cleanup error:', error);
                }
            }
            setLoading(false);
            setError(null);
            setIsProcessingPayment(false);

            currentUrl.current = '';
            redirectCount.current = 0;
        };
    }, []);

    // Thêm hàm xử lý message từ WebView
    const handleWebViewMessage = (event) => {
        console.log("WebView message received:", event.nativeEvent.data);
        if (event.nativeEvent.data === 'WEBVIEW_CLEANUP_COMPLETE') {
            console.log("WebView cleanup completed successfully");
        }
    };

    // Tạo hàm mới để xử lý việc quay lại
    const handleGoBack = () => {
        if (isProcessingPayment) {
            Alert.alert(
                'Cảnh báo',
                'Bạn đang trong quá trình thanh toán. Bạn có chắc chắn muốn hủy không?',
                [
                    { text: 'Tiếp tục thanh toán', style: 'cancel' },
                    {
                        text: 'Hủy thanh toán',
                        style: 'destructive',
                        onPress: () => {
                            // Dọn dẹp WebView trước khi quay lại
                            if (webViewRef.current) {
                                try {
                                    webViewRef.current.injectJavaScript(`
                                        window.stop();
                                        document.body.innerHTML = "";
                                        if (window.ReactNativeWebView) {
                                            window.ReactNativeWebView.postMessage('WEBVIEW_GOING_BACK');
                                        }
                                        true;
                                    `);
                                } catch (error) {
                                    console.error('Error stopping WebView on go back:', error);
                                }
                            }
                            // Đặt timeout để đảm bảo WebView có thời gian dọn dẹp
                            setTimeout(() => {
                                navigation.goBack();
                            }, 200);
                        }
                    }
                ]
            );
        } else {
            // Dọn dẹp WebView trước khi quay lại
            if (webViewRef.current) {
                try {
                    webViewRef.current.injectJavaScript(`
                        window.stop();
                        document.body.innerHTML = "";
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage('WEBVIEW_GOING_BACK');
                        }
                        true;
                    `);
                } catch (error) {
                    console.error('Error stopping WebView on go back:', error);
                }
            }
            // Đặt timeout để đảm bảo WebView có thời gian dọn dẹp
            setTimeout(() => {
                navigation.goBack();
            }, 200);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoBack}
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
                            key="webViewKey"
                            ref={webViewRef}
                            source={{ uri: paymentUrl }}
                            style={styles.webView}
                            onNavigationStateChange={handleNavigationStateChange}
                            onLoadEnd={handleLoadEnd}
                            onLoadStart={handleLoadStart}
                            onMessage={handleWebViewMessage}
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