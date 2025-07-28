/**
 * Lifecycle Hook for PlayGroundPal
 *
 * Integrates lifecycle service with React components
 * Handles app state changes and automatic data persistence
 *
 * Requirements: 10.1, 10.2, 10.5
 */

import { useEffect, useRef } from "react";
import { usePlaygroundStore } from "../store/playgroundStore";
import {
  initializeLifecycleService,
  setStoreInstance,
  performMaintenance,
  shouldAutoSave,
  forceSave,
} from "../services/lifecycleService";

/**
 * Custom hook for managing app lifecycle
 * Should be used in the root component
 */
export const useLifecycle = () => {
  const store = usePlaygroundStore();
  const cleanupRef = useRef<(() => void) | null>(null);
  const maintenanceIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Set store instance for lifecycle service
    setStoreInstance(store);

    // Initialize lifecycle service
    const cleanup = initializeLifecycleService();
    cleanupRef.current = cleanup;

    // Perform initial maintenance
    performMaintenance();

    // Set up periodic maintenance (every 5 minutes)
    maintenanceIntervalRef.current = setInterval(() => {
      performMaintenance();
    }, 5 * 60 * 1000) as unknown as number;

    // Set up auto-save check (every 30 seconds)
    const autoSaveInterval = setInterval(() => {
      if (shouldAutoSave()) {
        forceSave();
      }
    }, 30000) as unknown as number;

    return () => {
      // Cleanup lifecycle service
      if (cleanupRef.current) {
        cleanupRef.current();
      }

      // Clear maintenance interval
      if (maintenanceIntervalRef.current) {
        clearInterval(maintenanceIntervalRef.current);
      }

      // Clear auto-save interval
      clearInterval(autoSaveInterval);
    };
  }, [store]);

  // Return lifecycle utilities for manual control
  return {
    performMaintenance,
    forceSave,
    shouldAutoSave,
  };
};
