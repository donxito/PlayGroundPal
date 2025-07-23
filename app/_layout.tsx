import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { usePlaygroundStore } from "../store/playgroundStore";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const { loadPlaygrounds, playgrounds, loading } = usePlaygroundStore();

  useEffect(() => {
    loadPlaygrounds();
  }, [loadPlaygrounds]);

  console.log("playgrounds", playgrounds);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
      {loading && (
        <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/30">
          <View className="bg-white p-4 rounded-lg">
            <Text className="text-primary font-medium">Loading...</Text>
          </View>
        </View>
      )}
    </GestureHandlerRootView>
  );
}
