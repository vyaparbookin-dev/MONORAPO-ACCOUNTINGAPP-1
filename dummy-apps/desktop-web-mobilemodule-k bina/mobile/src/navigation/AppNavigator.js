import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import Loader from '../components/Loader';

// Navigators
import MainTabNavigator from './MainTabNavigator';
import BillingNavigator from './BillingNavigator';
import InventoryNavigator from './InventoryNavigator';
import ReportNavigator from './ReportNavigator';
import SettingsNavigator from './SettingsNavigator';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordscreen from '../screens/auth/ForgotPasswordscreen';
import AddPartyScreen from '../screens/parties/AddPartyScreen';
import ReviewParsedStatementScreen from '../screens/parties/ReviewParsedStatementScreen';
import PaymentEntryScreen from '../screens/parties/PaymentEntryScreen';
import KeyrecoveryScreen from '../screens/auth/KeyrecoveryScreen';
import StockAdjustmentScreen from '../screens/inventory/StockAdjustmentScreen';
import StockTransferScreen from '../screens/inventory/StockTransferScreen';
import SupplierLedgerScreen from '../screens/inventory/SupplierLedgerScreen';
import CreateReturnPage from '../screens/returns/CreateReturnPage';
import ApprovalsScreen from '../screens/dashboard/ApprovalsScreen';
import PartyStatementScreen from '../screens/parties/PartyStatementScreen';
import AddProductScreen from '../screens/inventory/AddProductScreen';


const Stack = createStackNavigator();

// 1. Error Boundary Component (यह एरर को स्क्रीन पर दिखाएगा)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fef2f2'}}>
          <View style={{backgroundColor: '#fff', padding: 30, borderRadius: 15, elevation: 10, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width: 0, height: 2}}}>
            <Text style={{fontSize: 22, fontWeight: 'bold', color: '#dc2626', marginBottom: 10}}>⚠️ App Error</Text>
            <Text style={{fontSize: 14, color: '#4b5563', textAlign: 'center', marginBottom: 20}}>
              {this.state.error?.toString()}
            </Text>
            <Text style={{fontSize: 12, color: '#9ca3af', textAlign: 'center'}}>Terminal (Expo log) me error details check karein.</Text>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function AppNavigator() {
  // We get the token from our AuthContext
  const { token, loading } = useContext(AuthContext);

  // 2. Debugging Logs (कंसोल में चेक करें कि क्या प्रिंट हो रहा है)
  useEffect(() => {
    console.log("AppNavigator Status -> Loading:", loading, "| Token:", token ? "Yes" : "No");
  }, [loading, token]);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6'}}>
        <Loader />
        <Text style={{marginTop: 20, color: '#4b5563', fontWeight: 'bold'}}>Connecting to server...</Text>
        <Text style={{marginTop: 10, color: '#ef4444', fontSize: 12, textAlign: 'center', paddingHorizontal: 40}}>
          (Agar ye yahi atka rahe, toh pakka Backend API connect nahi ho raha. Apna local IP address .env me check karein, 'localhost' mobile me kaam nahi karta.)
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token ? (
            <>
              <Stack.Screen name="MainApp" component={MainTabNavigator} />
              {/* Add Parties screen to the main stack so it can be called from anywhere */}
              <Stack.Screen name="AddParty" component={AddPartyScreen} options={{ headerShown: true, title: 'Add Party' }} />
              <Stack.Screen name="PartyStatement" component={PartyStatementScreen} options={({ route }) => ({ headerShown: true, title: route.params?.partyName || 'Statement' })} />
              <Stack.Screen name="ReviewParsedStatement" component={ReviewParsedStatementScreen} options={{ headerShown: true, title: 'Review Statement' }} />
              <Stack.Screen name="PaymentEntry" component={PaymentEntryScreen} options={{ headerShown: true, title: 'Payment Entry' }} />
              <Stack.Screen name="CreateReturn" component={CreateReturnPage} options={{ headerShown: true, title: 'Create Return' }} />
              <Stack.Screen name="Approvals" component={ApprovalsScreen} options={{ headerShown: true, title: 'Approvals' }} />

              {/* Inventory Module Screens */}
              <Stack.Screen name="StockAdjustment" component={StockAdjustmentScreen} options={{ headerShown: true, title: 'Stock Adjustment' }} />
              <Stack.Screen name="StockTransfer" component={StockTransferScreen} options={{ headerShown: true, title: 'Stock Transfer' }} />
              <Stack.Screen name="SupplierLedger" component={SupplierLedgerScreen} options={{ headerShown: true, title: 'Supplier Ledger' }} />

              {/* Use Nested Navigators for better organization */}
              <Stack.Screen name="Billing" component={BillingNavigator} />
              <Stack.Screen name="Inventory" component={InventoryNavigator} />
              <Stack.Screen name="Reports" component={ReportNavigator} />
              <Stack.Screen name="Settings" component={SettingsNavigator} />

              {/* ये स्क्रीन अभी भी यहाँ रह सकती हैं क्योंकि ये मोडल (modal) या विशेष स्क्रीन हैं */}
              <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ headerShown: false }} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordscreen} />
              <Stack.Screen name="KeyRecovery" component={KeyrecoveryScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
      android: { elevation: 5 },
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.25)' }
    })
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 10
  },
  errorText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center'
  }
});
