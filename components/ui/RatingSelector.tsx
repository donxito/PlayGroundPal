import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface RatingSelectorProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
  labelClassName?: string;
  ratingContainerClassName?: string;
  testID?: string;
}

/**
 * RatingSelector component with interactive emoji rating system (1-5 scale)
 *
 * @param rating Current rating value (1-5)
 * @param onRatingChange Function called when rating changes
 * @param maxRating Maximum rating value (default: 5)
 * @param size Size of the rating emojis
 * @param disabled Whether the rating selector is disabled
 * @param showLabel Whether to show the rating label
 * @param label Custom label text
 * @param className Additional classes for container
 * @param labelClassName Additional classes for label
 * @param ratingContainerClassName Additional classes for rating container
 * @param testID Test identifier
 */
export const RatingSelector: React.FC<RatingSelectorProps> = ({
  rating,
  onRatingChange,
  maxRating = 5,
  size = "md",
  disabled = false,
  showLabel = true,
  label = "Rating",
  className = "",
  labelClassName = "",
  ratingContainerClassName = "",
  testID,
}) => {
  // Rating emojis for different states
  const emojis = {
    empty: "⭐",
    filled: "🌟",
  };

  // Size classes for emojis
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  // Container classes
  const containerClasses = `${className}`;

  // Label classes
  const labelClasses = `text-sm font-medium text-gray-700 mb-2 ${labelClassName}`;

  // Rating container classes
  const ratingContainerClasses = `flex-row items-center ${ratingContainerClassName}`;

  // Rating descriptions
  const getRatingDescription = (ratingValue: number): string => {
    switch (ratingValue) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "No rating";
    }
  };

  const handleRatingPress = (newRating: number) => {
    if (!disabled) {
      // Allow deselecting by tapping the same rating
      const finalRating = rating === newRating ? 0 : newRating;
      onRatingChange(finalRating);
    }
  };

  return (
    <View className={containerClasses} testID={testID}>
      {showLabel && <Text className={labelClasses}>{label}</Text>}

      <View className={ratingContainerClasses}>
        {Array.from({ length: maxRating }, (_, index) => {
          const ratingValue = index + 1;
          const isSelected = ratingValue <= rating;
          const emoji = isSelected ? emojis.filled : emojis.empty;

          return (
            <TouchableOpacity
              key={ratingValue}
              onPress={() => handleRatingPress(ratingValue)}
              disabled={disabled}
              className={`mr-1 ${disabled ? "opacity-50" : ""}`}
              accessibilityLabel={`${ratingValue} star${
                ratingValue !== 1 ? "s" : ""
              }`}
              accessibilityRole="button"
              accessibilityState={{
                selected: isSelected,
                disabled,
              }}
              accessibilityHint={`Tap to rate ${ratingValue} out of ${maxRating} stars`}
              testID={
                testID
                  ? `${testID}-star-${ratingValue}`
                  : `rating-star-${ratingValue}`
              }
            >
              <Text
                className={`${sizeClasses[size]} ${
                  isSelected ? "" : "opacity-60"
                }`}
              >
                {emoji}
              </Text>
            </TouchableOpacity>
          );
        })}

        {rating > 0 && (
          <Text className="ml-3 text-sm text-gray-600">
            {getRatingDescription(rating)}
          </Text>
        )}
      </View>

      {rating > 0 && (
        <Text className="text-xs text-gray-500 mt-1">
          {rating} out of {maxRating} stars
        </Text>
      )}
    </View>
  );
};

export default RatingSelector;
