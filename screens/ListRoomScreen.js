import React from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const RoomCard = ({ image, title, size, guests, beds, breakfast, refund, wifi, price }) => {
    const navigation = useNavigation();
    const handlePress = () => {
        navigation.navigate('DetailRoom', { image, title, size, guests, beds, breakfast, refund, wifi, price })
    }

    return (
        <Animated.View entering={FadeInDown}>
            <TouchableOpacity onPress={handlePress} style={styles.card}>
                <View style={styles.cardHeader}>
                    <Image source={{ uri: image }} style={styles.image} />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'transparent']}
                        style={styles.imageOverlay}
                    />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.title} numberOfLines={2} ellipsizeMode='tail'>{title}</Text>
                    <Text style={styles.size}>{size}</Text>

                    <View style={styles.infoContainer}>
                        <View style={styles.infoRow}>
                            <FontAwesome5 name="user-friends" size={16} color={colors.textSecondary} />
                            <Text style={styles.infoText}>{guests}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <FontAwesome5 name="bed" size={16} color={colors.textSecondary} />
                            <Text style={styles.infoText}>{beds}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialIcons
                                name={breakfast ? "check-circle" : "cancel"}
                                size={16}
                                color={breakfast ? colors.success : colors.error}
                            />
                            <Text style={styles.infoText}>Bữa sáng miễn phí</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialIcons
                                name={refund ? "check-circle" : "cancel"}
                                size={16}
                                color={refund ? colors.success : colors.error}
                            />
                            <Text style={styles.infoText}>Hoàn tiền</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <FontAwesome5 name="wifi" size={16} color={colors.success} />
                            <Text style={styles.infoText}>Wifi miễn phí</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <View>
                            <Text style={styles.priceLabel}>Giá mỗi đêm từ</Text>
                            <Text style={styles.price}>{price.toLocaleString()} ₫</Text>
                        </View>
                        <TouchableOpacity style={styles.button} onPress={(() => navigation.navigate('Checkout'))}>
                            <Text style={styles.buttonText}>Đặt ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const ListRoomScreen = () => {
    const navigation = useNavigation();
    const rooms = [
        {
            image: 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg',
            title: 'Phòng Superior, 2 giường đơn, quang cảnh thành phố',
            size: '240m²',
            guests: '2 người lớn, 1 trẻ em',
            beds: '2 giường đơn, 1 giường cỡ queen',
            breakfast: true,
            refund: false,
            wifi: true,
            price: '550.000'
        },
        {
            image: 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg',
            title: 'Phòng Superior, 2 giường đơn, quang cảnh thành phố',
            size: '240m²',
            guests: '2 người lớn, 1 trẻ em',
            beds: '2 giường đơn, 1 giường cỡ queen',
            breakfast: true,
            refund: false,
            wifi: true,
            price: '576.000'
        },
        {
            image: 'https://amdmodular.com/wp-content/uploads/2021/09/thiet-ke-phong-ngu-homestay-7-scaled.jpg',
            title: 'Phòng Superior, 2 giường đơn, quang cảnh thành phố',
            size: '240m²',
            guests: '2 người lớn, 1 trẻ em',
            beds: '2 giường đơn, 1 giường cỡ queen',
            breakfast: true,
            refund: false,
            wifi: true,
            price: '2.000.000'
        },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, colors.primary + 'E6']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color='#fff' />
                </TouchableOpacity>
                <Text style={styles.headerText} numberOfLines={1}>
                    Danh sách phòng
                </Text>
            </LinearGradient>

            <FlatList
                data={rooms}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => <RoomCard {...item} />}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        ...Platform.select({
            android: {
                elevation: 4,
            },
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
            },
        }),
    },
    cardHeader: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 200,
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    cardContent: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    size: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 16,
    },
    infoContainer: {
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 12,
        fontSize: 14,
        color: colors.textSecondary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    priceLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default ListRoomScreen;
