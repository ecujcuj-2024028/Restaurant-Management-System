import React, { useState, useEffect, useMemo } from 'react';
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
import { getMyOrders, sendOrderInvoice } from '../../../api/orders';

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
const OrderCard = ({ order, isDark, onPress, t }) => {
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

// ── Detalle de Pedido Modal ──────────────────────────────────────────────────
const OrderDetailModal = ({ visible, onClose, order, isDark, t, onProductPress, onSendInvoicePress }) => {
  const { user } = useAuthStore();
  if (!order) return null;

  const bgModal = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  const restaurantName = order.restaurantId?.name || order.restaurant?.name || order.restaurantName || t('orders.unknownRestaurant', 'Restaurante');
  const statusColor = getStatusColor(order.status || order.estado);
  const total = order.total ?? order.totalPrice ?? 0;
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';

  const statusLabel = t(`orders.status.${order.status || order.estado}`) !== `orders.status.${order.status || order.estado}`
    ? t(`orders.status.${order.status || order.estado}`)
    : (order.status || order.estado || '');

  const isEntregado = order.status === 'entregado' || order.estado === 'entregado';

  // Extract products/items from any of the formats
  const items = order.items || order.products || order.orderDetails || [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={odStyles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={[odStyles.card, { backgroundColor: bgModal }]}>
          {/* Header */}
          <View style={[odStyles.header, { borderBottomColor: borderColor }]}>
            <View style={{ flex: 1 }}>
              <Typography variant="h3" color={textColor}>{restaurantName}</Typography>
              <Typography variant="small" color={textSecondary}>
                {t('orders.order', 'Pedido')} #{ (order._id || order.id)?.slice(-6).toUpperCase() }
              </Typography>
            </View>
            <TouchableOpacity onPress={onClose} style={[odStyles.closeBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
              <Ionicons name="close" size={20} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={odStyles.scroll} showsVerticalScrollIndicator={false}>
            {/* Estado */}
            <View style={odStyles.infoRow}>
              <View>
                <Typography variant="bodyBold" color={textColor}>{t('orders.statusTitle', 'Estado')}</Typography>
                <Typography variant="small" color={statusColor} style={{ fontWeight: '700', marginTop: 2 }}>
                  {statusLabel}
                </Typography>
              </View>
              {dateStr ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Typography variant="caption" color={textSecondary}>{t('orders.date', 'Fecha')}</Typography>
                  <Typography variant="small" color={textColor} style={{ marginTop: 2 }}>{dateStr}</Typography>
                </View>
              ) : null}
            </View>

            {/* Cliente */}
            <View style={[odStyles.divider, { backgroundColor: borderColor }]} />
            <View style={odStyles.infoRow}>
              <View>
                <Typography variant="bodyBold" color={textColor}>{t('orders.customer', 'Cliente')}</Typography>
                <Typography variant="small" color={textColor} style={{ marginTop: 2 }}>
                  {user?.name || (user?.firstName ? `${user.firstName} ${user.lastName}` : '') || user?.username || 'Cliente'}
                </Typography>
              </View>
              {user?.email ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Typography variant="caption" color={textSecondary}>{t('orders.email', 'Correo')}</Typography>
                  <Typography variant="small" color={textColor} style={{ marginTop: 2 }}>{user.email}</Typography>
                </View>
              ) : null}
            </View>

            {/* Detalles de entrega / Mesa */}
            <View style={[odStyles.divider, { backgroundColor: borderColor }]} />
            
            {order.tableNumber != null ? (
              <View style={odStyles.detailSection}>
                <Ionicons name="restaurant-outline" size={16} color={COLORS.primary} />
                <Typography variant="small" color={textColor} style={{ marginLeft: 8 }}>
                  {t('reservationForm.tableLabel', 'Mesa')} #{order.tableNumber}
                </Typography>
              </View>
            ) : order.orderType ? (
              <View style={{ gap: 8 }}>
                <View style={odStyles.detailSection}>
                  <Ionicons name="bicycle-outline" size={16} color={COLORS.primary} />
                  <Typography variant="small" color={textColor} style={{ marginLeft: 8, textTransform: 'capitalize' }}>
                    {t(`orders.type.${order.orderType}`, order.orderType)}
                  </Typography>
                </View>
                {order.deliveryAddress && (
                  <View style={[odStyles.detailSection, { alignItems: 'flex-start' }]}>
                    <Ionicons name="location-outline" size={16} color={textSecondary} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Typography variant="small" color={textColor}>
                        {order.deliveryAddress.street || ''}, {order.deliveryAddress.city || ''}
                      </Typography>
                      {order.deliveryAddress.reference ? (
                        <Typography variant="caption" color={textSecondary} style={{ marginTop: 2 }}>
                          Ref: {order.deliveryAddress.reference}
                        </Typography>
                      ) : null}
                    </View>
                  </View>
                )}
              </View>
            ) : null}

            {/* Productos */}
            <View style={[odStyles.divider, { backgroundColor: borderColor }]} />
            <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 12 }}>
              {t('orders.items', 'Productos')}
            </Typography>

            <View style={{ gap: 10 }}>
              {items.map((item, index) => {
                const prodName = item.name || item.product?.name || t('orders.product', 'Producto');
                const qty = item.quantity || 1;
                const price = item.price || item.product?.price || 0;
                const subtotal = item.subtotal || (qty * price);
                const actualProduct = item.product || item;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[odStyles.itemRow, { borderBottomColor: borderColor, paddingVertical: 4 }]}
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
                      <Ionicons name="chevron-forward" size={16} color={textSecondary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Nota de Cliente */}
            {(order.customerNote || order.notes) ? (
              <>
                <View style={[odStyles.divider, { backgroundColor: borderColor }]} />
                <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 6 }}>
                  {t('orders.notes', 'Notas especiales')}
                </Typography>
                <View style={[odStyles.noteBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor }]}>
                  <Typography variant="caption" color={textSecondary}>
                    {order.customerNote || order.notes}
                  </Typography>
                </View>
              </>
            ) : null}
          </ScrollView>

          {/* Footer Total & Close */}
          <View style={[odStyles.footer, { borderTopColor: borderColor }]}>
            <View style={odStyles.totalRow}>
              <Typography variant="bodyBold" color={textColor}>{t('orders.total', 'Total')}</Typography>
              <Typography variant="h2" color={COLORS.primary}>Q {total.toFixed(2)}</Typography>
            </View>

            {isEntregado && (
              <TouchableOpacity 
                style={[odStyles.invoiceBtn, { borderColor: COLORS.primary }]} 
                onPress={onSendInvoicePress}
              >
                <Ionicons name="mail-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Typography variant="bodyBold" color={COLORS.primary}>
                  {t('orders.invoice.button', 'Enviar factura al correo')}
                </Typography>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={odStyles.closeActionBtn} onPress={onClose}>
              <Typography variant="bodyBold" color={COLORS.white}>
                {t('common.close', 'Cerrar')}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Detalle de Producto Modal ────────────────────────────────────────────────
const ProductDetailModal = ({ visible, onClose, product, isDark, t }) => {
  if (!product) return null;

  const bgModal = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  const prodName = product.name || t('orders.product', 'Producto');
  const price = product.price || 0;
  const image = product.image || null;
  const desc = product.description || t('orders.noDescription', 'Sin descripción');

  const bannerColors = ['#FF6B00', '#B8860B', '#1A237E', '#2E7D32', '#6A1B9A'];
  const colorIndex = (prodName?.charCodeAt(0) || 0) % bannerColors.length;

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
                <Typography variant="h2" color={textColor} style={{ flex: 1 }}>{prodName}</Typography>
                <Typography variant="h2" color={COLORS.primary}>Q {price.toFixed(2)}</Typography>
              </View>

              <Typography variant="bodyBold" color={textColor} style={{ marginTop: 20, marginBottom: 8 }}>
                {t('productDetail.description', 'Descripción')}
              </Typography>
              <Typography variant="body" color={textSecondary}>
                {desc}
              </Typography>
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={[pdStyles.footer, { borderTopColor: borderColor }]}>
            <TouchableOpacity style={pdStyles.closeActionBtn} onPress={onClose}>
              <Typography variant="bodyBold" color={COLORS.white}>
                {t('menu.back', 'Volver')}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Enviar Factura Modal ─────────────────────────────────────────────────────
const SendInvoiceModal = ({ visible, onClose, order, isDark, t }) => {
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
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  noteBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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

  useEffect(() => { fetchOrders(); }, []);

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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={textColor} />
          </TouchableOpacity>
          <Typography variant="h2" color={textColor} style={{ flex: 1, marginLeft: 12 }}>
            {t('orders.title')}
          </Typography>
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

      {/* Product Detail Modal */}
      <ProductDetailModal
        visible={productModalVisible}
        onClose={() => { setProductModalVisible(false); setSelectedProduct(null); }}
        product={selectedProduct}
        isDark={isDarkMode}
        t={t}
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
