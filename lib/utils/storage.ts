import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';

// Create a cross-platform storage that works on web and native
function createStorage(): StateStorage {
  // On web, use localStorage with Promise wrapper for consistency
  if (Platform.OS === 'web') {
    return {
      getItem: async (name: string): Promise<string | null> => {
        if (typeof window === 'undefined') return null;
        try {
          return window.localStorage.getItem(name);
        } catch {
          return null;
        }
      },
      setItem: async (name: string, value: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage.setItem(name, value);
        } catch {
          // Ignore storage errors
        }
      },
      removeItem: async (name: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage.removeItem(name);
        } catch {
          // Ignore storage errors
        }
      },
    };
  }

  // On native, use AsyncStorage
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return {
    getItem: async (name: string) => {
      return AsyncStorage.getItem(name);
    },
    setItem: async (name: string, value: string) => {
      return AsyncStorage.setItem(name, value);
    },
    removeItem: async (name: string) => {
      return AsyncStorage.removeItem(name);
    },
  };
}

export const storage = createStorage();
