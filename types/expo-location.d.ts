/**
 * Type declarations for expo-location
 *
 * This file adds missing type definitions for expo-location
 */

import * as ExpoLocation from "expo-location";

declare module "expo-location" {
  /**
   * Check if location services are enabled on the device
   *
   * @returns Promise that resolves to a boolean indicating if location services are enabled
   */
  export function hasServicesEnabledAsync(): Promise<boolean>;

  /**
   * Accuracy constants for location requests
   */
  export enum Accuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6,
  }

  /**
   * Geocoded address result from reverseGeocodeAsync
   */
  export interface LocationGeocodedAddress {
    city: string | null;
    country: string | null;
    district: string | null;
    isoCountryCode: string | null;
    name: string | null;
    postalCode: string | null;
    region: string | null;
    street: string | null;
    streetNumber: string | null;
    subregion: string | null;
    timezone: string | null;
  }
}

export default ExpoLocation;
