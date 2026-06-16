import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import { THEME, COMMON_STYLES } from '../../../shared/constants/theme';
import { getRestaurants } from '../../../api/restaurants';
import { getProducts } from '../../../api/products';
import useAuthStore from '../../../store/useAuthStore';
import RestaurantCard from '../components/RestaurantCard';
import ProductCard from '../../../shared/components/common/ProductCard';
import Input from '../../../shared/components/common/Input';
import Typography from '../../../shared/components/common/Typography';
import Skeleton from '../../../shared/components/common/Skeleton';
import { useTranslation } from 'react-i18next';

const HomeSkeleton = ({ isDark }) => (
  <View style={[styles.container, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.background, paddingTop: 40 }]}>
    <View style={styles.header}>
      <View style={COMMON_STYLES.row}>
        <View style={{ flex: 1 }}>
          <Skeleton width={120} height={20} style={{ marginBottom: 8 }} isDark={isDark} />
          <Skeleton width={150} height={30} isDark={isDark} />
        </View>
        <Skeleton width={45} height={45} borderRadius={12} isDark={isDark} />
      </View>
      <Skeleton width="100%" height={50} borderRadius={12} style={{ marginTop: 24 }} isDark={isDark} />
    </View>
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <Skeleton width={100} height={20} style={{ marginBottom: 16 }} isDark={isDark} />
      <View style={COMMON_STYLES.row}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width={70} height={35} borderRadius={20} style={{ marginRight: 10 }} isDark={isDark} />
        ))}
      </View>
    </View>
    <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
      <View style={[COMMON_STYLES.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
        <Skeleton width={150} height={24} isDark={isDark} />
        <Skeleton width={80} height={16} isDark={isDark} />
      </View>
      <View style={COMMON_STYLES.row}>
        {[1, 2].map((i) => (
          <Skeleton key={i} width={160} height={180} borderRadius={16} style={{ marginRight: 16 }} isDark={isDark} />
        ))}
      </View>
    </View>
  </View>
);

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, isDarkMode } = useAuthStore();
  const [restaurants, setRestaurants] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(t('home.all'));

  const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;

  useEffect(() => {
    setActiveCategory(t('home.all'));
  }, [t]);

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

  const categories = useMemo(() => {
    const uniqueCats = new Set();
    restaurants.forEach(r => {
      if (r.category) uniqueCats.add(r.category);
    });

    const catsArray = Array.from(uniqueCats).map((name, index) => ({
      id: (index + 1).toString(),
      name,
      icon: 'food'
    }));

    return [{ id: '0', name: t('home.all'), icon: 'apps' }, ...catsArray];
  }, [restaurants, t]);

  const filteredRestaurants = useMemo(() => {
    return (restaurants || []).filter((r) => {
      const matchesSearch = r?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === t('home.all') ||
        r?.category?.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [restaurants, search, activeCategory, t]);

  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const matchesSearch = p?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p?.description?.toLowerCase().includes(search.toLowerCase());
      const restaurantCategory = p?.restaurant?.category ||
        restaurants.find(r => (r._id || r.id) === (p.restaurant?._id || p.restaurant))?.category;
      const matchesCategory = activeCategory === t('home.all') ||
        restaurantCategory?.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, restaurants, search, activeCategory, t]);

  if (loading) {
    return <HomeSkeleton isDark={isDarkMode} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header con Saludo y Notificación */}
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <View>
              <Typography variant="body" color={textSecondary}>
                {t('home.greeting')}, {user?.name || (user?.firstName ? `${user.firstName} ${user.lastName}` : t('home.guest'))}
              </Typography>
            </View>
            <TouchableOpacity style={[styles.notificationIcon, { backgroundColor: surfaceColor }]}>
              <Ionicons name="notifications" size={24} color={textColor} />
              <View style={[styles.notificationDot, { borderColor: surfaceColor }]} />
            </TouchableOpacity>
          </View>

          {/* Buscador Estilo Adaptable */}
          <Input
            placeholder={t('home.searchPlaceholder')}
            value={search}
            onChangeText={setSearch}
            style={styles.searchContainer}
            inputStyle={[styles.searchInput, { backgroundColor: surfaceColor, color: textColor }]}
            placeholderTextColor={textSecondary}
            leftIcon={<Ionicons name="search-outline" size={20} color={textSecondary} />}
          />
        </View>

        {/* Categorías Dinámicas */}
        <View style={styles.sectionContainer}>
          <Typography variant="h3" color={textColor} style={styles.sectionTitle}>
            {t('home.categories')}
          </Typography>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {categories.map((cat) => {
              const isActive = cat.name === activeCategory;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.name)}
                  style={[styles.categoryChip, { backgroundColor: surfaceColor }, isActive && styles.categoryChipActive]}
                >
                  <Typography
                    variant="small"
                    color={isActive ? COLORS.white : textSecondary}
                  >
                    {cat.name}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Destacados cerca de ti */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color={textColor}>
              {activeCategory === t('home.all') ? t('home.featured') : `${activeCategory}`}
            </Typography>
            <TouchableOpacity>
              <Typography variant="caption" color={COLORS.primary}>{t('home.viewAll')} &rarr;</Typography>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((item) => (
                <RestaurantCard
                  key={item._id || item.id}
                  restaurant={item}
                  isDark={isDarkMode}
                  onPress={() => navigation.navigate('RestaurantDetail', { id: item._id || item.id })}
                />
              ))
            ) : (
              <Typography variant="small" color={textSecondary} style={{ paddingVertical: 20 }}>
                {t('home.noRestaurants')}
              </Typography>
            )}
          </ScrollView>
        </View>

        {/* Platos Populares */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color={textColor}>
              {activeCategory === t('home.all') ? t('home.popular') : `${t('home.popular')} (${activeCategory})`}
            </Typography>
          </View>
          <View style={styles.productsList}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((item) => (
                <ProductCard
                  key={item._id || item.id}
                  product={item}
                  isDark={isDarkMode}
                  onPress={() => { }}
                />
              ))
            ) : (
              <Typography variant="small" color={textSecondary} style={{ textAlign: 'center', paddingVertical: 20 }}>
                {t('home.noProducts')}
              </Typography>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  notificationIcon: {
    padding: 10,
    borderRadius: 12,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
  },
  searchContainer: {
    marginBottom: 0,
  },
  searchInput: {
    borderColor: 'transparent',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 12,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoriesList: {
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  horizontalList: {
    paddingRight: 16,
  },
  productsList: {
    gap: 16,
    paddingBottom: 40,
  },
});

export default HomeScreen;
