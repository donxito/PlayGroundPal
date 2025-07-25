/**
 * Error Handling Utilities Tests
 *
 * Tests for error handling utility functions
 * Requirements: 1.5, 10.3, 10.4
 */

import {
  createAppError,
  isAppError,
  getUserFriendlyErrorMessage,
  withErrorHandling,
  retryWithBackoff,
  validateRequiredFields,
  handleStorageQuotaError,
  handleNetworkError,
  logError,
} from "../errorHandling";
import { AppError } from "../../types/playground";

describe("Error Handling Utilities", () => {
  describe("createAppError", () => {
    it("creates AppError from Error object", () => {
      const error = new Error("Test error");
      const appError = createAppError(error, "validation");

      expect(appError).toEqual({
        type: "validation",
        message: "Test error",
        code: "Error",
        recoverable: true,
        timestamp: expect.any(Date),
      });
    });

    it("creates AppError from string", () => {
      const appError = createAppError("String error", "network");

      expect(appError).toEqual({
        type: "network",
        message: "String error",
        code: "UNKNOWN_ERROR",
        recoverable: true,
        timestamp: expect.any(Date),
      });
    });

    it("adds context to error message", () => {
      const error = new Error("Test error");
      const appError = createAppError(error, "system", "Database operation");

      expect(appError.message).toBe("Database operation: Test error");
    });

    it("defaults to system type", () => {
      const error = new Error("Test error");
      const appError = createAppError(error);

      expect(appError.type).toBe("system");
      expect(appError.recoverable).toBe(false);
    });
  });

  describe("isAppError", () => {
    it("returns true for valid AppError", () => {
      const appError: AppError = {
        type: "validation",
        message: "Test error",
        recoverable: true,
        timestamp: new Date(),
      };

      expect(isAppError(appError)).toBe(true);
    });

    it("returns false for regular Error", () => {
      const error = new Error("Test error");
      expect(isAppError(error)).toBe(false);
    });

    it("returns false for null/undefined", () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });

    it("returns false for incomplete object", () => {
      const incompleteError = {
        type: "validation",
        message: "Test error",
        // missing recoverable and timestamp
      };

      expect(isAppError(incompleteError)).toBe(false);
    });
  });

  describe("getUserFriendlyErrorMessage", () => {
    it("returns storage error message", () => {
      const appError: AppError = {
        type: "storage",
        message: "Storage failed",
        recoverable: true,
        timestamp: new Date(),
      };

      const result = getUserFriendlyErrorMessage(appError);
      expect(result.title).toBe("Storage Error");
      expect(result.message).toBe("Storage failed");
    });

    it("returns permission error message", () => {
      const appError: AppError = {
        type: "permission",
        message: "Permission denied",
        recoverable: true,
        timestamp: new Date(),
      };

      const result = getUserFriendlyErrorMessage(appError);
      expect(result.title).toBe("Permission Required");
      expect(result.message).toBe("Permission denied");
    });

    it("falls back to default message for empty error message", () => {
      const appError: AppError = {
        type: "network",
        message: "",
        recoverable: true,
        timestamp: new Date(),
      };

      const result = getUserFriendlyErrorMessage(appError);
      expect(result.title).toBe("Network Error");
      expect(result.message).toBe(
        "Please check your internet connection and try again."
      );
    });
  });

  describe("withErrorHandling", () => {
    it("returns result when operation succeeds", async () => {
      const operation = jest.fn().mockResolvedValue("success");

      const result = await withErrorHandling(operation, "test context");

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalled();
    });

    it("throws AppError when operation fails", async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error("Operation failed"));

      await expect(
        withErrorHandling(operation, "test context", "validation")
      ).rejects.toEqual({
        type: "validation",
        message: "test context: Operation failed",
        code: "Error",
        recoverable: true,
        timestamp: expect.any(Date),
      });
    });
  });

  describe("retryWithBackoff", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns result on first success", async () => {
      const operation = jest.fn().mockResolvedValue("success");

      const result = await retryWithBackoff(operation, 3, 1000);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("retries on failure and eventually succeeds", async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValue("success");

      const resultPromise = retryWithBackoff(operation, 3, 10); // Shorter delay

      // Fast-forward timers to skip delays
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("throws after max retries", async () => {
      // Use real timers for this specific test to avoid timing issues
      jest.useRealTimers();

      const operation = jest.fn().mockRejectedValue(new Error("Always fails"));

      // Use very short delays for real timers
      const result = retryWithBackoff(operation, 2, 10);

      await expect(result).rejects.toMatchObject({
        type: "system",
        message: "Always fails",
        code: "Error",
        recoverable: false,
        timestamp: expect.any(Date),
      });

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries

      // Restore fake timers for other tests
      jest.useFakeTimers();
    });

    it("does not retry validation errors", async () => {
      const validationError: AppError = {
        type: "validation",
        message: "Invalid input",
        recoverable: true,
        timestamp: new Date(),
      };

      const operation = jest.fn().mockRejectedValue(validationError);

      await expect(retryWithBackoff(operation, 3, 1000)).rejects.toEqual(
        validationError
      );

      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe("validateRequiredFields", () => {
    it("passes validation when all required fields are present", () => {
      const data = {
        name: "Test",
        email: "test@example.com",
        age: 25,
      };

      expect(() => {
        validateRequiredFields(data, ["name", "email"]);
      }).not.toThrow();
    });

    it("throws validation error for missing fields", () => {
      const data = {
        name: "Test",
        email: "",
        age: 25,
      };

      expect(() => {
        validateRequiredFields(data, ["name", "email", "phone"]);
      }).toThrow();
    });

    it("throws validation error with missing field names", () => {
      const data = {
        name: "Test",
      };

      try {
        validateRequiredFields(data, ["name", "email", "phone"]);
      } catch (error) {
        expect(isAppError(error)).toBe(true);
        if (isAppError(error)) {
          expect(error.type).toBe("validation");
          expect(error.message).toContain(
            "Missing required fields: email, phone"
          );
        }
      }
    });
  });

  describe("handleStorageQuotaError", () => {
    it("creates storage error for quota exceeded", () => {
      const error = new Error("Storage quota exceeded");
      const appError = handleStorageQuotaError(error);

      expect(appError.type).toBe("storage");
      expect(appError.message).toContain("Device storage is full");
    });

    it("creates generic storage error for other storage errors", () => {
      const error = new Error("Storage failed");
      const appError = handleStorageQuotaError(error);

      expect(appError.type).toBe("storage");
      expect(appError.message).toBe("Storage failed");
    });
  });

  describe("handleNetworkError", () => {
    it("creates network error for fetch failures", () => {
      const error = new Error("Network request failed");
      const appError = handleNetworkError(error);

      expect(appError.type).toBe("network");
      expect(appError.message).toBe(
        "Network connection failed: Network request failed"
      );
    });

    it("creates network error for timeout", () => {
      const error = new Error("Request timeout");
      const appError = handleNetworkError(error);

      expect(appError.type).toBe("network");
      expect(appError.message).toBe("Request timed out: Request timeout");
    });

    it("creates generic network error for other network errors", () => {
      const error = new Error("Unknown network error");
      const appError = handleNetworkError(error);

      expect(appError.type).toBe("network");
      expect(appError.message).toBe("Unknown network error");
    });
  });

  describe("logError", () => {
    it("logs error to console in development", () => {
      const originalDev = __DEV__;
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      (global as any).__DEV__ = true;

      const appError: AppError = {
        type: "validation",
        message: "Test error",
        code: "TEST_ERROR",
        recoverable: true,
        timestamp: new Date(),
      };

      logError(appError, "test context");

      expect(consoleSpy).toHaveBeenCalledWith("AppError:", {
        type: "validation",
        message: "Test error",
        code: "TEST_ERROR",
        recoverable: true,
        timestamp: expect.any(String),
        context: "test context",
      });

      consoleSpy.mockRestore();
      (global as any).__DEV__ = originalDev;
    });

    it("does not log to console in production", () => {
      const originalDev = __DEV__;
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      (global as any).__DEV__ = false;

      const appError: AppError = {
        type: "validation",
        message: "Test error",
        recoverable: true,
        timestamp: new Date(),
      };

      logError(appError);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      (global as any).__DEV__ = originalDev;
    });
  });
});
