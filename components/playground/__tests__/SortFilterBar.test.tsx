import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SortFilterBar } from "../SortFilterBar";
import { usePlaygroundStore } from "../../../store/playgroundStore";

// Mock the store
jest.mock("../../../store/playgroundStore", () => ({
  usePlaygroundStore: jest.fn(),
}));

describe("SortFilterBar", () => {
  // Mock store functions
  const mockSetSortBy = jest.fn();
  const mockSetFilterBy = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Default mock implementation
    (usePlaygroundStore as jest.Mock).mockReturnValue({
      sortBy: "dateAdded",
      filterBy: {},
      setSortBy: mockSetSortBy,
      setFilterBy: mockSetFilterBy,
    });
  });

  it("renders correctly with default props", () => {
    const { getByText, getByTestId } = render(<SortFilterBar />);

    // Check sort button
    expect(getByText("Sort:")).toBeTruthy();
    expect(getByText("Date Added")).toBeTruthy();
    expect(getByTestId("sort-button")).toBeTruthy();

    // Check filter button
    expect(getByText("Filter")).toBeTruthy();
    expect(getByTestId("filter-button")).toBeTruthy();
  });

  it("opens sort modal when sort button is pressed", () => {
    const { getByTestId, getByText } = render(<SortFilterBar />);

    // Press sort button
    fireEvent.press(getByTestId("sort-button"));

    // Check if modal is open
    expect(getByText("Sort By")).toBeTruthy();
    expect(getByTestId("sort-name")).toBeTruthy();
    expect(getByTestId("sort-rating")).toBeTruthy();
    expect(getByTestId("sort-dateAdded")).toBeTruthy();
    expect(getByTestId("sort-distance")).toBeTruthy();
  });

  it("opens filter modal when filter button is pressed", () => {
    const { getByTestId, getByText } = render(<SortFilterBar />);

    // Press filter button
    fireEvent.press(getByTestId("filter-button"));

    // Check if modal is open
    expect(getByText("Filter By")).toBeTruthy();
    expect(getByText("Rating")).toBeTruthy();
    expect(getByText("Photos")).toBeTruthy();
    expect(getByTestId("filter-rating-1")).toBeTruthy();
    expect(getByTestId("filter-has-photos")).toBeTruthy();
    expect(getByTestId("filter-no-photos")).toBeTruthy();
  });

  it("calls setSortBy when a sort option is selected", () => {
    const { getByTestId } = render(<SortFilterBar />);

    // Open sort modal
    fireEvent.press(getByTestId("sort-button"));

    // Select name sort option
    fireEvent.press(getByTestId("sort-name"));

    // Check if setSortBy was called with correct option
    expect(mockSetSortBy).toHaveBeenCalledWith("name");
  });

  it("calls setFilterBy when a rating filter is selected", () => {
    const { getByTestId } = render(<SortFilterBar />);

    // Open filter modal
    fireEvent.press(getByTestId("filter-button"));

    // Select rating 5 filter
    fireEvent.press(getByTestId("filter-rating-5"));

    // Check if setFilterBy was called with correct option
    expect(mockSetFilterBy).toHaveBeenCalledWith({
      rating: [5],
    });
  });

  it("calls setFilterBy when a photo filter is selected", () => {
    const { getByTestId } = render(<SortFilterBar />);

    // Open filter modal
    fireEvent.press(getByTestId("filter-button"));

    // Select has photos filter
    fireEvent.press(getByTestId("filter-has-photos"));

    // Check if setFilterBy was called with correct option
    expect(mockSetFilterBy).toHaveBeenCalledWith({
      hasPhotos: true,
    });
  });

  it("clears filters when clear button is pressed", () => {
    // Mock active filters
    (usePlaygroundStore as jest.Mock).mockReturnValue({
      sortBy: "dateAdded",
      filterBy: { rating: [4, 5], hasPhotos: true },
      setSortBy: mockSetSortBy,
      setFilterBy: mockSetFilterBy,
    });

    const { getByTestId } = render(<SortFilterBar />);

    // Open filter modal
    fireEvent.press(getByTestId("filter-button"));

    // Press clear filters button
    fireEvent.press(getByTestId("filter-clear"));

    // Check if setFilterBy was called with empty object
    expect(mockSetFilterBy).toHaveBeenCalledWith({});
  });

  it("shows active filter count indicator", () => {
    // Mock active filters
    (usePlaygroundStore as jest.Mock).mockReturnValue({
      sortBy: "dateAdded",
      filterBy: { rating: [4, 5], hasPhotos: true },
      setSortBy: mockSetSortBy,
      setFilterBy: mockSetFilterBy,
    });

    const { getByText } = render(<SortFilterBar />);

    // Check if filter count is displayed (2 rating filters + 1 photo filter = 3)
    expect(getByText("3")).toBeTruthy();
  });
});
