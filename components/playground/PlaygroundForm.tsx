import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { RatingSelector } from "../ui/RatingSelector";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { PhotoGallery } from "../ui/PhotoGallery";
import { Modal } from "../ui/Modal";
import { PlaygroundFormData, VALIDATION_RULES } from "../../types/playground";
import {
  getCurrentLocation,
  checkLocationAvailability,
} from "../../services/locationService";

interface PlaygroundFormProps {
  initialData?: Partial<PlaygroundFormData>;
  playgroundId?: string;
  onSubmit: (data: PlaygroundFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  className?: string;
  testID?: string;
  onChange?: () => void;
}

/**
 * PlaygroundForm component for adding and editing playgrounds
 *
 * @param initialData Initial form data for editing
 * @param playgroundId ID of playground being edited (if applicable)
 * @param onSubmit Function called when form is submitted
 * @param onCancel Function called when form is cancelled
 * @param isEditing Whether form is in edit mode
 * @param className Additional styling classes
 * @param testID Test identifier
 */
export const PlaygroundForm: React.FC<PlaygroundFormProps> = ({
  initialData,
  playgroundId = "",
  onSubmit,
  onCancel,
  isEditing = false,
  className = "",
  testID,
  onChange,
}) => {
  // Form state
  const [formData, setFormData] = useState<PlaygroundFormData>({
    name: "",
    location: { address: "" },
    rating: 0,
    notes: "",
    photos: [],
    ...initialData,
  });

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading state
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Location modal state
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  /**
   * Handle form field changes
   */
  const handleChange = (field: keyof PlaygroundFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    // Notify parent component of changes
    if (onChange) {
      onChange();
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Playground name is required";
    } else if (formData.name.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
      newErrors.name = `Name cannot exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`;
    }

    // Validate location
    if (!formData.location.address && !formData.location.coordinates) {
      newErrors.location = "Location is required (address or coordinates)";
    }

    // Validate rating
    if (formData.rating < VALIDATION_RULES.MIN_RATING) {
      newErrors.rating = "Please select a rating";
    }

    // Validate notes (if provided)
    if (
      formData.notes &&
      formData.notes.length > VALIDATION_RULES.NOTES_MAX_LENGTH
    ) {
      newErrors.notes = `Notes cannot exceed ${VALIDATION_RULES.NOTES_MAX_LENGTH} characters`;
    }

    // Set errors and return validation result
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      Alert.alert(
        "Validation Error",
        "Please fix the errors in the form before submitting.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save playground",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form reset
   */
  const handleReset = () => {
    // If editing, reset to initial data
    if (isEditing && initialData) {
      setFormData({
        name: "",
        location: { address: "" },
        rating: 0,
        notes: "",
        photos: [],
        ...initialData,
      });
    } else {
      // If creating new, reset to empty form
      setFormData({
        name: "",
        location: { address: "" },
        rating: 0,
        notes: "",
        photos: [],
      });
    }

    setErrors({});
  };

  /**
   * Handle photo changes
   */
  const handlePhotosChange = (photos: string[]) => {
    handleChange("photos", photos);
  };

  /**
   * Handle getting current location
   */
  const handleGetCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      // Check location availability first
      const availability = await checkLocationAvailability();

      if (!availability.servicesEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services in your device settings to use this feature.",
          [{ text: "OK" }]
        );
        return;
      }

      if (
        !availability.permissionGranted &&
        !availability.canRequestPermission
      ) {
        Alert.alert(
          "Location Permission Required",
          "Please enable location permission in your device settings to use this feature.",
          [{ text: "OK" }]
        );
        return;
      }

      // Get current location
      const locationData = await getCurrentLocation();

      // Update form data with location
      setFormData((prev) => ({
        ...prev,
        location: locationData,
      }));

      // Clear location error if it exists
      if (errors.location) {
        setErrors((prev) => ({
          ...prev,
          location: "",
        }));
      }
    } catch (error) {
      console.error("Error getting current location:", error);

      // Show error message
      Alert.alert(
        "Location Error",
        error instanceof Error
          ? error.message
          : "Failed to get current location. Please try again or enter address manually.",
        [{ text: "OK" }]
      );
    } finally {
      setLocationLoading(false);
    }
  };

  // Container classes
  const containerClasses = `${className}`;

  return (
    <View className={containerClasses} testID={testID}>
      {loading && (
        <LoadingSpinner
          message="Saving playground..."
          overlay
          testID={testID ? `${testID}-loading` : "playground-form-loading"}
        />
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Name Input */}
        <Input
          label="Playground Name"
          value={formData.name}
          onChangeText={(text) => handleChange("name", text)}
          placeholder="Enter playground name"
          error={errors.name}
          disabled={loading}
          maxLength={VALIDATION_RULES.NAME_MAX_LENGTH}
          testID={testID ? `${testID}-name` : "playground-form-name"}
        />

        {/* Location Input with Capture Button */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Location
            </Text>
            <Button
              title="Get Current Location"
              size="sm"
              variant="outline"
              onPress={handleGetCurrentLocation}
              disabled={loading || locationLoading}
              loading={locationLoading}
              testID={
                testID
                  ? `${testID}-get-location`
                  : "playground-form-get-location"
              }
            />
          </View>

          <Input
            value={formData.location.address || ""}
            onChangeText={(text) =>
              handleChange("location", { ...formData.location, address: text })
            }
            placeholder="Enter playground address"
            error={errors.location}
            disabled={loading || locationLoading}
            testID={testID ? `${testID}-location` : "playground-form-location"}
            labelClassName="hidden"
          />

          {formData.location.coordinates && (
            <View className="mt-1 flex-row items-center">
              <Text className="text-xs text-gray-500">
                GPS: {formData.location.coordinates.latitude.toFixed(6)},{" "}
                {formData.location.coordinates.longitude.toFixed(6)}
              </Text>
              <TouchableOpacity
                onPress={() => setLocationModalVisible(true)}
                className="ml-2 bg-blue-100 rounded-full px-2 py-1"
                testID={
                  testID
                    ? `${testID}-view-location`
                    : "playground-form-view-location"
                }
              >
                <Text className="text-xs text-blue-700">View</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Rating Selector */}
        <View className="mb-4">
          <RatingSelector
            rating={formData.rating}
            onRatingChange={(rating) => handleChange("rating", rating)}
            disabled={loading}
            showLabel={true}
            label="Rating"
            testID={testID ? `${testID}-rating` : "playground-form-rating"}
          />
          {errors.rating && (
            <Text className="text-sm text-red-600 mt-1">{errors.rating}</Text>
          )}
        </View>

        {/* Notes Input */}
        <Input
          label="Notes"
          value={formData.notes || ""}
          onChangeText={(text) => handleChange("notes", text)}
          placeholder="Add notes about this playground (optional)"
          error={errors.notes}
          disabled={loading}
          multiline
          numberOfLines={4}
          maxLength={VALIDATION_RULES.NOTES_MAX_LENGTH}
          testID={testID ? `${testID}-notes` : "playground-form-notes"}
        />

        {/* Photos */}
        <View className="mb-6">
          <PhotoGallery
            playgroundId={playgroundId}
            photos={formData.photos}
            onPhotosChange={handlePhotosChange}
            editable={!loading}
            testID={testID ? `${testID}-photos` : "playground-form-photos"}
          />
        </View>

        {/* Form Actions */}
        <View className="flex-row justify-between mt-4 mb-8">
          <Button
            title="Cancel"
            variant="outline"
            onPress={onCancel}
            disabled={loading}
            className="flex-1 mr-3"
            testID={testID ? `${testID}-cancel` : "playground-form-cancel"}
          />

          <Button
            title="Reset"
            variant="secondary"
            onPress={handleReset}
            disabled={loading}
            className="flex-1 mr-3"
            testID={testID ? `${testID}-reset` : "playground-form-reset"}
          />

          <Button
            title={isEditing ? "Save Changes" : "Add Playground"}
            onPress={handleSubmit}
            disabled={loading}
            className="flex-1"
            loading={loading}
            testID={testID ? `${testID}-submit` : "playground-form-submit"}
          />
        </View>
      </ScrollView>

      {/* Location Modal */}
      <Modal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        title="Location Details"
        testID={
          testID ? `${testID}-location-modal` : "playground-form-location-modal"
        }
      >
        <View className="p-4">
          {formData.location.coordinates && (
            <View>
              <Text className="text-base font-medium mb-2">
                GPS Coordinates:
              </Text>
              <Text className="mb-4">
                Latitude: {formData.location.coordinates.latitude.toFixed(6)}
                {"\n"}
                Longitude: {formData.location.coordinates.longitude.toFixed(6)}
                {formData.location.coordinates.accuracy &&
                  `\nAccuracy: ±${Math.round(
                    formData.location.coordinates.accuracy
                  )}m`}
              </Text>

              {formData.location.address && (
                <>
                  <Text className="text-base font-medium mb-2">Address:</Text>
                  <Text className="mb-4">{formData.location.address}</Text>
                </>
              )}

              <View className="flex-row justify-end mt-4">
                <Button
                  title="Close"
                  variant="outline"
                  onPress={() => setLocationModalVisible(false)}
                  testID={
                    testID
                      ? `${testID}-location-modal-close`
                      : "playground-form-location-modal-close"
                  }
                />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default PlaygroundForm;
