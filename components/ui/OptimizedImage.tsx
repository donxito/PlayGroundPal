/**
 * Optimized Image Component for PlayGroundPal
 *
 * Enhanced image component with caching, loading states, and error handling
 * Optimized for performance and user experience
 *
 * Requirements: 4.5, 9.3
 */

import React, { useState, useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Image, ImageStyle } from "expo-image";
import { ImageCacheConfig } from "../../utils/performance";

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: ImageStyle;
  className?: string;
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  placeholder?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  testID?: string;
  priority?: "low" | "normal" | "high";
  cachePolicy?: "memory" | "disk" | "memory-disk";
}

/**
 * Optimized image component with enhanced caching and loading states
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  className = "",
  contentFit = "cover",
  placeholder = "🖼️",
  fallback = "❌",
  onLoad,
  onError,
  testID,
  priority = "normal",
  cachePolicy = "memory-disk",
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(
    (error: any) => {
      setLoading(false);
      setError(true);
      onError?.(error);
    },
    [onError]
  );

  // Show loading state
  if (loading) {
    return (
      <View
        style={style}
        className={`bg-gray-200 items-center justify-center ${className}`}
        testID={testID ? `${testID}-loading` : "optimized-image-loading"}
      >
        <ActivityIndicator size="small" color="#3498db" />
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View
        style={style}
        className={`bg-gray-200 items-center justify-center ${className}`}
        testID={testID ? `${testID}-error` : "optimized-image-error"}
      >
        <Text className="text-gray-400 text-2xl">{fallback}</Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      className={className}
      contentFit={contentFit}
      placeholder={placeholder}
      transition={200}
      cachePolicy={cachePolicy}
      priority={priority}
      onLoad={handleLoad}
      onError={handleError}
      testID={testID}
    />
  );
};

/**
 * Thumbnail image component optimized for list views
 */
export const ThumbnailImage: React.FC<
  Omit<OptimizedImageProps, "priority" | "cachePolicy">
> = ({
  source,
  style,
  className = "",
  contentFit = "cover",
  placeholder = "📷",
  fallback = "🏞️",
  onLoad,
  onError,
  testID,
}) => {
  return (
    <OptimizedImage
      source={source}
      style={style}
      className={className}
      contentFit={contentFit}
      placeholder={placeholder}
      fallback={fallback}
      onLoad={onLoad}
      onError={onError}
      testID={testID}
      priority="low"
      cachePolicy="memory-disk"
    />
  );
};

/**
 * Full-size image component optimized for detail views
 */
export const FullSizeImage: React.FC<
  Omit<OptimizedImageProps, "priority" | "cachePolicy">
> = ({
  source,
  style,
  className = "",
  contentFit = "cover",
  placeholder = "🖼️",
  fallback = "❌",
  onLoad,
  onError,
  testID,
}) => {
  return (
    <OptimizedImage
      source={source}
      style={style}
      className={className}
      contentFit={contentFit}
      placeholder={placeholder}
      fallback={fallback}
      onLoad={onLoad}
      onError={onError}
      testID={testID}
      priority="high"
      cachePolicy="memory-disk"
    />
  );
};
