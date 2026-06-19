import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    StatusBar,
    RefreshControl,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES } from '../../../shared/constants/theme';
import { getRestaurants } from '../../../api/restaurants';
import useAuthStore from '../../../store/useAuthStore';
import useReviewStore from '../../../store/useReviewStore';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';
import Skeleton from '../../../shared/components/common/Skeleton';

// ─── Skeleton de carga ───────────────────────────────────────────────────────
const ReservationsSkeleton = ({ isDark }) => {
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

// ─── Tarjeta de restaurante en lista vertical ────────────────────────────────
const RestaurantReservationCard = ({ restaurant, onPress, isDark }) => {
    const { t } = useTranslation();
    const { restaurantStats, fetchRestaurantStats } = useReviewStore();
    const id = restaurant._id || restaurant.id;
    const stats = restaurantStats[id];

    useEffect(() => {
        if (id) fetchRestaurantStats(id);
    }, [id]);

    const mainImage =
        restaurant.photos && restaurant.photos.length > 0
            ? restaurant.photos[0]
            : null;

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
            : t('reservations.viewSchedule'));

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
const ReservationsScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { isDarkMode } = useAuthStore();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState(t('reservations.all'));

    const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
    const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
    const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
    const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await getRestaurants();
            setRestaurants(res.restaurants || []);
        } catch (e) {
            console.error('Error al obtener restaurantes:', e);
            setRestaurants([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const categories = useMemo(() => {
        const unique = new Set();
        restaurants.forEach((r) => {
            if (r.category) unique.add(r.category);
        });
        return [t('reservations.all'), ...Array.from(unique)];
    }, [restaurants, t]);

    const filtered = useMemo(() => {
        return restaurants.filter((r) => {
            const matchSearch = r?.name?.toLowerCase().includes(search.toLowerCase());
            const matchCat =
                activeCategory === t('reservations.all') ||
                r?.category?.toLowerCase() === activeCategory.toLowerCase();
            return matchSearch && matchCat;
        });
    }, [restaurants, search, activeCategory, t]);

    if (loading) return <ReservationsSkeleton isDark={isDarkMode} />;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Typography variant="h2" color={textColor}>
                        {t('reservations.title')}
                    </Typography>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity 
                            style={[styles.bellBtn, { backgroundColor: surfaceColor }]}
                            onPress={() => navigation.navigate('MyReservations')}
                        >
                            <Ionicons name="calendar-outline" size={22} color={textColor} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.bellBtn, { backgroundColor: surfaceColor }]}>
                            <Ionicons name="notifications" size={22} color={textColor} />
                        </TouchableOpacity>
                    </View>
                </View>

                <Input
                    placeholder={t('reservations.searchPlaceholder')}
                    value={search}
                    onChangeText={setSearch}
                    style={{ marginBottom: 0 }}
                    inputStyle={{ borderColor: 'transparent' }}
                    leftIcon={<Ionicons name="search-outline" size={20} color={textSecondary} />}
                />
            </View>

            <View style={styles.categoriesWrapper}>
                <Typography variant="bodyBold" color={textColor} style={styles.categoriesTitle}>
                    {t('reservations.categories')}
                </Typography>
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
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchData(true)}
                        tintColor={COLORS.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={48} color={textSecondary} />
                        <Typography variant="body" color={textSecondary} style={{ marginTop: 12, textAlign: 'center' }}>
                            {t('reservations.noResults')}
                        </Typography>
                    </View>
                }
                renderItem={({ item }) => (
                    <RestaurantReservationCard
                        restaurant={item}
                        isDark={isDarkMode}
                        onPress={() =>
                            navigation.navigate('ReservationForm', { id: item._id || item.id })
                        }
                    />
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bellBtn: {
        padding: 10,
        borderRadius: 12,
    },
    categoriesWrapper: {
        paddingHorizontal: 16,
        marginTop: 8,
        marginBottom: 4,
    },
    categoriesTitle: { marginBottom: 10 },
    categoriesList: {
        gap: 10,
        paddingBottom: 4,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
        gap: 16,
    },
    listCard: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    listCardBanner: {
        width: '100%',
        height: 140,
        justifyContent: 'flex-start',
        padding: 10,
    },
    listCardImage: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 0,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
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
    listCardInfo: {
        padding: 12,
        gap: 8,
    },
    listCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        marginHorizontal: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
});

export default ReservationsScreen;