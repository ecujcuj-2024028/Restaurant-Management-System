import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES, THEME } from '../../../shared/constants/theme';
import { getRestaurants } from '../../../api/restaurants';
import RestaurantCard from '../components/RestaurantCard';

const HomeScreen = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const data = await getRestaurants();
      // Aseguramos que data sea un array, si no, usamos array vacío
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]); // Evita que sea undefined
    } finally {
      setLoading(false);
    }
  };

  // Añadimos validación extra en el filter
  const filteredRestaurants = (restaurants || []).filter(r => 
    r?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[COMMON_STYLES.container, COMMON_STYLES.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={COMMON_STYLES.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorar</Text>
        <TextInput
          style={styles.searchBar}
          placeholder="Buscar restaurantes..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RestaurantCard 
            restaurant={item} 
            onPress={() => navigation.navigate('RestaurantDetail', { id: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se encontraron restaurantes.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: COLORS.background,
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: COLORS.textSecondary,
  }
});

export default HomeScreen;
