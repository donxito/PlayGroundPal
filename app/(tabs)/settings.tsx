import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ThemeConfig,
  FunColor,
  ThemeUtils,
  funColors,
} from "../../utils/theme";

/**
 * Settings Screen
 *
 * Personalization screen for PlayGroundPal with:
 * - Theme selection (light, dark, auto)
 * - Fun color preferences
 * - Haptic feedback toggle
 * - Animation toggle
 * - Playful and fun design with delightful interactions
 */
export default function SettingsScreen() {
  const router = useRouter();
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    mode: "auto",
    funColor: "teal",
    useHaptics: true,
    useAnimations: true,
  });

  // Update theme configuration
  const updateThemeConfig = (updates: Partial<ThemeConfig>) => {
    setThemeConfig((prev) => ({ ...prev, ...updates }));
  };

  // Theme mode options
  const themeModes = [
    {
      value: "light" as const,
      label: "☀️ Light",
      description: "Always use light theme",
    },
    {
      value: "dark" as const,
      label: "🌙 Dark",
      description: "Always use dark theme",
    },
    {
      value: "auto" as const,
      label: "🔄 Auto",
      description: "Follow system preference",
    },
  ];

  // Fun color options
  const funColorOptions: { value: FunColor; label: string; emoji: string }[] = [
    { value: "yellow", label: "Sunny Yellow", emoji: "🌞" },
    { value: "orange", label: "Vibrant Orange", emoji: "🍊" },
    { value: "pink", label: "Playful Pink", emoji: "🌸" },
    { value: "purple", label: "Magical Purple", emoji: "✨" },
    { value: "teal", label: "Ocean Teal", emoji: "🌊" },
    { value: "lime", label: "Fresh Lime", emoji: "🍃" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-row items-center">
          <Text className="text-2xl mr-2">⚙️</Text>
          <Text className="text-2xl font-bold text-text-primary">Settings</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Theme Section */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Text className="text-3xl mr-3">🎨</Text>
            <Text className="text-xl font-bold text-text-primary">Theme</Text>
          </View>

          <View className="bg-surface rounded-2xl p-4 shadow-card">
            <Text className="text-base font-semibold text-text-primary mb-3">
              Appearance
            </Text>

            {themeModes.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                className={`flex-row items-center justify-between p-4 rounded-xl mb-2 ${
                  themeConfig.mode === mode.value
                    ? "bg-primary-100"
                    : "active:bg-gray-50"
                }`}
                onPress={() => updateThemeConfig({ mode: mode.value })}
                activeOpacity={0.7}
              >
                <View className="flex-1">
                  <Text className="text-base font-medium text-text-primary">
                    {mode.label}
                  </Text>
                  <Text className="text-sm text-text-secondary mt-1">
                    {mode.description}
                  </Text>
                </View>
                {themeConfig.mode === mode.value && (
                  <View className="bg-primary-500 rounded-full w-6 h-6 items-center justify-center">
                    <Text className="text-white text-sm">✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fun Color Section */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Text className="text-3xl mr-3">🌈</Text>
            <Text className="text-xl font-bold text-text-primary">
              Fun Colors
            </Text>
          </View>

          <View className="bg-surface rounded-2xl p-4 shadow-card">
            <Text className="text-base font-semibold text-text-primary mb-3">
              Choose your favorite color theme
            </Text>

            <View className="flex-row flex-wrap justify-between">
              {funColorOptions.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  className={`w-[48%] p-4 rounded-xl mb-3 items-center ${
                    themeConfig.funColor === color.value
                      ? "bg-gradient-to-r from-fun-yellow to-fun-orange"
                      : "bg-gray-100"
                  }`}
                  onPress={() => updateThemeConfig({ funColor: color.value })}
                  activeOpacity={0.7}
                >
                  <Text className="text-3xl mb-2">{color.emoji}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      themeConfig.funColor === color.value
                        ? "text-white"
                        : "text-text-primary"
                    }`}
                  >
                    {color.label}
                  </Text>
                  {themeConfig.funColor === color.value && (
                    <Text className="text-white text-xs mt-1">Selected</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Text className="text-3xl mr-3">🎮</Text>
            <Text className="text-xl font-bold text-text-primary">
              Preferences
            </Text>
          </View>

          <View className="bg-surface rounded-2xl p-4 shadow-card">
            {/* Haptic Feedback */}
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 rounded-xl mb-3 active:bg-gray-50"
              onPress={() =>
                updateThemeConfig({ useHaptics: !themeConfig.useHaptics })
              }
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">📳</Text>
                <View>
                  <Text className="text-base font-medium text-text-primary">
                    Haptic Feedback
                  </Text>
                  <Text className="text-sm text-text-secondary">
                    Feel the fun with touch feedback
                  </Text>
                </View>
              </View>
              <View
                className={`w-12 h-6 rounded-full ${
                  themeConfig.useHaptics ? "bg-primary-500" : "bg-gray-300"
                }`}
              >
                <View
                  className={`w-5 h-5 bg-white rounded-full mt-0.5 ml-0.5 ${
                    themeConfig.useHaptics ? "ml-6" : "ml-0.5"
                  }`}
                />
              </View>
            </TouchableOpacity>

            {/* Animations */}
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 rounded-xl active:bg-gray-50"
              onPress={() =>
                updateThemeConfig({ useAnimations: !themeConfig.useAnimations })
              }
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">✨</Text>
                <View>
                  <Text className="text-base font-medium text-text-primary">
                    Animations
                  </Text>
                  <Text className="text-sm text-text-secondary">
                    Add magic to your interactions
                  </Text>
                </View>
              </View>
              <View
                className={`w-12 h-6 rounded-full ${
                  themeConfig.useAnimations ? "bg-primary-500" : "bg-gray-300"
                }`}
              >
                <View
                  className={`w-5 h-5 bg-white rounded-full mt-0.5 ml-0.5 ${
                    themeConfig.useAnimations ? "ml-6" : "ml-0.5"
                  }`}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Text className="text-3xl mr-3">ℹ️</Text>
            <Text className="text-xl font-bold text-text-primary">About</Text>
          </View>

          <View className="bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl p-6">
            <Text className="text-center text-text-primary font-semibold mb-2">
              🎮 PlayGroundPal v1.0
            </Text>
            <Text className="text-center text-text-secondary text-sm leading-5">
              Your personal playground companion! Track, rate, and remember all
              your favorite playgrounds with fun and delight. 🌟
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
