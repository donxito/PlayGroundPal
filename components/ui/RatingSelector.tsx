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
 * Playful and fun design with big emojis and delightful interactions
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
  // Rating emojis for different states - more playful
  const emojis = {
    empty: "⭐",
    filled: "🌟",
    super: "✨",
  };

  // Size classes for emojis - bigger and more prominent
  const sizeClasses = {
    sm: "text-3xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  // Container classes
  const containerClasses = `${className}`;

  // Label classes - more playful styling
  const labelClasses = `text-base font-bold text-text-primary mb-3 ${labelClassName}`;

  // Rating container classes
  const ratingContainerClasses = `flex-row items-center justify-center ${ratingContainerClassName}`;

  // Rating descriptions - more fun and descriptive
  const getRatingDescription = (ratingValue: number): string => {
    switch (ratingValue) {
      case 1:
        return "Not great 😕";
      case 2:
        return "Okay 🤷‍♂️";
      case 3:
        return "Good! 😊";
      case 4:
        return "Very Good! 🎉";
      case 5:
        return "Amazing! 🚀";
      default:
        return "No rating yet";
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
      {showLabel && (
        <Text className={labelClasses}>
          {label} {rating > 0 && `(${rating}/5)`}
        </Text>
      )}

      <View className={ratingContainerClasses}>
        {Array.from({ length: maxRating }, (_, index) => {
          const ratingValue = index + 1;
          const isSelected = ratingValue <= rating;
          const isPerfect = ratingValue === 5 && rating === 5;
          const emoji = isPerfect
            ? emojis.super
            : isSelected
            ? emojis.filled
            : emojis.empty;

          return (
            <TouchableOpacity
              key={ratingValue}
              onPress={() => handleRatingPress(ratingValue)}
              disabled={disabled}
              className={`mr-2 p-1 rounded-full ${
                disabled ? "opacity-50" : "active:scale-110"
              }`}
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
              activeOpacity={0.7}
            >
              <Text
                className={`${sizeClasses[size]} ${
                  isSelected
                    ? isPerfect
                      ? "animate-bounce-gentle"
                      : "animate-pulse-gentle"
                    : "opacity-40"
                }`}
              >
                {emoji}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {rating > 0 && (
        <View className="mt-3 items-center">
          <Text className="text-base font-semibold text-fun-orange mb-1">
            {getRatingDescription(rating)}
          </Text>
          <Text className="text-sm text-text-secondary">
            {rating} out of {maxRating} stars
          </Text>
        </View>
      )}
    </View>
  );
};

export default RatingSelector;
