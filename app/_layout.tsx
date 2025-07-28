import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { usePlaygroundStore } from "../store/playgroundStore";
import { useEffect } from "react";
import { Text, View, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Linking from "expo-linking";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { ToastProvider } from "../components/ui/Toast";
import { UndoProvider } from "../components/ui/UndoProvider";
import { useLifecycle } from "../hooks/useLifecycle";

export default function RootLayout() {
  const { loadPlaygrounds, playgrounds, loading } = usePlaygroundStore();

  // Initialize lifecycle management
  useLifecycle();

  useEffect(() => {
    loadPlaygrounds();
  }, [loadPlaygrounds]);

  // Handle deep linking
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log("Deep link received:", url);
      // Deep linking is handled automatically by Expo Router
    };

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep link when app is opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  console.log("playgrounds", playgrounds);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <UndoProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
                // Enhanced screen transitions
                animation:
                  Platform.OS === "ios"
                    ? "slide_from_right"
                    : "slide_from_bottom",
                animationDuration: 300,
                gestureEnabled: true,
                gestureDirection: "horizontal",
              }}
            />
            {loading && (
              <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/30">
                <View className="bg-white p-4 rounded-lg">
                  <Text className="text-primary font-medium">Loading...</Text>
                </View>
              </View>
            )}
          </GestureHandlerRootView>
        </UndoProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
