import { Text, View } from "react-native";
import { TestComponent } from "../components/TestComponent";
import { PlaygroundCard } from "../components/playground/PlaygroundCard";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <Text style={{ color: "black", fontSize: 24 }}>PlaygroundPal </Text>

      <Text
        style={{ color: "red", fontSize: 14, marginBottom: 20, marginTop: 16 }}
      >
        Para o menino Theo{" "}
      </Text>

      {/* testing */}
      <TestComponent />

      {/* testing playground card */}
      <PlaygroundCard
        playground={{
          id: "1",
          name: "Playground 1",
          location: {
            address: "123 Main St",
            coordinates: { latitude: 0, longitude: 0 },
          },
          rating: 5,
          photos: [],
          dateAdded: new Date(),
          dateModified: new Date(),
        }}
      />
    </View>
  );
}
