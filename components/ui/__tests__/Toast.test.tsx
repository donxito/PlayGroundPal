/**
 * Toast Component Tests
 *
 * Tests for the toast notification system
 * Requirements: 1.5, 6.5, 10.3, 10.4
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { ToastProvider, useToast } from "../Toast";
import { TouchableOpacity, Text } from "react-native";
import { AppError } from "../../../types/playground";

// Test component that uses toast
const TestComponent: React.FC = () => {
  const toast = useToast();

  return (
    <>
      <TouchableOpacity
        testID="show-success"
        onPress={() => toast.showSuccess("Success!", "Operation completed")}
      >
        <Text>Show Success</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="show-error"
        onPress={() => toast.showError("Error!", "Something went wrong")}
      >
        <Text>Show Error</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="show-warning"
        onPress={() => toast.showWarning("Warning!", "Be careful")}
      >
        <Text>Show Warning</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="show-info"
        onPress={() => toast.showInfo("Info!", "Just so you know")}
      >
        <Text>Show Info</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="show-app-error"
        onPress={() => {
          const appError: AppError = {
            type: "storage",
            message: "Storage failed",
            recoverable: true,
            timestamp: new Date(),
          };
          toast.showAppError(appError);
        }}
      >
        <Text>Show App Error</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="show-with-action"
        onPress={() =>
          toast.showSuccess("Success!", "With action", 5000, {
            action: {
              label: "Undo",
              onPress: () => console.log("Action pressed"),
            },
          })
        }
      >
        <Text>Show With Action</Text>
      </TouchableOpacity>

      <TouchableOpacity testID="dismiss-all" onPress={() => toast.dismissAll()}>
        <Text>Dismiss All</Text>
      </TouchableOpacity>
    </>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(<ToastProvider>{component}</ToastProvider>);
};

describe("Toast System", () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("throws error when useToast is used outside provider", () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useToast must be used within a ToastProvider");

    console.error = originalError;
  });

  it("shows success toast", async () => {
    const { getByTestId, getByText } = renderWithProvider(<TestComponent />);

    act(() => {
      fireEvent.press(getByTestId("show-success"));
    });

    await waitFor(() => {
      expect(getByText("Success!")).toBeTruthy();
      expect(getByText("Operation completed")).toBeTruthy();
    });
  });

  it("shows error toast", async () => {
    const { getByTestId, getByText } = renderWithProvider(<TestComponent />);

    act(() => {
      fireEvent.press(getByTestId("show-error"));
    });

    await waitFor(() => {
      expect(getByText("Error!")).toBeTruthy();
      expect(getByText("Something went wrong")).toBeTruthy();
    });
  });

  it("shows warning toast", async () => {
    const { getByTestId, getByText } = renderWithProvider(<TestComponent />);

    act(() => {
      fireEvent.press(getByTestId("show-warning"));
    });

    await waitFor(() => {
      expect(getByText("Warning!")).toBeTruthy();
      expect(getByText("Be careful")).toBeTruthy();
    });
  });

  it("shows info toast", async () => {
    const { getByTestId, getByText } = renderWithProvider(<TestComponent />);

    act(() => {
      fireEvent.press(getByTestId("show-info"));
    });

    await waitFor(() => {
      expect(getByText("Info!")).toBeTruthy();
      expect(getByText("Just so you know")).toBeTruthy();
    });
  });

  it("shows app error toast with user-friendly message", async () => {
    const { getByTestId, getByText } = renderWithProvider(<TestComponent />);

    act(() => {
      fireEvent.press(getByTestId("show-app-error"));
    });

    await waitFor(() => {
      expect(
        getByText("Unable to save data. Please check your device storage.")
      ).toBeTruthy();
    });
  });

  it("shows toast with action button", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const { getByTestId } = renderWithProvider(<TestComponent />);

    act(() => {
      fireEvent.press(getByTestId("show-with-action"));
    });

    await waitFor(() => {
      const actionButton = getByTestId(/toast-action-/);
      expect(actionButton).toBeTruthy();

      fireEvent.press(actionButton);
      expect(consoleSpy).toHaveBeenCalledWith("Action pressed");
    });

    consoleSpy.mockRestore();
  });

  it("dismisses toast when dismiss button is pressed", async () => {
    const { getByTestId, getByText, queryByText } = renderWithProvider(
      <TestComponent />
    );

    act(() => {
      fireEvent.press(getByTestId("show-success"));
    });

    await waitFor(() => {
      expect(getByText("Success!")).toBeTruthy();
    });

    const dismissButton = getByTestId(/toast-dismiss-/);

    act(() => {
      fireEvent.press(dismissButton);
    });

    await waitFor(() => {
      expect(queryByText("Success!")).toBeNull();
    });
  });

  it("auto-dismisses toast after duration", async () => {
    const { getByTestId, getByText, queryByText } = renderWithProvider(
      <TestComponent />
    );

    act(() => {
      fireEvent.press(getByTestId("show-success"));
    });

    await waitFor(() => {
      expect(getByText("Success!")).toBeTruthy();
    });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(queryByText("Success!")).toBeNull();
    });
  });

  it("dismisses all toasts", async () => {
    const { getByTestId, getByText, queryByText } = renderWithProvider(
      <TestComponent />
    );

    // Show multiple toasts
    act(() => {
      fireEvent.press(getByTestId("show-success"));
      fireEvent.press(getByTestId("show-error"));
    });

    await waitFor(() => {
      expect(getByText("Success!")).toBeTruthy();
      expect(getByText("Error!")).toBeTruthy();
    });

    // Dismiss all
    act(() => {
      fireEvent.press(getByTestId("dismiss-all"));
    });

    await waitFor(() => {
      expect(queryByText("Success!")).toBeNull();
      expect(queryByText("Error!")).toBeNull();
    });
  });

  it("limits maximum number of toasts", async () => {
    const { getByTestId, queryByText } = renderWithProvider(<TestComponent />);

    // Show more toasts than the limit (default is 3)
    act(() => {
      fireEvent.press(getByTestId("show-success"));
      fireEvent.press(getByTestId("show-error"));
      fireEvent.press(getByTestId("show-warning"));
      fireEvent.press(getByTestId("show-info"));
    });

    await waitFor(() => {
      // First toast should be removed
      expect(queryByText("Success!")).toBeNull();
      // Last 3 should be visible
      expect(queryByText("Error!")).toBeTruthy();
      expect(queryByText("Warning!")).toBeTruthy();
      expect(queryByText("Info!")).toBeTruthy();
    });
  });

  it("calls onDismiss callback when toast is dismissed", async () => {
    const onDismiss = jest.fn();

    const TestComponentWithCallback = () => {
      const toast = useToast();

      return (
        <TouchableOpacity
          testID="show-with-callback"
          onPress={() =>
            toast.showSuccess("Success!", "With callback", 4000, {
              onDismiss,
            })
          }
        >
          <Text>Show With Callback</Text>
        </TouchableOpacity>
      );
    };

    const { getByTestId } = renderWithProvider(<TestComponentWithCallback />);

    act(() => {
      fireEvent.press(getByTestId("show-with-callback"));
    });

    // Auto-dismiss after duration
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });
  });
});
