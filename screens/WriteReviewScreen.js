import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../contexts/UserContext';

const { width } = Dimensions.get('window');

const StarRating = ({ rating, onRatingChange }) => {
    return (
        <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => onRatingChange(star)}
                    style={styles.starButton}
                >
                    <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={28}
                        color={star <= rating ? colors.primary : '#ddd'}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default function WriteReviewScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { userData } = useUser();
    const { bookingId, homeStayID } = route.params;

    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [formData, setFormData] = useState({
        cleaningRate: 0,
        serviceRate: 0,
        facilityRate: 0,
        content: '',
        image: null,
        accountID: userData?.userID || '',
        homeStayID: homeStayID,
        bookingID: bookingId
    });

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setFormData(prev => ({ ...prev, image: result.assets[0].uri }));
        }
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
            const response = await reviewApi.createReview(formData);
            if (response?.success) {
                Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi');
                navigation.goBack();
            } else {
                throw new Error(response?.message || 'Không thể gửi đánh giá');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            Alert.alert('Lỗi', error.message || 'Không thể gửi đánh giá');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
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
                        <View style={styles.ratingItem}>
                            <View style={styles.ratingHeader}>
                                <Text style={styles.ratingLabel}>Vệ sinh</Text>
                            </View>
                            <StarRating
                                rating={formData.cleaningRate}
                                onRatingChange={(rating) => setFormData(prev => ({ ...prev, cleaningRate: rating }))}
                            />
                        </View>

                        <View style={styles.ratingItem}>
                            <View style={styles.ratingHeader}>
                                <Text style={styles.ratingLabel}>Dịch vụ</Text>
                            </View>
                            <StarRating
                                rating={formData.serviceRate}
                                onRatingChange={(rating) => setFormData(prev => ({ ...prev, serviceRate: rating }))}
                            />
                        </View>

                        <View style={styles.ratingItem}>
                            <View style={styles.ratingHeader}>
                                <Text style={styles.ratingLabel}>Cơ sở vật chất</Text>
                            </View>
                            <StarRating
                                rating={formData.facilityRate}
                                onRatingChange={(rating) => setFormData(prev => ({ ...prev, facilityRate: rating }))}
                            />
                        </View>
                    </View>

                    <View style={styles.commentCard}>
                        <View style={styles.commentHeader}>
                            <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                            <Text style={styles.commentTitle}>Nội dung đánh giá</Text>
                        </View>
                        <TextInput
                            style={styles.commentInput}
                            multiline
                            numberOfLines={4}
                            placeholder="Hãy chia sẻ trải nghiệm của bạn..."
                            placeholderTextColor="#999"
                            value={formData.content}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
                        />
                    </View>

                    <View style={styles.imageCard}>
                        <View style={styles.imageHeader}>
                            <Ionicons name="camera-outline" size={20} color={colors.primary} />
                            <Text style={styles.imageTitle}>Hình ảnh</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.imagePicker}
                            onPress={pickImage}
                        >
                            {image ? (
                                <Image source={{ uri: image }} style={styles.selectedImage} />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Ionicons name="camera" size={32} color={colors.primary} />
                                    <Text style={styles.imagePlaceholderText}>Thêm ảnh</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
    },
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
    ratingItem: {
        marginBottom: 20,
    },
    ratingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ratingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    starButton: {
        padding: 6,
    },
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
    imagePicker: {
        height: 160,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
    selectedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
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
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
}); 