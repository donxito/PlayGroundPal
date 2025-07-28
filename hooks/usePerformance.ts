/**
 * Performance Monitoring Hook for PlayGroundPal
 *
 * Provides performance monitoring and debugging utilities
 * for tracking app performance and user interactions
 *
 * Requirements: 4.5, 9.3
 */

import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { PerformanceMonitor, MemoryManager } from "../utils/performance";

interface PerformanceMetrics {
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  errorCount: number;
}

interface UsePerformanceOptions {
  trackRenders?: boolean;
  trackInteractions?: boolean;
  trackMemory?: boolean;
  trackErrors?: boolean;
  logToConsole?: boolean;
}

/**
 * Hook for monitoring component performance
 */
export const usePerformance = (
  componentName: string,
  options: UsePerformanceOptions = {}
) => {
  const {
    trackRenders = true,
    trackInteractions = true,
    trackMemory = false,
    trackErrors = true,
    logToConsole = __DEV__,
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
    errorCount: 0,
  });

  const renderStartTime = useRef<number>(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Track component render time
  useEffect(() => {
    if (trackRenders) {
      renderStartTime.current = performance.now();

      return () => {
        const renderTime = performance.now() - renderStartTime.current;
        metricsRef.current.renderTime = renderTime;

        if (logToConsole) {
          console.log(`⏱️ ${componentName} render: ${renderTime.toFixed(2)}ms`);
        }
      };
    }
  }, [componentName, trackRenders, logToConsole]);

  // Track app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App came to foreground
        if (trackMemory) {
          MemoryManager.checkMemoryUsage();
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [trackMemory]);

  // Measure interaction time
  const measureInteraction = useCallback(
    async <T>(
      interactionName: string,
      interaction: () => Promise<T> | T
    ): Promise<T> => {
      if (!trackInteractions) {
        return await interaction();
      }

      return await PerformanceMonitor.measureTime(
        `${componentName} - ${interactionName}`,
        interaction
      );
    },
    [componentName, trackInteractions]
  );

  // Track errors
  const trackError = useCallback(
    (error: Error, context?: string) => {
      if (trackErrors) {
        metricsRef.current.errorCount++;

        if (logToConsole) {
          console.error(
            `❌ ${componentName} error${context ? ` (${context})` : ""}:`,
            error
          );
        }
      }
    },
    [componentName, trackErrors, logToConsole]
  );

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderTime: 0,
      interactionTime: 0,
      memoryUsage: 0,
      errorCount: 0,
    };
  }, []);

  return {
    measureInteraction,
    trackError,
    getMetrics,
    resetMetrics,
  };
};

/**
 * Hook for monitoring list performance
 */
export const useListPerformance = (listName: string) => {
  const { measureInteraction } = usePerformance(listName, {
    trackRenders: false,
    trackInteractions: true,
  });

  const measureListRender = useCallback(
    async (itemCount: number, renderFn: () => void) => {
      return await measureInteraction(`render ${itemCount} items`, renderFn);
    },
    [measureInteraction]
  );

  const measureListScroll = useCallback(
    async (scrollFn: () => void) => {
      return await measureInteraction("scroll", scrollFn);
    },
    [measureInteraction]
  );

  return {
    measureListRender,
    measureListScroll,
  };
};

/**
 * Hook for monitoring image loading performance
 */
export const useImagePerformance = (imageName: string) => {
  const { measureInteraction, trackError } = usePerformance(imageName, {
    trackRenders: false,
    trackInteractions: true,
  });

  const measureImageLoad = useCallback(
    async (imageUri: string, loadFn: () => Promise<void>) => {
      try {
        return await measureInteraction(`load image: ${imageUri}`, loadFn);
      } catch (error) {
        trackError(error as Error, `image load failed: ${imageUri}`);
        throw error;
      }
    },
    [measureInteraction, trackError]
  );

  return {
    measureImageLoad,
  };
};
