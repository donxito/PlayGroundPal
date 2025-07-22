import { jest } from "@jest/globals";
import "react-native-gesture-handler/jestSetup";

jest.mock("expo-constants", () => {
  const ActualConstants = jest.requireActual("expo-constants").default;
  return {
    default: {
      ...ActualConstants,
      expoConfig: {
        ...ActualConstants.expoConfig,
        extra: {
          ...ActualConstants.expoConfig?.extra,
          storybookEnabled: process.env.STORYBOOK_ENABLED,
        },
      },
    },
  };
});

jest.mock("expo-router", () => {
  const router = jest.requireActual("expo-router");
  return {
    ...router,
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    useLocalSearchParams: jest.fn(() => ({})),
    useGlobalSearchParams: jest.fn(() => ({})),
    Link: "Link",
  };
});

global.__DEV__ = true;

// Mock for @react-native-async-storage/async-storage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock for react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});
