/**
 * Undo functionality provider for PlayGroundPal
 *
 * Provides undo functionality for playground deletion and other reversible operations
 * Integrates with toast system to show undo notifications
 *
 * Requirements: 6.5
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import { Playground } from "../../types/playground";
import { useToast } from "./Toast";

// Undo operation types
export type UndoOperationType =
  | "delete_playground"
  | "bulk_delete"
  | "clear_all";

export interface UndoOperation {
  id: string;
  type: UndoOperationType;
  timestamp: Date;
  data: any; // Operation-specific data
  undo: () => Promise<void>;
  description: string;
}

interface UndoContextType {
  // Register an undo operation
  registerUndo: (operation: Omit<UndoOperation, "id" | "timestamp">) => string;

  // Execute undo operation
  executeUndo: (operationId: string) => Promise<void>;

  // Clear undo history
  clearUndoHistory: () => void;

  // Get pending undo operations
  getPendingOperations: () => UndoOperation[];

  // Convenience method for playground deletion
  registerPlaygroundDeletion: (
    playground: Playground,
    undoCallback: () => Promise<void>
  ) => string;
}

// Create context
const UndoContext = createContext<UndoContextType | null>(null);

// Undo provider component
interface UndoProviderProps {
  children: React.ReactNode;
  maxUndoOperations?: number;
  undoTimeoutMs?: number; // Time before undo operations expire
}

export const UndoProvider: React.FC<UndoProviderProps> = ({
  children,
  maxUndoOperations = 10,
  undoTimeoutMs = 10000, // 10 seconds default
}) => {
  const [undoOperations, setUndoOperations] = useState<UndoOperation[]>([]);
  const toast = useToast();

  // Generate unique ID for undo operations
  const generateId = useCallback(() => {
    return `undo_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  // Execute undo operation
  const executeUndo = useCallback(
    async (operationId: string): Promise<void> => {
      const operation = undoOperations.find((op) => op.id === operationId);

      if (!operation) {
        toast.showError("Undo Failed", "This action can no longer be undone.");
        return;
      }

      try {
        // Execute the undo callback
        await operation.undo();

        // Remove the operation from the list
        setUndoOperations((prev) => prev.filter((op) => op.id !== operationId));

        // Show success message
        toast.showSuccess(
          "Action Undone",
          `${operation.description} has been undone.`
        );
      } catch (error) {
        console.error("Undo operation failed:", error);
        toast.showError(
          "Undo Failed",
          error instanceof Error ? error.message : "Failed to undo the action."
        );
      }
    },
    [undoOperations, toast]
  );

  // Register an undo operation
  const registerUndo = useCallback(
    (operation: Omit<UndoOperation, "id" | "timestamp">): string => {
      const id = generateId();
      const newOperation: UndoOperation = {
        ...operation,
        id,
        timestamp: new Date(),
      };

      setUndoOperations((prev) => {
        // Remove oldest operations if we exceed max
        const updatedOperations =
          prev.length >= maxUndoOperations ? prev.slice(1) : prev;
        return [...updatedOperations, newOperation];
      });

      // Show toast with undo action
      toast.showSuccess(
        operation.description,
        "Tap to undo this action",
        undoTimeoutMs,
        {
          action: {
            label: "Undo",
            onPress: () => executeUndo(id),
          },
          onDismiss: () => {
            // Remove the undo operation when toast is dismissed
            setUndoOperations((prev) => prev.filter((op) => op.id !== id));
          },
        }
      );

      // Auto-expire the undo operation
      setTimeout(() => {
        setUndoOperations((prev) => prev.filter((op) => op.id !== id));
      }, undoTimeoutMs);

      return id;
    },
    [generateId, maxUndoOperations, undoTimeoutMs, toast, executeUndo]
  );

  // Clear undo history
  const clearUndoHistory = useCallback(() => {
    setUndoOperations([]);
  }, []);

  // Get pending undo operations
  const getPendingOperations = useCallback(() => {
    return [...undoOperations];
  }, [undoOperations]);

  // Convenience method for playground deletion
  const registerPlaygroundDeletion = useCallback(
    (playground: Playground, undoCallback: () => Promise<void>): string => {
      return registerUndo({
        type: "delete_playground",
        description: `Deleted "${playground.name}"`,
        data: { playground },
        undo: undoCallback,
      });
    },
    [registerUndo]
  );

  const contextValue: UndoContextType = {
    registerUndo,
    executeUndo,
    clearUndoHistory,
    getPendingOperations,
    registerPlaygroundDeletion,
  };

  return (
    <UndoContext.Provider value={contextValue}>{children}</UndoContext.Provider>
  );
};

// Hook to use undo context
export const useUndo = (): UndoContextType => {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error("useUndo must be used within an UndoProvider");
  }
  return context;
};

// Higher-order component to provide undo functionality
export const withUndo = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <UndoProvider>
      <Component {...props} />
    </UndoProvider>
  );

  WrappedComponent.displayName = `withUndo(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

export default UndoProvider;
