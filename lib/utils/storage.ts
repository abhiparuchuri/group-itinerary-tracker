import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';

// Create a cross-platform storage that works on web and native
function createStorage(): StateStorage {
  // On web, use localStorage
  if (Platform.OS === 'web') {
    return {
      getItem: (name: string) => {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(name);
      },
      setItem: (name: string, value: string) => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(name, value);
      },
      removeItem: (name: string) => {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(name);
      },
    };
  }

  // On native, use AsyncStorage
  // Import dynamically to avoid SSR issues
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
