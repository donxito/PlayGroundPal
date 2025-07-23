import React from "react";
import { render, act } from "@testing-library/react-native";
import {
  usePlaygroundStore,
  getSortedAndFilteredPlaygrounds,
} from "../../store/playgroundStore";

// Mock the store
jest.mock("../../store/playgroundStore", () => ({
  usePlaygroundStore: jest.fn(),
  getSortedAndFilteredPlaygrounds: jest.fn((playgrounds) => playgrounds),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn((callback) => {
    callback();
    return null;
  }),
  router: {
    push: jest.fn(),
  },
  Redirect: jest.fn(() => null),
}));

// Mock expo-location
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 37.7749, longitude: -122.4194 },
  }),
  Accuracy: { Balanced: 3 },
}));

// Mock SortFilterBar component
jest.mock("../../components/playground/SortFilterBar", () => ({
  SortFilterBar: () => null,
}));

// Import the actual component we want to test
import PlaygroundListScreen from "../(tabs)/index";

describe("PlaygroundListScreen", () => {
  // Sample playground data for testing
  const mockPlaygrounds = [
    {
      id: "1",
      name: "Test Playground 1",
      location: {
        address: "123 Test St",
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
      },
      rating: 4,
      photos: [],
      dateAdded: new Date("2023-01-01"),
      dateModified: new Date("2023-01-01"),
    },
    {
      id: "2",
      name: "Test Playground 2",
      location: {
        address: "456 Test Ave",
      },
      rating: 5,
      photos: ["file://test-photo.jpg"],
      dateAdded: new Date("2023-01-02"),
      dateModified: new Date("2023-01-02"),
    },
  ];

  // Mock loadPlaygrounds function
  const mockLoadPlaygrounds = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Default mock implementation
    (usePlaygroundStore as jest.Mock).mockReturnValue({
      playgrounds: mockPlaygrounds,
      loading: false,
      loadPlaygrounds: mockLoadPlaygrounds,
      sortBy: "dateAdded",
      filterBy: {},
    });

    // Default mock for getSortedAndFilteredPlaygrounds
    (getSortedAndFilteredPlaygrounds as jest.Mock).mockImplementation(
      (playgrounds) => playgrounds
    );
  });

  it("renders playground list correctly", () => {
    const { getByText, getAllByTestId } = render(<PlaygroundListScreen />);

    // Check header
    expect(getByText("My Playgrounds")).toBeTruthy();
    expect(getByText("2 playgrounds")).toBeTruthy();

    // Check playground cards
    const cards = getAllByTestId("playground-card");
    expect(cards).toHaveLength(2);
    expect(getByText("Test Playground 1")).toBeTruthy();
    expect(getByText("Test Playground 2")).toBeTruthy();
  });

  it("shows empty state when no playgrounds exist", () => {
    (usePlaygroundStore as jest.Mock).mockReturnValue({
      playgrounds: [],
      loading: false,
      loadPlaygrounds: mockLoadPlaygrounds,
      sortBy: "dateAdded",
      filterBy: {},
    });

    const { getByText } = render(<PlaygroundListScreen />);

    expect(getByText("No playgrounds yet")).toBeTruthy();
    expect(
      getByText("Add your first playground by tapping the + button below")
    ).toBeTruthy();
  });

  it("shows no results state when filters return no results", () => {
    // Mock getSortedAndFilteredPlaygrounds to return empty array
    (getSortedAndFilteredPlaygrounds as jest.Mock).mockReturnValueOnce([]);

    const { getByText } = render(<PlaygroundListScreen />);

    expect(getByText("No matching playgrounds")).toBeTruthy();
    expect(
      getByText("Try adjusting your filters to see more results")
    ).toBeTruthy();
  });

  it("shows loading spinner during initial load", () => {
    (usePlaygroundStore as jest.Mock).mockReturnValue({
      playgrounds: [],
      loading: true,
      loadPlaygrounds: mockLoadPlaygrounds,
      sortBy: "dateAdded",
      filterBy: {},
    });

    const { getByTestId } = render(<PlaygroundListScreen />);

    expect(getByTestId("playground-list-loading")).toBeTruthy();
  });

  it("calls loadPlaygrounds on focus", async () => {
    render(<PlaygroundListScreen />);

    // Since we can't easily test the pull-to-refresh with mocked components,
    // just verify that loadPlaygrounds was called during initial render/focus
    expect(mockLoadPlaygrounds).toHaveBeenCalled();
  });

  it("shows singular playground text when only one playground exists", () => {
    (usePlaygroundStore as jest.Mock).mockReturnValue({
      playgrounds: [mockPlaygrounds[0]],
      loading: false,
      loadPlaygrounds: mockLoadPlaygrounds,
      sortBy: "dateAdded",
      filterBy: {},
    });

    const { getByText } = render(<PlaygroundListScreen />);

    expect(getByText("1 playground")).toBeTruthy();
  });
});
