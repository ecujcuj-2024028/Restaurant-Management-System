import React, { useState, useEffect, useCallback } from 'react';
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
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';
import Button from '../../../shared/components/common/Button';
import Skeleton from '../../../shared/components/common/Skeleton';
import { getEvents, getEventsByRestaurant, registerEventAttendance, cancelEventAttendance } from '../../../api/events';
import { getRestaurants } from '../../../api/restaurants';

// ── Event Card Component ──────────────────────────────────────────────────────
const EventCard = ({ event, isDark, onPress, onAttendPress, isAttending }) => {
  const bgCard = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  const eventName = event.name || event.title || 'Evento';
  const eventDescription = event.description || event.tipo || 'Evento especial';
  const eventImage = event.image || event.photo || event.imagen || null;
  const restaurantName = event.restaurantId?.name || event.restaurant?.name || 'Restaurante';
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
          {isAttending && (
            <View style={[styles.attendingBadge, { backgroundColor: COLORS.accent + '22' }]}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            </View>
          )}
        </View>

        <Typography variant="small" color={textSecondary} style={{ marginTop: 8 }} numberOfLines={1}>
          🏪 {restaurantName}
        </Typography>

        <View style={styles.eventFooter}>
          <View>
            <Typography variant="small" color={textSecondary}>
              {eventPrice > 0 ? `Q ${eventPrice.toFixed(2)}` : 'Gratis'}
            </Typography>
          </View>
          <TouchableOpacity
            style={[
              styles.attendBtn,
              {
                backgroundColor: isAttending ? COLORS.error + '22' : COLORS.accent + '22',
                borderColor: isAttending ? COLORS.error : COLORS.accent,
              },
            ]}
            onPress={() => onAttendPress(!isAttending)}
          >
            <Ionicons
              name={isAttending ? 'close' : 'checkmark'}
              size={14}
              color={isAttending ? COLORS.error : COLORS.accent}
            />
            <Typography
              variant="caption"
              color={isAttending ? COLORS.error : COLORS.accent}
              style={{ marginLeft: 4, fontWeight: '600' }}
            >
              {isAttending ? 'Cancelar' : 'Asistir'}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Event Detail Modal ────────────────────────────────────────────────────────
const EventDetailModal = ({ visible, onClose, event, isDark, isAttending, onAttendPress, t }) => {
  if (!event) return null;

  const bgModal = isDark ? COLORS.darkSurface : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.darkBorder : COLORS.border;

  const eventName = event.name || event.title || 'Evento';
  const eventDescription = event.description || event.tipo || '';
  const eventImage = event.image || event.photo || event.imagen || null;
  const restaurantName = event.restaurantId?.name || event.restaurant?.name || 'Restaurante';
  const eventDate = event.date || event.fecha || null;
  const eventTime = event.time || event.hora || null;
  const eventLocation = event.location || event.ubicacion || restaurantName;
  const eventPrice = event.price || event.precio || 0;
  const eventCapacity = event.capacity || event.capacidad || 0;
  const eventAttendees = event.attendees || event.asistentes || 0;

  const bannerColors = ['#FF6B00', '#B8860B', '#1A237E', '#2E7D32', '#6A1B9A', '#C2185B'];
  const colorIndex = (eventName?.charCodeAt(0) || 0) % bannerColors.length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
                {eventDate && (
                  <View style={edStyles.infoItem}>
                    <View style={[edStyles.infoIcon, { backgroundColor: COLORS.primary + '22' }]}>
                      <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="caption" color={textSecondary}>
                        {t('events.date')}
                      </Typography>
                      <Typography variant="body" color={textColor}>
                        {formatDate(eventDate)}
                      </Typography>
                    </View>
                  </View>
                )}

                {eventTime && (
                  <View style={edStyles.infoItem}>
                    <View style={[edStyles.infoIcon, { backgroundColor: COLORS.accent + '22' }]}>
                      <Ionicons name="time-outline" size={18} color={COLORS.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="caption" color={textSecondary}>
                        {t('events.time')}
                      </Typography>
                      <Typography variant="body" color={textColor}>
                        {eventTime}
                      </Typography>
                    </View>
                  </View>
                )}

                <View style={edStyles.infoItem}>
                  <View style={[edStyles.infoIcon, { backgroundColor: COLORS.secondary + '22' }]}>
                    <Ionicons name="location-outline" size={18} color={COLORS.secondary} />
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

              {/* Capacity */}
              {eventCapacity > 0 && (
                <View style={[edStyles.capacitySection, { backgroundColor: isDark ? COLORS.darkBackground : '#F1F5F9' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Typography variant="bodyBold" color={textColor}>
                      {t('events.attendees')}
                    </Typography>
                    <Typography variant="body" color={textSecondary}>
                      {eventAttendees || 0} / {eventCapacity}
                    </Typography>
                  </View>
                  <View style={[edStyles.capacityBar, { backgroundColor: isDark ? COLORS.darkBorder : COLORS.border }]}>
                    <View
                      style={[
                        edStyles.capacityFill,
                        {
                          width: `${((eventAttendees || 0) / eventCapacity) * 100}%`,
                          backgroundColor: eventAttendees >= eventCapacity ? COLORS.error : COLORS.accent,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

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

          {/* Action Button */}
          <View style={[edStyles.footer, { borderTopColor: borderColor }]}>
            <Button
              title={isAttending ? t('events.cancelAttendance') : t('events.attendEvent')}
              onPress={() => {
                onAttendPress(!isAttending);
                onClose();
              }}
              style={{
                backgroundColor: isAttending ? COLORS.error : COLORS.accent,
              }}
            />
          </View>
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

  // States
  const [events, setEvents] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [attending, setAttending] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [attendLoading, setAttendLoading] = useState(false);

  const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  // Load initial data
  useEffect(() => {
    loadEvents();
    loadRestaurants();
  }, []);

  const loadEvents = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      let response;
      if (selectedRestaurant) {
        response = await getEventsByRestaurant(selectedRestaurant.id);
      } else {
        response = await getEvents();
      }

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
      const restaurantsList = Array.isArray(response) ? response : response.data || [];
      setRestaurants(restaurantsList);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  };

  // Filter events based on search
  const filteredEvents = events.filter((event) => {
    const eventName = (event.name || event.title || '').toLowerCase();
    const eventDescription = (event.description || event.tipo || '').toLowerCase();
    const searchLower = search.toLowerCase();
    return eventName.includes(searchLower) || eventDescription.includes(searchLower);
  });

  // Handle attendance toggle
  const handleAttendanceToggle = async (eventId, isAttending) => {
    try {
      setAttendLoading(true);
      if (isAttending) {
        await cancelEventAttendance(eventId);
      } else {
        await registerEventAttendance(eventId);
      }

      setAttending((prev) => ({
        ...prev,
        [eventId]: !isAttending,
      }));
    } catch (error) {
      console.error('Error updating attendance:', error);
      Alert.alert(t('common.error'), error.message || t('events.errorUpdatingAttendance'));
    } finally {
      setAttendLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedRestaurant(null);
    setSearch('');
    loadEvents();
  };

  if (loading) {
    return <EventsSkeleton isDark={isDarkMode} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.headerTop}>
          <Typography variant="h2" color={textColor}>
            {t('events.title')}
          </Typography>
          <TouchableOpacity onPress={() => navigation.openDrawer?.()}>
            <Ionicons name="notifications-outline" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <Input
          placeholder={t('events.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 0 }}
          inputStyle={{ borderColor: 'transparent' }}
          leftIcon={<Ionicons name="search-outline" size={20} color={textSecondary} />}
        />
      </View>

      {/* Filters */}
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
                borderColor: borderColor,
              },
            ]}
            onPress={() => {
              const newRestaurant = selectedRestaurant ? null : restaurants[0];
              setSelectedRestaurant(newRestaurant);
              if (newRestaurant) {
                loadEvents();
              }
            }}
          >
            <Ionicons
              name="restaurant-outline"
              size={16}
              color={selectedRestaurant ? COLORS.white : textColor}
            />
            <Typography
              variant="caption"
              color={selectedRestaurant ? COLORS.white : textColor}
              style={{ marginLeft: 6, fontWeight: '600' }}
            >
              {selectedRestaurant ? selectedRestaurant.name : t('events.allRestaurants')}
            </Typography>
          </TouchableOpacity>

          {/* Clear Button */}
          {(search || selectedRestaurant) && (
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: COLORS.error + '22', borderColor: COLORS.error }]}
              onPress={handleClearFilters}
            >
              <Ionicons name="close" size={16} color={COLORS.error} />
              <Typography variant="caption" color={COLORS.error} style={{ marginLeft: 6, fontWeight: '600' }}>
                {t('events.clear')}
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
            onPress={() => {
              setSelectedEvent(item);
              setDetailModalVisible(true);
            }}
            onAttendPress={(shouldAttend) => handleAttendanceToggle(item._id || item.id, shouldAttend)}
            isAttending={attending[item._id || item.id] || false}
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
        isAttending={attending[selectedEvent?._id || selectedEvent?.id] || false}
        onAttendPress={(shouldAttend) =>
          handleAttendanceToggle(selectedEvent._id || selectedEvent.id, shouldAttend)
        }
        t={t}
      />
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
  attendingBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  attendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
});

export default EventsScreen;
