import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    StatusBar,
    RefreshControl,
    Image,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES } from '../../../shared/constants/theme';
import { getRestaurants } from '../../../api/restaurants';
import useAuthStore from '../../../store/useAuthStore';
import useReviewStore from '../../../store/useReviewStore';
import useNotificationStore from '../../../store/useNotificationStore';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';
import Skeleton from '../../../shared/components/common/Skeleton';

// ─── Skeleton ────────────────────────────────────────────────────────────────
const RestaurantsSkeleton = ({ isDark }) => {
    const bg = isDark ? COLORS.darkBackground : COLORS.background;
    return (
        <View style={[styles.container, { backgroundColor: bg, paddingTop: 20 }]}>
            <View style={styles.header}>
                <Skeleton width={180} height={28} isDark={isDark} style={{ marginBottom: 20 }} />
                <Skeleton width="100%" height={50} borderRadius={12} isDark={isDark} style={{ marginBottom: 20 }} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} width={70} height={35} borderRadius={20} isDark={isDark} />
                    ))}
                </View>
            </View>
            <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 16 }}>
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} width="100%" height={180} borderRadius={16} isDark={isDark} />
                ))}
            </View>
        </View>
    );
};

// ─── Tarjeta de restaurante ───────────────────────────────────────────────────
const RestaurantListCard = ({ restaurant, onPress, isDark }) => {
    const { t } = useTranslation();
    const { restaurantStats, fetchRestaurantStats } = useReviewStore();
    const id = restaurant._id || restaurant.id;
    const stats = restaurantStats[id];

    useEffect(() => {
        if (id) fetchRestaurantStats(id);
    }, [id]);

    const mainImage = restaurant.photos?.length > 0 ? restaurant.photos[0] : null;
    const bgCard = isDark ? COLORS.darkSurface : COLORS.white;
    const textColor = isDark ? COLORS.darkText : COLORS.text;
    const textSecondary = isDark ? COLORS.darkTextSecondary : COLORS.textSecondary;

    const bannerColors = ['#FF6B00', '#1A237E', '#2E7D32', '#6A1B9A', '#00695C'];
    const colorIndex = (restaurant.name?.charCodeAt(0) || 0) % bannerColors.length;
    const bannerBg = bannerColors[colorIndex];

    const address =
        typeof restaurant.address === 'object'
            ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}`
            : restaurant.address || 'Dirección no disponible';

    const schedule =
        restaurant.schedule ||
        (restaurant.openingHours
            ? `${restaurant.openingHours.open || ''} - ${restaurant.openingHours.close || ''}`
            : t('restaurants.viewSchedule'));

    return (
        <TouchableOpacity
            style={[styles.listCard, { backgroundColor: bgCard }, !isDark && COMMON_STYLES.shadow]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <View style={[styles.listCardBanner, { backgroundColor: bannerBg }]}>
                {mainImage && (
                    <Image source={{ uri: mainImage }} style={styles.listCardImage} resizeMode="cover" />
                )}
                <View style={styles.categoryBadge}>
                    <Typography variant="small" color={COLORS.white} style={{ fontWeight: '700' }}>
                        {restaurant.category || 'Restaurante'}
                    </Typography>
                </View>
                <TouchableOpacity style={styles.arrowBtnOnImage} onPress={onPress}>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </TouchableOpacity>
            </View>
            <View style={styles.listCardInfo}>
                <View style={styles.listCardRow}>
                    <Typography variant="bodyBold" color={textColor} style={{ flex: 1 }} numberOfLines={1}>
                        {restaurant.name}
                    </Typography>
                    <Typography variant="small" color={textSecondary}>
                        {schedule}
                    </Typography>
                </View>
                <View style={styles.listCardRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Ionicons name="star" size={13} color={COLORS.accent} />
                        <Typography variant="small" color={textSecondary} style={{ marginLeft: 4 }}>
                            {stats?.promedioRating ? stats.promedioRating.toFixed(1) : '—'}
                        </Typography>
                        <View style={[styles.dot, { backgroundColor: textSecondary }]} />
                        <Ionicons name="location-outline" size={12} color={textSecondary} />
                        <Typography variant="small" color={textSecondary} numberOfLines={1} style={{ marginLeft: 2, flex: 1 }}>
                            {address}
                        </Typography>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// ─── Pantalla principal ───────────────────────────────────────────────────────
const RestaurantsScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { isDarkMode } = useAuthStore();
    const { restaurantStats, fetchRestaurantStats } = useReviewStore();
    const { notifications, unreadCount, markAsRead: markLocalAsRead, clearNotifications } = useNotificationStore();

    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState(t('restaurants.all'));
    const [selectedRating, setSelectedRating] = useState(0);
    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [notifDropdownVisible, setNotifDropdownVisible] = useState(false);

    const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
    const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
    const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
    const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
    const cardColor = isDarkMode ? '#2a2a2a' : COLORS.white;

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { setActiveCategory(t('restaurants.all')); }, [t]);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await getRestaurants();
            const fetchedRestaurants = res.restaurants || [];
            setRestaurants(fetchedRestaurants);
            fetchedRestaurants.forEach(r => {
                const id = r._id || r.id;
                if (id) fetchRestaurantStats(id);
            });
        } catch (e) {
            setRestaurants([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const categories = useMemo(() => {
        const unique = new Set();
        restaurants.forEach((r) => { if (r.category) unique.add(r.category); });
        return [t('restaurants.all'), ...Array.from(unique)];
    }, [restaurants, t]);

    const ratingOptions = useMemo(() => [
        { value: 0, label: t('home.allRatings') || 'Todas' },
        { value: 5, label: '5 ★' },
        { value: 4, label: '4★ +' },
        { value: 3, label: '3★ +' },
        { value: 2, label: '2★ +' },
    ], [t]);

    const filtered = useMemo(() => {
        return restaurants.filter((r) => {
            const matchSearch = r?.name?.toLowerCase().includes(search.toLowerCase());
            const matchCat = activeCategory === t('restaurants.all') ||
                r?.category?.toLowerCase() === activeCategory.toLowerCase();
            const id = r?._id || r?.id;
            const rating = restaurantStats[id]?.promedioRating || 0;
            const matchRating = selectedRating === 0 || rating >= selectedRating;
            return matchSearch && matchCat && matchRating;
        });
    }, [restaurants, search, activeCategory, selectedRating, restaurantStats, t]);

    const handleMarkAsRead = (id) => {
        markLocalAsRead(id);
    };

    const handleDelete = (id) => {
        useNotificationStore.getState().setNotifications(
            notifications.filter(n => (n.id || n._id) !== id)
        );
    };

    if (loading) return <RestaurantsSkeleton isDark={isDarkMode} />;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Typography variant="h2" color={textColor}>
                        {t('restaurants.title')}
                    </Typography>

                    {/* Campana con dropdown */}
                    <View style={styles.bellWrapper}>
                        <TouchableOpacity
                            style={[styles.bellBtn, { backgroundColor: surfaceColor }]}
                            onPress={() => setNotifDropdownVisible(!notifDropdownVisible)}
                        >
                            <Ionicons name="notifications" size={22} color={textColor} />
                            {unreadCount > 0 && <View style={styles.notifBadge} />}
                        </TouchableOpacity>

                        {/* Dropdown de notificaciones */}
                        {notifDropdownVisible && (
                            <TouchableWithoutFeedback onPress={() => setNotifDropdownVisible(false)}>
                                <View style={styles.dropdownBackdrop} />
                            </TouchableWithoutFeedback>
                        )}
                        {notifDropdownVisible && (
                            <View style={[styles.dropdown, { backgroundColor: cardColor }]}>
                                {notifications.length === 0 ? (
                                    <View style={styles.dropdownEmpty}>
                                        <Typography variant="caption" color={textSecondary}>
                                            No hay notificaciones
                                        </Typography>
                                    </View>
                                ) : (
                                    <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                                        {notifications.slice(0, 5).map((notif) => {
                                            const id = notif.id || notif._id;
                                            return (
                                                <View
                                                    key={id}
                                                    style={[
                                                        styles.notifCard,
                                                        { backgroundColor: isDarkMode ? '#333' : '#f9f9f9' },
                                                        !notif.isRead && { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
                                                    ]}
                                                >
                                                    <Typography variant="bodyBold" color={textColor} numberOfLines={1}>
                                                        {notif.title || 'Notificacion'}
                                                    </Typography>
                                                    <Typography variant="caption" color={textSecondary} numberOfLines={2} style={{ marginTop: 2 }}>
                                                        {notif.message || 'Descripcion'}
                                                    </Typography>
                                                    <View style={styles.notifActions}>
                                                        {!notif.isRead && (
                                                            <TouchableOpacity onPress={() => handleMarkAsRead(id)}>
                                                                <Typography variant="small" color={COLORS.primary}>
                                                                    Marcar como visto
                                                                </Typography>
                                                            </TouchableOpacity>
                                                        )}
                                                        <TouchableOpacity onPress={() => handleDelete(id)}>
                                                            <Typography variant="small" color="#e53935">
                                                                Eliminar
                                                            </Typography>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </ScrollView>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                <Input
                    placeholder={t('restaurants.searchPlaceholder')}
                    value={search}
                    onChangeText={setSearch}
                    style={{ marginBottom: 0 }}
                    inputStyle={{ borderColor: 'transparent' }}
                    leftIcon={<Ionicons name="search-outline" size={20} color={textSecondary} />}
                />
            </View>

            <View style={styles.categoriesWrapper}>
                <View style={styles.categoriesHeaderRow}>
                    <Typography variant="bodyBold" color={textColor} style={styles.categoriesTitle}>
                        {t('restaurants.categories')}
                    </Typography>
                    <TouchableOpacity
                        onPress={() => setRatingModalVisible(true)}
                        style={[styles.filterPill, { backgroundColor: surfaceColor }]}
                    >
                        <Ionicons name="star" size={12} color={COLORS.accent} style={{ marginRight: 4 }} />
                        <Typography variant="caption" color={textColor}>
                            {selectedRating === 0 ? t('home.allRatings') || 'Todas' : `${selectedRating}★`}
                        </Typography>
                        <Ionicons name="chevron-down" size={10} color={textSecondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                    {categories.map((cat) => {
                        const isActive = cat === activeCategory;
                        return (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setActiveCategory(cat)}
                                style={[styles.categoryChip, { backgroundColor: isActive ? COLORS.primary : surfaceColor }]}
                            >
                                <Typography variant="small" color={isActive ? COLORS.white : textSecondary}>
                                    {cat}
                                </Typography>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item._id || item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="restaurant-outline" size={48} color={textSecondary} />
                        <Typography variant="body" color={textSecondary} style={{ marginTop: 12, textAlign: 'center' }}>
                            {t('restaurants.noResults')}
                        </Typography>
                    </View>
                }
                renderItem={({ item }) => (
                    <RestaurantListCard
                        restaurant={item}
                        isDark={isDarkMode}
                        onPress={() => navigation.navigate('RestaurantDetail', { id: item._id || item.id })}
                    />
                )}
            />

            {/* Rating Modal */}
            <Modal visible={ratingModalVisible} transparent animationType="slide" onRequestClose={() => setRatingModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRatingModalVisible(false)}>
                    <View style={[styles.bottomSheet, { backgroundColor: surfaceColor }]}>
                        <View style={styles.sheetHeader}>
                            <Typography variant="bodyBold" color={textColor}>
                                {t('home.filterRating') || 'Filtrar por Calificación'}
                            </Typography>
                            <TouchableOpacity onPress={() => setRatingModalVisible(false)} style={styles.closeSheetBtn}>
                                <Ionicons name="close" size={24} color={textColor} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginVertical: 8 }}>
                            {ratingOptions.map((opt) => {
                                const isSelected = opt.value === selectedRating;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => { setSelectedRating(opt.value); setRatingModalVisible(false); }}
                                        style={[styles.optionRow, isSelected && { backgroundColor: COLORS.primary + '15' }]}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            {opt.value > 0 ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    {[1, 2, 3, 4, 5].map((starIndex) => (
                                                        <Ionicons
                                                            key={starIndex}
                                                            name={starIndex <= opt.value ? "star" : "star-outline"}
                                                            size={16}
                                                            color={starIndex <= opt.value ? COLORS.accent : textSecondary}
                                                            style={{ marginRight: 2 }}
                                                        />
                                                    ))}
                                                    <Typography variant={isSelected ? 'bodyBold' : 'body'} color={isSelected ? COLORS.primary : textColor} style={{ marginLeft: 8 }}>
                                                        {opt.label}
                                                    </Typography>
                                                </View>
                                            ) : (
                                                <Typography variant={isSelected ? 'bodyBold' : 'body'} color={isSelected ? COLORS.primary : textColor}>
                                                    {opt.label}
                                                </Typography>
                                            )}
                                        </View>
                                        {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bellWrapper: { position: 'relative' },
    bellBtn: { padding: 10, borderRadius: 12 },
    notifBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    dropdownBackdrop: {
        position: 'absolute',
        top: 0,
        left: -400,
        right: -400,
        bottom: -800,
        zIndex: 10,
    },
    dropdown: {
        position: 'absolute',
        top: 48,
        right: 0,
        width: 260,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 20,
        overflow: 'hidden',
    },
    dropdownEmpty: { padding: 16, alignItems: 'center' },
    notifCard: {
        padding: 12,
        marginHorizontal: 8,
        marginVertical: 4,
        borderRadius: 10,
    },
    notifActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    categoriesWrapper: { paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
    categoriesTitle: { marginBottom: 10 },
    categoriesList: { gap: 10, paddingBottom: 4 },
    categoryChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
    listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 16 },
    listCard: { borderRadius: 16, overflow: 'hidden' },
    listCardBanner: { width: '100%', height: 140, justifyContent: 'flex-start', padding: 10 },
    listCardImage: { ...StyleSheet.absoluteFillObject, borderRadius: 0 },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    listCardInfo: { padding: 12, gap: 8 },
    listCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 6 },
    arrowBtnOnImage: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: COLORS.primary,
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    categoriesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 2,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
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
        borderBottomColor: '#f1f5f9',
        paddingBottom: 12,
    },
    closeSheetBtn: { padding: 4 },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
});

export default RestaurantsScreen;