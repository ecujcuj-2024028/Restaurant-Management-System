import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReservationsScreen from '../features/reservations/screens/ReservationsScreen';

const Stack = createNativeStackNavigator();

const ReservationsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ReservationsMain" 
        component={ReservationsScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ReservationsStack;