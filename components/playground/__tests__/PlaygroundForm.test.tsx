import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { PlaygroundForm } from "../PlaygroundForm";
import { Alert } from "react-native";
import {
  getCurrentLocation,
  geocodeAddress,
  checkLocationAvailability,
} from "../../../services/locationService";
import { act } from "react-test-renderer";

// Mock dependencies
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}));

jest.mock("../../../services/locationService", () => ({
  getCurrentLocation: jest.fn(),
  geocodeAddress: jest.fn(),
  checkLocationAvailability: jest.fn(),
  formatDistance: jest.fn(),
}));

jest.mock("../../../services/cameraService", () => ({
  takePhoto: jest.fn(),
  selectPhoto: jest.fn(),
  getPlaygroundPhotos: jest.fn().mockResolvedValue([]),
  hasReachedPhotoLimit: jest.fn().mockResolvedValue(false),
}));

// Mock BackHandler for navigation guard
jest.mock("react-native/Libraries/Utilities/BackHandler", () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock Alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("PlaygroundForm", () => {
  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with empty initial data", async () => {
    const { getByTestId, getByText } = render(
      <PlaygroundForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="test-form"
      />
    );

    expect(getByTestId("test-form-name")).toBeTruthy();
    expect(getByTestId("test-form-location")).toBeTruthy();
    expect(getByTestId("test-form-rating")).toBeTruthy();
    expect(getByTestId("test-form-notes")).toBeTruthy();
    expect(getByTestId("test-form-photos")).toBeTruthy();
    await waitFor(() => getByText("Add Playground"));
  });

  it("renders correctly with initial data in edit mode", () => {
    const initialData = {
      name: "Test Playground",
      location: { address: "123 Test St" },
      rating: 4,
      notes: "Test notes",
      photos: [],
    };

    const { getByTestId, getByText } = render(
      <PlaygroundForm
        initialData={initialData}
        playgroundId="test-id"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isEditing={true}
        testID="test-form"
      />
    );

    expect(getByTestId("test-form-name").props.value).toBe("Test Playground");
    expect(getByTestId("test-form-location").props.value).toBe("123 Test St");
    expect(getByTestId("test-form-notes").props.value).toBe("Test notes");
    expect(getByText("Save Changes")).toBeTruthy();
  });

  it("validates required fields on submit", async () => {
    const { getByTestId, getByText, queryByText } = render(
      <PlaygroundForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="test-form"
      />
    );

    // Submit with empty form
    fireEvent.press(getByTestId("test-form-submit"));

    // Wait for validation to complete
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Validation Error",
        "Please fix the errors in the form before submitting.",
        [{ text: "OK" }]
      );
    });

    // Check that onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const { getByTestId } = render(
      <PlaygroundForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="test-form"
      />
    );

    // Fill out form
    fireEvent.changeText(getByTestId("test-form-name"), "Test Playground");
    fireEvent.changeText(getByTestId("test-form-location"), "123 Test St");

    // Set rating
    fireEvent.press(getByTestId("test-form-rating-star-4"));

    fireEvent.changeText(getByTestId("test-form-notes"), "Test notes");

    // Submit form
    await act(async () => {
      fireEvent.press(getByTestId("test-form-submit"));
    });

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: "Test Playground",
        location: { address: "123 Test St" },
        rating: 4,
        notes: "Test notes",
        photos: [],
      });
    });
  });

  it("resets form when reset button is pressed", () => {
    const { getByTestId } = render(
      <PlaygroundForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="test-form"
      />
    );

    // Fill out form
    fireEvent.changeText(getByTestId("test-form-name"), "Test Playground");
    fireEvent.changeText(getByTestId("test-form-location"), "123 Test St");

    // Reset form
    fireEvent.press(getByTestId("test-form-reset"));

    // Check that form was reset
    expect(getByTestId("test-form-name").props.value).toBe("");
    expect(getByTestId("test-form-location").props.value).toBe("");
  });

  it("calls onCancel when cancel button is pressed", () => {
    const { getByTestId } = render(
      <PlaygroundForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="test-form"
      />
    );

    fireEvent.press(getByTestId("test-form-cancel"));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("gets current location when button is pressed", async () => {
    // Mock successful location retrieval
    const mockLocation = {
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      },
      address: "123 Test St",
      timestamp: new Date(),
    };

    (checkLocationAvailability as jest.Mock).mockResolvedValue({
      servicesEnabled: true,
      permissionGranted: true,
      canRequestPermission: true,
    });

    (getCurrentLocation as jest.Mock).mockResolvedValue(mockLocation);

    const { getByTestId } = render(
      <PlaygroundForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="test-form"
      />
    );

    // Press get location button
    await act(async () => {
      fireEvent.press(getByTestId("test-form-get-location"));
    });

    // Wait for location to be retrieved
    await waitFor(() => {
      expect(checkLocationAvailability).toHaveBeenCalled();
      expect(getCurrentLocation).toHaveBeenCalled();
    });

    // Check that location was updated in form
    expect(getByTestId("test-form-location").props.value).toBe("123 Test St");
  });

  it("shows error when location services are disabled", async () => {
    // Mock location services disabled
    (checkLocationAvailability as jest.Mock).mockResolvedValue({
      servicesEnabled: false,
      permissionGranted: false,
      canRequestPermission: false,
    });

    const { getByTestId } = render(
      <PlaygroundForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="test-form"
      />
    );

    // Press get location button
    await act(async () => {
      fireEvent.press(getByTestId("test-form-get-location"));
    });

    // Wait for alert to be shown
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Location Services Disabled",
        "Please enable location services in your device settings to use this feature.",
        [{ text: "OK" }]
      );
    });
  });
});
