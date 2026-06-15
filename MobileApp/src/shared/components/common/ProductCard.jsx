import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../shared/constants/colors';
import { THEME, COMMON_STYLES } from '../../../shared/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Typography from './Typography';
import useReviewStore from '../../../store/useReviewStore';

const ProductCard = ({ product, onPress, isDark = false }) => {
  const { productStats } = useReviewStore();
  const id = product._id || product.id;
  const stats = productStats[id];

  const mainImage = product.image 
    ? product.image 
    : 'https://via.placeholder.com/150?text=Producto';

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isDark ? styles.containerDark : styles.containerLight,
        !isDark && COMMON_STYLES.shadow
      ]} 
      onPress={onPress}
    >
      <Image source={{ uri: mainImage }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Typography 
            variant="bodyBold" 
            color={isDark ? COLORS.darkText : COLORS.text} 
            numberOfLines={1} 
            style={styles.name}
          >
            {product.name}
          </Typography>
          <Typography 
            variant="bodyBold" 
            color={COLORS.primary} 
            style={styles.price}
          >
            Q {product.price.toFixed(2)}
          </Typography>
        </View>
        <Typography 
          variant="small" 
          color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary} 
          numberOfLines={2} 
          style={styles.description}
        >
          {product.description || 'Sin descripción disponible'}
        </Typography>
        <View style={styles.footer}>
          <View style={styles.leftFooter}>
            <View style={[styles.tag, { backgroundColor: isDark ? '#334155' : COLORS.background }]}>
              <Text style={[styles.tagText, { color: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary }]}>
                {product.category?.name || 'Comida'}
              </Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={10} color={COLORS.accent} />
              <Text style={[styles.ratingText, { color: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary }]}>
                {stats?.promedioRating ? stats.promedioRating.toFixed(1) : 'Sin calificación'}
              </Text>
            </View>
          </View>
          <View style={styles.restaurantInfo}>
            <Ionicons 
              name="restaurant-outline" 
              size={12} 
              color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary} 
            />
            <Text 
              style={[
                styles.restaurantName, 
                { color: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary }
              ]} 
              numberOfLines={1}
            >
              {product.restaurant?.name || 'Restaurante'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    height: 120,
  },
  containerLight: {
    backgroundColor: COLORS.white,
  },
  containerDark: {
    backgroundColor: COLORS.darkSurface,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    margin: 10,
  },
  content: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 14,
  },
  description: {
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
    justifyContent: 'flex-end',
  },
  restaurantName: {
    fontSize: 10,
    marginLeft: 4,
    maxWidth: 80,
  },
});

export default ProductCard;
