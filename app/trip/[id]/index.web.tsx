'use client';

import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Card } from '@/components/ui/Card.web';
import { supabase } from '@/lib/supabase';
import { Trip, User, TripMember } from '@/lib/types/database';
import { useTripStore } from '@/lib/stores/tripStore';
import { useRealtimeTrip } from '@/lib/hooks/useRealtimeTrip';
import { cn } from '@/lib/utils/cn';

interface MemberWithUser extends TripMember {
  user: User;
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const colors = [
    'bg-[#FF6B6B]',
    'bg-[#4ECDC4]',
    'bg-[#FFE66D]',
    'bg-[#95E1D3]',
    'bg-[#F38181]',
  ];

  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-bold',
        sizeClasses[size],
        colors[colorIndex]
      )}
    >
      {initials}
    </div>
  );
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
      await navigator.clipboard.writeText(trip.join_code);
      // Could show a toast here
      alert(`Code "${trip.join_code}" copied to clipboard!`);
    } catch (error) {
      console.error('Error copying:', error);
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
      <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B]"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-gray-500 text-lg">Trip not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-[#FF6B6B] hover:underline"
        >
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
          {trip.description && (
            <p className="text-gray-600 mt-2">{trip.description}</p>
          )}
        </div>

        {/* Join Code Card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="bg-gradient-to-r from-[#FF6B6B] to-[#fa5252] rounded-3xl p-6 shadow-lg shadow-[#FF6B6B]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Share this code</p>
                <p className="text-white text-3xl font-bold tracking-wider mt-1">
                  {trip.join_code}
                </p>
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
                <p className="text-[#2C3E50] font-medium mt-1">
                  {formatDate(trip.start_date)}
                </p>
              </div>
              <div className="w-px bg-gray-200 mx-4" />
              <div className="flex-1">
                <p className="text-gray-500 text-sm">End Date</p>
                <p className="text-[#2C3E50] font-medium mt-1">
                  {formatDate(trip.end_date)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Members */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">
            Travelers ({members.length})
          </h3>
          <Card className="divide-y divide-gray-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center py-3 first:pt-0 last:pb-0">
                <Avatar name={member.user.display_name} size="md" />
                <div className="ml-3 flex-1">
                  <p className="text-[#2C3E50] font-medium">
                    {member.user.display_name}
                  </p>
                  <p className="text-gray-500 text-sm capitalize">
                    {member.role}
                  </p>
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

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
