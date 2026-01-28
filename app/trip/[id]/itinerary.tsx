import { View, Text, Pressable, Alert, TextInput, Keyboard, Dimensions } from 'react-native';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Card, Button, Input } from '@/components/ui';
import { TripMap } from '@/components/map/TripMap';
import { useItineraryStore } from '@/lib/stores/itineraryStore';
import { useUserStore } from '@/lib/stores/userStore';
import { Activity, ActivityCategory } from '@/lib/types/database';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CATEGORY_CONFIG: Record<ActivityCategory, { icon: string; color: string; bg: string }> = {
  food: { icon: 'cutlery', color: '#FF6B6B', bg: 'bg-coral-100' },
  attraction: { icon: 'star', color: '#4ECDC4', bg: 'bg-teal-100' },
  transport: { icon: 'car', color: '#9B59B6', bg: 'bg-purple-100' },
  lodging: { icon: 'bed', color: '#3498DB', bg: 'bg-blue-100' },
  other: { icon: 'map-marker', color: '#95A5A6', bg: 'bg-gray-100' },
};

interface SearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: ActivityCategory;
}

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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showAddActivity, setShowAddActivity] = useState<string | null>(null);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCategory, setNewActivityCategory] = useState<ActivityCategory>('other');

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  useEffect(() => {
    if (id) {
      fetchItinerary(id);
    }
  }, [id]);

  // Mock search function - replace with real Mapbox/Google Places API
  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 300));

    // Mock results - replace with real API call
    const mockResults: SearchResult[] = [
      {
        id: '1',
        name: `${query} Restaurant`,
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.006,
        category: 'food',
      },
      {
        id: '2',
        name: `${query} Museum`,
        address: '456 Art Ave',
        latitude: 40.7138,
        longitude: -74.008,
        category: 'attraction',
      },
      {
        id: '3',
        name: `${query} Hotel`,
        address: '789 Stay Blvd',
        latitude: 40.7148,
        longitude: -74.01,
        category: 'lodging',
      },
    ];

    setSearchResults(mockResults);
    setIsSearching(false);
  }

  async function handleAddFromSearch(result: SearchResult, dayId: string) {
    if (!user?.id) return;

    await addActivity(
      dayId,
      {
        name: result.name,
        location_name: result.address,
        latitude: result.latitude,
        longitude: result.longitude,
        category: result.category,
      },
      user.id
    );

    setSearchQuery('');
    setSearchResults([]);
    setSelectedDayId(null);
    Keyboard.dismiss();
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Itinerary',
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

      {/* Map Background */}
      <View className="flex-1">
        <TripMap markers={mapMarkers} />

        {/* Map markers legend */}
        {mapMarkers.length > 0 && (
          <View className="absolute top-24 right-4 bg-white rounded-2xl p-3 shadow-lg">
            {Object.entries(CATEGORY_CONFIG).slice(0, 3).map(([cat, config]) => (
              <View key={cat} className="flex-row items-center mb-1 last:mb-0">
                <View
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: config.color }}
                />
                <Text className="text-xs text-gray-600 capitalize">{cat}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: '#FFF9F0', borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: '#CBD5E0', width: 40 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search Bar */}
          <View className="mb-4">
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <FontAwesome name="search" size={16} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-charcoal text-base"
                placeholder="Search places to add..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                  <FontAwesome name="times-circle" size={18} color="#9CA3AF" />
                </Pressable>
              )}
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View className="mt-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {searchResults.map((result, idx) => (
                  <View key={result.id}>
                    {idx > 0 && <View className="h-px bg-gray-100" />}
                    <Pressable
                      onPress={() => {
                        if (days.length > 0) {
                          setSelectedDayId(days[0].id);
                        }
                      }}
                      className="p-4"
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: CATEGORY_CONFIG[result.category].color + '20' }}
                        >
                          <FontAwesome
                            name={CATEGORY_CONFIG[result.category].icon as any}
                            size={14}
                            color={CATEGORY_CONFIG[result.category].color}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-charcoal font-medium">{result.name}</Text>
                          <Text className="text-gray-500 text-sm">{result.address}</Text>
                        </View>
                      </View>

                      {/* Day selector */}
                      {selectedDayId !== null && (
                        <View className="mt-3 flex-row flex-wrap gap-2">
                          {days.map((day, dayIdx) => (
                            <Pressable
                              key={day.id}
                              onPress={() => handleAddFromSearch(result, day.id)}
                              className="bg-coral-500 px-3 py-2 rounded-full"
                            >
                              <Text className="text-white text-sm font-medium">
                                Day {dayIdx + 1}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-charcoal">Itinerary</Text>
            <Text className="text-gray-500">{days.length} days</Text>
          </View>

          {/* Days List */}
          {isLoading ? (
            <View className="items-center py-16">
              <Text className="text-gray-500">Loading itinerary...</Text>
            </View>
          ) : days.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-5xl mb-4">📅</Text>
              <Text className="text-xl font-semibold text-charcoal mb-2">No days planned</Text>
              <Text className="text-gray-500 text-center mb-4">
                Set your trip dates to auto-generate{'\n'}days, or search for places above!
              </Text>
            </View>
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
                        No activities yet. Tap + or search above!
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
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
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
