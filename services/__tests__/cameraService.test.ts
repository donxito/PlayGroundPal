/**
 * Camera Service Tests
 *
 * Tests for the camera service functionality including:
 * - Permission handling
 * - Photo capture and selection
 * - Photo processing and storage
 * - Photo validation and cleanup
 *
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */

import {
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { manipulateAsync } from "expo-image-manipulator";
import {
  requestCameraPermissions,
  requestMediaLibraryPermissions,
  takePhoto,
  selectPhoto,
  processAndSavePhoto,
  deletePhoto,
  deletePlaygroundPhotos,
  cleanupOrphanedPhotos,
  getPlaygroundPhotos,
  validatePhoto,
  hasReachedPhotoLimit,
  getPhotoStorageStats,
  ensureDirectoriesExist,
  formatFileSize,
} from "../cameraService";
import { VALIDATION_RULES } from "../../types/playground";

// Mock expo modules
jest.mock("expo-camera", () => ({
  getCameraPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

jest.mock("expo-image-picker", () => ({
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock("expo-file-system", () => {
  const mockDocumentDirectory = "file:///app/";
  return {
    documentDirectory: mockDocumentDirectory,
    getInfoAsync: jest.fn(),
    makeDirectoryAsync: jest.fn(),
    copyAsync: jest.fn(),
    deleteAsync: jest.fn(),
    readDirectoryAsync: jest.fn(),
  };
});

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: "jpeg",
  },
}));

// Setup mocks for all tests

describe("Camera Service", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("requestCameraPermissions", () => {
    it("should return granted status when permissions are granted", async () => {
      // Mock the permission check to return granted
      (getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      const result = await requestCameraPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: true,
        status: "granted",
      });
      expect(getCameraPermissionsAsync).toHaveBeenCalled();
      expect(requestCameraPermissionsAsync).not.toHaveBeenCalled();
    });

    it("should request permissions when not already granted", async () => {
      // Mock the permission check to return not granted
      (getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "undetermined",
      });

      // Mock the permission request to return granted
      (requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      const result = await requestCameraPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: true,
        status: "granted",
      });
      expect(getCameraPermissionsAsync).toHaveBeenCalled();
      expect(requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    it("should handle denied permissions", async () => {
      // Mock the permission check to return not granted
      (getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "undetermined",
      });

      // Mock the permission request to return denied
      (requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      const result = await requestCameraPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: false,
        status: "denied",
      });
    });

    it("should handle errors during permission request", async () => {
      // Mock the permission check to throw an error
      (getCameraPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error("Permission error")
      );

      const result = await requestCameraPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: false,
        status: "denied",
      });
    });
  });

  describe("requestMediaLibraryPermissions", () => {
    it("should return granted status when permissions are granted", async () => {
      // Mock the permission check to return granted
      (
        ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "granted",
      });

      const result = await requestMediaLibraryPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: true,
        status: "granted",
      });
      expect(ImagePicker.getMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(
        ImagePicker.requestMediaLibraryPermissionsAsync
      ).not.toHaveBeenCalled();
    });

    it("should request permissions when not already granted", async () => {
      // Mock the permission check to return not granted
      (
        ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "undetermined",
      });

      // Mock the permission request to return granted
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "granted",
      });

      const result = await requestMediaLibraryPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: true,
        status: "granted",
      });
      expect(ImagePicker.getMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(
        ImagePicker.requestMediaLibraryPermissionsAsync
      ).toHaveBeenCalled();
    });

    it("should handle denied permissions", async () => {
      // Mock the permission check to return not granted
      (
        ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "undetermined",
      });

      // Mock the permission request to return denied
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "denied",
      });

      const result = await requestMediaLibraryPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: false,
        status: "denied",
      });
    });

    it("should handle errors during permission request", async () => {
      // Mock the permission check to throw an error
      (
        ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock
      ).mockRejectedValue(new Error("Permission error"));

      const result = await requestMediaLibraryPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: false,
        status: "denied",
      });
    });
  });

  describe("takePhoto", () => {
    it("should capture and process a photo when permissions are granted", async () => {
      // Mock camera permissions
      (getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      // Mock image picker result
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        cancelled: false,
        assets: [
          {
            uri: "file:///tmp/photo.jpg",
            width: 1200,
            height: 900,
          },
        ],
      });

      // Mock file validation
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024 * 1024, // 1MB
      });

      // Mock image manipulation
      (manipulateAsync as jest.Mock).mockResolvedValue({
        uri: "file:///tmp/compressed.jpg",
      });

      // Mock file operations
      (FileSystem.copyAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await takePhoto("playground-1");

      expect(result).toEqual({
        uri: expect.stringContaining("playground_playground-1_"),
        width: 1200,
        height: 900,
        cancelled: false,
      });

      expect(getCameraPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
      expect(FileSystem.getInfoAsync).toHaveBeenCalled();
      expect(manipulateAsync).toHaveBeenCalledTimes(2); // Once for compression, once for thumbnail
      expect(FileSystem.copyAsync).toHaveBeenCalledTimes(2); // Once for photo, once for thumbnail
    });

    it("should return cancelled result when user cancels photo capture", async () => {
      // Mock camera permissions
      (getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      // Mock image picker result with cancelled: true
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        cancelled: true,
        assets: [],
      });

      const result = await takePhoto("playground-1");

      expect(result).toEqual({
        uri: "",
        width: 0,
        height: 0,
        cancelled: true,
      });

      expect(getCameraPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
      expect(FileSystem.getInfoAsync).not.toHaveBeenCalled();
      expect(manipulateAsync).not.toHaveBeenCalled();
      expect(FileSystem.copyAsync).not.toHaveBeenCalled();
    });

    it("should throw an error when camera permission is denied", async () => {
      // Mock camera permissions denied
      (getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });
      (requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      await expect(takePhoto("playground-1")).rejects.toEqual(
        expect.objectContaining({
          type: "permission",
          message: expect.stringContaining("Camera permission is required"),
          code: "CAMERA_PERMISSION_DENIED",
        })
      );

      expect(getCameraPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    });

    it("should handle errors during photo capture", async () => {
      // Mock camera permissions
      (getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      // Mock image picker to throw an error
      (ImagePicker.launchCameraAsync as jest.Mock).mockRejectedValue(
        new Error("Camera error")
      );

      await expect(takePhoto("playground-1")).rejects.toEqual(
        expect.objectContaining({
          type: "system",
          message: expect.stringContaining("Failed to capture photo"),
          recoverable: true,
        })
      );

      expect(getCameraPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
    });
  });

  describe("selectPhoto", () => {
    it("should select and process a photo when permissions are granted", async () => {
      // Mock media library permissions
      (
        ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "granted",
      });

      // Mock image picker result
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        cancelled: false,
        assets: [
          {
            uri: "file:///tmp/photo.jpg",
            width: 1200,
            height: 900,
          },
        ],
      });

      // Mock file validation
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024 * 1024, // 1MB
      });

      // Mock image manipulation
      (manipulateAsync as jest.Mock).mockResolvedValue({
        uri: "file:///tmp/compressed.jpg",
      });

      // Mock file operations
      (FileSystem.copyAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await selectPhoto("playground-1");

      expect(result).toEqual({
        uri: expect.stringContaining("playground_playground-1_"),
        width: 1200,
        height: 900,
        cancelled: false,
      });

      expect(ImagePicker.getMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(FileSystem.getInfoAsync).toHaveBeenCalled();
      expect(manipulateAsync).toHaveBeenCalledTimes(2); // Once for compression, once for thumbnail
      expect(FileSystem.copyAsync).toHaveBeenCalledTimes(2); // Once for photo, once for thumbnail
    });

    it("should return cancelled result when user cancels photo selection", async () => {
      // Mock media library permissions
      (
        ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "granted",
      });

      // Mock image picker result with cancelled: true
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        cancelled: true,
        assets: [],
      });

      const result = await selectPhoto("playground-1");

      expect(result).toEqual({
        uri: "",
        width: 0,
        height: 0,
        cancelled: true,
      });

      expect(ImagePicker.getMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(FileSystem.getInfoAsync).not.toHaveBeenCalled();
      expect(manipulateAsync).not.toHaveBeenCalled();
      expect(FileSystem.copyAsync).not.toHaveBeenCalled();
    });

    it("should throw an error when media library permission is denied", async () => {
      // Mock media library permissions denied
      (
        ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "denied",
      });
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "denied",
      });

      await expect(selectPhoto("playground-1")).rejects.toEqual(
        expect.objectContaining({
          type: "permission",
          message: expect.stringContaining(
            "Media library permission is required"
          ),
          code: "MEDIA_PERMISSION_DENIED",
        })
      );

      expect(ImagePicker.getMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
    });
  });

  describe("processAndSavePhoto", () => {
    it("should process and save a photo", async () => {
      // Mock directory checks
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: false }) // Photos directory doesn't exist
        .mockResolvedValueOnce({ exists: false }); // Thumbnails directory doesn't exist

      // Mock directory creation
      (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);

      // Mock image manipulation
      (manipulateAsync as jest.Mock)
        .mockResolvedValueOnce({ uri: "file:///tmp/compressed.jpg" }) // Compressed photo
        .mockResolvedValueOnce({ uri: "file:///tmp/thumbnail.jpg" }); // Thumbnail

      // Mock file operations
      (FileSystem.copyAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await processAndSavePhoto(
        "file:///tmp/original.jpg",
        "playground-1"
      );

      expect(result).toEqual({
        uri: expect.stringContaining("playground_playground-1_"),
        filename: expect.stringContaining("playground_playground-1_"),
        playgroundId: "playground-1",
        timestamp: expect.any(Date),
        thumbnail: expect.stringContaining("thumbnail_playground-1_"),
      });

      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledTimes(2);
      expect(manipulateAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.copyAsync).toHaveBeenCalledTimes(2);
    });

    it("should handle errors during photo processing", async () => {
      // Mock directory checks to throw an error
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(
        new Error("File system error")
      );

      await expect(
        processAndSavePhoto("file:///tmp/original.jpg", "playground-1")
      ).rejects.toEqual(
        expect.objectContaining({
          type: "system",
          message: expect.stringContaining("Failed to process and save photo"),
          recoverable: true,
        })
      );
    });
  });

  describe("deletePhoto", () => {
    it("should delete a photo and its thumbnail", async () => {
      // Mock file checks
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // Photo exists
        .mockResolvedValueOnce({ exists: true }); // Thumbnail exists

      // Mock file deletion
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      await deletePhoto("file:///app/photos/playground_playground-1_123.jpg");

      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        "file:///app/photos/playground_playground-1_123.jpg"
      );
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        expect.stringContaining("thumbnail_playground-1_123.jpg")
      );
    });

    it("should handle non-existent files gracefully", async () => {
      // Mock file check to return not exists
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      await deletePhoto("file:///app/photos/nonexistent.jpg");

      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(1);
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });

    it("should handle errors during deletion gracefully", async () => {
      // Mock file check
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      // Mock file deletion to throw an error
      (FileSystem.deleteAsync as jest.Mock).mockRejectedValue(
        new Error("Deletion error")
      );

      // Should not throw
      await expect(
        deletePhoto("file:///app/photos/playground_playground-1_123.jpg")
      ).resolves.not.toThrow();

      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(1);
      expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe("deletePlaygroundPhotos", () => {
    it("should delete all photos associated with a playground", async () => {
      // Mock directory listing
      (FileSystem.readDirectoryAsync as jest.Mock)
        .mockResolvedValueOnce([
          "playground_playground-1_123.jpg",
          "playground_playground-2_456.jpg",
          "playground_playground-1_789.jpg",
        ]) // Photos
        .mockResolvedValueOnce([
          "thumbnail_playground-1_123.jpg",
          "thumbnail_playground-2_456.jpg",
          "thumbnail_playground-1_789.jpg",
        ]); // Thumbnails

      // Mock file deletion
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      await deletePlaygroundPhotos("playground-1");

      expect(FileSystem.readDirectoryAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(4); // 2 photos + 2 thumbnails
    });

    it("should handle errors during deletion gracefully", async () => {
      // Mock directory listing
      (FileSystem.readDirectoryAsync as jest.Mock).mockRejectedValue(
        new Error("Directory error")
      );

      // Should not throw
      await expect(
        deletePlaygroundPhotos("playground-1")
      ).resolves.not.toThrow();

      expect(FileSystem.readDirectoryAsync).toHaveBeenCalledTimes(1);
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });
  });

  describe("cleanupOrphanedPhotos", () => {
    it("should delete photos not associated with active playgrounds", async () => {
      // Mock directory listing
      (FileSystem.readDirectoryAsync as jest.Mock)
        .mockResolvedValueOnce([
          "playground_active-1_123.jpg",
          "playground_orphaned-1_456.jpg",
          "playground_active-2_789.jpg",
          "playground_orphaned-2_012.jpg",
        ]) // Photos
        .mockResolvedValueOnce([
          "thumbnail_active-1_123.jpg",
          "thumbnail_orphaned-1_456.jpg",
          "thumbnail_active-2_789.jpg",
          "thumbnail_orphaned-2_012.jpg",
        ]); // Thumbnails

      // Mock file deletion
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      const deletedCount = await cleanupOrphanedPhotos([
        "active-1",
        "active-2",
      ]);

      expect(deletedCount).toBe(4); // 2 orphaned photos + 2 orphaned thumbnails
      expect(FileSystem.readDirectoryAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(4);
    });

    it("should handle errors during cleanup gracefully", async () => {
      // Mock directory listing to throw an error
      (FileSystem.readDirectoryAsync as jest.Mock).mockRejectedValue(
        new Error("Directory error")
      );

      // Should not throw and return 0
      const deletedCount = await cleanupOrphanedPhotos(["active-1"]);

      expect(deletedCount).toBe(0);
      expect(FileSystem.readDirectoryAsync).toHaveBeenCalledTimes(1);
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });
  });

  describe("getPlaygroundPhotos", () => {
    it("should return all photos associated with a playground", async () => {
      // Mock directory checks - first for ensureDirectoriesExist, then for getPlaygroundPhotos
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // Photos directory exists (ensureDirectoriesExist)
        .mockResolvedValueOnce({ exists: true }) // Thumbnails directory exists (ensureDirectoriesExist)
        .mockResolvedValueOnce({ exists: true }); // Photos directory exists (getPlaygroundPhotos)

      // Mock directory listing
      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
        "playground_playground-1_789.jpg",
        "playground_playground-2_456.jpg",
        "playground_playground-1_123.jpg",
      ]);

      const photos = await getPlaygroundPhotos("playground-1");

      expect(photos).toHaveLength(2); // Only playground-1 photos
      expect(photos[0].playgroundId).toBe("playground-1");
      expect(photos[0].uri).toContain("playground_playground-1_");
      expect(photos[0].thumbnail).toContain("thumbnail_playground-1_");
      expect(photos[0].timestamp).toBeInstanceOf(Date);

      // Should be sorted by timestamp (newest first)
      expect(photos[0].timestamp.getTime()).toBeGreaterThan(
        photos[1].timestamp.getTime()
      );
    });

    it("should handle errors during photo retrieval gracefully", async () => {
      // Mock directory checks to throw an error
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(
        new Error("File system error")
      );

      // Should not throw and return empty array
      const photos = await getPlaygroundPhotos("playground-1");

      expect(photos).toEqual([]);
    });
  });

  describe("validatePhoto", () => {
    it("should validate a valid photo", async () => {
      // Mock file check
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024 * 1024, // 1MB
      });

      // Should not throw
      await expect(
        validatePhoto("file:///tmp/photo.jpg")
      ).resolves.not.toThrow();

      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(1);
    });

    it("should throw an error for non-existent photos", async () => {
      // Mock file check to return not exists
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      await expect(
        validatePhoto("file:///tmp/nonexistent.jpg")
      ).rejects.toEqual(
        expect.objectContaining({
          type: "validation",
          message: expect.stringContaining("Photo file does not exist"),
          code: "PHOTO_NOT_FOUND",
        })
      );
    });

    it("should throw an error for oversized photos", async () => {
      // Mock file check with large size
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 10 * 1024 * 1024, // 10MB
      });

      await expect(validatePhoto("file:///tmp/large.jpg")).rejects.toEqual(
        expect.objectContaining({
          type: "validation",
          message: expect.stringContaining("Photo is too large"),
          code: "PHOTO_TOO_LARGE",
        })
      );
    });

    it("should throw an error for invalid file formats", async () => {
      // Mock file check
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024 * 1024, // 1MB
      });

      await expect(validatePhoto("file:///tmp/document.pdf")).rejects.toEqual(
        expect.objectContaining({
          type: "validation",
          message: expect.stringContaining("Invalid photo format"),
          code: "INVALID_PHOTO_FORMAT",
        })
      );
    });
  });

  describe("hasReachedPhotoLimit", () => {
    it("should return true when photo limit is reached", async () => {
      // Mock directory checks
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // Photos directory exists
        .mockResolvedValueOnce({ exists: true }); // Thumbnails directory exists

      // Mock directory listing with MAX_PHOTOS files
      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(
        Array(VALIDATION_RULES.MAX_PHOTOS)
          .fill(0)
          .map((_, i) => `playground_playground-1_${i}.jpg`)
      );

      const result = await hasReachedPhotoLimit("playground-1");

      expect(result).toBe(true);
    });

    it("should return false when photo limit is not reached", async () => {
      // Mock directory checks
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // Photos directory exists
        .mockResolvedValueOnce({ exists: true }); // Thumbnails directory exists

      // Mock directory listing with fewer than MAX_PHOTOS files
      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(
        Array(VALIDATION_RULES.MAX_PHOTOS - 1)
          .fill(0)
          .map((_, i) => `playground_playground-1_${i}.jpg`)
      );

      const result = await hasReachedPhotoLimit("playground-1");

      expect(result).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      // Mock directory checks to throw an error
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(
        new Error("Error")
      );

      // Should not throw and return false
      const result = await hasReachedPhotoLimit("playground-1");

      expect(result).toBe(false);
    });
  });

  describe("getPhotoStorageStats", () => {
    it("should return correct storage statistics", async () => {
      // Mock directory checks
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // Photos directory exists
        .mockResolvedValueOnce({ exists: true }); // Thumbnails directory exists

      // Mock directory listing
      (FileSystem.readDirectoryAsync as jest.Mock)
        .mockResolvedValueOnce(["photo1.jpg", "photo2.jpg"]) // Photos
        .mockResolvedValueOnce(["thumbnail1.jpg", "thumbnail2.jpg"]); // Thumbnails

      // Mock file info
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true, size: 1000000 }) // photo1
        .mockResolvedValueOnce({ exists: true, size: 2000000 }) // photo2
        .mockResolvedValueOnce({ exists: true, size: 100000 }) // thumbnail1
        .mockResolvedValueOnce({ exists: true, size: 200000 }); // thumbnail2

      const stats = await getPhotoStorageStats();

      expect(stats).toEqual({
        photoCount: 2,
        totalSize: 3000000, // 1MB + 2MB
        thumbnailCount: 2,
        thumbnailSize: 300000, // 100KB + 200KB
      });
    });

    it("should handle errors gracefully", async () => {
      // Mock directory checks to throw an error
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(
        new Error("File system error")
      );

      // Should not throw and return default values
      const stats = await getPhotoStorageStats();

      expect(stats).toEqual({
        photoCount: 0,
        totalSize: 0,
        thumbnailCount: 0,
        thumbnailSize: 0,
      });
    });
  });

  describe("ensureDirectoriesExist", () => {
    it("should create directories if they don't exist", async () => {
      // Mock directory checks
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: false }) // Photos directory doesn't exist
        .mockResolvedValueOnce({ exists: false }); // Thumbnails directory doesn't exist

      // Mock directory creation
      (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);

      await ensureDirectoriesExist();

      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledTimes(2);
    });

    it("should not create directories if they already exist", async () => {
      // Mock directory checks
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // Photos directory exists
        .mockResolvedValueOnce({ exists: true }); // Thumbnails directory exists

      await ensureDirectoriesExist();

      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
    });

    it("should handle errors during directory creation", async () => {
      // Mock directory checks
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: false }) // Photos directory doesn't exist
        .mockResolvedValueOnce({ exists: false }); // Thumbnails directory doesn't exist

      // Mock directory creation to throw an error
      (FileSystem.makeDirectoryAsync as jest.Mock).mockRejectedValue(
        new Error("Directory creation error")
      );

      await expect(ensureDirectoriesExist()).rejects.toThrow(
        "Directory creation error"
      );
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(formatFileSize(500)).toBe("500 B");
    });

    it("should format kilobytes correctly", () => {
      expect(formatFileSize(1500)).toBe("1.5 KB");
    });

    it("should format megabytes correctly", () => {
      expect(formatFileSize(1500000)).toBe("1.4 MB");
    });
  });
});
