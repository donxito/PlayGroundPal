import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { Button, Input, RatingSelector, PhotoGallery } from "../ui";
import { usePlaygroundStore } from "../../store/playgroundStore";
import { PlaygroundFormData, VALIDATION_RULES } from "../../types/playground";
import {
  getCurrentLocation,
  geocodeAddress,
} from "../../services/locationService";

interface PlaygroundFormProps {
  initialData?: Partial<PlaygroundFormData> & { id?: string };
  onSubmit?: (data: PlaygroundFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

/**
 * PlaygroundForm component for adding and editing playgrounds
 *
 * Requirements: 1.1, 1.2, 1.5, 5.1, 5.2
 *
 * @param initialData Optional initial data for editing mode
 * @param onSubmit Optional callback when form is submitted successfully
 * @param onCancel Optional callback when form is cancelled
 * @param isEdit Whether the form is in edit mode
 */
export const PlaygroundForm: React.FC<PlaygroundFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  // Generate temporary ID for new playgrounds
  const [tempId] = useState(() => `temp_${Date.now()}`);

  // Form state
  const [formData, setFormData] = useState<PlaygroundFormData>({
    name: initialData?.name || "",
    location: initialData?.location || { address: "" },
    rating: initialData?.rating || 0,
    notes: initialData?.notes || "",
    photos: initialData?.photos || [],
  });

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Store access
  const { addPlayground, updatePlayground, clearError } = usePlaygroundStore();

  // Clear store errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Handle input changes
  const handleChange = (field: keyof PlaygroundFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user makes changes
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle location input change
  const handleLocationChange = (address: string) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        address,
      },
    }));

    // Clear location error when user makes changes
    if (errors.location) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  };

  // Get current location
  const handleGetCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const locationData = await getCurrentLocation();

      setFormData((prev) => ({
        ...prev,
        location: locationData,
      }));

      // Clear location error if it exists
      if (errors.location) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.location;
          return newErrors;
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to get current location";

      setErrors((prev) => ({
        ...prev,
        location: errorMessage,
      }));

      Alert.alert(
        "Location Error",
        "Could not get your current location. Please enter the address manually.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Validate address when manually entered
  const handleValidateAddress = async () => {
    if (!formData.location.address) {
      setErrors((prev) => ({
        ...prev,
        location: "Address is required",
      }));
      return;
    }

    try {
      setIsLoadingLocation(true);
      const locationData = await geocodeAddress(formData.location.address);

      setFormData((prev) => ({
        ...prev,
        location: locationData,
      }));

      // Clear location error if it exists
      if (errors.location) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.location;
          return newErrors;
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to validate address";

      setErrors((prev) => ({
        ...prev,
        location: errorMessage,
      }));
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
      newErrors.name = `Name cannot exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`;
    }

    // Validate location
    if (!formData.location.address && !formData.location.coordinates) {
      newErrors.location = "Location is required";
    }

    // Validate rating
    if (formData.rating < VALIDATION_RULES.MIN_RATING) {
      newErrors.rating = "Please select a rating";
    }

    // Validate notes
    if (
      formData.notes &&
      formData.notes.length > VALIDATION_RULES.NOTES_MAX_LENGTH
    ) {
      newErrors.notes = `Notes cannot exceed ${VALIDATION_RULES.NOTES_MAX_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // If we have an onSubmit callback, use it
      if (onSubmit) {
        onSubmit(formData);
        return;
      }

      // Otherwise, use the store directly
      if (isEdit && initialData?.id) {
        await updatePlayground(initialData.id, formData);
      } else {
        await addPlayground(formData);
      }

      // Reset form after successful submission
      if (!isEdit) {
        resetForm();
      }

      Alert.alert(
        "Success",
        isEdit
          ? "Playground updated successfully"
          : "Playground added successfully",
        [{ text: "OK" }]
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while saving the playground";

      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: "",
      location: { address: "" },
      rating: 0,
      notes: "",
      photos: [],
    });
    setErrors({});
  };

  // Handle cancel button
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      resetForm();
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* Form title */}
        <Text className="text-2xl font-bold mb-6">
          {isEdit ? "Edit Playground" : "Add New Playground"}
        </Text>

        {/* Name input */}
        <Input
          label="Playground Name"
          value={formData.name}
          onChangeText={(text) => handleChange("name", text)}
          placeholder="Enter playground name"
          error={errors.name}
          maxLength={VALIDATION_RULES.NAME_MAX_LENGTH}
          testID="playground-name-input"
        />

        {/* Location section */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Location
          </Text>

          <View className="flex-row items-center mb-2">
            <Button
              title="Get Current Location"
              variant="primary"
              size="sm"
              onPress={handleGetCurrentLocation}
              loading={isLoadingLocation}
              disabled={isLoadingLocation}
              className="flex-1 mr-2"
              testID="get-location-button"
            />

            <Button
              title="Validate Address"
              variant="outline"
              size="sm"
              onPress={handleValidateAddress}
              loading={isLoadingLocation}
              disabled={isLoadingLocation || !formData.location.address}
              className="flex-1"
              testID="validate-address-button"
            />
          </View>

          <Input
            value={formData.location.address || ""}
            onChangeText={handleLocationChange}
            placeholder="Enter address manually"
            error={errors.location}
            testID="location-input"
          />

          {/* Display coordinates if available */}
          {formData.location.coordinates && (
            <View className="bg-gray-100 p-2 rounded-md mt-2">
              <Text className="text-xs text-gray-600">
                Latitude: {formData.location.coordinates.latitude.toFixed(6)}
              </Text>
              <Text className="text-xs text-gray-600">
                Longitude: {formData.location.coordinates.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Rating selector */}
        <View className="mb-4">
          <RatingSelector
            rating={formData.rating}
            onRatingChange={(rating) => handleChange("rating", rating)}
            label="Rating"
            showLabel={true}
            testID="rating-selector"
          />
          {errors.rating && (
            <Text className="text-sm text-red-600 mt-1">{errors.rating}</Text>
          )}
        </View>

        {/* Notes input */}
        <Input
          label="Notes"
          value={formData.notes || ""}
          onChangeText={(text) => handleChange("notes", text)}
          placeholder="Add notes about this playground (optional)"
          multiline={true}
          numberOfLines={4}
          error={errors.notes}
          maxLength={VALIDATION_RULES.NOTES_MAX_LENGTH}
          testID="notes-input"
        />

        {/* Photo Gallery */}
        <View className="mb-4">
          <PhotoGallery
            playgroundId={initialData?.id || tempId}
            photos={formData.photos}
            onPhotosChange={(photos) => handleChange("photos", photos)}
            editable={true}
            maxPhotos={VALIDATION_RULES.MAX_PHOTOS}
            testID="playground-form-photos"
          />
        </View>

        {/* Form actions */}
        <View className="flex-row mt-4">
          <Button
            title="Cancel"
            variant="outline"
            onPress={handleCancel}
            className="flex-1 mr-2"
            disabled={isSubmitting}
            testID="cancel-button"
          />

          <Button
            title={isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
            variant="primary"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            className="flex-1"
            testID="submit-button"
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default PlaygroundForm;
