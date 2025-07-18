/**
 * Unit tests for playground types and interfaces
 * Ensures type safety and proper structure
 */

import {
  Playground,
  PlaygroundStore,
  AppError,
  SortOption,
  FilterOption,
  LocationData,
  PlaygroundFormData,
  ValidationError,
  StoredData,
  STORAGE_KEYS,
  VALIDATION_RULES,
} from "../playground";

describe("Playground Types", () => {
  describe("Playground interface", () => {
    it("should create a valid playground object", () => {
      const playground: Playground = {
        id: "test-id",
        name: "Test Playground",
        location: {
          address: "123 Test St",
          coordinates: {
            latitude: 40.7128,
            longitude: -74.006,
            accuracy: 10,
          },
          timestamp: new Date(),
        },
        rating: 5,
        notes: "Great playground for kids",
        photos: ["photo1.jpg", "photo2.jpg"],
        dateAdded: new Date(),
        dateModified: new Date(),
      };

      expect(playground.id).toBe("test-id");
      expect(playground.name).toBe("Test Playground");
      expect(playground.rating).toBe(5);
      expect(playground.photos).toHaveLength(2);
    });

    it("should allow optional fields to be undefined", () => {
      const minimalPlayground: Playground = {
        id: "minimal-id",
        name: "Minimal Playground",
        location: {},
        rating: 3,
        photos: [],
        dateAdded: new Date(),
        dateModified: new Date(),
      };

      expect(minimalPlayground.notes).toBeUndefined();
      expect(minimalPlayground.location.address).toBeUndefined();
      expect(minimalPlayground.location.coordinates).toBeUndefined();
    });
  });

  describe("AppError interface", () => {
    it("should create a valid app error", () => {
      const error: AppError = {
        type: "validation",
        message: "Invalid input",
        code: "VALIDATION_001",
        recoverable: true,
        timestamp: new Date(),
      };

      expect(error.type).toBe("validation");
      expect(error.recoverable).toBe(true);
    });

    it("should support all error types", () => {
      const errorTypes: AppError["type"][] = [
        "storage",
        "permission",
        "network",
        "validation",
        "system",
      ];

      errorTypes.forEach((type) => {
        const error: AppError = {
          type,
          message: `Test ${type} error`,
          recoverable: true,
          timestamp: new Date(),
        };
        expect(error.type).toBe(type);
      });
    });
  });

  describe("SortOption type", () => {
    it("should accept valid sort options", () => {
      const validOptions: SortOption[] = [
        "name",
        "rating",
        "dateAdded",
        "distance",
      ];

      validOptions.forEach((option) => {
        const sortBy: SortOption = option;
        expect(sortBy).toBe(option);
      });
    });
  });

  describe("FilterOption interface", () => {
    it("should create valid filter options", () => {
      const filter: FilterOption = {
        rating: [4, 5],
        hasPhotos: true,
      };

      expect(filter.rating).toEqual([4, 5]);
      expect(filter.hasPhotos).toBe(true);
    });

    it("should allow empty filter options", () => {
      const emptyFilter: FilterOption = {};
      expect(emptyFilter.rating).toBeUndefined();
      expect(emptyFilter.hasPhotos).toBeUndefined();
    });
  });

  describe("Constants", () => {
    it("should have correct storage keys", () => {
      expect(STORAGE_KEYS.PLAYGROUNDS).toBe("@playgroundpal:playgrounds");
      expect(STORAGE_KEYS.SETTINGS).toBe("@playgroundpal:settings");
      expect(STORAGE_KEYS.PHOTOS).toBe("@playgroundpal:photos");
    });

    it("should have correct validation rules", () => {
      expect(VALIDATION_RULES.NAME_MIN_LENGTH).toBe(1);
      expect(VALIDATION_RULES.NAME_MAX_LENGTH).toBe(100);
      expect(VALIDATION_RULES.NOTES_MAX_LENGTH).toBe(500);
      expect(VALIDATION_RULES.MAX_PHOTOS).toBe(5);
      expect(VALIDATION_RULES.MIN_RATING).toBe(1);
      expect(VALIDATION_RULES.MAX_RATING).toBe(5);
    });
  });

  describe("PlaygroundFormData interface", () => {
    it("should create valid form data", () => {
      const formData: PlaygroundFormData = {
        name: "New Playground",
        location: {
          address: "456 New St",
          coordinates: {
            latitude: 41.8781,
            longitude: -87.6298,
          },
        },
        rating: 4,
        notes: "Nice place",
        photos: ["new-photo.jpg"],
      };

      expect(formData.name).toBe("New Playground");
      expect(formData.rating).toBe(4);
      expect(formData.photos).toHaveLength(1);
    });
  });

  describe("ValidationError interface", () => {
    it("should create validation errors for form fields", () => {
      const nameError: ValidationError = {
        field: "name",
        message: "Name is required",
      };

      const ratingError: ValidationError = {
        field: "rating",
        message: "Rating must be between 1 and 5",
      };

      expect(nameError.field).toBe("name");
      expect(ratingError.field).toBe("rating");
    });
  });
});
