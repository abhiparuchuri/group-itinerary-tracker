export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          device_id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          cover_image: string | null;
          start_date: string | null;
          end_date: string | null;
          join_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          cover_image?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          join_code?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          cover_image?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          join_code?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          joined_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          role?: 'owner' | 'editor' | 'viewer';
          joined_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          user_id?: string;
          role?: 'owner' | 'editor' | 'viewer';
          joined_at?: string;
        };
      };
      itinerary_days: {
        Row: {
          id: string;
          trip_id: string;
          date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          date?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          day_id: string;
          name: string;
          description: string | null;
          location_name: string | null;
          latitude: number | null;
          longitude: number | null;
          start_time: string | null;
          end_time: string | null;
          category: 'food' | 'attraction' | 'transport' | 'lodging' | 'other';
          order_index: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          day_id: string;
          name: string;
          description?: string | null;
          location_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          category?: 'food' | 'attraction' | 'transport' | 'lodging' | 'other';
          order_index?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          day_id?: string;
          name?: string;
          description?: string | null;
          location_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          category?: 'food' | 'attraction' | 'transport' | 'lodging' | 'other';
          order_index?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          activity_id: string | null;
          description: string;
          amount: number;
          currency: string;
          paid_by: string;
          split_type: 'equal' | 'custom' | 'full';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          activity_id?: string | null;
          description: string;
          amount: number;
          currency?: string;
          paid_by: string;
          split_type?: 'equal' | 'custom' | 'full';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          activity_id?: string | null;
          description?: string;
          amount?: number;
          currency?: string;
          paid_by?: string;
          split_type?: 'equal' | 'custom' | 'full';
          created_at?: string;
          updated_at?: string;
        };
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          amount: number;
          is_settled: boolean;
          settled_at: string | null;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          amount: number;
          is_settled?: boolean;
          settled_at?: string | null;
        };
        Update: {
          id?: string;
          expense_id?: string;
          user_id?: string;
          amount?: number;
          is_settled?: boolean;
          settled_at?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row'];
export type Trip = Database['public']['Tables']['trips']['Row'];
export type TripMember = Database['public']['Tables']['trip_members']['Row'];
export type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
export type Activity = Database['public']['Tables']['activities']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type ExpenseSplit = Database['public']['Tables']['expense_splits']['Row'];

export type ActivityCategory = Activity['category'];
export type MemberRole = TripMember['role'];
export type SplitType = Expense['split_type'];
