/**
 * Lifecycle Service for PlayGroundPal
 *
 * Handles app lifecycle events, automatic data persistence, and cleanup operations
 * Manages app state changes (background/foreground) and ensures data integrity
 *
 * Requirements: 10.1, 10.2, 10.5
 */

import { AppState, AppStateStatus } from "react-native";
import * as FileSystem from "expo-file-system";
import { savePlaygrounds, loadPlaygrounds } from "./storageService";
import { AppError, Playground } from "../types/playground";

// App state tracking
let isAppActive = true;
let lastSaveTime = Date.now();
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

// Store reference for lifecycle operations
let storeInstance: any = null;

/**
 * Set store instance for lifecycle operations
 * This should be called from a React component
 */
export const setStoreInstance = (store: any) => {
  storeInstance = store;
};

/**
 * Initialize app lifecycle management
 * Should be called once when the app starts
 */
export const initializeLifecycleService = () => {
  // Set up app state change listener
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log("App state changed:", nextAppState);

    if (nextAppState === "active" && !isAppActive) {
      // App became active (foreground)
      handleAppForeground();
    } else if (nextAppState === "background" && isAppActive) {
      // App became inactive (background)
      handleAppBackground();
    } else if (nextAppState === "inactive") {
      // App is inactive (transitioning)
      handleAppInactive();
    }

    isAppActive = nextAppState === "active";
  };

  // Subscribe to app state changes
  const subscription = AppState.addEventListener(
    "change",
    handleAppStateChange
  );

  // Return cleanup function
  return () => {
    subscription?.remove();
  };
};

/**
 * Handle app becoming active (foreground)
 */
const handleAppForeground = async () => {
  try {
    console.log("App became active - loading data...");

    // Load fresh data from storage
    if (storeInstance?.loadPlaygrounds) {
      await storeInstance.loadPlaygrounds();
    }

    // Clean up orphaned photos
    await cleanupOrphanedPhotos();

    console.log("App foreground handling completed");
  } catch (error) {
    console.error("Error handling app foreground:", error);
  }
};

/**
 * Handle app becoming inactive (background)
 */
const handleAppBackground = async () => {
  try {
    console.log("App becoming inactive - saving data...");

    // Force save current state
    if (storeInstance?.playgrounds) {
      await savePlaygrounds(storeInstance.playgrounds);
    }

    lastSaveTime = Date.now();
    console.log("App background handling completed");
  } catch (error) {
    console.error("Error handling app background:", error);
  }
};

/**
 * Handle app becoming inactive (transitioning)
 */
const handleAppInactive = async () => {
  try {
    console.log("App becoming inactive - quick save...");

    // Quick save without full validation
    if (storeInstance?.playgrounds) {
      await savePlaygrounds(storeInstance.playgrounds);
    }

    lastSaveTime = Date.now();
  } catch (error) {
    console.error("Error handling app inactive:", error);
  }
};

/**
 * Clean up orphaned photos that are no longer referenced by any playground
 */
export const cleanupOrphanedPhotos = async (): Promise<void> => {
  try {
    console.log("Starting orphaned photo cleanup...");

    const playgrounds = storeInstance?.playgrounds || [];

    // Get all photo URIs that are currently referenced
    const referencedPhotos = new Set<string>();
    playgrounds.forEach((playground: Playground) => {
      playground.photos.forEach((photoUri: string) => {
        referencedPhotos.add(photoUri);
      });
    });

    // Get the app's document directory
    const documentDir = FileSystem.documentDirectory;
    if (!documentDir) {
      console.warn("Document directory not available");
      return;
    }

    // Get all files in the document directory
    const files = await FileSystem.readDirectoryAsync(documentDir);

    // Filter for photo files (assuming they have .jpg, .png, .jpeg extensions)
    const photoFiles = files.filter(
      (file) =>
        /\.(jpg|jpeg|png)$/i.test(file) && file.startsWith("playground_")
    );

    let cleanedCount = 0;

    // Check each photo file
    for (const file of photoFiles) {
      const fileUri = `${documentDir}${file}`;

      // If this photo is not referenced by any playground, delete it
      if (!referencedPhotos.has(fileUri)) {
        try {
          await FileSystem.deleteAsync(fileUri);
          cleanedCount++;
          console.log(`Deleted orphaned photo: ${file}`);
        } catch (deleteError) {
          console.warn(`Failed to delete orphaned photo ${file}:`, deleteError);
        }
      }
    }

    console.log(
      `Orphaned photo cleanup completed. Deleted ${cleanedCount} files.`
    );
  } catch (error) {
    console.error("Error during orphaned photo cleanup:", error);

    const cleanupError: AppError = {
      type: "system",
      message: "Failed to cleanup orphaned photos",
      code: error instanceof Error ? error.message : "unknown",
      recoverable: true,
      timestamp: new Date(),
    };

    throw cleanupError;
  }
};

/**
 * Get storage usage statistics
 */
export const getStorageUsage = async (): Promise<{
  totalSize: number;
  photoCount: number;
  dataSize: number;
}> => {
  try {
    const documentDir = FileSystem.documentDirectory;
    if (!documentDir) {
      throw new Error("Document directory not available");
    }

    // Get all files in the document directory
    const files = await FileSystem.readDirectoryAsync(documentDir);

    let totalSize = 0;
    let photoCount = 0;

    // Calculate sizes for each file
    for (const file of files) {
      const fileUri = `${documentDir}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists && fileInfo.size) {
        totalSize += fileInfo.size;

        // Count photo files
        if (/\.(jpg|jpeg|png)$/i.test(file) && file.startsWith("playground_")) {
          photoCount++;
        }
      }
    }

    // Estimate data size (JSON storage)
    const playgrounds = storeInstance?.playgrounds || [];
    const dataSize = JSON.stringify(playgrounds).length;

    return {
      totalSize,
      photoCount,
      dataSize,
    };
  } catch (error) {
    console.error("Error getting storage usage:", error);
    return {
      totalSize: 0,
      photoCount: 0,
      dataSize: 0,
    };
  }
};

/**
 * Force save current state (useful for testing or manual saves)
 */
export const forceSave = async (): Promise<void> => {
  try {
    if (storeInstance?.playgrounds) {
      await savePlaygrounds(storeInstance.playgrounds);
      lastSaveTime = Date.now();
      console.log("Force save completed");
    }
  } catch (error) {
    console.error("Error during force save:", error);
    throw error;
  }
};

/**
 * Check if auto-save is needed based on time interval
 */
export const shouldAutoSave = (): boolean => {
  const timeSinceLastSave = Date.now() - lastSaveTime;
  return timeSinceLastSave >= AUTO_SAVE_INTERVAL;
};

/**
 * Perform periodic maintenance tasks
 * Should be called periodically or on app startup
 */
export const performMaintenance = async (): Promise<void> => {
  try {
    console.log("Starting periodic maintenance...");

    // Clean up orphaned photos
    await cleanupOrphanedPhotos();

    // Check storage usage
    const usage = await getStorageUsage();
    console.log("Storage usage:", usage);

    // Force save if needed
    if (shouldAutoSave()) {
      await forceSave();
    }

    console.log("Periodic maintenance completed");
  } catch (error) {
    console.error("Error during maintenance:", error);
  }
};
