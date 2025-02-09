import React from 'react';
import { View, Text, Image, FlatList, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome } from 'react-native-vector-icons';
import { colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';

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

    return (
        <>
            <ScrollView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={25} color='#000' />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Xếp hạng & đánh giá</Text>
                </View>

                {/* Traveloka Section */}
                <View style={styles.travelokaSection}>
                    <Text style={styles.travelokaTitle}>24 đánh giá</Text>
                    <Text style={styles.travelokaScore}>8.7<Text style={{ color: colors.textSecondary, fontSize: 20 }}>/10</Text></Text>
                </View>

                {/* Ratings Breakdown */}
                <View style={styles.ratingsContainer}>
                    <View style={styles.column}>
                        {[
                            { label: 'Vệ sinh', score: 8.6 },
                            { label: 'Đồ ăn', score: 9.0 },
                        ].map((item, index) => (
                            <View key={index} style={styles.ratingItem}>
                                <Text style={styles.ratingLabel}>
                                    {item.label}: <Text style={styles.boldText}>{item.score}</Text>
                                </Text>
                                <View style={styles.ratingBar}>
                                    <View style={[styles.ratingFill, { width: `${item.score * 10}%` }]} />
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.column}>
                        {[
                            { label: 'Tiện nghi phòng', score: 8.4 },
                            { label: 'Dịch vụ và Tiện ích', score: 8.5 },
                        ].map((item, index) => (
                            <View key={index} style={styles.ratingItem}>
                                <Text style={styles.ratingLabel}>
                                    {item.label}: <Text style={styles.boldText}>{item.score}</Text>
                                </Text>
                                <View style={styles.ratingBar}>
                                    <View style={[styles.ratingFill, { width: `${item.score * 10}%` }]} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Review List */}
                <View style={styles.title}>
                    <Text style={styles.titleText}>Đánh giá của khách hàng</Text>
                </View>
                <FlatList
                    data={reviews}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                        <View style={styles.reviewContainer}>
                            <View style={styles.reviewHeader}>
                                <Image source={{ uri: 'https://th.bing.com/th/id/OIP.F977i9e7dMrznvOT8q8azgHaEf?w=1920&h=1164&rs=1&pid=ImgDetMain' }} style={styles.userIcon} />
                                <View style={styles.userInfo}>
                                    <View style={styles.userRating}>
                                        <Text style={styles.userName}>{item.name}</Text>
                                        <Text style={styles.reviewDate}>{item.date}</Text>
                                    </View>
                                    <View style={styles.ratingContainer}>
                                        <Text style={styles.ratingScore}>{item.rating}</Text>
                                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}> / 10.0</Text>
                                    </View>
                                </View>
                            </View>
                            {item.comment ? <Text style={styles.commentText}>{item.comment}</Text> : null}
                        </View>
                    )}
                />
            </ScrollView>

            {/* Filter Options */}
            <View style={{ backgroundColor: '#fff' }}>
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

                {/* Footer Button */}
                <TouchableOpacity style={styles.footerButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.footerButtonText}>Xem Thông tin khách sạn</Text>
                </TouchableOpacity>
            </View >
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 50,
        padding: 16,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 90
    },
    travelokaSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#E1F3D8',
        padding: 16,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        marginHorizontal: 4,
    },
    travelokaTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textSecondary
    },
    travelokaScore: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.primary,
    },
    ratingsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 16,
        marginHorizontal: 10,
        padding: 12,
        shadowColor: '#aaa',
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: '#ffffff',
        borderRadius: 10,
    },
    column: {
        flex: 1,
        marginHorizontal: 8
    },
    ratingItem: {
        marginBottom: 10
    },
    ratingLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    boldText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    ratingBar: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        marginTop: 5,
        overflow: 'hidden'
    },
    ratingFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 3
    },
    title: {
        marginHorizontal: 10,
        marginTop: 10,
        marginBottom: 16,
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    reviewContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    userIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0E0E0'
    },
    userInfo: {
        marginLeft: 10
    },
    userName: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    userRating: {
        width: '94%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingScore: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 20,
    },
    reviewDate: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    commentText: {
        marginTop: 8,
        fontSize: 18
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        marginVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderColor: '#E0E0E0',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: colors.primary
    },
    filterText: {
        marginLeft: 8,
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.primary,
    },
    footerButton: {
        backgroundColor: '#E1F3D8',
        padding: 16,
        marginBottom: 10,
        marginHorizontal: 16,
        borderRadius: 30,
        alignItems: 'center'
    },
    footerButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
});


