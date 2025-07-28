import React from "react";
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  onPress: () => void;
  title?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger" | "fun";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Button component with NativeWind styling - Playful and fun design
 *
 * @param onPress Function to call when button is pressed
 * @param title Text to display in the button (alternative to children)
 * @param children React children to display in the button (alternative to title)
 * @param variant Visual style variant (primary, secondary, outline, danger, fun)
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
  // Base classes for the button - more rounded and playful
  const baseClasses =
    "flex flex-row items-center justify-center rounded-2xl shadow-lg active:scale-95";

  // Variant classes - updated with new color palette
  const variantClasses = {
    primary: "bg-primary-500 active:bg-primary-600 shadow-lg",
    secondary: "bg-secondary-500 active:bg-secondary-600 shadow-lg",
    outline: "bg-transparent border-2 border-primary-300 active:bg-primary-50",
    danger: "bg-accent-500 active:bg-accent-600 shadow-lg",
    fun: "bg-gradient-to-r from-fun-pink to-fun-purple active:from-fun-purple active:to-fun-pink shadow-lg",
  };

  // Size classes - improved touch targets
  const sizeClasses = {
    sm: "px-4 py-2.5 min-h-[44px]",
    md: "px-6 py-3 min-h-[48px]",
    lg: "px-8 py-4 min-h-[56px]",
  };

  // Text color classes - updated for better contrast
  const textColorClasses = {
    primary: "text-white font-semibold",
    secondary: "text-white font-semibold",
    outline: "text-primary-600 font-semibold",
    danger: "text-white font-semibold",
    fun: "text-white font-bold",
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
  const textClasses = `${textColorClasses[variant]} ${textSizeClasses[size]} ${textClassName}`;

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
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? "#2563eb" : "#FFFFFF"}
          className="mr-2"
        />
      ) : null}
      <Text className={textClasses}>{children || title}</Text>
    </TouchableOpacity>
  );
};

export default Button;
