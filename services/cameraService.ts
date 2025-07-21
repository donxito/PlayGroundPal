/**
 * Camera Service for PlayGroundPal
 *
 * Handles camera permissions, photo capture, compression, and file management
 * Supports both camera capture and image picker functionality
 *
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */

import {
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import {
  CameraPermissionStatus,
  PhotoCaptureResult,
  PhotoData,
  AppError,
  VALIDATION_RULES,
} from "../types/playground";

// Constants for camera service
const PHOTO_QUALITY = 0.7; // Compression quality (0-1)
const THUMBNAIL_SIZE = 200; // Thumbnail width/height in pixels
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB max file size
//const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
const PHOTOS_DIRECTORY = `${FileSystem.documentDirectory}photos/`;
const THUMBNAILS_DIRECTORY = `${FileSystem.documentDirectory}thumbnails/`;

/**
 * Request camera permissions from the user
 *
 * @returns Promise that resolves with permission status
 * Requirements: 2.1
 */
export const requestCameraPermissions =
  async (): Promise<CameraPermissionStatus> => {
    try {
      // Check current permission status first
      const { status: cameraStatus } = await getCameraPermissionsAsync();

      if (cameraStatus === "granted") {
        return {
          granted: true,
          canAskAgain: true,
          status: "granted",
        };
      }

      // Request permission if not already granted
      const { status } = await requestCameraPermissionsAsync();

      // Create a consistent response object
      return {
        granted: status === "granted",
        canAskAgain: status !== "denied", // If denied, we can't ask again
        status: status as "granted" | "denied" | "undetermined",
      };
    } catch (error) {
      console.error("Error requesting camera permissions:", error);

      return {
        granted: false,
        canAskAgain: false,
        status: "denied",
      };
    }
  };

/**
 * Request media library permissions for selecting photos
 *
 * @returns Promise that resolves with permission status
 * Requirements: 2.1
 */
export const requestMediaLibraryPermissions =
  async (): Promise<CameraPermissionStatus> => {
    try {
      // Check current permission status first
      const { status: mediaStatus } =
        await ImagePicker.getMediaLibraryPermissionsAsync();

      if (mediaStatus === "granted") {
        return {
          granted: true,
          canAskAgain: true,
          status: "granted",
        };
      }

      // Request permission if not already granted
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      // Create a consistent response object
      return {
        granted: status === "granted",
        canAskAgain: status !== "denied", // If denied, we can't ask again
        status: status as "granted" | "denied" | "undetermined",
      };
    } catch (error) {
      console.error("Error requesting media library permissions:", error);

      return {
        granted: false,
        canAskAgain: false,
        status: "denied",
      };
    }
  };

/**
 * Take a photo using the device camera
 *
 * @param playgroundId - ID of the playground to associate with the photo
 * @returns Promise that resolves with photo data
 * @throws AppError if camera permission is denied or photo capture fails
 * Requirements: 2.1, 2.2, 2.3
 */
export const takePhoto = async (
  playgroundId: string
): Promise<PhotoCaptureResult> => {
  try {
    // Check camera permissions
    const permissionStatus = await requestCameraPermissions();

    if (!permissionStatus.granted) {
      const error: AppError = {
        type: "permission",
        message: "Camera permission is required to take photos of playgrounds.",
        code: "CAMERA_PERMISSION_DENIED",
        recoverable: permissionStatus.canAskAgain,
        timestamp: new Date(),
      };
      throw error;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "Images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: PHOTO_QUALITY,
    });

    if (result.cancelled) {
      return {
        uri: "",
        width: 0,
        height: 0,
        cancelled: true,
      };
    }

    const asset = result.assets?.[0];

    if (!asset || !asset.uri) {
      const error: AppError = {
        type: "system",
        message: "No photo asset returned from camera",
        code: "CAMERA_NO_ASSET",
        recoverable: true,
        timestamp: new Date(),
      };
      throw error;
    }

    // Validate photo
    await validatePhoto(asset.uri);

    // Process and save the photo
    const photoData = await processAndSavePhoto(asset.uri, playgroundId);

    return {
      uri: photoData.uri,
      width: asset.width || 0,
      height: asset.height || 0,
      cancelled: false,
    };
  } catch (error) {
    if ((error as AppError).type) {
      throw error;
    }

    // Handle other camera errors
    const cameraError: AppError = {
      type: "system",
      message: "Failed to capture photo. Please try again.",
      code: error instanceof Error ? error.message : "CAMERA_ERROR",
      recoverable: true,
      timestamp: new Date(),
    };

    console.error("Camera error:", error);
    throw cameraError;
  }
};

/**
 * Select a photo from the device's media library
 *
 * @param playgroundId - ID of the playground to associate with the photo
 * @returns Promise that resolves with photo data
 * @throws AppError if media library permission is denied or photo selection fails
 * Requirements: 2.3, 2.5
 */
export const selectPhoto = async (
  playgroundId: string
): Promise<PhotoCaptureResult> => {
  try {
    // Check media library permissions
    const permissionStatus = await requestMediaLibraryPermissions();

    if (!permissionStatus.granted) {
      const error: AppError = {
        type: "permission",
        message:
          "Media library permission is required to select photos for playgrounds.",
        code: "MEDIA_PERMISSION_DENIED",
        recoverable: permissionStatus.canAskAgain,
        timestamp: new Date(),
      };
      throw error;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "Images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: PHOTO_QUALITY,
    });

    if (result.cancelled) {
      return {
        uri: "",
        width: 0,
        height: 0,
        cancelled: true,
      };
    }

    const asset = result.assets?.[0];

    if (!asset || !asset.uri) {
      const error: AppError = {
        type: "system",
        message: "No photo asset returned from media library",
        code: "MEDIA_NO_ASSET",
        recoverable: true,
        timestamp: new Date(),
      };
      throw error;
    }

    // Validate photo
    await validatePhoto(asset.uri);

    // Process and save the photo
    const photoData = await processAndSavePhoto(asset.uri, playgroundId);

    return {
      uri: photoData.uri,
      width: asset.width || 0,
      height: asset.height || 0,
      cancelled: false,
    };
  } catch (error) {
    if ((error as AppError).type) {
      throw error;
    }

    // Handle other media library errors
    const mediaError: AppError = {
      type: "system",
      message: "Failed to select photo. Please try again.",
      code: error instanceof Error ? error.message : "MEDIA_ERROR",
      recoverable: true,
      timestamp: new Date(),
    };

    console.error("Media library error:", error);
    throw mediaError;
  }
};

/**
 * Process and save a photo to the app's file system
 *
 * @param uri - URI of the photo to process
 * @param playgroundId - ID of the playground to associate with the photo
 * @returns Promise that resolves with processed photo data
 * @throws AppError if photo processing or saving fails
 * Requirements: 2.3, 2.5
 */
export const processAndSavePhoto = async (
  uri: string,
  playgroundId: string
): Promise<PhotoData> => {
  try {
    // Ensure directories exist
    await ensureDirectoriesExist();

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `playground_${playgroundId}_${timestamp}.jpg`;
    const thumbnailFilename = `thumbnail_${playgroundId}_${timestamp}.jpg`;

    // Compress the photo
    const compressedPhoto = await manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: PHOTO_QUALITY, format: SaveFormat.JPEG }
    );

    // Generate thumbnail
    const thumbnail = await manipulateAsync(
      uri,
      [{ resize: { width: THUMBNAIL_SIZE } }],
      { compress: 0.5, format: SaveFormat.JPEG }
    );

    // Save files
    const photoUri = `${PHOTOS_DIRECTORY}${filename}`;
    const thumbnailUri = `${THUMBNAILS_DIRECTORY}${thumbnailFilename}`;

    await FileSystem.copyAsync({
      from: compressedPhoto.uri,
      to: photoUri,
    });

    await FileSystem.copyAsync({
      from: thumbnail.uri,
      to: thumbnailUri,
    });

    // Return photo data
    return {
      uri: photoUri,
      filename,
      playgroundId,
      timestamp: new Date(),
      thumbnail: thumbnailUri,
    };
  } catch (error) {
    const processingError: AppError = {
      type: "system",
      message: "Failed to process and save photo.",
      code: error instanceof Error ? error.message : "PHOTO_PROCESSING_ERROR",
      recoverable: true,
      timestamp: new Date(),
    };

    console.error("Photo processing error:", error);
    throw processingError;
  }
};

/**
 * Delete a photo and its thumbnail from the file system
 *
 * @param uri - URI of the photo to delete
 * @returns Promise that resolves when deletion is complete
 * Requirements: 2.5
 */
export const deletePhoto = async (uri: string): Promise<void> => {
  try {
    // Check if the file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      return;
    }

    // Delete the photo
    await FileSystem.deleteAsync(uri);

    // Try to delete the thumbnail if it exists
    const thumbnailUri = uri
      .replace(PHOTOS_DIRECTORY, THUMBNAILS_DIRECTORY)
      .replace("playground_", "thumbnail_");

    const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailUri);
    if (thumbnailInfo.exists) {
      await FileSystem.deleteAsync(thumbnailUri);
    }
  } catch (error) {
    console.error("Error deleting photo:", error);
    // Don't throw here, just log the error
    // We don't want to block the UI if photo deletion fails
  }
};

/**
 * Delete all photos associated with a playground
 *
 * @param playgroundId - ID of the playground
 * @returns Promise that resolves when deletion is complete
 * Requirements: 2.5
 */
export const deletePlaygroundPhotos = async (
  playgroundId: string
): Promise<void> => {
  try {
    // Get all photos in the directory
    const photoFiles = await FileSystem.readDirectoryAsync(PHOTOS_DIRECTORY);
    const thumbnailFiles = await FileSystem.readDirectoryAsync(
      THUMBNAILS_DIRECTORY
    );

    // Filter photos by playground ID
    const playgroundPhotos = photoFiles.filter((filename) =>
      filename.includes(`playground_${playgroundId}_`)
    );
    const playgroundThumbnails = thumbnailFiles.filter((filename) =>
      filename.includes(`thumbnail_${playgroundId}_`)
    );

    // Delete all matching photos
    const photoDeletions = playgroundPhotos.map((filename) =>
      FileSystem.deleteAsync(`${PHOTOS_DIRECTORY}${filename}`)
    );
    const thumbnailDeletions = playgroundThumbnails.map((filename) =>
      FileSystem.deleteAsync(`${THUMBNAILS_DIRECTORY}${filename}`)
    );

    await Promise.all([...photoDeletions, ...thumbnailDeletions]);
  } catch (error) {
    console.error("Error deleting playground photos:", error);
    // Don't throw here, just log the error
  }
};

/**
 * Clean up orphaned photos that are not associated with any playground
 *
 * @param activePlaygroundIds - Array of active playground IDs
 * @returns Promise that resolves with number of deleted photos
 * Requirements: 2.5
 */
export const cleanupOrphanedPhotos = async (
  activePlaygroundIds: string[]
): Promise<number> => {
  try {
    // Get all photos in the directory
    const photoFiles = await FileSystem.readDirectoryAsync(PHOTOS_DIRECTORY);
    const thumbnailFiles = await FileSystem.readDirectoryAsync(
      THUMBNAILS_DIRECTORY
    );

    // Find orphaned photos
    const orphanedPhotos = photoFiles.filter((filename) => {
      // Extract playground ID from filename
      const match = filename.match(/playground_([^_]+)_/);
      if (!match || !match[1]) return false;
      const playgroundId = match[1];
      return !activePlaygroundIds.includes(playgroundId);
    });

    // Find orphaned thumbnails
    const orphanedThumbnails = thumbnailFiles.filter((filename) => {
      // Extract playground ID from filename
      const match = filename.match(/thumbnail_([^_]+)_/);
      if (!match || !match[1]) return false;
      const playgroundId = match[1];
      return !activePlaygroundIds.includes(playgroundId);
    });

    // Delete orphaned files
    const photoDeletions = orphanedPhotos.map((filename) =>
      FileSystem.deleteAsync(`${PHOTOS_DIRECTORY}${filename}`)
    );
    const thumbnailDeletions = orphanedThumbnails.map((filename) =>
      FileSystem.deleteAsync(`${THUMBNAILS_DIRECTORY}${filename}`)
    );

    await Promise.all([...photoDeletions, ...thumbnailDeletions]);

    return orphanedPhotos.length + orphanedThumbnails.length;
  } catch (error) {
    console.error("Error cleaning up orphaned photos:", error);
    return 0;
  }
};

/**
 * Get all photos associated with a playground
 *
 * @param playgroundId - ID of the playground
 * @returns Promise that resolves with array of photo data
 * Requirements: 2.3, 2.4
 */
export const getPlaygroundPhotos = async (
  playgroundId: string
): Promise<PhotoData[]> => {
  try {
    // Ensure directories exist
    await ensureDirectoriesExist();

    // Check if photos directory exists
    const photoDirInfo = await FileSystem.getInfoAsync(PHOTOS_DIRECTORY);
    if (!photoDirInfo.exists) {
      return [];
    }

    // Get all photos in the directory
    const photoFiles = await FileSystem.readDirectoryAsync(PHOTOS_DIRECTORY);

    // Filter photos by playground ID
    const playgroundPhotos = photoFiles.filter((filename) =>
      filename.includes(`playground_${playgroundId}_`)
    );

    // Create PhotoData objects
    const photoData: PhotoData[] = playgroundPhotos.map((filename) => {
      const uri = `${PHOTOS_DIRECTORY}${filename}`;
      const thumbnailFilename = filename.replace("playground_", "thumbnail_");
      const thumbnailUri = `${THUMBNAILS_DIRECTORY}${thumbnailFilename}`;
      const timestamp = parseInt(filename.split("_")[2].split(".")[0], 10);

      return {
        uri,
        filename,
        playgroundId,
        timestamp: new Date(timestamp),
        thumbnail: thumbnailUri,
      };
    });

    // Sort by timestamp (newest first)
    return photoData.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  } catch (error) {
    console.error("Error getting playground photos:", error);
    return [];
  }
};

/**
 * Validate a photo file
 *
 * @param uri - URI of the photo to validate
 * @throws AppError if photo is invalid
 * Requirements: 2.5
 */
export const validatePhoto = async (uri: string): Promise<void> => {
  // Check if file exists
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) {
    const error: AppError = {
      type: "validation",
      message: "Photo file does not exist.",
      code: "PHOTO_NOT_FOUND",
      recoverable: false,
      timestamp: new Date(),
    };
    throw error;
  }

  // Check file size
  if (fileInfo.size && fileInfo.size > MAX_PHOTO_SIZE) {
    const error: AppError = {
      type: "validation",
      message: `Photo is too large. Maximum size is ${
        MAX_PHOTO_SIZE / (1024 * 1024)
      }MB.`,
      code: "PHOTO_TOO_LARGE",
      recoverable: true,
      timestamp: new Date(),
    };
    throw error;
  }

  // We can't easily check MIME type in React Native/Expo
  // But we can check file extension as a basic validation
  const extension = uri.split(".").pop()?.toLowerCase();
  if (!extension || !["jpg", "jpeg", "png"].includes(extension)) {
    const error: AppError = {
      type: "validation",
      message: "Invalid photo format. Only JPG and PNG are supported.",
      code: "INVALID_PHOTO_FORMAT",
      recoverable: true,
      timestamp: new Date(),
    };
    throw error;
  }
};

/**
 * Check if a playground has reached the maximum number of photos
 *
 * @param playgroundId - ID of the playground to check
 * @returns Promise that resolves with boolean indicating if limit is reached
 * Requirements: 2.5
 */
export const hasReachedPhotoLimit = async (
  playgroundId: string
): Promise<boolean> => {
  try {
    const photos = await getPlaygroundPhotos(playgroundId);
    return photos.length >= VALIDATION_RULES.MAX_PHOTOS;
  } catch (error) {
    console.error("Error checking photo limit:", error);
    return false;
  }
};

/**
 * Get storage usage statistics for photos
 *
 * @returns Promise that resolves with storage statistics
 */
export const getPhotoStorageStats = async (): Promise<{
  photoCount: number;
  totalSize: number;
  thumbnailCount: number;
  thumbnailSize: number;
}> => {
  try {
    // Ensure directories exist
    await ensureDirectoriesExist();

    // Get all photos and thumbnails
    const photoFiles = await FileSystem.readDirectoryAsync(PHOTOS_DIRECTORY);
    const thumbnailFiles = await FileSystem.readDirectoryAsync(
      THUMBNAILS_DIRECTORY
    );

    // Calculate total size
    let totalPhotoSize = 0;
    let totalThumbnailSize = 0;

    for (const filename of photoFiles) {
      const fileInfo = await FileSystem.getInfoAsync(
        `${PHOTOS_DIRECTORY}${filename}`
      );
      if (fileInfo.exists && fileInfo.size) {
        totalPhotoSize += fileInfo.size;
      }
    }

    for (const filename of thumbnailFiles) {
      const fileInfo = await FileSystem.getInfoAsync(
        `${THUMBNAILS_DIRECTORY}${filename}`
      );
      if (fileInfo.exists && fileInfo.size) {
        totalThumbnailSize += fileInfo.size;
      }
    }

    return {
      photoCount: photoFiles.length,
      totalSize: totalPhotoSize,
      thumbnailCount: thumbnailFiles.length,
      thumbnailSize: totalThumbnailSize,
    };
  } catch (error) {
    console.error("Error getting photo storage stats:", error);
    return {
      photoCount: 0,
      totalSize: 0,
      thumbnailCount: 0,
      thumbnailSize: 0,
    };
  }
};

// Helper functions

/**
 * Ensure that photo directories exist
 */
export const ensureDirectoriesExist = async (): Promise<void> => {
  try {
    // Check if photos directory exists
    const photoDirInfo = await FileSystem.getInfoAsync(PHOTOS_DIRECTORY);
    if (!photoDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PHOTOS_DIRECTORY, {
        intermediates: true,
      });
    }

    // Check if thumbnails directory exists
    const thumbnailDirInfo = await FileSystem.getInfoAsync(
      THUMBNAILS_DIRECTORY
    );
    if (!thumbnailDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(THUMBNAILS_DIRECTORY, {
        intermediates: true,
      });
    }
  } catch (error) {
    console.error("Error ensuring directories exist:", error);
    throw error;
  }
};

/**
 * Format file size for display
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.2 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};
