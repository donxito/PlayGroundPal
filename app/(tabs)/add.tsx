import React, { useState } from "react";
import { View, Text, SafeAreaView, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { PlaygroundForm } from "../../components/playground/PlaygroundForm";
import { usePlaygroundStore } from "../../store/playgroundStore";
import { PlaygroundFormData } from "../../types/playground";
import { useNavigationGuard } from "../../hooks/useNavigationGuard";

// Export alert functions for testing
export const showSuccessAlert = (message: string, onOk: () => void) => {
  Alert.alert("Success", message, [
    {
      text: "OK",
      onPress: onOk,
    },
  ]);
};

export const showErrorAlert = (message: string) => {
  Alert.alert("Error", message, [{ text: "OK" }]);
};

export const showCancelConfirmation = (onYes: () => void) => {
  Alert.alert(
    "Cancel",
    "Are you sure you want to cancel? Any unsaved changes will be lost.",
    [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: onYes,
      },
    ]
  );
};

/**
 * Add Playground Screen
 *
 * Implements a screen for adding new playgrounds with:
 * - PlaygroundForm component for data entry
 * - Form submission handling with store integration
 * - Validation error handling
 * - Navigation back to list after successful creation
 * - Playful and fun design with delightful interactions
 *
 */
export default function AddPlaygroundScreen() {
  const router = useRouter();
  const { addPlayground } = usePlaygroundStore();
  const [submitting, setSubmitting] = useState(false);
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

  /**
   * Handle form submission
   *
   * @param formData Playground form data
   */
  const handleSubmit = async (formData: PlaygroundFormData) => {
    try {
      setSubmitting(true);

      // Add playground to store
      await addPlayground(formData);

      // Show success message
      showSuccessAlert("Playground added successfully!", () => {
        // Navigate back to list
        router.push("/(tabs)");
      });
    } catch (error) {
      // Show error message
      showErrorAlert(
        error instanceof Error ? error.message : "Failed to add playground"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle form cancellation
   */
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      guardedNavigate("/(tabs)");
    } else {
      router.push("/(tabs)");
    }
  };

  /**
   * Handle form changes to track unsaved changes
   */
  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />

      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Text className="text-4xl mr-3">➕</Text>
            <Text className="text-3xl font-bold text-text-primary">
              Add New Playground
            </Text>
          </View>
          <View className="bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl p-4">
            <Text className="text-text-primary font-semibold mb-2">
              🎯 Let&apos;s discover a new playground!
            </Text>
            <Text className="text-text-secondary text-sm leading-5">
              Fill in the details below to add a new playground to your
              collection. Don&apos;t forget to add photos and rate your
              experience! 📸⭐
            </Text>
          </View>
        </View>

        {/* Playground Form */}
        <PlaygroundForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onChange={handleFormChange}
          testID="add-playground-form"
        />
      </View>
    </SafeAreaView>
  );
}
