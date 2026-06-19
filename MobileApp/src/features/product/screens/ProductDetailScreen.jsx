import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES } from '../../../shared/constants/theme';
import useAuthStore from '../../../store/useAuthStore';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';
import Button from '../../../shared/components/common/Button';
import Skeleton from '../../../shared/components/common/Skeleton';
import api from '../../../api/api';

// ── API helpers ───────────────────────────────────────────────────────────────
const getProductReviews = (productId) =>
  api.get(`/analytics/reviews/plato/${productId}`).then(r => r.data);

const createReview = (data) =>
  api.post('/analytics/reviews', data).then(r => r.data);

const deleteReview = (reviewId) =>
  api.delete(`/analytics/reviews/${reviewId}`).then(r => r.data);

const updateReview = (reviewId, data) =>
  api.put(`/analytics/reviews/${reviewId}`, data).then(r => r.data);

// ── Estrellas ─────────────────────────────────────────────────────────────────
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
const ProductDetailSkeleton = ({ isDark }) => {
  const bg = isDark ? COLORS.darkBackground : COLORS.background;
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Skeleton width="100%" height={260} borderRadius={0} isDark={isDark} />
      <View style={{ padding: 16, gap: 12 }}>
        <Skeleton width="70%" height={28} isDark={isDark} />
        <Skeleton width="40%" height={20} isDark={isDark} />
        <Skeleton width="100%" height={60} isDark={isDark} />
        <Skeleton width="100%" height={1} isDark={isDark} style={{ marginVertical: 8 }} />
        {[1,2].map(i => (
          <Skeleton key={i} width="100%" height={80} borderRadius={12} isDark={isDark} />
        ))}
      </View>
    </View>
  );
};

// ── Tarjeta de reseña ─────────────────────────────────────────────────────────
const ReviewCard = ({ review, currentUserId, isDark, onEdit, onDelete, t }) => {
  const bgCard = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  const isOwner = review.usuarioId?.toString() === currentUserId?.toString();
  const dateStr = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '';

  return (
    <View style={[rvStyles.card, { backgroundColor: bgCard, borderColor }]}>
      <View style={rvStyles.row}>
        <View style={[rvStyles.avatar, { backgroundColor: COLORS.primary + '22' }]}>
          <Ionicons name="person" size={18} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="bodyBold" color={textColor}>
            {review.username || review.usuarioId?.slice(-6) || t('productDetail.anonymous')}
          </Typography>
          <StarRating rating={review.rating} size={13} />
        </View>
        {isOwner && (
          <View style={rvStyles.actions}>
            <TouchableOpacity onPress={() => onEdit(review)} style={rvStyles.actionBtn}>
              <Ionicons name="pencil" size={16} color={textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(review._id || review.id)} style={rvStyles.actionBtn}>
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Typography variant="caption" color={textSecondary} style={{ marginTop: 8 }}>
        {review.comentario}
      </Typography>
      {dateStr ? (
        <Typography variant="small" color={textSecondary} style={{ marginTop: 4 }}>
          {dateStr}
        </Typography>
      ) : null}
    </View>
  );
};

const rvStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
});

// ── Modal de reseña ───────────────────────────────────────────────────────────
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

// ── Pantalla Principal ────────────────────────────────────────────────────────
const ProductDetailScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { user, isDarkMode } = useAuthStore();

  // El producto puede venir completo por params, o solo el id
  const { product: productParam, productId: idParam } = route?.params || {};
  const [product, setProduct] = useState(productParam || null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, promedioRating: 0 });
  const [loading, setLoading] = useState(!productParam);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  const productId = product?._id || product?.id || idParam;

  // Cargar producto si no viene completo
  useEffect(() => {
    if (!product && idParam) {
      api.get(`/products/${idParam}`)
        .then(r => setProduct(r.data?.product || r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [idParam]);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setReviewsLoading(true);
    try {
      const res = await getProductReviews(productId);
      const data = res.data || {};
      setReviews(data.reviews || []);
      setStats({
        totalReviews: data.totalReviews || 0,
        promedioRating: data.promedioRating || 0,
      });
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleSubmitReview = async ({ rating, comentario }) => {
    if (editingReview) {
      await updateReview(editingReview._id || editingReview.id, { rating, comentario });
    } else {
      await createReview({
        usuarioId: user?._id || user?.id,
        username: user?.username || user?.Username || user?.name || 'Usuario',
        restauranteId: product?.restaurant?._id || product?.restaurant || product?.restaurantId,
        platoId: productId,
        rating,
        comentario,
      });
    }
    await fetchReviews();
    setEditingReview(null);
  };

  const handleDelete = (reviewId) => {
    Alert.alert(
      t('productDetail.deleteTitle'),
      t('productDetail.deleteMsg'),
      [
        { text: t('productDetail.cancel'), style: 'cancel' },
        {
          text: t('productDetail.delete'), style: 'destructive',
          onPress: async () => {
            try {
              await deleteReview(reviewId);
              await fetchReviews();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || t('productDetail.deleteError'));
            }
          }
        }
      ]
    );
  };

  const handleOpenEdit = (review) => {
    setEditingReview(review);
    setModalVisible(true);
  };

  const userReview = reviews.find(r => r.usuarioId?.toString() === (user?._id || user?.id)?.toString());

  if (loading) return <ProductDetailSkeleton isDark={isDarkMode} />;

  const bannerColors = ['#FF6B00', '#B8860B', '#1A237E', '#2E7D32', '#6A1B9A'];
  const colorIndex = (product?.name?.charCodeAt(0) || 0) % bannerColors.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top','left','right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Back header flotante */}
      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)' }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color={textColor} />
        <Typography variant="caption" color={textColor}>{product?.restaurant?.name || ''}</Typography>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Imagen del producto */}
        <View style={[styles.productImage, { backgroundColor: bannerColors[colorIndex] }]}>
          {product?.image
            ? <Image source={{ uri: product.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            : null}
        </View>

        <View style={styles.content}>

          {/* Búsqueda / nombre */}
          <Input
            value={product?.name || ''}
            editable={false}
            style={{ marginBottom: 12, opacity: 0.7 }}
            inputStyle={{ borderColor: 'transparent' }}
          />

          {/* Nombre real + precio */}
          <View style={styles.titleRow}>
            <Typography variant="h3" color={textColor} style={{ flex: 1 }}>
              {product?.name || t('productDetail.product')}
            </Typography>
            {product?.price != null && (
              <Typography variant="h3" color={COLORS.primary}>
                Q {product.price.toFixed(2)}
              </Typography>
            )}
          </View>

          {product?.description ? (
            <Typography variant="caption" color={textSecondary} style={{ marginTop: 4 }}>
              {product.description}
            </Typography>
          ) : null}

          {/* Divider + Stats */}
          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.statsRow}>
            <View style={styles.restaurantTag}>
              <Ionicons name="restaurant" size={14} color={textSecondary} />
              <Typography variant="small" color={textSecondary} style={{ marginLeft: 4 }}>
                {product?.restaurant?.name || t('productDetail.restaurant')}
              </Typography>
            </View>

            <View style={styles.ratingBlock}>
              <Typography variant="bodyBold" color={textColor}>{stats.promedioRating.toFixed(1)}</Typography>
              <StarRating rating={stats.promedioRating} size={14} />
              <Typography variant="small" color={textSecondary}>
                {stats.totalReviews} {t('productDetail.reviews')}
              </Typography>
            </View>

            {!userReview && (
              <TouchableOpacity
                style={styles.writeBtn}
                onPress={() => { setEditingReview(null); setModalVisible(true); }}
              >
                <Ionicons name="add" size={14} color={COLORS.primary} />
                <Typography variant="small" color={COLORS.primary} style={{ fontWeight: '700' }}>
                  {t('productDetail.write')}
                </Typography>
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* Reseñas Header Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Typography variant="bodyBold" color={textColor}>
              {t('productDetail.review') || 'Reseñas'} ({stats.totalReviews})
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
              onPress={() => { setEditingReview(null); setModalVisible(true); }}
            >
              <Ionicons name="add" size={15} color={COLORS.white} />
              <Typography variant="smallBold" color={COLORS.white}>
                {t('productDetail.write') || 'Escribir'}
              </Typography>
            </TouchableOpacity>
          </View>

          {reviewsLoading ? (
            [1,2].map(i => (
              <Skeleton key={i} width="100%" height={80} borderRadius={12} isDark={isDarkMode} style={{ marginBottom: 12 }} />
            ))
          ) : reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Ionicons name="chatbubble-outline" size={36} color={textSecondary} style={{ marginBottom: 8 }} />
              <Typography variant="caption" color={textSecondary} style={{ marginBottom: 12, textAlign: 'center' }}>
                {t('productDetail.noReviews')}
              </Typography>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary }}
                onPress={() => { setEditingReview(null); setModalVisible(true); }}
              >
                <Ionicons name="add" size={16} color={COLORS.primary} />
                <Typography variant="smallBold" color={COLORS.primary}>
                  {t('productDetail.addReview') || 'Agregar Comentario'}
                </Typography>
              </TouchableOpacity>
            </View>
          ) : (
            reviews.map(r => (
              <ReviewCard
                key={r._id || r.id}
                review={r}
                currentUserId={user?._id || user?.id}
                isDark={isDarkMode}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                t={t}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal reseña */}
      <ReviewModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingReview(null); }}
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
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  productImage: {
    width: '100%',
    height: 260,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  restaurantTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});

export default ProductDetailScreen;
