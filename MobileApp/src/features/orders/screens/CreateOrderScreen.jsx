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
import { COMMON_STYLES } from '../../../shared/constants/theme';
import useAuthStore from '../../../store/useAuthStore';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';
import Button from '../../../shared/components/common/Button';
import Skeleton from '../../../shared/components/common/Skeleton';
import { getRestaurants, getRestaurantMenus, getRestaurantProducts } from '../../../api/restaurants';
import { getTablesByRestaurant } from '../../../api/reservations';
import { createOrder } from '../../../api/orders';

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
}) => {
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
        style={[
          styles.dropdownButton,
          {
            backgroundColor: bgColor,
            borderColor,
          },
        ]}
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
            <View style={styles.dropdownHeader}>
              <Typography variant="headingSmall" color={textColor}>
                {label || 'Seleccionar'}
              </Typography>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => item[keyExtractor]?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    {
                      backgroundColor: bgColor,
                      borderBottomColor: borderColor,
                    },
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setShowDropdown(false);
                  }}
                >
                  <Typography variant="body" color={textColor}>
                    {item[labelExtractor]}
                  </Typography>
                  {selectedItem && selectedItem[keyExtractor] === item[keyExtractor] && (
                    <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              )}
              scrollEnabled
            />
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
          ${item.price?.toFixed(2) || '0.00'}
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
          style={[styles.quantityButton, { backgroundColor: COLORS.accent + '22' }]}
        >
          <Ionicons name="add" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => onRemove(item.id)} style={{ marginLeft: 12 }}>
        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
      </TouchableOpacity>

      <Typography variant="bodyBold" color={textColor} style={{ marginLeft: 12, minWidth: 70, textAlign: 'right' }}>
        ${itemTotal.toFixed(2)}
      </Typography>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const CreateOrderScreen = ({ navigation, route }) => {
  const { isDarkMode } = useAuthStore();
  const { t } = useTranslation();

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

  const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  // Load restaurants on mount
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        const response = await getRestaurants();
        setRestaurants(Array.isArray(response) ? response : response.data || []);
      } catch (error) {
        console.error('Error loading restaurants:', error);
        Alert.alert(t('common.error'), t('orders.errorLoadingRestaurants'));
      } finally {
        setLoading(false);
      }
    };
    loadRestaurants();
  }, []);

  // Load products and tables when restaurant changes
  useEffect(() => {
    if (!selectedRestaurant) {
      setProducts([]);
      setTables([]);
      return;
    }

    const loadRestaurantData = async () => {
      try {
        setLoading(true);
        const [productsData, tablesData] = await Promise.all([
          getRestaurantProducts(selectedRestaurant.id),
          getTablesByRestaurant(selectedRestaurant.id),
        ]);
        setProducts(Array.isArray(productsData) ? productsData : productsData.data || []);
        setTables(Array.isArray(tablesData) ? tablesData : tablesData.data || []);
        setSelectedTable(null);
      } catch (error) {
        console.error('Error loading restaurant data:', error);
        Alert.alert(t('common.error'), t('orders.errorLoadingProducts'));
      } finally {
        setLoading(false);
      }
    };
    loadRestaurantData();
  }, [selectedRestaurant]);

  // Add product to order
  const handleAddProduct = useCallback(() => {
    if (!selectedProduct) {
      Alert.alert(t('orders.selectProduct'), t('orders.selectProductMessage'));
      return;
    }

    setOrderItems((prev) => {
      const existing = prev.find((item) => item.id === selectedProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.id === selectedProduct.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...selectedProduct, quantity: 1 }];
    });

    setSelectedProduct(null);
  }, [selectedProduct]);

  // Update quantity
  const handleQuantityChange = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setOrderItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item))
    );
  }, []);

  // Remove item from order
  const handleRemoveItem = useCallback((productId) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Handle create order
  const handleCreateOrder = async () => {
    if (!selectedRestaurant) {
      Alert.alert(t('orders.selectRestaurant'), t('orders.selectRestaurantMessage'));
      return;
    }

    if (!selectedTable) {
      Alert.alert(t('orders.selectTable'), t('orders.selectTableMessage'));
      return;
    }

    if (orderItems.length === 0) {
      Alert.alert(t('orders.emptyOrder'), t('orders.addProductsMessage'));
      return;
    }

    try {
      setCreatingOrder(true);

      const orderData = {
        restaurantId: selectedRestaurant.id,
        tableId: selectedTable.id,
        items: orderItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        tax,
        total,
        status: 'pendiente',
      };

      await createOrder(orderData);

      Alert.alert(
        t('orders.success'),
        t('orders.orderCreated'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              setOrderItems([]);
              setSelectedRestaurant(null);
              setSelectedTable(null);
              setSelectedProduct(null);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert(t('common.error'), error.message || t('orders.errorCreatingOrder'));
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />
        <View style={{ padding: 16, gap: 16 }}>
          <Skeleton width="100%" height={50} borderRadius={12} isDark={isDarkMode} />
          <Skeleton width="100%" height={50} borderRadius={12} isDark={isDarkMode} />
          <Skeleton width="100%" height={50} borderRadius={12} isDark={isDarkMode} />
        </View>
      </SafeAreaView>
    );
  }

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
            {t('orders.makeOrder')}
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
            <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 16 }}>
              {t('orders.orderDetails')}
            </Typography>

            <DropdownSelector
              label={t('orders.restaurant')}
              placeholder={t('orders.selectRestaurant')}
              items={restaurants}
              selectedItem={selectedRestaurant}
              onSelect={setSelectedRestaurant}
              isDark={isDarkMode}
              labelExtractor="name"
            />

            {selectedRestaurant && (
              <DropdownSelector
                label={t('orders.table')}
                placeholder={t('orders.selectTable')}
                items={tables}
                selectedItem={selectedTable}
                onSelect={setSelectedTable}
                isDark={isDarkMode}
                labelExtractor="tableNumber"
                icon="chevron-down"
              />
            )}
          </View>

          {/* Products Section */}
          {selectedRestaurant && (
            <View style={styles.section}>
              <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 16 }}>
                {t('orders.dishes')}
              </Typography>

              <DropdownSelector
                label={t('orders.selectDish')}
                placeholder={t('orders.chooseDish')}
                items={products}
                selectedItem={selectedProduct}
                onSelect={setSelectedProduct}
                isDark={isDarkMode}
                labelExtractor="name"
              />

              <Button
                title={t('orders.addProduct')}
                onPress={handleAddProduct}
                style={{ marginTop: 12 }}
                disabled={!selectedProduct}
              />
            </View>
          )}

          {/* Order Items Section */}
          {orderItems.length > 0 && (
            <View style={styles.section}>
              <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 16 }}>
                {t('orders.cartSummary')} ({orderItems.length})
              </Typography>

              {orderItems.map((item) => (
                <OrderItem
                  key={item.id}
                  item={item}
                  isDark={isDarkMode}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))}

              {/* Summary */}
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: surfaceColor, borderColor },
                ]}
              >
                <View style={styles.summaryRow}>
                  <Typography variant="body" color={textSecondary}>
                    {t('orders.subtotal')}
                  </Typography>
                  <Typography variant="body" color={textColor}>
                    ${subtotal.toFixed(2)}
                  </Typography>
                </View>

                <View style={styles.summaryRow}>
                  <Typography variant="body" color={textSecondary}>
                    {t('orders.tax')}
                  </Typography>
                  <Typography variant="body" color={textColor}>
                    ${tax.toFixed(2)}
                  </Typography>
                </View>

                <View style={[styles.summaryRow, { borderTopColor: borderColor, paddingTopColor: 12 }]}>
                  <Typography variant="headingSmall" color={textColor}>
                    {t('orders.total')}
                  </Typography>
                  <Typography variant="headingSmall" color={COLORS.accent}>
                    ${total.toFixed(2)}
                  </Typography>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Button */}
        <View style={[styles.footer, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
          <Button
            title={t('orders.confirmOrder')}
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
  container: {
    flex: 1,
  },
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
  section: {
    gap: 12,
  },
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownModal: {
    flex: 1,
  },
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
    marginTop: 16,
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
