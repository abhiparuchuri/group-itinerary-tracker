import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { searchCities, City } from '@/lib/mapbox';

interface CitySearchProps {
  value: City | null;
  onSelect: (city: City) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export function CitySearch({
  value,
  onSelect,
  placeholder = 'Search for a city...',
  label,
  error,
}: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    searchTimeout.current = setTimeout(async () => {
      const cities = await searchCities(query);
      setResults(cities);
      setIsLoading(false);
      setShowResults(true);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  function handleSelect(city: City) {
    onSelect(city);
    setQuery('');
    setResults([]);
    setShowResults(false);
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setShowResults(false);
  }

  return (
    <View>
      {label && (
        <Text className="text-charcoal font-semibold mb-2">{label}</Text>
      )}

      {/* Selected city display or search input */}
      {value ? (
        <Pressable
          onPress={() => onSelect(null as any)}
          className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-4 flex-row items-center"
        >
          <View className="bg-teal-500 w-10 h-10 rounded-full items-center justify-center mr-3">
            <FontAwesome name="map-marker" size={18} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-charcoal font-semibold text-lg">{value.name}</Text>
            <Text className="text-teal-600 text-sm">
              {value.state ? `${value.state}, ${value.country}` : value.country}
            </Text>
          </View>
          <FontAwesome name="times-circle" size={20} color="#4ECDC4" />
        </Pressable>
      ) : (
        <View>
          <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 border-2 border-transparent focus:border-coral-500">
            <FontAwesome name="search" size={16} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-charcoal text-base"
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              onFocus={() => query.length >= 2 && setShowResults(true)}
              autoCapitalize="words"
            />
            {isLoading && <ActivityIndicator size="small" color="#FF6B6B" />}
            {query.length > 0 && !isLoading && (
              <Pressable onPress={handleClear}>
                <FontAwesome name="times-circle" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          {/* Search Results */}
          {showResults && results.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(100)}
              className="mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {results.map((city, index) => (
                <Pressable
                  key={city.id}
                  onPress={() => handleSelect(city)}
                  className="p-4 active:bg-gray-50"
                >
                  {index > 0 && <View className="absolute top-0 left-4 right-4 h-px bg-gray-100" />}
                  <View className="flex-row items-center">
                    <View className="bg-coral-100 w-10 h-10 rounded-full items-center justify-center mr-3">
                      <FontAwesome name="building" size={16} color="#FF6B6B" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-charcoal font-medium">{city.name}</Text>
                      <Text className="text-gray-500 text-sm">
                        {city.state ? `${city.state}, ${city.country}` : city.country}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* No results message */}
          {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
            <Animated.View
              entering={FadeIn.duration(150)}
              className="mt-2 bg-gray-50 rounded-2xl p-4"
            >
              <Text className="text-gray-500 text-center">
                No cities found. Try a different search.
              </Text>
            </Animated.View>
          )}
        </View>
      )}

      {error && (
        <Text className="text-red-500 text-sm mt-2">{error}</Text>
      )}
    </View>
  );
}

export default CitySearch;
