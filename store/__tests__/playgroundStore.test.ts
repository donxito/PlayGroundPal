/**
 * Unit tests for Playground Store
 *
 * Tests all store actions and error handling
 */

import { getSortedAndFilteredPlaygrounds } from "../playgroundStore";
import * as storageService from "../../services/storageService";
import { Playground } from "../../types/playground";

// Mock the storage service
jest.mock("../../services/storageService", () => ({
  savePlaygrounds: jest.fn(),
  loadPlaygrounds: jest.fn(),
}));

// Mock nanoid
jest.mock("nanoid", () => ({
  nanoid: () => "test-id-123",
}));

// Sample playground data for testing
const mockPlaygrounds: Playground[] = [
  {
    id: "1",
    name: "Playground A",
    location: {
      address: "123 A St",
      coordinates: { latitude: 40.7128, longitude: -74.006 },
    },
    rating: 5,
    photos: ["photo1.jpg"],
    dateAdded: new Date("2023-01-01"),
    dateModified: new Date("2023-01-01"),
  },
  {
    id: "2",
    name: "Playground C",
    location: {
      address: "456 C St",
      coordinates: { latitude: 40.7, longitude: -74.0 },
    },
    rating: 3,
    photos: [],
    dateAdded: new Date("2023-01-03"),
    dateModified: new Date("2023-01-03"),
  },
  {
    id: "3",
    name: "Playground B",
    location: {
      address: "789 B St",
      coordinates: { latitude: 40.8, longitude: -74.1 },
    },
    rating: 4,
    photos: ["photo2.jpg", "photo3.jpg"],
    dateAdded: new Date("2023-01-02"),
    dateModified: new Date("2023-01-02"),
  },
];

describe("Playground Store Utilities", () => {
  describe("getSortedAndFilteredPlaygrounds", () => {
    it("should sort by name", () => {
      const sorted = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "name",
        {}
      );
      expect(sorted.map((p) => p.name)).toEqual([
        "Playground A",
        "Playground B",
        "Playground C",
      ]);
    });

    it("should sort by rating", () => {
      const sorted = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "rating",
        {}
      );
      expect(sorted.map((p) => p.rating)).toEqual([5, 4, 3]);
    });

    it("should sort by dateAdded", () => {
      const sorted = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "dateAdded",
        {}
      );
      expect(sorted.map((p) => p.id)).toEqual(["2", "3", "1"]);
    });

    it("should sort by distance when user location is provided", () => {
      // User location close to Playground A
      const userLocation = { latitude: 40.713, longitude: -74.007 };

      const sorted = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "distance",
        {},
        userLocation
      );
      expect(sorted.map((p) => p.id)).toEqual(["1", "2", "3"]);
    });

    it("should filter by rating", () => {
      const filtered = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "name",
        {
          rating: [4, 5],
        }
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.map((p) => p.rating).every((r) => r >= 4)).toBe(true);
    });

    it("should filter by hasPhotos", () => {
      const filtered = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "name",
        {
          hasPhotos: true,
        }
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => p.photos.length > 0)).toBe(true);
    });

    it("should apply both sorting and filtering", () => {
      const result = getSortedAndFilteredPlaygrounds(
        mockPlaygrounds,
        "rating",
        {
          hasPhotos: true,
        }
      );

      expect(result).toHaveLength(2);
      expect(result[0].rating).toBe(5); // Highest rating first
      expect(result.every((p) => p.photos.length > 0)).toBe(true);
    });
  });
});
