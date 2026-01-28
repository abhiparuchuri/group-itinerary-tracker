import { Stack } from 'expo-router';

export default function TripLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFF9F0',
        },
        headerTintColor: '#2C3E50',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Trip Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="itinerary"
        options={{
          title: 'Itinerary',
          headerBackTitle: 'Trip',
        }}
      />
      <Stack.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          headerBackTitle: 'Trip',
        }}
      />
    </Stack>
  );
}
