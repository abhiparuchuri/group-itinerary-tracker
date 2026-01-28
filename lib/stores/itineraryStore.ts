import { create } from 'zustand';
import { supabase } from '../supabase';
import { ItineraryDay, Activity } from '../types/database';

interface DayWithActivities extends ItineraryDay {
  activities: Activity[];
}

interface ItineraryState {
  days: DayWithActivities[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchItinerary: (tripId: string) => Promise<void>;
  addDay: (tripId: string, date: string) => Promise<ItineraryDay | null>;
  updateDay: (dayId: string, notes: string) => Promise<void>;
  deleteDay: (dayId: string) => Promise<void>;
  addActivity: (dayId: string, activity: Partial<Activity>, userId: string) => Promise<Activity | null>;
  updateActivity: (activityId: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (activityId: string) => Promise<void>;
  reorderActivities: (dayId: string, activityIds: string[]) => Promise<void>;
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  days: [],
  isLoading: false,
  error: null,

  fetchItinerary: async (tripId: string) => {
    set({ isLoading: true, error: null });

    // Fetch all days for this trip
    const { data: daysData, error: daysError } = await supabase
      .from('itinerary_days')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true });

    if (daysError) {
      set({ isLoading: false, error: daysError.message });
      return;
    }

    const days = (daysData || []) as ItineraryDay[];

    if (days.length === 0) {
      set({ days: [], isLoading: false });
      return;
    }

    // Fetch activities for all days
    const dayIds = days.map((d) => d.id);
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .in('day_id', dayIds)
      .order('order_index', { ascending: true });

    if (activitiesError) {
      set({ isLoading: false, error: activitiesError.message });
      return;
    }

    const activities = (activitiesData || []) as Activity[];

    // Group activities by day
    const daysWithActivities: DayWithActivities[] = days.map((day) => ({
      ...day,
      activities: activities.filter((a) => a.day_id === day.id),
    }));

    set({ days: daysWithActivities, isLoading: false });
  },

  addDay: async (tripId: string, date: string) => {
    const { data, error } = await supabase
      .from('itinerary_days')
      .insert({ trip_id: tripId, date } as any)
      .select()
      .single();

    if (error) {
      console.error('Error adding day:', error);
      return null;
    }

    const newDay = data as ItineraryDay;
    const { days } = get();

    // Insert in sorted order
    const newDays = [...days, { ...newDay, activities: [] }].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    set({ days: newDays });
    return newDay;
  },

  updateDay: async (dayId: string, notes: string) => {
    const { error } = await (supabase.from('itinerary_days') as any)
      .update({ notes })
      .eq('id', dayId);

    if (error) {
      console.error('Error updating day:', error);
      return;
    }

    const { days } = get();
    set({
      days: days.map((d) => (d.id === dayId ? { ...d, notes } : d)),
    });
  },

  deleteDay: async (dayId: string) => {
    const { error } = await supabase
      .from('itinerary_days')
      .delete()
      .eq('id', dayId);

    if (error) {
      console.error('Error deleting day:', error);
      return;
    }

    const { days } = get();
    set({ days: days.filter((d) => d.id !== dayId) });
  },

  addActivity: async (dayId: string, activity: Partial<Activity>, userId: string) => {
    const { days } = get();
    const day = days.find((d) => d.id === dayId);
    const orderIndex = day ? day.activities.length : 0;

    const { data, error } = await supabase
      .from('activities')
      .insert({
        day_id: dayId,
        name: activity.name || 'New Activity',
        description: activity.description,
        location_name: activity.location_name,
        latitude: activity.latitude,
        longitude: activity.longitude,
        start_time: activity.start_time,
        end_time: activity.end_time,
        category: activity.category || 'other',
        order_index: orderIndex,
        created_by: userId,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error adding activity:', error);
      return null;
    }

    const newActivity = data as Activity;

    set({
      days: days.map((d) =>
        d.id === dayId
          ? { ...d, activities: [...d.activities, newActivity] }
          : d
      ),
    });

    return newActivity;
  },

  updateActivity: async (activityId: string, updates: Partial<Activity>) => {
    const { error } = await (supabase.from('activities') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', activityId);

    if (error) {
      console.error('Error updating activity:', error);
      return;
    }

    const { days } = get();
    set({
      days: days.map((d) => ({
        ...d,
        activities: d.activities.map((a) =>
          a.id === activityId ? { ...a, ...updates } : a
        ),
      })),
    });
  },

  deleteActivity: async (activityId: string) => {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) {
      console.error('Error deleting activity:', error);
      return;
    }

    const { days } = get();
    set({
      days: days.map((d) => ({
        ...d,
        activities: d.activities.filter((a) => a.id !== activityId),
      })),
    });
  },

  reorderActivities: async (dayId: string, activityIds: string[]) => {
    // Update local state immediately for responsive UI
    const { days } = get();
    const day = days.find((d) => d.id === dayId);
    if (!day) return;

    const reorderedActivities = activityIds
      .map((id, index) => {
        const activity = day.activities.find((a) => a.id === id);
        return activity ? { ...activity, order_index: index } : null;
      })
      .filter(Boolean) as Activity[];

    set({
      days: days.map((d) =>
        d.id === dayId ? { ...d, activities: reorderedActivities } : d
      ),
    });

    // Update in database
    await Promise.all(
      activityIds.map((id, index) =>
        (supabase.from('activities') as any)
          .update({ order_index: index })
          .eq('id', id)
      )
    );
  },
}));
