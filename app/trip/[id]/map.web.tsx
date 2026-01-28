'use client';

import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Card } from '@/components/ui/Card.web';
import { supabase } from '@/lib/supabase';
import { Trip } from '@/lib/types/database';
import { useItineraryStore } from '@/lib/stores/itineraryStore';
import { cn } from '@/lib/utils/cn';

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
    <div className="min-h-screen bg-[#FFF9F0]">
      {/* Back button */}
      <div className="sticky top-0 bg-[#FFF9F0]/80 backdrop-blur-sm z-10 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-[#2C3E50] transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-bold text-[#2C3E50]">Map</h1>
          {trip && (
            <p className="text-gray-500 mt-1">{trip.name}</p>
          )}
        </div>

        {/* Map Placeholder */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Card className="p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-[#e6fffa] to-[#b2f5ea] h-64 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <span className="text-4xl">🗺️</span>
              </div>
              <h2 className="text-xl font-bold text-[#2C3E50]">Map Coming Soon</h2>
              <p className="text-[#319795] mt-2 text-center px-8">
                Interactive map with all your trip locations will be available here
              </p>
            </div>
          </Card>
        </div>

        {/* Location List */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">
            Places ({activitiesWithLocation.length})
          </h3>

          {activitiesWithLocation.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center py-8">
                <span className="text-4xl mb-3">📍</span>
                <p className="text-gray-500 text-center">
                  No locations added yet.<br />
                  Add locations to your activities to see them here!
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {activitiesWithLocation.map((activity) => (
                <Card key={activity.id}>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: CATEGORY_COLORS[activity.category] || '#95A5A6' }}
                    />
                    <div className="flex-1">
                      <p className="text-[#2C3E50] font-medium">{activity.name}</p>
                      {activity.location_name && (
                        <p className="text-gray-500 text-sm">{activity.location_name}</p>
                      )}
                    </div>
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">Legend</h3>
          <Card>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                <div key={category} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-gray-600 capitalize text-sm">{category}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
