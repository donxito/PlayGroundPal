/**
 * Integration tests to verify type imports and store integration
 */

import {
  Playground,
  AppError,
  SortOption,
  FilterOption,
  PlaygroundStore,
} from "../playground";

describe("Type Integration", () => {
  it("should import all types successfully", () => {
    // Test that all types can be imported without errors
    const playground: Playground = {
      id: "test-integration",
      name: "Integration Test Playground",
      location: {
        address: "123 Integration St",
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      },
      rating: 4,
      photos: [],
      dateAdded: new Date(),
      dateModified: new Date(),
    };

    const error: AppError = {
      type: "validation",
      message: "Test error",
      recoverable: true,
      timestamp: new Date(),
    };

    const sortBy: SortOption = "name";
    const filterBy: FilterOption = { rating: [4, 5] };

    expect(playground.id).toBe("test-integration");
    expect(error.type).toBe("validation");
    expect(sortBy).toBe("name");
    expect(filterBy.rating).toEqual([4, 5]);
  });

  it("should have correct PlaygroundStore interface structure", () => {
    // Test that the PlaygroundStore interface has all required properties
    // This is a compile-time test - if the interface is wrong, TypeScript will fail
    const mockStore: Partial<PlaygroundStore> = {
      playgrounds: [],
      loading: false,
      error: null,
      sortBy: "name",
      filterBy: {},
    };

    expect(Array.isArray(mockStore.playgrounds)).toBe(true);
    expect(typeof mockStore.loading).toBe("boolean");
    expect(mockStore.sortBy).toBe("name");
    expect(typeof mockStore.filterBy).toBe("object");
  });

  it("should validate playground data structure", () => {
    // Test that a complete playground object matches the interface
    const completePlayground: Playground = {
      id: "complete-test",
      name: "Complete Test Playground",
      location: {
        address: "456 Complete Ave",
        coordinates: {
          latitude: 41.8781,
          longitude: -87.6298,
          accuracy: 5,
        },
        timestamp: new Date(),
      },
      rating: 5,
      notes: "This is a complete playground with all optional fields",
      photos: ["photo1.jpg", "photo2.jpg", "photo3.jpg"],
      dateAdded: new Date("2024-01-01"),
      dateModified: new Date("2024-01-02"),
    };

    expect(completePlayground.id).toBe("complete-test");
    expect(completePlayground.location.coordinates?.accuracy).toBe(5);
    expect(completePlayground.photos).toHaveLength(3);
    expect(completePlayground.notes).toBeDefined();
  });
});
