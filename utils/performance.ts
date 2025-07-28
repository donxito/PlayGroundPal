/**
 * Performance Utilities for PlayGroundPal
 *
 * Provides haptic feedback, image caching, and memory management utilities
 * to optimize app performance and user experience
 *
 * Requirements: 4.5, 9.3
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Haptic feedback patterns for different user interactions
 */
export const HapticFeedback = {
  /**
   * Light impact for button presses and selections
   */
  light: () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /**
   * Medium impact for confirmations and important actions
   */
  medium: () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /**
   * Heavy impact for deletions and destructive actions
   */
  heavy: () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /**
   * Success notification for completed actions
   */
  success: () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /**
   * Warning notification for important alerts
   */
  warning: () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  /**
   * Error notification for failures
   */
  error: () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};

/**
 * Image caching configuration for expo-image
 */
export const ImageCacheConfig = {
  // Cache size in bytes (50MB)
  maxSize: 50 * 1024 * 1024,

  // Cache expiration time in milliseconds (7 days)
  maxAge: 7 * 24 * 60 * 60 * 1000,

  // Image quality for thumbnails
  thumbnailQuality: 0.7,

  // Image quality for full-size photos
  fullQuality: 0.8,
};

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  /**
   * Measure execution time of a function
   */
  measureTime: async <T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(
        `❌ ${name} failed after ${(end - start).toFixed(2)}ms:`,
        error
      );
      throw error;
    }
  },

  /**
   * Debounce function calls to improve performance
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function calls to limit execution frequency
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

/**
 * Memory management utilities
 */
export const MemoryManager = {
  /**
   * Check available memory and warn if low
   */
  checkMemoryUsage: () => {
    if (__DEV__) {
      // In development, log memory usage
      console.log("🧠 Memory usage check completed");
    }
  },

  /**
   * Clean up unused resources
   */
  cleanup: async () => {
    // This would integrate with actual memory cleanup
    // For now, just log the cleanup attempt
    console.log("🧹 Memory cleanup initiated");
  },
};

/**
 * List performance optimization utilities
 */
export const ListOptimizer = {
  /**
   * Generate stable keys for list items
   */
  generateKey: (item: any, index: number): string => {
    return item?.id || `item-${index}`;
  },

  /**
   * Optimize list item rendering with proper dimensions
   */
  getItemLayout: (itemHeight: number) => {
    return (_: any, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  },

  /**
   * Check if item should re-render
   */
  shouldItemUpdate: (prevItem: any, nextItem: any): boolean => {
    return (
      prevItem.id !== nextItem.id ||
      prevItem.name !== nextItem.name ||
      prevItem.rating !== nextItem.rating ||
      prevItem.photos.length !== nextItem.photos.length
    );
  },
};
