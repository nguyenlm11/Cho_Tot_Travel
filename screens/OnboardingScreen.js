import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    FlatList,
    TouchableOpacity,
    Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const data = [
    {
        id: '1',
        title: 'Dễ dàng để đặt phòng với chúng tôi',
        description: 'It is a long established fact that a reader will be distracted by the readable content.',
        image: 'https://images.unsplash.com/photo-1553444862-65de13a9e728?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMjA3fDB8MXxzZWFyY2h8M3x8aG9tZXN0YXl8fDB8fHx8MTYyNzkwODUxNg&ixlib=rb-1.2.1&q=80&w=1080',
    },
    {
        id: '2',
        title: 'Khám phá và tìm nơi nghỉ ngơi lý tưởng',
        description: 'It is a long established fact that a reader will be distracted by the readable content.',
        image: 'https://d1hy6t2xeg0mdl.cloudfront.net/image/682839/deb5670ab2/1024-width',
    },
    {
        id: '3',
        title: 'Mang đến cho bạn những ưu đãi tốt nhất',
        description: 'It is a long established fact that a reader will be distracted by the readable content.',
        image: 'https://d1hy6t2xeg0mdl.cloudfront.net/image/682841/9e94f848f1/standard',
    },
];

const OnboardingScreen = ({ navigation }) => {
    const flatListRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (currentIndex < data.length - 1) {
            flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            navigation.navigate('MainTabs');
        }
    };

    const handleSkip = () => {
        navigation.navigate('MainTabs');
    };

    const onScroll = (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const renderItem = ({ item }) => (
        <View style={[styles.itemContainer, { width }]}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.pagination}>
                {data.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentIndex === index && styles.activeDot,
                        ]}
                    />
                ))}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                ref={flatListRef}
                onScroll={onScroll}
            />
            <View style={[styles.footer, { justifyContent: currentIndex !== data.length - 1 ? 'space-between' : 'center' }]}>
                {currentIndex !== data.length - 1 &&
                    <TouchableOpacity onPress={handleSkip}>
                        <Text style={styles.skipButton}>Bỏ qua</Text>
                    </TouchableOpacity>
                }

                <TouchableOpacity onPress={handleNext}>
                    <View style={styles.nextButton}>
                        <Text style={styles.nextButtonText}>
                            {currentIndex === data.length - 1 ? 'Bắt đầu' : 'Tiếp theo'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    itemContainer: {
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: height * 0.65,
        resizeMode: 'cover',
        marginBottom: 15,
    },
    title: {
        fontSize: 45,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 15,
        padding: 5,
    },
    description: {
        fontSize: 18,
        color: '#888',
        textAlign: 'center',
        marginHorizontal: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    skipButton: {
        fontSize: 16,
        color: '#888',
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ddd',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#30B53E',
    },
    nextButton: {
        backgroundColor: '#30B53E',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default OnboardingScreen;
