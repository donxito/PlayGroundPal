/**
 * Performance Utilities Tests
 *
 * Tests for performance monitoring, haptic feedback, and optimization utilities
 */

import {
  HapticFeedback,
  PerformanceMonitor,
  MemoryManager,
  ListOptimizer,
} from "../performance";

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

// Mock Platform
jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
  },
}));

describe("Performance Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("HapticFeedback", () => {
    it("should call light impact on iOS", () => {
      const { impactAsync } = require("expo-haptics");
      HapticFeedback.light();
      expect(impactAsync).toHaveBeenCalledWith("light");
    });

    it("should call medium impact on iOS", () => {
      const { impactAsync } = require("expo-haptics");
      HapticFeedback.medium();
      expect(impactAsync).toHaveBeenCalledWith("medium");
    });

    it("should call heavy impact on iOS", () => {
      const { impactAsync } = require("expo-haptics");
      HapticFeedback.heavy();
      expect(impactAsync).toHaveBeenCalledWith("heavy");
    });

    it("should call success notification on iOS", () => {
      const { notificationAsync } = require("expo-haptics");
      HapticFeedback.success();
      expect(notificationAsync).toHaveBeenCalledWith("success");
    });

    it("should call warning notification on iOS", () => {
      const { notificationAsync } = require("expo-haptics");
      HapticFeedback.warning();
      expect(notificationAsync).toHaveBeenCalledWith("warning");
    });

    it("should call error notification on iOS", () => {
      const { notificationAsync } = require("expo-haptics");
      HapticFeedback.error();
      expect(notificationAsync).toHaveBeenCalledWith("error");
    });
  });

  describe("PerformanceMonitor", () => {
    it("should measure execution time correctly", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await PerformanceMonitor.measureTime("test", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "success";
      });

      expect(result).toBe("success");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/⏱️ test: \d+\.\d+ms/)
      );

      consoleSpy.mockRestore();
    });

    it("should handle errors in measureTime", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        PerformanceMonitor.measureTime("test", async () => {
          throw new Error("test error");
        })
      ).rejects.toThrow("test error");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/❌ test failed after \d+\.\d+ms:/),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should debounce function calls", (done) => {
      let callCount = 0;
      const debouncedFn = PerformanceMonitor.debounce(() => {
        callCount++;
        expect(callCount).toBe(1);
        done();
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();
    });

    it("should throttle function calls", (done) => {
      let callCount = 0;
      const throttledFn = PerformanceMonitor.throttle(() => {
        callCount++;
      }, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });
  });

  describe("MemoryManager", () => {
    it("should check memory usage in development", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      MemoryManager.checkMemoryUsage();

      expect(consoleSpy).toHaveBeenCalledWith(
        "🧠 Memory usage check completed"
      );

      consoleSpy.mockRestore();
    });

    it("should initiate cleanup", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await MemoryManager.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith("🧹 Memory cleanup initiated");

      consoleSpy.mockRestore();
    });
  });

  describe("ListOptimizer", () => {
    it("should generate stable keys", () => {
      const item = { id: "test-id", name: "test" };
      const key = ListOptimizer.generateKey(item, 0);
      expect(key).toBe("test-id");
    });

    it("should fallback to index when no id", () => {
      const item = { name: "test" };
      const key = ListOptimizer.generateKey(item, 5);
      expect(key).toBe("item-5");
    });

    it("should generate proper item layout", () => {
      const itemHeight = 100;
      const getItemLayout = ListOptimizer.getItemLayout(itemHeight);

      const layout = getItemLayout(null, 2);
      expect(layout).toEqual({
        length: itemHeight,
        offset: itemHeight * 2,
        index: 2,
      });
    });

    it("should detect when item should update", () => {
      const prevItem = { id: "1", name: "test", rating: 5, photos: ["a"] };
      const nextItem = { id: "1", name: "test", rating: 5, photos: ["a"] };

      expect(ListOptimizer.shouldItemUpdate(prevItem, nextItem)).toBe(false);
    });

    it("should detect when item should update due to changes", () => {
      const prevItem = { id: "1", name: "test", rating: 5, photos: ["a"] };
      const nextItem = { id: "1", name: "test", rating: 4, photos: ["a"] };

      expect(ListOptimizer.shouldItemUpdate(prevItem, nextItem)).toBe(true);
    });
  });
});
