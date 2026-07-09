import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { COLORS } from '../../constants/colors';

const Skeleton = ({ width, height, borderRadius, style, isDark = true }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const backgroundColor = isDark ? COLORS.darkSurface : '#E1E9EE';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius || 8,
          backgroundColor,
          opacity,
        },
        style,
      ]}
    />
  );
};

export default Skeleton;
