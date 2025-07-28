import { jest } from "@jest/globals";
import "react-native-gesture-handler/jestSetup";

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        storybookEnabled: process.env.STORYBOOK_ENABLED,
      },
    },
  },
}));

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
  FlatList: ({
    data,
    renderItem,
    ListEmptyComponent,
    testID,
    keyExtractor,
  }) => {
    const mockReact = require("react");
    if (!data || data.length === 0) {
      return ListEmptyComponent ? ListEmptyComponent() : null;
    }
    return mockReact.createElement(
      "View",
      { testID },
      data.map((item, index) =>
        mockReact.createElement(
          "View",
          { key: keyExtractor ? keyExtractor(item, index) : index },
          renderItem({ item, index })
        )
      )
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

// Mock expo-camera
jest.mock("expo-camera", () => ({
  Camera: "Camera",
  CameraType: {
    front: "front",
    back: "back",
  },
  FlashMode: {
    on: "on",
    off: "off",
    auto: "auto",
    torch: "torch",
  },
  getCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestCameraPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
}));

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file://test-photo.jpg" }],
  }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file://test-photo.jpg" }],
  }),
  MediaTypeOptions: {
    Images: "Images",
  },
  ImagePickerResult: {
    Canceled: "canceled",
  },
}));

// Mock expo-image-manipulator
jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn().mockResolvedValue({
    uri: "file://manipulated-photo.jpg",
    width: 800,
    height: 600,
  }),
  SaveFormat: {
    JPEG: "jpeg",
    PNG: "png",
    WEBP: "webp",
  },
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  documentDirectory: "file://test-documents/",
  cacheDirectory: "file://test-cache/",
  readAsStringAsync: jest.fn().mockResolvedValue("test content"),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  getInfoAsync: jest.fn().mockResolvedValue({
    exists: true,
    size: 1024,
    isDirectory: false,
  }),
}));

// Mock moti
jest.mock("moti", () => ({
  MotiView: "MotiView",
  MotiText: "MotiText",
  useAnimationState: jest.fn(() => ({
    current: "initial",
    transitionTo: jest.fn(),
  })),
  AnimatePresence: ({ children }) => children,
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
