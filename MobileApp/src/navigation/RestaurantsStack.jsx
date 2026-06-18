import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RestaurantsScreen from '../features/restaurants/screens/RestaurantsScreen';
import RestaurantDetailScreen from '../features/restaurants/screens/RestaurantDetailScreen';
import ProductDetailScreen from '../features/product/screens/ProductDetailScreen';

const Stack = createNativeStackNavigator();

const RestaurantsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RestaurantsMain"
        component={RestaurantsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default RestaurantsStack;
