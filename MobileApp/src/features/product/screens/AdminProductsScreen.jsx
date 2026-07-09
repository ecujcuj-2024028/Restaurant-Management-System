import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES, THEME } from '../../../shared/constants/theme';
import { getAdminProducts, updateProductStatus } from '../../../api/products';
import useAuthStore from '../../../store/useAuthStore';
import Typography from '../../../shared/components/common/Typography';
import Card from '../../../shared/components/common/Card';

// Etiquetas legibles para el tipo de producto
const TYPE_LABELS = {
  starter: 'Entrada',
  main: 'Plato Principal',
  dessert: 'Postre',
  beverage: 'Bebida',
  side_dish: 'Acompañante',
  combo: 'Combo',
};

const ProductItem = ({ item, onToggle, isUpdating }) => {
  const typeLabel = TYPE_LABELS[item.type] || item.type;

  return (
    <Card style={styles.productCard}>
      <Image
        source={{
          uri: item.image || 'https://via.placeholder.com/80?text=Plato',
        }}
        style={styles.productImage}
      />

      <View style={styles.productInfo}>
        <Typography variant="bodyBold" numberOfLines={1}>
          {item.name}
        </Typography>

        <View style={styles.badgeRow}>
          <View style={styles.typeBadge}>
            <Typography variant="small" color={COLORS.primary}>
              {typeLabel}
            </Typography>
          </View>
          {item.preparationTime && (
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
              <Typography variant="small" style={styles.timeText}>
                {item.preparationTime} min
              </Typography>
            </View>
          )}
        </View>

        <Typography variant="bodyBold" color={COLORS.primary}>
          ${item.price?.toFixed(2)}
        </Typography>
      </View>

      <View style={styles.switchContainer}>
        {isUpdating ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <>
            <Switch
              value={item.isAvailable}
              onValueChange={(value) => onToggle(item._id, value)}
              trackColor={{ false: COLORS.border, true: `${COLORS.primary}60` }}
              thumbColor={item.isAvailable ? COLORS.primary : COLORS.textSecondary}
            />
            <Typography
              variant="small"
              color={item.isAvailable ? COLORS.success : COLORS.textSecondary}
              style={styles.statusLabel}
            >
              {item.isAvailable ? 'Disponible' : 'Agotado'}
            </Typography>
          </>
        )}
      </View>
    </Card>
  );
};

const AdminProductsScreen = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Guarda el id del producto que se está actualizando para mostrar spinner puntual
  const [updatingId, setUpdatingId] = useState(null);

  // El restaurantId viene del perfil del admin
  const restaurantId = user?.restaurantId || user?.restaurant;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getAdminProducts(restaurantId);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggle = useCallback(async (productId, newValue) => {
    // Actualización optimista: cambia el estado localmente de inmediato
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, isAvailable: newValue } : p))
    );
    setUpdatingId(productId);

    try {
      await updateProductStatus(productId, newValue);
    } catch (error) {
      // Si falla, revertimos el cambio optimista
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, isAvailable: !newValue } : p))
      );
      Alert.alert('Error', 'No se pudo actualizar la disponibilidad del producto.');
    } finally {
      setUpdatingId(null);
    }
  }, []);

  if (loading) {
    return (
      <View style={[COMMON_STYLES.container, COMMON_STYLES.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const available = products.filter((p) => p.isAvailable).length;
  const outOfStock = products.length - available;

  return (
    <View style={COMMON_STYLES.container}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2" color={COLORS.text}>
          Mis Productos
        </Typography>

        {/* Resumen rápido de disponibilidad */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Typography variant="small" color={COLORS.success} style={styles.summaryText}>
              {available} disponibles
            </Typography>
          </View>
          <View style={styles.summaryBadge}>
            <Ionicons name="close-circle" size={14} color={COLORS.error} />
            <Typography variant="small" color={COLORS.error} style={styles.summaryText}>
              {outOfStock} agotados
            </Typography>
          </View>
        </View>
      </View>

      {/* Lista de productos */}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ProductItem
            item={item}
            onToggle={handleToggle}
            isUpdating={updatingId === item._id}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProducts(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={COLORS.border} />
            <Typography variant="body" color={COLORS.textSecondary} style={styles.emptyText}>
              No hay productos registrados
            </Typography>
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
    paddingBottom: THEME.spacing.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.round,
  },
  summaryText: {
    fontWeight: '600',
  },
  listContent: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: COLORS.background,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  typeBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: THEME.spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timeText: {
    marginLeft: 2,
  },
  switchContainer: {
    alignItems: 'center',
    minWidth: 60,
    gap: 4,
  },
  statusLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: THEME.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
});

export default AdminProductsScreen;