import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Playground,
  PlaygroundStore,
  AppError,
  SortOption,
  FilterOption,
  STORAGE_KEYS,
} from "../types/playground";

// Helper function to create AppError
const createAppError = (
  type: AppError["type"],
  message: string,
  recoverable: boolean = true
): AppError => ({
  type,
  message,
  recoverable,
  timestamp: new Date(),
});

// Create the store
export const usePlaygroundStore = create<PlaygroundStore>((set, get) => ({
  // Initial state
  playgrounds: [],
  loading: false,
  error: null,
  sortBy: "dateAdded",
  filterBy: {},

  // Actions
  loadPlaygrounds: async () => {
    set({ loading: true, error: null });
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.PLAYGROUNDS);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Convert string dates back to Date objects
        const playgrounds = parsedData.map((playground: any) => ({
          ...playground,
          dateAdded: new Date(playground.dateAdded),
          dateModified: new Date(playground.dateModified),
          location: {
            ...playground.location,
            timestamp: playground.location.timestamp
              ? new Date(playground.location.timestamp)
              : undefined,
          },
        }));
        set({ playgrounds });
      }
    } catch (error) {
      const appError = createAppError(
        "storage",
        error instanceof Error ? error.message : "Failed to load playgrounds",
        true
      );
      set({ error: appError });
    } finally {
      set({ loading: false });
    }
  },

  addPlayground: async (playground) => {
    set({ loading: true, error: null });
    try {
      // Validate required fields
      if (!playground.name.trim()) {
        throw new Error("Playground name is required");
      }
      if (playground.rating < 1 || playground.rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      const newPlayground: Playground = {
        ...playground,
        id: `playground_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        dateAdded: new Date(),
        dateModified: new Date(),
      };

      const updatedPlaygrounds = [...get().playgrounds, newPlayground];
      await AsyncStorage.setItem(
        STORAGE_KEYS.PLAYGROUNDS,
        JSON.stringify(updatedPlaygrounds)
      );
      set({ playgrounds: updatedPlaygrounds });
    } catch (error) {
      const appError = createAppError(
        "validation",
        error instanceof Error ? error.message : "Failed to add playground",
        true
      );
      set({ error: appError });
    } finally {
      set({ loading: false });
    }
  },

  updatePlayground: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      // Validate updates if they include rating
      if (
        updates.rating !== undefined &&
        (updates.rating < 1 || updates.rating > 5)
      ) {
        throw new Error("Rating must be between 1 and 5");
      }

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
        STORAGE_KEYS.PLAYGROUNDS,
        JSON.stringify(updatedPlaygrounds)
      );
      set({ playgrounds: updatedPlaygrounds });
    } catch (error) {
      const appError = createAppError(
        "validation",
        error instanceof Error ? error.message : "Failed to update playground",
        true
      );
      set({ error: appError });
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
        STORAGE_KEYS.PLAYGROUNDS,
        JSON.stringify(updatedPlaygrounds)
      );
      set({ playgrounds: updatedPlaygrounds });
    } catch (error) {
      const appError = createAppError(
        "storage",
        error instanceof Error ? error.message : "Failed to delete playground",
        true
      );
      set({ error: appError });
    } finally {
      set({ loading: false });
    }
  },

  setSortBy: (sortBy: SortOption) => {
    set({ sortBy });
  },

  setFilterBy: (filterBy: FilterOption) => {
    set({ filterBy });
  },

  clearError: () => {
    set({ error: null });
  },
}));
