import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../contexts/UserContext';
import ratingApi from '../services/api/ratingApi';

const { width } = Dimensions.get('window');

const RatingItem = ({ label, value, onValueChange, icon }) => {
    return (
        <View style={styles.ratingItem}>
            <View style={styles.ratingContainer}>
                <View style={styles.ratingLabelContainer}>
                    <Ionicons name={icon} size={18} color={colors.primary} />
                    <Text style={styles.ratingLabel}>{label}</Text>
                </View>
                <View style={styles.ratingButtons}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                        <TouchableOpacity
                            key={rating}
                            style={[
                                styles.ratingButton,
                                value >= rating && styles.ratingButtonSelected
                            ]}
                            onPress={() => onValueChange(rating)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={value >= rating ? 'star' : 'star-outline'}
                                size={24}
                                color={value >= rating ? colors.primary : '#ddd'}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
};

export default function WriteReviewScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { userData } = useUser();
    const { bookingId, homeStayID } = route.params;
    const [loading, setLoading] = useState(false);
    const [pickingImage, setPickingImage] = useState(false);
    const [images, setImages] = useState([]);
    const [formData, setFormData] = useState({
        cleaningRate: 0,
        serviceRate: 0,
        facilityRate: 0,
        content: '',
        accountID: userData?.userID || '',
        homeStayID: homeStayID,
        bookingID: bookingId
    });

    const pickImage = async () => {
        try {
            setPickingImage(true);
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: 6 - images.length,
                presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
            });
            if (!result.canceled) {
                const newImages = result.assets.map(asset => ({
                    uri: asset.uri,
                    type: 'image/jpeg',
                    name: `image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
                }));
                setImages(prev => [...prev, ...newImages]);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        } finally {
            setPickingImage(false);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!formData.cleaningRate || !formData.serviceRate || !formData.facilityRate) {
            Alert.alert('Lỗi', 'Vui lòng đánh giá tất cả các tiêu chí');
            return;
        }
        if (!formData.content.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập nội dung đánh giá');
            return;
        }
        try {
            setLoading(true);
            const submitData = new FormData();
            submitData.append('CleaningRate', formData.cleaningRate);
            submitData.append('ServiceRate', formData.serviceRate);
            submitData.append('FacilityRate', formData.facilityRate);
            submitData.append('Content', formData.content);
            submitData.append('AccountID', formData.accountID);
            submitData.append('HomeStayID', formData.homeStayID);
            submitData.append('BookingID', formData.bookingID);
            images.forEach((image) => {
                submitData.append('Images', image);
            });
            const response = await ratingApi.createRating(submitData);
            if (response?.success) {
                Alert.alert('Thành công', 'Cám ơn bạn đã đánh giá cho chúng tôi');
                navigation.replace('HomeTabs', {
                    screen: 'Booking'
                });
            } else {
                throw new Error(response?.message || 'Không thể gửi đánh giá');
            }
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể gửi đánh giá');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            {loading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Đang gửi đánh giá...</Text>
                    </View>
                </View>
            )}
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Viết đánh giá</Text>
                <View style={styles.headerRight} />
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.mainCard}>
                    <Text style={styles.mainTitle}>Đánh giá của bạn</Text>
                    <Text style={styles.mainSubtitle}>Chia sẻ trải nghiệm của bạn về homestay</Text>
                    <View style={styles.ratingCard}>
                        <RatingItem
                            label="Vệ sinh"
                            value={formData.cleaningRate}
                            onValueChange={(rating) => setFormData(prev => ({ ...prev, cleaningRate: rating }))}
                            icon="sparkles"
                        />
                        <RatingItem
                            label="Dịch vụ"
                            value={formData.serviceRate}
                            onValueChange={(rating) => setFormData(prev => ({ ...prev, serviceRate: rating }))}
                            icon="happy"
                        />
                        <RatingItem
                            label="Tiện nghi"
                            value={formData.facilityRate}
                            onValueChange={(rating) => setFormData(prev => ({ ...prev, facilityRate: rating }))}
                            icon="tv"
                        />
                    </View>

                    <View style={styles.commentCard}>
                        <View style={styles.commentHeader}>
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
                            <Text style={styles.commentTitle}>Nội dung đánh giá</Text>
                        </View>
                        <TextInput
                            style={styles.commentInput}
                            multiline
                            numberOfLines={5}
                            placeholder="Hãy chia sẻ trải nghiệm của bạn..."
                            placeholderTextColor="#999"
                            value={formData.content}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
                        />
                    </View>

                    <View style={styles.imageCard}>
                        <View style={styles.imageHeader}>
                            <Ionicons name="images-outline" size={20} color={colors.primary} />
                            <Text style={styles.imageTitle}>Hình ảnh</Text>
                        </View>
                        <View style={styles.imageGrid}>
                            {images.slice(0, 6).map((image, index) => (
                                <View key={index} style={styles.imageItem}>
                                    <Image
                                        source={{ uri: image.uri }}
                                        style={styles.selectedImage}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => removeImage(index)}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {images.length < 6 && (
                                <TouchableOpacity
                                    style={[styles.imagePicker, pickingImage && styles.imagePickerDisabled]}
                                    onPress={pickImage}
                                    activeOpacity={0.7}
                                    disabled={pickingImage}
                                >
                                    <View style={styles.imagePlaceholder}>
                                        {pickingImage ? (
                                            <ActivityIndicator size="small" color={colors.primary} />
                                        ) : (
                                            <>
                                                <Ionicons name="camera" size={32} color={colors.primary} />
                                                <Text style={styles.imagePlaceholderText}>Thêm ảnh</Text>
                                                <Text style={styles.imageLimitText}>
                                                    {images.length}/6 ảnh
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, (loading || !formData.cleaningRate || !formData.serviceRate || !formData.facilityRate || !formData.content.trim()) && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading || !formData.cleaningRate || !formData.serviceRate || !formData.facilityRate || !formData.content.trim()}
                >
                    {loading ? (
                        <View style={styles.submitButtonGradient}>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.submitButtonText}>Đang gửi...</Text>
                        </View>
                    ) : (
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitButtonGradient}
                        >
                            <Ionicons name="send-outline" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
                        </LinearGradient>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    backButton: { padding: 8 },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerRight: { width: 40 },
    content: { flex: 1 },
    mainCard: {
        margin: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    mainSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    ratingCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    ratingItem: { marginBottom: 20 },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratingLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        flex: 1,
    },
    ratingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    ratingButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingButton: { padding: 8 },
    commentCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    commentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        backgroundColor: '#fff',
        color: '#333',
    },
    imageCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
    },
    imageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    imageTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
        justifyContent: 'flex-start',
    },
    imageItem: {
        width: (width - 80) / 3.5,
        height: (width - 80) / 3.5,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f0f0f0',
        marginBottom: 8,
    },
    selectedImage: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 2,
    },
    imagePicker: {
        width: "100%",
        height: (width - 80) / 3.5,
        borderWidth: 2,
        borderColor: colors.primary,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderStyle: 'dashed',
        marginBottom: 8,
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    imagePlaceholderText: {
        marginTop: 8,
        color: colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    imageLimitText: {
        marginTop: 4,
        color: '#666',
        fontSize: 12,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    submitButton: {
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButtonGradient: {
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    imagePickerDisabled: { opacity: 0.5 },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
}); 