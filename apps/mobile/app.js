import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-get-random-values';
import './ignoreWarnings';
import './src/services/config';
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CompanyProvider } from './src/context/CompanyContext';
import { SettingsProvider } from './src/context/SettingsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './db';

// Bulletproof Error Boundary for Mobile
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("📱 App Startup Error Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#090d16', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>App Recovery Mode</Text>
          <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>{String(this.state.error?.message || 'Recovering...')}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDB()
      .catch((e) => console.warn("Background SQLite init:", e))
      .finally(() => setDbReady(true));
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <CompanyProvider>
            <SettingsProvider>
              <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
              <View style={styles.container}>
                <AppNavigator />
              </View>
            </SettingsProvider>
          </CompanyProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
});
