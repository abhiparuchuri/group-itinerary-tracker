import { View, Text, SafeAreaView, FlatList, RefreshControl, Pressable } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Button, Card, Input } from '@/components/ui';
import { useUserStore } from '@/lib/stores/userStore';
import { useTripStore } from '@/lib/stores/tripStore';

export default function TripsScreen() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [tripName, setTripName] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const user = useUserStore((state) => state.user);
  const { trips, isLoading, fetchTrips, createTrip, joinTripByCode } = useTripStore();

  useEffect(() => {
    if (user?.id) {
      fetchTrips(user.id);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await fetchTrips(user.id);
    setRefreshing(false);
  }, [user?.id]);

  async function handleCreateTrip() {
    if (!user?.id || !tripName.trim()) return;

    setError('');
    const trip = await createTrip(tripName.trim(), user.id);

    if (trip) {
      setTripName('');
      setShowCreateModal(false);
      router.push(`/trip/${trip.id}`);
    } else {
      setError('Failed to create trip. Please try again.');
    }
  }

  async function handleJoinTrip() {
    if (!user?.id || !joinCode.trim()) return;

    setError('');
    const result = await joinTripByCode(joinCode, user.id);

    if (result.success) {
      setJoinCode('');
      setShowJoinModal(false);
    } else {
      setError(result.error || 'Failed to join trip');
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={{ color: '#6B7280', fontSize: 16, fontWeight: '500' }}>
            {getGreeting()}{user?.display_name ? `, ${user.display_name}` : ''}
          </Text>
          <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#2C3E50', marginTop: 4 }}>Your Trips</Text>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <Animated.View
        entering={FadeInUp.delay(200).springify()}
        style={{ flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12, gap: 12 }}
      >
        <View style={{ flex: 1 }}>
          <Button
            onPress={() => setShowCreateModal(true)}
            variant="primary"
            fullWidth
            icon={<FontAwesome name="plus" size={14} color="white" />}
          >
            New Trip
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            onPress={() => setShowJoinModal(true)}
            variant="secondary"
            fullWidth
            icon={<FontAwesome name="users" size={14} color="white" />}
          >
            Join Trip
          </Button>
        </View>
      </Animated.View>

      {/* Trips List */}
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />
        }
        ListEmptyComponent={
          <Animated.View
            entering={FadeIn.delay(300)}
            style={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 }}
          >
            <View
              style={{
                width: 96,
                height: 96,
                backgroundColor: 'white',
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                shadowColor: '#2C3E50',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 48 }}>{'🗺️'}</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 }}>No trips yet</Text>
            <Text style={{ color: '#6B7280', textAlign: 'center', fontSize: 16, lineHeight: 24 }}>
              Start your adventure! Create a new trip{'\n'}or join one with a friend's code.
            </Text>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInUp.delay(100 + 50 * index).springify()}>
            <Pressable
              onPress={() => router.push(`/trip/${item.id}`)}
              className="mb-4"
            >
              <View
                className="bg-white rounded-3xl p-5"
                style={{
                  shadowColor: '#2C3E50',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-xl font-bold text-charcoal">{item.name}</Text>
                    {(item.start_date || item.end_date) && (
                      <View className="flex-row items-center mt-2">
                        <FontAwesome name="calendar" size={12} color="#9CA3AF" />
                        <Text className="text-gray-500 ml-2 text-sm">
                          {formatDate(item.start_date)}
                          {item.end_date && ` → ${formatDate(item.end_date)}`}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center mt-2">
                      <FontAwesome name="users" size={12} color="#9CA3AF" />
                      <Text className="text-gray-500 ml-2 text-sm">
                        {item.memberCount} {item.memberCount === 1 ? 'traveler' : 'travelers'}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-teal-100 px-3 py-1.5 rounded-xl">
                    <Text className="text-teal-600 font-bold text-xs tracking-wider">{item.join_code}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}
      />

      {/* Create Trip Modal */}
      {showCreateModal && (
        <Pressable
          onPress={() => {
            setShowCreateModal(false);
            setTripName('');
            setError('');
          }}
          className="absolute inset-0 bg-black/50 items-center justify-center px-6"
        >
          <Animated.View
            entering={FadeInUp.springify()}
            className="w-full"
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View
                className="bg-white rounded-3xl p-6"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                <View className="items-center mb-4">
                  <View className="w-16 h-16 bg-coral-100 rounded-2xl items-center justify-center mb-4">
                    <Text className="text-3xl">{'✈️'}</Text>
                  </View>
                  <Text className="text-2xl font-bold text-charcoal">Create New Trip</Text>
                  <Text className="text-gray-500 text-center mt-1">
                    Give your adventure a name
                  </Text>
                </View>

                <Input
                  label="Trip Name"
                  value={tripName}
                  onChangeText={setTripName}
                  placeholder="e.g., Summer in Italy"
                  error={error}
                />

                <View className="flex-row gap-3 mt-6">
                  <View className="flex-1">
                    <Button
                      onPress={() => {
                        setShowCreateModal(false);
                        setTripName('');
                        setError('');
                      }}
                      variant="ghost"
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button
                      onPress={handleCreateTrip}
                      disabled={!tripName.trim() || isLoading}
                      fullWidth
                    >
                      {isLoading ? 'Creating...' : 'Create'}
                    </Button>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      )}

      {/* Join Trip Modal */}
      {showJoinModal && (
        <Pressable
          onPress={() => {
            setShowJoinModal(false);
            setJoinCode('');
            setError('');
          }}
          className="absolute inset-0 bg-black/50 items-center justify-center px-6"
        >
          <Animated.View
            entering={FadeInUp.springify()}
            className="w-full"
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View
                className="bg-white rounded-3xl p-6"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                <View className="items-center mb-4">
                  <View className="w-16 h-16 bg-teal-100 rounded-2xl items-center justify-center mb-4">
                    <Text className="text-3xl">{'🤝'}</Text>
                  </View>
                  <Text className="text-2xl font-bold text-charcoal">Join a Trip</Text>
                  <Text className="text-gray-500 text-center mt-1">
                    Enter the code from your friend
                  </Text>
                </View>

                <Input
                  label="Trip Code"
                  value={joinCode}
                  onChangeText={(text) => setJoinCode(text.toUpperCase())}
                  placeholder="e.g., ABC123"
                  error={error}
                  autoCapitalize="characters"
                  maxLength={6}
                />

                <View className="flex-row gap-3 mt-6">
                  <View className="flex-1">
                    <Button
                      onPress={() => {
                        setShowJoinModal(false);
                        setJoinCode('');
                        setError('');
                      }}
                      variant="ghost"
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button
                      onPress={handleJoinTrip}
                      disabled={joinCode.length !== 6 || isLoading}
                      fullWidth
                      variant="secondary"
                    >
                      {isLoading ? 'Joining...' : 'Join'}
                    </Button>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}
