/**
 * Unit tests for Playground Store
 *
 * Tests all store actions and error handling
 */

import { renderHook, act } from "@testing-library/react-native";
import {
  usePlaygroundStore,
  getSortedAndFilteredPlaygrounds,
  clearAutoSaveTimeout,
} from "../playgroundStore";
import * as storageService from "../../services/storageService";
import { Playground } from "../../types/playground";

// Mock storage service
jest.mock("../../services/storageService");

// Mock nanoid to return predictable IDs
jest.mock("nanoid", () => ({
  nanoid: () => "test-id-123",
}));

// Helper function to reset store state
const resetStore = () => {
  const store = usePlaygroundStore;
  const initialState = {
    playgrounds: [],
    loading: false,
    error: null,
    sortBy: "dateAdded" as const,
    filterBy: {},
  };
  (store as any).setState(initialState);
};

// Sample playground data for testing
const mockPlaygrounds: Playground[] = [
  {
    id: "1",
    name: "Playground A",
    location: {
      address: "123 A St",
      coordinates: { latitude: 40.7128, longitude: -74.006 },
    },
    rating: 5,
    photos: ["photo1.jpg"],
    dateAdded: new Date("2023-01-01"),
    dateModified: new Date("2023-01-01"),
  },
  {
    id: "2",
    name: "Playground C",
    location: {
      address: "456 C St",
      coordinates: { latitude: 40.7, longitude: -74.0 },
    },
    rating: 3,
    photos: [],
    dateAdded: new Date("2023-01-03"),
    dateModified: new Date("2023-01-03"),
  },
  {
    id: "3",
    name: "Playground B",
    location: {
      address: "789 B St",
      coordinates: { latitude: 40.8, longitude: -74.1 },
    },
    rating: 4,
    photos: ["photo2.jpg", "photo3.jpg"],
    dateAdded: new Date("2023-01-02"),
    dateModified: new Date("2023-01-02"),
  },
];

describe("Playground Store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset store to initial state
    resetStore();
  });

  afterEach(() => {
    jest.useRealTimers();
    // Clean up auto-save timeout
    clearAutoSaveTimeout();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => usePlaygroundStore());

      expect(result.current.playgrounds).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.sortBy).toBe("dateAdded");
      expect(result.current.filterBy).toEqual({});
    });
  });

  describe("addPlayground", () => {
    it("should add a new playground successfully", async () => {
      const { result } = renderHook(() => usePlaygroundStore());
      const mockSavePlaygrounds =
        storageService.savePlaygrounds as jest.MockedFunction<
          typeof storageService.savePlaygrounds
        >;
      mockSavePlaygrounds.mockResolvedValue();

      const newPlayground = {
        name: "New Playground",
        location: { address: "Test Address" },
        rating: 4,
        photos: [],
      };

      await act(async () => {
        await result.current.addPlayground(newPlayground);
      });

      expect(result.current.playgrounds).toHaveLength(1);
      expect(result.current.playgrounds[0]).toMatchObject({
        name: "New Playground",
        rating: 4,
        id: "test-id-123",
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockSavePlaygrounds).toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const { result } = renderHook(() => usePlaygroundStore());

      const invalidPlayground = {
        name: "", // Invalid: empty name
        location: { address: "Test Address" },
        rating: 4,
        photos: [],
      };

      let error: Error | null = null;
      try {
        await result.current.addPlayground(invalidPlayground);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toBe("Playground name is required");
      expect(result.current.playgrounds).toHaveLength(0);
    });

    it("should handle storage errors", async () => {
      const { result } = renderHook(() => usePlaygroundStore());
      const mockSavePlaygrounds =
        storageService.savePlaygrounds as jest.MockedFunction<
          typeof storageService.savePlaygrounds
        >;
      mockSavePlaygrounds.mockRejectedValue(new Error("Storage failed"));

      const newPlayground = {
        name: "New Playground",
        location: { address: "Test Address" },
        rating: 4,
        photos: [],
      };

      let error: Error | null = null;
      try {
        await result.current.addPlayground(newPlayground);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toBe("Storage failed");
    });

    it("should validate playground data", async () => {
      const { result } = renderHook(() => usePlaygroundStore());

      const invalidPlayground = {
        name: "Test",
        location: { address: "Test Address" },
        rating: 6, // Invalid: rating > 5
        photos: [],
      };

      let error: Error | null = null;
      try {
        await result.current.addPlayground(invalidPlayground);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toBe("Rating must be a number between 1 and 5");
    });
  });

  describe("updatePlayground", () => {
    it("should update playground successfully", async () => {
      const { result } = renderHook(() => usePlaygroundStore());
      const mockSavePlaygrounds =
        storageService.savePlaygrounds as jest.MockedFunction<
          typeof storageService.savePlaygrounds
        >;
      mockSavePlaygrounds.mockResolvedValue();

      // First add a playground
      const newPlayground = {
        name: "Original Name",
        location: { address: "Test Address" },
        rating: 4,
        photos: [],
      };

      await act(async () => {
        await result.current.addPlayground(newPlayground);
      });

      const playgroundId = result.current.playgrounds[0].id;

      // Update the playground
      await act(async () => {
        await result.current.updatePlayground(playgroundId, {
          name: "Updated Name",
          rating: 5,
        });
      });

      expect(result.current.playgrounds[0].name).toBe("Updated Name");
      expect(result.current.playgrounds[0].rating).toBe(5);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should handle update of non-existent playground", async () => {
      const { result } = renderHook(() => usePlaygroundStore());

      let error: Error | null = null;
      try {
        await result.current.updatePlayground("non-existent-id", {
          name: "Updated Name",
        });
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toBe(
        "Playground with ID non-existent-id not found"
      );
    });

    it("should validate updates", async () => {
      const { result } = renderHook(() => usePlaygroundStore());

      // First add a playground
      const newPlayground = {
        name: "Original Name",
        location: { address: "Test Address" },
        rating: 4,
        photos: [],
      };

      await act(async () => {
        await result.current.addPlayground(newPlayground);
      });

      const playgroundId = result.current.playgrounds[0].id;

      // Try to update with invalid data
      let error: Error | null = null;
      try {
        await result.current.updatePlayground(playgroundId, {
          rating: 6, // Invalid rating
        });
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toBe("Rating must be a number between 1 and 5");
    });
  });

  describe("deletePlayground", () => {
    it("should delete playground successfully", async () => {
      const { result } = renderHook(() => usePlaygroundStore());
      const mockSavePlaygrounds =
        storageService.savePlaygrounds as jest.MockedFunction<
          typeof storageService.savePlaygrounds
        >;
      mockSavePlaygrounds.mockResolvedValue();

      // First add a playground
      const newPlayground = {
        name: "Test Playground",
        location: { address: "Test Address" },
        rating: 4,
        photos: [],
      };

      await act(async () => {
        await result.current.addPlayground(newPlayground);
      });

      const playgroundId = result.current.playgrounds[0].id;
      expect(result.current.playgrounds).toHaveLength(1);

      // Delete the playground
      await act(async () => {
        await result.current.deletePlayground(playgroundId);
      });

      expect(result.current.playgrounds).toHaveLength(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should handle deletion of non-existent playground", async () => {
      const { result } = renderHook(() => usePlaygroundStore());

      let error: Error | null = null;
      try {
        await result.current.deletePlayground("non-existent-id");
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toBe(
        "Playground with ID non-existent-id not found"
      );
    });
  });

  describe("loadPlaygrounds", () => {
    it("should load playgrounds successfully", async () => {
      const { result } = renderHook(() => usePlaygroundStore());
      const mockLoadPlaygrounds =
        storageService.loadPlaygrounds as jest.MockedFunction<
          typeof storageService.loadPlaygrounds
        >;
      mockLoadPlaygrounds.mockResolvedValue(mockPlaygrounds);

      await act(async () => {
        await result.current.loadPlaygrounds();
      });

      expect(result.current.playgrounds).toEqual(mockPlaygrounds);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should handle load errors", async () => {
      const { result } = renderHook(() => usePlaygroundStore());
      const mockLoadPlaygrounds =
        storageService.loadPlaygrounds as jest.MockedFunction<
          typeof storageService.loadPlaygrounds
        >;
      mockLoadPlaygrounds.mockRejectedValue(new Error("Load failed"));

      let error: Error | null = null;
      try {
        await result.current.loadPlaygrounds();
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toBe("Load failed");
    });
  });

  describe("setSortBy", () => {
    it("should update sort option", () => {
      const { result } = renderHook(() => usePlaygroundStore());

      act(() => {
        result.current.setSortBy("name");
      });

      expect(result.current.sortBy).toBe("name");
    });
  });

  describe("setFilterBy", () => {
    it("should update filter options", () => {
      const { result } = renderHook(() => usePlaygroundStore());

      act(() => {
        result.current.setFilterBy({ rating: [4, 5], hasPhotos: true });
      });

      expect(result.current.filterBy).toEqual({
        rating: [4, 5],
        hasPhotos: true,
      });
    });
  });

  describe("clearError", () => {
    it("should clear error state", async () => {
      const { result } = renderHook(() => usePlaygroundStore());

      // Set an error first by triggering a validation error
      await act(async () => {
        try {
          await result.current.addPlayground({
            name: "", // Invalid: empty name
            location: { address: "Test Address" },
            rating: 4,
            photos: [],
          });
        } catch (error) {
          // Error is expected
        }
      });

      expect(result.current.error).toBeTruthy();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe("Auto-save functionality", () => {
    it("should trigger auto-save after state changes", async () => {
      const { result } = renderHook(() => usePlaygroundStore());
      const mockSavePlaygrounds =
        storageService.savePlaygrounds as jest.MockedFunction<
          typeof storageService.savePlaygrounds
        >;
      mockSavePlaygrounds.mockResolvedValue();

      const newPlayground = {
        name: "Test Playground",
        location: { address: "Test Address" },
        rating: 4,
        photos: [],
      };

      await act(async () => {
        await result.current.addPlayground(newPlayground);
      });

      // Fast-forward time to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(2500); // More than 2 seconds
      });

      expect(mockSavePlaygrounds).toHaveBeenCalledTimes(2); // Once for add, once for auto-save
    });
  });
});

describe("Playground Store Utilities", () => {
  describe("getSortedAndFilteredPlaygrounds", () => {
    it("should sort by name", () => {
      const sorted = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "name",
        {}
      );
      expect(sorted.map((p) => p.name)).toEqual([
        "Playground A",
        "Playground B",
        "Playground C",
      ]);
    });

    it("should sort by rating", () => {
      const sorted = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "rating",
        {}
      );
      expect(sorted.map((p) => p.rating)).toEqual([5, 4, 3]);
    });

    it("should sort by dateAdded", () => {
      const sorted = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "dateAdded",
        {}
      );
      expect(sorted.map((p) => p.id)).toEqual(["2", "3", "1"]);
    });

    it("should sort by distance when user location is provided", () => {
      // User location close to Playground A
      const userLocation = { latitude: 40.713, longitude: -74.007 };

      const sorted = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "distance",
        {},
        userLocation
      );
      expect(sorted.map((p) => p.id)).toEqual(["1", "2", "3"]);
    });

    it("should filter by rating", () => {
      const filtered = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "name",
        {
          rating: [4, 5],
        }
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.map((p) => p.rating).every((r) => r >= 4)).toBe(true);
    });

    it("should filter by hasPhotos", () => {
      const filtered = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "name",
        {
          hasPhotos: true,
        }
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => p.photos.length > 0)).toBe(true);
    });

    it("should apply both sorting and filtering", () => {
      const result = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "rating",
        {
          hasPhotos: true,
        }
      );

      expect(result).toHaveLength(2);
      expect(result[0].rating).toBe(5); // Highest rating first
      expect(result.every((p) => p.photos.length > 0)).toBe(true);
    });

    it("should handle empty playgrounds array", () => {
      const result = getSortedAndFilteredPlaygrounds([], "name", {});
      expect(result).toEqual([]);
    });

    it("should handle distance sorting without user location", () => {
      const sorted = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "distance",
        {}
      );
      // Should fall back to dateAdded sorting when no user location
      expect(sorted.map((p) => p.id)).toEqual(["2", "3", "1"]);
    });

    it("should handle multiple rating filters", () => {
      const filtered = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "name",
        {
          rating: [3, 4],
        }
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.map((p) => p.rating)).toEqual([4, 3]); // B (4), C (3) when sorted by name
    });
  });
});
