'use client';

import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Card } from '@/components/ui/Card.web';
import { Avatar } from '@/components/ui/Avatar.web';
import { ChevronLeftIcon, ShareIcon, CalendarIcon, MapPinIcon, DollarIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { Trip, User, TripMember } from '@/lib/types/database';
import { useTripStore } from '@/lib/stores/tripStore';
import { useRealtimeTrip } from '@/lib/hooks/useRealtimeTrip';
import { formatDateFull } from '@/lib/utils/formatters';

interface MemberWithUser extends TripMember {
  user: User;
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);

  useRealtimeTrip(id);

  useEffect(() => {
    if (id) {
      fetchTripDetails();
    }
  }, [id]);

  async function fetchTripDetails() {
    setIsLoading(true);

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

    const { data: memberData, error: memberError } = await supabase
      .from('trip_members')
      .select(`*, user:users(*)`)
      .eq('trip_id', id);

    if (!memberError && memberData) {
      setMembers(memberData as MemberWithUser[]);
    }

    setIsLoading(false);
  }

  async function handleShareCode() {
    if (!trip) return;

    try {
      await navigator.clipboard.writeText(trip.join_code);
      alert(`Code "${trip.join_code}" copied to clipboard!`);
    } catch (error) {
      console.error('Error copying:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B]" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-gray-500 text-lg">Trip not found</p>
        <button onClick={() => router.back()} className="mt-4 text-[#FF6B6B] hover:underline">
          Go back
        </button>
      </div>
    );
  }

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
        {/* Trip Header */}
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-bold text-[#2C3E50]">{trip.name}</h1>
          {trip.description && <p className="text-gray-600 mt-2">{trip.description}</p>}
        </div>

        {/* Join Code Card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="bg-gradient-to-r from-[#FF6B6B] to-[#fa5252] rounded-3xl p-6 shadow-lg shadow-[#FF6B6B]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Share this code</p>
                <p className="text-white text-3xl font-bold tracking-wider mt-1">{trip.join_code}</p>
              </div>
              <button
                onClick={handleShareCode}
                className="bg-white/20 hover:bg-white/30 p-4 rounded-full transition-colors"
              >
                <ShareIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">Dates</h3>
          <Card>
            <div className="flex">
              <div className="flex-1">
                <p className="text-gray-500 text-sm">Start Date</p>
                <p className="text-[#2C3E50] font-medium mt-1">{formatDateFull(trip.start_date)}</p>
              </div>
              <div className="w-px bg-gray-200 mx-4" />
              <div className="flex-1">
                <p className="text-gray-500 text-sm">End Date</p>
                <p className="text-[#2C3E50] font-medium mt-1">{formatDateFull(trip.end_date)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Members */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">Travelers ({members.length})</h3>
          <Card className="divide-y divide-gray-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center py-3 first:pt-0 last:pb-0">
                <Avatar name={member.user.display_name} size="md" />
                <div className="ml-3 flex-1">
                  <p className="text-[#2C3E50] font-medium">{member.user.display_name}</p>
                  <p className="text-gray-500 text-sm capitalize">{member.role}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">Quick Actions</h3>

          <div className="grid grid-cols-3 gap-3">
            <Card
              onPress={() => router.push(`/trip/${id}/itinerary`)}
              className="p-6 flex flex-col items-center hover:shadow-md"
            >
              <div className="bg-[#e6fffa] p-3 rounded-full mb-2">
                <CalendarIcon className="w-6 h-6 text-[#4ECDC4]" />
              </div>
              <span className="text-[#2C3E50] font-medium text-sm">Itinerary</span>
            </Card>

            <Card
              onPress={() => router.push(`/trip/${id}/map`)}
              className="p-6 flex flex-col items-center hover:shadow-md"
            >
              <div className="bg-[#fffef0] p-3 rounded-full mb-2">
                <MapPinIcon className="w-6 h-6 text-[#FFE66D]" />
              </div>
              <span className="text-[#2C3E50] font-medium text-sm">Map</span>
            </Card>

            <Card
              onPress={() => router.push(`/trip/${id}/expenses`)}
              className="p-6 flex flex-col items-center hover:shadow-md"
            >
              <div className="bg-[#fff5f5] p-3 rounded-full mb-2">
                <DollarIcon className="w-6 h-6 text-[#FF6B6B]" />
              </div>
              <span className="text-[#2C3E50] font-medium text-sm">Expenses</span>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
