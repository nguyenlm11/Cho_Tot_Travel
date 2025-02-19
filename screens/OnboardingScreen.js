import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInRight, FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const data = [
    {
        id: '1',
        title: 'Dễ dàng đặt phòng\nchỉ với vài chạm',
        description: 'Tìm kiếm và đặt phòng nhanh chóng, tiện lợi với giao diện thân thiện.',
        image: 'https://images.unsplash.com/photo-1553444862-65de13a9e728',
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
                entering={FadeInRight.delay(index * 100).springify()}
                style={styles.contentContainer}
            >
                <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </BlurView>
            </Animated.View>
        </View>
    );

    const handleNext = () => {
        if (currentIndex < data.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            navigation.replace('Login');
        }
    };

    const handleSkip = () => {
        navigation.replace('Login');
    };

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
                decelerationRate="fast"
            />

            <Animated.View 
                entering={FadeInDown.delay(500).springify()}
                style={styles.footer}
            >
                <View style={styles.pagination}>
                    {data.map((_, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeIn.delay(index * 100)}
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
                            onPress={handleSkip}
                            style={styles.skipButton}
                        >
                            <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                                <Text style={styles.skipButtonText}>Bỏ qua</Text>
                            </BlurView>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleNext}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.primary + 'CC']}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.nextButtonText}>
                                {currentIndex === data.length - 1 ? 'Bắt đầu' : 'Tiếp theo'}
                            </Text>
                            <MaterialIcons 
                                name="arrow-forward" 
                                size={24} 
                                color="#fff" 
                                style={styles.arrowIcon}
                            />
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
        height: '70%',
    },
    contentContainer: {
        position: 'absolute',
        bottom: 180,
        left: 20,
        right: 20,
    },
    blurContainer: {
        padding: 24,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        lineHeight: 40,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 24,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
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
        overflow: 'hidden',
        borderRadius: 28,
    },
    blurButton: {
        padding: 16,
        paddingHorizontal: 24,
    },
    skipButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        flex: 1,
        marginLeft: 16,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
    },
    gradientButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    arrowIcon: {
        marginLeft: 4,
    },
});

export default OnboardingScreen;
