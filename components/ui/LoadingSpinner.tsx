import React from "react";
import { View, ActivityIndicator, Text } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
  overlay?: boolean;
  className?: string;
  messageClassName?: string;
  testID?: string;
}

/**
 * LoadingSpinner component for async operations
 *
 * @param size Size of the spinner (small or large)
 * @param color Color of the spinner
 * @param message Optional message to display below spinner
 * @param overlay Whether to show as full-screen overlay
 * @param className Additional classes for container
 * @param messageClassName Additional classes for message text
 * @param testID Test identifier
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "large",
  color = "#3498db",
  message,
  overlay = false,
  className = "",
  messageClassName = "",
  testID,
}) => {
  // Base container classes
  const baseClasses = "flex items-center justify-center";

  // Overlay classes
  const overlayClasses = overlay ? "absolute inset-0 bg-white/80 z-50" : "py-8";

  // Container classes
  const containerClasses = `${baseClasses} ${overlayClasses} ${className}`;

  // Message classes
  const messageClasses = `text-gray-600 text-center mt-3 ${messageClassName}`;

  return (
    <View className={containerClasses} testID={testID}>
      <ActivityIndicator
        size={size}
        color={color}
        testID={testID ? `${testID}-spinner` : "loading-spinner"}
      />
      {message && <Text className={messageClasses}>{message}</Text>}
    </View>
  );
};

export default LoadingSpinner;
