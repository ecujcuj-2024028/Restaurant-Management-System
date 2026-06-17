import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import { THEME, COMMON_STYLES } from '../../../shared/constants/theme';
import { getRestaurantById } from '../../../api/restaurants';
import { getProducts } from '../../../api/products';
import api from '../../../api/api';
import useAuthStore from '../../../store/useAuthStore';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';

const getRestaurantMenus = async (id) => {
  const response = await api.get(`/menus`, { params: { restaurant: id } });
  return response.data;
};

const CATEGORY_KEYS = {
  'starter': 'restaurantDetail.starter',
  'main': 'restaurantDetail.main',
  'dessert': 'restaurantDetail.dessert',
  'beverage': 'restaurantDetail.beverage',
  'side_dish': 'restaurantDetail.side',
};

// ── Tarjeta de producto horizontal ──
const ProductCard = ({ item, isDark, onPress, t }) => {
  const bgCard = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;

  const bannerColors = ['#FF6B00', '#B8860B', '#1A237E', '#2E7D32', '#6A1B9A'];
  const colorIndex = (item.name?.charCodeAt(0) || 0) % bannerColors.length;

  const categoryLabel = CATEGORY_KEYS[item.type]
    ? t(CATEGORY_KEYS[item.type])
    : item.category?.name || item.category || 'Plato';

  return (
    <View style={[styles.productCard, { backgroundColor: bgCard }, !isDark && COMMON_STYLES.shadow]}>
      <View style={[styles.productImageContainer, { backgroundColor: bannerColors[colorIndex] }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
        ) : null}
        <View style={styles.categoryBadgeOnImage}>
          <Typography variant="small" color={COLORS.white} style={{ fontWeight: '700' }}>
            {categoryLabel}
          </Typography>
        </View>
      </View>

      <View style={styles.productInfo}>
        <View style={styles.productTopRow}>
          <Typography variant="bodyBold" color={textColor} style={{ flex: 1 }} numberOfLines={1}>
            {item.name}
          </Typography>
          <Typography variant="bodyBold" color={COLORS.primary}>
            Q {item.price?.toFixed(2)}
          </Typography>
        </View>

        <Typography variant="small" color={textSecondary} numberOfLines={2}>
          {item.description || 'Sin descripción disponible.'}
        </Typography>

        <View style={styles.productBottomRow}>
          <Typography variant="small" color={textSecondary}>
            {item.restaurant?.name || 'Restaurante'}
          </Typography>
          <TouchableOpacity style={styles.detalleBtn} onPress={onPress}>
            <Typography variant="small" color={COLORS.primary} style={{ fontWeight: '700' }}>
              {t('restaurantDetail.detail')}
            </Typography>
            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {!item.isAvailable && (
          <View style={styles.outOfStockBadge}>
            <Typography variant="small" color={COLORS.error} style={{ fontWeight: '600' }}>
              {t('restaurantDetail.outOfStock')}
            </Typography>
          </View>
        )}
      </View>
    </View>
  );
};

// ── Tarjeta de combo ──
const ComboCard = ({ item, isDark, t }) => {
  const bgCard = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;

  const bannerColors = ['#B8860B', '#FF6B00', '#1A237E', '#2E7D32'];
  const colorIndex = (item.name?.charCodeAt(0) || 0) % bannerColors.length;
  const itemCount = item.items?.length || 0;

  return (
    <View style={[styles.productCard, { backgroundColor: bgCard }, !isDark && COMMON_STYLES.shadow]}>
      <View style={[styles.productImageContainer, { backgroundColor: bannerColors[colorIndex] }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <Ionicons name="fast-food-outline" size={36} color="rgba(255,255,255,0.7)" />
        )}
      </View>
      <View style={styles.productInfo}>
        <View style={styles.productTopRow}>
          <Typography variant="bodyBold" color={textColor} style={{ flex: 1 }} numberOfLines={1}>
            {item.name}
          </Typography>
          <Typography variant="bodyBold" color={COLORS.primary}>
            Q {item.price?.toFixed(2)}
          </Typography>
        </View>
        <Typography variant="small" color={textSecondary} numberOfLines={2}>
          {itemCount > 0 ? `${t('restaurantDetail.comboItems')}: ${itemCount}` : item.description || 'Combo especial'}
        </Typography>
      </View>
    </View>
  );
};

// ── Pantalla principal ──
const RestaurantDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { t } = useTranslation();
  const { isDarkMode } = useAuthStore();
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(t('restaurantDetail.all'));

  const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [resData, productsData, menusData] = await Promise.all([
        getRestaurantById(id),
        getProducts({ restaurant: id }),
        getRestaurantMenus(id),
      ]);
      setRestaurant(resData.restaurant || resData);
      const prods = Array.isArray(productsData) ? productsData : productsData?.products ?? [];
      setProducts(prods);
      setMenus(Array.isArray(menusData) ? menusData : menusData?.menus ?? []);

    } catch (error) {
      console.error('Error fetching restaurant detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    return [
      t('restaurantDetail.all'),
      t('restaurantDetail.starter'),
      t('restaurantDetail.main'),
      t('restaurantDetail.dessert'),
      t('restaurantDetail.beverage'),
      t('restaurantDetail.side'),
    ];
  }, [t]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.type === 'combo') return false;
      const matchSearch =
        p?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p?.description?.toLowerCase().includes(search.toLowerCase());
      const categoryLabel = CATEGORY_KEYS[p.type] ? t(CATEGORY_KEYS[p.type]) : null;
      const matchCat = activeCategory === t('restaurantDetail.all') || categoryLabel === activeCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, activeCategory, t]);

  const filteredCombos = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p?.name?.toLowerCase().includes(search.toLowerCase());
      return p.type === 'combo' && matchSearch;
    });
  }, [products, search]);

  if (loading) {
    return (
      <View style={[COMMON_STYLES.container, COMMON_STYLES.center, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textColor} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Typography variant="h3" color={textColor} numberOfLines={1}>
            {restaurant?.name || 'Restaurante'}
          </Typography>
          <Typography variant="small" color={textSecondary} numberOfLines={1}>
            {restaurant?.category || 'Restaurante'}
          </Typography>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Buscador */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Input
            placeholder={t('restaurantDetail.searchPlaceholder')}
            value={search}
            onChangeText={setSearch}
            style={{ marginBottom: 0 }}
            inputStyle={{ backgroundColor: surfaceColor, borderColor: 'transparent' }}
            placeholderTextColor={textSecondary}
            leftIcon={<Ionicons name="search-outline" size={20} color={textSecondary} />}
          />
        </View>

        {/* Categorías */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 10 }}>
            {t('restaurantDetail.categories')}
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.categoryChip, { backgroundColor: isActive ? COLORS.primary : surfaceColor }]}
                >
                  <Typography variant="small" color={isActive ? COLORS.white : textSecondary}>
                    {cat}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Nuestra Carta */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color={textColor}>{t('restaurantDetail.ourMenu')}</Typography>
            <TouchableOpacity onPress={() => setActiveCategory(t('restaurantDetail.all'))}>
              <Typography variant="small" color={COLORS.primary}>{t('restaurantDetail.viewAll')} →</Typography>
            </TouchableOpacity>
          </View>

          {filteredProducts.length > 0 ? (
            filteredProducts.map((item) => (
              <ProductCard key={item._id || item.id} item={item} isDark={isDarkMode} onPress={() => { }} t={t} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={36} color={textSecondary} />
              <Typography variant="small" color={textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                {t('restaurantDetail.noProducts')}
              </Typography>
            </View>
          )}
        </View>

        {filteredCombos.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 40 }}>
            <Typography variant="h3" color={textColor} style={{ marginBottom: 12 }}>
              {t('restaurantDetail.combos')}
            </Typography>
            {filteredCombos.map((item) => (
              <ProductCard key={item._id || item.id} item={item} isDark={isDarkMode} onPress={() => { }} t={t} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Botón flotante Pedir */}
      <TouchableOpacity style={styles.pedirBtn}>
        <Ionicons name="cart-outline" size={20} color={COLORS.white} />
        <Typography variant="bodyBold" color={COLORS.white}>{t('restaurantDetail.order')}</Typography>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productCard: {
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  productImageContainer: {
    width: 130,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: { ...StyleSheet.absoluteFillObject },
  categoryBadgeOnImage: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  detalleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  outOfStockBadge: { marginTop: 4 },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  pedirBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});

export default RestaurantDetailScreen;