import React from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/Colors';


const RoomCard = ({ image, title, size, guests, beds, breakfast, refund, wifi, price }) => {
    const navigation = useNavigation();
    const handlePress = () => {
        navigation.navigate('DetailRoom', { image, title, size, guests, beds, breakfast, refund, wifi, price })
    }

    return (
        <View style={styles.card}>
            <TouchableOpacity onPress={handlePress}>
                <View style={styles.header}>
                    <Image source={{ uri: image }} style={styles.image} />
                    <View style={styles.textContainer}>
                        <Text style={styles.title} numberOfLines={2} ellipsizeMode='tail'>{title}</Text>
                        <Text style={styles.size}>{size}</Text>
                    </View>
                </View>
            </TouchableOpacity>
            <View style={styles.content}>
                <View style={styles.infoRow}>
                    <FontAwesome5 name="user-friends" size={16} />
                    <Text style={styles.infoText}>{guests}</Text>
                </View>
                <View style={styles.infoRow}>
                    <FontAwesome5 name="bed" size={16} />
                    <Text style={styles.infoText}>{beds}</Text>
                </View>
                <View style={styles.infoRow}>
                    <MaterialIcons name={breakfast ? "check-circle" : "cancel"} size={16} color={breakfast ? 'green' : 'red'} />
                    <Text style={styles.infoText}>Bữa sáng miễn phí</Text>
                </View>
                <View style={styles.infoRow}>
                    <MaterialIcons name={refund ? "check-circle" : "cancel"} size={16} color={refund ? 'green' : 'red'} />
                    <Text style={styles.infoText}>Không hoàn tiền</Text>
                </View>
                <View style={styles.infoRow}>
                    <FontAwesome5 name="wifi" size={16} color="green" />
                    <Text style={styles.infoText}>Wifi miễn phí</Text>
                </View>
            </View>
            <View style={styles.footer}>
                <Text style={styles.price}>{price} đ / phòng / đêm</Text>
                <TouchableOpacity style={styles.button} onPress={handlePress}>
                    <Text style={styles.buttonText}>Đặt phòng</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const ListRoomScreen = () => {
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
            price: '2.000.000'
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
        }
    ];

    return (
        <FlatList
            data={rooms}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <RoomCard {...item} />}
            contentContainerStyle={styles.list}
        />
    );
};

const styles = StyleSheet.create({
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        flexShrink: 1,
        marginBottom: 10
    },
    size: {
        fontSize: 12,
        color: '#666',
    },
    content: {
        marginTop: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        flexShrink: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    price: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold'
    },
});

export default ListRoomScreen;
