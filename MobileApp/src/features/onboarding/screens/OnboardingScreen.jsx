import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import useAuthStore from '../../../store/useAuthStore';

const slides = [
  {
    id: '1',
    title: 'Descubre los mejores sabores',
    description: 'Explora cientos de restaurantes cerca de ti y pide tu comida favorita con unos pocos toques.',
    icon: 'silverware-fork-knife',
    backgroundColor: '#FF6B00',
    circleColor: 'rgba(255, 255, 255, 0.2)',
    circleColor2: 'rgba(255, 255, 255, 0.1)',
  },
  {
    id: '2',
    title: 'Reservaciones fáciles y rápidas',
    description: 'Elige fecha, hora y número de personas. Facil y rápido.',
    icon: 'calendar',
    backgroundColor: '#6C63FF',
    circleColor: 'rgba(255, 255, 255, 0.2)',
    circleColor2: 'rgba(255, 255, 255, 0.1)',
  },
  {
    id: '3',
    title: 'Entregas rápidas hasta tu puerta',
    description: 'Solo pide y recibe tu comida en casa.',
    icon: 'motorcycle',
    backgroundColor: '#4CAF50',
    circleColor: 'rgba(255, 255, 255, 0.2)',
    circleColor2: 'rgba(255, 255, 255, 0.1)',
  },
];

const OnboardingScreen = () => {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  const setHasSeenOnboarding = useAuthStore((state) => state.setHasSeenOnboarding);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      setHasSeenOnboarding(true);
    }
  };

  const handleSkip = () => {
    setHasSeenOnboarding(true);
  };

  const renderItem = ({ item }) => {
    return (
      <View style={[styles.slideContainer, { width }]}>
        <View style={[styles.topSection, { backgroundColor: item.backgroundColor }]}>
          <View style={[styles.circle2, { backgroundColor: item.circleColor2, position: 'absolute', bottom: 50, left: 30 }]} />
          <View style={[styles.circle, { backgroundColor: item.circleColor }]}>
            {item.icon === 'motorcycle' ? (
              <FontAwesome6 name={item.icon} size={80} color="white" />)
            : (
              <MaterialCommunityIcons name={item.icon} size={80} color="white" />
            )}
          </View>
          <View style={[styles.circle3, { backgroundColor: item.circleColor2, position: 'absolute', top: 30, right: 10 }]} />
        </View>
        <View style={styles.bottomSection}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 3 }}>
        <FlatList
          data={slides}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 20, 10],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i.toString()}
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: COLORS.primary }]}
              />
            );
          })}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? '¡Comenzar!' : 'Siguiente'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  slideContainer: {
    flex: 1,
  },
  topSection: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  circle: {
    width: 240,
    height: 240,
    borderRadius: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle2: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle3: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    height: 180,
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 40,
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

export default OnboardingScreen;
