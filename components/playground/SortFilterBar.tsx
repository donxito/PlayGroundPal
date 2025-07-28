import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { usePlaygroundStore } from "../../store/playgroundStore";
import { SortOption, FilterOption } from "../../types/playground";

interface SortFilterBarProps {
  testID?: string;
}

/**
 * SortFilterBar component for sorting and filtering playgrounds
 * Playful and fun design with delightful interactions
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */
export const SortFilterBar: React.FC<SortFilterBarProps> = ({ testID }) => {
  const { sortBy, filterBy, setSortBy, setFilterBy } = usePlaygroundStore();
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Check if any filters are active
  const hasActiveFilters =
    (filterBy.rating && filterBy.rating.length > 0) ||
    filterBy.hasPhotos !== undefined;

  // Get sort option display text with emojis
  const getSortText = (option: SortOption): string => {
    switch (option) {
      case "name":
        return "📝 Name";
      case "rating":
        return "⭐ Rating";
      case "dateAdded":
        return "📅 Date Added";
      case "distance":
        return "📍 Distance";
      default:
        return "🔀 Sort";
    }
  };

  // Handle sort option selection
  const handleSortSelect = (option: SortOption) => {
    setSortBy(option);
    setSortModalVisible(false);
  };

  // Handle filter option selection
  const handleRatingFilter = (rating: number) => {
    const currentRatings = filterBy.rating || [];

    // Toggle rating selection
    if (currentRatings.includes(rating)) {
      setFilterBy({
        ...filterBy,
        rating: currentRatings.filter((r) => r !== rating),
      });
    } else {
      setFilterBy({
        ...filterBy,
        rating: [...currentRatings, rating],
      });
    }
  };

  // Handle photo filter toggle
  const handlePhotoFilter = (hasPhotos: boolean | undefined) => {
    setFilterBy({
      ...filterBy,
      hasPhotos,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterBy({});
    setFilterModalVisible(false);
  };

  // Render sort modal
  const renderSortModal = () => (
    <Modal
      visible={sortModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setSortModalVisible(false)}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        activeOpacity={1}
        onPress={() => setSortModalVisible(false)}
      >
        <View className="bg-surface rounded-2xl m-4 p-6 absolute bottom-0 left-0 right-0 shadow-lg">
          <View className="flex-row items-center mb-6">
            <Text className="text-2xl mr-2">🔀</Text>
            <Text className="text-xl font-bold text-text-primary">Sort By</Text>
          </View>

          {/* Sort options */}
          {(["name", "rating", "dateAdded", "distance"] as SortOption[]).map(
            (option) => (
              <TouchableOpacity
                key={option}
                className={`p-4 border-b border-gray-100 flex-row justify-between items-center rounded-xl mb-2 ${
                  sortBy === option ? "bg-primary-100" : "active:bg-gray-50"
                }`}
                onPress={() => handleSortSelect(option)}
                testID={testID ? `${testID}-sort-${option}` : `sort-${option}`}
                activeOpacity={0.7}
              >
                <Text className="text-base font-medium text-text-primary">
                  {getSortText(option)}
                </Text>
                {sortBy === option && (
                  <View className="bg-primary-500 rounded-full w-6 h-6 items-center justify-center">
                    <Text className="text-white text-sm">✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          )}

          {/* Cancel button */}
          <TouchableOpacity
            className="mt-6 p-4 bg-gray-100 rounded-xl active:bg-gray-200"
            onPress={() => setSortModalVisible(false)}
            testID={testID ? `${testID}-sort-cancel` : "sort-cancel"}
            activeOpacity={0.7}
          >
            <Text className="text-center font-semibold text-text-primary">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        activeOpacity={1}
        onPress={() => setFilterModalVisible(false)}
      >
        <View className="bg-surface rounded-2xl m-4 p-6 absolute bottom-0 left-0 right-0 shadow-lg">
          <View className="flex-row items-center mb-6">
            <Text className="text-2xl mr-2">🔍</Text>
            <Text className="text-xl font-bold text-text-primary">
              Filter By
            </Text>
          </View>

          {/* Rating filter */}
          <Text className="text-base font-semibold text-text-primary mb-3">
            ⭐ Rating
          </Text>
          <View className="flex-row flex-wrap mb-6">
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={`rating-${rating}`}
                className={`mr-3 mb-3 px-4 py-3 rounded-full ${
                  filterBy.rating?.includes(rating)
                    ? "bg-gradient-to-r from-fun-yellow to-fun-orange"
                    : "bg-gray-200"
                }`}
                onPress={() => handleRatingFilter(rating)}
                testID={
                  testID
                    ? `${testID}-filter-rating-${rating}`
                    : `filter-rating-${rating}`
                }
                activeOpacity={0.7}
              >
                <Text
                  className={`font-semibold ${
                    filterBy.rating?.includes(rating)
                      ? "text-white"
                      : "text-text-primary"
                  }`}
                >
                  {"⭐".repeat(rating)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Photo filter */}
          <Text className="text-base font-semibold text-text-primary mb-3">
            📸 Photos
          </Text>
          <View className="flex-row mb-6">
            <TouchableOpacity
              className={`mr-3 px-4 py-3 rounded-full ${
                filterBy.hasPhotos === true
                  ? "bg-gradient-to-r from-fun-teal to-fun-lime"
                  : "bg-gray-200"
              }`}
              onPress={() => handlePhotoFilter(true)}
              testID={
                testID ? `${testID}-filter-has-photos` : "filter-has-photos"
              }
              activeOpacity={0.7}
            >
              <Text
                className={`font-semibold ${
                  filterBy.hasPhotos === true
                    ? "text-white"
                    : "text-text-primary"
                }`}
              >
                📸 Has Photos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mr-3 px-4 py-3 rounded-full ${
                filterBy.hasPhotos === false
                  ? "bg-gradient-to-r from-fun-purple to-fun-pink"
                  : "bg-gray-200"
              }`}
              onPress={() => handlePhotoFilter(false)}
              testID={
                testID ? `${testID}-filter-no-photos` : "filter-no-photos"
              }
              activeOpacity={0.7}
            >
              <Text
                className={`font-semibold ${
                  filterBy.hasPhotos === false
                    ? "text-white"
                    : "text-text-primary"
                }`}
              >
                ❌ No Photos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-4 py-3 rounded-full ${
                filterBy.hasPhotos === undefined
                  ? "bg-gradient-to-r from-primary-500 to-secondary-500"
                  : "bg-gray-200"
              }`}
              onPress={() => handlePhotoFilter(undefined)}
              testID={
                testID ? `${testID}-filter-any-photos` : "filter-any-photos"
              }
              activeOpacity={0.7}
            >
              <Text
                className={`font-semibold ${
                  filterBy.hasPhotos === undefined
                    ? "text-white"
                    : "text-text-primary"
                }`}
              >
                🌟 Any
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View className="flex-row mt-6">
            <TouchableOpacity
              className="flex-1 mr-3 p-4 bg-gray-100 rounded-xl active:bg-gray-200"
              onPress={() => setFilterModalVisible(false)}
              testID={testID ? `${testID}-filter-cancel` : "filter-cancel"}
              activeOpacity={0.7}
            >
              <Text className="text-center font-semibold text-text-primary">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 ml-3 p-4 bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl active:from-accent-600 active:to-accent-700"
              onPress={clearFilters}
              testID={testID ? `${testID}-filter-clear` : "filter-clear"}
              activeOpacity={0.7}
            >
              <Text className="text-center font-semibold text-white">
                🗑️ Clear Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View
      className="flex-row justify-between items-center mb-6"
      testID={testID}
    >
      {/* Sort button */}
      <TouchableOpacity
        className="flex-row items-center bg-surface px-4 py-3 rounded-xl shadow-lg active:scale-95"
        onPress={() => setSortModalVisible(true)}
        testID={testID ? `${testID}-sort-button` : "sort-button"}
        activeOpacity={0.8}
      >
        <Text className="text-fun-teal mr-2">🔀</Text>
        <Text className="font-semibold text-text-primary">
          {getSortText(sortBy)}
        </Text>
      </TouchableOpacity>

      {/* Filter button */}
      <TouchableOpacity
        className={`flex-row items-center px-4 py-3 rounded-xl shadow-lg active:scale-95 ${
          hasActiveFilters
            ? "bg-gradient-to-r from-fun-yellow to-fun-orange"
            : "bg-surface"
        }`}
        onPress={() => setFilterModalVisible(true)}
        testID={testID ? `${testID}-filter-button` : "filter-button"}
        activeOpacity={0.8}
      >
        <Text
          className={`mr-2 ${
            hasActiveFilters ? "text-white" : "text-fun-purple"
          }`}
        >
          🔍
        </Text>
        <Text
          className={`font-semibold ${
            hasActiveFilters ? "text-white" : "text-text-primary"
          }`}
        >
          Filter
        </Text>
        {hasActiveFilters && (
          <View className="bg-white rounded-full w-6 h-6 items-center justify-center ml-2">
            <Text className="text-xs text-fun-orange font-bold">
              {(filterBy.rating?.length || 0) +
                (filterBy.hasPhotos !== undefined ? 1 : 0)}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modals */}
      {renderSortModal()}
      {renderFilterModal()}
    </View>
  );
};

export default SortFilterBar;
