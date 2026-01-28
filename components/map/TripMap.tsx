import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityCategory } from '@/lib/types/database';

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  food: '#FF6B6B',
  attraction: '#4ECDC4',
  transport: '#9B59B6',
  lodging: '#3498DB',
  other: '#95A5A6',
};

interface MarkerData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: ActivityCategory;
}

interface TripMapProps {
  markers?: MarkerData[];
  onMarkerPress?: (marker: MarkerData) => void;
  initialRegion?: {
    latitude: number;
    longitude: number;
    zoomLevel?: number;
  };
  style?: object;
}

export function TripMap({
  markers = [],
  onMarkerPress,
  initialRegion,
  style,
}: TripMapProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.placeholderIcon}>
        <Text style={styles.placeholderEmoji}>🗺️</Text>
      </View>
      <Text style={styles.placeholderTitle}>Trip Map</Text>
      <Text style={styles.placeholderSubtitle}>
        {markers.length > 0
          ? `${markers.length} place${markers.length !== 1 ? 's' : ''} to explore`
          : 'Add activities with locations to see them here'
        }
      </Text>

      {/* Show marker list */}
      {markers.length > 0 && (
        <View style={styles.markerList}>
          {markers.slice(0, 5).map((marker, index) => (
            <View key={marker.id} style={styles.markerItem}>
              <View
                style={[
                  styles.markerDot,
                  { backgroundColor: CATEGORY_COLORS[marker.category] }
                ]}
              />
              <Text style={styles.markerName} numberOfLines={1}>
                {marker.name}
              </Text>
            </View>
          ))}
          {markers.length > 5 && (
            <Text style={styles.moreText}>+{markers.length - 5} more</Text>
          )}
        </View>
      )}

      <View style={styles.devBuildNote}>
        <FontAwesome name="info-circle" size={12} color="#4ECDC4" />
        <Text style={styles.devBuildText}>
          Interactive map requires development build
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  markerList: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    maxWidth: 280,
  },
  markerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  markerName: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  moreText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  devBuildNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderRadius: 16,
    gap: 6,
  },
  devBuildText: {
    fontSize: 12,
    color: '#4ECDC4',
  },
});

export default TripMap;
