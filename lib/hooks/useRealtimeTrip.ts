import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useItineraryStore } from '../stores/itineraryStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useTripStore } from '../stores/tripStore';

type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any>;
  old: Record<string, any>;
};

export function useRealtimeTrip(tripId: string | undefined) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchItinerary = useItineraryStore((state) => state.fetchItinerary);
  const fetchExpenses = useExpenseStore((state) => state.fetchExpenses);
  const refreshCurrentTrip = useTripStore((state) => state.refreshCurrentTrip);

  useEffect(() => {
    if (!tripId) return;

    // Create a channel for this trip
    const channel = supabase.channel(`trip:${tripId}`);

    // Subscribe to itinerary_days changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'itinerary_days',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload: RealtimePayload) => {
        console.log('Itinerary days changed:', payload.eventType);
        fetchItinerary(tripId);
      }
    );

    // Subscribe to activities changes (need to join through days)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'activities',
      },
      (payload: RealtimePayload) => {
        console.log('Activities changed:', payload.eventType);
        // Refresh itinerary when activities change
        fetchItinerary(tripId);
      }
    );

    // Subscribe to expenses changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload: RealtimePayload) => {
        console.log('Expenses changed:', payload.eventType);
        fetchExpenses(tripId);
      }
    );

    // Subscribe to expense_splits changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expense_splits',
      },
      (payload: RealtimePayload) => {
        console.log('Expense splits changed:', payload.eventType);
        fetchExpenses(tripId);
      }
    );

    // Subscribe to trip_members changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trip_members',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload: RealtimePayload) => {
        console.log('Trip members changed:', payload.eventType);
        refreshCurrentTrip();
      }
    );

    // Subscribe to trip updates
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'trips',
        filter: `id=eq.${tripId}`,
      },
      (payload: RealtimePayload) => {
        console.log('Trip updated:', payload.eventType);
        refreshCurrentTrip();
      }
    );

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`Realtime subscription status: ${status}`);
    });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tripId, fetchItinerary, fetchExpenses, refreshCurrentTrip]);
}
