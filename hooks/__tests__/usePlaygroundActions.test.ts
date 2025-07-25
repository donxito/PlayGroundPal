/**
 * usePlaygroundActions Hook Tests
 *
 * Tests for the playground actions hook with integrated error handling
 * Requirements: 1.5, 6.5, 10.3, 10.4
 */

import { renderHook, act } from "@testing-library/react-native";
import { usePlaygroundActions } from "../usePlaygroundActions";
import { usePlaygroundStore } from "../../store/playgroundStore";
import { useToast } from "../../components/ui/Toast";
import { useUndo } from "../../components/ui/UndoProvider";
import { Playground, AppError } from "../../types/playground";

// Mock the dependencies
jest.mock("../../store/playgroundStore");
jest.mock("../../components/ui/Toast");
jest.mock("../../components/ui/UndoProvider");

const mockUsePlaygroundStore = usePlaygroundStore as jest.MockedFunction<
  typeof usePlaygroundStore
>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseUndo = useUndo as jest.MockedFunction<typeof useUndo>;

describe("usePlaygroundActions", () => {
  const mockStore = {
    playgrounds: [],
    loading: false,
    error: null,
    sortBy: "dateAdded" as const,
    filterBy: {},
    addPlayground: jest.fn(),
    updatePlayground: jest.fn(),
    deletePlaygroundWithUndo: jest.fn(),
    restorePlayground: jest.fn(),
    loadPlaygrounds: jest.fn(),
    setSortBy: jest.fn(),
    setFilterBy: jest.fn(),
    clearError: jest.fn(),
  };

  const mockToast = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showAppError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
    showToast: jest.fn(),
    dismissToast: jest.fn(),
    dismissAll: jest.fn(),
  };

  const mockUndo = {
    registerUndo: jest.fn(),
    executeUndo: jest.fn(),
    clearUndoHistory: jest.fn(),
    getPendingOperations: jest.fn(),
    registerPlaygroundDeletion: jest.fn(),
  };

  const mockPlayground: Playground = {
    id: "test-id",
    name: "Test Playground",
    location: {
      address: "123 Test St",
      coordinates: { latitude: 40.7128, longitude: -74.006 },
    },
    rating: 4,
    notes: "Great playground",
    photos: [],
    dateAdded: new Date(),
    dateModified: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePlaygroundStore.mockReturnValue(mockStore);
    mockUseToast.mockReturnValue(mockToast);
    mockUseUndo.mockReturnValue(mockUndo);
  });

  describe("addPlayground", () => {
    it("adds playground and shows success notification", async () => {
      mockStore.addPlayground.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePlaygroundActions());

      await act(async () => {
        await result.current.addPlayground({
          name: "Test Playground",
          location: { address: "123 Test St" },
          rating: 4,
          photos: [],
        });
      });

      expect(mockStore.addPlayground).toHaveBeenCalled();
      expect(mockToast.showSuccess).toHaveBeenCalledWith(
        "Playground Added! 🎉",
        '"Test Playground" has been added to your collection.'
      );
    });

    it("shows error notification when add fails", async () => {
      const appError: AppError = {
        type: "validation",
        message: "Name is required",
        recoverable: true,
        timestamp: new Date(),
      };
      mockStore.addPlayground.mockRejectedValue(appError);

      const { result } = renderHook(() => usePlaygroundActions());

      await act(async () => {
        try {
          await result.current.addPlayground({
            name: "",
            location: { address: "123 Test St" },
            rating: 4,
            photos: [],
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockToast.showAppError).toHaveBeenCalledWith(appError);
    });

    it("shows generic error for non-AppError", async () => {
      const genericError = new Error("Generic error");
      mockStore.addPlayground.mockRejectedValue(genericError);

      const { result } = renderHook(() => usePlaygroundActions());

      await act(async () => {
        try {
          await result.current.addPlayground({
            name: "Test",
            location: { address: "123 Test St" },
            rating: 4,
            photos: [],
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockToast.showError).toHaveBeenCalledWith(
        "Failed to Add Playground",
        "Generic error"
      );
    });
  });

  describe("updatePlayground", () => {
    it("updates playground and shows success notification", async () => {
      mockStore.updatePlayground.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePlaygroundActions());

      await act(async () => {
        await result.current.updatePlayground("test-id", {
          name: "Updated Name",
        });
      });

      expect(mockStore.updatePlayground).toHaveBeenCalledWith("test-id", {
        name: "Updated Name",
      });
      expect(mockToast.showSuccess).toHaveBeenCalledWith(
        "Playground Updated! ✨",
        "Your changes have been saved."
      );
    });

    it("shows error notification when update fails", async () => {
      const appError: AppError = {
        type: "storage",
        message: "Storage failed",
        recoverable: true,
        timestamp: new Date(),
      };
      mockStore.updatePlayground.mockRejectedValue(appError);

      const { result } = renderHook(() => usePlaygroundActions());

      await act(async () => {
        try {
          await result.current.updatePlayground("test-id", {
            name: "Updated Name",
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockToast.showAppError).toHaveBeenCalledWith(appError);
    });
  });

  describe("deletePlayground", () => {
    it("deletes playground and registers undo", async () => {
      mockStore.playgrounds = [mockPlayground];
      mockStore.deletePlaygroundWithUndo.mockResolvedValue(mockPlayground);

      const { result } = renderHook(() => usePlaygroundActions());

      await act(async () => {
        await result.current.deletePlayground("test-id");
      });

      expect(mockStore.deletePlaygroundWithUndo).toHaveBeenCalledWith(
        "test-id"
      );
      expect(mockUndo.registerPlaygroundDeletion).toHaveBeenCalledWith(
        mockPlayground,
        expect.any(Function)
      );
    });

    it("shows error when playground not found", async () => {
      mockStore.playgrounds = [];

      const { result } = renderHook(() => usePlaygroundActions());

      await act(async () => {
        try {
          await result.current.deletePlayground("nonexistent-id");
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockToast.showError).toHaveBeenCalledWith(
        "Failed to Delete Playground",
        "Playground not found"
      );
    });

    it("shows error notification when delete fails", async () => {
      mockStore.playgrounds = [mockPlayground];
      const appError: AppError = {
        type: "system",
        message: "Delete failed",
        recoverable: true,
        timestamp: new Date(),
      };
      mockStore.deletePlaygroundWithUndo.mockRejectedValue(appError);

      const { result } = renderHook(() => usePlaygroundActions());

      await act(async () => {
        try {
          await result.current.deletePlayground("test-id");
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockToast.showAppError).toHaveBeenCalledWith(appError);
    });
  });

  describe("loadPlaygrounds", () => {
    it("loads playgrounds successfully", async () => {
      mockStore.loadPlaygrounds.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePlaygroundActions());

      await act(async () => {
        await result.current.loadPlaygrounds();
      });

      expect(mockStore.loadPlaygrounds).toHaveBeenCalled();
      // No toast should be shown for successful load
      expect(mockToast.showSuccess).not.toHaveBeenCalled();
    });

    it("shows error with retry option when load fails", async () => {
      const appError: AppError = {
        type: "storage",
        message: "Load failed",
        recoverable: true,
        timestamp: new Date(),
      };
      mockStore.loadPlaygrounds.mockRejectedValue(appError);

      const { result } = renderHook(() => usePlaygroundActions());

      await act(async () => {
        try {
          await result.current.loadPlaygrounds();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockToast.showAppError).toHaveBeenCalledWith(appError, {
        label: "Retry",
        onPress: expect.any(Function),
      });
    });

    it("shows generic error with retry for non-AppError", async () => {
      const genericError = new Error("Generic load error");
      mockStore.loadPlaygrounds.mockRejectedValue(genericError);

      const { result } = renderHook(() => usePlaygroundActions());

      await act(async () => {
        try {
          await result.current.loadPlaygrounds();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockToast.showError).toHaveBeenCalledWith(
        "Failed to Load Playgrounds",
        "Generic load error",
        0,
        {
          action: {
            label: "Retry",
            onPress: expect.any(Function),
          },
        }
      );
    });
  });

  describe("clearError", () => {
    it("clears error state", () => {
      const { result } = renderHook(() => usePlaygroundActions());

      act(() => {
        result.current.clearError();
      });

      expect(mockStore.clearError).toHaveBeenCalled();
    });
  });

  describe("handleError", () => {
    it("handles AppError", () => {
      const appError: AppError = {
        type: "network",
        message: "Network failed",
        recoverable: true,
        timestamp: new Date(),
      };

      const { result } = renderHook(() => usePlaygroundActions());

      act(() => {
        result.current.handleError(appError, "test context");
      });

      expect(mockToast.showAppError).toHaveBeenCalledWith(appError);
    });

    it("handles generic error", () => {
      const genericError = new Error("Generic error");

      const { result } = renderHook(() => usePlaygroundActions());

      act(() => {
        result.current.handleError(genericError, "test context");
      });

      expect(mockToast.showError).toHaveBeenCalledWith(
        "Something went wrong",
        "Generic error"
      );
    });

    it("handles unknown error", () => {
      const { result } = renderHook(() => usePlaygroundActions());

      act(() => {
        result.current.handleError("string error", "test context");
      });

      expect(mockToast.showError).toHaveBeenCalledWith(
        "Something went wrong",
        "An unexpected error occurred."
      );
    });
  });

  describe("store access", () => {
    it("provides direct access to store state", () => {
      const mockPlaygrounds = [mockPlayground];
      mockStore.playgrounds = mockPlaygrounds;
      mockStore.loading = true;
      mockStore.sortBy = "name";

      const { result } = renderHook(() => usePlaygroundActions());

      expect(result.current.playgrounds).toBe(mockPlaygrounds);
      expect(result.current.loading).toBe(true);
      expect(result.current.sortBy).toBe("name");
    });

    it("provides access to store actions", () => {
      const { result } = renderHook(() => usePlaygroundActions());

      act(() => {
        result.current.setSortBy("rating");
        result.current.setFilterBy({ rating: [4, 5] });
      });

      expect(mockStore.setSortBy).toHaveBeenCalledWith("rating");
      expect(mockStore.setFilterBy).toHaveBeenCalledWith({ rating: [4, 5] });
    });
  });
});
