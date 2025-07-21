import React, { useState } from "react";
import { TextInput, View, Text } from "react-native";

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Input component with validation states and NativeWind styling
 *
 * @param value Current input value
 * @param onChangeText Function called when text changes
 * @param placeholder Placeholder text
 * @param label Label text displayed above input
 * @param error Error message to display
 * @param disabled Whether the input is disabled
 * @param multiline Whether input supports multiple lines
 * @param numberOfLines Number of lines for multiline input
 * @param keyboardType Type of keyboard to display
 * @param secureTextEntry Whether to hide text (for passwords)
 * @param autoCapitalize Auto-capitalization behavior
 * @param autoCorrect Whether to enable auto-correct
 * @param maxLength Maximum number of characters
 * @param className Additional classes for container
 * @param inputClassName Additional classes for input
 * @param labelClassName Additional classes for label
 * @param errorClassName Additional classes for error text
 * @param accessibilityLabel Accessibility label
 * @param testID Test identifier
 */
export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = "default",
  secureTextEntry = false,
  autoCapitalize = "sentences",
  autoCorrect = true,
  maxLength,
  className = "",
  inputClassName = "",
  labelClassName = "",
  errorClassName = "",
  accessibilityLabel,
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Container classes
  const containerClasses = `mb-4 ${className}`;

  // Label classes
  const labelClasses = `text-sm font-medium text-gray-700 mb-1 ${labelClassName}`;

  // Input base classes
  const baseInputClasses = "border rounded-lg px-3 py-2 text-base";

  // Input state classes
  const getInputStateClasses = () => {
    if (error) {
      return "border-red-500 bg-red-50";
    }
    if (isFocused) {
      return "border-blue-500 bg-white";
    }
    if (disabled) {
      return "border-gray-300 bg-gray-100 text-gray-500";
    }
    return "border-gray-300 bg-white";
  };

  // Multiline classes
  const multilineClasses = multiline ? "min-h-[80px]" : "h-12";

  // Combine input classes
  const inputClasses = `${baseInputClasses} ${getInputStateClasses()} ${multilineClasses} ${inputClassName}`;

  // Error classes
  const errorClasses = `text-sm text-red-600 mt-1 ${errorClassName}`;

  return (
    <View className={containerClasses}>
      {label && <Text className={labelClasses}>{label}</Text>}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={!disabled}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        maxLength={maxLength}
        className={inputClasses}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={accessibilityLabel || label}
        testID={testID}
        placeholderTextColor="#9CA3AF"
      />

      {error && <Text className={errorClasses}>{error}</Text>}
    </View>
  );
};

export default Input;
