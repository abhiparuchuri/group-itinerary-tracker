import { View, Text, SafeAreaView, ScrollView, Pressable, Share, Platform, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card, Button, Avatar } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { Trip, User, TripMember } from '@/lib/types/database';
import { useTripStore } from '@/lib/stores/tripStore';
import { useItineraryStore } from '@/lib/stores/itineraryStore';
import { useUserStore } from '@/lib/stores/userStore';
import { useRealtimeTrip } from '@/lib/hooks/useRealtimeTrip';

interface MemberWithUser extends TripMember {
  user: User;
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);
  const fetchTrips = useTripStore((state) => state.fetchTrips);
  const { addDaysForDateRange, fetchItinerary } = useItineraryStore();
  const user = useUserStore((state) => state.user);

  // Subscribe to realtime updates for this trip
  useRealtimeTrip(id);

  useEffect(() => {
    if (id) {
      fetchTripDetails();
      fetchItinerary(id); // Load existing itinerary days
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

  function handleShowOptions() {
    Alert.alert(
      'Trip Options',
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Trip',
          style: 'destructive',
          onPress: handleDeleteTrip,
        },
      ]
    );
  }

  async function handleDeleteTrip() {
    if (!trip) return;

    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${trip.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('trips')
              .delete()
              .eq('id', trip.id);

            if (error) {
              Alert.alert('Error', 'Failed to delete trip. Please try again.');
              console.error('Error deleting trip:', error);
              return;
            }

            // Refresh the trips list to reflect deletion
            if (user) {
              await fetchTrips(user.id);
            }
            router.back();
          },
        },
      ]
    );
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return isEditingDates ? 'Tap to set' : 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  async function handleDateChange(type: 'start' | 'end', date: Date | undefined) {
    if (!date || !trip) return;

    const field = type === 'start' ? 'start_date' : 'end_date';
    const dateStr = date.toISOString().split('T')[0];

    const { error } = await supabase
      .from('trips')
      .update({ [field]: dateStr })
      .eq('id', trip.id);

    if (!error) {
      const updatedTrip = { ...trip, [field]: dateStr };
      setTrip(updatedTrip);

      // Auto-create itinerary days when both dates are set
      const startDate = type === 'start' ? dateStr : trip.start_date;
      const endDate = type === 'end' ? dateStr : trip.end_date;

      if (startDate && endDate) {
        await addDaysForDateRange(trip.id, startDate, endDate);
      }
    }

    if (Platform.OS === 'android') {
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
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
      <Stack.Screen
        options={{
          title: trip.name,
          headerShown: true,
          headerStyle: { backgroundColor: '#FFF9F0' },
          headerTintColor: '#2C3E50',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2 mr-2">
              <FontAwesome name="chevron-left" size={20} color="#2C3E50" />
            </Pressable>
          ),
        }}
      />

      <SafeAreaView className="flex-1 bg-cream">
        <ScrollView className="flex-1 px-6">
          {/* Trip Header */}
          <Animated.View entering={FadeInDown.delay(100)} className="py-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-charcoal flex-1">{trip.name}</Text>
              <Pressable
                onPress={handleShowOptions}
                className="p-2 ml-2"
              >
                <FontAwesome name="ellipsis-v" size={20} color="#2C3E50" />
              </Pressable>
            </View>
            {trip.description && (
              <Text className="text-gray-600 mt-2">{trip.description}</Text>
            )}
          </Animated.View>

          {/* Join Code Card */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <View className="bg-coral-500 rounded-3xl p-6 shadow-lg">
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
            </View>
          </Animated.View>

          {/* Dates */}
          <Animated.View entering={FadeInUp.delay(300)} className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text className="text-lg font-semibold text-charcoal">Dates</Text>
                <Text className="ml-2">{isEditingDates ? '🔓' : '🔒'}</Text>
              </View>
              <Pressable
                onPress={() => setIsEditingDates(!isEditingDates)}
                className={`px-3 py-1.5 rounded-full ${isEditingDates ? 'bg-coral-500' : 'bg-gray-200'}`}
              >
                <Text className={`text-sm font-medium ${isEditingDates ? 'text-white' : 'text-charcoal'}`}>
                  {isEditingDates ? 'Done' : 'Edit'}
                </Text>
              </Pressable>
            </View>
            <Card>
              <View className="flex-row">
                <Pressable
                  className="flex-1"
                  onPress={() => isEditingDates && setShowStartPicker(true)}
                  disabled={!isEditingDates}
                >
                  <Text className="text-gray-500 text-sm">Start Date</Text>
                  <Text className={`font-medium mt-1 ${isEditingDates ? 'text-coral-500' : 'text-charcoal'}`}>
                    {formatDate(trip.start_date)}
                  </Text>
                </Pressable>
                <View className="w-px bg-gray-200 mx-4" />
                <Pressable
                  className="flex-1"
                  onPress={() => isEditingDates && setShowEndPicker(true)}
                  disabled={!isEditingDates}
                >
                  <Text className="text-gray-500 text-sm">End Date</Text>
                  <Text className={`font-medium mt-1 ${isEditingDates ? 'text-coral-500' : 'text-charcoal'}`}>
                    {formatDate(trip.end_date)}
                  </Text>
                </Pressable>
              </View>
            </Card>

            {(showStartPicker || showEndPicker) && Platform.OS === 'ios' && (
              <View className="bg-gray-100 rounded-2xl mt-4 p-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-charcoal font-semibold">
                    {showStartPicker ? 'Select Start Date' : 'Select End Date'}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowStartPicker(false);
                      setShowEndPicker(false);
                    }}
                    className="bg-coral-500 px-4 py-2 rounded-full"
                  >
                    <Text className="text-white font-semibold">Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={
                    showStartPicker
                      ? trip.start_date ? new Date(trip.start_date) : new Date()
                      : trip.end_date ? new Date(trip.end_date) : new Date()
                  }
                  mode="date"
                  display="spinner"
                  minimumDate={showEndPicker && trip.start_date ? new Date(trip.start_date) : undefined}
                  onChange={(_, date) => handleDateChange(showStartPicker ? 'start' : 'end', date)}
                />
              </View>
            )}

            {showStartPicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={trip.start_date ? new Date(trip.start_date) : new Date()}
                mode="date"
                onChange={(_, date) => {
                  setShowStartPicker(false);
                  handleDateChange('start', date);
                }}
              />
            )}

            {showEndPicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={trip.end_date ? new Date(trip.end_date) : new Date()}
                mode="date"
                minimumDate={trip.start_date ? new Date(trip.start_date) : undefined}
                onChange={(_, date) => {
                  setShowEndPicker(false);
                  handleDateChange('end', date);
                }}
              />
            )}
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
                <Card className="items-center py-6" onPress={() => router.push(`/trip/${id}/map`)}>
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
