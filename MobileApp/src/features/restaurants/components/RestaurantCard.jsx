import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../../shared/constants/colors';
import { THEME, COMMON_STYLES } from '../../../shared/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const RestaurantCard = ({ restaurant, onPress }) => {
  // Obtenemos la primera foto del array o usamos un placeholder
  const mainImage = restaurant.photos && restaurant.photos.length > 0 
    ? restaurant.photos[0] 
    : 'https://via.placeholder.com/400x400?text=Restaurante';

  return (
    <TouchableOpacity style={[styles.card, COMMON_STYLES.shadow]} onPress={onPress}>
      <Image 
        source={{ uri: mainImage }} 
        style={styles.image}
      />
      <View style={styles.overlay}>
        <View style={styles.rating}>
          <Ionicons name="star" size={12} color={COLORS.accent} />
          <Text style={styles.ratingText}>{restaurant.rating || '4.5'}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.category} numberOfLines={1}>{restaurant.category || 'Categoría'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: THEME.borderRadius.lg,
    marginRight: 16,
    width: 160,
    height: 180,
    overflow: 'hidden',
    marginBottom: 8, // Para la sombra
  },
  image: {
    width: '100%',
    height: 120,
  },
  overlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.sm,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
    color: COLORS.text,
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  category: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  }
});

export default RestaurantCard;