import { View, Text, SafeAreaView, Pressable } from 'react-native';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInUp } from 'react-native-reanimated';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Card } from '@/components/ui';
import { TripMap } from '@/components/map/TripMap';
import { supabase } from '@/lib/supabase';
import { Trip, ActivityCategory } from '@/lib/types/database';
import { useItineraryStore } from '@/lib/stores/itineraryStore';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF6B6B',
  attraction: '#4ECDC4',
  transport: '#9B59B6',
  lodging: '#3498DB',
  other: '#95A5A6',
};

export default function MapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const { days, fetchItinerary } = useItineraryStore();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  useEffect(() => {
    if (id) {
      fetchTripDetails();
      fetchItinerary(id);
    }
  }, [id]);

  async function fetchTripDetails() {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setTrip(data);
    }
  }

  // Get all activities with locations for map markers
  const mapMarkers = days.flatMap((day) =>
    day.activities
      .filter((a) => a.latitude && a.longitude)
      .map((a) => ({
        id: a.id,
        name: a.name,
        latitude: a.latitude!,
        longitude: a.longitude!,
        category: a.category,
      }))
  );

  // Get activities with location for list
  const activitiesWithLocation = days.flatMap((day) =>
    day.activities.filter((a) => a.latitude && a.longitude)
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Map',
          headerShown: true,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#2C3E50',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2 mr-2">
              <FontAwesome name="chevron-left" size={20} color="#2C3E50" />
            </Pressable>
          ),
          headerTitle: '',
        }}
      />

      {/* Full-screen Map */}
      <View className="flex-1">
        <TripMap markers={mapMarkers} />

        {/* Legend overlay */}
        <View className="absolute top-24 right-4 bg-white rounded-2xl p-3 shadow-lg">
          {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
            <View key={category} className="flex-row items-center mb-1 last:mb-0">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: color }}
              />
              <Text className="text-xs text-gray-600 capitalize">{category}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Sheet with locations list */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: '#FFF9F0', borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: '#CBD5E0', width: 40 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-charcoal">Places</Text>
            <Text className="text-gray-500">{activitiesWithLocation.length} locations</Text>
          </View>

          {/* Location List */}
          {activitiesWithLocation.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(100)}>
              <Card>
                <View className="items-center py-8">
                  <Text className="text-4xl mb-3">📍</Text>
                  <Text className="text-gray-500 text-center">
                    No locations added yet.{'\n'}
                    Add locations to your activities to see them here!
                  </Text>
                </View>
              </Card>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.delay(100)}>
              <Card>
                {activitiesWithLocation.map((activity, index) => (
                  <View key={activity.id}>
                    {index > 0 && <View className="h-px bg-gray-100 my-3" />}
                    <View className="flex-row items-center">
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: (CATEGORY_COLORS[activity.category] || '#95A5A6') + '20' }}
                      >
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[activity.category] || '#95A5A6' }}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-charcoal font-medium">{activity.name}</Text>
                        {activity.location_name && (
                          <Text className="text-gray-500 text-sm">{activity.location_name}</Text>
                        )}
                      </View>
                      <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
                    </View>
                  </View>
                ))}
              </Card>
            </Animated.View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}
