import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import { THEME, COMMON_STYLES } from '../../../shared/constants/theme';
import { getRestaurantById } from '../../../api/restaurants';
import api from '../../../api/api';
 
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
const ProductRow = ({ item }) => (
  <View style={styles.productCard}>
    <View style={styles.productInfo}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productDescription} numberOfLines={2}>
        {item.description || 'Sin descripción disponible.'}
      </Text>
      <View style={styles.productMeta}>
        <Text style={styles.productPrice}>${item.price?.toFixed(2)}</Text>
        {item.preparationTime && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.timeText}>{item.preparationTime} min</Text>
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
const RestaurantHeader = ({ restaurant }) => (
  <View>
    <Image
      source={{
        uri: restaurant?.imageUrl || 'https://via.placeholder.com/400x200?text=Restaurante',
      }}
      style={styles.heroImage}
    />
    <View style={styles.info}>
      <Text style={styles.name}>{restaurant?.name}</Text>
      <Text style={styles.category}>{restaurant?.category}</Text>
 
      <View style={styles.detailsRow}>
        {restaurant?.openingHours && (
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} />
            <Text style={styles.detailText}>{restaurant.openingHours}</Text>
          </View>
        )}
        {restaurant?.address && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            <Text style={styles.detailText}>{restaurant.address}</Text>
          </View>
        )}
      </View>
 
      <Text style={styles.menuTitle}>Menú</Text>
    </View>
  </View>
);
 
// ── Pantalla principal ──
const RestaurantDetailScreen = ({ route }) => {
  const { id } = route.params;
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
      <View style={[COMMON_STYLES.container, COMMON_STYLES.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
 
  return (
    <SectionList
      style={COMMON_STYLES.container}
      sections={sections}
      keyExtractor={(item) => item._id || item.id}
      // Cabecera del restaurante encima de todas las secciones
      ListHeaderComponent={<RestaurantHeader restaurant={restaurant} />}
      // Título de cada categoría
      renderSectionHeader={({ section: { title, data } }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>{data.length} platos</Text>
        </View>
      )}
      // Cada producto
      renderItem={({ item }) => <ProductRow item={item} />}
      // Estado vacío
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>Este restaurante aún no tiene menú disponible.</Text>
        </View>
      }
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled
      showsVerticalScrollIndicator={false}
    />
  );
};
 
const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    height: 250,
  },
  info: {
    padding: THEME.spacing.md,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    marginTop: -20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  category: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: THEME.spacing.md,
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
  detailText: {
    fontSize: 14,
    color: COLORS.text,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  // Cabecera de sección (sticky)
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Tarjeta de producto
  productCard: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: THEME.spacing.sm,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  productDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
 
export default RestaurantDetailScreen;