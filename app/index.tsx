import { Text, View } from "react-native";
import { TestComponent } from "../components/TestComponent";

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
    </View>
  );
}
