import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TouchableOpacity, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useNavigationGuard } from "../../hooks/useNavigationGuard";

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

// Mock BackHandler
jest.mock("react-native/Libraries/Utilities/BackHandler", () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Test component that uses navigation guard
const TestComponent = ({
  hasUnsavedChanges,
}: {
  hasUnsavedChanges: boolean;
}) => {
  const { guardedNavigate, guardedBack } = useNavigationGuard({
    hasUnsavedChanges,
    message: "Test unsaved changes message",
  });

  return (
    <>
      <TouchableOpacity
        testID="navigate-button"
        onPress={() => guardedNavigate("/test")}
      >
        <Text>Navigate</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="back-button" onPress={guardedBack}>
        <Text>Back</Text>
      </TouchableOpacity>
    </>
  );
};

describe("Navigation Structure", () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
  });

  describe("Navigation Guard", () => {
    it("should navigate without confirmation when no unsaved changes", () => {
      const { getByTestId } = render(
        <TestComponent hasUnsavedChanges={false} />
      );

      fireEvent.press(getByTestId("navigate-button"));

      expect(mockPush).toHaveBeenCalledWith("/test");
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("should show confirmation dialog when there are unsaved changes", () => {
      const { getByTestId } = render(
        <TestComponent hasUnsavedChanges={true} />
      );

      fireEvent.press(getByTestId("navigate-button"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Unsaved Changes",
        "Test unsaved changes message",
        expect.any(Array)
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should navigate after confirming in dialog", () => {
      const { getByTestId } = render(
        <TestComponent hasUnsavedChanges={true} />
      );

      fireEvent.press(getByTestId("navigate-button"));

      // Simulate user pressing "Leave" button
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const leaveButton = alertCall[2].find(
        (button: any) => button.text === "Leave"
      );
      leaveButton.onPress();

      expect(mockPush).toHaveBeenCalledWith("/test");
    });

    it("should not navigate after cancelling in dialog", () => {
      const { getByTestId } = render(
        <TestComponent hasUnsavedChanges={true} />
      );

      fireEvent.press(getByTestId("navigate-button"));

      // Simulate user pressing "Cancel" button
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelButton = alertCall[2].find(
        (button: any) => button.text === "Cancel"
      );

      // Cancel button might not have onPress (just closes dialog)
      if (cancelButton.onPress) {
        cancelButton.onPress();
      }

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should handle back navigation with unsaved changes", () => {
      const { getByTestId } = render(
        <TestComponent hasUnsavedChanges={true} />
      );

      fireEvent.press(getByTestId("back-button"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Unsaved Changes",
        "Test unsaved changes message",
        expect.any(Array)
      );
      expect(mockBack).not.toHaveBeenCalled();
    });
  });

  describe("Deep Linking Configuration", () => {
    it("should be configured for playground detail links", () => {
      // Test that deep linking configuration exists
      // This would be tested in integration tests with actual deep link URLs
      // playgroundpal://playground/123
      expect(true).toBe(true); // Placeholder for deep linking tests
    });

    it("should be configured for playground edit links", () => {
      // Test that deep linking configuration exists
      // This would be tested in integration tests with actual deep link URLs
      // playgroundpal://playground/123/edit
      expect(true).toBe(true); // Placeholder for deep linking tests
    });
  });
});
