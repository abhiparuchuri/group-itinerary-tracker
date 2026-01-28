import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { User } from '../types/database';

interface UserState {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;

  // Actions
  setUser: (user: User | null) => void;
  createUser: (displayName: string) => Promise<User | null>;
  updateDisplayName: (displayName: string) => Promise<void>;
  loadUser: () => Promise<void>;
}

function generateDeviceId(): string {
  return 'device_' + Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isOnboarded: false,

      setUser: (user) => set({ user, isOnboarded: !!user }),

      createUser: async (displayName: string) => {
        const deviceId = generateDeviceId();

        const { data, error } = await supabase
          .from('users')
          .insert({
            device_id: deviceId,
            display_name: displayName,
          } as any)
          .select()
          .single();

        if (error) {
          console.error('Error creating user:', error);
          return null;
        }

        set({ user: data as User, isOnboarded: true });
        return data as User;
      },

      updateDisplayName: async (displayName: string) => {
        const { user } = get();
        if (!user) return;

        const updateData = { display_name: displayName, updated_at: new Date().toISOString() };
        const { error } = await (supabase
          .from('users') as any)
          .update(updateData)
          .eq('id', user.id);

        if (error) {
          console.error('Error updating display name:', error);
          return;
        }

        set({ user: { ...user, display_name: displayName } });
      },

      loadUser: async () => {
        set({ isLoading: true });
        const { user } = get();

        if (user?.id) {
          // Refresh user data from Supabase
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('id', user.id)
            .single();

          if (!error && data) {
            set({ user: data as User, isLoading: false });
            return;
          }
        }

        set({ isLoading: false });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isOnboarded: state.isOnboarded
      }),
    }
  )
);
