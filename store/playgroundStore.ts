/**
 * Playground Store for PlayGroundPal
 *
 * Implements Zustand store for playground management with CRUD operations
 * Handles data persistence via storageService
 *
 * Requirements: 1.4, 5.3, 6.3, 10.1
 */

import { create } from "zustand";
import { nanoid } from "nanoid";
import {
  Playground,
  PlaygroundStore,
  SortOption,
  FilterOption,
  AppError,
  VALIDATION_RULES,
} from "../types/playground";
import { savePlaygrounds, loadPlaygrounds } from "../services/storageService";

/**
 * Create Zustand store for playground management
 */
export const usePlaygroundStore = create<PlaygroundStore>((set, get) => ({
  // Initial state
  playgrounds: [],
  loading: false,
  error: null,
  sortBy: "dateAdded",
  filterBy: {},

  /**
   * Add a new playground
   *
   * @param playground - Playground data without id and timestamps
   * @returns Promise that resolves when playground is added and saved
   */
  addPlayground: async (playground) => {
    try {
      set({ loading: true, error: null });

      // Validate playground data
      validatePlayground(playground);

      // Create new playground with ID and timestamps
      const now = new Date();
      const newPlayground: Playground = {
        ...playground,
        id: nanoid(),
        dateAdded: now,
        dateModified: now,
      };

      // Update state with new playground
      set((state) => ({
        playgrounds: [...state.playgrounds, newPlayground],
        loading: false,
      }));

      // Save updated playgrounds to storage
      await savePlaygrounds(get().playgrounds);
    } catch (error) {
      const appError: AppError = {
        type:
          error instanceof Error && error.name === "ValidationError"
            ? "validation"
            : "system",
        message:
          error instanceof Error ? error.message : "Failed to add playground",
        recoverable: true,
        timestamp: new Date(),
      };

      set({ error: appError, loading: false });
      throw appError;
    }
  },

  /**
   * Update an existing playground
   *
   * @param id - ID of playground to update
   * @param updates - Partial playground data to update
   * @returns Promise that resolves when playground is updated and saved
   */
  updatePlayground: async (id, updates) => {
    try {
      set({ loading: true, error: null });

      // Find playground to update
      const { playgrounds } = get();
      const playgroundIndex = playgrounds.findIndex((p) => p.id === id);

      if (playgroundIndex === -1) {
        throw new Error(`Playground with ID ${id} not found`);
      }

      // Create updated playground with new timestamp
      const updatedPlayground: Playground = {
        ...playgrounds[playgroundIndex],
        ...updates,
        dateModified: new Date(),
      };

      // Validate updated playground
      validatePlayground(updatedPlayground);

      // Update state with modified playground
      const updatedPlaygrounds = [...playgrounds];
      updatedPlaygrounds[playgroundIndex] = updatedPlayground;

      set({ playgrounds: updatedPlaygrounds, loading: false });

      // Save updated playgrounds to storage
      await savePlaygrounds(updatedPlaygrounds);
    } catch (error) {
      const appError: AppError = {
        type:
          error instanceof Error && error.name === "ValidationError"
            ? "validation"
            : "system",
        message:
          error instanceof Error
            ? error.message
            : "Failed to update playground",
        recoverable: true,
        timestamp: new Date(),
      };

      set({ error: appError, loading: false });
      throw appError;
    }
  },

  /**
   * Delete a playground
   *
   * @param id - ID of playground to delete
   * @returns Promise that resolves when playground is deleted and saved
   */
  deletePlayground: async (id) => {
    try {
      set({ loading: true, error: null });

      // Filter out playground to delete
      const { playgrounds } = get();
      const updatedPlaygrounds = playgrounds.filter((p) => p.id !== id);

      // Check if playground was found and deleted
      if (updatedPlaygrounds.length === playgrounds.length) {
        throw new Error(`Playground with ID ${id} not found`);
      }

      set({ playgrounds: updatedPlaygrounds, loading: false });

      // Save updated playgrounds to storage
      await savePlaygrounds(updatedPlaygrounds);

      // TODO: Add cleanup for orphaned photos in a future task
      // This would be implemented in task #16 (data persistence and app lifecycle handling)
    } catch (error) {
      const appError: AppError = {
        type: "system",
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete playground",
        recoverable: true,
        timestamp: new Date(),
      };

      set({ error: appError, loading: false });
      throw appError;
    }
  },

  /**
   * Load playgrounds from storage
   *
   * @returns Promise that resolves when playgrounds are loaded
   */
  loadPlaygrounds: async () => {
    try {
      set({ loading: true, error: null });

      // Load playgrounds from storage
      const playgrounds = await loadPlaygrounds();

      set({ playgrounds, loading: false });
    } catch (error) {
      const appError: AppError = {
        type: "storage",
        message:
          error instanceof Error ? error.message : "Failed to load playgrounds",
        recoverable: false,
        timestamp: new Date(),
      };

      set({ error: appError, loading: false });
      throw appError;
    }
  },

  /**
   * Set sort option for playgrounds
   *
   * @param sortBy - Sort option
   */
  setSortBy: (sortBy) => {
    set({ sortBy });
  },

  /**
   * Set filter options for playgrounds
   *
   * @param filterBy - Filter options
   */
  setFilterBy: (filterBy) => {
    set({ filterBy });
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Validate playground data
 *
 * @param playground - Playground data to validate
 * @throws Error if validation fails
 */
function validatePlayground(
  playground: Omit<Playground, "id" | "dateAdded" | "dateModified"> | Playground
): void {
  // Create validation error class
  class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ValidationError";
    }
  }

  // Validate name
  if (!playground.name || playground.name.trim() === "") {
    throw new ValidationError("Playground name is required");
  }

  if (playground.name.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
    throw new ValidationError(
      `Playground name cannot exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`
    );
  }

  // Validate location
  if (!playground.location) {
    throw new ValidationError("Playground location is required");
  }

  // Location must have either address or coordinates
  if (!playground.location.address && !playground.location.coordinates) {
    throw new ValidationError(
      "Playground location must have either address or coordinates"
    );
  }

  // If coordinates are provided, validate latitude and longitude
  if (playground.location.coordinates) {
    const { latitude, longitude } = playground.location.coordinates;

    if (typeof latitude !== "number" || isNaN(latitude)) {
      throw new ValidationError("Latitude must be a valid number");
    }

    if (typeof longitude !== "number" || isNaN(longitude)) {
      throw new ValidationError("Longitude must be a valid number");
    }

    if (latitude < -90 || latitude > 90) {
      throw new ValidationError("Latitude must be between -90 and 90");
    }

    if (longitude < -180 || longitude > 180) {
      throw new ValidationError("Longitude must be between -180 and 180");
    }
  }

  // Validate rating
  if (
    typeof playground.rating !== "number" ||
    playground.rating < VALIDATION_RULES.MIN_RATING ||
    playground.rating > VALIDATION_RULES.MAX_RATING
  ) {
    throw new ValidationError(
      `Rating must be a number between ${VALIDATION_RULES.MIN_RATING} and ${VALIDATION_RULES.MAX_RATING}`
    );
  }

  // Validate notes (if provided)
  if (
    playground.notes &&
    playground.notes.length > VALIDATION_RULES.NOTES_MAX_LENGTH
  ) {
    throw new ValidationError(
      `Notes cannot exceed ${VALIDATION_RULES.NOTES_MAX_LENGTH} characters`
    );
  }

  // Validate photos
  if (!Array.isArray(playground.photos)) {
    throw new ValidationError("Photos must be an array");
  }

  if (playground.photos.length > VALIDATION_RULES.MAX_PHOTOS) {
    throw new ValidationError(
      `Cannot have more than ${VALIDATION_RULES.MAX_PHOTOS} photos`
    );
  }
}

/**
 * Get sorted and filtered playgrounds
 *
 * @param sortBy - Sort option
 * @param filterBy - Filter options
 * @param userLocation - Optional user location for distance sorting
 * @returns Sorted and filtered playgrounds
 */
export const getSortedAndFilteredPlaygrounds = (
  playgrounds: Playground[],
  sortBy: SortOption,
  filterBy: FilterOption,
  userLocation?: { latitude: number; longitude: number }
): Playground[] => {
  // Apply filters
  let filteredPlaygrounds = [...playgrounds];

  // Filter by rating
  if (filterBy.rating && filterBy.rating.length > 0) {
    filteredPlaygrounds = filteredPlaygrounds.filter((playground) =>
      filterBy.rating!.includes(playground.rating)
    );
  }

  // Filter by photos
  if (filterBy.hasPhotos !== undefined) {
    filteredPlaygrounds = filteredPlaygrounds.filter(
      (playground) => playground.photos.length > 0 === filterBy.hasPhotos
    );
  }

  // Apply sorting
  return filteredPlaygrounds.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);

      case "rating":
        return b.rating - a.rating;

      case "dateAdded":
        return b.dateAdded.getTime() - a.dateAdded.getTime();

      case "distance":
        // If user location is provided and both playgrounds have coordinates,
        // sort by distance from user
        if (userLocation && a.location.coordinates && b.location.coordinates) {
          const distanceA = calculateDistance(
            userLocation,
            a.location.coordinates
          );
          const distanceB = calculateDistance(
            userLocation,
            b.location.coordinates
          );
          return distanceA - distanceB;
        }
        // Fall back to date sorting if distance can't be calculated
        return b.dateAdded.getTime() - a.dateAdded.getTime();

      default:
        return 0;
    }
  });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 *
 * @param point1 - First coordinate
 * @param point2 - Second coordinate
 * @returns Distance in kilometers
 */
function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 *
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
