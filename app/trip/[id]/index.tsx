import { View, Text, SafeAreaView, ScrollView, Pressable, Share } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Card, Button, Avatar } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { Trip, User, TripMember } from '@/lib/types/database';
import { useTripStore } from '@/lib/stores/tripStore';
import { useRealtimeTrip } from '@/lib/hooks/useRealtimeTrip';

interface MemberWithUser extends TripMember {
  user: User;
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);

  // Subscribe to realtime updates for this trip
  useRealtimeTrip(id);

  useEffect(() => {
    if (id) {
      fetchTripDetails();
    }
  }, [id]);

  async function fetchTripDetails() {
    setIsLoading(true);

    // Fetch trip
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (tripError || !tripData) {
      console.error('Error fetching trip:', tripError);
      setIsLoading(false);
      return;
    }

    setTrip(tripData);
    setCurrentTrip(tripData);

    // Fetch members with user details
    const { data: memberData, error: memberError } = await supabase
      .from('trip_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('trip_id', id);

    if (!memberError && memberData) {
      setMembers(memberData as MemberWithUser[]);
    }

    setIsLoading(false);
  }

  async function handleShareCode() {
    if (!trip) return;

    try {
      await Share.share({
        message: `Join my trip "${trip.name}" on TripTogether! Use code: ${trip.join_code}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <Text className="text-gray-500">Trip not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: trip.name }} />

      <SafeAreaView className="flex-1 bg-cream">
        <ScrollView className="flex-1 px-6">
          {/* Trip Header */}
          <Animated.View entering={FadeInDown.delay(100)} className="py-4">
            <Text className="text-3xl font-bold text-charcoal">{trip.name}</Text>
            {trip.description && (
              <Text className="text-gray-600 mt-2">{trip.description}</Text>
            )}
          </Animated.View>

          {/* Join Code Card */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <Card className="bg-coral-500 p-6">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white/80 text-sm">Share this code</Text>
                  <Text className="text-white text-3xl font-bold tracking-wider mt-1">
                    {trip.join_code}
                  </Text>
                </View>
                <Pressable
                  onPress={handleShareCode}
                  className="bg-white/20 p-4 rounded-full"
                >
                  <FontAwesome name="share" size={20} color="white" />
                </Pressable>
              </View>
            </Card>
          </Animated.View>

          {/* Dates */}
          <Animated.View entering={FadeInUp.delay(300)} className="mt-6">
            <Text className="text-lg font-semibold text-charcoal mb-3">Dates</Text>
            <Card>
              <View className="flex-row">
                <View className="flex-1">
                  <Text className="text-gray-500 text-sm">Start Date</Text>
                  <Text className="text-charcoal font-medium mt-1">
                    {formatDate(trip.start_date)}
                  </Text>
                </View>
                <View className="w-px bg-gray-200 mx-4" />
                <View className="flex-1">
                  <Text className="text-gray-500 text-sm">End Date</Text>
                  <Text className="text-charcoal font-medium mt-1">
                    {formatDate(trip.end_date)}
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>

          {/* Members */}
          <Animated.View entering={FadeInUp.delay(400)} className="mt-6">
            <Text className="text-lg font-semibold text-charcoal mb-3">
              Travelers ({members.length})
            </Text>
            <Card>
              {members.map((member, index) => (
                <View key={member.id}>
                  {index > 0 && <View className="h-px bg-gray-200 my-3" />}
                  <View className="flex-row items-center">
                    <Avatar
                      name={member.user.display_name}
                      imageUrl={member.user.avatar_url}
                      size="md"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-charcoal font-medium">
                        {member.user.display_name}
                      </Text>
                      <Text className="text-gray-500 text-sm capitalize">
                        {member.role}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(500)} className="mt-6 mb-8">
            <Text className="text-lg font-semibold text-charcoal mb-3">Quick Actions</Text>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Card
                  className="items-center py-6"
                  onPress={() => router.push(`/trip/${id}/itinerary`)}
                >
                  <View className="bg-teal-100 p-3 rounded-full mb-2">
                    <FontAwesome name="calendar" size={24} color="#4ECDC4" />
                  </View>
                  <Text className="text-charcoal font-medium">Itinerary</Text>
                </Card>
              </View>

              <View className="flex-1">
                <Card className="items-center py-6" onPress={() => {}}>
                  <View className="bg-sunny-100 p-3 rounded-full mb-2">
                    <FontAwesome name="map-marker" size={24} color="#FFE66D" />
                  </View>
                  <Text className="text-charcoal font-medium">Map</Text>
                </Card>
              </View>

              <View className="flex-1">
                <Card
                  className="items-center py-6"
                  onPress={() => router.push(`/trip/${id}/expenses`)}
                >
                  <View className="bg-coral-100 p-3 rounded-full mb-2">
                    <FontAwesome name="dollar" size={24} color="#FF6B6B" />
                  </View>
                  <Text className="text-charcoal font-medium">Expenses</Text>
                </Card>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
