/**
 * Playground Actions Hook for PlayGroundPal
 *
 * Integrates playground store with toast notifications and undo functionality
 * Provides enhanced CRUD operations with user feedback
 *
 * Requirements: 1.5, 6.5, 10.3, 10.4
 */

import { useCallback } from "react";
import { usePlaygroundStore } from "../store/playgroundStore";
import { useToast } from "../components/ui/Toast";
import { useUndo } from "../components/ui/UndoProvider";
import { Playground, AppError } from "../types/playground";

/**
 * Hook that provides playground actions with integrated error handling and user feedback
 */
export const usePlaygroundActions = () => {
  const store = usePlaygroundStore();
  const toast = useToast();
  const undo = useUndo();

  /**
   * Add a new playground with success/error notifications
   */
  const addPlayground = useCallback(
    async (
      playground: Omit<Playground, "id" | "dateAdded" | "dateModified">
    ) => {
      try {
        await store.addPlayground(playground);

        // Show success notification
        toast.showSuccess(
          "Playground Added! 🎉",
          `"${playground.name}" has been added to your collection.`
        );
      } catch (error) {
        // Show error notification
        if (error && typeof error === "object" && "type" in error) {
          toast.showAppError(error as AppError);
        } else {
          toast.showError(
            "Failed to Add Playground",
            error instanceof Error
              ? error.message
              : "An unexpected error occurred."
          );
        }
        throw error;
      }
    },
    [store, toast]
  );

  /**
   * Update a playground with success/error notifications
   */
  const updatePlayground = useCallback(
    async (id: string, updates: Partial<Playground>) => {
      try {
        await store.updatePlayground(id, updates);

        // Show success notification
        toast.showSuccess(
          "Playground Updated! ✨",
          `Your changes have been saved.`
        );
      } catch (error) {
        // Show error notification
        if (error && typeof error === "object" && "type" in error) {
          toast.showAppError(error as AppError);
        } else {
          toast.showError(
            "Failed to Update Playground",
            error instanceof Error
              ? error.message
              : "An unexpected error occurred."
          );
        }
        throw error;
      }
    },
    [store, toast]
  );

  /**
   * Delete a playground with undo functionality
   */
  const deletePlayground = useCallback(
    async (id: string) => {
      try {
        // Find the playground before deleting
        const playground = store.playgrounds.find((p) => p.id === id);
        if (!playground) {
          throw new Error("Playground not found");
        }

        // Delete the playground
        const deletedPlayground = await store.deletePlaygroundWithUndo(id);

        // Register undo operation
        undo.registerPlaygroundDeletion(
          deletedPlayground || playground,
          async () => {
            await store.restorePlayground(deletedPlayground || playground);
          }
        );
      } catch (error) {
        // Show error notification
        if (error && typeof error === "object" && "type" in error) {
          toast.showAppError(error as AppError);
        } else {
          toast.showError(
            "Failed to Delete Playground",
            error instanceof Error
              ? error.message
              : "An unexpected error occurred."
          );
        }
        throw error;
      }
    },
    [store, toast, undo]
  );

  /**
   * Load playgrounds with error handling
   */
  const loadPlaygrounds = useCallback(async () => {
    try {
      await store.loadPlaygrounds();
    } catch (error) {
      // Show error notification for loading failures
      if (error && typeof error === "object" && "type" in error) {
        const appError = error as AppError;
        toast.showAppError(appError, {
          label: "Retry",
          onPress: () => loadPlaygrounds(),
        });
      } else {
        toast.showError(
          "Failed to Load Playgrounds",
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
          0, // Don't auto-dismiss
          {
            action: {
              label: "Retry",
              onPress: () => loadPlaygrounds(),
            },
          }
        );
      }
      throw error;
    }
  }, [store, toast]);

  /**
   * Clear error state and dismiss related notifications
   */
  const clearError = useCallback(() => {
    store.clearError();
  }, [store]);

  /**
   * Handle generic app errors with user-friendly notifications
   */
  const handleError = useCallback(
    (error: unknown, context?: string) => {
      console.error(`Error in ${context || "playground action"}:`, error);

      if (error && typeof error === "object" && "type" in error) {
        toast.showAppError(error as AppError);
      } else {
        toast.showError(
          "Something went wrong",
          error instanceof Error
            ? error.message
            : "An unexpected error occurred."
        );
      }
    },
    [toast]
  );

  return {
    // Enhanced actions with notifications
    addPlayground,
    updatePlayground,
    deletePlayground,
    loadPlaygrounds,
    clearError,
    handleError,

    // Direct store access for read operations
    playgrounds: store.playgrounds,
    loading: store.loading,
    error: store.error,
    sortBy: store.sortBy,
    filterBy: store.filterBy,
    setSortBy: store.setSortBy,
    setFilterBy: store.setFilterBy,
  };
};

export default usePlaygroundActions;
