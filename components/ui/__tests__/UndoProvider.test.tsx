/**
 * Tests for UndoProvider component
 *
 * Tests undo functionality, context operations, and integration with toast system
 * Covers all undo operation types and edge cases
 *
 * Requirements: 6.5
 */

import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  renderHook,
} from "@testing-library/react-native";
import { TouchableOpacity, Text } from "react-native";
import { UndoProvider, useUndo, withUndo } from "../UndoProvider";
import { Playground } from "../../../types/playground";

// Mock toast hook
const mockToast = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showAppError: jest.fn(),
};

jest.mock("../Toast", () => ({
  useToast: () => mockToast,
}));

// Test component that uses undo context
const TestComponent: React.FC = () => {
  const undo = useUndo();

  const handleRegisterUndo = () => {
    undo.registerUndo({
      type: "delete_playground",
      description: "Test deletion",
      data: { test: "data" },
      undo: async () => {
        console.log("Undo executed");
      },
    });
  };

  const handleRegisterPlaygroundDeletion = () => {
    const playground: Playground = {
      id: "test-id",
      name: "Test Playground",
      location: {},
      rating: 5,
      photos: [],
      dateAdded: new Date(),
      dateModified: new Date(),
    };

    undo.registerPlaygroundDeletion(playground, async () => {
      console.log("Playground deletion undone");
    });
  };

  const handleExecuteUndo = (operationId: string) => {
    undo.executeUndo(operationId);
  };

  const handleClearHistory = () => {
    undo.clearUndoHistory();
  };

  const handleGetOperations = () => {
    return undo.getPendingOperations();
  };

  return (
    <>
      <TouchableOpacity onPress={handleRegisterUndo}>
        <Text>Register Undo</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleRegisterPlaygroundDeletion}>
        <Text>Register Playground Deletion</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleExecuteUndo("test-id")}>
        <Text>Execute Undo</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleClearHistory}>
        <Text>Clear History</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleGetOperations}>
        <Text>Get Operations</Text>
      </TouchableOpacity>
    </>
  );
};

describe("UndoProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Context and Hook", () => {
    it("should provide undo context to children", () => {
      const { getByText } = render(
        <UndoProvider>
          <TestComponent />
        </UndoProvider>
      );

      expect(getByText("Register Undo")).toBeTruthy();
    });

    it("should throw error when useUndo is used outside provider", () => {
      const TestComponentWithoutProvider = () => {
        useUndo();
        return null;
      };

      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow("useUndo must be used within an UndoProvider");
    });
  });

  describe("registerUndo", () => {
    it("should register a new undo operation", async () => {
      const { getByText } = render(
        <UndoProvider>
          <TestComponent />
        </UndoProvider>
      );

      await act(async () => {
        fireEvent.press(getByText("Register Undo"));
      });

      expect(mockToast.showSuccess).toHaveBeenCalledWith(
        "Test deletion",
        "Tap to undo this action",
        10000,
        expect.objectContaining({
          action: {
            label: "Undo",
            onPress: expect.any(Function),
          },
        })
      );
    });

    it("should limit undo operations to maxUndoOperations", async () => {
      // Should only keep the last 2 operations
      const { result } = renderHook(() => useUndo(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <UndoProvider maxUndoOperations={2}>{children}</UndoProvider>
        ),
      });

      // Register 3 operations
      await act(async () => {
        result.current.registerUndo({
          type: "delete_playground",
          description: "Test deletion 1",
          data: { test: "data1" },
          undo: async () => {},
        });
        result.current.registerUndo({
          type: "delete_playground",
          description: "Test deletion 2",
          data: { test: "data2" },
          undo: async () => {},
        });
        result.current.registerUndo({
          type: "delete_playground",
          description: "Test deletion 3",
          data: { test: "data3" },
          undo: async () => {},
        });
      });

      const operations = result.current.getPendingOperations();
      expect(operations).toHaveLength(2);
    });

    it("should auto-expire undo operations after timeout", async () => {
      const { result } = renderHook(() => useUndo(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <UndoProvider undoTimeoutMs={1000}>{children}</UndoProvider>
        ),
      });

      await act(async () => {
        result.current.registerUndo({
          type: "delete_playground",
          description: "Test deletion",
          data: { test: "data" },
          undo: async () => {},
        });
      });

      // Fast-forward time past the timeout
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      const operations = result.current.getPendingOperations();
      expect(operations).toHaveLength(0);
    });
  });

  describe("registerPlaygroundDeletion", () => {
    it("should register playground deletion with proper description", async () => {
      const { getByText } = render(
        <UndoProvider>
          <TestComponent />
        </UndoProvider>
      );

      await act(async () => {
        fireEvent.press(getByText("Register Playground Deletion"));
      });

      expect(mockToast.showSuccess).toHaveBeenCalledWith(
        'Deleted "Test Playground"',
        "Tap to undo this action",
        10000,
        expect.objectContaining({
          action: {
            label: "Undo",
            onPress: expect.any(Function),
          },
        })
      );
    });
  });

  describe("executeUndo", () => {
    it("should execute undo operation successfully", async () => {
      const { result } = renderHook(() => useUndo(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <UndoProvider>{children}</UndoProvider>
        ),
      });

      // Register an undo operation
      let operationId: string;
      await act(async () => {
        operationId = result.current.registerUndo({
          type: "delete_playground",
          description: "Test deletion",
          data: { test: "data" },
          undo: async () => {
            console.log("Undo executed successfully");
          },
        });
      });

      // Execute the undo
      await act(async () => {
        await result.current.executeUndo(operationId);
      });

      await waitFor(() => {
        expect(mockToast.showSuccess).toHaveBeenCalledWith(
          "Action Undone",
          "Test deletion has been undone."
        );
      });
    });

    it("should handle non-existent undo operation", async () => {
      const { result } = renderHook(() => useUndo(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <UndoProvider>{children}</UndoProvider>
        ),
      });

      await act(async () => {
        await result.current.executeUndo("non-existent-id");
      });

      expect(mockToast.showError).toHaveBeenCalledWith(
        "Undo Failed",
        "This action can no longer be undone."
      );
    });

    it("should handle undo operation failure", async () => {
      const { result } = renderHook(() => useUndo(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <UndoProvider>{children}</UndoProvider>
        ),
      });

      // Register a failing undo operation
      let operationId: string;
      await act(async () => {
        operationId = result.current.registerUndo({
          type: "delete_playground",
          description: "Failing operation",
          data: {},
          undo: async () => {
            throw new Error("Undo failed");
          },
        });
      });

      // Execute the failing undo
      await act(async () => {
        await result.current.executeUndo(operationId);
      });

      await waitFor(() => {
        expect(mockToast.showError).toHaveBeenCalledWith(
          "Undo Failed",
          "Undo failed"
        );
      });
    });
  });

  describe("clearUndoHistory", () => {
    it("should clear all undo operations", async () => {
      const { result } = renderHook(() => useUndo(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <UndoProvider>{children}</UndoProvider>
        ),
      });

      // Register some operations
      await act(async () => {
        result.current.registerUndo({
          type: "delete_playground",
          description: "Test deletion 1",
          data: { test: "data1" },
          undo: async () => {},
        });
        result.current.registerUndo({
          type: "delete_playground",
          description: "Test deletion 2",
          data: { test: "data2" },
          undo: async () => {},
        });
      });

      // Clear history
      await act(async () => {
        result.current.clearUndoHistory();
      });

      const operations = result.current.getPendingOperations();
      expect(operations).toHaveLength(0);
    });
  });

  describe("getPendingOperations", () => {
    it("should return copy of pending operations", async () => {
      const { result } = renderHook(() => useUndo(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <UndoProvider>{children}</UndoProvider>
        ),
      });

      // Register an operation
      await act(async () => {
        result.current.registerUndo({
          type: "delete_playground",
          description: "Test deletion",
          data: { test: "data" },
          undo: async () => {},
        });
      });

      const operations = result.current.getPendingOperations();
      expect(operations).toHaveLength(1);
      expect(operations[0]).toMatchObject({
        type: "delete_playground",
        description: "Test deletion",
        data: { test: "data" },
      });
    });
  });

  describe("withUndo HOC", () => {
    it("should wrap component with UndoProvider", () => {
      const WrappedComponent = withUndo(TestComponent);
      const { getByText } = render(<WrappedComponent />);

      expect(getByText("Register Undo")).toBeTruthy();
    });

    it("should preserve component display name", () => {
      const WrappedComponent = withUndo(TestComponent);
      expect(WrappedComponent.displayName).toBe("withUndo(TestComponent)");
    });
  });

  describe("Toast integration", () => {
    it("should remove operation when toast is dismissed", async () => {
      const { result } = renderHook(() => useUndo(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <UndoProvider>{children}</UndoProvider>
        ),
      });

      await act(async () => {
        result.current.registerUndo({
          type: "delete_playground",
          description: "Test deletion",
          data: { test: "data" },
          undo: async () => {},
        });
      });

      // Get the onDismiss callback from the toast call
      const toastCall = mockToast.showSuccess.mock.calls[0];
      const onDismiss = toastCall[3].onDismiss;

      // Simulate toast dismissal
      await act(async () => {
        onDismiss();
      });

      const operations = result.current.getPendingOperations();
      expect(operations).toHaveLength(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle multiple rapid undo registrations", async () => {
      const { result } = renderHook(() => useUndo(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <UndoProvider maxUndoOperations={3}>{children}</UndoProvider>
        ),
      });

      // Register operations rapidly
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          result.current.registerUndo({
            type: "delete_playground",
            description: `Test deletion ${i}`,
            data: { test: `data${i}` },
            undo: async () => {},
          });
        }
      });

      const operations = result.current.getPendingOperations();
      expect(operations).toHaveLength(3); // Should only keep last 3
    });

    it("should handle custom timeout values", async () => {
      const { result } = renderHook(() => useUndo(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <UndoProvider undoTimeoutMs={500}>{children}</UndoProvider>
        ),
      });

      await act(async () => {
        result.current.registerUndo({
          type: "delete_playground",
          description: "Test deletion",
          data: { test: "data" },
          undo: async () => {},
        });
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(600);
      });

      const operations = result.current.getPendingOperations();
      expect(operations).toHaveLength(0);
    });
  });
});
