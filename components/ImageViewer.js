import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Image, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/Ionicons';
import { MaterialIcons } from 'react-native-vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { FlatList } from 'react-native-gesture-handler';
import { colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

const ImageViewer = ({ visible, images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = React.useRef(null);

  React.useEffect(() => {
    if (visible && flatListRef.current && initialIndex) {
      flatListRef.current.scrollToIndex({
        index: initialIndex,
        animated: false,
      });
    }
    setCurrentIndex(initialIndex);
  }, [visible, initialIndex]);

  const handleViewableItemsChanged = React.useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item.uri }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Animated.View 
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <BlurView intensity={80} tint="dark" style={styles.blurButton}>
              <Icon name="close" size={22} color="#fff" />
            </BlurView>
          </TouchableOpacity>
          
          <View style={styles.indexContainer}>
            <BlurView intensity={80} tint="dark" style={styles.indexBlur}>
              <Text style={styles.indexText}>
                {currentIndex + 1} / {images.length}
              </Text>
            </BlurView>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderItem}
          keyExtractor={(_, index) => `image-${index}`}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />

        {/* Next/Prev Buttons */}
        {currentIndex > 0 && (
          <TouchableOpacity 
            style={[styles.navButton, styles.prevButton]}
            onPress={() => {
              flatListRef.current?.scrollToIndex({
                index: currentIndex - 1,
                animated: true,
              });
            }}
          >
            <BlurView intensity={80} tint="dark" style={styles.blurNav}>
              <MaterialIcons name="chevron-left" size={34} color="#fff" />
            </BlurView>
          </TouchableOpacity>
        )}
        
        {currentIndex < images.length - 1 && (
          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton]}
            onPress={() => {
              flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
              });
            }}
          >
            <BlurView intensity={80} tint="dark" style={styles.blurNav}>
              <MaterialIcons name="chevron-right" size={34} color="#fff" />
            </BlurView>
          </TouchableOpacity>
        )}

        {/* Thumbnails */}
        <View style={styles.thumbnailsContainer}>
          <BlurView intensity={80} tint="dark" style={styles.thumbnailsBlur}>
            <FlatList
              data={images}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  style={[
                    styles.thumbnail,
                    currentIndex === index && styles.activeThumbnail
                  ]}
                  onPress={() => {
                    flatListRef.current?.scrollToIndex({
                      index,
                      animated: true,
                    });
                  }}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(_, index) => `thumb-${index}`}
              contentContainerStyle={{ paddingHorizontal: 10 }}
            />
          </BlurView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 15,
    paddingBottom: 15,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  indexContainer: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  indexBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  indexText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height * 0.7,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    zIndex: 10,
    borderRadius: 25,
    overflow: 'hidden',
  },
  prevButton: {
    left: 10,
  },
  nextButton: {
    right: 10,
  },
  blurNav: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    borderRadius: 12,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  thumbnailsBlur: {
    paddingVertical: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginHorizontal: 5,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});

export default ImageViewer; 