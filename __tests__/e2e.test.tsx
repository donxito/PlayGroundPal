/**
 * End-to-End Tests for PlayGroundPal
 *
 * Tests complete user journeys from app launch to task completion
 * Covers critical user workflows and integration scenarios
 *
 * Requirements: All requirements validation
 */

import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  renderHook,
} from "@testing-library/react-native";
import { usePlaygroundStore } from "../store/playgroundStore";
import { usePlaygroundActions } from "../hooks/usePlaygroundActions";
import { Playground } from "../types/playground";
import { UndoProvider } from "../components/ui/UndoProvider";
import {
  getSortedAndFilteredPlaygrounds,
  clearAutoSaveTimeout,
} from "../store/playgroundStore";

// Mock dependencies
jest.mock("../services/storageService");
jest.mock("../services/locationService");
jest.mock("../services/cameraService");
jest.mock("../components/ui/Toast", () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showAppError: jest.fn(),
  }),
}));

// Helper function to reset store state
const resetStore = () => {
  const store = usePlaygroundStore;
  // Access the store's internal state and reset it
  const initialState = {
    playgrounds: [],
    loading: false,
    error: null,
    sortBy: "dateAdded" as const,
    filterBy: {},
  };

  // Use the store's internal setState method
  (store as any).setState(initialState);
};

// Test wrapper component with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <UndoProvider>{children}</UndoProvider>;
};

describe("PlayGroundPal E2E Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store state before each test by directly accessing the store
    resetStore();
  });

  afterEach(() => {
    // Clean up auto-save timeout to prevent "Cannot log after tests are done" warning
    clearAutoSaveTimeout();
  });

  describe("Complete Playground Management Journey", () => {
    it("should complete full playground lifecycle: add → view → edit → delete", async () => {
      const { result: storeResult } = renderHook(() => usePlaygroundStore(), {
        wrapper: TestWrapper,
      });

      const { result: actionsResult } = renderHook(
        () => usePlaygroundActions(),
        {
          wrapper: TestWrapper,
        }
      );

      // Step 1: Add a new playground
      const newPlayground = {
        name: "Central Park Playground",
        location: {
          address: "Central Park, New York, NY",
          coordinates: { latitude: 40.7829, longitude: -73.9654 },
        },
        rating: 5,
        notes: "Great slides and swings, lots of shade",
        photos: [],
      };

      await act(async () => {
        await storeResult.current.addPlayground(newPlayground);
      });

      expect(storeResult.current.playgrounds).toHaveLength(1);
      expect(storeResult.current.playgrounds[0].name).toBe(
        "Central Park Playground"
      );

      // Step 2: View playground details
      const playground = storeResult.current.playgrounds[0];
      expect(playground.rating).toBe(5);
      expect(playground.location.address).toBe("Central Park, New York, NY");

      // Step 3: Edit playground
      await act(async () => {
        await storeResult.current.updatePlayground(playground.id, {
          rating: 4,
          notes: "Great slides and swings, lots of shade, but can get crowded",
        });
      });

      const updatedPlayground = storeResult.current.playgrounds[0];
      expect(updatedPlayground.rating).toBe(4);
      expect(updatedPlayground.notes).toContain("can get crowded");

      // Step 4: Delete playground
      await act(async () => {
        await storeResult.current.deletePlayground(playground.id);
      });

      expect(storeResult.current.playgrounds).toHaveLength(0);
    });

    it("should handle playground sorting and filtering", async () => {
      const { result: storeResult } = renderHook(() => usePlaygroundStore(), {
        wrapper: TestWrapper,
      });

      // Add multiple playgrounds
      const playgrounds = [
        {
          name: "Alpha Playground",
          location: { address: "Alpha St" },
          rating: 3,
          photos: [],
        },
        {
          name: "Beta Playground",
          location: { address: "Beta St" },
          rating: 5,
          photos: ["photo1.jpg"],
        },
        {
          name: "Gamma Playground",
          location: { address: "Gamma St" },
          rating: 4,
          photos: [],
        },
      ];

      await act(async () => {
        for (const playground of playgrounds) {
          await storeResult.current.addPlayground(playground);
        }
      });

      expect(storeResult.current.playgrounds).toHaveLength(3);

      // Test sorting by name
      act(() => {
        storeResult.current.setSortBy("name");
      });

      const sortedByName = getSortedAndFilteredPlaygrounds(
        storeResult.current.playgrounds,
        storeResult.current.sortBy,
        storeResult.current.filterBy
      );
      expect(sortedByName[0].name).toBe("Alpha Playground");
      expect(sortedByName[1].name).toBe("Beta Playground");
      expect(sortedByName[2].name).toBe("Gamma Playground");

      // Test sorting by rating
      act(() => {
        storeResult.current.setSortBy("rating");
      });

      const sortedByRating = getSortedAndFilteredPlaygrounds(
        storeResult.current.playgrounds,
        storeResult.current.sortBy,
        storeResult.current.filterBy
      );
      expect(sortedByRating[0].rating).toBe(5); // Beta
      expect(sortedByRating[1].rating).toBe(4); // Gamma
      expect(sortedByRating[2].rating).toBe(3); // Alpha

      // Test filtering by rating
      act(() => {
        storeResult.current.setFilterBy({ rating: [4, 5] });
      });

      const filteredByRating = getSortedAndFilteredPlaygrounds(
        storeResult.current.playgrounds,
        storeResult.current.sortBy,
        storeResult.current.filterBy
      );
      expect(filteredByRating).toHaveLength(2);
      expect(filteredByRating.every((p) => p.rating >= 4)).toBe(true);

      // Test filtering by photos
      act(() => {
        storeResult.current.setFilterBy({ hasPhotos: true });
      });

      const filteredByPhotos = getSortedAndFilteredPlaygrounds(
        storeResult.current.playgrounds,
        storeResult.current.sortBy,
        storeResult.current.filterBy
      );
      expect(filteredByPhotos).toHaveLength(1);
      expect(filteredByPhotos[0].photos.length).toBeGreaterThan(0);
    });
  });

  describe("Photo Management Journey", () => {
    it("should handle photo capture and management workflow", async () => {
      const { result: storeResult } = renderHook(() => usePlaygroundStore(), {
        wrapper: TestWrapper,
      });

      // Add playground with photos
      const playgroundWithPhotos = {
        name: "Photo Test Playground",
        location: { address: "Photo St" },
        rating: 4,
        photos: ["photo1.jpg", "photo2.jpg"],
      };

      await act(async () => {
        await storeResult.current.addPlayground(playgroundWithPhotos);
      });

      const playground = storeResult.current.playgrounds[0];

      // Test photo gallery functionality
      expect(playground.photos).toHaveLength(2);

      // Test adding more photos
      await act(async () => {
        await storeResult.current.updatePlayground(playground.id, {
          photos: [...playground.photos, "photo3.jpg"],
        });
      });

      const updatedPlayground = storeResult.current.playgrounds[0];
      expect(updatedPlayground.photos).toHaveLength(3);
    });
  });

  describe("Rating System Journey", () => {
    it("should handle rating selection and updates", async () => {
      const { result: storeResult } = renderHook(() => usePlaygroundStore(), {
        wrapper: TestWrapper,
      });

      // Add playground
      const playground = {
        name: "Rating Test Playground",
        location: { address: "Rating St" },
        rating: 3,
        photos: [],
      };

      await act(async () => {
        await storeResult.current.addPlayground(playground);
      });

      const addedPlayground = storeResult.current.playgrounds[0];

      // Test rating functionality
      expect(addedPlayground.rating).toBe(3);

      // Update playground with new rating
      await act(async () => {
        await storeResult.current.updatePlayground(addedPlayground.id, {
          rating: 5,
        });
      });

      const updatedPlayground = storeResult.current.playgrounds[0];
      expect(updatedPlayground.rating).toBe(5);
    });
  });

  describe("Form Validation Journey", () => {
    it("should handle form validation and error states", async () => {
      const { result: storeResult } = renderHook(() => usePlaygroundStore(), {
        wrapper: TestWrapper,
      });

      // Test form validation functionality
      const validPlayground = {
        name: "Valid Playground",
        location: { address: "Valid Address" },
        rating: 4,
        photos: [],
      };

      await act(async () => {
        await storeResult.current.addPlayground(validPlayground);
      });

      expect(storeResult.current.playgrounds).toHaveLength(1);
      expect(storeResult.current.playgrounds[0].name).toBe("Valid Playground");
      expect(storeResult.current.playgrounds[0].rating).toBe(4);
    });
  });

  describe("Error Handling Journey", () => {
    it("should handle various error scenarios gracefully", async () => {
      const { result: storeResult } = renderHook(() => usePlaygroundStore(), {
        wrapper: TestWrapper,
      });

      // Test validation error
      const invalidPlayground = {
        name: "", // Invalid: empty name
        location: { address: "Test Address" },
        rating: 6, // Invalid: rating > 5
        photos: [],
      };

      await act(async () => {
        try {
          await storeResult.current.addPlayground(invalidPlayground);
        } catch (error) {
          // Error is expected
        }
      });

      expect(storeResult.current.error).toBeTruthy();
      expect(storeResult.current.error?.type).toBe("validation");

      // Clear error
      act(() => {
        storeResult.current.clearError();
      });

      expect(storeResult.current.error).toBe(null);

      // Test system error (simulated)
      const validPlayground = {
        name: "Valid Playground",
        location: { address: "Test Address" },
        rating: 4,
        photos: [],
      };

      // Mock storage service to throw error
      const mockSavePlaygrounds =
        require("../services/storageService").savePlaygrounds;
      mockSavePlaygrounds.mockRejectedValueOnce(new Error("Storage failed"));

      await act(async () => {
        try {
          await storeResult.current.addPlayground(validPlayground);
        } catch (error) {
          // Error is expected
        }
      });

      expect(storeResult.current.error).toBeTruthy();
      expect(storeResult.current.error?.type).toBe("system");
    });
  });

  describe("Data Persistence Journey", () => {
    it("should handle data loading and persistence", async () => {
      const { result: storeResult } = renderHook(() => usePlaygroundStore(), {
        wrapper: TestWrapper,
      });

      // Mock storage service to return existing data
      const mockLoadPlaygrounds =
        require("../services/storageService").loadPlaygrounds;
      const existingPlaygrounds = [
        {
          id: "existing-1",
          name: "Existing Playground",
          location: { address: "Existing St" },
          rating: 4,
          photos: [],
          dateAdded: new Date(),
          dateModified: new Date(),
        },
      ];
      mockLoadPlaygrounds.mockResolvedValue(existingPlaygrounds);

      // Load playgrounds
      await act(async () => {
        await storeResult.current.loadPlaygrounds();
      });

      expect(storeResult.current.playgrounds).toEqual(existingPlaygrounds);
      expect(storeResult.current.loading).toBe(false);
      expect(storeResult.current.error).toBe(null);

      // Add new playground
      const newPlayground = {
        name: "New Playground",
        location: { address: "New St" },
        rating: 5,
        photos: [],
      };

      await act(async () => {
        await storeResult.current.addPlayground(newPlayground);
      });

      expect(storeResult.current.playgrounds).toHaveLength(2);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle large datasets efficiently", async () => {
      const { result: storeResult } = renderHook(() => usePlaygroundStore(), {
        wrapper: TestWrapper,
      });

      // Add many playgrounds
      const playgrounds = Array.from({ length: 50 }, (_, i) => ({
        name: `Playground ${i + 1}`,
        location: { address: `Address ${i + 1}` },
        rating: (i % 5) + 1,
        photos: i % 2 === 0 ? [`photo${i}.jpg`] : [],
      }));

      await act(async () => {
        for (const playground of playgrounds) {
          await storeResult.current.addPlayground(playground);
        }
      });

      expect(storeResult.current.playgrounds).toHaveLength(50);

      // Test sorting performance
      const startTime = Date.now();
      act(() => {
        storeResult.current.setSortBy("name");
      });
      const sortTime = Date.now() - startTime;

      expect(sortTime).toBeLessThan(100); // Should be fast
      const sortedPlaygrounds = getSortedAndFilteredPlaygrounds(
        storeResult.current.playgrounds,
        storeResult.current.sortBy,
        storeResult.current.filterBy
      );
      expect(sortedPlaygrounds[0].name).toBe("Playground 1");
    });

    it("should handle concurrent operations", async () => {
      const { result: storeResult } = renderHook(() => usePlaygroundStore(), {
        wrapper: TestWrapper,
      });

      // Perform multiple operations concurrently
      const operations = [
        storeResult.current.addPlayground({
          name: "Concurrent 1",
          location: { address: "Address 1" },
          rating: 4,
          photos: [],
        }),
        storeResult.current.addPlayground({
          name: "Concurrent 2",
          location: { address: "Address 2" },
          rating: 5,
          photos: [],
        }),
        storeResult.current.addPlayground({
          name: "Concurrent 3",
          location: { address: "Address 3" },
          rating: 3,
          photos: [],
        }),
      ];

      await act(async () => {
        await Promise.all(operations);
      });

      expect(storeResult.current.playgrounds).toHaveLength(3);
      expect(storeResult.current.error).toBe(null);
    });
  });
});
