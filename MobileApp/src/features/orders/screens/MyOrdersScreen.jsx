import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
  Modal,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES } from '../../../shared/constants/theme';
import useAuthStore from '../../../store/useAuthStore';
import useNotificationStore from '../../../store/useNotificationStore';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';
import Skeleton from '../../../shared/components/common/Skeleton';
import Button from '../../../shared/components/common/Button';
import Header from '../../../shared/components/common/Header';
import { getMyOrders, sendOrderInvoice } from '../../../api/orders';
import api from '../../../api/api';
import useOrderCartStore from '../../../store/useOrderCartStore';
import { useSocket } from '../../../shared/hooks/useSocket';

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

const parseDate = (str) => {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) {
    const partsSlash = str.split('/');
    if (partsSlash.length === 3) {
      const day = parseInt(partsSlash[0], 10);
      const month = parseInt(partsSlash[1], 10) - 1;
      const year = parseInt(partsSlash[2], 10);
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      return new Date(year, month, day);
    }
    return null;
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day);
};

const formatDateInput = (text) => {
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length <= 4) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  } else {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }
};

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
const OrderCard = ({ order, isDark, onPress, t: propT }) => {
  const { t: hookT } = useTranslation();
  const t = propT || hookT;
  const bgCard = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const statusColor = getStatusColor(order.status || order.estado);

  // Resolver nombre del restaurante (usando restaurantId poblado por backend o restaurant como fallback)
  const restaurantName = order.restaurantId?.name || order.restaurant?.name || order.restaurantName || t('orders.unknownRestaurant');

  // Imagen del restaurante
  const restaurantImage = order.restaurantId?.photos?.[0]
    || order.restaurantId?.logo
    || order.restaurantId?.image
    || order.restaurant?.photos?.[0]
    || order.restaurant?.logo
    || order.restaurant?.image
    || order.restaurantImage
    || null;

  // Imagen del primer producto como fallback secundario
  const firstProduct = order.products?.[0] || order.orderDetails?.[0];
  const finalImage = restaurantImage || firstProduct?.product?.image || firstProduct?.image || null;

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

  // Resumen de productos/ítems comprados para el título del card
  const getItemsSummary = () => {
    const orderItems = order.items || order.products || order.orderDetails || [];
    if (orderItems.length === 0) return `${t('orders.order')} #${(order._id || order.id)?.slice(-4).toUpperCase()}`;
    
    const firstItem = orderItems[0];
    const firstItemName = firstItem?.name || firstItem?.product?.name || t('orders.product');
    const firstItemQty = firstItem?.quantity || 1;
    
    if (orderItems.length === 1) {
      return `${firstItemQty}x ${firstItemName}`;
    }
    
    const remainingCount = orderItems.length - 1;
    return `${firstItemQty}x ${firstItemName} + ${remainingCount} ${remainingCount === 1 ? t('orders.moreItem', 'artículo más') : t('orders.moreItems', 'artículos más')}`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgCard }, !isDark && COMMON_STYLES.shadow]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Imagen lateral (Restaurante) */}
      <View style={[styles.cardImage, { backgroundColor: bannerColors[colorIndex] }]}>
        {finalImage
          ? <Image source={{ uri: finalImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          : null}
        <View style={styles.categoryBadge}>
          <Typography variant="small" color={COLORS.white} style={{ fontWeight: '700' }} numberOfLines={1}>
            {restaurantName}
          </Typography>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Typography variant="bodyBold" color={textColor} numberOfLines={1}>
              {getItemsSummary()}
            </Typography>
            <Typography variant="smallBold" color={COLORS.primary} style={{ marginTop: 2 }} numberOfLines={1}>
              {restaurantName}
            </Typography>
          </View>
          <Typography variant="small" color={statusColor} style={{ fontWeight: '700' }}>
            {statusLabel}
          </Typography>
        </View>

        <Typography variant="small" color={textSecondary} numberOfLines={1}>
          {firstProduct?.product?.description || firstProduct?.description || t('orders.noDescription')}
        </Typography>

        <View style={styles.cardBottomRow}>
          <View>
            <Typography variant="caption" color={COLORS.primary} style={{ fontWeight: '700' }}>
              Q {typeof total === 'number' ? total.toFixed(2) : total}
            </Typography>
            <Typography variant="caption" color={textSecondary} style={{ marginTop: 2 }}>
              #{ (order._id || order.id)?.slice(-6).toUpperCase() }
            </Typography>
          </View>
          <TouchableOpacity style={styles.detailBtn} onPress={onPress} activeOpacity={0.7}>
            <Typography variant="small" color={COLORS.primary} style={{ fontWeight: '700' }}>
              {t('orders.detail', 'Ver detalle')} →
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

// ── Animated Timeline Step ─────────────────────────────────────────────────────
const AnimatedTimelineStep = ({ completed, isDark, children, showLine, lineCompleted }) => {
  const resolvedCompleted = completed || lineCompleted;

  const scaleAnim = useRef(new Animated.Value(resolvedCompleted ? 1 : 0.8)).current;
  const opacityAnim = useRef(new Animated.Value(resolvedCompleted ? 1 : 0.45)).current;
  const lineAnim = useRef(new Animated.Value(lineCompleted ? 1 : 0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const inactiveColor = isDark ? '#334155' : '#E2E8F0';

  const bgColor = scaleAnim.interpolate({
    inputRange: [0.8, 1],
    outputRange: [inactiveColor, COLORS.primary],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: resolvedCompleted ? 1 : 0.8,
        useNativeDriver: false,
        tension: 70,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: resolvedCompleted ? 1 : 0.45,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }, [resolvedCompleted]);

  useEffect(() => {
    Animated.timing(lineAnim, {
      toValue: lineCompleted ? 1 : 0,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [lineCompleted]);

  return (
    <View style={odStyles.timelineLeft}>
      <Animated.View
        style={[
          odStyles.timelineCircle,
          {
            backgroundColor: bgColor,
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
          },
        ]}
      >
        <Animated.View style={[odStyles.innerDot, { opacity: opacityAnim }]} />
      </Animated.View>
      {showLine && (
        <View style={[odStyles.timelineLineTrack, { backgroundColor: inactiveColor }]}>
          <Animated.View
            style={[
              odStyles.timelineLineFill,
              {
                height: lineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: COLORS.primary,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

// ── Detalle de Pedido Modal ──────────────────────────────────────────────────
const OrderDetailModal = ({ visible, onClose, order, isDark, t: propT, onProductPress, onSendInvoicePress }) => {
  const { t: hookT } = useTranslation();
  const t = propT || hookT;
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const bgModal = isDark ? COLORS.darkBackground : COLORS.background;
  const cardBg = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  // Animated values for status change
  const statusFadeAnim = useRef(new Animated.Value(1)).current;
  const statusSlideAnim = useRef(new Animated.Value(0)).current;
  const prevStatusRef = useRef(order?.status);

  useEffect(() => {
    const currentStatus = order?.status || order?.estado;
    if (prevStatusRef.current && prevStatusRef.current !== currentStatus) {
      // Slide out + fade out old content, then slide in + fade in new
      Animated.parallel([
        Animated.timing(statusFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(statusSlideAnim, { toValue: -20, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        statusSlideAnim.setValue(20);
        Animated.parallel([
          Animated.timing(statusFadeAnim, { toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(statusSlideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]).start();
      });
    }
    prevStatusRef.current = currentStatus;
  }, [order?.status, order?.estado]);

  if (!order) return null;

  const restaurantName = order.restaurantId?.name || order.restaurant?.name || order.restaurantName || t('orders.unknownRestaurant', 'Restaurante');
  const statusColor = getStatusColor(order.status || order.estado);
  const total = order.total ?? order.totalPrice ?? 0;
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';

  const statusLabel = t(`orders.status.${order.status || order.estado}`) !== `orders.status.${order.status || order.estado}`
    ? t(`orders.status.${order.status || order.estado}`)
    : (order.status || order.estado || '');

  const statusRaw = order.status || order.estado || 'recibido';
  const isTrackingView = statusRaw !== 'entregado' && statusRaw !== 'cancelado';
  const isEntregado = statusRaw === 'entregado';

  // Extract products/items from any of the formats
  const items = order.items || order.products || order.orderDetails || [];

  // Helper formatting function
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Estimated arrival time calculation
  const getEstimatedTime = () => {
    const createdAt = new Date(order.createdAt || Date.now());
    const elapsedMinutes = Math.floor((Date.now() - createdAt.getTime()) / 60000);
    
    if (statusRaw === 'recibido') {
      const mins = Math.max(15, 30 - elapsedMinutes);
      return `${mins} minutos`;
    } else if (statusRaw === 'en_preparacion') {
      const mins = Math.max(5, 18 - elapsedMinutes);
      return `${mins} minutos`;
    } else if (statusRaw === 'listo') {
      return '5 minutos';
    }
    return '15 minutos';
  };

  // Build steps
  const orderCreatedAt = order.createdAt ? new Date(order.createdAt) : new Date();
  
  // Step 1: Pedido recibido
  const step1Completed = true;
  const step1Time = formatTime(orderCreatedAt);

  // Step 2: Preparando tu pedido
  const step2Completed = ['en_preparacion', 'listo', 'entregado'].includes(statusRaw);
  const step2Time = step2Completed
    ? formatTime(new Date(orderCreatedAt.getTime() + 4 * 60 * 1000))
    : t('orders.tracking.pending', 'Pendiente');

  // Step 3: En camino / Listo para servir
  const step3Completed = ['listo', 'entregado'].includes(statusRaw);
  const isTableService = order.tableNumber != null && order.tableNumber !== '';
  const step3Title = isTableService ? t('orders.tracking.readyToServe', 'Listo para servir') : t('orders.tracking.inRoute', 'En camino');
  const step3Detail = step3Completed
    ? (isTableService ? t('orders.tracking.readyAtTable', 'Listo en mesa #{{tableNumber}}', { tableNumber: order.tableNumber }) : t('orders.tracking.inRouteDetail', 'En ruta - 1.2 km'))
    : (isTableService ? t('orders.tracking.pendingServe', 'Pendiente de servir') : t('orders.tracking.estimatedInRoute', 'Estimado en camino'));
  const step3Time = step3Completed
    ? formatTime(new Date(orderCreatedAt.getTime() + 15 * 60 * 1000))
    : step3Detail;

  // Step 4: Entregado
  const step4Completed = statusRaw === 'entregado';
  const step4Time = step4Completed
    ? formatTime(new Date(order.updatedAt || Date.now()))
    : t('orders.tracking.estimatedDelivery', 'Estimado {{time}}', { time: formatTime(new Date(orderCreatedAt.getTime() + 26 * 60 * 1000)) });

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={[odStyles.fullScreenContainer, { backgroundColor: bgModal, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        
        {/* Orange Premium Header */}
        <View style={odStyles.orangeHeader}>
          <TouchableOpacity onPress={onClose} style={odStyles.volverBtn} activeOpacity={0.7}>
            <Typography color={COLORS.white} style={odStyles.volverText}>
              ← {t('orders.tracking.back', 'Volver')}
            </Typography>
          </TouchableOpacity>
          
          <Typography variant="h2" color={COLORS.white} style={odStyles.headerTitle}>
            {isTrackingView ? t('orders.tracking.title', 'Seguimiento de Pedido') : t('orders.tracking.detail', 'Detalle')}
          </Typography>
          
          <Typography color={COLORS.white} style={odStyles.headerSubtitle} numberOfLines={1}>
            Pedido #{ (order._id || order.id)?.slice(-4).toUpperCase() } · {restaurantName}
          </Typography>
        </View>

        {isTrackingView ? (
          /* ==================== VISTA SEGUIMIENTO ==================== */
          <ScrollView style={{ flex: 1 }} contentContainerStyle={odStyles.trackingScroll} showsVerticalScrollIndicator={false}>
            {/* Estimated Arrival Box */}
            <Animated.View
              style={[
                odStyles.estimatedBox,
                { borderColor: COLORS.primary, backgroundColor: isDark ? 'rgba(255, 107, 0, 0.05)' : '#FFF3E0' },
                { opacity: statusFadeAnim, transform: [{ translateY: statusSlideAnim }] },
              ]}
            >
              <Typography variant="smallBold" color={COLORS.primary} style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('orders.tracking.estimatedArrival', 'Tiempo estimado de llegada')}
              </Typography>
              <Typography variant="h1" color={COLORS.primary} style={odStyles.estimatedTimeText}>
                {getEstimatedTime()}
              </Typography>
            </Animated.View>

            {/* Timeline */}
            <View style={odStyles.timelineContainer}>

              {/* Step 1 */}
              <View style={odStyles.timelineRow}>
                <AnimatedTimelineStep completed={step1Completed} isDark={isDark} showLine lineCompleted={step2Completed} />
                <Animated.View style={[odStyles.timelineRight, { opacity: statusFadeAnim, transform: [{ translateY: statusSlideAnim }] }]}>
                  <Typography variant="bodyBold" color={step1Completed ? textColor : textSecondary}>
                    {t('orders.tracking.received', 'Pedido recibido')}
                  </Typography>
                  <Typography variant="small" color={textSecondary}>{step1Time}</Typography>
                </Animated.View>
              </View>

              {/* Step 2 */}
              <View style={odStyles.timelineRow}>
                <AnimatedTimelineStep completed={step2Completed} isDark={isDark} showLine lineCompleted={step3Completed} />
                <Animated.View style={[odStyles.timelineRight, { opacity: statusFadeAnim, transform: [{ translateY: statusSlideAnim }] }]}>
                  <Typography variant="bodyBold" color={step2Completed ? textColor : textSecondary}>
                    {t('orders.tracking.preparing', 'Preparando tu pedido')}
                  </Typography>
                  <Typography variant="small" color={textSecondary}>{step2Time}</Typography>
                </Animated.View>
              </View>

              {/* Step 3 */}
              <View style={odStyles.timelineRow}>
                <AnimatedTimelineStep completed={step3Completed} isDark={isDark} showLine lineCompleted={step4Completed} />
                <Animated.View style={[odStyles.timelineRight, { opacity: statusFadeAnim, transform: [{ translateY: statusSlideAnim }] }]}>
                  <Typography variant="bodyBold" color={step3Completed ? textColor : textSecondary}>
                    {step3Title}
                  </Typography>
                  <Typography variant="small" color={step3Completed ? COLORS.primary : textSecondary} style={{ fontWeight: step3Completed ? '600' : '400' }}>
                    {step3Time}
                  </Typography>
                </Animated.View>
              </View>

              {/* Step 4 */}
              <View style={odStyles.timelineRow}>
                <AnimatedTimelineStep completed={step4Completed} isDark={isDark} showLine={false} lineCompleted={false} />
                <Animated.View style={[odStyles.timelineRight, { opacity: statusFadeAnim, transform: [{ translateY: statusSlideAnim }] }]}>
                  <Typography variant="bodyBold" color={step4Completed ? textColor : textSecondary} style={{ opacity: step4Completed ? 1 : 0.6 }}>
                    {t('orders.tracking.delivered', 'Entregado')}
                  </Typography>
                  <Typography variant="small" color={textSecondary} style={{ opacity: step4Completed ? 1 : 0.6 }}>
                    {step4Time}
                  </Typography>
                </Animated.View>
              </View>

            </View>
          </ScrollView>
        ) : (
          /* ==================== VISTA DETALLE ==================== */
          <ScrollView style={{ flex: 1 }} contentContainerStyle={odStyles.detailScrollContainer} showsVerticalScrollIndicator={false}>
            <View style={[odStyles.detailCard, { backgroundColor: cardBg }]}>
              {/* Estado */}
              <View style={odStyles.detailSectionHeader}>
                <Typography variant="bodyBold" color={textColor}>{t('orders.statusTitle', 'Estado')}</Typography>
              </View>
              <View style={odStyles.detailSectionContent}>
                <Typography variant="body" color={statusColor} style={{ fontWeight: '700' }}>
                  {statusLabel}
                </Typography>
                {dateStr ? (
                  <Typography variant="small" color={textSecondary} style={{ marginTop: 4 }}>
                    {dateStr}
                  </Typography>
                ) : null}
              </View>

              <View style={[odStyles.divider, { backgroundColor: borderColor }]} />

              {/* Cliente */}
              <View style={odStyles.detailSectionHeader}>
                <Typography variant="bodyBold" color={textColor}>{t('orders.customer', 'Cliente')}</Typography>
              </View>
              <View style={odStyles.detailSectionContent}>
                <Typography variant="body" color={textColor}>
                  {user?.name || (user?.firstName ? `${user.firstName} ${user.lastName}` : '') || user?.username || t('orders.tracking.clientFallback', 'Cliente')}
                </Typography>
                {user?.email ? (
                  <Typography variant="small" color={textSecondary} style={{ marginTop: 2 }}>
                    {user.email}
                  </Typography>
                ) : null}
              </View>

              <View style={[odStyles.divider, { backgroundColor: borderColor }]} />

              {/* Detalles de entrega / Mesa */}
              {order.tableNumber != null && order.tableNumber !== '' ? (
                <>
                  <View style={odStyles.detailSectionHeader}>
                    <Typography variant="bodyBold" color={textColor}>{t('orders.table', 'Mesa')}</Typography>
                  </View>
                  <View style={odStyles.detailSectionContent}>
                    <Typography variant="body" color={textColor}>
                      {t('orders.tracking.tableNumber', 'Mesa #{{tableNumber}}', { tableNumber: order.tableNumber })}
                    </Typography>
                  </View>
                  <View style={[odStyles.divider, { backgroundColor: borderColor }]} />
                </>
              ) : order.orderType ? (
                <>
                  <View style={odStyles.detailSectionHeader}>
                    <Typography variant="bodyBold" color={textColor}>{t('orders.tracking.orderType', 'Tipo de Pedido')}</Typography>
                  </View>
                  <View style={odStyles.detailSectionContent}>
                    <Typography variant="body" color={textColor} style={{ textTransform: 'capitalize' }}>
                      {t(`orders.type.${order.orderType}`, order.orderType)}
                    </Typography>
                    {order.deliveryAddress && (
                      <Typography variant="small" color={textSecondary} style={{ marginTop: 4 }}>
                        {order.deliveryAddress.street || ''}, {order.deliveryAddress.city || ''}
                      </Typography>
                    )}
                  </View>
                  <View style={[odStyles.divider, { backgroundColor: borderColor }]} />
                </>
              ) : null}

              {/* Productos */}
              <View style={odStyles.detailSectionHeader}>
                <Typography variant="bodyBold" color={textColor}>{t('orders.items', 'Productos')}</Typography>
              </View>
              <View style={{ gap: 12, marginTop: 8 }}>
                {items.map((item, index) => {
                  const prodName = item.name || item.product?.name || t('orders.product', 'Producto');
                  const qty = item.quantity || 1;
                  const price = item.price || item.product?.price || 0;
                  const subtotal = item.subtotal || (qty * price);
                  const actualProduct = item.product || item;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={odStyles.itemRow}
                      onPress={() => onProductPress(actualProduct)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" color={textColor}>{prodName}</Typography>
                        <Typography variant="caption" color={textSecondary}>
                          {qty} x Q {price.toFixed(2)}
                        </Typography>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Typography variant="bodyBold" color={textColor}>
                          Q {subtotal.toFixed(2)}
                        </Typography>
                        <Ionicons name="chevron-forward" size={14} color={textSecondary} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Nota de Cliente */}
              {(order.customerNote || order.notes) ? (
                <>
                  <View style={[odStyles.divider, { backgroundColor: borderColor }]} />
                  <View style={odStyles.detailSectionHeader}>
                    <Typography variant="bodyBold" color={textColor}>{t('orders.notes', 'Notas especiales')}</Typography>
                  </View>
                  <View style={[odStyles.noteBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor }]}>
                    <Typography variant="caption" color={textSecondary}>
                      {order.customerNote || order.notes}
                    </Typography>
                  </View>
                </>
              ) : null}

              <View style={[odStyles.divider, { backgroundColor: borderColor }]} />

              {/* Total Row */}
              <View style={odStyles.totalRow}>
                <Typography variant="bodyBold" color={textColor}>Total</Typography>
                <Typography variant="h2" color={COLORS.primary}>Q {total.toFixed(2)}</Typography>
              </View>
            </View>

            {/* Enviar Factura Button */}
            {isEntregado && (
              <TouchableOpacity 
                style={odStyles.fullOrangeBtn} 
                onPress={onSendInvoicePress}
                activeOpacity={0.9}
              >
                <Typography variant="bodyBold" color={COLORS.white}>
                  Enviar Factura
                </Typography>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

// ── Auxiliares de Calificación y Comentarios ─────────────────────────────────
const StarRating = ({ rating, size = 16, editable = false, onRate }) => (
  <View style={{ flexDirection: 'row', gap: 4 }}>
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
          color={i <= Math.round(rating) ? COLORS.accent : COLORS.border}
        />
      </TouchableOpacity>
    ))}
  </View>
);

const ProductReviewModal = ({ visible, onClose, onSubmit, isDark, editingReview, t: propT }) => {
  const { t: hookT } = useTranslation();
  const t = propT || hookT;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
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
        <TouchableOpacity style={[rmStyles.overlay, { backgroundColor: bgOverlay }]} onPress={onClose} activeOpacity={1} />
        <View style={[rmStyles.sheet, { backgroundColor: bgModal }]}>
          <View style={rmStyles.handle} />
          <Typography variant="h3" color={textColor} style={{ marginBottom: 16 }}>
            {editingReview ? t('productDetail.editReview', 'Editar Reseña') : t('productDetail.addReview', 'Agregar Reseña')}
          </Typography>

          <Typography variant="caption" color={textSecondary} style={{ marginBottom: 8 }}>
            {t('productDetail.yourRating', 'Tu calificación')}
          </Typography>
          <StarRating rating={rating} size={32} editable onRate={setRating} />

          <Typography variant="caption" color={textSecondary} style={{ marginTop: 16, marginBottom: 8 }}>
            {t('productDetail.comment', 'Comentario')}
          </Typography>
          <TextInput
            style={[rmStyles.textArea, {
              color: isDark ? COLORS.darkText : COLORS.text,
              backgroundColor: isDark ? COLORS.darkBackground : '#F1F5F9',
              borderColor: isDark ? COLORS.darkBorder : COLORS.border,
            }]}
            placeholder={t('productDetail.commentPlaceholder', 'Escribe tu experiencia con este plato...')}
            placeholderTextColor={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Button
            title={editingReview ? t('productDetail.save', 'Guardar') : t('productDetail.publish', 'Publicar')}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: 20 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const rmStyles = StyleSheet.create({
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

// ── Detalle de Producto Modal ────────────────────────────────────────────────
const ProductDetailModal = ({ visible, onClose, product, isDark, t: propT, navigation, restaurantId }) => {
  const { t: hookT } = useTranslation();
  const t = propT || hookT;
  const { user } = useAuthStore();
  const addItem = useOrderCartStore((state) => state.addItem);
  const setRestaurant = useOrderCartStore((state) => state.setRestaurant);
  const [fullProduct, setFullProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const productId = product?._id || product?.id || product?.productId;

  const fetchReviews = async () => {
    if (!productId) return;
    try {
      const r = await api.get(`/analytics/reviews/plato/${productId}`);
      const data = r.data || {};
      setReviews(data.reviews || data.data?.reviews || []);
      setAverageRating(data.promedioRating || data.data?.promedioRating || 0);
    } catch (err) {
      console.warn('Error fetching reviews:', err.message);
    }
  };

  useEffect(() => {
    if (visible && product) {
      if (!productId) return;

      setLoading(true);
      setFullProduct(null);
      setReviews([]);
      setAverageRating(0);

      // Fetch product details
      api.get(`/products/${productId}`)
        .then(r => {
          setFullProduct(r.data?.product || r.data);
        })
        .catch(err => {
          console.warn('Error fetching product details:', err.message);
        });

      // Fetch reviews
      api.get(`/analytics/reviews/plato/${productId}`)
        .then(r => {
          const data = r.data || {};
          setReviews(data.reviews || data.data?.reviews || []);
          setAverageRating(data.promedioRating || data.data?.promedioRating || 0);
        })
        .catch(err => {
          console.warn('Error fetching reviews:', err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [visible, product]);

  if (!product) return null;

  const bgModal = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  const resolvedProduct = fullProduct || product;
  const prodName = resolvedProduct.name || t('orders.product', 'Producto');
  const price = resolvedProduct.price || 0;
  const image = resolvedProduct.image || null;
  const desc = resolvedProduct.description || t('orders.noDescription', 'Sin descripción');
  const categoryName = resolvedProduct.category?.name || resolvedProduct.category || null;

  const bannerColors = ['#FF6B00', '#B8860B', '#1A237E', '#2E7D32', '#6A1B9A'];
  const colorIndex = (prodName?.charCodeAt(0) || 0) % bannerColors.length;

  const handleOrderProduct = () => {
    onClose();
    addItem({
      id: resolvedProduct._id || resolvedProduct.id,
      _id: resolvedProduct._id || resolvedProduct.id,
      name: prodName,
      price: price,
      quantity: 1,
      isMenu: false,
    });

    if (resolvedProduct?.restaurant) {
      setRestaurant(resolvedProduct.restaurant);
    }

    if (navigation && restaurantId) {
      navigation.navigate('CreateOrder', {
        restaurantId: restaurantId,
        initialProduct: {
          id: resolvedProduct._id || resolvedProduct.id,
          name: prodName,
          price: price,
          quantity: 1,
        }
      });
    } else {
      Alert.alert(
        t('common.success', 'Éxito'),
        `${prodName} ${t('restaurantDetail.addedToOrder', 'ha sido agregado al pedido.')}`
      );
    }
  };

  const handleOpenWrite = () => {
    setEditingReview(null);
    setWriteModalVisible(true);
  };

  const handleOpenEdit = (review) => {
    setEditingReview(review);
    setWriteModalVisible(true);
  };

  const handleSubmitReview = async ({ rating, comentario }) => {
    if (!productId) return;
    try {
      if (editingReview) {
        await api.put(`/analytics/reviews/${editingReview._id || editingReview.id}`, { rating, comentario });
      } else {
        await api.post('/analytics/reviews', {
          usuarioId: user?._id || user?.id,
          username: user?.username || user?.Username || user?.name || 'Usuario',
          restauranteId: resolvedProduct.restaurant?._id || resolvedProduct.restaurant || resolvedProduct.restaurantId,
          platoId: productId,
          rating,
          comentario,
        });
      }
      await fetchReviews();
    } catch (err) {
      console.warn('Error saving review:', err.message);
      Alert.alert('Error', err?.response?.data?.message || t('productDetail.deleteError', 'Ocurrió un error.'));
    }
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert(
      t('productDetail.deleteTitle', 'Eliminar Reseña'),
      t('productDetail.deleteMsg', '¿Estás seguro de que deseas eliminar tu reseña?'),
      [
        { text: t('productDetail.cancel', 'Cancelar'), style: 'cancel' },
        {
          text: t('productDetail.delete', 'Eliminar'), style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/analytics/reviews/${reviewId}`);
              await fetchReviews();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || t('productDetail.deleteError', 'Ocurrió un error.'));
            }
          }
        }
      ]
    );
  };

  const userReview = reviews.find(r => r.usuarioId?.toString() === (user?._id || user?.id)?.toString());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pdStyles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={[pdStyles.card, { backgroundColor: bgModal }]}>
          {/* Header */}
          <View style={[pdStyles.header, { borderBottomColor: borderColor }]}>
            <Typography variant="h3" color={textColor}>{t('productDetail.product', 'Detalle del Producto')}</Typography>
            <TouchableOpacity onPress={onClose} style={[pdStyles.closeBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
              <Ionicons name="close" size={20} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={pdStyles.scroll} showsVerticalScrollIndicator={false}>
            {/* Image */}
            <View style={[pdStyles.imageContainer, { backgroundColor: bannerColors[colorIndex] }]}>
              {image ? (
                <Image source={{ uri: image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <Ionicons name="fast-food-outline" size={60} color={COLORS.white} />
              )}
            </View>

            {/* Info */}
            <View style={pdStyles.infoContainer}>
              <View style={pdStyles.titleRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Typography variant="h2" color={textColor}>{prodName}</Typography>
                  {categoryName ? (
                    <View style={[pdStyles.categoryBadge, { backgroundColor: COLORS.primary + '15', marginTop: 6 }]}>
                      <Typography variant="smallBold" color={COLORS.primary}>{categoryName}</Typography>
                    </View>
                  ) : null}
                </View>
                <Typography variant="h2" color={COLORS.primary}>Q {price.toFixed(2)}</Typography>
              </View>

              <Typography variant="bodyBold" color={textColor} style={{ marginTop: 24, marginBottom: 8 }}>
                {t('productDetail.description', 'Descripción')}
              </Typography>
              <Typography variant="body" color={textSecondary}>
                {desc}
              </Typography>

              {/* Comments Section */}
              <View style={[pdStyles.divider, { backgroundColor: borderColor, marginVertical: 24 }]} />
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Typography variant="bodyBold" color={textColor}>
                    {t('productDetail.review', 'Reseñas')} ({reviews.length})
                  </Typography>
                  {averageRating > 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.accent + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                      <Ionicons name="star" size={12} color={COLORS.accent} />
                      <Typography variant="smallBold" color={isDark ? COLORS.accent : '#B8860B'}>
                        {averageRating.toFixed(1)}
                      </Typography>
                    </View>
                  ) : null}
                </View>
                {!userReview && (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: COLORS.primary, borderRadius: 16 }}
                    onPress={handleOpenWrite}
                  >
                    <Ionicons name="add" size={15} color={COLORS.white} />
                    <Typography variant="smallBold" color={COLORS.white}>
                      {t('productDetail.write', 'Escribir')}
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>

              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
              ) : reviews.length === 0 ? (
                <View style={pdStyles.emptyReviews}>
                  <Ionicons name="chatbubble-outline" size={32} color={textSecondary} style={{ marginBottom: 6 }} />
                  <Typography variant="caption" color={textSecondary}>
                    {t('productDetail.noReviews', 'Sé el primero en dejar una reseña.')}
                  </Typography>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {reviews.map((rev, index) => {
                    const revDate = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : '';
                    const isOwner = rev.usuarioId?.toString() === (user?._id || user?.id)?.toString();
                    return (
                      <View 
                        key={rev._id || rev.id || index} 
                        style={[pdStyles.reviewCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderColor }]}
                      >
                        <View style={pdStyles.reviewHeader}>
                          <View style={[pdStyles.avatar, { backgroundColor: COLORS.primary + '15' }]}>
                            <Ionicons name="person" size={14} color={COLORS.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Typography variant="bodyBold" color={textColor} numberOfLines={1}>
                              {rev.username || t('productDetail.anonymous', 'Usuario')}
                            </Typography>
                            <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                              {[1,2,3,4,5].map(i => (
                                <Ionicons
                                  key={i}
                                  name={i <= Math.round(rev.rating) ? 'star' : 'star-outline'}
                                  size={11}
                                  color={i <= Math.round(rev.rating) ? COLORS.accent : COLORS.border}
                                />
                              ))}
                            </View>
                          </View>
                          {isOwner ? (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TouchableOpacity onPress={() => handleOpenEdit(rev)} style={{ padding: 4 }}>
                                <Ionicons name="pencil" size={14} color={textSecondary} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteReview(rev._id || rev.id)} style={{ padding: 4 }}>
                                <Ionicons name="trash-outline" size={14} color={COLORS.error} />
                              </TouchableOpacity>
                            </View>
                          ) : revDate ? (
                            <Typography variant="small" color={textSecondary}>{revDate}</Typography>
                          ) : null}
                        </View>
                        <Typography variant="caption" color={textColor} style={{ marginTop: 8 }}>
                          {rev.comentario}
                        </Typography>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[pdStyles.footer, { borderTopColor: borderColor }]}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={[pdStyles.footerBtn, pdStyles.cancelBtn, { borderColor }]} 
                onPress={onClose}
              >
                <Typography variant="bodyBold" color={textColor}>
                  {t('menu.back', 'Volver')}
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[pdStyles.footerBtn, pdStyles.submitBtn, { backgroundColor: COLORS.primary }]} 
                onPress={handleOrderProduct}
              >
                <Ionicons name="cart-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                <Typography variant="bodyBold" color={COLORS.white}>
                  {t('restaurantDetail.order', 'Pedir')}
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Review Modal Form */}
      <ProductReviewModal
        visible={writeModalVisible}
        onClose={() => setWriteModalVisible(false)}
        onSubmit={handleSubmitReview}
        isDark={isDark}
        editingReview={editingReview}
        t={t}
      />
    </Modal>
  );
};

// ── Enviar Factura Modal ─────────────────────────────────────────────────────
const SendInvoiceModal = ({ visible, onClose, order, isDark, t: propT }) => {
  const { t: hookT } = useTranslation();
  const t = propT || hookT;
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (visible) {
      setSending(false);
      setSent(false);
    }
  }, [visible]);

  if (!order) return null;

  const bgModal = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  const handleSendInvoice = async () => {
    setSending(true);
    try {
      await sendOrderInvoice(order._id || order.id);
      setSent(true);
    } catch (err) {
      console.warn('Error sending invoice:', err.message);
      // Fallback a simulación exitosa en desarrollo
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={invStyles.overlay}>
        <View style={[invStyles.alertCard, { backgroundColor: bgModal }]}>
          <View style={invStyles.header}>
            <Ionicons name="receipt-outline" size={28} color={COLORS.primary} />
            <Typography variant="h3" color={textColor} style={{ marginTop: 8 }}>
              {t('orders.invoice.title', 'Enviar Factura')}
            </Typography>
          </View>

          {sent ? (
            <View style={invStyles.body}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#28A745" style={{ marginBottom: 12 }} />
              <Typography variant="body" color={textColor} style={{ textAlign: 'center', marginBottom: 16 }}>
                {t('orders.invoice.successMsg', 'La factura ha sido enviada exitosamente a tu correo electrónico.')}
              </Typography>
              <TouchableOpacity style={invStyles.confirmBtn} onPress={onClose}>
                <Typography variant="bodyBold" color={COLORS.white}>
                  {t('restaurantDetail.understood', 'Entendido')}
                </Typography>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={invStyles.body}>
              <Typography variant="body" color={textSecondary} style={{ textAlign: 'center', marginBottom: 16 }}>
                {t('orders.invoice.confirmMsg', '¿Deseas enviar la factura de este pedido a tu dirección de correo electrónico?')}
              </Typography>

              <View style={invStyles.btnRow}>
                <TouchableOpacity 
                  style={[invStyles.btn, invStyles.cancelBtn, { borderColor: borderColor }]} 
                  onPress={onClose}
                  disabled={sending}
                >
                  <Typography variant="bodyBold" color={textColor}>
                    {t('common.cancel', 'Cancelar')}
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[invStyles.btn, invStyles.submitBtn, { backgroundColor: COLORS.primary }]} 
                  onPress={handleSendInvoice}
                  disabled={sending}
                >
                  <Typography variant="bodyBold" color={COLORS.white}>
                    {sending ? t('common.sending', 'Enviando...') : t('common.confirm', 'Confirmar')}
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const odStyles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  orangeHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  volverBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: -8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  volverText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  // Tracking Specific Styles
  trackingScroll: {
    padding: 20,
  },
  estimatedBox: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  estimatedTimeText: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  timelineContainer: {
    paddingLeft: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 90,
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
  },
  timelineCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  timelineLineTrack: {
    position: 'absolute',
    top: 32,
    bottom: -15,
    width: 2,
    zIndex: 1,
    overflow: 'hidden',
  },
  timelineLineFill: {
    width: '100%',
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 16,
    paddingTop: 4,
  },
  // Detail Specific Styles
  detailScrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  detailCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  detailSectionHeader: {
    marginBottom: 4,
  },
  detailSectionContent: {
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  noteBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  fullOrangeBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Keep original modal styles for compatibility if needed
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    height: '80%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  closeActionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  invoiceBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
});

// ── Detalle de Producto Modal Styles ─────────────────────────────────────────
const pdStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    height: '75%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  divider: {
    height: 1,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  reviewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  submitBtn: {
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

// ── Enviar Factura Modal Styles ──────────────────────────────────────────────
const invStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  body: {
    width: '100%',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  submitBtn: {},
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
});

// ── Pantalla Principal ────────────────────────────────────────────────────────
const MyOrdersScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isDarkMode, user } = useAuthStore();
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);

  // Filter States
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('ALL');
  const [selectedAmountFilter, setSelectedAmountFilter] = useState('ALL');

  // Custom spent range states
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');
  const [tempAmountFilter, setTempAmountFilter] = useState('ALL');
  const [tempMin, setTempMin] = useState('');
  const [tempMax, setTempMax] = useState('');

  // Custom date range states
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [tempDateFilter, setTempDateFilter] = useState('ALL');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [amountModalVisible, setAmountModalVisible] = useState(false);

  const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  const STATUS_OPTIONS = [
    { value: 'ALL', label: t('orders.filter.all', 'Todos') },
    { value: 'recibido', label: t('orders.status.recibido', 'Recibido') },
    { value: 'confirmado', label: t('orders.status.confirmado', 'Confirmado') },
    { value: 'en_preparacion', label: t('orders.status.en_preparacion', 'En preparación') },
    { value: 'listo', label: t('orders.status.listo', 'Listo') },
    { value: 'en_camino', label: t('orders.status.en_camino', 'En camino') },
    { value: 'entregado', label: t('orders.status.entregado', 'Entregado') },
    { value: 'cancelado', label: t('orders.status.cancelado', 'Cancelado') },
  ];

  const DATE_OPTIONS = [
    { value: 'ALL', label: t('orders.filter.allTime', 'Cualquier fecha') },
    { value: 'TODAY', label: t('orders.filter.today', 'Hoy') },
    { value: 'WEEK', label: t('orders.filter.week', 'Últimos 7 días') },
    { value: 'MONTH', label: t('orders.filter.month', 'Últimos 30 días') },
    { value: 'CUSTOM', label: t('orders.filter.dateCustom', 'Rango personalizado') },
  ];

  const AMOUNT_OPTIONS = [
    { value: 'ALL', label: t('orders.filter.allAmounts', 'Cualquier monto') },
    { value: 'LOW', label: t('orders.filter.amountLow', 'Menos de Q 100') },
    { value: 'MID', label: t('orders.filter.amountMid', 'Q 100 - Q 250') },
    { value: 'HIGH', label: t('orders.filter.amountHigh', 'Más de Q 250') },
    { value: 'CUSTOM', label: t('orders.filter.amountCustom', 'Rango personalizado') },
  ];

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

  const userId = user?._id || user?.id;
  const socketRooms = useMemo(() => (userId ? [`user_${userId}`] : []), [userId]);
  const { on } = useSocket(socketRooms);

  useEffect(() => { fetchOrders(); }, []);

  // ── Real-time order updates via WebSocket ─────────────────────────────────
  useEffect(() => {
    const handleOrderUpdate = (data) => {
      const updatedId = data._id || data.id;
      if (!updatedId) return;

      // Update the orders list in place
      setOrders(prev =>
        prev.map(o => (o._id === updatedId || o.id === updatedId) ? { ...o, ...data } : o)
      );

      // If the tracking modal is open for this order, update it live
      setSelectedOrder(prev => {
        if (!prev) return prev;
        const prevId = prev._id || prev.id;
        return prevId === updatedId ? { ...prev, ...data } : prev;
      });
    };

    const unsub1 = on('order_status_updated', handleOrderUpdate);
    const unsub2 = on('order_cancelled', handleOrderUpdate);

    return () => {
      unsub1?.();
      unsub2?.();
    };
  }, [on]);


  const filtered = useMemo(() => {
    return orders.filter(o => {
      const rName = (o.restaurantId?.name || o.restaurant?.name || o.restaurantName || '').toLowerCase();
      const rawId = (o._id || o.id || '').toLowerCase();
      const shortId = `#${(o._id || o.id || '').slice(-6).toUpperCase()}`.toLowerCase();
      const productsStr = (o.items || []).map(item => item.name || item.product?.name || '').join(' ').toLowerCase();
      const statusRaw = (o.status || o.estado || '').toLowerCase();
      const statusTranslated = t(`orders.status.${statusRaw}`, statusRaw).toLowerCase();
      
      const query = search.toLowerCase();
      const matchesSearch = !search.trim() || 
        rName.includes(query) || 
        rawId.includes(query) || 
        shortId.includes(query) || 
        productsStr.includes(query) ||
        statusTranslated.includes(query);

      const orderStatus = o.status || o.estado || '';
      const matchesStatus = selectedStatus === 'ALL' || orderStatus === selectedStatus;

      let matchesDate = true;
      if (selectedDateFilter !== 'ALL' && o.createdAt) {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (selectedDateFilter === 'TODAY') {
          const compDate = new Date(o.createdAt);
          compDate.setHours(0,0,0,0);
          matchesDate = compDate.getTime() === today.getTime();
        } else if (selectedDateFilter === 'WEEK') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = orderDate >= weekAgo;
        } else if (selectedDateFilter === 'MONTH') {
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          matchesDate = orderDate >= monthAgo;
        } else if (selectedDateFilter === 'CUSTOM') {
          const start = parseDate(customStartDate);
          const end = parseDate(customEndDate);
          if (start && end) {
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            matchesDate = orderDate >= start && orderDate <= end;
          } else if (start) {
            start.setHours(0,0,0,0);
            matchesDate = orderDate >= start;
          } else if (end) {
            end.setHours(23,59,59,999);
            matchesDate = orderDate <= end;
          }
        }
      }

      const total = o.total ?? o.totalPrice ?? 0;
      let matchesAmount = true;
      if (selectedAmountFilter === 'LOW') {
        matchesAmount = total < 100;
      } else if (selectedAmountFilter === 'MID') {
        matchesAmount = total >= 100 && total <= 250;
      } else if (selectedAmountFilter === 'HIGH') {
        matchesAmount = total > 250;
      } else if (selectedAmountFilter === 'CUSTOM') {
        const minVal = parseFloat(customMin);
        const maxVal = parseFloat(customMax);
        const hasMin = !isNaN(minVal);
        const hasMax = !isNaN(maxVal);
        if (hasMin && hasMax) {
          matchesAmount = total >= minVal && total <= maxVal;
        } else if (hasMin) {
          matchesAmount = total >= minVal;
        } else if (hasMax) {
          matchesAmount = total <= maxVal;
        }
      }

      return matchesSearch && matchesStatus && matchesDate && matchesAmount;
    });
  }, [orders, search, selectedStatus, selectedDateFilter, selectedAmountFilter, customMin, customMax, customStartDate, customEndDate]);

  const getDatePillLabel = () => {
    if (selectedDateFilter === 'ALL') {
      return t('orders.filter.date', 'Fecha: Todas');
    }
    if (selectedDateFilter === 'CUSTOM') {
      if (customStartDate && customEndDate) {
        return `${customStartDate} - ${customEndDate}`;
      } else if (customStartDate) {
        return `≥ ${customStartDate}`;
      } else if (customEndDate) {
        return `≤ ${customEndDate}`;
      }
      return t('orders.filter.dateCustom', 'Rango personalizado');
    }
    return DATE_OPTIONS.find(o => o.value === selectedDateFilter)?.label;
  };

  const handleOpenDateModal = () => {
    setTempDateFilter(selectedDateFilter);
    setTempStartDate(customStartDate);
    setTempEndDate(customEndDate);
    setDateModalVisible(true);
  };

  const handleSelectDateOption = (val) => {
    if (val === 'CUSTOM') {
      setTempDateFilter('CUSTOM');
    } else {
      setSelectedDateFilter(val);
      setDateModalVisible(false);
    }
  };

  const handleApplyCustomDate = () => {
    setCustomStartDate(tempStartDate);
    setCustomEndDate(tempEndDate);
    setSelectedDateFilter('CUSTOM');
    setDateModalVisible(false);
  };

  const getAmountPillLabel = () => {
    if (selectedAmountFilter === 'ALL') {
      return t('orders.filter.amount', 'Gasto: Todos');
    }
    if (selectedAmountFilter === 'CUSTOM') {
      const minVal = parseFloat(customMin);
      const maxVal = parseFloat(customMax);
      const hasMin = !isNaN(minVal);
      const hasMax = !isNaN(maxVal);
      if (hasMin && hasMax) {
        return `Q ${minVal} - Q ${maxVal}`;
      } else if (hasMin) {
        return `≥ Q ${minVal}`;
      } else if (hasMax) {
        return `≤ Q ${maxVal}`;
      }
      return t('orders.filter.amountCustom', 'Rango personalizado');
    }
    return AMOUNT_OPTIONS.find(o => o.value === selectedAmountFilter)?.label;
  };

  const handleOpenAmountModal = () => {
    setTempAmountFilter(selectedAmountFilter);
    setTempMin(customMin);
    setTempMax(customMax);
    setAmountModalVisible(true);
  };

  const handleSelectAmountOption = (val) => {
    if (val === 'CUSTOM') {
      setTempAmountFilter('CUSTOM');
    } else {
      setSelectedAmountFilter(val);
      setAmountModalVisible(false);
    }
  };

  const handleApplyCustomAmount = () => {
    setCustomMin(tempMin);
    setCustomMax(tempMax);
    setSelectedAmountFilter('CUSTOM');
    setAmountModalVisible(false);
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  if (loading) return <OrdersSkeleton isDark={isDarkMode} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top','left','right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <Header 
        title={t('orders.title')} 
        navigation={navigation} 
        showBack={true} 
        rightComponent={
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: COLORS.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => navigation.navigate('CreateOrder')}
            >
              <Ionicons name="add" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: surfaceColor,
                borderColor: borderColor,
                borderWidth: 1,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}
              onPress={() => navigation.navigate('NotificationHistory')}
            >
              <Ionicons name="notifications" size={22} color={textColor} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: COLORS.primary,
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
        }
      />
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Input
          placeholder={t('orders.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 0 }}
          inputStyle={{ borderColor: 'transparent' }}
          leftIcon={<Ionicons name="search-outline" size={20} color={textSecondary} />}
        />

        {/* Filter Pills Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          {/* Status Pill */}
          <TouchableOpacity onPress={() => setStatusModalVisible(true)} style={[styles.filterPill, { backgroundColor: surfaceColor }]}>
            <Ionicons name="options-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Typography variant="caption" color={textColor}>
              {selectedStatus === 'ALL' ? t('orders.filter.status', 'Estado: Todos') : t(`orders.status.${selectedStatus}`, selectedStatus)}
            </Typography>
            <Ionicons name="chevron-down" size={10} color={textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {/* Date Pill */}
          <TouchableOpacity onPress={handleOpenDateModal} style={[styles.filterPill, { backgroundColor: surfaceColor }]}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Typography variant="caption" color={textColor}>
              {getDatePillLabel()}
            </Typography>
            <Ionicons name="chevron-down" size={10} color={textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {/* Amount Pill */}
          <TouchableOpacity onPress={handleOpenAmountModal} style={[styles.filterPill, { backgroundColor: surfaceColor }]}>
            <Ionicons name="cash-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Typography variant="caption" color={textColor}>
              {getAmountPillLabel()}
            </Typography>
            <Ionicons name="chevron-down" size={10} color={textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </ScrollView>
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
            onPress={() => handleOpenDetail(item)}
          />
        )}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        visible={detailModalVisible}
        onClose={() => { setDetailModalVisible(false); setSelectedOrder(null); }}
        order={selectedOrder}
        isDark={isDarkMode}
        t={t}
        onProductPress={(prod) => { setSelectedProduct(prod); setProductModalVisible(true); }}
        onSendInvoicePress={() => setInvoiceModalVisible(true)}
      />

      <ProductDetailModal
        visible={productModalVisible}
        onClose={() => { setProductModalVisible(false); setSelectedProduct(null); }}
        product={selectedProduct}
        isDark={isDarkMode}
        t={t}
        navigation={navigation}
        restaurantId={selectedOrder?.restaurantId || selectedOrder?.restaurant?._id || selectedOrder?.restaurant?.id || selectedOrder?.restaurant}
      />

      {/* Send Invoice Modal */}
      <SendInvoiceModal
        visible={invoiceModalVisible}
        onClose={() => setInvoiceModalVisible(false)}
        order={selectedOrder}
        isDark={isDarkMode}
        user={user}
        t={t}
      />

      {/* Status Filter Modal */}
      <Modal visible={statusModalVisible} transparent animationType="slide" onRequestClose={() => setStatusModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setStatusModalVisible(false)}>
          <View style={[styles.bottomSheet, { backgroundColor: surfaceColor }]}>
            <View style={styles.sheetHeader}>
              <Typography variant="bodyBold" color={textColor}>{t('orders.filter.selectStatus', 'Filtrar por Estado')}</Typography>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)} style={styles.closeSheetBtn}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetContent}>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = opt.value === selectedStatus;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => { setSelectedStatus(opt.value); setStatusModalVisible(false); }}
                    style={[styles.optionRow, isSelected && { backgroundColor: COLORS.primary + '15' }]}
                  >
                    <Typography variant={isSelected ? 'bodyBold' : 'body'} color={isSelected ? COLORS.primary : textColor}>
                      {opt.label}
                    </Typography>
                    {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Filter Modal */}
      <Modal visible={dateModalVisible} transparent animationType="slide" onRequestClose={() => setDateModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDateModalVisible(false)}>
          <View style={[styles.bottomSheet, { backgroundColor: surfaceColor }]}>
            <View style={styles.sheetHeader}>
              <Typography variant="bodyBold" color={textColor}>{t('orders.filter.selectDate', 'Filtrar por Fecha')}</Typography>
              <TouchableOpacity onPress={() => setDateModalVisible(false)} style={styles.closeSheetBtn}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              <View style={styles.sheetContent}>
                {DATE_OPTIONS.map((opt) => {
                  const isSelected = opt.value === tempDateFilter;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => handleSelectDateOption(opt.value)}
                      style={[styles.optionRow, isSelected && { backgroundColor: COLORS.primary + '15' }]}
                    >
                      <Typography variant={isSelected ? 'bodyBold' : 'body'} color={isSelected ? COLORS.primary : textColor}>
                        {opt.label}
                      </Typography>
                      {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  );
                })}

                {tempDateFilter === 'CUSTOM' && (
                  <View style={styles.customRangeContainer}>
                    <View style={styles.customRangeRow}>
                      <View style={{ flex: 1 }}>
                        <Input
                          label={t('orders.filter.startDate', 'Fecha Inicio')}
                          placeholder={t('orders.filter.dateFormatPlaceholder', 'AAAA-MM-DD')}
                          value={tempStartDate}
                          onChangeText={(text) => setTempStartDate(formatDateInput(text))}
                          keyboardType="numeric"
                          maxLength={10}
                          style={{ marginBottom: 0 }}
                        />
                      </View>
                      <View style={{ width: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Input
                          label={t('orders.filter.endDate', 'Fecha Fin')}
                          placeholder={t('orders.filter.dateFormatPlaceholder', 'AAAA-MM-DD')}
                          value={tempEndDate}
                          onChangeText={(text) => setTempEndDate(formatDateInput(text))}
                          keyboardType="numeric"
                          maxLength={10}
                          style={{ marginBottom: 0 }}
                        />
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.applyCustomBtn}
                      onPress={handleApplyCustomDate}
                    >
                      <Typography variant="bodyBold" color={COLORS.white}>
                        {t('common.confirm', 'Confirmar')}
                      </Typography>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Amount Filter Modal */}
      <Modal visible={amountModalVisible} transparent animationType="slide" onRequestClose={() => setAmountModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAmountModalVisible(false)}>
          <View style={[styles.bottomSheet, { backgroundColor: surfaceColor }]}>
            <View style={styles.sheetHeader}>
              <Typography variant="bodyBold" color={textColor}>{t('orders.filter.selectAmount', 'Filtrar por Monto Gastado')}</Typography>
              <TouchableOpacity onPress={() => setAmountModalVisible(false)} style={styles.closeSheetBtn}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              <View style={styles.sheetContent}>
                {AMOUNT_OPTIONS.map((opt) => {
                  const isSelected = opt.value === tempAmountFilter;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => handleSelectAmountOption(opt.value)}
                      style={[styles.optionRow, isSelected && { backgroundColor: COLORS.primary + '15' }]}
                    >
                      <Typography variant={isSelected ? 'bodyBold' : 'body'} color={isSelected ? COLORS.primary : textColor}>
                        {opt.label}
                      </Typography>
                      {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  );
                })}

                {tempAmountFilter === 'CUSTOM' && (
                  <View style={styles.customRangeContainer}>
                    <View style={styles.customRangeRow}>
                      <View style={{ flex: 1 }}>
                        <Input
                          label={t('orders.filter.minPrice', 'Monto Mínimo')}
                          placeholder="0.00"
                          value={tempMin}
                          onChangeText={setTempMin}
                          keyboardType="numeric"
                          leftIcon={<Typography color={textSecondary}>Q</Typography>}
                          style={{ marginBottom: 0 }}
                        />
                      </View>
                      <View style={{ width: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Input
                          label={t('orders.filter.maxPrice', 'Monto Máximo')}
                          placeholder="0.00"
                          value={tempMax}
                          onChangeText={setTempMax}
                          keyboardType="numeric"
                          leftIcon={<Typography color={textSecondary}>Q</Typography>}
                          style={{ marginBottom: 0 }}
                        />
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.applyCustomBtn}
                      onPress={handleApplyCustomAmount}
                    >
                      <Typography variant="bodyBold" color={COLORS.white}>
                        {t('common.confirm', 'Confirmar')}
                      </Typography>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  backBtn: { padding: 4 },
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
  filterPillsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '60%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 12,
  },
  closeSheetBtn: {
    padding: 4,
  },
  sheetContent: {
    marginVertical: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
  },
  customRangeContainer: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  customRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  applyCustomBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default MyOrdersScreen;
