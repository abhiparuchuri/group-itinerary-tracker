import { View, Text, SafeAreaView, FlatList, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
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

  return (
    <SafeAreaView className="flex-1 bg-cream">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text className="text-3xl font-bold text-charcoal">My Trips</Text>
          <Text className="text-gray-500 mt-1">
            {user?.display_name ? `Hey ${user.display_name}!` : 'Plan your adventures'}
          </Text>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View className="px-6 py-4 flex-row gap-3">
        <View className="flex-1">
          <Button
            onPress={() => setShowCreateModal(true)}
            variant="primary"
            icon={<FontAwesome name="plus" size={16} color="white" />}
          >
            New Trip
          </Button>
        </View>
        <View className="flex-1">
          <Button
            onPress={() => setShowJoinModal(true)}
            variant="outline"
            icon={<FontAwesome name="users" size={16} color="#FF6B6B" />}
          >
            Join Trip
          </Button>
        </View>
      </View>

      {/* Trips List */}
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 pb-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />
        }
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.delay(200)} className="items-center py-16">
            <Text className="text-6xl mb-4">{'🗺️'}</Text>
            <Text className="text-xl font-semibold text-charcoal mb-2">No trips yet</Text>
            <Text className="text-gray-500 text-center">
              Create a new trip or join one{'\n'}with a code from a friend!
            </Text>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInUp.delay(100 * index)}>
            <Card
              className="mb-4"
              onPress={() => router.push(`/trip/${item.id}`)}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-xl font-bold text-charcoal">{item.name}</Text>
                  {(item.start_date || item.end_date) && (
                    <Text className="text-gray-500 mt-1">
                      {formatDate(item.start_date)}
                      {item.end_date && ` - ${formatDate(item.end_date)}`}
                    </Text>
                  )}
                  <View className="flex-row items-center mt-2">
                    <FontAwesome name="users" size={14} color="#9CA3AF" />
                    <Text className="text-gray-500 ml-2">
                      {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                </View>
                <View className="bg-coral-100 px-3 py-1 rounded-full">
                  <Text className="text-coral-500 font-semibold text-xs">{item.join_code}</Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}
      />

      {/* Create Trip Modal */}
      {showCreateModal && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center px-6">
          <Animated.View entering={FadeInUp.springify()} className="w-full">
            <Card className="p-6">
              <Text className="text-2xl font-bold text-charcoal mb-4">Create New Trip</Text>

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
                  >
                    Cancel
                  </Button>
                </View>
                <View className="flex-1">
                  <Button
                    onPress={handleCreateTrip}
                    disabled={!tripName.trim() || isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create'}
                  </Button>
                </View>
              </View>
            </Card>
          </Animated.View>
        </View>
      )}

      {/* Join Trip Modal */}
      {showJoinModal && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center px-6">
          <Animated.View entering={FadeInUp.springify()} className="w-full">
            <Card className="p-6">
              <Text className="text-2xl font-bold text-charcoal mb-2">Join a Trip</Text>
              <Text className="text-gray-500 mb-4">
                Enter the 6-character code shared by your friend
              </Text>

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
                  >
                    Cancel
                  </Button>
                </View>
                <View className="flex-1">
                  <Button
                    onPress={handleJoinTrip}
                    disabled={joinCode.length !== 6 || isLoading}
                  >
                    {isLoading ? 'Joining...' : 'Join'}
                  </Button>
                </View>
              </View>
            </Card>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}
