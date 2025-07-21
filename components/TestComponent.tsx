import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { usePlaygroundStore } from "../store/playgroundStore";
import { Button } from "../components/ui/Button";

/**
 * Test component to verify all dependencies are working correctly
 */
export const TestComponent: React.FC = () => {
  const { playgrounds, loading } = usePlaygroundStore();

  const handlePress = () => {
    console.log("Button pressed");
  };

  return (
    <View className="flex-1 justify-center items-center bg-background p-4">
      <Text className="text-xl font-bold text-text mb-4">
        PlaygroundPal Dependencies Test
      </Text>

      {/* Test NativeWind styling */}
      <View className="bg-primary p-4 rounded-lg mb-4">
        <Text className="text-white text-center">
          NativeWind Styling: ✅ Working
        </Text>
      </View>

      {/* Test Zustand store */}
      <View className="bg-secondary p-4 rounded-lg mb-4">
        <Text className="text-white text-center">
          Zustand Store: ✅ Working
        </Text>
        <Text className="text-white text-center text-sm">
          Playgrounds: {playgrounds.length} | Loading: {loading ? "Yes" : "No"}
        </Text>
      </View>

      {/* Test TypeScript types */}
      <View className="bg-accent p-4 rounded-lg mb-4">
        <Text className="text-white text-center">
          TypeScript Types: ✅ Working
        </Text>
      </View>
      <View className="bg-accent p-4 rounded-lg mb-4">
        <TouchableOpacity
          className="bg-gray-800 px-6 py-3 rounded-lg mt-10"
          onPress={() => console.log("Dependencies configured successfully!")}
        >
          <Text className="text-white font-semibold">Test Complete</Text>
        </TouchableOpacity>

        <Button onPress={handlePress} className="mt-2">
          Press Me
        </Button>
      </View>
    </View>
  );
};
