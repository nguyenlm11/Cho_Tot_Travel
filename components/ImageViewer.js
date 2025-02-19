import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Dimensions, FlatList, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageZoom from 'react-native-image-pan-zoom';
import { Image } from 'react-native';

const { width, height } = Dimensions.get('window');

const ImageViewer = ({ visible, images = [], initialIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Reset currentIndex when modal opens
    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
        }
    }, [visible, initialIndex]);

    const renderImage = ({ item }) => (
        <ImageZoom
            cropWidth={width}
            cropHeight={height}
            imageWidth={width}
            imageHeight={height}
        >
            <Image
                source={{ uri: item }}
                style={styles.image}
                resizeMode="contain"
            />
        </ImageZoom>
    );

    return (
        <Modal visible={visible} transparent={true} animationType="fade">
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                >
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>

                <FlatList
                    data={images}
                    renderItem={renderImage}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={initialIndex}
                    getItemLayout={(data, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                    onMomentumScrollEnd={(event) => {
                        const newIndex = Math.floor(event.nativeEvent.contentOffset.x / width);
                        setCurrentIndex(newIndex);
                    }}
                />

                {images.length > 1 && (
                    <View style={styles.pagination}>
                        <Text style={styles.paginationText}>
                            {currentIndex + 1} / {images.length}
                        </Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
    },
    image: {
        width: width,
        height: height,
    },
    pagination: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 15,
    },
    paginationText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default ImageViewer; 