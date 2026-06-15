import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import { THEME, COMMON_STYLES } from '../../../shared/constants/theme';
import { getRestaurants } from '../../../api/restaurants';
import { getProducts } from '../../../api/products';
import RestaurantCard from '../components/RestaurantCard';
import ProductCard from '../../../shared/components/common/ProductCard';
import Input from '../../../shared/components/common/Input';
import Typography from '../../../shared/components/common/Typography';

const CATEGORIES = ['Todos', 'Comida Rápida', 'Italiana', 'Mexicana', 'Japonesa', 'Saludable', 'Postres'];

const HomeScreen = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [restaurantsRes, productsRes] = await Promise.all([
        getRestaurants(),
        getProducts()
      ]);
      
      setRestaurants(restaurantsRes.restaurants || []);
      setProducts(productsRes.products || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setRestaurants([]);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredRestaurants = useMemo(() => {
    return (restaurants || []).filter((r) => {
      const matchesSearch = r?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === 'Todos' ||
        r?.category?.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [restaurants, search, activeCategory]);

  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const matchesSearch = p?.name?.toLowerCase().includes(search.toLowerCase()) || 
                           p?.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === 'Todos' ||
        p?.category?.name?.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  if (loading) {
    return (
      <View style={[COMMON_STYLES.container, COMMON_STYLES.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={COMMON_STYLES.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h2" color={COLORS.text}>
            Explorar
          </Typography>
          <Input
            placeholder="Buscar comida o restaurantes..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            leftIcon={<Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />}
          />
        </View>

        {/* Filtros por categoría */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                >
                  <Typography
                    variant="small"
                    color={isActive ? COLORS.white : COLORS.textSecondary}
                  >
                    {cat}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Carrusel de Restaurantes */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color={COLORS.text}>Restaurantes Populares</Typography>
            <TouchableOpacity onPress={() => {}}>
              <Typography variant="caption" color={COLORS.primary}>Ver todos</Typography>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.restaurantsCarousel}
          >
            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((item) => (
                <RestaurantCard
                  key={item._id}
                  restaurant={item}
                  onPress={() => navigation.navigate('RestaurantDetail', { id: item._id })}
                />
              ))
            ) : (
              <Typography variant="body" color={COLORS.textSecondary}>No hay restaurantes disponibles</Typography>
            )}
          </ScrollView>
        </View>

        {/* Lista de Productos */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color={COLORS.text}>Platos Destacados</Typography>
          </View>
          <View style={styles.productsList}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((item) => (
                <ProductCard
                  key={item._id}
                  product={item}
                  onPress={() => {}}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="fast-food-outline" size={48} color={COLORS.border} />
                <Typography variant="body" color={COLORS.textSecondary}>No se encontraron productos</Typography>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.sm,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    marginTop: THEME.spacing.sm,
  },
  categoriesWrapper: {
    backgroundColor: COLORS.white,
    paddingBottom: THEME.spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.round,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sectionContainer: {
    marginTop: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  restaurantsCarousel: {
    paddingRight: THEME.spacing.md,
    paddingBottom: THEME.spacing.xs,
  },
  productsList: {
    paddingBottom: THEME.spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: THEME.spacing.sm,
  },
});

export default HomeScreen;