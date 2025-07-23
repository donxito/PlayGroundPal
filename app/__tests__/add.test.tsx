import React from "react";
import { render } from "@testing-library/react-native";

// Mock router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock store
jest.mock("../../store/playgroundStore", () => ({
  usePlaygroundStore: () => ({
    addPlayground: jest.fn(),
  }),
}));

// Mock Alert
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn(),
}));

// Mock PlaygroundForm component
jest.mock("../../components/playground/PlaygroundForm", () => ({
  PlaygroundForm: () => null,
}));

// Import the component after mocking dependencies
import AddPlaygroundScreen from "../(tabs)/add";

describe("AddPlaygroundScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    const { getByText } = render(<AddPlaygroundScreen />);

    // Check header
    expect(getByText("Add New Playground")).toBeTruthy();
    expect(
      getByText("Fill in the details to add a new playground")
    ).toBeTruthy();
  });
});
