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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
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
import Button from '../../../shared/components/common/Button';

// ── StarRating & ReviewModal for comments ──
const StarRating = ({ rating, size = 16, color = COLORS.accent, editable = false, onRate }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <TouchableOpacity
        key={i}
        onPress={() => editable && onRate && onRate(i)}
        disabled={!editable}
        activeOpacity={editable ? 0.7 : 1}
      >
        <Ionicons
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={i <= Math.round(rating) ? color : COLORS.border}
        />
      </TouchableOpacity>
    ))}
  </View>
);

const ReviewModal = ({ visible, onClose, onSubmit, isDark, editingReview, t }) => {
  const [rating, setRating] = useState(editingReview?.rating || 5);
  const [comment, setComment] = useState(editingReview?.comentario || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(editingReview?.rating || 5);
      setComment(editingReview?.comentario || '');
    }
  }, [visible, editingReview]);

  const bgModal = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const bgOverlay = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)';

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ rating, comentario: comment.trim() });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity style={[mStyles.overlay, { backgroundColor: bgOverlay }]} onPress={onClose} activeOpacity={1} />
        <View style={[mStyles.sheet, { backgroundColor: bgModal }]}>
          <View style={mStyles.handle} />
          <Typography variant="h3" color={textColor} style={{ marginBottom: 16 }}>
            {editingReview ? t('productDetail.editReview') : t('productDetail.addReview')}
          </Typography>

          <Typography variant="caption" color={textSecondary} style={{ marginBottom: 8 }}>
            {t('productDetail.yourRating')}
          </Typography>
          <StarRating rating={rating} size={32} editable onRate={setRating} />

          <Typography variant="caption" color={textSecondary} style={{ marginTop: 16, marginBottom: 8 }}>
            {t('productDetail.comment')}
          </Typography>
          <TextInput
            style={[mStyles.textArea, {
              color: isDark ? COLORS.darkText : COLORS.text,
              backgroundColor: isDark ? COLORS.darkBackground : COLORS.background,
              borderColor: isDark ? COLORS.darkBorder : COLORS.border,
            }]}
            placeholder={t('productDetail.commentPlaceholder')}
            placeholderTextColor={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Button
            title={editingReview ? t('productDetail.save') : t('productDetail.publish')}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: 16 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const mStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
});

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
const ComboCard = ({ item, isDark, t, onOrder, onItemPress }) => {
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
            const productData = itemObj.product || itemObj;

            return (
              <TouchableOpacity 
                key={itemObj._id || itemObj.id || idx} 
                style={styles.itemRow}
                onPress={() => onItemPress && onItemPress(productData)}
              >
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Typography variant="small" color={textColor} style={{ marginLeft: 8, flex: 1 }}>
                  {productName}
                </Typography>
                <Typography variant="small" color={COLORS.primary} style={{ fontWeight: '600' }}>
                  {t('restaurantDetail.detail')} &rarr;
                </Typography>
              </TouchableOpacity>
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
  const { user, isDarkMode } = useAuthStore();
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [menus, setMenus] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(t('restaurantDetail.all'));
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [modalReviews, setModalReviews] = useState([]);
  const [modalReviewsLoading, setModalReviewsLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const handleOpenProductDetail = async (product) => {
    const productId = product._id || product.id;
    const fullProduct = products.find(p => (p._id || p.id) === productId) || product;
    
    setSelectedProduct(fullProduct);
    setProductModalVisible(true);
    setModalReviewsLoading(true);
    setModalReviews([]);

    try {
      const res = await api.get(`/analytics/reviews/plato/${productId}`);
      const data = res.data?.data || {};
      setModalReviews(data.reviews || []);
    } catch (e) {
      console.error('Error fetching reviews for modal:', e);
      setModalReviews([]);
    } finally {
      setModalReviewsLoading(false);
    }
  };

  const handleOrderProduct = (product) => {
    if (!product) return;
    Alert.alert(
      t('common.success') || 'Éxito',
      `${product.name} ${t('restaurantDetail.addedToOrder') || 'ha sido agregado al pedido.'}`
    );
    setProductModalVisible(false);
  };

  const handleOpenAddReview = () => {
    setEditingReview(null);
    setReviewModalVisible(true);
  };

  const handleOpenEditReview = (review) => {
    setEditingReview(review);
    setReviewModalVisible(true);
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert(
      t('productDetail.deleteTitle') || 'Eliminar Reseña',
      t('productDetail.deleteMsg') || '¿Estás seguro de que deseas eliminar tu reseña?',
      [
        { text: t('productDetail.cancel') || 'Cancelar', style: 'cancel' },
        {
          text: t('productDetail.delete') || 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/analytics/reviews/${reviewId}`);
              if (selectedProduct) {
                const res = await api.get(`/analytics/reviews/plato/${selectedProduct._id || selectedProduct.id}`);
                const data = res.data?.data || {};
                setModalReviews(data.reviews || []);
              }
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || t('productDetail.deleteError') || 'No se pudo eliminar.');
            }
          }
        }
      ]
    );
  };

  const handleSubmitReview = async ({ rating, comentario }) => {
    const productId = selectedProduct?._id || selectedProduct?.id;
    if (!productId) return;

    try {
      if (editingReview) {
        await api.put(`/analytics/reviews/${editingReview._id || editingReview.id}`, { rating, comentario });
      } else {
        await api.post('/analytics/reviews', {
          usuarioId: user?._id || user?.id,
          username: user?.username || user?.Username || user?.name || 'Usuario',
          restauranteId: id,
          platoId: productId,
          rating,
          comentario,
        });
      }

      const res = await api.get(`/analytics/reviews/plato/${productId}`);
      const data = res.data?.data || {};
      setModalReviews(data.reviews || []);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Error al procesar comentario');
    } finally {
      setEditingReview(null);
      setReviewModalVisible(false);
    }
  };

  useEffect(() => {
  setActiveCategory(t('restaurantDetail.all'));
}, [t]);

  const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const initialProductId = route.params?.productId;
    if (initialProductId && products.length > 0) {
      const targetProd = products.find(p => (p._id || p.id) === initialProductId);
      if (targetProd) {
        handleOpenProductDetail(targetProd);
        navigation.setParams({ productId: undefined });
      }
    }
  }, [route.params?.productId, products]);

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
            inputStyle={{ borderColor: 'transparent' }}
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
                    onPress={() => handleOpenProductDetail(item)}
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
                    onPress={() => handleOpenProductDetail(item)}
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
                  onItemPress={handleOpenProductDetail}
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
        <TouchableOpacity
          style={styles.reservarBtn}
          onPress={() => {
            const parentNavigator = navigation.getParent();
            const parentState = parentNavigator ? parentNavigator.getState() : null;
            const currentTab = parentState ? parentState.routes[parentState.index]?.name : 'RestaurantesTab';

            navigation.navigate('ReservacionesTab', { 
              screen: 'ReservationForm', 
              params: { 
                id, 
                referrerTab: currentTab 
              } 
            });
          }}
        >
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

      {/* Modal Detalle de Producto */}
      <Modal
        visible={productModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProductModalVisible(false)}
      >
        <View style={styles.productModalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject} 
            activeOpacity={1} 
            onPress={() => setProductModalVisible(false)}
          />
          <View style={[styles.productModalCard, { backgroundColor: surfaceColor }]}>
            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setProductModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>

            {selectedProduct && (
              <View style={{ flex: 1 }}>
                <View style={[styles.modalProductImageContainer, { backgroundColor: COLORS.primary + '20', height: 220 }]}>
                  {selectedProduct.image ? (
                    <Image 
                      source={{ uri: selectedProduct.image }} 
                      style={styles.modalProductImage} 
                      resizeMode="cover" 
                    />
                  ) : (
                    <Ionicons name="fast-food-outline" size={80} color={COLORS.primary} />
                  )}
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.productTopRow}>
                    <Typography variant="h2" color={textColor} style={{ flex: 1 }}>
                      {selectedProduct.name}
                    </Typography>
                    <Typography variant="h2" color={COLORS.primary}>
                      Q {selectedProduct.price?.toFixed(2)}
                    </Typography>
                  </View>

                  <Typography variant="body" color={textSecondary} style={{ marginTop: 8 }}>
                    {selectedProduct.description || 'Sin descripción detallada disponible.'}
                  </Typography>

                  <View style={{ marginTop: 18, gap: 12 }}>
                    <View style={styles.itemRow}>
                      <Ionicons name="restaurant-outline" size={18} color={COLORS.primary} />
                      <Typography variant="small" color={textSecondary} style={{ marginLeft: 8 }}>
                        Categoría: {CATEGORY_KEYS[selectedProduct.type] ? t(CATEGORY_KEYS[selectedProduct.type]) : (selectedProduct.category?.name || 'General')}
                      </Typography>
                    </View>
                  </View>

                  {/* Comments Section */}
                  <View style={[styles.modalDivider, { backgroundColor: borderColor }]} />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Typography variant="bodyBold" color={textColor}>
                      {t('productDetail.reviews') || 'Comentarios'}
                    </Typography>
                    <TouchableOpacity 
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        gap: 4, 
                        paddingVertical: 6, 
                        paddingHorizontal: 12, 
                        backgroundColor: COLORS.primary, 
                        borderRadius: 16,
                        elevation: 2,
                        shadowColor: COLORS.black,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.2,
                        shadowRadius: 2
                      }}
                      onPress={() => handleOpenAddReview()}
                    >
                      <Ionicons name="add" size={15} color={COLORS.white} />
                      <Typography variant="smallBold" color={COLORS.white}>
                        {t('productDetail.write') || 'Escribir'}
                      </Typography>
                    </TouchableOpacity>
                  </View>

                  {modalReviewsLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
                  ) : modalReviews.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                      <Typography variant="small" color={textSecondary} style={{ fontStyle: 'italic', marginBottom: 8 }}>
                        {t('productDetail.noReviews') || 'Sin comentarios todavía'}
                      </Typography>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary }}
                        onPress={() => handleOpenAddReview()}
                      >
                        <Ionicons name="add" size={16} color={COLORS.primary} />
                        <Typography variant="smallBold" color={COLORS.primary}>
                          {t('productDetail.addReview') || 'Agregar Comentario'}
                        </Typography>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ gap: 10, paddingBottom: 16 }}>
                      {modalReviews.map((rev) => {
                        const isOwner = rev.usuarioId?.toString() === (user?._id || user?.id)?.toString();
                        return (
                          <View 
                            key={rev._id || rev.id} 
                            style={[
                              styles.modalReviewCard, 
                              { 
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                borderColor: borderColor 
                              }
                            ]}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="smallBold" color={textColor}>
                                {rev.username || (rev.usuarioId ? `Usuario ${rev.usuarioId.slice(-6)}` : 'Anónimo')}
                              </Typography>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                {isOwner && (
                                  <View style={{ flexDirection: 'row', gap: 8, marginRight: 4 }}>
                                    <TouchableOpacity onPress={() => handleOpenEditReview(rev)}>
                                      <Ionicons name="pencil" size={12} color={textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteReview(rev._id || rev.id)}>
                                      <Ionicons name="trash-outline" size={12} color={COLORS.error} />
                                    </TouchableOpacity>
                                  </View>
                                )}
                                <View style={{ flexDirection: 'row', gap: 1 }}>
                                  {[1,2,3,4,5].map(i => (
                                    <Ionicons 
                                      key={i} 
                                      name={i <= rev.rating ? 'star' : 'star-outline'} 
                                      size={10} 
                                      color={i <= rev.rating ? COLORS.accent : COLORS.border} 
                                    />
                                  ))}
                                </View>
                              </View>
                            </View>
                            <Typography variant="caption" color={textSecondary} style={{ marginTop: 4 }}>
                              {rev.comentario}
                            </Typography>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </ScrollView>

                {/* Sticky Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: borderColor }}>
                  <TouchableOpacity 
                    style={[
                      styles.modalCloseBtn, 
                      { 
                        flex: 1, 
                        backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                      }
                    ]} 
                    onPress={() => setProductModalVisible(false)}
                  >
                    <Typography variant="bodyBold" color={isDarkMode ? COLORS.white : COLORS.text}>
                      {t('common.close') || 'Cerrar'}
                    </Typography>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalPedirBtn, { flex: 1 }]} 
                    onPress={() => handleOrderProduct(selectedProduct)}
                  >
                    <Typography variant="bodyBold" color={COLORS.white}>
                      {t('restaurantDetail.order') || 'Pedir'}
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Review Modal for Adding/Editing comments */}
      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => { setReviewModalVisible(false); setEditingReview(null); }}
        onSubmit={handleSubmitReview}
        isDark={isDarkMode}
        editingReview={editingReview}
        t={t}
      />
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
  // ── Product Modal Styles ──
  productModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  productModalCard: {
    width: '100%',
    height: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalProductImageContainer: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalProductImage: {
    width: '100%',
    height: '100%',
  },
  modalDivider: {
    height: 1,
    marginVertical: 18,
  },
  modalReviewCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  modalCloseBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalPedirBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
});

export default RestaurantDetailScreen;