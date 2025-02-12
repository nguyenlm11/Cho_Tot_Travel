import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const data = [
    {
        id: '1',
        title: 'Dễ dàng đặt phòng\nchỉ với vài chạm',
        description: 'Tìm kiếm và đặt phòng nhanh chóng, tiện lợi với giao diện thân thiện.',
        image: 'https://images.unsplash.com/photo-1553444862-65de13a9e728?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMjA3fDB8MXxzZWFyY2h8M3x8aG9tZXN0YXl8fDB8fHx8MTYyNzkwODUxNg&ixlib=rb-1.2.1&q=80&w=1080',
    },
    {
        id: '2',
        title: 'Khám phá điểm đến\nthú vị',
        description: 'Hàng nghìn lựa chọn homestay độc đáo đang chờ đón bạn khám phá.',
        image: 'https://d1hy6t2xeg0mdl.cloudfront.net/image/682839/deb5670ab2/1024-width',
    },
    {
        id: '3',
        title: 'Ưu đãi hấp dẫn\nđang chờ bạn',
        description: 'Tận hưởng những ưu đãi độc quyền và giá tốt nhất cho chuyến đi của bạn.',
        image: 'https://d1hy6t2xeg0mdl.cloudfront.net/image/682841/9e94f848f1/standard',
    },
];

const OnboardingScreen = ({ navigation }) => {
    const flatListRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const renderItem = ({ item, index }) => (
        <View style={[styles.itemContainer, { width }]}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            />
            
            <Animated.View 
                entering={FadeInRight.delay(index * 100)}
                style={styles.contentContainer}
            >
                <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </BlurView>
            </Animated.View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" />
            
            <FlatList
                ref={flatListRef}
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            <Animated.View 
                entering={FadeIn}
                style={styles.footer}
            >
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

                <View style={styles.buttonContainer}>
                    {currentIndex !== data.length - 1 && (
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('MainTabs')}
                            style={styles.skipButton}
                        >
                            <Text style={styles.skipButtonText}>Bỏ qua</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={() => {
                            if (currentIndex < data.length - 1) {
                                flatListRef.current?.scrollToIndex({
                                    index: currentIndex + 1,
                                    animated: true,
                                });
                            } else {
                                navigation.navigate('MainTabs');
                            }
                        }}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.primary + 'CC']}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.nextButtonText}>
                                {currentIndex === data.length - 1 ? 'Bắt đầu' : 'Tiếp theo'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    itemContainer: {
        flex: 1,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
    },
    contentContainer: {
        position: 'absolute',
        bottom: 150,
        left: 20,
        right: 20,
    },
    blurContainer: {
        padding: 20,
        borderRadius: 20,
        overflow: 'hidden',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
        lineHeight: 40,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 24,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: colors.primary,
        width: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    skipButton: {
        padding: 15,
    },
    skipButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        flex: 1,
        marginLeft: 20,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
    },
    gradientButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default OnboardingScreen;
