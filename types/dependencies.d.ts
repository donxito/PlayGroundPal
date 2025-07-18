// Type definitions for dependencies

// Zustand
declare module "zustand" {
  import { StateCreator } from "zustand/vanilla";
  export function create<T>(
    stateCreator: StateCreator<T>
  ): (selector?: (state: T) => unknown) => T;
}

// Expo Camera
declare module "expo-camera" {
  import { ViewProps } from "react-native";

  export enum CameraType {
    front = "front",
    back = "back",
  }

  export enum FlashMode {
    on = "on",
    off = "off",
    auto = "auto",
    torch = "torch",
  }

  export interface CameraProps extends ViewProps {
    type?: CameraType;
    flashMode?: FlashMode;
    autoFocus?: boolean | "on" | "off";
    zoom?: number;
    whiteBalance?: number | string;
    ratio?: string;
    pictureSize?: string;
    onCameraReady?: () => void;
    onMountError?: (error: Error) => void;
  }

  export interface PictureOptions {
    quality?: number;
    base64?: boolean;
    exif?: boolean;
    onPictureSaved?: (data: PictureResponse) => void;
    skipProcessing?: boolean;
  }

  export interface PictureResponse {
    uri: string;
    width: number;
    height: number;
    exif?: Record<string, any>;
    base64?: string;
  }

  export class Camera extends React.Component<CameraProps> {
    takePictureAsync(options?: PictureOptions): Promise<PictureResponse>;
    recordAsync(options?: Record<string, any>): Promise<{ uri: string }>;
    stopRecording(): void;
    pausePreview(): void;
    resumePreview(): void;
  }

  export function requestCameraPermissionsAsync(): Promise<{
    status: "granted" | "denied";
  }>;
  export function getCameraPermissionsAsync(): Promise<{
    status: "granted" | "denied";
  }>;
}

// Expo Location
declare module "expo-location" {
  export interface LocationObject {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number | null;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }

  export interface LocationOptions {
    accuracy?: number;
    timeInterval?: number;
    distanceInterval?: number;
    mayShowUserSettingsDialog?: boolean;
  }

  export interface GeocodeOptions {
    useGoogleMaps?: boolean;
    googleMapsAPIKey?: string;
  }

  export interface Address {
    city: string | null;
    country: string | null;
    district: string | null;
    isoCountryCode: string | null;
    name: string | null;
    postalCode: string | null;
    region: string | null;
    street: string | null;
    subregion: string | null;
    timezone: string | null;
  }

  export function requestForegroundPermissionsAsync(): Promise<{
    status: "granted" | "denied";
  }>;
  export function getForegroundPermissionsAsync(): Promise<{
    status: "granted" | "denied";
  }>;
  export function getCurrentPositionAsync(
    options?: LocationOptions
  ): Promise<LocationObject>;
  export function watchPositionAsync(
    options: LocationOptions,
    callback: (location: LocationObject) => void
  ): Promise<{ remove: () => void }>;
  export function geocodeAsync(
    address: string,
    options?: GeocodeOptions
  ): Promise<Array<{ latitude: number; longitude: number }>>;
  export function reverseGeocodeAsync(
    location: { latitude: number; longitude: number },
    options?: GeocodeOptions
  ): Promise<Address[]>;
}

// Expo ImagePicker
declare module "expo-image-picker" {
  export interface ImageInfo {
    uri: string;
    width: number;
    height: number;
    type?: "image" | "video";
    exif?: Record<string, any>;
    base64?: string;
  }

  export interface ImagePickerOptions {
    mediaTypes?: "All" | "Images" | "Videos";
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    base64?: boolean;
    exif?: boolean;
  }

  export interface ImagePickerResult {
    cancelled: boolean;
    assets?: ImageInfo[];
    uri?: string;
    width?: number;
    height?: number;
    type?: "image" | "video";
    exif?: Record<string, any>;
    base64?: string;
  }

  export function requestMediaLibraryPermissionsAsync(): Promise<{
    status: "granted" | "denied";
  }>;
  export function getMediaLibraryPermissionsAsync(): Promise<{
    status: "granted" | "denied";
  }>;
  export function requestCameraPermissionsAsync(): Promise<{
    status: "granted" | "denied";
  }>;
  export function getCameraPermissionsAsync(): Promise<{
    status: "granted" | "denied";
  }>;
  export function launchImageLibraryAsync(
    options?: ImagePickerOptions
  ): Promise<ImagePickerResult>;
  export function launchCameraAsync(
    options?: ImagePickerOptions
  ): Promise<ImagePickerResult>;
}

// AsyncStorage
declare module "@react-native-async-storage/async-storage" {
  export default class AsyncStorage {
    static getItem(key: string): Promise<string | null>;
    static setItem(key: string, value: string): Promise<void>;
    static removeItem(key: string): Promise<void>;
    static mergeItem(key: string, value: string): Promise<void>;
    static clear(): Promise<void>;
    static getAllKeys(): Promise<string[]>;
    static multiGet(keys: string[]): Promise<[string, string | null][]>;
    static multiSet(keyValuePairs: [string, string][]): Promise<void>;
    static multiRemove(keys: string[]): Promise<void>;
    static multiMerge(keyValuePairs: [string, string][]): Promise<void>;
  }
}
