import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES } from '../../../shared/constants/theme';
import useAuthStore from '../../../store/useAuthStore';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';
import Skeleton from '../../../shared/components/common/Skeleton';
import { getMyOrders } from '../../../api/orders';

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  recibido:        '#17A2B8',
  en_preparacion:  '#FFC107',
  listo:           '#28A745',
  entregado:       '#28A745',
  cancelado:       '#DC3545',
  confirmado:      '#17A2B8',
  en_camino:       '#FF6B00',
};

const getStatusColor = (status) => STATUS_COLORS[status] || COLORS.textSecondary;

// ── Skeleton ──────────────────────────────────────────────────────────────────
const OrdersSkeleton = ({ isDark }) => (
  <View style={{ flex: 1, backgroundColor: isDark ? COLORS.darkBackground : COLORS.background, padding: 16 }}>
    <Skeleton width={180} height={28} isDark={isDark} style={{ marginBottom: 16 }} />
    <Skeleton width="100%" height={50} borderRadius={12} isDark={isDark} style={{ marginBottom: 16 }} />
    {[1,2,3].map(i => (
      <Skeleton key={i} width="100%" height={110} borderRadius={16} isDark={isDark} style={{ marginBottom: 14 }} />
    ))}
  </View>
);

// ── Tarjeta de pedido ─────────────────────────────────────────────────────────
const OrderCard = ({ order, isDark, onPress, t }) => {
  const bgCard = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const statusColor = getStatusColor(order.status || order.estado);

  // Resolver nombre del restaurante
  const restaurantName = order.restaurant?.name || order.restaurantName || t('orders.unknownRestaurant');

  // Imagen del primer producto
  const firstProduct = order.products?.[0] || order.orderDetails?.[0];
  const productImage = firstProduct?.product?.image || firstProduct?.image || null;

  // Categoría del primer producto
  const categoryLabel = firstProduct?.product?.category?.name
    || firstProduct?.category
    || firstProduct?.product?.type
    || t('orders.order');

  // Precio total
  const total = order.total ?? order.totalPrice ?? 0;

  // Fecha
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString()
    : '';

  const statusLabel = t(`orders.status.${order.status || order.estado}`) !== `orders.status.${order.status || order.estado}`
    ? t(`orders.status.${order.status || order.estado}`)
    : (order.status || order.estado || '');

  const bannerColors = ['#FF6B00', '#B8860B', '#1A237E', '#2E7D32', '#6A1B9A'];
  const colorIndex = (restaurantName?.charCodeAt(0) || 0) % bannerColors.length;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgCard }, !isDark && COMMON_STYLES.shadow]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Imagen lateral */}
      <View style={[styles.cardImage, { backgroundColor: bannerColors[colorIndex] }]}>
        {productImage
          ? <Image source={{ uri: productImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          : null}
        <View style={styles.categoryBadge}>
          <Typography variant="small" color={COLORS.white} style={{ fontWeight: '700' }} numberOfLines={1}>
            {categoryLabel}
          </Typography>
        </View>
        <View style={styles.restaurantBadge}>
          <Typography variant="small" color={COLORS.white} numberOfLines={1}>
            {restaurantName}
          </Typography>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardTopRow}>
          <Typography variant="bodyBold" color={textColor} style={{ flex: 1 }} numberOfLines={1}>
            {order.name || `${t('orders.order')} #${(order._id || order.id)?.slice(-4)}`}
          </Typography>
          <Typography variant="small" color={statusColor} style={{ fontWeight: '700' }}>
            {statusLabel}
          </Typography>
        </View>

        <Typography variant="small" color={textSecondary} numberOfLines={1}>
          {firstProduct?.product?.description || firstProduct?.description || t('orders.noDescription')}
        </Typography>

        <View style={styles.cardBottomRow}>
          <Typography variant="caption" color={COLORS.primary} style={{ fontWeight: '700' }}>
            Q {typeof total === 'number' ? total.toFixed(2) : total}
          </Typography>
          <TouchableOpacity style={styles.detailBtn} onPress={onPress}>
            <Typography variant="small" color={COLORS.primary} style={{ fontWeight: '700' }}>
              {t('orders.detail')} →
            </Typography>
          </TouchableOpacity>
        </View>

        {dateStr ? (
          <Typography variant="small" color={textSecondary}>{dateStr}</Typography>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

// ── Pantalla Principal ────────────────────────────────────────────────────────
const MyOrdersScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getMyOrders();
      setOrders(res.orders || res.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(o => {
      const rName = (o.restaurant?.name || o.restaurantName || '').toLowerCase();
      return rName.includes(q);
    });
  }, [orders, search]);

  if (loading) return <OrdersSkeleton isDark={isDarkMode} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top','left','right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Typography variant="h2" color={textColor}>{t('orders.title')}</Typography>
          <TouchableOpacity style={[styles.bellBtn, { backgroundColor: surfaceColor }]}>
            <Ionicons name="notifications" size={22} color={textColor} />
          </TouchableOpacity>
        </View>

        <Input
          placeholder={t('orders.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 0 }}
          inputStyle={{ borderColor: 'transparent' }}
          leftIcon={<Ionicons name="search-outline" size={20} color={textSecondary} />}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item._id || item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={52} color={textSecondary} />
            <Typography variant="body" color={textSecondary} style={{ marginTop: 14, textAlign: 'center' }}>
              {search ? t('orders.noResults') : t('orders.noOrders')}
            </Typography>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            isDark={isDarkMode}
            t={t}
            onPress={() => {}} // Se puede navegar a detalle si existe
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bellBtn: { padding: 10, borderRadius: 12 },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardImage: {
    width: 110,
    minHeight: 110,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 95,
  },
  restaurantBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    gap: 6,
    justifyContent: 'space-between',
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailBtn: { flexDirection: 'row', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
});

export default MyOrdersScreen;
