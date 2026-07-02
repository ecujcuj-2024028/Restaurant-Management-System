import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventsScreen from '../features/events/screens/EventsScreen';

const Stack = createNativeStackNavigator();

const EventsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsMain" component={EventsScreen} />
    </Stack.Navigator>
  );
};

export default EventsStack;
