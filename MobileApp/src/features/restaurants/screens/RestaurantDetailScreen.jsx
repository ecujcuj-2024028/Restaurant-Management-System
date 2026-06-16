import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  Image,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import { THEME, COMMON_STYLES } from '../../../shared/constants/theme';
import { getRestaurantById } from '../../../api/restaurants';
import api from '../../../api/api';
import useAuthStore from '../../../store/useAuthStore';
import Typography from '../../../shared/components/common/Typography';
 
// Llama a GET /restaurants/{id}/menu
const getRestaurantMenu = async (id) => {
  const response = await api.get(`/restaurants/${id}/menu`);
  return response.data;
};
 
// Agrupa el array de productos por su campo `category`
const groupByCategory = (products = []) => {
  const map = {};
  products.forEach((product) => {
    const key = product.category?.name || product.category || 'Sin categoría';
    if (!map[key]) map[key] = [];
    map[key].push(product);
  });
  return Object.entries(map).map(([title, data]) => ({ title, data }));
};
 
// ── Componente para cada producto dentro de una sección ──
const ProductRow = ({ item, isDark }) => (
  <View style={[styles.productCard, { backgroundColor: isDark ? COLORS.darkSurface : COLORS.white, borderBottomColor: isDark ? COLORS.darkBorder : COLORS.border }]}>
    <View style={styles.productInfo}>
      <Typography variant="bodyBold" color={isDark ? COLORS.darkText : COLORS.text}>{item.name}</Typography>
      <Typography variant="small" color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary} numberOfLines={2}>
        {item.description || 'Sin descripción disponible.'}
      </Typography>
      <View style={styles.productMeta}>
        <Typography variant="bodyBold" color={COLORS.primary}>${item.price?.toFixed(2)}</Typography>
        {item.preparationTime && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={12} color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary} />
            <Typography variant="small" color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary}>{item.preparationTime} min</Typography>
          </View>
        )}
        {!item.isAvailable && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Agotado</Text>
          </View>
        )}
      </View>
    </View>
    <Image
      source={{
        uri: item.image || 'https://via.placeholder.com/100?text=Plato',
      }}
      style={[styles.productImage, !item.isAvailable && styles.imageUnavailable]}
    />
  </View>
);
 
// ── Cabecera del restaurante (se usa como ListHeaderComponent) ──
const RestaurantHeader = ({ restaurant, isDark }) => (
  <View>
    <Image
      source={{
        uri: restaurant?.imageUrl || 'https://via.placeholder.com/400x200?text=Restaurante',
      }}
      style={styles.heroImage}
    />
    <View style={[styles.info, { backgroundColor: isDark ? COLORS.darkSurface : COLORS.white }]}>
      <Typography variant="h2" color={isDark ? COLORS.darkText : COLORS.text}>{restaurant?.name}</Typography>
      <Typography color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary} style={{ marginBottom: 12 }}>{restaurant?.category}</Typography>
 
      <View style={styles.detailsRow}>
        {restaurant?.openingHours && (
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} />
            <Typography variant="small" color={isDark ? COLORS.darkText : COLORS.text}>{restaurant.openingHours}</Typography>
          </View>
        )}
        {restaurant?.address && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            <Typography variant="small" color={isDark ? COLORS.darkText : COLORS.text}>{restaurant.address}</Typography>
          </View>
        )}
      </View>
 
      <Typography variant="h3" color={isDark ? COLORS.darkText : COLORS.text}>Menú</Typography>
    </View>
  </View>
);
 
// ── Pantalla principal ──
const RestaurantDetailScreen = ({ route }) => {
  const { id } = route.params;
  const { isDarkMode } = useAuthStore();
  const [restaurant, setRestaurant] = useState(null);
  const [menuProducts, setMenuProducts] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    fetchData();
  }, [id]);
 
  const fetchData = async () => {
    try {
      const [resData, menuData] = await Promise.all([
        getRestaurantById(id),
        getRestaurantMenu(id),
      ]);
      setRestaurant(resData);
      // El endpoint puede devolver { products: [...] } o directamente un array
      setMenuProducts(Array.isArray(menuData) ? menuData : menuData?.products ?? []);
    } catch (error) {
      console.error('Error fetching restaurant detail:', error);
    } finally {
      setLoading(false);
    }
  };
 
  // Agrupación por categoría — se recalcula solo cuando cambia menuProducts
  const sections = useMemo(() => groupByCategory(menuProducts), [menuProducts]);
 
  if (loading) {
    return (
      <View style={[COMMON_STYLES.container, COMMON_STYLES.center, { backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
 
  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <SectionList
        style={COMMON_STYLES.container}
        contentContainerStyle={{ backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.background }}
        sections={sections}
        keyExtractor={(item) => item._id || item.id}
        // Cabecera del restaurante encima de todas las secciones
        ListHeaderComponent={<RestaurantHeader restaurant={restaurant} isDark={isDarkMode} />}
        // Título de cada categoría
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.background, borderBottomColor: isDarkMode ? COLORS.darkBorder : COLORS.border }]}>
            <Typography variant="bodyBold" color={isDarkMode ? COLORS.darkText : COLORS.text}>{title}</Typography>
            <Typography variant="small" color={isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary}>{data.length} platos</Typography>
          </View>
        )}
        // Cada producto
        renderItem={({ item }) => <ProductRow item={item} isDark={isDarkMode} />}
        // Estado vacío
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={isDarkMode ? COLORS.darkBorder : COLORS.border} />
            <Typography color={isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary} style={{ textAlign: 'center' }}>Este restaurante aún no tiene menú disponible.</Typography>
          </View>
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
 
const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    height: 250,
  },
  info: {
    padding: THEME.spacing.md,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    marginTop: -20,
  },
  detailsRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: THEME.spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Cabecera de sección (sticky)
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
  },
  // Tarjeta de producto
  productCard: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    gap: THEME.spacing.sm,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  outOfStockBadge: {
    backgroundColor: `${COLORS.error}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.sm,
  },
  outOfStockText: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: '600',
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: COLORS.background,
  },
  imageUnavailable: {
    opacity: 0.4,
  },
  listContent: {
    paddingBottom: THEME.spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
});
 
export default RestaurantDetailScreen;
