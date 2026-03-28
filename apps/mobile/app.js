import "react-native-get-random-values"; // Polyfill for crypto
import "./ignoreWarnings"; // Import this FIRST to suppress warnings
import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import React from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import { StatusBar, StyleSheet, View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
        <View style={styles.container}>
          <AppNavigator />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

registerRootComponent(App);