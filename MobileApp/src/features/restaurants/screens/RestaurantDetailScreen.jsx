import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Modal,
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

// ── Tarjeta de producto horizontal (lista) ──
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

// ── Tarjeta de producto para carrusel ──
const CarouselProductCard = ({ item, isDark, onPress, t }) => {
  const bgCard = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;

  const bannerColors = ['#FF6B00', '#B8860B', '#1A237E', '#2E7D32', '#6A1B9A'];
  const colorIndex = (item.name?.charCodeAt(0) || 0) % bannerColors.length;

  const categoryLabel = CATEGORY_KEYS[item.type]
    ? t(CATEGORY_KEYS[item.type])
    : item.category?.name || item.category || 'Plato';

  return (
    <View style={[styles.carouselCard, { backgroundColor: bgCard }, !isDark && COMMON_STYLES.shadow]}>
      {/* Imagen superior */}
      <View style={[styles.carouselImageContainer, { backgroundColor: bannerColors[colorIndex] }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : null}
        <View style={styles.categoryBadgeOnImage}>
          <Typography variant="small" color={COLORS.white} style={{ fontWeight: '700' }}>
            {categoryLabel}
          </Typography>
        </View>
        {!item.isAvailable && (
          <View style={styles.carouselOutOfStock}>
            <Typography variant="small" color={COLORS.white} style={{ fontWeight: '600' }}>
              {t('restaurantDetail.outOfStock')}
            </Typography>
          </View>
        )}
      </View>

      {/* Info inferior */}
      <View style={styles.carouselInfo}>
        <Typography variant="bodyBold" color={textColor} numberOfLines={1}>
          {item.name}
        </Typography>
        <Typography variant="small" color={textSecondary} numberOfLines={2} style={{ marginTop: 4 }}>
          {item.description || 'Sin descripción disponible.'}
        </Typography>
        <View style={styles.carouselBottom}>
          <Typography variant="bodyBold" color={COLORS.primary}>
            Q {item.price?.toFixed(2)}
          </Typography>
          <TouchableOpacity style={styles.detalleBtn} onPress={onPress}>
            <Typography variant="small" color={COLORS.primary} style={{ fontWeight: '700' }}>
              {t('restaurantDetail.detail')}
            </Typography>
            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ── Tarjeta de combo ──
const ComboCard = ({ item, isDark, t, onOrder }) => {
  const [showItems, setShowItems] = useState(false);
  const bgCard = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;

  const bannerColors = ['#B8860B', '#FF6B00', '#1A237E', '#2E7D32'];
  const colorIndex = (item.name?.charCodeAt(0) || 0) % bannerColors.length;
  const itemsList = item.items || [];
  const itemCount = itemsList.length;

  return (
    <View style={[styles.comboCardContainer, { backgroundColor: bgCard }, !isDark && COMMON_STYLES.shadow]}>
      <View style={styles.comboMainInfo}>
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
            {item.description || 'Combo especial'}
          </Typography>
          
          <View style={styles.comboBottomRow}>
            {itemCount > 0 ? (
              <TouchableOpacity 
                style={styles.showItemsBtn} 
                onPress={() => setShowItems(!showItems)}
              >
                <Typography variant="small" color={COLORS.primary} style={{ fontWeight: '600' }}>
                  {showItems ? t('restaurantDetail.viewLess') : t('restaurantDetail.comboItems')} ({itemCount})
                </Typography>
                <Ionicons 
                  name={showItems ? 'chevron-up' : 'chevron-down'} 
                  size={14} 
                  color={COLORS.primary} 
                />
              </TouchableOpacity>
            ) : <View />}
            
            <TouchableOpacity style={styles.comboPedirBtn} onPress={onOrder}>
              <Ionicons name="cart-outline" size={15} color={COLORS.white} />
              <Typography variant="small" color={COLORS.white} style={{ fontWeight: '700' }}>
                {t('restaurantDetail.order') || 'Pedir'}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showItems && itemCount > 0 && (
        <View style={[styles.itemsListContainer, { borderTopColor: isDark ? COLORS.darkBorder : COLORS.border }]}>
          {itemsList.map((itemObj, idx) => {
            // Manejamos si el item es el producto directo o un objeto envoltorio
            const productName = itemObj.name || itemObj.product?.name || (typeof itemObj === 'string' ? itemObj : 'Producto');
            
            return (
              <View key={itemObj._id || itemObj.id || idx} style={styles.itemRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Typography variant="small" color={textColor} style={{ marginLeft: 8 }}>
                  {productName}
                </Typography>
              </View>
            );
          })}
        </View>
      )}
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
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(t('restaurantDetail.all'));
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
  setActiveCategory(t('restaurantDetail.all'));
}, [t]);

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
      
      const fetchedMenus = Array.isArray(menusData) ? menusData : menusData?.menus ?? [];
      setMenus(fetchedMenus);
      if (fetchedMenus.length > 0) {
        setActiveMenuId(fetchedMenus[0]._id || fetchedMenus[0].id);
      }
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
        <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={[styles.infoBtn, { backgroundColor: surfaceColor }]}>
          <Ionicons name="information-circle-outline" size={24} color={textColor} />
        </TouchableOpacity>
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

        {/* ── Nuestra Carta ── */}
        <View style={{ marginBottom: 8 }}>
          {/* Header de sección con botón Ver todos */}
          <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
            <Typography variant="h3" color={textColor}>
              {t('restaurantDetail.ourMenu')}
            </Typography>
            <TouchableOpacity
              onPress={() => {
                setActiveCategory(t('restaurantDetail.all'));
                setShowAllProducts((prev) => !prev);
              }}
              style={[styles.verTodosBtn, { backgroundColor: `${COLORS.primary}15` }]}
            >
              <Typography variant="small" color={COLORS.primary} style={{ fontWeight: '700' }}>
                {showAllProducts ? t('restaurantDetail.viewLess') || 'Ver menos' : t('restaurantDetail.viewAll') || 'Ver todos'}
              </Typography>
              <Ionicons
                name={showAllProducts ? 'chevron-up' : 'chevron-forward'}
                size={14}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {filteredProducts.length > 0 ? (
            showAllProducts ? (
              // Vista de lista completa
              <View style={{ paddingHorizontal: 16 }}>
                {filteredProducts.map((item) => (
                  <ProductCard
                    key={item._id || item.id}
                    item={item}
                    isDark={isDarkMode}
                    onPress={() => {}}
                    t={t}
                  />
                ))}
              </View>
            ) : (
              // Vista carrusel
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 12 }}
              >
                {filteredProducts.map((item) => (
                  <CarouselProductCard
                    key={item._id || item.id}
                    item={item}
                    isDark={isDarkMode}
                    onPress={() => {}}
                    t={t}
                  />
                ))}
              </ScrollView>
            )
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={36} color={textSecondary} />
              <Typography variant="small" color={textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                {t('restaurantDetail.noProducts')}
              </Typography>
            </View>
          )}
        </View>

        {/* ── Menús (Combos) ── */}
        {menus.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <Typography variant="h3" color={textColor}>
                {t('restaurantDetail.combos')}
              </Typography>
            </View>
            
            {/* Chips de Menús */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10, marginBottom: 16 }}
            >
              {menus.map((menu) => {
                const isActive = (menu._id || menu.id) === activeMenuId;
                return (
                  <TouchableOpacity
                    key={menu._id || menu.id}
                    onPress={() => setActiveMenuId(menu._id || menu.id)}
                    style={[
                      styles.categoryChip, 
                      { backgroundColor: isActive ? COLORS.primary : surfaceColor }
                    ]}
                  >
                    <Typography variant="small" color={isActive ? COLORS.white : textSecondary}>
                      {menu.name}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Carta del Menú Activo */}
            <View style={{ paddingHorizontal: 16 }}>
              {menus.filter(m => (m._id || m.id) === activeMenuId).map((item) => (
                <ComboCard
                  key={item._id || item.id}
                  item={item}
                  isDark={isDarkMode}
                  t={t}
                  onOrder={() => console.log('Pedir menu:', item.name)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Espacio para botones flotantes */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botones flotantes: Reservación + Pedir */}
      <View style={styles.floatingButtonsRow}>
        <TouchableOpacity style={styles.reservarBtn}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.white} />
          <Typography variant="bodyBold" color={COLORS.white}>{t('restaurantDetail.reserve')}</Typography>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pedirBtn}>
          <Ionicons name="cart-outline" size={20} color={COLORS.white} />
          <Typography variant="bodyBold" color={COLORS.white}>{t('restaurantDetail.order')}</Typography>
        </TouchableOpacity>
      </View>

      {/* Modal Información del Local */}
      <Modal
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Typography variant="h3" color={textColor}>{t('restaurantDetail.locationInfo')}</Typography>
                <Typography variant="small" color={textSecondary}>{t('restaurantDetail.locationInfoSubtitle')}</Typography>
              </View>
              <TouchableOpacity onPress={() => setInfoModalVisible(false)} style={[styles.closeBtn, { backgroundColor: bgColor }]}>
                <Ionicons name="close" size={18} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInfoRow}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold" color={textColor}>{t('restaurantDetail.address')}</Typography>
                <Typography variant="small" color={textSecondary}>
                  {typeof restaurant?.address === 'object'
                    ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}`
                    : restaurant?.address || '—'}
                </Typography>
              </View>
            </View>

            <View style={styles.modalInfoRow}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="call-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold" color={textColor}>{t('restaurantDetail.phone')}</Typography>
                <Typography variant="small" color={textSecondary}>
                  {restaurant?.phone || '—'}
                </Typography>
              </View>
            </View>

            <View style={styles.modalInfoRow}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold" color={textColor}>{t('restaurantDetail.businessHours')}</Typography>
                <Typography variant="small" color={textSecondary}>
                  {restaurant?.openingTime && restaurant?.closingTime
                    ? `${restaurant.openingTime} - ${restaurant.closingTime}`
                    : restaurant?.openingHours || '—'}
                </Typography>
              </View>
            </View>

            <TouchableOpacity style={styles.understoodBtn} onPress={() => setInfoModalVisible(false)}>
              <Typography variant="bodyBold" color={COLORS.white}>{t('restaurantDetail.understood')}</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  infoBtn: {
    padding: 8,
    borderRadius: 20,
  },
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
  verTodosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  // ── Tarjeta lista ──
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
  comboBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  comboPedirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  comboCardContainer: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  comboMainInfo: {
    flexDirection: 'row',
  },
  showItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemsListContainer: {
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── Tarjeta carrusel ──
  carouselCard: {
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  carouselImageContainer: {
    width: '100%',
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselInfo: {
    padding: 12,
  },
  carouselBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  carouselOutOfStock: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(220,53,69,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  // ── Botones flotantes ──
  floatingButtonsRow: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  reservarBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  pedirBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    gap: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  modalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  understoodBtn: {
    backgroundColor: COLORS.text,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
});

export default RestaurantDetailScreen;