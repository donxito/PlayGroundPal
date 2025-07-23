import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import EditPlaygroundScreen from "../playground/edit/[id]";
import { usePlaygroundStore } from "../../store/playgroundStore";
import { PlaygroundFormData } from "../../types/playground";

// Mock dependencies
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("../../store/playgroundStore", () => ({
  usePlaygroundStore: jest.fn(),
}));

// Create a mock for the PlaygroundForm component
const mockPlaygroundFormProps: {
  onSubmit: jest.Mock;
  onCancel: jest.Mock;
  onChange: jest.Mock;
} = {
  onSubmit: jest.fn().mockImplementation(() => Promise.resolve()),
  onCancel: jest.fn(),
  onChange: jest.fn(),
};

// Define the props type outside the mock
type PlaygroundFormMockProps = {
  onSubmit: (data: PlaygroundFormData) => Promise<void>;
  onCancel: () => void;
  onChange?: () => void;
  testID?: string;
};

// Mock PlaygroundForm component
jest.mock("../../components/playground/PlaygroundForm", () => {
  return {
    PlaygroundForm: (props: any) => {
      const { onSubmit, onCancel, onChange, testID } = props;
      const React = require("react");
      const { View, Text, TouchableOpacity } = require("react-native");

      // Store the props for testing
      mockPlaygroundFormProps.onSubmit = onSubmit;
      mockPlaygroundFormProps.onCancel = onCancel;
      mockPlaygroundFormProps.onChange = onChange || (() => {});

      return React.createElement(
        View,
        { testID },
        React.createElement(Text, null, "Mock PlaygroundForm"),
        React.createElement(
          TouchableOpacity,
          {
            testID: `${testID}-submit`,
            onPress: () =>
              onSubmit({
                name: "Updated Playground",
                location: { address: "123 Test St" },
                rating: 5,
                notes: "Updated notes",
                photos: [],
              }),
          },
          React.createElement(Text, null, "Submit")
        ),
        React.createElement(
          TouchableOpacity,
          {
            testID: `${testID}-cancel`,
            onPress: onCancel,
          },
          React.createElement(Text, null, "Cancel")
        ),
        React.createElement(
          TouchableOpacity,
          {
            testID: `${testID}-change`,
            onPress: onChange || (() => {}),
          },
          React.createElement(Text, null, "Change")
        )
      );
    },
  };
});

// Access the mocked Alert from react-native
import { Alert } from "react-native";
const mockAlert = (Alert.alert as jest.Mock);

describe("EditPlaygroundScreen", () => {
  // Setup mocks
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  const mockPlayground = {
    id: "test-id",
    name: "Test Playground",
    location: {
      address: "123 Test St",
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
    },
    rating: 4,
    notes: "Test notes",
    photos: ["test-photo.jpg"],
    dateAdded: new Date("2023-01-01"),
    dateModified: new Date("2023-01-02"),
  };

  const mockUpdatePlayground = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "test-id" });
    (usePlaygroundStore as jest.Mock).mockReturnValue({
      playgrounds: [mockPlayground],
      updatePlayground: mockUpdatePlayground,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with playground data", async () => {
    const { getByText, getByTestId } = render(<EditPlaygroundScreen />);

    await waitFor(() => {
      expect(getByText(`Edit ${mockPlayground.name}`)).toBeTruthy();
      expect(getByTestId("edit-playground-form")).toBeTruthy();
    });
  });

  it("navigates back if playground not found", async () => {
    // Mock implementation for Alert.alert that synchronously calls the callback
    mockAlert.mockImplementation((title, message, buttons) => {
      // Simulate pressing the OK button synchronously
      if (buttons && buttons.length > 0 && buttons[0].onPress) {
        buttons[0].onPress();
      }
    });

    // Clear any previous mock calls
    mockRouter.back.mockClear();
    mockAlert.mockClear();

    (usePlaygroundStore as jest.Mock).mockReturnValue({
      playgrounds: [],
      updatePlayground: mockUpdatePlayground,
    });

    const component = render(<EditPlaygroundScreen />);

    // Wait for the component to fully render and useEffect to execute
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Check that router.back was called (which happens after Alert.alert's callback)
    expect(mockRouter.back).toHaveBeenCalled();

    // Verify Alert was called with correct arguments
    expect(mockAlert).toHaveBeenCalledWith(
      "Error",
      "Playground not found",
      expect.arrayContaining([
        expect.objectContaining({
          text: "OK",
          onPress: expect.any(Function),
        }),
      ])
    );

    component.unmount();
  });

  it("handles form submission correctly", async () => {
    // Mock implementation for Alert.alert that synchronously calls the callback
    mockAlert.mockImplementation((title, message, buttons) => {
      // Simulate pressing the OK button synchronously
      if (buttons && buttons.length > 0 && buttons[0].onPress) {
        buttons[0].onPress();
      }
    });

    // Clear any previous mock calls
    mockUpdatePlayground.mockClear();
    mockRouter.push.mockClear();
    mockAlert.mockClear();

    // Mock updatePlayground to return a resolved promise
    mockUpdatePlayground.mockResolvedValue(undefined);

    const { getByTestId } = render(<EditPlaygroundScreen />);

    await waitFor(() => {
      expect(getByTestId("edit-playground-form")).toBeTruthy();
    });

    // Mock the onSubmit function call from PlaygroundForm
    await act(async () => {
      await mockPlaygroundFormProps.onSubmit({
        name: "Updated Playground",
        location: mockPlayground.location,
        rating: 5,
        notes: "Updated notes",
        photos: mockPlayground.photos,
      });
    });

    // Wait for Alert to be called
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled();
    }, { timeout: 3000 });

    expect(mockUpdatePlayground).toHaveBeenCalledWith(
      "test-id",
      expect.objectContaining({
        name: "Updated Playground",
        rating: 5,
        notes: "Updated notes",
      })
    );

    // Check that Alert.alert was called with the correct arguments
    expect(mockAlert).toHaveBeenCalledWith(
      "Success",
      "Playground updated successfully!",
      expect.arrayContaining([
        expect.objectContaining({
          text: "OK",
          onPress: expect.any(Function),
        }),
      ])
    );

    // Check that router.push was called with the correct path (after Alert callback)
    expect(mockRouter.push).toHaveBeenCalledWith(
      `/playground/${mockPlayground.id}`
    );
  });

  it("shows unsaved changes warning when cancelling with changes", async () => {
    // Mock implementation for Alert.alert to simulate pressing "Yes"
    mockAlert.mockImplementation((title, message, buttons) => {
      // Simulate pressing the "Yes" button (second button)
      if (buttons && buttons.length > 1 && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    // Clear any previous mock calls
    mockRouter.push.mockClear();
    mockAlert.mockClear();

    const { getByTestId } = render(<EditPlaygroundScreen />);

    await waitFor(() => {
      expect(getByTestId("edit-playground-form")).toBeTruthy();
    });

    // Simulate form change to set hasUnsavedChanges to true
    act(() => {
      mockPlaygroundFormProps.onChange();
    });

    // Trigger cancel
    act(() => {
      mockPlaygroundFormProps.onCancel();
    });

    // Wait for Alert to be called
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Verify Alert was called with correct arguments
    expect(mockAlert).toHaveBeenCalledWith(
      "Unsaved Changes",
      "You have unsaved changes. Are you sure you want to cancel?",
      expect.arrayContaining([
        expect.objectContaining({ text: "No", style: "cancel" }),
        expect.objectContaining({ text: "Yes", onPress: expect.any(Function) }),
      ])
    );

    // Check that router.push was called with the correct path (after Alert callback)
    expect(mockRouter.push).toHaveBeenCalledWith(
      `/playground/${mockPlayground.id}`
    );
  });

  it("navigates back directly when cancelling without changes", async () => {
    // Clear any previous mock calls
    mockRouter.push.mockClear();

    const { getByTestId } = render(<EditPlaygroundScreen />);

    await waitFor(() => {
      expect(getByTestId("edit-playground-form")).toBeTruthy();
    });

    // Trigger cancel without changes
    await act(async () => {
      mockPlaygroundFormProps.onCancel();
    });

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/playground/${mockPlayground.id}`
    );
  });
});
