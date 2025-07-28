/**
 * Skeleton Loading Components for PlayGroundPal
 *
 * Provides skeleton loading states for better perceived performance
 * and user experience during data loading
 *
 * Requirements: 4.5, 9.3
 */

import React from "react";
import { View, Dimensions } from "react-native";

interface SkeletonProps {
  width?: number;
  height?: number;
  className?: string;
  testID?: string;
}

/**
 * Base skeleton component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height = 20,
  className = "",
  testID,
}) => {
  return (
    <View
      className={`bg-gray-200 rounded ${className}`}
      style={{ width, height }}
      testID={testID}
    />
  );
};

/**
 * Skeleton for playground card
 */
export const PlaygroundCardSkeleton: React.FC<{ testID?: string }> = ({
  testID,
}) => {
  const screenWidth = Dimensions.get("window").width;
  const imageSize = 80;

  return (
    <View
      className="bg-white rounded-lg shadow-sm mb-3 p-3"
      testID={testID || "playground-card-skeleton"}
    >
      <View className="flex-row">
        {/* Thumbnail skeleton */}
        <View className="mr-3">
          <Skeleton
            width={imageSize}
            height={imageSize}
            className="rounded-lg"
            testID={testID ? `${testID}-image` : "skeleton-image"}
          />
        </View>

        {/* Content skeleton */}
        <View className="flex-1 justify-between">
          <View>
            <Skeleton
              width={200}
              height={20}
              className="mb-2"
              testID={testID ? `${testID}-title` : "skeleton-title"}
            />
            <Skeleton
              width={150}
              height={16}
              className="mb-2"
              testID={testID ? `${testID}-location` : "skeleton-location"}
            />
          </View>

          <View className="flex-row justify-between items-center">
            <Skeleton
              width={60}
              height={16}
              testID={testID ? `${testID}-rating` : "skeleton-rating"}
            />
            <Skeleton
              width={80}
              height={14}
              testID={testID ? `${testID}-date` : "skeleton-date"}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton for photo gallery
 */
export const PhotoGallerySkeleton: React.FC<{ testID?: string }> = ({
  testID,
}) => {
  return (
    <View
      className="flex-row flex-wrap"
      testID={testID || "photo-gallery-skeleton"}
    >
      {[1, 2, 3].map((index) => (
        <View key={index} className="mr-2 mb-2">
          <Skeleton
            width={100}
            height={100}
            className="rounded-lg"
            testID={
              testID ? `${testID}-photo-${index}` : `skeleton-photo-${index}`
            }
          />
        </View>
      ))}
    </View>
  );
};

/**
 * Skeleton for form inputs
 */
export const FormSkeleton: React.FC<{ testID?: string }> = ({ testID }) => {
  return (
    <View testID={testID || "form-skeleton"}>
      <Skeleton
        width={300}
        height={50}
        className="mb-4 rounded-lg"
        testID={testID ? `${testID}-input-1` : "skeleton-input-1"}
      />
      <Skeleton
        width={300}
        height={50}
        className="mb-4 rounded-lg"
        testID={testID ? `${testID}-input-2` : "skeleton-input-2"}
      />
      <Skeleton
        width={300}
        height={100}
        className="mb-4 rounded-lg"
        testID={testID ? `${testID}-textarea` : "skeleton-textarea"}
      />
      <Skeleton
        width={300}
        height={50}
        className="rounded-lg"
        testID={testID ? `${testID}-button` : "skeleton-button"}
      />
    </View>
  );
};

/**
 * Skeleton for list loading
 */
export const ListSkeleton: React.FC<{ count?: number; testID?: string }> = ({
  count = 5,
  testID,
}) => {
  return (
    <View testID={testID || "list-skeleton"}>
      {Array.from({ length: count }).map((_, index) => (
        <PlaygroundCardSkeleton
          key={index}
          testID={testID ? `${testID}-item-${index}` : `skeleton-item-${index}`}
        />
      ))}
    </View>
  );
};
