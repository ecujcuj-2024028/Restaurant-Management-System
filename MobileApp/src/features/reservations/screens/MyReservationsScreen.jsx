import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES } from '../../../shared/constants/theme';
import useAuthStore from '../../../store/useAuthStore';
import useSocket from '../../../shared/hooks/useSocket';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';
import { getMyReservations, cancelReservation } from '../../../api/reservations';

// ── Date and Calendar Helpers ──────────────────────────────────────────────
const MONTH_NAMES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_NAMES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTH_NAMES_ZH = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

const DAY_LABELS_ES = ['L','M','X','J','V','S','D'];
const DAY_LABELS_EN = ['M','T','W','T','F','S','S'];
const DAY_LABELS_PT = ['S','T','Q','Q','S','S','D'];
const DAY_LABELS_ZH = ['一','二','三','四','五','六','日'];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const formatAddress = (restaurant) => {
  if (!restaurant) return '';
  const addr = restaurant.address;
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  const parts = [addr.street, addr.city, addr.country].filter(Boolean);
  return parts.join(', ');
};

const FilterCalendar = ({ selectedDate, onSelectDate, isDark, lang }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(selectedDate ? selectedDate.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate ? selectedDate.getMonth() : today.getMonth());

  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const surfaceColor = isDark ? COLORS.darkSurface : COLORS.white;

  let monthNames = MONTH_NAMES_ES;
  let dayLabels = DAY_LABELS_ES;

  if (lang.startsWith('en')) {
    monthNames = MONTH_NAMES_EN;
    dayLabels = DAY_LABELS_EN;
  } else if (lang.startsWith('pt')) {
    monthNames = MONTH_NAMES_PT;
    dayLabels = DAY_LABELS_PT;
  } else if (lang.startsWith('zh')) {
    monthNames = MONTH_NAMES_ZH;
    dayLabels = DAY_LABELS_ZH;
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const startOffset = (firstDay + 6) % 7;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear;
  };

  const isToday = (day) => {
    return today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear;
  };

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={[calStyles.wrapper, { backgroundColor: surfaceColor }]}>
      <View style={calStyles.navRow}>
        <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
          <Ionicons name="chevron-back" size={18} color={textSecondary} />
        </TouchableOpacity>
        <Typography variant="bodyBold" color={textColor}>
          {monthNames[viewMonth]} {viewYear}
        </Typography>
        <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
          <Ionicons name="chevron-forward" size={18} color={textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={calStyles.labelsRow}>
        {dayLabels.map((l, i) => (
          <View key={i} style={calStyles.labelCell}>
            <Typography variant="small" color={textSecondary}>{l}</Typography>
          </View>
        ))}
      </View>

      <View style={calStyles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={calStyles.cell} />;
          const selected = isSelected(day);
          const tod = isToday(day);
          return (
            <TouchableOpacity
              key={day}
              style={[
                calStyles.cell,
                selected && calStyles.selectedCell,
                tod && !selected && calStyles.todayCell,
              ]}
              onPress={() => onSelectDate(new Date(viewYear, viewMonth, day))}
            >
              <Typography
                variant="small"
                color={selected ? COLORS.white : tod ? COLORS.primary : textColor}
                style={{ fontWeight: tod || selected ? '700' : '400' }}
              >
                {day}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const calStyles = StyleSheet.create({
  wrapper: { borderRadius: 16, padding: 12 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { padding: 6 },
  labelsRow: { flexDirection: 'row', marginBottom: 4 },
  labelCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  selectedCell: { backgroundColor: COLORS.primary, borderRadius: 50 },
  todayCell: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 50 },
});

const STATUS_MAP = {
  pendiente: { label: 'Pendiente', color: '#FFC107', bg: 'rgba(255, 193, 7, 0.1)', icon: 'time-outline' },
  confirmada: { label: 'Confirmada', color: '#28A745', bg: 'rgba(40, 167, 69, 0.1)', icon: 'checkmark-circle-outline' },
  cancelada: { label: 'Cancelada', color: '#DC3545', bg: 'rgba(220, 53, 69, 0.1)', icon: 'close-circle-outline' },
  completada: { label: 'Completada', color: '#6C757D', bg: 'rgba(108, 117, 125, 0.1)', icon: 'checkbox-outline' },
};

const MyReservationsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user, isDarkMode } = useAuthStore();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [, setTick] = useState(0); // Trigger periodic updates for active timers

  const bgColor = isDarkMode ? COLORS.darkBackground : '#F5F5F5';

  const formatSelectedDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  const cardColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  const userId = user?._id || user?.id;

  // Real-time updates via WebSocket rooms
  const socketRooms = useMemo(() => (userId ? [`user_${userId}`] : []), [userId]);
  const { on } = useSocket(socketRooms);

  useEffect(() => {
    const unsubUpdated = on('reservation_updated', (updatedRes) => {
      if (!updatedRes) return;
      setReservations(prev => prev.map(r => 
        (r?._id || r?.id) === (updatedRes?._id || updatedRes?.id) ? updatedRes : r
      ));
      const statusLabel = updatedRes.status ? updatedRes.status.toUpperCase() : 'N/A';
      Alert.alert(
        t('reservations.updatedTitle') || 'Reserva Actualizada', 
        `${t('reservations.updatedMsg') || 'Tu reserva ha sido actualizada a:'} ${statusLabel}`
      );
    });

    const unsubCancelled = on('reservation_cancelled', (cancelledRes) => {
      if (!cancelledRes) return;
      setReservations(prev => prev.map(r => 
        (r?._id || r?.id) === (cancelledRes?._id || cancelledRes?.id) ? cancelledRes : r
      ));
      Alert.alert(
        t('reservations.cancelledTitle') || 'Reserva Cancelada', 
        t('reservations.cancelledMsg') || 'Tu reserva ha sido cancelada.'
      );
    });

    return () => {
      unsubUpdated();
      unsubCancelled();
    };
  }, [on, t]);

  const loadReservations = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getMyReservations();
      setReservations(data.reservations || []);
    } catch (e) {
      console.error('Error fetching reservations:', e);
      setReservations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReservations();
    // Timer to update "can cancel" active timers every second
    const interval = setInterval(() => setTick(tick => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // 5 minute grace period for cancellations
  const canCancel = useCallback((res) => {
    const createdTime = res.createdAt || res.created_at;
    if (!createdTime || res.status !== 'pendiente') return false;
    const diff = Date.now() - new Date(createdTime).getTime();
    return diff < 300000; // 5 minutes in ms
  }, []);

  const handleCancelReservation = (res) => {
    const resId = res._id || res.id;
    Alert.alert(
      t('reservations.confirmCancelTitle') || 'Cancelar Reserva',
      t('reservations.confirmCancelMsg') || '¿Seguro que deseas cancelar esta solicitud? (Esta acción es irreversible)',
      [
        { text: t('common.cancel') || 'Cancelar', style: 'cancel' },
        { 
          text: t('common.confirm') || 'Confirmar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReservation(resId);
              Alert.alert(t('common.success') || 'Éxito', t('reservations.cancelSuccess') || 'Reservación cancelada.');
              loadReservations();
            } catch (err) {
              const msg = err?.response?.data?.message || t('reservations.cancelError') || 'No se pudo cancelar.';
              Alert.alert('Error', msg);
            }
          } 
        }
      ]
    );
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const matchesSearch = !searchTerm || 
        res.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter;
      
      let matchesDate = true;
      if (selectedDate) {
        const resDate = new Date(res.date);
        matchesDate = 
          resDate.getDate() === selectedDate.getDate() &&
          resDate.getMonth() === selectedDate.getMonth() &&
          resDate.getFullYear() === selectedDate.getFullYear();
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [reservations, searchTerm, statusFilter, selectedDate]);

  const renderReservationItem = ({ item }) => {
    const status = STATUS_MAP[item.status] || STATUS_MAP.pendiente;
    const isNew = canCancel(item);
    const dateStr = new Date(item.date).toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return (
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        {/* Status bar */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={12} color={status.color} style={{ marginRight: 4 }} />
            <Typography variant="smallBold" color={status.color}>
              {status.label}
            </Typography>
          </View>
          {isNew && (
            <View style={styles.graceBadge}>
              <Ionicons name="time" size={10} color={COLORS.primary} style={{ marginRight: 2 }} />
              <Typography variant="caption" color={COLORS.primary} style={{ fontWeight: '700' }}>
                Gracia Activa
              </Typography>
            </View>
          )}
        </View>

        {/* Restaurant Name */}
        <View style={styles.restaurantRow}>
          <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="restaurant" size={16} color={COLORS.primary} />
          </View>
          <Typography variant="bodyBold" color={textColor} style={{ flex: 1, marginLeft: 10 }}>
            {item.restaurant?.name || 'Restaurante'}
          </Typography>
        </View>

        {/* Reservation details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Typography variant="small" color={textSecondary} style={{ marginLeft: 8 }}>
              {dateStr}
            </Typography>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} />
            <Typography variant="small" color={textSecondary} style={{ marginLeft: 8 }}>
              {item.time} hs
            </Typography>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Typography variant="small" color={textSecondary} style={{ marginLeft: 8 }}>
              {item.guestCount} {item.guestCount === 1 ? 'Persona' : 'Personas'}
            </Typography>
          </View>
          {item.table && (
            <View style={styles.detailRow}>
              <Ionicons name="restaurant-outline" size={16} color={COLORS.primary} />
              <Typography variant="small" color={textSecondary} style={{ marginLeft: 8 }}>
                Mesa #{item.table.number || item.table}
              </Typography>
            </View>
          )}
          {item.restaurant?.address && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
              <Typography variant="small" color={textSecondary} style={{ marginLeft: 8, flex: 1 }} numberOfLines={2}>
                {formatAddress(item.restaurant)}
              </Typography>
            </View>
          )}
        </View>

        {/* Cancel button or Auto-cancel expired note */}
        {item.status === 'pendiente' && (
          isNew ? (
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => handleCancelReservation(item)}
            >
              <Ionicons name="close-circle" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Typography variant="smallBold" color="white">
                Cancelar Solicitud
              </Typography>
            </TouchableOpacity>
          ) : (
            <View style={[styles.expiredContainer, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}>
              <Ionicons name="alert-circle" size={16} color={textSecondary} style={{ marginRight: 6 }} />
              <Typography variant="caption" color={textSecondary} style={{ flex: 1, fontStyle: 'italic' }}>
                El tiempo de cancelación automática ha expirado. Por favor, contacta a la sede para realizar cambios.
              </Typography>
            </View>
          )
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Typography variant="h2" color={textColor}>
          {t('menu.myReservations')}
        </Typography>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter bar */}
      <View style={styles.filtersWrapper}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder={t('reservations.searchPlaceholder') || "Buscar por restaurante..."}
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={{ marginBottom: 0 }}
              inputStyle={{ borderColor: 'transparent' }}
              leftIcon={<Ionicons name="search-outline" size={20} color={textSecondary} />}
            />
          </View>
          <TouchableOpacity 
            style={[
              styles.dateFilterBtn, 
              { 
                backgroundColor: selectedDate ? COLORS.primary : cardColor,
                borderColor: borderColor 
              }
            ]}
            onPress={() => setCalendarModalVisible(true)}
          >
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={selectedDate ? COLORS.white : COLORS.primary} 
            />
          </TouchableOpacity>
        </View>

        {selectedDate && (
          <View style={styles.activeFiltersRow}>
            <View style={[styles.activeFilterPill, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="calendar" size={12} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Typography variant="captionBold" color={COLORS.primary}>
                {formatSelectedDate(selectedDate)}
              </Typography>
              <TouchableOpacity onPress={() => setSelectedDate(null)} style={{ marginLeft: 6 }}>
                <Ionicons name="close-circle" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
          {['ALL', 'pendiente', 'confirmada', 'cancelada', 'completada'].map((statusKey) => {
            const isActive = statusFilter === statusKey;
            let label = t('restaurants.all') || 'Todos';
            if (statusKey !== 'ALL') {
              label = STATUS_MAP[statusKey]?.label || statusKey;
            }

            return (
              <TouchableOpacity
                key={statusKey}
                onPress={() => setStatusFilter(statusKey)}
                style={[
                  styles.chip,
                  { backgroundColor: isActive ? COLORS.primary : cardColor },
                  isActive && styles.chipActive
                ]}
              >
                <Typography variant="small" color={isActive ? COLORS.white : textSecondary}>
                  {label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Reservations List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderReservationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadReservations(true)}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={textSecondary} style={{ marginBottom: 12 }} />
              <Typography variant="body" color={textSecondary}>
                Sin registros encontrados
              </Typography>
            </View>
          }
        />
      )}

      {/* Calendar Filter Modal */}
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCalendarModalVisible(false)}
        >
          <View style={[styles.bottomSheet, { backgroundColor: cardColor }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: isDarkMode ? COLORS.darkBorder : '#f1f5f9' }]}>
              <Typography variant="bodyBold" color={textColor}>
                {t('reservations.filterDate') || 'Filtrar por Fecha'}
              </Typography>
              <TouchableOpacity onPress={() => setCalendarModalVisible(false)} style={styles.closeSheetBtn}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetContent}>
              <FilterCalendar
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setCalendarModalVisible(false);
                }}
                isDark={isDarkMode}
                lang={i18n.language || 'es'}
              />
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 4,
  },
  filtersWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dateFilterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 2,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusChips: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  graceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    gap: 10,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  closeSheetBtn: {
    padding: 4,
  },
  sheetContent: {
    marginVertical: 8,
  },
});

export default MyReservationsScreen;
