import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { PlaygroundCard } from "../PlaygroundCard";
import { router } from "expo-router";
import { usePlaygroundStore } from "../../../store/playgroundStore";
import { act } from "react-test-renderer";

// Mock dependencies
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("../../../store/playgroundStore", () => ({
  usePlaygroundStore: jest.fn(),
}));

// Mock playground data
const mockPlayground = {
  id: "playground-1",
  name: "Central Park Playground",
  location: {
    address: "123 Main St, Anytown, USA",
    coordinates: {
      latitude: 40.7812,
      longitude: -73.9665,
    },
  },
  rating: 4,
  notes: "Great playground with lots of equipment",
  photos: ["file://photo1.jpg"],
  dateAdded: new Date("2023-01-15"),
  dateModified: new Date("2023-01-15"),
};

// const mockPlaygroundNoPhotos = {
//   ...mockPlayground,
//   id: "playground-2",
//   photos: [],
// };

// const mockPlaygroundNoAddress = {
//   ...mockPlayground,
//   id: "playground-3",
//   location: {
//     coordinates: {
//       latitude: 40.7812,
//       longitude: -73.9665,
//     },
//   },
// };

describe("PlaygroundCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the deletePlayground function
    const mockDeletePlayground = jest.fn().mockResolvedValue(undefined);
    (usePlaygroundStore as jest.Mock).mockReturnValue({
      deletePlayground: mockDeletePlayground,
    });
  });

  it("renders without crashing", () => {
    const { toJSON } = render(<PlaygroundCard playground={mockPlayground} />);
    expect(toJSON()).not.toBeNull();
  });

  it("calls router.push when pressed", () => {
    const { getByTestId } = render(
      <PlaygroundCard playground={mockPlayground} />
    );

    // Find the card by testID and press it
    const card = getByTestId("playground-card");
    fireEvent.press(card);

    // Check if router.push was called with the correct path
    expect(router.push).toHaveBeenCalledWith(
      `/playground/${mockPlayground.id}`
    );
  });

  it("calls deletePlayground when delete is confirmed", async () => {
    const { getByTestId } = render(
      <PlaygroundCard playground={mockPlayground} />
    );

    // Find the delete action by testID and press it
    const deleteAction = getByTestId("playground-delete-action");
    await act(async () => {
      fireEvent.press(deleteAction);
    });

    // Find the confirm button by testID and press it
    const confirmButton = getByTestId("playground-delete-modal-confirm");
    await act(async () => {
      fireEvent.press(confirmButton);
    });
    await waitFor(() =>
      expect(usePlaygroundStore().deletePlayground).toHaveBeenCalled()
    );

    // Check if deletePlayground was called with the correct ID
    expect(usePlaygroundStore().deletePlayground).toHaveBeenCalledWith(
      mockPlayground.id
    );
  });

  it("respects custom testID prop", () => {
    const { getByTestId } = render(
      <PlaygroundCard playground={mockPlayground} testID="custom-test-id" />
    );

    // Check if custom testID is applied
    expect(getByTestId("custom-test-id")).toBeTruthy();
  });
});
