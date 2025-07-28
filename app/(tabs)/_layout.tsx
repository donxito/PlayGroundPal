import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Platform } from "react-native";
import { BlurView } from "expo-blur";

/**
 * Tab Navigation Layout
 *
 * Implements tab-based navigation for the main app screens with:
 * - Playground List (Home)
 * - Add Playground
 * - Settings (Personalization)
 * - Enhanced animations and styling
 * - Platform-specific optimizations
 * - Playful and fun design with delightful interactions
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor:
            Platform.OS === "ios" ? "rgba(255, 255, 255, 0.95)" : "#ffffff",
          borderTopColor: "#e2e8f0",
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          height: Platform.OS === "ios" ? 88 : 64,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        headerShown: false,
        // Enhanced tab transitions
        animation: "shift",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Playgrounds",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: focused ? 1.1 : 1 }],
              }}
              className={`p-2 rounded-full ${focused ? "bg-primary-100" : ""}`}
            >
              <Ionicons
                name={focused ? "map" : "map-outline"}
                size={size}
                color={color}
              />
            </View>
          ),
          tabBarBadge: undefined, // Can be used for notifications later
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add New",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: focused ? 1.1 : 1 }],
              }}
              className={`p-2 rounded-full ${
                focused ? "bg-secondary-100" : ""
              }`}
            >
              <Ionicons
                name={focused ? "add-circle" : "add-circle-outline"}
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: focused ? 1.1 : 1 }],
              }}
              className={`p-2 rounded-full ${
                focused ? "bg-fun-purple/20" : ""
              }`}
            >
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
