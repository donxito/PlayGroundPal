import React from "react";
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  onPress: () => void;
  title?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Button component with NativeWind styling
 *
 * @param onPress Function to call when button is pressed
 * @param title Text to display in the button (alternative to children)
 * @param children React children to display in the button (alternative to title)
 * @param variant Visual style variant (primary, secondary, outline, danger)
 * @param size Size of the button (sm, md, lg)
 * @param disabled Whether the button is disabled
 * @param loading Whether to show a loading indicator
 * @param className Additional NativeWind classes for the button container
 * @param textClassName Additional NativeWind classes for the button text
 * @param accessibilityLabel Accessibility label for screen readers
 * @param testID Test identifier for testing
 */
export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  textClassName = "",
  accessibilityLabel,
  testID,
}) => {
  // Base classes for the button
  const baseClasses = "flex flex-row items-center justify-center rounded-lg";

  // Variant classes
  const variantClasses = {
    primary: "bg-blue-500 active:bg-blue-600",
    secondary: "bg-gray-200 active:bg-gray-300",
    outline: "bg-transparent border border-gray-300 active:bg-gray-100",
    danger: "bg-red-500 active:bg-red-600",
  };

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5",
    md: "px-4 py-2",
    lg: "px-6 py-3",
  };

  // Text color classes
  const textColorClasses = {
    primary: "text-white",
    secondary: "text-gray-800",
    outline: "text-gray-800",
    danger: "text-white",
  };

  // Text size classes
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  // Disabled classes
  const disabledClasses = disabled ? "opacity-50" : "";

  // Combine all classes
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;
  const textClasses = `font-medium ${textColorClasses[variant]} ${textSizeClasses[size]} ${textClassName}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={buttonClasses}
      accessibilityLabel={
        accessibilityLabel ||
        title ||
        (typeof children === "string" ? children : "Button")
      }
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? "#1F2937" : "#FFFFFF"}
          className="mr-2"
        />
      ) : null}
      <Text className={textClasses}>{children || title}</Text>
    </TouchableOpacity>
  );
};

export default Button;
