import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { FontAwesome6, MaterialIcons } from 'react-native-vector-icons';
import { colors } from '../constants/Colors';

const hotelImages = [
    'https://bazantravel.com/cdn/medias/uploads/30/30866-khach-san-imperial-vung-tau-700x438.jpg',
    'https://pix5.agoda.net/hotelimages/161729/-1/c04493606f2d4d81bd0de472e27acd58.jpg',
    'https://halotravel.vn/wp-content/uploads/2020/10/khach-san-imperial-vung-tau-bbb-b-cover.jpg',
];


const SettingScreen = () => {
    const description = `Khách sạn The IMPERIAL Vũng Tàu là khách sạn 5 sao đầu tiên tại khu vực Bãi Sau, một trong những bãi biển đẹp nhất của thành phố. Với lối kiến trúc Victoria cổ điển và quý phái, khách sạn nổi bật như một điểm nhấn thượng lưu giữa lòng phố biển, tôn vinh phong cách sống sang trọng và đẳng cấp.

Tòa nhà cao 7 tầng với 144 phòng nghỉ, mỗi phòng có diện tích từ 40m² đến 270m², được thiết kế theo phong cách Phục Hưng với ban công riêng hướng biển, hồ bơi hoặc thành phố. Nội thất trong phòng được trang trí tinh tế bằng đá hoa cương trắng, đồng, gỗ, thủy tinh và gốm sứ, mang đến không gian hoài cổ sang trọng, gợi nhớ lối sống vương giả thời Victoria.

Khách sạn sở hữu bãi biển riêng dài 100m tại Bãi Sau, cho phép du khách thỏa sức vui chơi và tham gia các hoạt động thể thao sôi động suốt cả ngày. Hệ thống hồ bơi ngoài trời gồm 4 bể lớn, 2 bể trẻ em và một bể sục, được bao quanh bởi không gian xanh mát, tạo nên nơi thư giãn lý tưởng.

Về ẩm thực, The IMPERIAL Vũng Tàu mang đến trải nghiệm đa dạng với các nhà hàng phục vụ món ăn từ nhiều nền văn hóa. Dining Room Restaurant cung cấp các món ăn địa phương và phương Tây, trong khi Seafood Restaurant bên bãi biển chuyên về hải sản tươi ngon. Asia Selection giới thiệu các món Nhật, Thái, Ấn, còn Shifu Chinese Bistro tập trung vào hương vị tinh túy Trung Hoa. Du khách cũng có thể thưởng thức đồ uống tại CLB Havana Club và Lobby Lounge.

Ngoài ra, khách sạn còn có spa sang trọng, phòng gym hiện đại, dịch vụ cho thuê ô tô và chỗ đỗ xe miễn phí. Với vị trí thuận lợi, The IMPERIAL Vũng Tàu cách Tượng Chúa Ki-tô và ngọn Hải Đăng Vũng Tàu chỉ 2,2 km, và cách mũi Nghinh Phong khoảng 2,9 km, rất thuận tiện cho du khách khám phá.

Với sự kết hợp hoàn hảo giữa kiến trúc tinh tế, dịch vụ đẳng cấp và tiện nghi hiện đại, The IMPERIAL Vũng Tàu là điểm đến lý tưởng cho những ai tìm kiếm kỳ nghỉ xa hoa và đáng nhớ.`;

    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <ScrollView style={styles.container}>
                {/* Hình ảnh khách sạn */}
                <FlatList
                    data={hotelImages}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Image source={{ uri: item }} style={styles.hotelImage} />
                    )}
                />

                {/* Thông tin khách sạn */}
                <View style={[styles.section, { marginTop: -50 }]}>
                    <Text style={styles.hotelName}>Khách sạn Imperial Vũng Tàu</Text>
                    <View style={styles.row}>
                        {[...Array(5)].map((_, i) => (
                            <MaterialIcons key={i} name="star" size={18} color="#FFD700" />
                        ))}
                    </View>
                    <View style={styles.row}>
                        <MaterialIcons name="location-on" size={18} color="#666" />
                        <Text style={styles.address}>15 Thi Sách, Vũng Tàu, Việt Nam</Text>
                    </View>
                </View>

                {/* Xếp hạng và đánh giá */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleContainer}>
                        <Text style={styles.sectionTitle}>Xếp hạng & đánh giá</Text>
                        <TouchableOpacity style={{ flexDirection: 'row' }}>
                            <Text style={styles.seeAll}>Xem tất cả </Text>
                            <Text>
                                <FontAwesome6 name="angle-right" size={20} color={colors.primary} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.rating}>8,6</Text>
                        <View>
                            <Text style={styles.reviewText}>Ấn tượng</Text>
                            <Text style={styles.reviewCount}>(286 lượt đánh giá)</Text>
                        </View>
                    </View>
                </View>

                {/* Danh sách đánh giá */}
                <View>
                    <Text style={{ marginLeft: 10 }}>Đánh giá gần đây</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.commentSection}>
                        <View style={styles.commentBox}>
                            <Text style={styles.commentText}>Khách sạn mới và đẹp, gần biển, nhân viên nhiệt tình.</Text>
                            <Text style={styles.commentAuthor}>Nguyen V.A.</Text>
                        </View>
                        <View style={styles.commentBox}>
                            <Text style={styles.commentText}>Khách sạn gần biển, nhân viên thân thiện.</Text>
                            <Text style={styles.commentAuthor}>Tran V.B.</Text>
                        </View>
                    </ScrollView>
                </View>

                {/* Tiện nghi */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tiện nghi</Text>
                    <View style={styles.row}>
                        <Text style={styles.tag}>Nhà hàng</Text>
                        <Text style={styles.tag}>Lễ tân 24h</Text>
                        <Text style={styles.tag}>Hồ bơi</Text>
                        <Text style={styles.tag}>Wifi</Text>
                    </View>
                </View>

                {/* Giờ nhận phòng/trả phòng */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Giờ nhận phòng / trả phòng</Text>
                    <View style={styles.row}>
                        <MaterialIcons name="access-time" size={18} color="#666" />
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>Nhận phòng</Text>
                            <Text style={styles.timeNum}>Từ 14:00</Text>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <MaterialIcons name="access-time" size={18} color="#666" />
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>Trả phòng</Text>
                            <Text style={styles.timeNum}>Trước 11:00</Text>
                        </View>
                    </View>
                </View>

                {/* Mô tả  */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mô tả khách sạn</Text>
                    <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>
                        {description}
                    </Text>
                    <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => setExpanded(!expanded)}>
                        <Text style={styles.seeAll}>{expanded ? "Thu gọn" : "Xem thêm"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView >
            {/* Giá phòng */}
            <View style={styles.bookButtonContainer}>
                <View>
                    <Text style={styles.priceText}>Giá bắt đầu từ</Text>
                    <Text style={styles.price}>576.000 VNĐ</Text>
                    <Text style={styles.taxText}>Tổng giá 654.000 VNĐ bao gồm thuế và phí</Text>
                </View>
                <TouchableOpacity style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Chọn phòng</Text>
                </TouchableOpacity>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    hotelImage: {
        width: 414,
        height: 300,
    },
    infoContainer: {
        padding: 15,
    },
    hotelName: {
        fontSize: 23,
        fontWeight: 'bold',
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    address: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginRight: 5,
    },
    reviewText: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
    },
    reviewCount: {
        fontSize: 12,
        color: '#666',
    },
    commentSection: {
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    commentBox: {
        backgroundColor: '#EFEFEF',
        padding: 10,
        borderRadius: 10,
        marginRight: 10,
    },
    commentText: {
        fontSize: 14,
        color: '#333',
    },
    commentAuthor: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        fontWeight: 'bold',
    },
    section: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginHorizontal: 5,
        marginBottom: 10,
        shadowColor: 'rgba(100, 100, 111, 0.3)',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 1,
        shadowRadius: 29,
        elevation: 7,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 10,
    },
    tag: {
        backgroundColor: '#E0E0E0',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginRight: 10,
        fontSize: 14,
        color: '#333',
    },
    timeContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 5
    },
    timeText: {
        fontSize: 15,
        color: '#666',
    },
    timeNum: {
        fontSize: 17,
        color: colors.textPrimary,
        fontWeight: 'bold'
    },
    bookButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 25,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
    },
    priceText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    taxText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
        fontWeight: 'bold'
    },
    bookButton: {
        backgroundColor: colors.primary,
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 10,
        alignItems: 'center',
    },
    bookButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    description: {
        fontSize: 16,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    seeAll: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default SettingScreen;
