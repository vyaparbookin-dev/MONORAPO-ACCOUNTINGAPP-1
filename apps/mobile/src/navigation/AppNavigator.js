import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import { AuthContext } from '../context/AuthContext';

// Import Navigators
import MainTabNavigator from './MainTabNavigator';
import BillingNavigator from './BillingNavigator';
import InventoryNavigator from './InventoryNavigator';
import PartyNavigator from './PartyNavigator';
import ReportNavigator from './ReportNavigator';
import SettingsNavigator from './SettingsNavigator';

// Import Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordscreen';
import KeyRecoveryScreen from '../screens/auth/KeyrecoveryScreen';

// Import Screens
import LeadListScreen from '../screens/lead/LeadListScreen';
import CreateLeadScreen from '../screens/lead/CreateLeadScreen';
import QuotationListScreen from '../screens/quotation/QuotationListScreen';
import CreateQuotationScreen from '../screens/quotation/CreateQuotationScreen';
import ApprovalsScreen from '../screens/dashboard/ApprovalsScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return null; // Or render a loading spinner if you want
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <> 
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="KeyRecovery" component={KeyRecoveryScreen} />
          </>
        ) : (
          <>
            {/* Main App with Bottom Tabs */}
            <Stack.Screen name="MainApp" component={MainTabNavigator} />

            {/* Other Navigators as Stacks */}
            <Stack.Screen name="Billing" component={BillingNavigator} />
            <Stack.Screen name="Inventory" component={InventoryNavigator} />
            <Stack.Screen name="Parties" component={PartyNavigator} />
            <Stack.Screen name="Reports" component={ReportNavigator} />
            <Stack.Screen name="Settings" component={SettingsNavigator} />

            {/* Standalone Screens that can be accessed from anywhere */}
            <Stack.Screen name="Leads" component={LeadListScreen} options={{ headerShown: true, title: 'Leads' }} />
            <Stack.Screen name="CreateLead" component={CreateLeadScreen} options={{ headerShown: true, title: 'Create Lead' }} />
            <Stack.Screen name="Quotations" component={QuotationListScreen} options={{ headerShown: true, title: 'Quotations' }} />
            <Stack.Screen name="CreateQuotation" component={CreateQuotationScreen} options={{ headerShown: true, title: 'Create Quotation' }} />
            <Stack.Screen name="Approvals" component={ApprovalsScreen} options={{ headerShown: true, title: 'Pending Approvals' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;