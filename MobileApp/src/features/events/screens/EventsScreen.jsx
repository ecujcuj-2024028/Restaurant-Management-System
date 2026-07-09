import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  RefreshControl,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES } from '../../../shared/constants/theme';
import useAuthStore from '../../../store/useAuthStore';
import useNotificationStore from '../../../store/useNotificationStore';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';
import Button from '../../../shared/components/common/Button';
import Header from '../../../shared/components/common/Header';
import Skeleton from '../../../shared/components/common/Skeleton';
import { getEvents, getEventsByRestaurant, registerEventAttendance, cancelEventAttendance } from '../../../api/events';
import { getRestaurants } from '../../../api/restaurants';

const EventCard = ({ event, isDark, onPress, restaurantName }) => {
  const bgCard = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  const eventName = event.name || event.title || 'Evento';
  const eventDescription = event.description || event.tipo || 'Evento especial';
  const eventImage = event.image || event.photo || event.imagen || null;
  const eventDate = event.date || event.fecha || null;
  const eventPrice = event.price || event.precio || 0;

  // Color banner basado en letra del nombre
  const bannerColors = ['#FF6B00', '#B8860B', '#1A237E', '#2E7D32', '#6A1B9A', '#C2185B'];
  const colorIndex = (eventName?.charCodeAt(0) || 0) % bannerColors.length;

  // Formatear fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: bgCard, borderColor }, !isDark && COMMON_STYLES.shadow]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image Section */}
      <View style={[styles.eventImage, { backgroundColor: bannerColors[colorIndex] }]}>
        {eventImage ? (
          <Image source={{ uri: eventImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : null}
        <View style={styles.eventDateBadge}>
          <Typography variant="small" color={COLORS.white} style={{ fontWeight: '700' }}>
            {formatDate(eventDate)}
          </Typography>
        </View>
      </View>

      {/* Event Info */}
      <View style={styles.eventInfo}>
        <View style={styles.eventHeader}>
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold" color={textColor} numberOfLines={2}>
              {eventName}
            </Typography>
            <Typography variant="small" color={textSecondary} numberOfLines={1} style={{ marginTop: 4 }}>
              {eventDescription}
            </Typography>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Ionicons name="restaurant-outline" size={14} color={textSecondary} style={{ marginRight: 4 }} />
          <Typography variant="small" color={textSecondary} numberOfLines={1} style={{ flex: 1 }}>
            {restaurantName}
          </Typography>
        </View>

        <View style={styles.eventFooter}>
          <Typography variant="small" color={textColor} style={{ fontWeight: '600' }}>
            {eventPrice > 0 ? 'Q ' + eventPrice.toFixed(2) : 'Gratis'}
          </Typography>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Event Detail Modal ────────────────────────────────────────────────────────
const EventDetailModal = ({ visible, onClose, event, isDark, restaurantName, t }) => {
  if (!event) return null;

  const bgModal = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  const eventName = event.name || event.title || 'Evento';
  const eventDescription = event.description || event.tipo || '';
  const eventImage = event.image || event.photo || event.imagen || null;
  const eventPrice = event.price || event.precio || 0;

  const bannerColors = ['#FF6B00', '#B8860B', '#1A237E', '#2E7D32', '#6A1B9A', '#C2185B'];
  const colorIndex = (eventName?.charCodeAt(0) || 0) % bannerColors.length;

  const formatDateRange = (startStr) => {
    if (!startStr) return '';
    const start = new Date(startStr);
    const datePart = start.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return datePart.charAt(0).toUpperCase() + datePart.slice(1);
  };

  const formatTimeRange = (startStr, endStr) => {
    if (!startStr) return '';
    const start = new Date(startStr);
    const startOpt = { hour: '2-digit', minute: '2-digit', hour12: true };
    const startTime = start.toLocaleTimeString('es-ES', startOpt);
    
    if (endStr) {
      const end = new Date(endStr);
      const endTime = end.toLocaleTimeString('es-ES', startOpt);
      return `${startTime} - ${endTime}`;
    }
    return startTime;
  };

  const getEventLocation = () => {
    if (event.restaurant && typeof event.restaurant === 'object') {
      const addr = event.restaurant.address;
      if (addr) {
        const parts = [addr.street, addr.city].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
    }
    return event.location || event.ubicacion || restaurantName;
  };

  const eventDateText = formatDateRange(event.startDate);
  const eventTimeText = formatTimeRange(event.startDate, event.endDate);
  const eventLocation = getEventLocation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[edStyles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)' }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={[edStyles.container, { backgroundColor: bgModal }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image */}
            <View style={[edStyles.image, { backgroundColor: bannerColors[colorIndex] }]}>
              {eventImage ? (
                <Image source={{ uri: eventImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : null}
              <TouchableOpacity style={edStyles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={edStyles.content}>
              <Typography variant="h2" color={textColor} style={{ marginBottom: 8 }}>
                {eventName}
              </Typography>

              <Typography variant="body" color={textSecondary} style={{ marginBottom: 16 }}>
                {eventDescription}
              </Typography>

              {/* Info Grid */}
              <View style={[edStyles.infoGrid, { borderTopColor: borderColor, borderBottomColor: borderColor }]}>
                {eventDateText ? (
                  <View style={edStyles.infoItem}>
                    <View style={[edStyles.infoIcon, { backgroundColor: COLORS.primary + '22' }]}>
                      <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="caption" color={textSecondary}>
                        {t('events.date')}
                      </Typography>
                      <Typography variant="body" color={textColor}>
                        {eventDateText}
                      </Typography>
                    </View>
                  </View>
                ) : null}

                {eventTimeText ? (
                  <View style={edStyles.infoItem}>
                    <View style={[edStyles.infoIcon, { backgroundColor: COLORS.accent + '22' }]}>
                      <Ionicons name="time-outline" size={18} color={COLORS.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="caption" color={textSecondary}>
                        Hora
                      </Typography>
                      <Typography variant="body" color={textColor}>
                        {eventTimeText}
                      </Typography>
                    </View>
                  </View>
                ) : null}

                <View style={edStyles.infoItem}>
                  <View style={[edStyles.infoIcon, { backgroundColor: (isDark ? '#38BDF8' : COLORS.secondary) + '22' }]}>
                    <Ionicons name="location-outline" size={18} color={isDark ? '#38BDF8' : COLORS.secondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color={textSecondary}>
                      {t('events.location')}
                    </Typography>
                    <Typography variant="body" color={textColor}>
                      {eventLocation}
                    </Typography>
                  </View>
                </View>

                <View style={edStyles.infoItem}>
                  <View style={[edStyles.infoIcon, { backgroundColor: '#FFC107' + '22' }]}>
                    <Ionicons name="pricetag-outline" size={18} color="#FFC107" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color={textSecondary}>
                      {t('events.price')}
                    </Typography>
                    <Typography variant="body" color={textColor}>
                      {eventPrice > 0 ? `Q ${eventPrice.toFixed(2)}` : t('events.free')}
                    </Typography>
                  </View>
                </View>
              </View>

              {/* Full Description */}
              {event.fullDescription && (
                <>
                  <Typography variant="bodyBold" color={textColor} style={{ marginTop: 16, marginBottom: 8 }}>
                    {t('events.about')}
                  </Typography>
                  <Typography variant="body" color={textSecondary}>
                    {event.fullDescription}
                  </Typography>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const edStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  image: {
    height: 250,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  infoGrid: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 16,
    marginVertical: 16,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capacitySection: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
  },
  capacityBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});

// ── Events Skeleton ───────────────────────────────────────────────────────────
const EventsSkeleton = ({ isDark }) => (
  <View style={{ flex: 1, backgroundColor: isDark ? COLORS.darkBackground : COLORS.background, padding: 16 }}>
    <Skeleton width={120} height={28} isDark={isDark} style={{ marginBottom: 16 }} />
    <Skeleton width="100%" height={50} borderRadius={12} isDark={isDark} style={{ marginBottom: 16 }} />
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} width="100%" height={160} borderRadius={16} isDark={isDark} style={{ marginBottom: 14 }} />
    ))}
  </View>
);

// ── Main Events Screen ────────────────────────────────────────────────────────
const EventsScreen = ({ navigation }) => {
  const { isDarkMode } = useAuthStore();
  const { t } = useTranslation();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  // States
  const [events, setEvents] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filter States
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('ALL');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('ALL');
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');

  // Temp states for modal inputs
  const [tempPriceFilter, setTempPriceFilter] = useState('ALL');
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');

  // Modal Visibility States
  const [restaurantModalVisible, setRestaurantModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  const DATE_OPTIONS = [
    { value: 'ALL', label: 'Cualquier fecha' },
    { value: 'TODAY', label: 'Hoy' },
    { value: 'WEEK', label: 'Próximos 7 días' },
    { value: 'MONTH', label: 'Próximos 30 días' },
  ];

  const PRICE_OPTIONS = [
    { value: 'ALL', label: 'Cualquier precio' },
    { value: 'FREE', label: 'Gratis' },
    { value: 'LOW', label: 'Menos de Q 100' },
    { value: 'HIGH', label: 'Más de Q 100 o igual' },
    { value: 'CUSTOM', label: 'Rango personalizado' },
  ];

  // Load initial data
  useEffect(() => {
    loadEvents();
    loadRestaurants();
  }, []);

  const loadEvents = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await getEvents();
      const eventsData = Array.isArray(response) ? response : response.data || response.events || [];
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert(t('common.error'), t('events.errorLoadingEvents'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRestaurants = async () => {
    try {
      const response = await getRestaurants();
      const restaurantsList = Array.isArray(response) 
        ? response 
        : (response.restaurants || response.data || []);
      setRestaurants(restaurantsList);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  };

  const getRestaurantName = (ev) => {
    if (!ev) return '';
    
    // 1. If populated as object
    if (ev.restaurant && typeof ev.restaurant === 'object' && ev.restaurant.name) {
      return ev.restaurant.name;
    }
    if (ev.restaurantId && typeof ev.restaurantId === 'object' && ev.restaurantId.name) {
      return ev.restaurantId.name;
    }
    
    // 2. Fallback: Search in loaded restaurants list
    const rId = ev.restaurant || ev.restaurantId;
    if (rId) {
      const targetId = typeof rId === 'object' ? (rId._id || rId.id) : rId;
      if (targetId) {
        const found = restaurants.find(r => (r._id || r.id)?.toString() === targetId.toString());
        if (found) return found.name;
      }
    }
    return 'Restaurante';
  };

  // Filter events based on search and selected filters
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // 1. Search Query
      const eventName = (event.name || event.title || '').toLowerCase();
      const eventDescription = (event.description || event.tipo || '').toLowerCase();
      const searchLower = search.toLowerCase();
      const matchesSearch = !search.trim() || eventName.includes(searchLower) || eventDescription.includes(searchLower);

      // 2. Restaurant Filter
      const rId = event.restaurant?._id || event.restaurant || event.restaurantId?._id || event.restaurantId;
      const matchesRestaurant = !selectedRestaurant || (rId && (rId === selectedRestaurant._id || rId === selectedRestaurant.id));

      // 3. Date Filter
      let matchesDate = true;
      if (selectedDateFilter !== 'ALL' && event.startDate) {
        const eventDate = new Date(event.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDateFilter === 'TODAY') {
          const compDate = new Date(event.startDate);
          compDate.setHours(0, 0, 0, 0);
          matchesDate = compDate.getTime() === today.getTime();
        } else if (selectedDateFilter === 'WEEK') {
          const endOfWeek = new Date();
          endOfWeek.setDate(today.getDate() + 7);
          matchesDate = eventDate >= today && eventDate <= endOfWeek;
        } else if (selectedDateFilter === 'MONTH') {
          const endOfMonth = new Date();
          endOfMonth.setDate(today.getDate() + 30);
          matchesDate = eventDate >= today && eventDate <= endOfMonth;
        }
      }

      // 4. Price Filter
      const price = event.price || event.precio || 0;
      let matchesPrice = true;
      if (selectedPriceFilter === 'FREE') {
        matchesPrice = price === 0;
      } else if (selectedPriceFilter === 'LOW') {
        matchesPrice = price > 0 && price < 100;
      } else if (selectedPriceFilter === 'HIGH') {
        matchesPrice = price >= 100;
      } else if (selectedPriceFilter === 'CUSTOM') {
        const minPriceVal = parseFloat(customMinPrice);
        const maxPriceVal = parseFloat(customMaxPrice);
        const hasMin = !isNaN(minPriceVal);
        const hasMax = !isNaN(maxPriceVal);
        if (hasMin && hasMax) {
          matchesPrice = price >= minPriceVal && price <= maxPriceVal;
        } else if (hasMin) {
          matchesPrice = price >= minPriceVal;
        } else if (hasMax) {
          matchesPrice = price <= maxPriceVal;
        }
      }

      return matchesSearch && matchesRestaurant && matchesDate && matchesPrice;
    });
  }, [events, search, selectedRestaurant, selectedDateFilter, selectedPriceFilter, customMinPrice, customMaxPrice, restaurants]);

  const handleClearFilters = () => {
    setSelectedRestaurant(null);
    setSelectedDateFilter('ALL');
    setSelectedPriceFilter('ALL');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setTempPriceFilter('ALL');
    setTempMinPrice('');
    setTempMaxPrice('');
    setRestaurantSearch('');
    setSearch('');
  };

  const handleOpenPriceModal = () => {
    setTempPriceFilter(selectedPriceFilter);
    setTempMinPrice(customMinPrice);
    setTempMaxPrice(customMaxPrice);
    setPriceModalVisible(true);
  };

  const handleSelectPriceOption = (val) => {
    if (val === 'CUSTOM') {
      setTempPriceFilter('CUSTOM');
    } else {
      setTempPriceFilter(val);
      setSelectedPriceFilter(val);
      setCustomMinPrice('');
      setCustomMaxPrice('');
      setPriceModalVisible(false);
    }
  };

  const handleApplyCustomPrice = () => {
    setCustomMinPrice(tempMinPrice);
    setCustomMaxPrice(tempMaxPrice);
    setSelectedPriceFilter('CUSTOM');
    setPriceModalVisible(false);
  };

  const getPricePillLabel = () => {
    if (selectedPriceFilter === 'ALL') return 'Precio';
    if (selectedPriceFilter === 'CUSTOM') {
      const minVal = parseFloat(customMinPrice);
      const maxVal = parseFloat(customMaxPrice);
      const hasMin = !isNaN(minVal);
      const hasMax = !isNaN(maxVal);
      if (hasMin && hasMax) {
        return `Q ${minVal} - Q ${maxVal}`;
      } else if (hasMin) {
        return `≥ Q ${minVal}`;
      } else if (hasMax) {
        return `≤ Q ${maxVal}`;
      }
      return 'Rango pers.';
    }
    return PRICE_OPTIONS.find(o => o.value === selectedPriceFilter)?.label || 'Precio';
  };

  if (loading) {
    return <EventsSkeleton isDark={isDarkMode} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />

      {/* Header */}
      <Header title={t('events.title')} navigation={navigation} />

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Input
          placeholder={t('events.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 0 }}
          inputStyle={{ borderColor: 'transparent' }}
          leftIcon={<Ionicons name="search-outline" size={20} color={textSecondary} />}
        />
      </View>

      {/* Filters Scroll Row */}
      <View style={[styles.filtersContainer, { backgroundColor: bgColor }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* Restaurant Filter */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: selectedRestaurant ? COLORS.primary : surfaceColor,
                borderColor: selectedRestaurant ? COLORS.primary : borderColor,
              },
            ]}
            onPress={() => setRestaurantModalVisible(true)}
          >
            <Ionicons
              name="restaurant-outline"
              size={16}
              color={selectedRestaurant ? COLORS.white : COLORS.primary}
            />
            <Typography
              variant="caption"
              color={selectedRestaurant ? COLORS.white : textColor}
              style={{ marginLeft: 6, fontWeight: '600' }}
            >
              {selectedRestaurant ? selectedRestaurant.name : 'Restaurantes'}
            </Typography>
            <Ionicons name="chevron-down" size={10} color={selectedRestaurant ? COLORS.white : textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {/* Date Filter */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: selectedDateFilter !== 'ALL' ? COLORS.primary : surfaceColor,
                borderColor: selectedDateFilter !== 'ALL' ? COLORS.primary : borderColor,
              },
            ]}
            onPress={() => setDateModalVisible(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={selectedDateFilter !== 'ALL' ? COLORS.white : COLORS.primary}
            />
            <Typography
              variant="caption"
              color={selectedDateFilter !== 'ALL' ? COLORS.white : textColor}
              style={{ marginLeft: 6, fontWeight: '600' }}
            >
              {selectedDateFilter === 'ALL' ? 'Fecha' : DATE_OPTIONS.find(o => o.value === selectedDateFilter)?.label}
            </Typography>
            <Ionicons name="chevron-down" size={10} color={selectedDateFilter !== 'ALL' ? COLORS.white : textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {/* Price Filter */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: selectedPriceFilter !== 'ALL' ? COLORS.primary : surfaceColor,
                borderColor: selectedPriceFilter !== 'ALL' ? COLORS.primary : borderColor,
              },
            ]}
            onPress={handleOpenPriceModal}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={selectedPriceFilter !== 'ALL' ? COLORS.white : COLORS.primary}
            />
            <Typography
              variant="caption"
              color={selectedPriceFilter !== 'ALL' ? COLORS.white : textColor}
              style={{ marginLeft: 6, fontWeight: '600' }}
            >
              {getPricePillLabel()}
            </Typography>
            <Ionicons name="chevron-down" size={10} color={selectedPriceFilter !== 'ALL' ? COLORS.white : textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {/* Clear Button */}
          {(search || selectedRestaurant || selectedDateFilter !== 'ALL' || selectedPriceFilter !== 'ALL') && (
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: COLORS.error + '22', borderColor: COLORS.error }]}
              onPress={handleClearFilters}
            >
              <Ionicons name="close" size={16} color={COLORS.error} />
              <Typography variant="caption" color={COLORS.error} style={{ marginLeft: 6, fontWeight: '600' }}>
                Limpiar
              </Typography>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadEvents(true)} tintColor={COLORS.primary} />
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            isDark={isDarkMode}
            restaurantName={getRestaurantName(item)}
            onPress={() => {
              setSelectedEvent(item);
              setDetailModalVisible(true);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={52} color={textSecondary} />
            <Typography variant="body" color={textSecondary} style={{ marginTop: 14, textAlign: 'center' }}>
              {t('events.noEvents')}
            </Typography>
          </View>
        }
      />

      {/* Detail Modal */}
      <EventDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        event={selectedEvent}
        isDark={isDarkMode}
        restaurantName={getRestaurantName(selectedEvent)}
        t={t}
      />

      {/* Restaurant Filter Modal */}
      <Modal 
        visible={restaurantModalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={() => { setRestaurantModalVisible(false); setRestaurantSearch(''); }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => { setRestaurantModalVisible(false); setRestaurantSearch(''); }}
        >
          <View style={[styles.bottomSheet, { backgroundColor: surfaceColor, maxHeight: '80%' }]}>
            <View style={styles.sheetHeader}>
              <Typography variant="bodyBold" color={textColor}>Filtrar por Restaurante</Typography>
              <TouchableOpacity 
                onPress={() => { setRestaurantModalVisible(false); setRestaurantSearch(''); }} 
                style={styles.closeSheetBtn}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Modal Search Bar */}
            <View style={{ marginBottom: 12 }}>
              <Input
                placeholder="Buscar restaurante..."
                value={restaurantSearch}
                onChangeText={setRestaurantSearch}
                inputStyle={{ borderRadius: 10, height: 40 }}
                leftIcon={<Ionicons name="search-outline" size={18} color={textSecondary} />}
              />
            </View>

            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              <View style={styles.sheetContent}>
                {/* Only show "Todos los Restaurantes" when search query is empty */}
                {!restaurantSearch.trim() && (
                  <TouchableOpacity
                    onPress={() => { setSelectedRestaurant(null); setRestaurantModalVisible(false); setRestaurantSearch(''); }}
                    style={[styles.optionRow, !selectedRestaurant && { backgroundColor: COLORS.primary + '15' }]}
                  >
                    <Typography variant={!selectedRestaurant ? 'bodyBold' : 'body'} color={!selectedRestaurant ? COLORS.primary : textColor}>
                      Todos los Restaurantes
                    </Typography>
                    {!selectedRestaurant && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                )}

                {restaurants
                  .filter(r => r.name.toLowerCase().includes(restaurantSearch.toLowerCase()))
                  .map((r) => {
                    const isSelected = selectedRestaurant && (selectedRestaurant._id === r._id || selectedRestaurant.id === r.id);
                    return (
                      <TouchableOpacity
                        key={r._id || r.id}
                        onPress={() => { setSelectedRestaurant(r); setRestaurantModalVisible(false); setRestaurantSearch(''); }}
                        style={[styles.optionRow, isSelected && { backgroundColor: COLORS.primary + '15' }]}
                      >
                        <Typography variant={isSelected ? 'bodyBold' : 'body'} color={isSelected ? COLORS.primary : textColor}>
                          {r.name}
                        </Typography>
                        {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                      </TouchableOpacity>
                    );
                  })
                }
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Filter Modal */}
      <Modal visible={dateModalVisible} transparent animationType="slide" onRequestClose={() => setDateModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDateModalVisible(false)}>
          <View style={[styles.bottomSheet, { backgroundColor: surfaceColor }]}>
            <View style={styles.sheetHeader}>
              <Typography variant="bodyBold" color={textColor}>Filtrar por Fecha</Typography>
              <TouchableOpacity onPress={() => setDateModalVisible(false)} style={styles.closeSheetBtn}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetContent}>
              {DATE_OPTIONS.map((opt) => {
                const isSelected = opt.value === selectedDateFilter;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => { setSelectedDateFilter(opt.value); setDateModalVisible(false); }}
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

      {/* Price Filter Modal */}
      <Modal visible={priceModalVisible} transparent animationType="slide" onRequestClose={() => setPriceModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPriceModalVisible(false)}>
          <View style={[styles.bottomSheet, { backgroundColor: surfaceColor }]}>
            <View style={styles.sheetHeader}>
              <Typography variant="bodyBold" color={textColor}>Filtrar por Precio</Typography>
              <TouchableOpacity onPress={() => setPriceModalVisible(false)} style={styles.closeSheetBtn}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              <View style={styles.sheetContent}>
                {PRICE_OPTIONS.map((opt) => {
                  const isSelected = opt.value === tempPriceFilter;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => handleSelectPriceOption(opt.value)}
                      style={[styles.optionRow, isSelected && { backgroundColor: COLORS.primary + '15' }]}
                    >
                      <Typography variant={isSelected ? 'bodyBold' : 'body'} color={isSelected ? COLORS.primary : textColor}>
                        {opt.label}
                      </Typography>
                      {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  );
                })}

                {tempPriceFilter === 'CUSTOM' && (
                  <View style={styles.customRangeContainer}>
                    <View style={styles.customRangeRow}>
                      <View style={{ flex: 1 }}>
                        <Input
                          label="Precio Mínimo"
                          placeholder="0.00"
                          value={tempMinPrice}
                          onChangeText={setTempMinPrice}
                          keyboardType="numeric"
                          leftIcon={<Typography color={textSecondary}>Q</Typography>}
                          style={{ marginBottom: 0 }}
                        />
                      </View>
                      <View style={{ width: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Input
                          label="Precio Máximo"
                          placeholder="0.00"
                          value={tempMaxPrice}
                          onChangeText={setTempMaxPrice}
                          keyboardType="numeric"
                          leftIcon={<Typography color={textSecondary}>Q</Typography>}
                          style={{ marginBottom: 0 }}
                        />
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.applyCustomBtn}
                      onPress={handleApplyCustomPrice}
                    >
                      <Typography variant="bodyBold" color={COLORS.white}>
                        Confirmar
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
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterScroll: {
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  eventCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  eventImage: {
    width: 120,
    height: 140,
    position: 'relative',
  },
  eventDateBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  eventHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  // Modal Bottom Sheet Styles
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

export default EventsScreen;
