import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReservationsScreen from '../features/reservations/screens/ReservationsScreen';
import ReservationFormScreen from '../features/reservations/screens/ReservationFormScreen';

const Stack = createNativeStackNavigator();

const ReservationsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReservationsMain"
        component={ReservationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReservationForm"
        component={ReservationFormScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ReservationsStack;
