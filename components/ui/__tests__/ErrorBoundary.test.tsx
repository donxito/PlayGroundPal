/**
 * ErrorBoundary Component Tests
 *
 * Tests for the global error boundary component
 * Requirements: 1.5, 10.3, 10.4
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ErrorBoundary, useErrorHandler } from "../ErrorBoundary";
import { Text } from "react-native";

// Mock component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = false,
}) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <Text>No error</Text>;
};

describe("ErrorBoundary", () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it("renders children when there is no error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText("No error")).toBeTruthy();
  });

  it("renders error UI when child component throws", () => {
    const { getByText, getByTestId } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText("Oops! Something went wrong")).toBeTruthy();
    expect(
      getByText(
        "We're sorry, but something unexpected happened. Don't worry - your playground data is safe!"
      )
    ).toBeTruthy();
    expect(getByTestId("error-boundary")).toBeTruthy();
  });

  it("shows error details in development mode", () => {
    const originalDev = __DEV__;
    (global as any).__DEV__ = true;

    const { getByTestId } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByTestId("error-details")).toBeTruthy();

    (global as any).__DEV__ = originalDev;
  });

  it("calls onError callback when error occurs", () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it("resets error state when retry button is pressed", () => {
    const onError = jest.fn();
    const { getByTestId, getByText } = render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be visible
    expect(getByText("Oops! Something went wrong")).toBeTruthy();
    expect(onError).toHaveBeenCalledTimes(1);

    // Press retry button
    fireEvent.press(getByTestId("error-boundary-retry"));

    // The error boundary should attempt to re-render children
    // Since the child still throws, onError should be called again
    expect(onError).toHaveBeenCalledTimes(2);
    expect(getByText("Oops! Something went wrong")).toBeTruthy();
  });

  it("renders custom fallback when provided", () => {
    const customFallback = (error: Error) => (
      <Text testID="custom-fallback">Custom error: {error.message}</Text>
    );

    const { getByTestId, getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByTestId("custom-fallback")).toBeTruthy();
    expect(getByText("Custom error: Test error")).toBeTruthy();
  });

  it("uses custom testID when provided", () => {
    const { getByTestId } = render(
      <ErrorBoundary testID="custom-error-boundary">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByTestId("custom-error-boundary")).toBeTruthy();
  });
});

describe("useErrorHandler", () => {
  it("creates AppError from generic error", () => {
    const TestComponent = () => {
      const { handleError } = useErrorHandler();
      const error = new Error("Test error");
      const appError = handleError(error);

      return (
        <Text testID="app-error">
          {appError.type}-{appError.message}-{appError.recoverable.toString()}
        </Text>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId("app-error")).toHaveTextContent(
      "system-Test error-true"
    );
  });
});
