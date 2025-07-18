import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage key for AsyncStorage
const STORAGE_KEY = "@playgroundpal:playgrounds";

// Basic playground interface (will be expanded in task 2)
interface Playground {
  id: string;
  name: string;
  dateAdded: Date;
  dateModified: Date;
}

// Store interface
interface PlaygroundStore {
  // State
  playgrounds: Playground[];
  loading: boolean;
  error: string | null;

  // Actions
  loadPlaygrounds: () => Promise<void>;
  addPlayground: (
    playground: Omit<Playground, "id" | "dateAdded" | "dateModified">
  ) => Promise<void>;
  updatePlayground: (id: string, updates: Partial<Playground>) => Promise<void>;
  deletePlayground: (id: string) => Promise<void>;
}

// Create the store
export const usePlaygroundStore = create<PlaygroundStore>((set, get) => ({
  // Initial state
  playgrounds: [],
  loading: false,
  error: null,

  // Actions
  loadPlaygrounds: async () => {
    set({ loading: true, error: null });
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Convert string dates back to Date objects
        const playgrounds = parsedData.map((playground: any) => ({
          ...playground,
          dateAdded: new Date(playground.dateAdded),
          dateModified: new Date(playground.dateModified),
        }));
        set({ playgrounds });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load playgrounds",
      });
    } finally {
      set({ loading: false });
    }
  },

  addPlayground: async (playground) => {
    set({ loading: true, error: null });
    try {
      const newPlayground = {
        ...playground,
        id: Date.now().toString(), // Simple ID generation
        dateAdded: new Date(),
        dateModified: new Date(),
      };

      const updatedPlaygrounds = [...get().playgrounds, newPlayground];
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedPlaygrounds)
      );
      set({ playgrounds: updatedPlaygrounds });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to add playground",
      });
    } finally {
      set({ loading: false });
    }
  },

  updatePlayground: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedPlaygrounds = get().playgrounds.map((playground) =>
        playground.id === id
          ? {
              ...playground,
              ...updates,
              dateModified: new Date(),
            }
          : playground
      );

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedPlaygrounds)
      );
      set({ playgrounds: updatedPlaygrounds });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update playground",
      });
    } finally {
      set({ loading: false });
    }
  },

  deletePlayground: async (id) => {
    set({ loading: true, error: null });
    try {
      const updatedPlaygrounds = get().playgrounds.filter(
        (playground) => playground.id !== id
      );
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedPlaygrounds)
      );
      set({ playgrounds: updatedPlaygrounds });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete playground",
      });
    } finally {
      set({ loading: false });
    }
  },
}));
