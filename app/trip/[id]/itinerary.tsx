import { View, Text, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { Card, Button, Input, DatePicker } from '@/components/ui';
import { useItineraryStore } from '@/lib/stores/itineraryStore';
import { useUserStore } from '@/lib/stores/userStore';
import { Activity, ActivityCategory } from '@/lib/types/database';

const CATEGORY_CONFIG: Record<ActivityCategory, { icon: string; color: string; bg: string }> = {
  food: { icon: 'cutlery', color: '#FF6B6B', bg: 'bg-coral-100' },
  attraction: { icon: 'star', color: '#4ECDC4', bg: 'bg-teal-100' },
  transport: { icon: 'car', color: '#9B59B6', bg: 'bg-purple-100' },
  lodging: { icon: 'bed', color: '#3498DB', bg: 'bg-blue-100' },
  other: { icon: 'map-marker', color: '#95A5A6', bg: 'bg-gray-100' },
};

function formatDate(dateString: string) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timeString: string | null) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useUserStore((state) => state.user);
  const { days, isLoading, fetchItinerary, addDay, addActivity, deleteDay, deleteActivity } =
    useItineraryStore();

  const [showAddDay, setShowAddDay] = useState(false);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [showAddActivity, setShowAddActivity] = useState<string | null>(null);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCategory, setNewActivityCategory] = useState<ActivityCategory>('other');

  useEffect(() => {
    if (id) {
      fetchItinerary(id);
    }
  }, [id]);

  async function handleAddDay() {
    if (!id || !newDate) return;

    // Format date as YYYY-MM-DD
    const dateString = newDate.toISOString().split('T')[0];
    await addDay(id, dateString);
    setNewDate(null);
    setShowAddDay(false);
  }

  async function handleAddActivity(dayId: string) {
    if (!user?.id || !newActivityName.trim()) return;

    await addActivity(
      dayId,
      {
        name: newActivityName.trim(),
        category: newActivityCategory,
      },
      user.id
    );

    setNewActivityName('');
    setNewActivityCategory('other');
    setShowAddActivity(null);
  }

  function handleDeleteDay(dayId: string, date: string) {
    Alert.alert(
      'Delete Day',
      `Are you sure you want to delete ${formatDate(date)} and all its activities?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDay(dayId),
        },
      ]
    );
  }

  function handleDeleteActivity(activityId: string, name: string) {
    Alert.alert('Delete Activity', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteActivity(activityId),
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Itinerary', headerShown: true }} />

      <SafeAreaView className="flex-1 bg-cream">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="flex-row items-center justify-between py-4">
            <Text className="text-2xl font-bold text-charcoal">Your Itinerary</Text>
            <Button
              onPress={() => setShowAddDay(true)}
              size="sm"
              icon={<FontAwesome name="plus" size={14} color="white" />}
            >
              Add Day
            </Button>
          </View>

          {/* Days List */}
          {isLoading ? (
            <View className="items-center py-16">
              <Text className="text-gray-500">Loading itinerary...</Text>
            </View>
          ) : days.length === 0 ? (
            <Animated.View entering={FadeInUp} className="items-center py-16">
              <Text className="text-6xl mb-4">{'📅'}</Text>
              <Text className="text-xl font-semibold text-charcoal mb-2">No days planned</Text>
              <Text className="text-gray-500 text-center">
                Add your first day to start{'\n'}planning your adventure!
              </Text>
            </Animated.View>
          ) : (
            days.map((day, dayIndex) => (
              <Animated.View
                key={day.id}
                entering={FadeInDown.delay(100 * dayIndex)}
                layout={Layout.springify()}
                className="mb-6"
              >
                {/* Day Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className="bg-coral-500 w-10 h-10 rounded-full items-center justify-center mr-3">
                      <Text className="text-white font-bold">{dayIndex + 1}</Text>
                    </View>
                    <Text className="text-lg font-semibold text-charcoal">
                      {formatDate(day.date)}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => setShowAddActivity(day.id)}
                      className="bg-teal-100 p-2 rounded-full"
                    >
                      <FontAwesome name="plus" size={14} color="#4ECDC4" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteDay(day.id, day.date)}
                      className="bg-gray-100 p-2 rounded-full"
                    >
                      <FontAwesome name="trash" size={14} color="#9CA3AF" />
                    </Pressable>
                  </View>
                </View>

                {/* Activities */}
                <Card>
                  {day.activities.length === 0 ? (
                    <Pressable
                      onPress={() => setShowAddActivity(day.id)}
                      className="py-4 items-center"
                    >
                      <Text className="text-gray-400">
                        No activities yet. Tap + to add one!
                      </Text>
                    </Pressable>
                  ) : (
                    day.activities.map((activity, actIndex) => (
                      <View key={activity.id}>
                        {actIndex > 0 && <View className="h-px bg-gray-100 my-3" />}
                        <ActivityItem
                          activity={activity}
                          onDelete={() => handleDeleteActivity(activity.id, activity.name)}
                        />
                      </View>
                    ))
                  )}
                </Card>

                {/* Add Activity Form (inline) */}
                {showAddActivity === day.id && (
                  <Animated.View entering={FadeInDown} className="mt-3">
                    <Card className="p-4">
                      <Input
                        label="Activity Name"
                        value={newActivityName}
                        onChangeText={setNewActivityName}
                        placeholder="e.g., Visit Eiffel Tower"
                      />

                      <Text className="text-charcoal font-semibold mt-4 mb-2">Category</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {(Object.keys(CATEGORY_CONFIG) as ActivityCategory[]).map((cat) => (
                          <Pressable
                            key={cat}
                            onPress={() => setNewActivityCategory(cat)}
                            className={`
                              flex-row items-center px-3 py-2 rounded-full border-2
                              ${newActivityCategory === cat
                                ? 'border-coral-500 bg-coral-50'
                                : 'border-gray-200 bg-white'
                              }
                            `}
                          >
                            <FontAwesome
                              name={CATEGORY_CONFIG[cat].icon as any}
                              size={14}
                              color={CATEGORY_CONFIG[cat].color}
                            />
                            <Text
                              className={`ml-2 capitalize ${
                                newActivityCategory === cat ? 'text-coral-500' : 'text-gray-600'
                              }`}
                            >
                              {cat}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <View className="flex-row gap-3 mt-4">
                        <View className="flex-1">
                          <Button
                            onPress={() => {
                              setShowAddActivity(null);
                              setNewActivityName('');
                            }}
                            variant="ghost"
                          >
                            Cancel
                          </Button>
                        </View>
                        <View className="flex-1">
                          <Button
                            onPress={() => handleAddActivity(day.id)}
                            disabled={!newActivityName.trim()}
                          >
                            Add
                          </Button>
                        </View>
                      </View>
                    </Card>
                  </Animated.View>
                )}
              </Animated.View>
            ))
          )}

          <View className="h-8" />
        </ScrollView>

        {/* Add Day Modal */}
        {showAddDay && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center px-6">
            <Animated.View entering={FadeInUp.springify()} className="w-full">
              <Card className="p-6">
                <Text className="text-2xl font-bold text-charcoal mb-4">Add a Day</Text>

                <DatePicker
                  label="Date"
                  value={newDate}
                  onChange={setNewDate}
                  placeholder="Select a date"
                />

                <View className="flex-row gap-3 mt-6">
                  <View className="flex-1">
                    <Button
                      onPress={() => {
                        setShowAddDay(false);
                        setNewDate(null);
                      }}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button onPress={handleAddDay} disabled={!newDate}>
                      Add Day
                    </Button>
                  </View>
                </View>
              </Card>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

function ActivityItem({
  activity,
  onDelete,
}: {
  activity: Activity;
  onDelete: () => void;
}) {
  const config = CATEGORY_CONFIG[activity.category];

  return (
    <View className="flex-row items-start">
      <View className={`${config.bg} p-2 rounded-xl mr-3`}>
        <FontAwesome name={config.icon as any} size={18} color={config.color} />
      </View>

      <View className="flex-1">
        <Text className="text-charcoal font-semibold">{activity.name}</Text>

        {activity.location_name && (
          <View className="flex-row items-center mt-1">
            <FontAwesome name="map-marker" size={12} color="#9CA3AF" />
            <Text className="text-gray-500 text-sm ml-1">{activity.location_name}</Text>
          </View>
        )}

        {(activity.start_time || activity.end_time) && (
          <View className="flex-row items-center mt-1">
            <FontAwesome name="clock-o" size={12} color="#9CA3AF" />
            <Text className="text-gray-500 text-sm ml-1">
              {formatTime(activity.start_time)}
              {activity.end_time && ` - ${formatTime(activity.end_time)}`}
            </Text>
          </View>
        )}

        {activity.description && (
          <Text className="text-gray-600 text-sm mt-1">{activity.description}</Text>
        )}
      </View>

      <Pressable onPress={onDelete} className="p-2">
        <FontAwesome name="times" size={16} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}
