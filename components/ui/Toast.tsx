/**
 * Toast notification system for PlayGroundPal
 *
 * Provides user-friendly notifications for success, error, and info messages
 * Supports auto-dismiss, manual dismiss, and action buttons
 *
 * Requirements: 1.5, 6.5, 10.3, 10.4
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { AppError } from "../../types/playground";

// Toast types
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // Auto-dismiss duration in ms (0 = no auto-dismiss)
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, "id">) => string;
  showSuccess: (
    title: string,
    message?: string,
    duration?: number,
    options?: { action?: ToastMessage["action"]; onDismiss?: () => void }
  ) => string;
  showError: (
    title: string,
    message?: string,
    duration?: number,
    options?: { action?: ToastMessage["action"]; onDismiss?: () => void }
  ) => string;
  showWarning: (
    title: string,
    message?: string,
    duration?: number,
    options?: { action?: ToastMessage["action"]; onDismiss?: () => void }
  ) => string;
  showInfo: (
    title: string,
    message?: string,
    duration?: number,
    options?: { action?: ToastMessage["action"]; onDismiss?: () => void }
  ) => string;
  showAppError: (error: AppError, action?: ToastMessage["action"]) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

// Create context
const ToastContext = createContext<ToastContextType | null>(null);

// Toast provider component
interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 3,
  defaultDuration = 4000,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Generate unique ID for toasts
  const generateId = useCallback(() => {
    return `toast_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  // Dismiss specific toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.onDismiss) {
        toast.onDismiss();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  // Show toast
  const showToast = useCallback(
    (toast: Omit<ToastMessage, "id">): string => {
      const id = generateId();
      const newToast: ToastMessage = {
        ...toast,
        id,
        duration: toast.duration ?? defaultDuration,
      };

      setToasts((prev) => {
        // Remove oldest toasts if we exceed max
        const updatedToasts = prev.length >= maxToasts ? prev.slice(1) : prev;
        return [...updatedToasts, newToast];
      });

      // Auto-dismiss if duration is set
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [generateId, defaultDuration, maxToasts, dismissToast]
  );

  // Convenience methods for different toast types
  const showSuccess = useCallback(
    (
      title: string,
      message?: string,
      duration?: number,
      options?: { action?: ToastMessage["action"]; onDismiss?: () => void }
    ) => showToast({ type: "success", title, message, duration, ...options }),
    [showToast]
  );

  const showError = useCallback(
    (
      title: string,
      message?: string,
      duration?: number,
      options?: { action?: ToastMessage["action"]; onDismiss?: () => void }
    ) => showToast({ type: "error", title, message, duration, ...options }),
    [showToast]
  );

  const showWarning = useCallback(
    (
      title: string,
      message?: string,
      duration?: number,
      options?: { action?: ToastMessage["action"]; onDismiss?: () => void }
    ) => showToast({ type: "warning", title, message, duration, ...options }),
    [showToast]
  );

  const showInfo = useCallback(
    (
      title: string,
      message?: string,
      duration?: number,
      options?: { action?: ToastMessage["action"]; onDismiss?: () => void }
    ) => showToast({ type: "info", title, message, duration, ...options }),
    [showToast]
  );

  // Show AppError as toast with user-friendly messages
  const showAppError = useCallback(
    (error: AppError, action?: ToastMessage["action"]) => {
      const userFriendlyMessages: Record<AppError["type"], string> = {
        storage: "Unable to save data. Please check your device storage.",
        permission: "Permission required. Please check your app settings.",
        network: "Network error. Please check your internet connection.",
        validation: "Please check your input and try again.",
        system: "Something went wrong. Please try again.",
      };

      const title = userFriendlyMessages[error.type] || "Error";
      const message = error.recoverable
        ? `${error.message} You can try again.`
        : error.message;

      return showToast({
        type: "error",
        title,
        message,
        duration: error.recoverable ? 6000 : 8000, // Longer duration for errors
        action,
      });
    },
    [showToast]
  );

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    setToasts((prev) => {
      prev.forEach((toast) => {
        if (toast.onDismiss) {
          toast.onDismiss();
        }
      });
      return [];
    });
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAppError,
    dismissToast,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

// Toast container component
interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <View
      className="absolute top-12 left-4 right-4 z-50"
      pointerEvents="box-none"
    >
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </View>
  );
};

// Individual toast item component
interface ToastItemProps {
  toast: ToastMessage;
  index: number;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, index, onDismiss }) => {
  // Handle test environment where Animated might not be available
  const [slideAnim] = useState(() => {
    try {
      return new Animated.Value(-100);
    } catch {
      return { setValue: () => {}, addListener: () => {} } as any;
    }
  });
  const [opacityAnim] = useState(() => {
    try {
      return new Animated.Value(0);
    } catch {
      return { setValue: () => {}, addListener: () => {} } as any;
    }
  });

  useEffect(() => {
    // Slide in animation - skip in test environment
    if (typeof Animated.parallel === "function") {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [slideAnim, opacityAnim]);

  const handleDismiss = () => {
    // Slide out animation - skip in test environment
    if (typeof Animated.parallel === "function") {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss();
      });
    } else {
      // In test environment, dismiss immediately
      onDismiss();
    }
  };

  // Toast styling based on type
  const getToastStyles = (type: ToastType) => {
    const baseClasses = "rounded-lg p-4 mb-2 shadow-lg";

    switch (type) {
      case "success":
        return `${baseClasses} bg-green-500`;
      case "error":
        return `${baseClasses} bg-red-500`;
      case "warning":
        return `${baseClasses} bg-yellow-500`;
      case "info":
        return `${baseClasses} bg-blue-500`;
      default:
        return `${baseClasses} bg-gray-500`;
    }
  };

  // Toast icon based on type
  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  };

  // Use regular View in test environment where Animated might not be available
  const ToastContainer =
    typeof Animated?.View === "function" ? Animated.View : View;

  return (
    <ToastContainer
      style={
        typeof Animated.parallel === "function"
          ? {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
              marginTop: index * 8, // Stagger toasts
            }
          : {
              marginTop: index * 8, // Stagger toasts in test environment
            }
      }
      className={getToastStyles(toast.type)}
      testID={`toast-${toast.type}-${toast.id}`}
    >
      <View className="flex-row items-start">
        {/* Icon */}
        <Text className="text-lg mr-3 mt-0.5">{getToastIcon(toast.type)}</Text>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">
            {toast.title}
          </Text>
          {toast.message && (
            <Text className="text-white/90 text-sm mt-1">{toast.message}</Text>
          )}

          {/* Action button */}
          {toast.action && (
            <TouchableOpacity
              onPress={() => {
                toast.action!.onPress();
                handleDismiss();
              }}
              className="bg-white/20 rounded px-3 py-1 mt-2 self-start"
              testID={`toast-action-${toast.id}`}
            >
              <Text className="text-white font-medium text-sm">
                {toast.action.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dismiss button */}
        <TouchableOpacity
          onPress={handleDismiss}
          className="ml-2 p-1"
          accessibilityLabel="Dismiss notification"
          testID={`toast-dismiss-${toast.id}`}
        >
          <Text className="text-white/80 text-lg">×</Text>
        </TouchableOpacity>
      </View>
    </ToastContainer>
  );
};

// Hook to use toast context
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastProvider;
