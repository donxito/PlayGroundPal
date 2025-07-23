import { Redirect } from "expo-router";

/**
 * Root index file that redirects to the tabs navigation
 */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
