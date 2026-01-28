import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { Trip } from '@/lib/types/database';
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

  // Get all activities with locations
  const activitiesWithLocation = days.flatMap((day) =>
    day.activities.filter((a) => a.latitude && a.longitude)
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Map', headerShown: true }} />

      <SafeAreaView className="flex-1 bg-cream">
        <ScrollView className="flex-1 px-6">
          {/* Map Placeholder */}
          <Animated.View entering={FadeInUp.delay(100)} className="py-4">
            <Card className="overflow-hidden">
              <View className="bg-teal-100 h-48 items-center justify-center">
                <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4">
                  <Text className="text-4xl">🗺️</Text>
                </View>
                <Text className="text-xl font-bold text-charcoal">Map Coming Soon</Text>
                <Text className="text-teal-600 mt-2 text-center px-8">
                  Interactive map with all your trip locations will be available here
                </Text>
              </View>
            </Card>
          </Animated.View>

          {/* Location List */}
          <Animated.View entering={FadeInUp.delay(200)} className="mb-4">
            <Text className="text-lg font-semibold text-charcoal mb-3">
              Places ({activitiesWithLocation.length})
            </Text>

            {activitiesWithLocation.length === 0 ? (
              <Card>
                <View className="items-center py-8">
                  <Text className="text-4xl mb-3">📍</Text>
                  <Text className="text-gray-500 text-center">
                    No locations added yet.{'\n'}
                    Add locations to your activities to see them here!
                  </Text>
                </View>
              </Card>
            ) : (
              <Card>
                {activitiesWithLocation.map((activity, index) => (
                  <View key={activity.id}>
                    {index > 0 && <View className="h-px bg-gray-100 my-3" />}
                    <View className="flex-row items-center">
                      <View
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: CATEGORY_COLORS[activity.category] || '#95A5A6' }}
                      />
                      <View className="flex-1">
                        <Text className="text-charcoal font-medium">{activity.name}</Text>
                        {activity.location_name && (
                          <Text className="text-gray-500 text-sm">{activity.location_name}</Text>
                        )}
                      </View>
                      <FontAwesome name="map-marker" size={16} color="#9CA3AF" />
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </Animated.View>

          {/* Legend */}
          <Animated.View entering={FadeInUp.delay(300)} className="mb-8">
            <Text className="text-lg font-semibold text-charcoal mb-3">Legend</Text>
            <Card>
              <View className="flex-row flex-wrap">
                {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                  <View key={category} className="flex-row items-center w-1/2 mb-2">
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    />
                    <Text className="text-gray-600 capitalize text-sm">{category}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
