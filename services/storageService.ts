/**
 * Storage Service for PlayGroundPal
 *
 * Handles all AsyncStorage operations for playground data persistence
 * Implements data migration utilities for future schema changes
 *
 * Requirements: 10.1, 10.2, 10.3
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Playground,
  StoredData,
  STORAGE_KEYS,
  AppError,
} from "../types/playground";

// Current schema version - increment when making breaking changes to data structure
const CURRENT_SCHEMA_VERSION = "1.0.0";

/**
 * Save playgrounds to AsyncStorage
 *
 * @param playgrounds - Array of playground objects to save
 * @returns Promise that resolves when save is complete
 * @throws AppError if storage operation fails
 */
export const savePlaygrounds = async (
  playgrounds: Playground[]
): Promise<void> => {
  try {
    const data: StoredData = {
      playgrounds,
      version: CURRENT_SCHEMA_VERSION,
      lastModified: new Date(),
    };

    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYGROUNDS, jsonValue);
  } catch (error) {
    const storageError: AppError = {
      type: "storage",
      message: "Failed to save playgrounds to storage",
      code: error instanceof Error ? error.message : "unknown",
      recoverable: true,
      timestamp: new Date(),
    };

    console.error("Storage error:", error);
    throw storageError;
  }
};

/**
 * Load playgrounds from AsyncStorage
 *
 * @returns Promise that resolves with array of playground objects
 * @throws AppError if storage operation fails or data is corrupted
 */
export const loadPlaygrounds = async (): Promise<Playground[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PLAYGROUNDS);

    if (!jsonValue) {
      // No data found - return empty array (first app use)
      return [];
    }

    const data: StoredData = JSON.parse(jsonValue);

    // Check if data needs migration
    if (data.version !== CURRENT_SCHEMA_VERSION) {
      return migrateData(data);
    }

    // Convert string dates back to Date objects
    return data.playgrounds.map((playground) => ({
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
  } catch (error) {
    const storageError: AppError = {
      type: "storage",
      message: "Failed to load playgrounds from storage",
      code: error instanceof Error ? error.message : "unknown",
      recoverable: false,
      timestamp: new Date(),
    };

    console.error("Storage error:", error);
    throw storageError;
  }
};

/**
 * Clear all playground data from storage
 * Use with caution - primarily for testing or user-initiated data reset
 *
 * @returns Promise that resolves when clear is complete
 * @throws AppError if storage operation fails
 */
export const clearPlaygrounds = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PLAYGROUNDS);
  } catch (error) {
    const storageError: AppError = {
      type: "storage",
      message: "Failed to clear playgrounds from storage",
      code: error instanceof Error ? error.message : "unknown",
      recoverable: true,
      timestamp: new Date(),
    };

    console.error("Storage error:", error);
    throw storageError;
  }
};

/**
 * Migrate data from older schema versions to current schema
 *
 * @param data - StoredData object with potentially outdated schema
 * @returns Promise that resolves with migrated playground array
 */
export const migrateData = async (data: StoredData): Promise<Playground[]> => {
  // Handle migrations based on version
  const sourceVersion = data.version;
  let migratedPlaygrounds = [...data.playgrounds];

  // Example migration from version 0.9.0 to 1.0.0
  if (sourceVersion === "0.9.0") {
    // In this example, let's say we added the 'notes' field in 1.0.0
    migratedPlaygrounds = migratedPlaygrounds.map((playground) => ({
      ...playground,
      notes: playground.notes || "",
      // Convert string dates to Date objects
      dateAdded: new Date(playground.dateAdded),
      dateModified: new Date(playground.dateModified),
      location: {
        ...playground.location,
        timestamp: playground.location.timestamp
          ? new Date(playground.location.timestamp)
          : undefined,
      },
    }));
  }

  // Add more version migrations as needed
  // if (sourceVersion === '1.0.0' && CURRENT_SCHEMA_VERSION === '1.1.0') {
  //   // Migration from 1.0.0 to 1.1.0
  // }

  // Save the migrated data
  const migratedData: StoredData = {
    playgrounds: migratedPlaygrounds,
    version: CURRENT_SCHEMA_VERSION,
    lastModified: new Date(),
  };

  const jsonValue = JSON.stringify(migratedData);
  await AsyncStorage.setItem(STORAGE_KEYS.PLAYGROUNDS, jsonValue);

  return migratedPlaygrounds;
};

/**
 * Get storage statistics
 *
 * @returns Promise that resolves with storage statistics
 */
export const getStorageStats = async (): Promise<{
  playgroundCount: number;
  schemaVersion: string;
  lastModified: Date | null;
}> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PLAYGROUNDS);

    if (!jsonValue) {
      return {
        playgroundCount: 0,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        lastModified: null,
      };
    }

    const data: StoredData = JSON.parse(jsonValue);

    return {
      playgroundCount: data.playgrounds.length,
      schemaVersion: data.version,
      lastModified: new Date(data.lastModified),
    };
  } catch (error) {
    console.error("Failed to get storage stats:", error);
    return {
      playgroundCount: 0,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      lastModified: null,
    };
  }
};

/**
 * Backup playground data to a JSON string
 *
 * @returns Promise that resolves with JSON string of all playground data
 * @throws AppError if storage operation fails
 */
export const backupPlaygrounds = async (): Promise<string> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PLAYGROUNDS);

    if (!jsonValue) {
      return JSON.stringify({
        playgrounds: [],
        version: CURRENT_SCHEMA_VERSION,
        lastModified: new Date(),
      });
    }

    return jsonValue;
  } catch (error) {
    const storageError: AppError = {
      type: "storage",
      message: "Failed to backup playgrounds",
      code: error instanceof Error ? error.message : "unknown",
      recoverable: true,
      timestamp: new Date(),
    };

    console.error("Storage error:", error);
    throw storageError;
  }
};

/**
 * Restore playground data from a JSON string backup
 *
 * @param backupJson - JSON string containing playground backup data
 * @returns Promise that resolves when restore is complete
 * @throws AppError if storage operation fails or backup data is invalid
 */
export const restorePlaygrounds = async (backupJson: string): Promise<void> => {
  try {
    // Validate the backup data
    const backupData = JSON.parse(backupJson) as StoredData;

    if (!backupData || !Array.isArray(backupData.playgrounds)) {
      throw new Error("Invalid backup data format");
    }

    // If backup is from an older schema, migrate it
    if (backupData.version !== CURRENT_SCHEMA_VERSION) {
      await migrateData(backupData);
      return;
    }

    // Otherwise, save it directly
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYGROUNDS, backupJson);
  } catch (error) {
    const storageError: AppError = {
      type: "storage",
      message: "Failed to restore playgrounds from backup",
      code: error instanceof Error ? error.message : "unknown",
      recoverable: false,
      timestamp: new Date(),
    };

    console.error("Storage error:", error);
    throw storageError;
  }
};
