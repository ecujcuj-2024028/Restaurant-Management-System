import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import useAuthStore from '../../../store/useAuthStore';
import Typography from '../../../shared/components/common/Typography';
import Button from '../../../shared/components/common/Button';
import Skeleton from '../../../shared/components/common/Skeleton';
import { getRestaurants, getRestaurantMenus, getRestaurantProducts } from '../../../api/restaurants';
import { getTablesByRestaurant, getMyReservations } from '../../../api/reservations';
import { createOrder } from '../../../api/orders';
import useOrderCartStore from '../../../store/useOrderCartStore';

const getRecordId = (value) => (value?.id || value?._id)?.toString() ?? null;

// ── Dropdown Selector Component ───────────────────────────────────────────────
const DropdownSelector = ({
  label,
  placeholder,
  items,
  selectedItem,
  onSelect,
  isDark,
  keyExtractor = 'id',
  labelExtractor = 'name',
  icon = 'chevron-down',
  showItemIcon = false,
}) => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const bgColor = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  const displayLabel = selectedItem
    ? typeof selectedItem === 'object'
      ? selectedItem[labelExtractor]
      : selectedItem
    : placeholder;

  return (
    <View style={styles.dropdownContainer}>
      {label && (
        <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 8 }}>
          {label}
        </Typography>
      )}
      <TouchableOpacity
        style={[styles.dropdownButton, { backgroundColor: bgColor, borderColor }]}
        onPress={() => setShowDropdown(true)}
      >
        <Typography variant="body" color={selectedItem ? textColor : COLORS.textSecondary}>
          {displayLabel}
        </Typography>
        <Ionicons name={icon} size={20} color={textColor} />
      </TouchableOpacity>

      <Modal
        transparent
        visible={showDropdown}
        animationType="slide"
        onRequestClose={() => setShowDropdown(false)}
      >
        <View style={[styles.dropdownModal, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.background }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.dropdownHeader, { borderBottomColor: borderColor }]}>
              <Typography variant="headingSmall" color={textColor}>
                {label || 'Seleccionar'}
              </Typography>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            {items.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Typography variant="body" color={COLORS.textSecondary}>
                  {t('orders.noOptions', 'No hay opciones disponibles')}
                </Typography>
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(item) => item[keyExtractor]?.toString() || Math.random().toString()}
                renderItem={({ item }) => {
                  const itemIcon = showItemIcon
                    ? (item.isMenu ? 'layers-outline' : 'restaurant-outline')
                    : null;
                  return (
                    <TouchableOpacity
                      style={[styles.dropdownItem, { backgroundColor: bgColor, borderBottomColor: borderColor }]}
                      onPress={() => {
                        onSelect(item);
                        setShowDropdown(false);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                        {itemIcon && (
                          <Ionicons
                            name={itemIcon}
                            size={18}
                            color={item.isMenu ? COLORS.primary : COLORS.textSecondary}
                          />
                        )}
                        <Typography variant="body" color={textColor} style={{ flex: 1 }}>
                          {item[labelExtractor]}
                        </Typography>
                      </View>
                      {selectedItem && selectedItem[keyExtractor] === item[keyExtractor] && (
                        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                scrollEnabled
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

// ── Order Item Component ──────────────────────────────────────────────────────
const OrderItem = ({ item, isDark, onQuantityChange, onRemove }) => {
  const bgCard = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  const itemTotal = (item.price || 0) * item.quantity;

  return (
    <View style={[styles.orderItemCard, { backgroundColor: bgCard, borderColor }]}>
      <View style={{ flex: 1 }}>
        <Typography variant="bodyBold" color={textColor}>
          {item.name}
        </Typography>
        <Typography variant="small" color={textSecondary} style={{ marginTop: 4 }}>
          Q{item.price?.toFixed(2) || '0.00'}
        </Typography>
      </View>

      <View style={styles.quantityControl}>
        <TouchableOpacity
          onPress={() => onQuantityChange(item.id, item.quantity - 1)}
          style={[styles.quantityButton, { backgroundColor: COLORS.primary + '22' }]}
        >
          <Ionicons name="remove" size={16} color={COLORS.primary} />
        </TouchableOpacity>
        <Typography variant="body" color={textColor} style={{ marginHorizontal: 10 }}>
          {item.quantity}
        </Typography>
        <TouchableOpacity
          onPress={() => onQuantityChange(item.id, item.quantity + 1)}
          style={[styles.quantityButton, { backgroundColor: COLORS.primary + '22' }]}
        >
          <Ionicons name="add" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => onRemove(item.id)} style={{ marginLeft: 12 }}>
        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
      </TouchableOpacity>

      <Typography variant="bodyBold" color={textColor} style={{ marginLeft: 12, minWidth: 70, textAlign: 'right' }}>
        Q{itemTotal.toFixed(2)}
      </Typography>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const CreateOrderScreen = ({ navigation, route }) => {
  const { isDarkMode } = useAuthStore();
  const { t } = useTranslation();
  const cartItems = useOrderCartStore((state) => state.items);
  const persistedRestaurantId = useOrderCartStore((state) => state.restaurantId);
  const persistedTable = useOrderCartStore((state) => state.table);
  const setStoreItems = useOrderCartStore((state) => state.setItems);
  const setStoreRestaurant = useOrderCartStore((state) => state.setRestaurant);
  const setStoreTable = useOrderCartStore((state) => state.setTable);
  const clearStoreCart = useOrderCartStore((state) => state.clearItems);

  // States
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [activeReservations, setActiveReservations] = useState([]);
  const [reservationStatus, setReservationStatus] = useState('checking');
  const initializedCartRef = React.useRef(false);

  const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  // ── Load active reservations + restaurants on mount ─────────────────────────
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);

        // 1. Get my active reservations (confirmada or iniciada)
        const resData = await getMyReservations();
        const allRes = resData?.reservations || [];
        const activeRes = allRes.filter((r) =>
          ['confirmada', 'iniciada', 'aceptada'].includes(r.status)
        );
        setActiveReservations(activeRes);

        if (activeRes.length === 0) {
          setReservationStatus('none');
          setRestaurants([]);
          setTables([]);
          setSelectedRestaurant(null);
          setSelectedTable(null);
          setActiveReservations([]);
          return;
        }

        setReservationStatus('active');

        // 2. Load all restaurants
        const response = await getRestaurants();
        const restaurantList =
          response.restaurants ||
          (Array.isArray(response) ? response : response.data || []);

        const reservationRestaurants = activeRes
          .map((r) => {
            const restaurant = r.restaurant;
            if (restaurant && typeof restaurant === 'object') {
              return { ...restaurant, id: getRecordId(restaurant) || restaurant?.id || restaurant?._id };
            }

            const rId = r.restaurantId || r.restaurant?._id || r.restaurant?.id || r.restaurant;
            if (!rId) return null;

            return { id: rId, _id: rId, name: 'Restaurante' };
          })
          .filter(Boolean);

        // 3. Filter restaurants to only those with active reservations
        const allowedRestaurantIds = new Set(
          activeRes
            .map((r) => {
              const rId = r.restaurantId || r.restaurant?._id || r.restaurant?.id || r.restaurant;
              return typeof rId === 'object' ? rId?._id || rId?.id : rId;
            })
            .filter(Boolean)
        );

        const validRestaurants = [...restaurantList, ...reservationRestaurants].filter((restaurant, index, self) => {
          const id = getRecordId(restaurant);
          return Boolean(id) && allowedRestaurantIds.has(id) && self.findIndex((item) => getRecordId(item) === id) === index;
        });

        setRestaurants(validRestaurants);

        // 4. Auto-select restaurant from params, persisted cart, or the user's active reservation
        const paramRestaurantId = route?.params?.restaurantId || persistedRestaurantId;
        const preferredReservation = activeRes[0];
        const preferredRestaurantId =
          (preferredReservation?.restaurantId || preferredReservation?.restaurant?._id || preferredReservation?.restaurant?.id || preferredReservation?.restaurant)
          ?.toString?.() ||
          null;

        let restaurantToSelect = null;

        if (paramRestaurantId) {
          restaurantToSelect = validRestaurants.find(
            (r) => getRecordId(r) === paramRestaurantId || r._id === paramRestaurantId
          );
        }

        if (!restaurantToSelect && preferredRestaurantId) {
          restaurantToSelect = validRestaurants.find(
            (r) => getRecordId(r)?.toString() === preferredRestaurantId || r._id?.toString() === preferredRestaurantId
          );
        }

        if (!restaurantToSelect && validRestaurants.length === 1) {
          restaurantToSelect = validRestaurants[0];
        }

        if (!restaurantToSelect && validRestaurants.length > 0) {
          restaurantToSelect = validRestaurants[0];
        }

        if (restaurantToSelect) {
          setSelectedRestaurant(restaurantToSelect);
          setStoreRestaurant(restaurantToSelect);
        }
      } catch (error) {
        console.error('Error initializing CreateOrder:', error);
        Alert.alert(t('common.error', 'Error'), t('orders.errorLoadingOrderInfo', 'No se pudo cargar la información. Intenta de nuevo.'));
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  // ── Load products & tables when restaurant changes ───────────────────────────
  useEffect(() => {
    if (!selectedRestaurant) {
      setProducts([]);
      setTables([]);
      setSelectedTable(null);
      return;
    }

    const loadRestaurantData = async () => {
      try {
        setLoading(true);
        const restId = selectedRestaurant.id || selectedRestaurant._id;

        const [productsData, tablesData, menusData] = await Promise.all([
          getRestaurantProducts(restId),
          getTablesByRestaurant(restId, { onlyActiveReservation: true }),
          getRestaurantMenus(restId),
        ]);

        // Parse response — backend returns { products: [...] }, { tables: [...] }, { menus: [...] }
        const productList =
          productsData.products ||
          (Array.isArray(productsData) ? productsData : productsData.data || []);
        const menuList =
          menusData.menus ||
          (Array.isArray(menusData) ? menusData : menusData.data || []);
        const tablesDataList =
          tablesData.tables ||
          (Array.isArray(tablesData) ? tablesData : tablesData.data || []);

        // Normalise label fields for tables
        const normalisedTables = tablesDataList.map((t) => ({
          ...t,
          id: t.id || t._id,
          name: `Mesa #${t.number || t.tableNumber}`,
        }));

        // Unify products and combos/menus in one list
        const allProducts = [
          ...productList.map((p) => ({
            ...p,
            id: (p.id || p._id)?.toString(),
            _id: (p.id || p._id)?.toString(),
            price: p.price ?? 0,
          })),
          ...menuList
            .filter((m) => m.isActive !== false) // only active menus
            .map((m) => {
              const menuId = (m.id || m._id)?.toString();
              const menuPrice =
                m.price ??
                (m.items || []).reduce((s, i) => s + (i.product?.price || i.price || 0), 0);
              return {
                ...m,
                id: menuId,
                _id: menuId,
                isMenu: true,
                price: menuPrice,
                name: m.name || 'Combo',
              };
            }),
        ];

        setProducts(allProducts);
        setTables(normalisedTables);
        setSelectedTable(null);
        setSelectedProduct(null);

        if (persistedTable && normalisedTables.length > 0) {
          const storedTable = normalisedTables.find(
            (t) => getRecordId(t) === getRecordId(persistedTable) || t._id === persistedTable?._id || t.number === persistedTable?.number
          );
          if (storedTable) {
            setSelectedTable(storedTable);
          }
        }

        // Auto-select the table assigned to the active reservation for this restaurant
        const activeResForRest = activeReservations.find((r) => {
          const rId =
            r.restaurantId || r.restaurant?._id || r.restaurant?.id || r.restaurant;
          const targetId = typeof rId === 'object' ? rId?._id || rId?.id : rId;
          return targetId === restId;
        });

        if (activeResForRest?.table && !persistedTable) {
          const reservedTableId =
            activeResForRest.table._id ||
            activeResForRest.table.id ||
            activeResForRest.tableId;
          const matchedTable = normalisedTables.find(
            (t) =>
              t.id === reservedTableId ||
              t._id === reservedTableId ||
              t.number === activeResForRest.table?.number ||
              t.tableNumber === activeResForRest.table?.number ||
              t.number === activeResForRest.table?.tableNumber
          );

          if (matchedTable) {
            setSelectedTable(matchedTable);
            setStoreTable(matchedTable);
          } else if (reservedTableId || activeResForRest.table?.number || activeResForRest.table?.tableNumber) {
            const fallbackTable = {
              id: reservedTableId,
              _id: reservedTableId,
              number: activeResForRest.table?.number || activeResForRest.table?.tableNumber || reservedTableId,
              tableNumber: activeResForRest.table?.number || activeResForRest.table?.tableNumber || reservedTableId,
              name: `Mesa #${activeResForRest.table?.number || activeResForRest.table?.tableNumber || reservedTableId}`,
              capacity: activeResForRest.table?.capacity || 0,
            };
            setSelectedTable(fallbackTable);
            setStoreTable(fallbackTable);
          }
        }
      } catch (error) {
        console.error('Error loading restaurant data:', error);
        Alert.alert(t('common.error', 'Error'), t('orders.errorLoadingRestaurantData', 'No se pudieron cargar los datos del restaurante.'));
      } finally {
        setLoading(false);
      }
    };

    loadRestaurantData();
  }, [selectedRestaurant, persistedTable]);

  useEffect(() => {
    if (!initializedCartRef.current) {
      if (cartItems.length > 0) {
        setOrderItems(cartItems.map((item) => ({ ...item, id: getRecordId(item) || item._id })));
      }
      initializedCartRef.current = true;
    }
  }, [cartItems]);

  useEffect(() => {
    setStoreItems(orderItems.map((item) => ({ ...item, id: getRecordId(item), _id: item._id || item.id })));
  }, [orderItems, setStoreItems]);

  useEffect(() => {
    if (route?.params?.initialProduct && selectedRestaurant && products.length > 0) {
      const initialProduct = route.params.initialProduct;
      const isMenuParam = initialProduct.isMenu === true || Boolean(initialProduct.menuId);

      // Find the matching product/menu in the loaded list
      const foundProduct = products.find(
        (item) =>
          getRecordId(item) === initialProduct.id?.toString() ||
          getRecordId(item) === initialProduct.menuId?.toString() ||
          getRecordId(item) === initialProduct.productId?.toString()
      );

      const productToAdd = foundProduct ?? {
        ...initialProduct,
        id: initialProduct.id?.toString() || initialProduct.menuId?.toString() || initialProduct.productId?.toString(),
        _id: initialProduct.id?.toString() || initialProduct.menuId?.toString() || initialProduct.productId?.toString(),
        isMenu: isMenuParam,
        menuId: isMenuParam ? (initialProduct.menuId || initialProduct.id)?.toString() : undefined,
        productId: !isMenuParam ? (initialProduct.productId || initialProduct.id)?.toString() : undefined,
      };

      setOrderItems((prev) => {
        const existingId = getRecordId(productToAdd);
        const alreadyAdded = prev.some((item) => getRecordId(item) === existingId);
        if (alreadyAdded) return prev;
        return [...prev, { ...productToAdd, quantity: initialProduct.quantity || 1 }];
      });
    }
  }, [selectedRestaurant, products, route?.params?.initialProduct]);

  // ── Add product to order ─────────────────────────────────────────────────────
  const handleAddProduct = useCallback(() => {
    if (!selectedProduct) {
      Alert.alert(t('orders.selectProduct', 'Selecciona un producto'), t('orders.selectProductMessage', 'Por favor selecciona un platillo para agregar.'));
      return;
    }

    const normalizedId = getRecordId(selectedProduct);
    const isMenuItem = Boolean(selectedProduct?.isMenu || selectedProduct?.menuId);

    setOrderItems((prev) => {
      const existing = prev.find((item) => getRecordId(item) === normalizedId);
      if (existing) {
        return prev.map((item) =>
          getRecordId(item) === normalizedId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          ...selectedProduct,
          id: normalizedId,
          _id: normalizedId,
          quantity: 1,
          isMenu: isMenuItem,
          menuId: isMenuItem ? normalizedId : undefined,
          productId: isMenuItem ? undefined : normalizedId,
        },
      ];
    });

    setSelectedProduct(null);
  }, [selectedProduct]);

  // ── Quantity & remove ────────────────────────────────────────────────────────
  const handleQuantityChange = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      setOrderItems((prev) => prev.filter((item) => item.id !== productId));
      return;
    }
    setOrderItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item))
    );
  }, []);

  const handleRemoveItem = useCallback((productId) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  // ── Totals ───────────────────────────────────────────────────────────────────
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const total = subtotal;

  // ── Submit order ─────────────────────────────────────────────────────────────
  const handleCreateOrder = async () => {
    if (reservationStatus !== 'active') {
      Alert.alert(t('orders.reservationRequiredTitle', 'Reserva requerida'), t('orders.reservationRequiredMessage', 'Para hacer un pedido necesitas tener una reserva activa. Ve a Reservas y crea una antes de continuar.'));
      return;
    }

    if (!selectedRestaurant) {
      Alert.alert(t('orders.selectRestaurant', 'Selecciona un restaurante'), t('orders.selectRestaurantMessage', 'Por favor selecciona un restaurante.'));
      return;
    }
    if (!selectedTable) {
      Alert.alert(t('orders.selectTable', 'Selecciona una mesa'), t('orders.selectTableMessage', 'Por favor selecciona tu mesa asignada.'));
      return;
    }
    if (orderItems.length === 0) {
      Alert.alert(t('orders.emptyOrder', 'Pedido vacío'), t('orders.addProductsMessage', 'Agrega al menos un platillo al pedido.'));
      return;
    }

    try {
      setCreatingOrder(true);
      const orderData = {
        restaurantId: selectedRestaurant.id || selectedRestaurant._id,
        tableId: selectedTable.id || selectedTable._id,
        tableNumber:
          selectedTable?.number ||
          selectedTable?.tableNumber ||
          selectedTable?.name?.match(/\d+/)?.[0] ||
          selectedTable?.id ||
          '',
        items: orderItems.map((item) => {
          const normalizedId = item.id || item._id;
          const isMenuItem = Boolean(item.isMenu || item.menuId);

          return {
            ...(isMenuItem
              ? { menuId: normalizedId, isMenu: true }
              : { productId: normalizedId }),
            quantity: item.quantity,
            price: item.price,
          };
        }),
        subtotal,
        total,
        status: 'pendiente',
      };

      await createOrder(orderData);

      Alert.alert(t('orders.orderCreatedTitle', '¡Pedido enviado!'), t('orders.orderCreatedMessage', 'Tu pedido fue creado exitosamente.'), [
        {
          text: 'OK',
          onPress: () => {
            setOrderItems([]);
            setSelectedRestaurant(null);
            setSelectedTable(null);
            setSelectedProduct(null);
            clearStoreCart();
            navigation.navigate('MyOrders');
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating order:', error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        t('orders.errorCreatingOrder', 'Error al crear el pedido.');
      Alert.alert(t('common.error', 'Error'), msg);
    } finally {
      setCreatingOrder(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Typography variant="headingSmall" color={textColor}>
            {t('orders.makeOrder', 'Hacer un pedido')}
          </Typography>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ padding: 16, gap: 16 }}>
          <Skeleton width="100%" height={50} borderRadius={12} isDark={isDarkMode} />
          <Skeleton width="100%" height={50} borderRadius={12} isDark={isDarkMode} />
          <Skeleton width="100%" height={50} borderRadius={12} isDark={isDarkMode} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: bgColor }]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Typography variant="headingSmall" color={textColor}>
            {t('orders.makeOrder', 'Hacer un pedido')}
          </Typography>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Selection Section */}
          <View style={styles.section}>
            <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 8 }}>
              {t('orders.orderDetails', 'Detalles del pedido')}
            </Typography>

            {reservationStatus === 'none' ? (
              <View style={[styles.noticeCard, { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary }]}>
                <Ionicons name="alert-circle-outline" size={22} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold" color={textColor}>
                    {t('orders.noActiveReservationTitle', 'No tienes una reserva activa')}
                  </Typography>
                  <Typography variant="small" color={textSecondary} style={{ marginTop: 4 }}>
                    {t('orders.noActiveReservationMessage', 'Para hacer un pedido debes tener una reserva activa. Ve a Reservas y crea una antes de continuar.')}
                  </Typography>
                </View>
              </View>
            ) : (
              <>
                <DropdownSelector
                  label={t('orders.restaurant', 'Restaurante')}
                  placeholder={t('orders.selectRestaurant', 'Selecciona un restaurante')}
                  items={restaurants}
                  selectedItem={selectedRestaurant}
                  onSelect={(restaurant) => {
                    setSelectedRestaurant(restaurant);
                    setStoreRestaurant(restaurant);
                  }}
                  isDark={isDarkMode}
                  labelExtractor="name"
                />

                {selectedRestaurant && (
                  <DropdownSelector
                    label={t('orders.table', 'Mesa')}
                    placeholder={t('orders.selectTable', 'Selecciona tu mesa')}
                    items={tables}
                    selectedItem={selectedTable}
                    onSelect={(table) => {
                      setSelectedTable(table);
                      setStoreTable(table);
                    }}
                    isDark={isDarkMode}
                    labelExtractor="name"
                  />
                )}
              </>
            )}
          </View>

          {/* Products Section */}
          {selectedRestaurant && (
            <View style={styles.section}>
              <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 8 }}>
                {t('orders.dishes', 'Platillos')}
              </Typography>

              <DropdownSelector
                label={t('orders.selectDish', 'Selecciona un platillo')}
                placeholder={t('orders.chooseDish', 'Elige un platillo o combo')}
                items={products}
                selectedItem={selectedProduct}
                onSelect={setSelectedProduct}
                isDark={isDarkMode}
                labelExtractor="name"
                showItemIcon
              />

              <Button
                title={`+ ${t('orders.addProduct', 'Agregar al pedido')}`}
                onPress={handleAddProduct}
                variant="primary"
                style={{ marginTop: 8, borderWidth: 1.5, borderColor: COLORS.primary }}
                textStyle={{ color: '#FFFFFF' }}
                disabled={!selectedProduct}
              />
            </View>
          )}

          {/* Order Items Section */}
          {orderItems.length > 0 && (
            <View style={styles.section}>
              <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 8 }}>
                {t('orders.orderSummaryTitle', 'Tu pedido')} ({orderItems.length})
              </Typography>

              {orderItems.map((item, index) => (
                <OrderItem
                  key={item.id || item._id || `order-item-${index}`}
                  item={item}
                  isDark={isDarkMode}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))}

              {/* Summary */}
              <View style={[styles.summaryCard, { backgroundColor: surfaceColor, borderColor }]}>
                <View style={styles.summaryRow}>
                  <Typography variant="body" color={textSecondary}>{t('orders.subtotal', 'Subtotal')}</Typography>
                  <Typography variant="body" color={textColor}>Q{subtotal.toFixed(2)}</Typography>
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: borderColor, paddingTop: 12 }]}>
                  <Typography variant="headingSmall" color={textColor}>{t('orders.total', 'Total')}</Typography>
                  <Typography variant="headingSmall" color={COLORS.primary}>Q{total.toFixed(2)}</Typography>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Button */}
        <View style={[styles.footer, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
          <Button
            title={creatingOrder ? t('orders.sendingOrder', 'Enviando pedido...') : t('orders.confirmOrder', 'Confirmar pedido')}
            onPress={handleCreateOrder}
            disabled={!selectedRestaurant || !selectedTable || orderItems.length === 0 || creatingOrder}
            loading={creatingOrder}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 24,
  },
  section: { gap: 12 },
  noticeCard: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  dropdownContainer: { marginBottom: 4 },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownModal: { flex: 1 },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  orderItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});

export default CreateOrderScreen;
