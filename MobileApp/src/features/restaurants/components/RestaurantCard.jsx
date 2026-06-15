import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../../shared/constants/colors';
import { THEME, COMMON_STYLES } from '../../../shared/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Typography from '../../../shared/components/common/Typography';
import useReviewStore from '../../../store/useReviewStore';

const RestaurantCard = ({ restaurant, onPress, isDark = false }) => {
  const { restaurantStats, fetchRestaurantStats } = useReviewStore();
  const id = restaurant._id || restaurant.id;
  const stats = restaurantStats[id];

  useEffect(() => {
    if (id) {
      fetchRestaurantStats(id);
    }
  }, [id]);

  const mainImage = restaurant.photos && restaurant.photos.length > 0
    ? restaurant.photos[0]
    : 'https://via.placeholder.com/400x400?text=Restaurante';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        !isDark && COMMON_STYLES.shadow
      ]}
      onPress={onPress}
    >
      <Image
        source={{ uri: mainImage }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Typography
          variant="bodyBold"
          color={isDark ? COLORS.darkText : COLORS.text}
          numberOfLines={1}
        >
          {restaurant.name}
        </Typography>
        <View style={styles.detailsRow}>
          <Ionicons name="star" size={12} color={COLORS.accent} />
          <Typography
            variant="small"
            color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary}
            style={styles.detailText}
          >
            {stats?.promedioRating ? stats.promedioRating.toFixed(1) : 'Sin calificación'}
          </Typography>
          <View style={[styles.dot, { backgroundColor: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary }]} />
          <Typography
            variant="small"
            color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary}
          >
            {stats?.totalReviews ? `${stats.totalReviews} reseñas` : 'Sin reseñas'}
          </Typography>
        </View>

        {/* Dirección del Restaurante */}
        <View style={styles.addressRow}>
          <Ionicons 
            name="location-outline" 
            size={12} 
            color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary} 
          />
          <Typography
            variant="small"
            color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary}
            numberOfLines={1}
            style={styles.addressText}
          >
            {typeof restaurant.address === 'object' 
              ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}`
              : restaurant.address || 'Dirección no disponible'}
          </Typography>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginRight: 16,
    width: 220,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardLight: {
    backgroundColor: COLORS.white,
  },
  cardDark: {
    backgroundColor: COLORS.darkSurface,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  info: {
    padding: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    marginLeft: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  addressText: {
    marginLeft: 4,
    flex: 1,
  }
});

export default RestaurantCard;
