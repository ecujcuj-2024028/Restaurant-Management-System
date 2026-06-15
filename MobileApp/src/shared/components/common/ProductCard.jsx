import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../shared/constants/colors';
import { THEME, COMMON_STYLES } from '../../../shared/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const ProductCard = ({ product, onPress }) => {
  const mainImage = product.image 
    ? product.image 
    : 'https://via.placeholder.com/150?text=Producto';

  return (
    <TouchableOpacity style={[styles.container, COMMON_STYLES.shadow]} onPress={onPress}>
      <Image source={{ uri: mainImage }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.price}>Q {product.price.toFixed(2)}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {product.description || 'Sin descripción disponible'}
        </Text>
        <View style={styles.footer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{product.category?.name || 'Comida'}</Text>
          </View>
          <View style={styles.restaurantInfo}>
            <Ionicons name="restaurant-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.restaurantName} numberOfLines={1}>
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
    backgroundColor: COLORS.white,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
    overflow: 'hidden',
    height: 110,
  },
  image: {
    width: 110,
    height: 110,
  },
  content: {
    flex: 1,
    padding: THEME.spacing.sm,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: THEME.spacing.xs,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  tag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.sm,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
    justifyContent: 'flex-end',
  },
  restaurantName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
    maxWidth: 80,
  },
});

export default ProductCard;