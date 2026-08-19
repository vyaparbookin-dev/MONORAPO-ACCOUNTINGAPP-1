import "react-native-get-random-values"; // Polyfill for crypto
import "./ignoreWarnings"; // Import this FIRST to suppress warnings
import "./src/services/config"; // Initialize API Base URL and dynamic network config
import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import React from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import { StatusBar, StyleSheet, View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { CompanyProvider } from "./src/context/CompanyContext";
import { SettingsProvider } from "./src/context/SettingsContext"; // Import SettingsProvider

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CompanyProvider>
          <SettingsProvider> {/* Wrap with SettingsProvider */}
            <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
            <View style={styles.container}>
              <AppNavigator />
            </View>
          </SettingsProvider>
        </CompanyProvider>
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