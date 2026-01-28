import { create } from 'zustand';
import { supabase } from '../supabase';
import { Trip, TripMember } from '../types/database';

interface TripWithMembers extends Trip {
  members?: TripMember[];
  memberCount?: number;
}

interface TripState {
  trips: TripWithMembers[];
  currentTrip: TripWithMembers | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTrips: (userId: string) => Promise<void>;
  createTrip: (name: string, userId: string) => Promise<Trip | null>;
  joinTripByCode: (code: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  setCurrentTrip: (trip: TripWithMembers | null) => void;
  refreshCurrentTrip: () => Promise<void>;
}

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,

  fetchTrips: async (userId: string) => {
    set({ isLoading: true, error: null });

    // Get all trips where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from('trip_members')
      .select('trip_id')
      .eq('user_id', userId);

    if (memberError) {
      set({ isLoading: false, error: memberError.message });
      return;
    }

    const membershipList = memberships as { trip_id: string }[] | null;
    if (!membershipList || membershipList.length === 0) {
      set({ trips: [], isLoading: false });
      return;
    }

    const tripIds = membershipList.map((m) => m.trip_id);

    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .in('id', tripIds)
      .order('updated_at', { ascending: false });

    if (tripError) {
      set({ isLoading: false, error: tripError.message });
      return;
    }

    const tripsList = (trips || []) as Trip[];

    // Get member counts for each trip
    const tripsWithCounts: TripWithMembers[] = await Promise.all(
      tripsList.map(async (trip) => {
        const { count } = await supabase
          .from('trip_members')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', trip.id);

        return { ...trip, memberCount: count || 0 };
      })
    );

    set({ trips: tripsWithCounts, isLoading: false });
  },

  createTrip: async (name: string, userId: string) => {
    set({ isLoading: true, error: null });

    // Create the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        name,
        created_by: userId,
        join_code: generateJoinCode(),
      } as any)
      .select()
      .single();

    const tripData = trip as Trip | null;

    if (tripError || !tripData) {
      set({ isLoading: false, error: tripError?.message || 'Failed to create trip' });
      return null;
    }

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('trip_members')
      .insert({
        trip_id: tripData.id,
        user_id: userId,
        role: 'owner',
      } as any);

    if (memberError) {
      set({ isLoading: false, error: memberError.message });
      return null;
    }

    // Refresh trips list
    await get().fetchTrips(userId);

    return tripData;
  },

  joinTripByCode: async (code: string, userId: string) => {
    set({ isLoading: true, error: null });

    const normalizedCode = code.toUpperCase().trim();

    // Find trip by code
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('join_code', normalizedCode)
      .single();

    const tripData = trip as Trip | null;

    if (tripError || !tripData) {
      set({ isLoading: false });
      return { success: false, error: 'Trip not found. Check the code and try again.' };
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripData.id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      set({ isLoading: false });
      return { success: false, error: "You're already a member of this trip!" };
    }

    // Join the trip
    const { error: joinError } = await supabase
      .from('trip_members')
      .insert({
        trip_id: tripData.id,
        user_id: userId,
        role: 'editor',
      } as any);

    if (joinError) {
      set({ isLoading: false });
      return { success: false, error: 'Failed to join trip. Please try again.' };
    }

    // Refresh trips list
    await get().fetchTrips(userId);

    return { success: true };
  },

  setCurrentTrip: (trip) => {
    set({ currentTrip: trip });
  },

  refreshCurrentTrip: async () => {
    const { currentTrip } = get();
    if (!currentTrip) return;

    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', currentTrip.id)
      .single();

    const tripData = trip as Trip | null;

    if (!error && tripData) {
      set({ currentTrip: { ...currentTrip, ...tripData } });
    }
  },
}));
