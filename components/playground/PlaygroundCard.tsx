import React, { useState, useRef, memo, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, Alert, Dimensions } from "react-native";
import { router } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import { Playground } from "../../types/playground";
import { usePlaygroundStore } from "../../store/playgroundStore";
import { ConfirmModal } from "../ui/Modal";
import { ThumbnailImage } from "../ui/OptimizedImage";
import { HapticFeedback } from "../../utils/performance";

interface PlaygroundCardProps {
  playground: Playground;
  testID?: string;
}

/**
 * PlaygroundCard component displays a summary of playground information
 * with swipe-to-delete functionality and navigation to detail view
 *
 * @param playground The playground data to display
 * @param testID Test identifier for testing
 */
const PlaygroundCardComponent: React.FC<PlaygroundCardProps> = ({
  playground,
  testID,
}) => {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const { deletePlayground } = usePlaygroundStore();
  const swipeableRef = React.useRef<Swipeable>(null);

  // Memoized computed values for performance
  const formatDate = useCallback((date: Date) => {
    return new Date(date).toLocaleDateString();
  }, []);

  const thumbnailImage = useMemo(
    () => (playground.photos.length > 0 ? playground.photos[0] : null),
    [playground.photos]
  );

  const getRatingEmoji = useCallback((rating: number) => {
    const emojis = ["", "⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];
    return emojis[Math.min(Math.max(Math.round(rating), 1), 5)];
  }, []);

  const getLocationDisplay = useCallback(() => {
    if (playground.location.address) {
      return playground.location.address;
    } else if (playground.location.coordinates) {
      return `${playground.location.coordinates.latitude.toFixed(
        4
      )}, ${playground.location.coordinates.longitude.toFixed(4)}`;
    }
    return "No location data";
  }, [playground.location]);

  // Handle card press to navigate to detail view
  const handleCardPress = useCallback(() => {
    HapticFeedback.light();
    router.push(`/playground/${playground.id}` as any);
  }, [playground.id]);

  // Handle delete confirmation
  const handleDelete = useCallback(async () => {
    try {
      HapticFeedback.heavy();
      await deletePlayground(playground.id);
      // Close swipeable if still open
      swipeableRef.current?.close();
    } catch (error) {
      HapticFeedback.error();
      Alert.alert("Error", "Failed to delete playground");
    }
  }, [playground.id, deletePlayground]);

  // Render right actions for swipe gesture
  const renderRightActions = () => {
    return (
      <TouchableOpacity
        className="bg-red-500 w-20 h-full justify-center items-center"
        onPress={() => setDeleteModalVisible(true)}
        testID={testID ? `${testID}-delete-action` : "playground-delete-action"}
      >
        <Text className="text-white font-bold">Delete</Text>
      </TouchableOpacity>
    );
  };

  // Calculate dimensions for the card and image
  const screenWidth = Dimensions.get("window").width;
  const imageSize = 80; // Fixed size for thumbnail

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        friction={2}
        rightThreshold={40}
        testID={testID ? `${testID}-swipeable` : "playground-swipeable"}
      >
        <TouchableOpacity
          onPress={handleCardPress}
          className="bg-white rounded-lg shadow-sm mb-3 overflow-hidden"
          activeOpacity={0.7}
          testID={testID || "playground-card"}
        >
          <View className="flex-row p-3">
            {/* Thumbnail */}
            <View className="mr-3">
              {thumbnailImage ? (
                <ThumbnailImage
                  source={{ uri: thumbnailImage }}
                  style={{ width: imageSize, height: imageSize }}
                  className="rounded-lg"
                  testID={testID ? `${testID}-image` : "playground-image"}
                />
              ) : (
                <View
                  className="bg-gray-200 rounded-lg items-center justify-center"
                  style={{ width: imageSize, height: imageSize }}
                >
                  <Text className="text-gray-400 text-3xl">🏞️</Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View className="flex-1 justify-between">
              <View>
                <Text
                  className="text-lg font-bold text-gray-800 mb-1"
                  numberOfLines={1}
                  testID={testID ? `${testID}-name` : "playground-name"}
                >
                  {playground.name}
                </Text>

                <Text
                  className="text-sm text-gray-600 mb-2"
                  numberOfLines={2}
                  testID={testID ? `${testID}-location` : "playground-location"}
                >
                  {getLocationDisplay()}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text
                  className="text-sm text-yellow-500"
                  testID={testID ? `${testID}-rating` : "playground-rating"}
                >
                  {getRatingEmoji(playground.rating)}
                </Text>

                <Text
                  className="text-xs text-gray-500"
                  testID={testID ? `${testID}-date` : "playground-date"}
                >
                  Added {formatDate(playground.dateAdded)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>

      {/* Delete confirmation modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDelete}
        title="Delete Playground"
        message={`Are you sure you want to delete "${playground.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        testID={testID ? `${testID}-delete-modal` : "playground-delete-modal"}
      />
    </>
  );
};

export const PlaygroundCard = memo(PlaygroundCardComponent);
