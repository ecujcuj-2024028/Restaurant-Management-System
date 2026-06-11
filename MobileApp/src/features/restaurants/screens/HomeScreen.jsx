import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES, THEME } from '../../../shared/constants/theme';
import { getRestaurants } from '../../../api/restaurants';
import RestaurantCard from '../components/RestaurantCard';
import Input from '../../../shared/components/common/Input';
import Typography from '../../../shared/components/common/Typography';

// Categorías disponibles — se pueden extender según el backend
const CATEGORIES = ['Todos', 'Comida Rápida', 'Italiana', 'Mexicana', 'Japonesa', 'Saludable', 'Postres'];

const HomeScreen = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getRestaurants();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filtro combinado: categoría + búsqueda de texto
  const filteredRestaurants = useMemo(() => {
    return (restaurants || []).filter((r) => {
      const matchesSearch = r?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === 'Todos' ||
        r?.category?.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [restaurants, search, activeCategory]);

  if (loading) {
    return (
      <View style={[COMMON_STYLES.container, COMMON_STYLES.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={COMMON_STYLES.container}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2" color={COLORS.text}>
          Explorar
        </Typography>
        <Typography variant="caption" color={COLORS.textSecondary}>
          Descubre los mejores restaurantes
        </Typography>

        {/* Barra de búsqueda — reutilizando el Input existente */}
        <Input
          placeholder="Buscar restaurantes..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          leftIcon={<Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />}
          rightIcon={
            search.length > 0 ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null
          }
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
                activeOpacity={0.7}
              >
                <Typography
                  variant="small"
                  color={isActive ? COLORS.white : COLORS.textSecondary}
                  style={isActive && styles.categoryChipTextActive}
                >
                  {cat}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Contador de resultados */}
      <View style={styles.resultsRow}>
        <Typography variant="caption" color={COLORS.textSecondary}>
          {filteredRestaurants.length}{' '}
          {filteredRestaurants.length === 1 ? 'resultado' : 'resultados'}
        </Typography>
      </View>

      {/* Lista de restaurantes */}
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => navigation.navigate('RestaurantDetail', { id: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRestaurants(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.border} />
            <Typography variant="body" color={COLORS.textSecondary} style={styles.emptyText}>
              No se encontraron restaurantes
            </Typography>
            {(search || activeCategory !== 'Todos') && (
              <TouchableOpacity
                onPress={() => {
                  setSearch('');
                  setActiveCategory('Todos');
                }}
                style={styles.clearFiltersBtn}
              >
                <Typography variant="caption" color={COLORS.primary}>
                  Limpiar filtros
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    marginTop: THEME.spacing.sm,
    marginBottom: 0,
  },
  categoriesWrapper: {
    backgroundColor: COLORS.white,
    paddingBottom: THEME.spacing.sm,
  },
  categoriesContent: {
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs + 2,
    borderRadius: THEME.borderRadius.round,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipTextActive: {
    fontWeight: '600',
  },
  resultsRow: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
  },
  listContent: {
    padding: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: THEME.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
  clearFiltersBtn: {
    marginTop: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.round,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
});

export default HomeScreen;