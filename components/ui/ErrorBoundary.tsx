/**
 * ErrorBoundary component for PlayGroundPal
 *
 * Global error boundary that catches JavaScript errors anywhere in the component tree
 * Provides user-friendly error messages and recovery options
 *
 * Requirements: 1.5, 10.3, 10.4
 */

import React, { Component, ReactNode } from "react";
import { View, Text, ScrollView } from "react-native";
import { Button } from "./Button";
import { AppError } from "../../types/playground";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  testID?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Global error boundary component that catches and handles React errors
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to crash reporting service (if implemented)
    this.logErrorToService(error, errorInfo);
  }

  /**
   * Log error to external service (placeholder for future implementation)
   */
  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // TODO: Integrate with crash reporting service like Sentry
    // For now, just log to console
    console.error("Error logged to service:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Reset error boundary state
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the app (for critical errors)
   */
  private handleReload = () => {
    // In React Native, we can't actually reload the app
    // But we can reset the error boundary and clear any cached state
    this.handleReset();

    // Clear any cached data that might be causing issues
    // This would be implemented based on app-specific needs
    console.log("App reload requested - resetting error boundary");
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }

      // Default error UI
      return (
        <View
          className="flex-1 bg-gray-50 justify-center items-center px-6"
          testID={this.props.testID || "error-boundary"}
        >
          <View className="bg-white rounded-lg p-6 shadow-sm max-w-md w-full">
            {/* Error Icon */}
            <View className="items-center mb-4">
              <Text className="text-6xl">😵</Text>
            </View>

            {/* Error Title */}
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Oops! Something went wrong
            </Text>

            {/* Error Message */}
            <Text className="text-gray-600 text-center mb-6">
              We&apos;re sorry, but something unexpected happened. Don&apos;t
              worry - your playground data is safe!
            </Text>

            {/* Error Details (in development) */}
            {__DEV__ && this.state.error && (
              <ScrollView
                className="bg-gray-100 rounded p-3 mb-4 max-h-32"
                testID="error-details"
              >
                <Text className="text-xs text-gray-700 font-mono">
                  {this.state.error.message}
                </Text>
                {this.state.error.stack && (
                  <Text className="text-xs text-gray-500 font-mono mt-2">
                    {this.state.error.stack}
                  </Text>
                )}
              </ScrollView>
            )}

            {/* Action Buttons */}
            <View className="space-y-3">
              <Button
                title="Try Again"
                onPress={this.handleReset}
                className="w-full"
                testID="error-boundary-retry"
              />

              <Button
                title="Restart App"
                variant="outline"
                onPress={this.handleReload}
                className="w-full"
                testID="error-boundary-reload"
              />
            </View>

            {/* Help Text */}
            <Text className="text-xs text-gray-500 text-center mt-4">
              If this problem persists, please restart the app or contact
              support.
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to create an error boundary with custom error handling
 */
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: React.ErrorInfo) => {
    // Create AppError from generic error
    const appError: AppError = {
      type: "system",
      message: error.message || "An unexpected error occurred",
      code: error.name || "UNKNOWN_ERROR",
      recoverable: true,
      timestamp: new Date(),
    };

    console.error("Error handled:", appError, errorInfo);

    // TODO: Report to error tracking service
    return appError;
  };

  return { handleError };
};

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

export default ErrorBoundary;
