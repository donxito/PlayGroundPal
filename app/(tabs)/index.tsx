import React, { useCallback, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  usePlaygroundStore,
  getSortedAndFilteredPlaygrounds,
} from "../../store/playgroundStore";
import { PlaygroundCard } from "../../components/playground/PlaygroundCard";
import { SortFilterBar } from "../../components/playground/SortFilterBar";
import { LoadingSpinner, ListSkeleton } from "../../components/ui";
import { Playground } from "../../types/playground";
import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { ListOptimizer, PerformanceMonitor } from "../../utils/performance";

/**
 * Playground List Screen
 *
 * Displays a list of all saved playgrounds with sorting and filtering options.
 * Implements pull-to-refresh functionality and empty state display.
 */
export default function PlaygroundListScreen() {
  // Get playground data and actions from store
  const { playgrounds, loading, loadPlaygrounds, sortBy, filterBy } =
    usePlaygroundStore();

  // Local refresh state for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // User location for distance sorting
  const [userLocation, setUserLocation] = useState<
    { latitude: number; longitude: number } | undefined
  >(undefined);

  // Get sorted and filtered playgrounds with memoization
  const sortedPlaygrounds = useMemo(
    () =>
      getSortedAndFilteredPlaygrounds(
        playgrounds,
        sortBy,
        filterBy,
        userLocation
      ),
    [playgrounds, sortBy, filterBy, userLocation]
  );

  // Get user location for distance sorting
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log("Error getting location:", error);
      }
    };

    // Only get location if sorting by distance
    if (sortBy === "distance") {
      getUserLocation();
    }
  }, [sortBy]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPlaygrounds();
    }, [loadPlaygrounds])
  );

  // Handle pull-to-refresh with performance monitoring
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await PerformanceMonitor.measureTime(
        "Refresh Playgrounds",
        loadPlaygrounds
      );
    } finally {
      setRefreshing(false);
    }
  }, [loadPlaygrounds]);

  // Render empty state when no playgrounds exist
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-5xl mb-4">🏞️</Text>
        <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
          No playgrounds yet
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          Add your first playground by tapping the + button below
        </Text>
      </View>
    );
  };

  // Render empty state when filters return no results
  const renderNoResultsState = () => {
    if (loading || playgrounds.length === 0) return null;

    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-5xl mb-4">🔍</Text>
        <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
          No matching playgrounds
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          Try adjusting your filters to see more results
        </Text>
      </View>
    );
  };

  // Render item for FlatList with optimization
  const renderItem = useCallback(
    ({ item }: { item: Playground }) => <PlaygroundCard playground={item} />,
    []
  );

  // Extract key for FlatList items with optimization
  const keyExtractor = useCallback(
    (item: Playground) => ListOptimizer.generateKey(item, 0),
    []
  );

  // Render loading state with skeleton
  const renderLoadingState = () => {
    if (!loading) return null;
    return <ListSkeleton count={5} testID="playground-list-skeleton" />;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-800">
            My Playgrounds
          </Text>
          <Text className="text-gray-600">
            {sortedPlaygrounds.length}{" "}
            {sortedPlaygrounds.length === 1 ? "playground" : "playgrounds"}
          </Text>
        </View>

        {/* Sort and Filter Bar */}
        <SortFilterBar testID="playground-sort-filter" />

        {/* Playground List */}
        {loading ? (
          renderLoadingState()
        ) : (
          <FlatList
            data={sortedPlaygrounds}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 20,
            }}
            ListEmptyComponent={
              playgrounds.length > 0 ? renderNoResultsState : renderEmptyState
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#3498db"]}
                tintColor="#3498db"
                title="Pull to refresh"
                titleColor="#3498db"
              />
            }
            testID="playground-list"
          />
        )}
      </View>

      {/* Loading overlay */}
      {loading && !refreshing && (
        <LoadingSpinner
          overlay
          message="Loading playgrounds..."
          testID="playground-list-loading"
        />
      )}
    </SafeAreaView>
  );
}
