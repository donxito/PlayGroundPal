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
      <Text style={{ color: "black", fontSize: 24 }}>HELLO WORLD </Text>

      {/* testing */}
      <TestComponent />
    </View>
  );
}
