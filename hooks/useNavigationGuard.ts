import { useEffect, useCallback } from "react";
import { Alert, BackHandler } from "react-native";
import { useRouter } from "expo-router";

/**
 * Navigation Guard Hook
 *
 * Provides functionality to prevent navigation when there are unsaved changes
 * Handles both hardware back button (Android) and programmatic navigation
 */
export interface NavigationGuardOptions {
  hasUnsavedChanges: boolean;
  message?: string;
  onConfirmLeave?: () => void;
  onCancelLeave?: () => void;
}

export function useNavigationGuard({
  hasUnsavedChanges,
  message = "You have unsaved changes. Are you sure you want to leave?",
  onConfirmLeave,
  onCancelLeave,
}: NavigationGuardOptions) {
  const router = useRouter();

  // Handle hardware back button on Android
  useEffect(() => {
    // Only add back handler if BackHandler is available (not in test environment)
    if (BackHandler && BackHandler.addEventListener) {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (hasUnsavedChanges) {
            showUnsavedChangesAlert();
            return true; // Prevent default back behavior
          }
          return false; // Allow default back behavior
        }
      );

      return () => backHandler.remove();
    }
  }, [hasUnsavedChanges, showUnsavedChangesAlert]);

  // Show unsaved changes confirmation dialog
  const showUnsavedChangesAlert = useCallback(() => {
    Alert.alert("Unsaved Changes", message, [
      {
        text: "Cancel",
        style: "cancel",
        onPress: onCancelLeave,
      },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => {
          onConfirmLeave?.();
          router.back();
        },
      },
    ]);
  }, [message, onConfirmLeave, onCancelLeave, router]);

  // Guarded navigation function
  const guardedNavigate = useCallback(
    (href: string) => {
      if (hasUnsavedChanges) {
        Alert.alert("Unsaved Changes", message, [
          {
            text: "Cancel",
            style: "cancel",
            onPress: onCancelLeave,
          },
          {
            text: "Leave",
            style: "destructive",
            onPress: () => {
              onConfirmLeave?.();
              router.push(href as any);
            },
          },
        ]);
      } else {
        router.push(href as any);
      }
    },
    [hasUnsavedChanges, message, onConfirmLeave, onCancelLeave, router]
  );

  // Guarded back navigation
  const guardedBack = useCallback(() => {
    if (hasUnsavedChanges) {
      showUnsavedChangesAlert();
    } else {
      router.back();
    }
  }, [hasUnsavedChanges, showUnsavedChangesAlert, router]);

  return {
    guardedNavigate,
    guardedBack,
    showUnsavedChangesAlert,
  };
}

/**
 * Simple navigation guard for forms
 * Returns a function that can be called to navigate with confirmation
 */
export function useFormNavigationGuard(hasUnsavedChanges: boolean) {
  return useNavigationGuard({
    hasUnsavedChanges,
    message:
      "You have unsaved changes. Are you sure you want to leave without saving?",
  });
}
