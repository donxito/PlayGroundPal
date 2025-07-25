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

// Suppress act warnings for async operations in components
// const originalError = console.error;
// beforeEach(() => {
//   console.error = (...args) => {
//     if (
//       typeof args[0] === "string" &&
//       args[0].includes("An update to") &&
//       args[0].includes("inside a test was not wrapped in act")
//     ) {
//       return;
//     }
//     originalError.call(console, ...args);
//   };
// });

// afterEach(() => {
//   console.error = originalError;
// });

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

// Mock React Native manually to avoid TurboModule issues
jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  ScrollView: "ScrollView",
  TouchableOpacity: "TouchableOpacity",
  TouchableWithoutFeedback: "TouchableWithoutFeedback",
  TextInput: "TextInput",
  Image: "Image",
  FlatList: ({ data, renderItem, ListEmptyComponent, testID }) => {
    const mockReact = require("react");
    if (!data || data.length === 0) {
      return ListEmptyComponent ? ListEmptyComponent() : null;
    }
    return mockReact.createElement(
      "View",
      { testID },
      data.map((item, index) => renderItem({ item, index }))
    );
  },
  ActivityIndicator: "ActivityIndicator",
  Modal: "Modal",
  RefreshControl: "RefreshControl",
  KeyboardAvoidingView: "KeyboardAvoidingView",
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((styles) => styles),
  },
  Alert: {
    alert: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Platform: {
    OS: "ios",
    select: jest.fn((obj) => obj.ios),
  },
  Pressable: "Pressable",
  SafeAreaView: "SafeAreaView",
  useColorScheme: jest.fn(() => "light"),
  Animated: {
    View: "Animated.View",
    Text: "Animated.Text",
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      stopAnimation: jest.fn(),
      resetAnimation: jest.fn(),
      interpolate: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        stopAnimation: jest.fn(),
        resetAnimation: jest.fn(),
      })),
    })),
    timing: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    spring: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    parallel: jest.fn((animations) => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    sequence: jest.fn((animations) => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    delay: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    loop: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    createAnimatedComponent: jest.fn((component) => component),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      poly: jest.fn(),
      sin: jest.fn(),
      circle: jest.fn(),
      exp: jest.fn(),
      elastic: jest.fn(),
      back: jest.fn(),
      bounce: jest.fn(),
      bezier: jest.fn(),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
  },
}));

// Mock expo-image
jest.mock("expo-image", () => ({
  Image: "Image",
}));

// Mock expo-status-bar
jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

// Mock react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => ({
  Swipeable: ({ children, renderRightActions, testID }) => {
    const mockReact = require("react");
    return mockReact.createElement(
      "View",
      { testID },
      [
        mockReact.createElement("View", { key: "children" }, children),
        renderRightActions
          ? mockReact.createElement(
              "View",
              { key: "actions" },
              renderRightActions()
            )
          : null,
      ].filter(Boolean)
    );
  },
  State: {},
  PanGestureHandler: "PanGestureHandler",
  TapGestureHandler: "TapGestureHandler",
  gestureHandlerRootHOC: jest.fn((component) => component),
}));
