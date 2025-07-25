/**
 * Core data models and types for PlayGroundPal application
 * Requirements: 1.2, 1.3, 7.2, 8.2, 10.1
 */

// Location data interface
export interface LocationData {
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp?: Date;
}

// Main Playground interface with all required properties
export interface Playground {
  id: string;
  name: string;
  location: LocationData;
  rating: number; // 1-5 emoji rating scale
  notes?: string;
  photos: string[]; // Array of local file URIs
  dateAdded: Date;
  dateModified: Date;
}

// Sort options for playground list
export type SortOption = "name" | "rating" | "dateAdded" | "distance";

// Filter options for playground list
export interface FilterOption {
  rating?: number[]; // Array of ratings to filter by (e.g., [4, 5] for 4-5 star ratings)
  hasPhotos?: boolean; // Filter by playgrounds with/without photos
}

// Error handling interface
export interface AppError {
  type: "storage" | "permission" | "network" | "validation" | "system";
  message: string;
  code?: string;
  recoverable: boolean;
  timestamp: Date;
}

// Zustand store interface for playground management
export interface PlaygroundStore {
  // State
  playgrounds: Playground[];
  loading: boolean;
  error: AppError | null;
  sortBy: SortOption;
  filterBy: FilterOption;

  // Actions
  addPlayground: (
    playground: Omit<Playground, "id" | "dateAdded" | "dateModified">
  ) => Promise<void>;
  updatePlayground: (id: string, updates: Partial<Playground>) => Promise<void>;
  deletePlayground: (id: string) => Promise<void>;
  deletePlaygroundWithUndo: (id: string) => Promise<Playground>;
  restorePlayground: (playground: Playground) => Promise<void>;
  loadPlaygrounds: () => Promise<void>;
  setSortBy: (sortBy: SortOption) => void;
  setFilterBy: (filterBy: FilterOption) => void;
  clearError: () => void;
}

// Form validation types
export interface PlaygroundFormData {
  name: string;
  location: LocationData;
  rating: number;
  notes?: string;
  photos: string[];
}

export interface ValidationError {
  field: keyof PlaygroundFormData;
  message: string;
}

// Storage schema for AsyncStorage
export interface StoredData {
  playgrounds: Playground[];
  version: string;
  lastModified: Date;
}

// Constants for storage and validation
export const STORAGE_KEYS = {
  PLAYGROUNDS: "@playgroundpal:playgrounds",
  SETTINGS: "@playgroundpal:settings",
  PHOTOS: "@playgroundpal:photos",
} as const;

export const VALIDATION_RULES = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  NOTES_MAX_LENGTH: 500,
  MAX_PHOTOS: 5,
  MIN_RATING: 1,
  MAX_RATING: 5,
} as const;

// Photo management types
export interface PhotoData {
  uri: string;
  filename: string;
  playgroundId: string;
  timestamp: Date;
  thumbnail?: string; // URI to thumbnail version
}

// Location service types
export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: "granted" | "denied" | "undetermined";
}

// Camera service types
export interface CameraPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: "granted" | "denied" | "undetermined";
}

export interface PhotoCaptureResult {
  uri: string;
  width: number;
  height: number;
  cancelled: boolean;
}

// UI state types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ModalState {
  isVisible: boolean;
  type?: "confirmation" | "error" | "info";
  title?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Navigation types for screens
export type RootStackParamList = {
  "(tabs)": undefined;
  "playground/[id]": { id: string };
  "playground/edit/[id]": { id: string };
};

export type TabParamList = {
  index: undefined;
  add: undefined;
};
