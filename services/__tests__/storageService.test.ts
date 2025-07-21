/**
 * Unit tests for Storage Service
 *
 * Tests all AsyncStorage operations and error handling
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  savePlaygrounds,
  loadPlaygrounds,
  clearPlaygrounds,
  migrateData,
  getStorageStats,
  backupPlaygrounds,
  restorePlaygrounds,
} from "../storageService";
import { Playground, StoredData, AppError } from "../../types/playground";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Sample playground data for testing
const mockPlaygrounds: Playground[] = [
  {
    id: "playground-1",
    name: "Central Park Playground",
    location: {
      address: "123 Park Ave",
      coordinates: {
        latitude: 40.7812,
        longitude: -73.9665,
      },
      timestamp: new Date("2023-07-15T12:00:00Z"),
    },
    rating: 4,
    notes: "Great slides and swings",
    photos: ["photo1.jpg", "photo2.jpg"],
    dateAdded: new Date("2023-07-15T12:00:00Z"),
    dateModified: new Date("2023-07-15T12:00:00Z"),
  },
  {
    id: "playground-2",
    name: "Riverside Playground",
    location: {
      address: "456 River Rd",
      coordinates: {
        latitude: 40.8223,
        longitude: -73.9887,
      },
    },
    rating: 5,
    photos: ["photo3.jpg"],
    dateAdded: new Date("2023-07-16T14:30:00Z"),
    dateModified: new Date("2023-07-16T14:30:00Z"),
  },
];

// Mock stored data with dates as strings (as they would be after JSON.stringify/parse)
const mockStoredDataString = JSON.stringify({
  playgrounds: mockPlaygrounds.map((playground) => ({
    ...playground,
    dateAdded: playground.dateAdded.toISOString(),
    dateModified: playground.dateModified.toISOString(),
    location: {
      ...playground.location,
      timestamp: playground.location.timestamp?.toISOString(),
    },
  })),
  version: "1.0.0",
  lastModified: new Date("2023-07-16T14:30:00Z").toISOString(),
});

// Mock older version data for migration testing
const mockOldVersionDataString = JSON.stringify({
  playgrounds: mockPlaygrounds.map((playground) => ({
    ...playground,
    // Remove notes field to simulate older version
    notes: undefined,
    dateAdded: playground.dateAdded.toISOString(),
    dateModified: playground.dateModified.toISOString(),
    location: {
      ...playground.location,
      timestamp: playground.location.timestamp?.toISOString(),
    },
  })),
  version: "0.9.0",
  lastModified: new Date("2023-07-16T14:30:00Z").toISOString(),
});

describe("Storage Service", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("savePlaygrounds", () => {
    it("should save playgrounds to AsyncStorage", async () => {
      await savePlaygrounds(mockPlaygrounds);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "@playgroundpal:playgrounds",
        expect.any(String)
      );

      // Verify the saved data structure
      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );
      expect(savedData).toHaveProperty("playgrounds");
      expect(savedData).toHaveProperty("version", "1.0.0");
      expect(savedData).toHaveProperty("lastModified");
      expect(savedData.playgrounds).toHaveLength(2);
    });

    it("should throw AppError when AsyncStorage fails", async () => {
      // Mock AsyncStorage to throw an error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error("Storage failure")
      );

      await expect(savePlaygrounds(mockPlaygrounds)).rejects.toMatchObject({
        type: "storage",
        message: "Failed to save playgrounds to storage",
        recoverable: true,
      });
    });
  });

  describe("loadPlaygrounds", () => {
    it("should load playgrounds from AsyncStorage", async () => {
      // Mock AsyncStorage to return stored data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        mockStoredDataString
      );

      const result = await loadPlaygrounds();

      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        "@playgroundpal:playgrounds"
      );
      expect(result).toHaveLength(2);

      // Verify Date objects are properly reconstructed
      expect(result[0].dateAdded).toBeInstanceOf(Date);
      expect(result[0].dateModified).toBeInstanceOf(Date);
      expect(result[0].location.timestamp).toBeInstanceOf(Date);
    });

    it("should return empty array when no data exists", async () => {
      // Mock AsyncStorage to return null (no data)
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await loadPlaygrounds();

      expect(result).toEqual([]);
    });

    it("should migrate data when schema version is outdated", async () => {
      // Mock AsyncStorage to return old version data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        mockOldVersionDataString
      );
      // Mock setItem for migration save
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await loadPlaygrounds();

      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);

      // Verify migration added default values
      expect(result[0]).toHaveProperty("notes");
    });

    it("should throw AppError when AsyncStorage fails", async () => {
      // Mock AsyncStorage to throw an error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error("Storage failure")
      );

      await expect(loadPlaygrounds()).rejects.toMatchObject({
        type: "storage",
        message: "Failed to load playgrounds from storage",
        recoverable: false,
      });
    });

    it("should throw AppError when data is corrupted", async () => {
      // Mock AsyncStorage to return invalid JSON
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("invalid json");

      await expect(loadPlaygrounds()).rejects.toMatchObject({
        type: "storage",
        message: "Failed to load playgrounds from storage",
      });
    });
  });

  describe("clearPlaygrounds", () => {
    it("should remove playgrounds from AsyncStorage", async () => {
      await clearPlaygrounds();

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        "@playgroundpal:playgrounds"
      );
    });

    it("should throw AppError when AsyncStorage fails", async () => {
      // Mock AsyncStorage to throw an error
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
        new Error("Storage failure")
      );

      await expect(clearPlaygrounds()).rejects.toMatchObject({
        type: "storage",
        message: "Failed to clear playgrounds from storage",
        recoverable: true,
      });
    });
  });

  describe("migrateData", () => {
    it("should migrate data from older schema version", async () => {
      const oldData: StoredData = {
        playgrounds: mockPlaygrounds.map((playground) => ({
          ...playground,
          notes: undefined, // Remove notes to simulate older version
        })),
        version: "0.9.0",
        lastModified: new Date("2023-07-16T14:30:00Z"),
      };

      const result = await migrateData(oldData);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);

      // Verify migration added default values
      expect(result[0]).toHaveProperty("notes", "");
    });
  });

  describe("getStorageStats", () => {
    it("should return correct stats when data exists", async () => {
      // Mock AsyncStorage to return stored data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        mockStoredDataString
      );

      const stats = await getStorageStats();

      expect(stats).toMatchObject({
        playgroundCount: 2,
        schemaVersion: "1.0.0",
      });
      expect(stats.lastModified).toBeInstanceOf(Date);
    });

    it("should return default stats when no data exists", async () => {
      // Mock AsyncStorage to return null (no data)
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const stats = await getStorageStats();

      expect(stats).toMatchObject({
        playgroundCount: 0,
        schemaVersion: "1.0.0",
        lastModified: null,
      });
    });

    it("should handle errors gracefully", async () => {
      // Mock AsyncStorage to throw an error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error("Storage failure")
      );

      const stats = await getStorageStats();

      expect(stats).toMatchObject({
        playgroundCount: 0,
        schemaVersion: "1.0.0",
        lastModified: null,
      });
    });
  });

  describe("backupPlaygrounds", () => {
    it("should return JSON string of playground data", async () => {
      // Mock AsyncStorage to return stored data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        mockStoredDataString
      );

      const backup = await backupPlaygrounds();

      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
      expect(backup).toBe(mockStoredDataString);
    });

    it("should return empty data structure when no data exists", async () => {
      // Mock AsyncStorage to return null (no data)
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const backup = await backupPlaygrounds();
      const parsedBackup = JSON.parse(backup);

      expect(parsedBackup).toHaveProperty("playgrounds", []);
      expect(parsedBackup).toHaveProperty("version", "1.0.0");
      expect(parsedBackup).toHaveProperty("lastModified");
    });

    it("should throw AppError when AsyncStorage fails", async () => {
      // Mock AsyncStorage to throw an error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error("Storage failure")
      );

      await expect(backupPlaygrounds()).rejects.toMatchObject({
        type: "storage",
        message: "Failed to backup playgrounds",
        recoverable: true,
      });
    });
  });

  describe("restorePlaygrounds", () => {
    it("should restore playground data from backup", async () => {
      await restorePlaygrounds(mockStoredDataString);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "@playgroundpal:playgrounds",
        mockStoredDataString
      );
    });

    it("should migrate data when backup has older schema version", async () => {
      await restorePlaygrounds(mockOldVersionDataString);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it("should throw AppError when backup data is invalid", async () => {
      await expect(restorePlaygrounds("invalid json")).rejects.toMatchObject({
        type: "storage",
        message: "Failed to restore playgrounds from backup",
        recoverable: false,
      });
    });

    it("should throw AppError when backup data structure is incorrect", async () => {
      await expect(
        restorePlaygrounds('{"notPlaygrounds": []}')
      ).rejects.toMatchObject({
        type: "storage",
        message: "Failed to restore playgrounds from backup",
        recoverable: false,
      });
    });
  });
});
