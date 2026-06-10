import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { COLORS } from '../../../shared/constants/colors';
import { THEME, COMMON_STYLES } from '../../../shared/constants/theme';
import { getRestaurantById, getRestaurantProducts } from '../../../api/restaurants';
import { Ionicons } from '@expo/vector-icons';

const RestaurantDetailScreen = ({ route }) => {
  const { id } = route.params;
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [resData, prodData] = await Promise.all([
        getRestaurantById(id),
        getRestaurantProducts(id)
      ]);
      setRestaurant(resData);
      setProducts(prodData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[COMMON_STYLES.container, COMMON_STYLES.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={COMMON_STYLES.container}>
      <Image 
        source={{ uri: restaurant?.imageUrl || 'https://via.placeholder.com/400x200?text=Restaurante' }} 
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{restaurant?.name}</Text>
        <Text style={styles.category}>{restaurant?.category}</Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailText}>{restaurant?.openingHours}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailText}>{restaurant?.address}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Menú</Text>
        {products.map((item) => (
          <View key={item.id} style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.description || 'Sin descripción disponible.'}
              </Text>
              <Text style={styles.productPrice}>${item.price}</Text>
            </View>
            <Image 
              source={{ uri: item.imageUrl || 'https://via.placeholder.com/100?text=Plato' }} 
              style={styles.productImage}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 250,
  },
  info: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    marginTop: -20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  category: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 12,
    gap: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  productDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: THEME.borderRadius.md,
  }
});

export default RestaurantDetailScreen;
