import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  takePhoto,
  selectPhoto,
  deletePhoto,
  getPlaygroundPhotos,
  hasReachedPhotoLimit,
} from "../../services/cameraService";
import { PhotoData, AppError } from "../../types/playground";

interface PhotoGalleryProps {
  playgroundId: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  editable?: boolean;
  maxPhotos?: number;
  className?: string;
  testID?: string;
}

interface PhotoViewerModalProps {
  visible: boolean;
  onClose: () => void;
  photos: PhotoData[];
  initialIndex: number;
  onDelete?: (photoUri: string) => void;
  editable?: boolean;
}

/**
 * PhotoGallery component with camera integration and photo management
 *
 * @param playgroundId ID of the playground for photo association
 * @param photos Array of photo URIs
 * @param onPhotosChange Callback when photos array changes
 * @param editable Whether photos can be added/deleted
 * @param maxPhotos Maximum number of photos allowed
 * @param className Additional styling classes
 * @param testID Test identifier
 */
export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  playgroundId,
  photos,
  onPhotosChange,
  editable = true,
  maxPhotos = 5,
  className = "",
  testID,
}) => {
  const [photoData, setPhotoData] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Load photo data when component mounts or photos change
  useEffect(() => {
    loadPhotoData();
  }, [playgroundId, photos]);

  /**
   * Load photo data from the camera service
   */
  const loadPhotoData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPlaygroundPhotos(playgroundId);

      // Filter to only include photos that are in the photos array
      const filteredData = data.filter((photo) => photos.includes(photo.uri));

      setPhotoData(filteredData);
      setError(null);
    } catch (err) {
      console.error("Error loading photo data:", err);
      setError("Failed to load photos");
    } finally {
      setLoading(false);
    }
  }, [playgroundId, photos]);

  /**
   * Handle adding a new photo from camera
   */
  const handleTakePhoto = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check photo limit
      const limitReached = await hasReachedPhotoLimit(playgroundId);
      if (limitReached || photos.length >= maxPhotos) {
        Alert.alert(
          "Photo Limit Reached",
          `You can only add up to ${maxPhotos} photos per playground.`,
          [{ text: "OK" }]
        );
        return;
      }

      const result = await takePhoto(playgroundId);

      if (!result.cancelled && result.uri) {
        const updatedPhotos = [...photos, result.uri];
        onPhotosChange(updatedPhotos);
        await loadPhotoData();
      }
    } catch (err) {
      const error = err as AppError;
      console.error("Error taking photo:", error);

      if (error.type === "permission") {
        Alert.alert("Camera Permission Required", error.message, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Settings",
            onPress: () => {
              /* Open settings */
            },
          },
        ]);
      } else {
        setError(error.message || "Failed to take photo");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle selecting a photo from gallery
   */
  const handleSelectPhoto = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check photo limit
      const limitReached = await hasReachedPhotoLimit(playgroundId);
      if (limitReached || photos.length >= maxPhotos) {
        Alert.alert(
          "Photo Limit Reached",
          `You can only add up to ${maxPhotos} photos per playground.`,
          [{ text: "OK" }]
        );
        return;
      }

      const result = await selectPhoto(playgroundId);

      if (!result.cancelled && result.uri) {
        const updatedPhotos = [...photos, result.uri];
        onPhotosChange(updatedPhotos);
        await loadPhotoData();
      }
    } catch (err) {
      const error = err as AppError;
      console.error("Error selecting photo:", error);

      if (error.type === "permission") {
        Alert.alert("Media Library Permission Required", error.message, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Settings",
            onPress: () => {
              /* Open settings */
            },
          },
        ]);
      } else {
        setError(error.message || "Failed to select photo");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle deleting a photo
   */
  const handleDeletePhoto = async (photoUri: string) => {
    try {
      setLoading(true);
      setError(null);

      // Delete from file system
      await deletePhoto(photoUri);

      // Update photos array
      const updatedPhotos = photos.filter((uri) => uri !== photoUri);
      onPhotosChange(updatedPhotos);

      // Reload photo data
      await loadPhotoData();
    } catch (err) {
      console.error("Error deleting photo:", err);
      setError("Failed to delete photo");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Show photo options (camera or gallery)
   */
  const showPhotoOptions = () => {
    Alert.alert("Add Photo", "Choose how you'd like to add a photo", [
      { text: "Cancel", style: "cancel" },
      { text: "Take Photo", onPress: handleTakePhoto },
      { text: "Choose from Gallery", onPress: handleSelectPhoto },
    ]);
  };

  /**
   * Open photo viewer modal
   */
  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index);
    setViewerVisible(true);
  };

  // Calculate thumbnail size based on screen width
  const screenWidth = Dimensions.get("window").width;
  const thumbnailSize = (screenWidth - 48) / 3; // 3 columns with padding

  // Container classes
  const containerClasses = `${className}`;

  return (
    <View className={containerClasses} testID={testID}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-900">
          Photos ({photos.length}/{maxPhotos})
        </Text>
        {editable && photos.length < maxPhotos && (
          <Button
            title="Add Photo"
            size="sm"
            onPress={showPhotoOptions}
            testID={testID ? `${testID}-add-photo` : "photo-gallery-add"}
          />
        )}
      </View>

      {/* Error message */}
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      )}

      {/* Loading state */}
      {loading && (
        <LoadingSpinner
          size="small"
          message="Processing photo..."
          className="py-4"
        />
      )}

      {/* Photo grid */}
      {photoData.length > 0 ? (
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          className="max-h-96"
        >
          <View className="flex-row flex-wrap justify-between">
            {photoData.map((photo, index) => (
              <TouchableOpacity
                key={photo.uri}
                onPress={() => openPhotoViewer(index)}
                className="mb-2"
                style={{ width: thumbnailSize, height: thumbnailSize }}
                testID={testID ? `${testID}-photo-${index}` : `photo-${index}`}
              >
                <Image
                  source={{ uri: photo.thumbnail || photo.uri }}
                  style={{ width: thumbnailSize, height: thumbnailSize }}
                  contentFit="cover"
                  className="rounded-lg"
                  placeholder="📷"
                  transition={200}
                />

                {/* Delete button overlay (only in edit mode) */}
                {editable && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        "Delete Photo",
                        "Are you sure you want to delete this photo?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => handleDeletePhoto(photo.uri),
                          },
                        ]
                      );
                    }}
                    className="absolute top-1 right-1 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                    testID={
                      testID
                        ? `${testID}-delete-${index}`
                        : `delete-photo-${index}`
                    }
                  >
                    <Text className="text-white text-xs font-bold">×</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 items-center justify-center">
          <Text className="text-gray-500 text-center mb-4">
            No photos added yet
          </Text>
          {editable && (
            <Button
              title="Add First Photo"
              variant="outline"
              onPress={showPhotoOptions}
              testID={
                testID ? `${testID}-add-first` : "photo-gallery-add-first"
              }
            />
          )}
        </View>
      )}

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        photos={photoData}
        initialIndex={selectedPhotoIndex}
        onDelete={editable ? handleDeletePhoto : undefined}
        editable={editable}
      />
    </View>
  );
};

/**
 * Full-screen photo viewer modal component
 */
const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  visible,
  onClose,
  photos,
  initialIndex,
  onDelete,
  editable = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const currentPhoto = photos[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleDelete = () => {
    if (onDelete && currentPhoto) {
      Alert.alert(
        "Delete Photo",
        "Are you sure you want to delete this photo?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              onDelete(currentPhoto.uri);
              onClose();
            },
          },
        ]
      );
    }
  };

  if (!currentPhoto) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      animationType="fade"
      className="bg-black max-w-full max-h-full m-0"
      contentClassName="flex-1"
      showCloseButton={false}
    >
      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 bg-black/50">
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-white text-lg">✕</Text>
          </TouchableOpacity>

          <Text className="text-white font-medium">
            {currentIndex + 1} of {photos.length}
          </Text>

          {editable && onDelete && (
            <TouchableOpacity onPress={handleDelete} className="p-2">
              <Text className="text-red-400 text-lg">🗑</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Photo */}
        <View className="flex-1 items-center justify-center">
          <Image
            source={{ uri: currentPhoto.uri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
            placeholder="📷"
          />
        </View>

        {/* Navigation */}
        {photos.length > 1 && (
          <View className="flex-row items-center justify-between p-4 bg-black/50">
            <TouchableOpacity
              onPress={goToPrevious}
              className="bg-white/20 rounded-full p-3"
            >
              <Text className="text-white text-lg">‹</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToNext}
              className="bg-white/20 rounded-full p-3"
            >
              <Text className="text-white text-lg">›</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default PhotoGallery;
