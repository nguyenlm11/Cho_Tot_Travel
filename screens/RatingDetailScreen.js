import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import apiClient from '../services/config';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn, SlideInRight } from 'react-native-reanimated';
import ratingApi from '../services/api/ratingApi';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const RatingStars = ({ rating, setRating, label, size = 30, disabled = false, icon }) => {
    const stars = [1, 2, 3, 4, 5];

    return (
        <Animated.View
            entering={SlideInRight.duration(600).delay(200)}
            style={styles.ratingContainer}
        >
            <View style={styles.ratingLabelContainer}>
                {icon && <MaterialCommunityIcons name={icon} size={20} color={colors.primary} style={styles.ratingIcon} />}
                <Text style={styles.ratingLabel}>{label}</Text>
            </View>
            <View style={styles.starsContainer}>
                {stars.map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => !disabled && setRating(star)}
                        disabled={disabled}
                        style={styles.starButton}
                    >
                        <Ionicons
                            name={rating >= star ? 'star' : 'star-outline'}
                            size={size}
                            color={rating >= star ? colors.primary : '#D3D3D3'}
                        />
                    </TouchableOpacity>
                ))}
                <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
            </View>
        </Animated.View>
    );
};

const Divider = () => (
    <View style={styles.divider} />
);

const RatingDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { ratingId } = route.params || {};

    // Fallback to ratingID if ratingId isn't available
    const ratingID = ratingId || route.params?.ratingID;

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [ratingDetail, setRatingDetail] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [cleaningRate, setCleaningRate] = useState(0);
    const [serviceRate, setServiceRate] = useState(0);
    const [facilityRate, setFacilityRate] = useState(0);
    const [content, setContent] = useState('');
    const [images, setImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [expandedImage, setExpandedImage] = useState(null);

    useEffect(() => {
        fetchRatingDetail();
    }, [ratingID]);

    const fetchRatingDetail = async () => {
        if (!ratingID) {
            Alert.alert('Lỗi', 'Không tìm thấy mã đánh giá');
            navigation.goBack();
            return;
        }

        try {
            setLoading(true);
            const response = await apiClient.get(`/api/rating/GetRatingDetail/${ratingID}`);

            if (response.data && response.data.data) {
                const rating = response.data.data;
                setRatingDetail(rating);

                // Khởi tạo state với dữ liệu từ API
                setCleaningRate(rating.cleaningRate);
                setServiceRate(rating.serviceRate);
                setFacilityRate(rating.facilityRate);
                setContent(rating.content);
                setImages(rating.imageRatings || []);
            } else {
                Alert.alert('Lỗi', 'Không thể tải thông tin đánh giá');
            }
        } catch (error) {
            console.error('Error fetching rating detail:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        } finally {
            setLoading(false);
        }
    };

    const calculateAverageRating = () => {
        return ((cleaningRate + serviceRate + facilityRate) / 3).toFixed(1);
    };

    const handleUpdateRating = async () => {
        try {
            setUpdating(true);
            const formData = new FormData();
            formData.append('ratingID', ratingID);
            formData.append('cleaningRate', cleaningRate);
            formData.append('serviceRate', serviceRate);
            formData.append('facilityRate', facilityRate);
            formData.append('content', content);
            formData.append('bookingID', ratingDetail.bookingID);
            formData.append('homeStayID', ratingDetail.homeStayID);

            // Thêm các ảnh mới
            newImages.forEach((image, index) => {
                formData.append('imageFiles', {
                    uri: image.uri,
                    type: 'image/jpeg',
                    name: `new_image_${index}.jpg`,
                });
            });

            // KHÔNG xóa ảnh cũ - đã bỏ phần xóa ảnh

            await ratingApi.updateRating(formData);

            Alert.alert('Thành công', 'Cập nhật đánh giá thành công', [
                {
                    text: 'OK', onPress: () => {
                        setEditMode(false);
                        fetchRatingDetail();
                    }
                }
            ]);
        } catch (error) {
            console.error('Error updating rating:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật đánh giá');
        } finally {
            setUpdating(false);
        }
    };

    const handleAddImage = async () => {
        try {
            // Kiểm tra giới hạn tổng số ảnh
            const totalImages = images.length + newImages.length;
            if (totalImages >= 6) {
                Alert.alert('Giới hạn ảnh', 'Bạn chỉ có thể tải lên tối đa 6 ảnh');
                return;
            }

            setUploadingImage(true);
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: 6 - totalImages,
                presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                // Kiểm tra lại để đảm bảo không vượt quá giới hạn
                const newImageCount = result.assets.length;
                if (totalImages + newImageCount > 6) {
                    Alert.alert('Giới hạn ảnh', `Bạn chỉ có thể thêm ${6 - totalImages} ảnh nữa`);
                    const allowedImages = result.assets.slice(0, 6 - totalImages);
                    setNewImages([...newImages, ...allowedImages]);
                } else {
                    setNewImages([...newImages, ...result.assets]);
                }
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveNewImage = (index) => {
        const updatedNewImages = [...newImages];
        updatedNewImages.splice(index, 1);
        setNewImages(updatedNewImages);
    };

    const handleCancel = () => {
        if (ratingDetail) {
            setCleaningRate(ratingDetail.cleaningRate);
            setServiceRate(ratingDetail.serviceRate);
            setFacilityRate(ratingDetail.facilityRate);
            setContent(ratingDetail.content);
            setImages(ratingDetail.imageRatings || []);
            setNewImages([]);
        }
        setEditMode(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải thông tin đánh giá...</Text>
            </View>
        );
    }

    // Xử lý hiển thị ảnh phóng to
    const handleImagePress = (imageUrl) => {
        setExpandedImage(imageUrl);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Header */}
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {editMode ? 'Chỉnh sửa đánh giá' : 'Chi tiết đánh giá'}
                </Text>
                {!editMode && ratingDetail && (
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setEditMode(true)}
                    >
                        <Ionicons name="create-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                )}
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {ratingDetail && (
                    <>
                        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.ratingOverview}>
                            <View style={styles.ratingHeader}>
                                <Animated.View entering={FadeInDown.delay(200)}>
                                    <Text style={styles.overviewTitle}>Đánh giá tổng quan</Text>
                                </Animated.View>
                                <Animated.View entering={ZoomIn.delay(300)} style={styles.rateBadge}>
                                    <Text style={styles.rateBadgeText}>
                                        {editMode ? calculateAverageRating() : ratingDetail.sumRate.toFixed(1)}
                                    </Text>
                                </Animated.View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.detailsCard}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="stats-chart" size={22} color={colors.primary} />
                                <Text style={styles.sectionTitle}>Chi tiết đánh giá</Text>
                            </View>

                            <RatingStars
                                rating={cleaningRate}
                                setRating={setCleaningRate}
                                label="Độ sạch sẽ"
                                disabled={!editMode}
                                icon="broom"
                            />

                            <RatingStars
                                rating={serviceRate}
                                setRating={setServiceRate}
                                label="Dịch vụ"
                                disabled={!editMode}
                                icon="room-service"
                            />

                            <RatingStars
                                rating={facilityRate}
                                setRating={setFacilityRate}
                                label="Tiện nghi"
                                disabled={!editMode}
                                icon="television"
                            />

                            <View style={styles.commentSection}>
                                <View style={styles.commentHeader}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
                                    <Text style={styles.commentLabel}>Nhận xét</Text>
                                </View>

                                {editMode ? (
                                    <TextInput
                                        style={styles.commentInput}
                                        value={content}
                                        onChangeText={setContent}
                                        placeholder="Nhập nhận xét của bạn"
                                        multiline
                                        textAlignVertical="top"
                                    />
                                ) : (
                                    <View style={styles.commentBubble}>
                                        <Text style={styles.commentText}>{ratingDetail.content}</Text>
                                    </View>
                                )}
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.imagesSection}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="images-outline" size={22} color={colors.primary} />
                                <Text style={styles.sectionTitle}>Hình ảnh</Text>
                            </View>

                            <View style={styles.imageGrid}>
                                {/* Hiển thị ảnh hiện có (không xóa được) */}
                                {images.map((image, index) => (
                                    <TouchableOpacity
                                        key={image.imageRatingID}
                                        style={styles.imageContainer}
                                        onPress={() => handleImagePress(image.image)}
                                    >
                                        <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.imageWrapper}>
                                            <Image
                                                source={{ uri: image.image }}
                                                style={styles.image}
                                                resizeMode="cover"
                                            />
                                            <View style={styles.imageOverlay}>
                                                <Text style={styles.imageLabel}>Ảnh {index + 1}</Text>
                                            </View>
                                        </Animated.View>
                                    </TouchableOpacity>
                                ))}

                                {/* Hiển thị ảnh mới đã chọn */}
                                {newImages.map((image, index) => (
                                    <View key={`new-${index}`} style={styles.imageContainer}>
                                        <Animated.View entering={ZoomIn.delay(50)} style={styles.imageWrapper}>
                                            <Image
                                                source={{ uri: image.uri }}
                                                style={styles.image}
                                                resizeMode="cover"
                                            />
                                            <View style={styles.newImageBadge}>
                                                <Text style={styles.newImageText}>Mới</Text>
                                            </View>
                                            {editMode && (
                                                <TouchableOpacity
                                                    style={styles.removeImageButton}
                                                    onPress={() => handleRemoveNewImage(index)}
                                                >
                                                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                                                </TouchableOpacity>
                                            )}
                                        </Animated.View>
                                    </View>
                                ))}

                                {/* Nút thêm ảnh - chỉ hiển thị khi chưa đủ 6 ảnh */}
                                {editMode && (images.length + newImages.length < 6) && (
                                    <TouchableOpacity
                                        style={styles.addImageButton}
                                        onPress={handleAddImage}
                                        disabled={uploadingImage}
                                    >
                                        {uploadingImage ? (
                                            <ActivityIndicator size="small" color={colors.primary} />
                                        ) : (
                                            <>
                                                <Ionicons name="add" size={32} color={colors.primary} />
                                                <Text style={styles.addImageText}>Thêm ảnh</Text>
                                                <Text style={styles.imageCountText}>
                                                    {images.length + newImages.length}/6 ảnh
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </Animated.View>

                        {editMode && (
                            <Animated.View entering={FadeInDown.duration(500)} style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={handleCancel}
                                    disabled={updating}
                                >
                                    <Ionicons name="close-outline" size={20} color="#666" />
                                    <Text style={styles.cancelButtonText}>Hủy</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.saveButton]}
                                    onPress={handleUpdateRating}
                                    disabled={updating}
                                >
                                    {updating ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="save-outline" size={20} color="#fff" />
                                            <Text style={styles.saveButtonText}>Lưu</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Image viewer overlay for expanded image */}
            {expandedImage && (
                <TouchableOpacity
                    style={styles.expandedImageContainer}
                    activeOpacity={1}
                    onPress={() => setExpandedImage(null)}
                >
                    <BlurView intensity={80} style={StyleSheet.absoluteFill} />
                    <TouchableOpacity
                        style={styles.closeExpandedButton}
                        onPress={() => setExpandedImage(null)}
                    >
                        <Ionicons name="close-circle" size={32} color="#fff" />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: expandedImage }}
                        style={styles.expandedImage}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    editButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 30,
    },
    ratingOverview: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    ratingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    overviewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    rateBadge: {
        backgroundColor: colors.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    rateBadgeText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15,
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    ratingContainer: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    ratingLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingIcon: {
        marginRight: 8,
    },
    ratingLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starButton: {
        padding: 3,
    },
    ratingValue: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    commentSection: {
        marginTop: 16,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    commentLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginLeft: 8,
    },
    commentBubble: {
        backgroundColor: '#f0f7ff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e6eeff',
    },
    commentText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        height: 120,
        backgroundColor: '#f9f9f9',
        color: '#333',
        textAlignVertical: 'top',
    },
    imagesSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    imageContainer: {
        width: '33.33%',
        padding: 5,
    },
    imageWrapper: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        height: 120,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 4,
    },
    imageLabel: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '500',
    },
    newImageBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: colors.secondary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderTopLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    newImageText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    removeImageButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 12,
        margin: 4,
    },
    addImageButton: {
        width: '33.33%',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary + '50',
        borderStyle: 'dashed',
        borderRadius: 12,
        margin: 5,
        backgroundColor: '#f9f9f9',
    },
    addImageText: {
        marginTop: 8,
        color: colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    imageCountText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 10,
    },
    actionButton: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    saveButton: {
        backgroundColor: colors.primary,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    expandedImageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    expandedImage: {
        width: width * 0.9,
        height: width * 0.9,
        borderRadius: 16,
    },
    closeExpandedButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1001,
    },
});

export default RatingDetailScreen; 