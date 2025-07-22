/**
 * Location Service Tests
 *
 * Tests for the location service functionality including:
 * - Permission handling
 * - Current location retrieval
 * - Geocoding
 * - Distance calculations
 * - Error handling
 *
 */

import * as Location from "expo-location";
import {
  requestLocationPermissions,
  getCurrentLocation,
  geocodeAddress,
  calculateDistance,
  calculateDistanceFromCurrent,
  sortPlaygroundsByDistance,
  checkLocationAvailability,
  validateCoordinates,
  formatDistance,
} from "../locationService";
import { LocationData } from "../../types/playground";

// Mock expo-location
jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  geocodeAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
    High: 4,
    Low: 2,
    Lowest: 1,
    Highest: 5,
  },
}));

describe("Location Service", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("requestLocationPermissions", () => {
    it("should return granted status when permissions are granted", async () => {
      // Mock the permission check to return granted
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      const result = await requestLocationPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: true,
        status: "granted",
      });
      expect(Location.getForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it("should request permissions when not already granted", async () => {
      // Mock the permission check to return not granted
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "undetermined",
      });

      // Mock the permission request to return granted
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "granted",
      });

      const result = await requestLocationPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: true,
        status: "granted",
      });
      expect(Location.getForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it("should handle denied permissions", async () => {
      // Mock the permission check to return not granted
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "undetermined",
      });

      // Mock the permission request to return denied
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "denied",
      });

      const result = await requestLocationPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: false,
        status: "denied",
      });
    });

    it("should handle errors during permission request", async () => {
      // Mock the permission check to throw an error
      (Location.getForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error("Permission error")
      );

      const result = await requestLocationPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: false,
        status: "denied",
      });
    });
  });

  describe("getCurrentLocation", () => {
    it("should return location data when permissions and services are available", async () => {
      // Mock location services check
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);

      // Mock permission request
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      // Mock location retrieval
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
        timestamp: 1625097600000,
      });

      // Mock reverse geocoding
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
        {
          city: "San Francisco",
          region: "CA",
          street: "Market St",
          streetNumber: "123",
          postalCode: "94103",
        },
      ]);

      const result = await getCurrentLocation();

      expect(result).toEqual({
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
        address: "123, Market St, San Francisco, CA, 94103",
        timestamp: expect.any(Date),
      });
    });

    it("should throw an error when location services are disabled", async () => {
      // Mock location services check to return false
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(false);

      await expect(getCurrentLocation()).rejects.toEqual(
        expect.objectContaining({
          type: "permission",
          message: expect.stringContaining("Location services are disabled"),
          code: "LOCATION_SERVICES_DISABLED",
          recoverable: true,
        })
      );
    });

    it("should throw an error when permissions are denied", async () => {
      // Mock location services check
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);

      // Mock permission request to return denied
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "undetermined",
      });

      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "denied",
      });

      await expect(getCurrentLocation()).rejects.toEqual(
        expect.objectContaining({
          type: "permission",
          message: expect.stringContaining("Location permission is required"),
          code: "LOCATION_PERMISSION_DENIED",
        })
      );
    });

    it("should handle errors during location retrieval", async () => {
      // Mock location services check
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);

      // Mock permission request
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      // Mock location retrieval to throw an error
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error("Location error")
      );

      await expect(getCurrentLocation()).rejects.toEqual(
        expect.objectContaining({
          type: "system",
          message: expect.stringContaining("Failed to get current location"),
          recoverable: true,
        })
      );
    });
  });

  describe("geocodeAddress", () => {
    it("should return location data for a valid address", async () => {
      // Mock geocoding to return coordinates
      (Location.geocodeAsync as jest.Mock).mockResolvedValue([
        {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      ]);

      const address = "123 Market St, San Francisco, CA 94103";
      const result = await geocodeAddress(address);

      expect(result).toEqual({
        address: address,
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: undefined,
        },
        timestamp: expect.any(Date),
      });
      expect(Location.geocodeAsync).toHaveBeenCalledWith(address);
    });

    it("should throw an error for an empty address", async () => {
      await expect(geocodeAddress("")).rejects.toEqual(
        expect.objectContaining({
          type: "validation",
          message: "Address cannot be empty",
          code: "EMPTY_ADDRESS",
          recoverable: true,
        })
      );
      expect(Location.geocodeAsync).not.toHaveBeenCalled();
    });

    it("should throw an error when address is not found", async () => {
      // Mock geocoding to return empty results
      (Location.geocodeAsync as jest.Mock).mockResolvedValue([]);

      await expect(geocodeAddress("Invalid Address XYZ")).rejects.toEqual(
        expect.objectContaining({
          type: "network",
          message: expect.stringContaining("Address not found"),
          code: "ADDRESS_NOT_FOUND",
          recoverable: true,
        })
      );
    });

    it("should handle geocoding service errors", async () => {
      // Mock geocoding to throw an error
      (Location.geocodeAsync as jest.Mock).mockRejectedValue(
        new Error("Geocoding error")
      );

      await expect(geocodeAddress("123 Main St")).rejects.toEqual(
        expect.objectContaining({
          type: "network",
          message: expect.stringContaining("Failed to find address"),
          recoverable: true,
        })
      );
    });
  });

  describe("calculateDistance", () => {
    it("should calculate distance between two coordinates correctly", () => {
      // Test with known coordinates and expected distance
      // San Francisco to Los Angeles (approximate distance: 559 km)
      const lat1 = 37.7749; // San Francisco
      const lon1 = -122.4194;
      const lat2 = 34.0522; // Los Angeles
      const lon2 = -118.2437;

      const distance = calculateDistance(lat1, lon1, lat2, lon2);

      // Allow for some rounding differences, but should be close to 559 km
      expect(distance).toBeGreaterThan(550);
      expect(distance).toBeLessThan(570);
    });

    it("should return 0 for identical coordinates", () => {
      const lat = 37.7749;
      const lon = -122.4194;

      const distance = calculateDistance(lat, lon, lat, lon);

      expect(distance).toBe(0);
    });
  });

  describe("calculateDistanceFromCurrent", () => {
    it("should calculate distance from current location to playground", async () => {
      // Mock current location
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      });

      const playgroundLocation: LocationData = {
        coordinates: {
          latitude: 34.0522,
          longitude: -118.2437,
        },
        timestamp: new Date(),
      };

      const distance = await calculateDistanceFromCurrent(playgroundLocation);

      // Should be close to 559 km
      expect(distance).toBeGreaterThan(550);
      expect(distance).toBeLessThan(570);
    });

    it("should return null if playground has no coordinates", async () => {
      const playgroundLocation: LocationData = {
        address: "123 Main St",
        timestamp: new Date(),
      };

      const distance = await calculateDistanceFromCurrent(playgroundLocation);

      expect(distance).toBeNull();
    });

    it("should return null if current location cannot be obtained", async () => {
      // Mock location services to throw an error
      (Location.hasServicesEnabledAsync as jest.Mock).mockRejectedValue(
        new Error("Location error")
      );

      // Mock getCurrentPositionAsync to throw an error
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error("Location error")
      );

      const playgroundLocation: LocationData = {
        coordinates: {
          latitude: 34.0522,
          longitude: -118.2437,
        },
        timestamp: new Date(),
      };

      const distance = await calculateDistanceFromCurrent(playgroundLocation);

      // Since we're mocking the error, we expect null to be returned
      expect(distance).toBeNull();
    });
  });

  describe("sortPlaygroundsByDistance", () => {
    it("should sort playgrounds by distance from current location", async () => {
      // Mock current location
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      });

      const playgrounds = [
        {
          id: "1",
          name: "Far Playground",
          location: {
            coordinates: {
              latitude: 40.7128, // New York
              longitude: -74.006,
            },
          },
        },
        {
          id: "2",
          name: "Near Playground",
          location: {
            coordinates: {
              latitude: 37.3382, // Palo Alto
              longitude: -121.8863,
            },
          },
        },
        {
          id: "3",
          name: "Medium Playground",
          location: {
            coordinates: {
              latitude: 34.0522, // Los Angeles
              longitude: -118.2437,
            },
          },
        },
      ];

      const sorted = await sortPlaygroundsByDistance(playgrounds);

      // Should be sorted by distance (nearest first)
      expect(sorted[0].id).toBe("2"); // Near
      expect(sorted[1].id).toBe("3"); // Medium
      expect(sorted[2].id).toBe("1"); // Far
    });

    it("should handle playgrounds without coordinates", async () => {
      // Mock current location
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      });

      const playgrounds = [
        {
          id: "1",
          name: "No Coordinates",
          location: {
            address: "123 Main St",
          },
        },
        {
          id: "2",
          name: "With Coordinates",
          location: {
            coordinates: {
              latitude: 37.3382,
              longitude: -121.8863,
            },
          },
        },
      ];

      const sorted = await sortPlaygroundsByDistance(playgrounds);

      // Playground with coordinates should come first
      expect(sorted[0].id).toBe("2");
      expect(sorted[1].id).toBe("1");
    });

    it("should return original order if current location cannot be obtained", async () => {
      // Mock location services to throw an error
      (Location.hasServicesEnabledAsync as jest.Mock).mockRejectedValue(
        new Error("Location error")
      );

      const playgrounds = [
        { id: "1", name: "First", location: {} },
        { id: "2", name: "Second", location: {} },
      ];

      const sorted = await sortPlaygroundsByDistance(playgrounds);

      // Should maintain original order
      expect(sorted[0].id).toBe("1");
      expect(sorted[1].id).toBe("2");
    });
  });

  describe("checkLocationAvailability", () => {
    it("should return correct availability status when services are enabled and permissions granted", async () => {
      // Mock location services check
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);

      // Mock permission check
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      const result = await checkLocationAvailability();

      expect(result).toEqual({
        servicesEnabled: true,
        permissionGranted: true,
        canRequestPermission: true,
      });
    });

    it("should handle disabled location services", async () => {
      // Mock location services check
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(false);

      // Mock permission check
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      const result = await checkLocationAvailability();

      expect(result).toEqual({
        servicesEnabled: false,
        permissionGranted: true,
        canRequestPermission: true,
      });
    });

    it("should handle denied permissions", async () => {
      // Mock location services check
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);

      // Mock permission check
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      // Mock permission request
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "denied",
      });

      const result = await checkLocationAvailability();

      expect(result).toEqual({
        servicesEnabled: true,
        permissionGranted: false,
        canRequestPermission: false,
      });
    });

    it("should handle errors during availability check", async () => {
      // Mock location services check to throw an error
      (Location.hasServicesEnabledAsync as jest.Mock).mockRejectedValue(
        new Error("Service error")
      );

      const result = await checkLocationAvailability();

      expect(result).toEqual({
        servicesEnabled: false,
        permissionGranted: false,
        canRequestPermission: false,
      });
    });
  });

  describe("validateCoordinates", () => {
    it("should return true for valid coordinates", () => {
      expect(validateCoordinates(37.7749, -122.4194)).toBe(true);
      expect(validateCoordinates(0, 0)).toBe(true);
      expect(validateCoordinates(90, 180)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);
    });

    it("should return false for invalid coordinates", () => {
      expect(validateCoordinates(91, 0)).toBe(false);
      expect(validateCoordinates(0, 181)).toBe(false);
      expect(validateCoordinates(-91, 0)).toBe(false);
      expect(validateCoordinates(0, -181)).toBe(false);
      expect(validateCoordinates(NaN, 0)).toBe(false);
      expect(validateCoordinates(0, NaN)).toBe(false);
    });
  });

  describe("formatDistance", () => {
    it("should format distances less than 1km in meters", () => {
      expect(formatDistance(0.5)).toBe("500m");
      expect(formatDistance(0.01)).toBe("10m");
      expect(formatDistance(0.999)).toBe("999m");
    });

    it("should format distances between 1km and 10km with one decimal place", () => {
      expect(formatDistance(1)).toBe("1.0km");
      expect(formatDistance(5.67)).toBe("5.7km");
      expect(formatDistance(9.99)).toBe("10.0km");
    });

    it("should format distances 10km or greater as whole numbers", () => {
      expect(formatDistance(10)).toBe("10km");
      expect(formatDistance(15.7)).toBe("16km");
      expect(formatDistance(100.2)).toBe("100km");
    });
  });
});
