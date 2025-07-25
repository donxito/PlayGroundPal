import React, { useState, useEffect } from "react";
import { View, Text, SafeAreaView, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { PlaygroundForm } from "../../../components/playground/PlaygroundForm";
import { usePlaygroundStore } from "../../../store/playgroundStore";
import { PlaygroundFormData, Playground } from "../../../types/playground";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { useNavigationGuard } from "../../../hooks/useNavigationGuard";

/**
 * Edit Playground Screen
 *
 * Implements a screen for editing existing playgrounds with:
 * - PlaygroundForm component pre-populated with existing data
 * - Form submission handling with store integration
 * - Validation error handling
 * - Navigation back to detail view after successful update
 * - Unsaved changes warning when cancelling
 *
 */
export default function EditPlaygroundScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playgrounds, updatePlayground } = usePlaygroundStore();

  const [playground, setPlayground] = useState<Playground | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Navigation guard for unsaved changes
  const { guardedNavigate } = useNavigationGuard({
    hasUnsavedChanges,
    message:
      "You have unsaved changes. Are you sure you want to leave without saving?",
    onConfirmLeave: () => {
      setHasUnsavedChanges(false);
    },
  });

  // Find the playground by ID
  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "No playground ID provided");
      router.back();
      return;
    }

    const foundPlayground = playgrounds.find((p) => p.id === id);
    if (foundPlayground) {
      setPlayground(foundPlayground);
    } else {
      // Playground not found, go back
      Alert.alert("Error", "Playground not found", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }

    setLoading(false);
  }, [id, playgrounds, router]);

  /**
   * Handle form submission
   *
   * @param formData Playground form data
   */
  const handleSubmit = async (formData: PlaygroundFormData) => {
    if (!playground) return;

    try {
      setLoading(true);

      // Update playground in store
      await updatePlayground(playground.id, formData);

      // Show success message
      Alert.alert("Success", "Playground updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to detail view
            router.push(`/playground/${playground.id}`);
          },
        },
      ]);

      setHasUnsavedChanges(false);
    } catch (error) {
      // Show error message
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update playground"
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form cancellation with unsaved changes warning
   */
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      guardedNavigate(`/playground/${playground?.id}`);
    } else {
      router.push(`/playground/${playground?.id}`);
    }
  };

  /**
   * Handle form changes to track unsaved changes
   */
  const handleFormChange = () => {
    setHasUnsavedChanges(true);
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

  // Prepare initial form data from playground
  const initialData: PlaygroundFormData = {
    name: playground.name,
    location: playground.location,
    rating: playground.rating,
    notes: playground.notes || "",
    photos: playground.photos,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header with back button */}
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Edit Playground",
          headerBackTitle: "Back",
          headerTintColor: "#3498db",
          headerStyle: {
            backgroundColor: "#ffffff",
          },
        }}
      />

      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-800">
            Edit {playground.name}
          </Text>
          <Text className="text-gray-600">
            Update playground details and save changes
          </Text>
        </View>

        {/* Playground Form */}
        <PlaygroundForm
          initialData={initialData}
          playgroundId={playground.id}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEditing={true}
          testID="edit-playground-form"
          onChange={handleFormChange}
        />
      </View>
    </SafeAreaView>
  );
}
