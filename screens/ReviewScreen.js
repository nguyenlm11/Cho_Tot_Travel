import React from 'react';
import { View, Text, Image, FlatList, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const reviews = [
    { id: '1', name: 'N***n', rating: 8.8, comment: 'Nhân viên nhiệt tình và thân thiện', likes: 2, date: 'Đánh giá tháng 9 2024' },
    { id: '2', name: 'P***n', rating: 8.7, comment: 'Máy lạnh hơi cũ, phòng có mùi hơi ẩm', likes: 1, date: 'Đánh giá tháng 9 2024' },
    { id: '3', name: 'Nhu P.', rating: 8.4, comment: '', likes: 0, date: 'Đánh giá tháng 8 2024' },
    { id: '4', name: 'P***n', rating: 8.7, comment: 'Máy lạnh hơi cũ, phòng có mùi hơi ẩm', likes: 1, date: 'Đánh giá tháng 9 2024' },
    { id: '5', name: 'P***n', rating: 8.7, comment: 'Máy lạnh hơi cũ, phòng có mùi hơi ẩm', likes: 1, date: 'Đánh giá tháng 9 2024' },
    { id: '6', name: 'P***n', rating: 8.7, comment: 'Máy lạnh hơi cũ, phòng có mùi hơi ẩm', likes: 1, date: 'Đánh giá tháng 9 2024' },
];

export default function ReviewScreen() {
    const navigation = useNavigation();

    const renderRatingBar = ({ label, score }) => (
        <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>
                {label}: <Text style={styles.boldText}>{score}</Text>
            </Text>
            <LinearGradient
                colors={[colors.primary, colors.primary + '80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.ratingBar, { width: `${score * 10}%` }]}
            />
            <View style={styles.ratingBarBackground} />
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, colors.primary + 'E6']}
                style={styles.header}
            >
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Xếp hạng & đánh giá</Text>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.travelokaSection}>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.totalReviews}>24 đánh giá</Text>
                        <View style={styles.scoreBox}>
                            <Text style={styles.score}>8.7</Text>
                            <Text style={styles.maxScore}>/10</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.ratingsContainer}>
                    <View style={styles.column}>
                        {[
                            { label: 'Vệ sinh', score: 8.6 },
                            { label: 'Đồ ăn', score: 9.0 },
                        ].map((item, index) => (
                            <View key={`rating-1-${index}`}>
                                {renderRatingBar(item)}
                            </View>
                        ))}
                    </View>

                    <View style={styles.column}>
                        {[
                            { label: 'Tiện nghi phòng', score: 8.4 },
                            { label: 'Dịch vụ và Tiện ích', score: 8.5 },
                        ].map((item, index) => (
                            <View key={`rating-2-${index}`}>
                                {renderRatingBar(item)}
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>Đánh giá của khách hàng</Text>
                    <FlatList
                        data={reviews}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        renderItem={({ item, index }) => (
                            <Animated.View 
                                entering={FadeInDown.delay(index * 100)}
                                style={styles.reviewCard}
                            >
                                <View style={styles.reviewHeader}>
                                    <Image 
                                        source={{ uri: 'https://th.bing.com/th/id/OIP.F977i9e7dMrznvOT8q8azgHaEf?w=1920&h=1164&rs=1&pid=ImgDetMain' }} 
                                        style={styles.avatar} 
                                    />
                                    <View style={styles.reviewInfo}>
                                        <View style={styles.nameContainer}>
                                            <Text style={styles.userName}>{item.name}</Text>
                                            <Text style={styles.reviewDate}>{item.date}</Text>
                                        </View>
                                        <View style={styles.ratingContainer}>
                                            <Text style={styles.ratingScore}>{item.rating}</Text>
                                            <Text style={styles.ratingMax}>/10</Text>
                                        </View>
                                    </View>
                                </View>
                                {item.comment && (
                                    <Text style={styles.commentText}>{item.comment}</Text>
                                )}
                                <View style={styles.reviewActions}>
                                    <TouchableOpacity style={styles.likeButton}>
                                        <Ionicons name="heart-outline" size={20} color={colors.primary} />
                                        <Text style={styles.likeCount}>{item.likes}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.replyButton}>
                                        <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                                        <Text style={styles.replyText}>Trả lời</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        )}
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.filterContainer}>
                    <TouchableOpacity style={styles.filterButton}>
                        <FontAwesome name="sort" size={16} color={colors.primary} />
                        <Text style={styles.filterText}>Gần đây nhất</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterButton}>
                        <FontAwesome name="filter" size={16} color={colors.primary} />
                        <Text style={styles.filterText}>Lọc</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    style={styles.footerButton} 
                    onPress={() => navigation.goBack()}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primary + 'E6']}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.footerButtonText}>
                            Xem Thông tin khách sạn
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
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
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        marginRight: 15,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    travelokaSection: {
        backgroundColor: '#E1F3D8',
        padding: 20,
    },
    scoreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalReviews: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    scoreBox: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    score: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
    },
    maxScore: {
        fontSize: 20,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    ratingsContainer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        margin: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    column: {
        flex: 1,
        marginHorizontal: 8,
    },
    ratingItem: {
        marginBottom: 15,
    },
    ratingLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    boldText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    ratingBar: {
        height: 6,
        borderRadius: 3,
        position: 'absolute',
        bottom: 0,
    },
    ratingBarBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        zIndex: -1,
    },
    reviewsSection: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    reviewInfo: {
        flex: 1,
        marginLeft: 12,
    },
    nameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    reviewDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 4,
    },
    ratingScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    ratingMax: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    commentText: {
        fontSize: 15,
        color: colors.textPrimary,
        marginTop: 12,
        lineHeight: 22,
    },
    reviewActions: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    likeCount: {
        marginLeft: 6,
        color: colors.primary,
        fontSize: 14,
    },
    replyButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    replyText: {
        marginLeft: 6,
        color: colors.primary,
        fontSize: 14,
    },
    footer: {
        backgroundColor: '#fff',
        paddingTop: 10,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    filterText: {
        marginLeft: 8,
        color: colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    footerButton: {
        marginHorizontal: 15,
        borderRadius: 25,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    footerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});


