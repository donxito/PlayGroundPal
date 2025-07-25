import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { usePlaygroundStore } from "../../store/playgroundStore";
import { PhotoGallery } from "../../components/ui/PhotoGallery";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ConfirmModal } from "../../components/ui/Modal";
import {
  formatDistance,
  calculateDistanceFromCurrent,
} from "../../services/locationService";
import { Playground } from "../../types/playground";
import { MotiView } from "moti";

/**
 * Playground Detail Screen
 *
 * Displays detailed information about a specific playground
 * Includes photo gallery, location information, and action buttons
 *
 * Requirements: 4.3, 2.4, 3.4, 5.1, 6.2
 */
export default function PlaygroundDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playgrounds, deletePlayground } = usePlaygroundStore();

  const [playground, setPlayground] = useState<Playground | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Find the playground by ID
  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    const foundPlayground = playgrounds.find((p) => p.id === id);
    if (foundPlayground) {
      setPlayground(foundPlayground);

      // Calculate distance if coordinates are available
      if (foundPlayground.location.coordinates) {
        calculateDistanceFromCurrent(foundPlayground.location)
          .then((dist) => setDistance(dist))
          .catch((err) => console.error("Error calculating distance:", err));
      }
    } else {
      // Playground not found, go back
      Alert.alert("Error", "Playground not found");
      router.back();
    }

    setLoading(false);
  }, [id, playgrounds, router]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  // Get rating emoji
  const getRatingEmoji = (rating: number) => {
    const emojis = ["", "⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];
    return emojis[Math.min(Math.max(Math.round(rating), 1), 5)];
  };

  // Handle edit button press
  const handleEdit = () => {
    if (playground) {
      router.push(`/playground/edit/${playground.id}` as any);
    }
  };

  // Handle delete button press
  const handleDelete = async () => {
    if (!playground) return;

    try {
      await deletePlayground(playground.id);
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to delete playground");
    }
  };

  // Handle opening maps app with coordinates
  const handleOpenMaps = () => {
    if (!playground?.location.coordinates) return;

    const { latitude, longitude } = playground.location.coordinates;
    const label = encodeURIComponent(playground.name);

    // Create map URL (works for both iOS and Android)
    const url = `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&t=m&hl=en&q=${label}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Error", "Maps app not available");
        }
      })
      .catch((err) => console.error("Error opening maps:", err));
  };

  // If loading or playground not found
  if (loading || !playground) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <LoadingSpinner overlay message="Loading playground..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header with back button */}
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: playground.name,
          headerBackTitle: "Back",
          headerTintColor: "#3498db",
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          // Enhanced header animations
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
          },
          animation:
            Platform.OS === "ios" ? "slide_from_right" : "slide_from_bottom",
          animationDuration: 300,
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          className="bg-white p-4 mb-2"
        >
          <PhotoGallery
            playgroundId={playground.id}
            photos={playground.photos}
            onPhotosChange={() => {}} // Read-only in detail view
            editable={false}
            testID="playground-detail-gallery"
          />
        </MotiView>

        {/* Playground Details */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 100 }}
          className="bg-white p-4 mb-2"
        >
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            {playground.name}
          </Text>

          <View className="flex-row items-center mb-4">
            <Text className="text-yellow-500 text-lg mr-2">
              {getRatingEmoji(playground.rating)}
            </Text>
            <Text className="text-gray-600">
              Added {formatDate(playground.dateAdded)}
            </Text>
          </View>

          {playground.notes && (
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-800 mb-1">
                Notes
              </Text>
              <Text className="text-gray-700">{playground.notes}</Text>
            </View>
          )}
        </MotiView>

        {/* Location Information */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
          className="bg-white p-4 mb-2"
        >
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Location
          </Text>

          {playground.location.address && (
            <Text className="text-gray-700 mb-2">
              {playground.location.address}
            </Text>
          )}

          {playground.location.coordinates && (
            <View className="mb-2">
              <Text className="text-gray-700">
                {playground.location.coordinates.latitude.toFixed(6)},{" "}
                {playground.location.coordinates.longitude.toFixed(6)}
              </Text>

              {distance !== null && (
                <Text className="text-gray-600 mt-1">
                  {formatDistance(distance)} from current location
                </Text>
              )}
            </View>
          )}

          {playground.location.coordinates && (
            <TouchableOpacity
              onPress={handleOpenMaps}
              className="flex-row items-center bg-blue-500 rounded-lg py-2 px-4 mt-2"
              testID="open-maps-button"
            >
              <Ionicons name="navigate" size={20} color="white" />
              <Text className="text-white font-medium ml-2">Open in Maps</Text>
            </TouchableOpacity>
          )}
        </MotiView>

        {/* Action Buttons */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 300 }}
          className="p-4 flex-row justify-between"
        >
          <TouchableOpacity
            onPress={handleEdit}
            className="bg-blue-500 rounded-lg py-3 px-6 flex-1 mr-2 items-center"
            testID="edit-playground-button"
          >
            <Text className="text-white font-medium">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDeleteModalVisible(true)}
            className="bg-red-500 rounded-lg py-3 px-6 flex-1 ml-2 items-center"
            testID="delete-playground-button"
          >
            <Text className="text-white font-medium">Delete</Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDelete}
        title="Delete Playground"
        message={`Are you sure you want to delete "${playground.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        testID="playground-delete-modal"
      />
    </SafeAreaView>
  );
}
