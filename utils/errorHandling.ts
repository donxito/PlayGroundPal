/**
 * Error Handling Utilities for PlayGroundPal
 *
 * Provides utility functions for consistent error handling across the app
 * Integrates with toast notifications and error boundary
 *
 * Requirements: 1.5, 10.3, 10.4
 */

import { AppError } from "../types/playground";

/**
 * Create an AppError from a generic error
 */
export const createAppError = (
  error: unknown,
  type: AppError["type"] = "system",
  context?: string
): AppError => {
  let message: string;
  let code: string;

  if (error instanceof Error) {
    message = error.message;
    code = error.name;
  } else if (typeof error === "string") {
    message = error;
    code = "UNKNOWN_ERROR";
  } else {
    message = "An unexpected error occurred";
    code = "UNKNOWN_ERROR";
  }

  return {
    type,
    message: context ? `${context}: ${message}` : message,
    code,
    recoverable: type !== "system", // System errors are generally not recoverable
    timestamp: new Date(),
  };
};

/**
 * Check if an error is an AppError
 */
export const isAppError = (error: unknown): error is AppError => {
  return (
    error !== null &&
    typeof error === "object" &&
    "type" in error &&
    "message" in error &&
    "recoverable" in error &&
    "timestamp" in error
  );
};

/**
 * Get user-friendly error message based on error type
 */
export const getUserFriendlyErrorMessage = (
  error: AppError
): { title: string; message: string } => {
  const errorMessages: Record<
    AppError["type"],
    { title: string; message: string }
  > = {
    storage: {
      title: "Storage Error",
      message:
        "Unable to save or load data. Please check your device storage and try again.",
    },
    permission: {
      title: "Permission Required",
      message:
        "This feature requires permission to work properly. Please check your app settings.",
    },
    network: {
      title: "Network Error",
      message: "Please check your internet connection and try again.",
    },
    validation: {
      title: "Invalid Input",
      message: "Please check your input and try again.",
    },
    system: {
      title: "Something went wrong",
      message:
        "An unexpected error occurred. Please try again or restart the app.",
    },
  };

  const defaultMessage = errorMessages[error.type] || errorMessages.system;

  return {
    title: defaultMessage.title,
    message: error.message || defaultMessage.message,
  };
};

/**
 * Async operation wrapper with error handling
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context?: string,
  errorType: AppError["type"] = "system"
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw createAppError(error, errorType, context);
  }
};

/**
 * Retry an async operation with exponential backoff
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context?: string
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry validation errors or permission errors
      if (
        isAppError(error) &&
        (error.type === "validation" || error.type === "permission")
      ) {
        throw error; // Throw immediately for non-retryable errors
      }

      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // If we get here, all retries failed
  throw isAppError(lastError)
    ? lastError
    : createAppError(lastError, "system", context);
};

/**
 * Validate required fields and throw validation error if any are missing
 */
export const validateRequiredFields = (
  data: Record<string, unknown>,
  requiredFields: string[]
): void => {
  const missingFields = requiredFields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    throw createAppError(
      new Error(`Missing required fields: ${missingFields.join(", ")}`),
      "validation"
    );
  }
};

/**
 * Handle storage quota exceeded error
 */
export const handleStorageQuotaError = (error: unknown): AppError => {
  if (error instanceof Error && error.message.includes("quota")) {
    return createAppError(
      error,
      "storage",
      "Device storage is full. Please free up some space and try again"
    );
  }

  return createAppError(error, "storage");
};

/**
 * Handle network-related errors
 */
export const handleNetworkError = (error: unknown): AppError => {
  if (error instanceof Error) {
    // Common network error patterns
    if (
      error.message.includes("Network request failed") ||
      error.message.includes("fetch")
    ) {
      return createAppError(error, "network", "Network connection failed");
    }

    if (error.message.includes("timeout")) {
      return createAppError(error, "network", "Request timed out");
    }
  }

  return createAppError(error, "network");
};

/**
 * Log error for debugging and crash reporting
 */
export const logError = (error: AppError, context?: string): void => {
  const logData = {
    type: error.type,
    message: error.message,
    code: error.code,
    recoverable: error.recoverable,
    timestamp: error.timestamp.toISOString(),
    context,
  };

  // Log to console in development
  if (__DEV__) {
    console.error("AppError:", logData);
  }

  // TODO: In production, send to crash reporting service
  // Example: Sentry.captureException(error, { extra: logData });
};

/**
 * Error boundary fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Default error boundary fallback component
 * Note: This is a placeholder - actual implementation should use React Native components
 */
export const getDefaultErrorFallbackProps = (
  error: Error
): { title: string; message: string } => {
  const appError = isAppError(error) ? error : createAppError(error);
  return getUserFriendlyErrorMessage(appError);
};

export default {
  createAppError,
  isAppError,
  getUserFriendlyErrorMessage,
  withErrorHandling,
  retryWithBackoff,
  validateRequiredFields,
  handleStorageQuotaError,
  handleNetworkError,
  logError,
  getDefaultErrorFallbackProps,
};
