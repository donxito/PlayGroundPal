import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { usePlaygroundStore } from "../../store/playgroundStore";
import { SortOption, FilterOption } from "../../types/playground";

interface SortFilterBarProps {
  testID?: string;
}

/**
 * SortFilterBar component for sorting and filtering playgrounds
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

  // Get sort option display text
  const getSortText = (option: SortOption): string => {
    switch (option) {
      case "name":
        return "Name";
      case "rating":
        return "Rating";
      case "dateAdded":
        return "Date Added";
      case "distance":
        return "Distance";
      default:
        return "Sort";
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
        <View className="bg-white rounded-lg m-4 p-4 absolute bottom-0 left-0 right-0">
          <Text className="text-lg font-bold mb-4">Sort By</Text>

          {/* Sort options */}
          {(["name", "rating", "dateAdded", "distance"] as SortOption[]).map(
            (option) => (
              <TouchableOpacity
                key={option}
                className={`p-3 border-b border-gray-100 flex-row justify-between items-center ${
                  sortBy === option ? "bg-blue-50" : ""
                }`}
                onPress={() => handleSortSelect(option)}
                testID={testID ? `${testID}-sort-${option}` : `sort-${option}`}
              >
                <Text className="text-base">{getSortText(option)}</Text>
                {sortBy === option && <Text className="text-blue-500">✓</Text>}
              </TouchableOpacity>
            )
          )}

          {/* Cancel button */}
          <TouchableOpacity
            className="mt-4 p-3 bg-gray-100 rounded-lg"
            onPress={() => setSortModalVisible(false)}
            testID={testID ? `${testID}-sort-cancel` : "sort-cancel"}
          >
            <Text className="text-center font-medium">Cancel</Text>
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
        <View className="bg-white rounded-lg m-4 p-4 absolute bottom-0 left-0 right-0">
          <Text className="text-lg font-bold mb-4">Filter By</Text>

          {/* Rating filter */}
          <Text className="text-base font-medium mb-2">Rating</Text>
          <View className="flex-row flex-wrap mb-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={`rating-${rating}`}
                className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                  filterBy.rating?.includes(rating)
                    ? "bg-blue-500"
                    : "bg-gray-200"
                }`}
                onPress={() => handleRatingFilter(rating)}
                testID={
                  testID
                    ? `${testID}-filter-rating-${rating}`
                    : `filter-rating-${rating}`
                }
              >
                <Text
                  className={`${
                    filterBy.rating?.includes(rating)
                      ? "text-white"
                      : "text-gray-800"
                  }`}
                >
                  {"⭐".repeat(rating)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Photo filter */}
          <Text className="text-base font-medium mb-2">Photos</Text>
          <View className="flex-row mb-4">
            <TouchableOpacity
              className={`mr-2 px-3 py-2 rounded-full ${
                filterBy.hasPhotos === true ? "bg-blue-500" : "bg-gray-200"
              }`}
              onPress={() => handlePhotoFilter(true)}
              testID={
                testID ? `${testID}-filter-has-photos` : "filter-has-photos"
              }
            >
              <Text
                className={`${
                  filterBy.hasPhotos === true ? "text-white" : "text-gray-800"
                }`}
              >
                Has Photos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mr-2 px-3 py-2 rounded-full ${
                filterBy.hasPhotos === false ? "bg-blue-500" : "bg-gray-200"
              }`}
              onPress={() => handlePhotoFilter(false)}
              testID={
                testID ? `${testID}-filter-no-photos` : "filter-no-photos"
              }
            >
              <Text
                className={`${
                  filterBy.hasPhotos === false ? "text-white" : "text-gray-800"
                }`}
              >
                No Photos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-3 py-2 rounded-full ${
                filterBy.hasPhotos === undefined ? "bg-blue-500" : "bg-gray-200"
              }`}
              onPress={() => handlePhotoFilter(undefined)}
              testID={
                testID ? `${testID}-filter-any-photos` : "filter-any-photos"
              }
            >
              <Text
                className={`${
                  filterBy.hasPhotos === undefined
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                Any
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View className="flex-row mt-4">
            <TouchableOpacity
              className="flex-1 mr-2 p-3 bg-gray-100 rounded-lg"
              onPress={() => setFilterModalVisible(false)}
              testID={testID ? `${testID}-filter-cancel` : "filter-cancel"}
            >
              <Text className="text-center font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 ml-2 p-3 bg-blue-500 rounded-lg"
              onPress={clearFilters}
              testID={testID ? `${testID}-filter-clear` : "filter-clear"}
            >
              <Text className="text-center font-medium text-white">
                Clear Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View
      className="flex-row justify-between items-center mb-4"
      testID={testID}
    >
      {/* Sort button */}
      <TouchableOpacity
        className="flex-row items-center bg-white px-3 py-2 rounded-lg shadow-sm"
        onPress={() => setSortModalVisible(true)}
        testID={testID ? `${testID}-sort-button` : "sort-button"}
      >
        <Text className="mr-1">Sort: </Text>
        <Text className="font-medium">{getSortText(sortBy)}</Text>
      </TouchableOpacity>

      {/* Filter button */}
      <TouchableOpacity
        className={`flex-row items-center px-3 py-2 rounded-lg shadow-sm ${
          hasActiveFilters ? "bg-blue-500" : "bg-white"
        }`}
        onPress={() => setFilterModalVisible(true)}
        testID={testID ? `${testID}-filter-button` : "filter-button"}
      >
        <Text
          className={`mr-1 ${hasActiveFilters ? "text-white" : "text-black"}`}
        >
          Filter
        </Text>
        {hasActiveFilters && (
          <View className="bg-white rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-xs text-blue-500 font-bold">
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
