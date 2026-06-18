import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import { THEME, COMMON_STYLES } from '../../../shared/constants/theme';
import useAuthStore from '../../../store/useAuthStore';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';
import Button from '../../../shared/components/common/Button';
import { getRestaurantById } from '../../../api/restaurants';
import { createReservation } from '../../../api/reservations';
import api from '../../../api/api';

// ── Helpers ──────────────────────────────────────────────────────────────────
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const MONTH_NAMES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS_ES = ['L','M','X','J','V','S','D'];
const DAY_LABELS_EN = ['M','T','W','T','F','S','S'];

const TIME_SLOTS = ['12:00','13:00','14:00','19:00','20:00','21:00'];
const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6];

// ── Mini Calendario ──────────────────────────────────────────────────────────
const MiniCalendar = ({ selectedDate, onSelectDate, isDark, lang }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const textColor = isDark ? COLORS.darkText : COLORS.text;
  const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const surfaceColor = isDark ? COLORS.darkSurface : COLORS.white;

  const monthNames = lang === 'es' ? MONTH_NAMES_ES : MONTH_NAMES_EN;
  const dayLabels = lang === 'es' ? DAY_LABELS_ES : DAY_LABELS_EN;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  // Adjust: week starts on Monday (0=Mon)
  const startOffset = (firstDay + 6) % 7;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
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
  const isPast = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0,0,0,0);
    const t2 = new Date(); t2.setHours(0,0,0,0);
    return d < t2;
  };

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={[calStyles.wrapper, { backgroundColor: surfaceColor }]}>
      {/* Header nav */}
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

      {/* Day labels */}
      <View style={calStyles.labelsRow}>
        {dayLabels.map((l, i) => (
          <View key={i} style={calStyles.labelCell}>
            <Typography variant="small" color={textSecondary}>{l}</Typography>
          </View>
        ))}
      </View>

      {/* Cells */}
      <View style={calStyles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={calStyles.cell} />;
          const selected = isSelected(day);
          const past = isPast(day);
          const tod = isToday(day);
          return (
            <TouchableOpacity
              key={day}
              style={[
                calStyles.cell,
                selected && calStyles.selectedCell,
                tod && !selected && calStyles.todayCell,
              ]}
              onPress={() => !past && onSelectDate(new Date(viewYear, viewMonth, day))}
              disabled={past}
            >
              <Typography
                variant="small"
                color={selected ? COLORS.white : past ? textSecondary : tod ? COLORS.primary : textColor}
                style={{ opacity: past ? 0.35 : 1, fontWeight: tod || selected ? '700' : '400' }}
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

// ── Pantalla Principal ────────────────────────────────────────────────────────
const ReservationFormScreen = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const { user, isDarkMode } = useAuthStore();
  const restaurantId = route?.params?.id;

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [phone, setPhone] = useState(user?.phone || '');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');

  const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const lang = i18n.language || 'es';

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    getRestaurantById(restaurantId)
      .then(res => setRestaurant(res.restaurant || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.name || user?.username || '';

  const handleConfirm = async () => {
    if (!selectedDate) return Alert.alert(t('reservationForm.error'), t('reservationForm.errorDate'));
    if (!selectedTime) return Alert.alert(t('reservationForm.error'), t('reservationForm.errorTime'));

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
    const payload = {
      restaurantId,
      date: dateStr,
      time: selectedTime,
      guests,
      phone: phone || user?.phone || '',
      tableNumber: tableNumber || undefined,
      notes,
    };

    setSubmitting(true);
    try {
      await createReservation(payload);
      Alert.alert(t('reservationForm.success'), t('reservationForm.successMsg'), [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      const msg = err?.response?.data?.message || t('reservationForm.errorGeneric');
      Alert.alert(t('reservationForm.error'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top','left','right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textColor} />
        </TouchableOpacity>
        <View>
          <Typography variant="h3" color={textColor}>{t('reservationForm.title')}</Typography>
          <Typography variant="small" color={textSecondary}>
            {restaurant?.name || ''}
          </Typography>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Número de personas */}
        <Typography variant="bodyBold" color={textColor} style={styles.sectionTitle}>
          {t('reservationForm.guests')}
        </Typography>
        <View style={styles.guestsRow}>
          {GUEST_OPTIONS.map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.guestChip, { backgroundColor: surfaceColor }, n === guests && styles.guestChipActive]}
              onPress={() => setGuests(n)}
            >
              <Typography variant="bodyBold" color={n === guests ? COLORS.white : textColor}>
                {n}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calendario */}
        <Typography variant="bodyBold" color={textColor} style={styles.sectionTitle}>
          {t('reservationForm.selectDate')}
        </Typography>
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          isDark={isDarkMode}
          lang={lang}
        />

        {/* Horarios */}
        <Typography variant="bodyBold" color={textColor} style={styles.sectionTitle}>
          {t('reservationForm.timeSlots')}
        </Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timesRow}>
          {TIME_SLOTS.map(t2 => (
            <TouchableOpacity
              key={t2}
              style={[styles.timeChip, { backgroundColor: surfaceColor }, t2 === selectedTime && styles.timeChipActive]}
              onPress={() => setSelectedTime(t2)}
            >
              <Typography variant="small" color={t2 === selectedTime ? COLORS.white : textColor} style={{ fontWeight: '600' }}>
                {t2}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Datos */}
        <Typography variant="bodyBold" color={textColor} style={styles.sectionTitle}>
          {t('reservationForm.data')}
        </Typography>
        <View style={styles.dataRow}>
          <Input
            label={t('reservationForm.phone')}
            placeholder="502 1234-5678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={{ flex: 1, marginRight: 8 }}
          />
          <Input
            label={t('reservationForm.table')}
            placeholder="#"
            value={tableNumber}
            onChangeText={setTableNumber}
            keyboardType="numeric"
            style={{ width: 80 }}
          />
        </View>

        {/* Nombre prellenado (solo lectura) */}
        <Input
          label={t('reservationForm.name')}
          value={userName}
          editable={false}
          style={{ opacity: 0.7 }}
        />

        <Input
          label={t('reservationForm.notes')}
          placeholder={t('reservationForm.notesPlaceholder')}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80 }}
        />

        <Button
          title={t('reservationForm.confirm')}
          onPress={handleConfirm}
          loading={submitting}
          style={styles.confirmBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionTitle: { marginTop: 24, marginBottom: 12 },
  guestsRow: { flexDirection: 'row', gap: 10 },
  guestChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestChipActive: { backgroundColor: COLORS.primary },
  timesRow: { gap: 10, paddingBottom: 4 },
  timeChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  timeChipActive: { backgroundColor: COLORS.primary },
  dataRow: { flexDirection: 'row', alignItems: 'flex-start' },
  confirmBtn: { marginTop: 24 },
});

export default ReservationFormScreen;
