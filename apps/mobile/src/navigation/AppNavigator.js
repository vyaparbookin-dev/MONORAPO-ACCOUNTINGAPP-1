import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// Import Navigators
import MainTabNavigator from './MainTabNavigator';
import AuthNavigator from './AuthNavigator';
import BillingNavigator from './BillingNavigator';
import InventoryNavigator from './InventoryNavigator';
import PartyNavigator from './PartyNavigator';
import ReportNavigator from './ReportNavigator';
import SettingsNavigator from './SettingsNavigator';

// Import Screens
import LeadListPage from '../screens/lead/LeadListPage';
import CreateLeadPage from '../screens/lead/CreateLeadPage';
import QuotationListPage from '../screens/quotation/QuotationListPage';
import CreateQuotationPage from '../screens/quotation/CreateQuotationPage';
import ApprovalsScreen from '../screens/dashboard/ApprovalsScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth flow can be added here later */}
        {/* <Stack.Screen name="Auth" component={AuthNavigator} /> */}
        
        {/* Main App with Bottom Tabs */}
        <Stack.Screen name="MainApp" component={MainTabNavigator} />

        {/* Other Navigators as Stacks */}
        <Stack.Screen name="Billing" component={BillingNavigator} />
        <Stack.Screen name="Inventory" component={InventoryNavigator} />
        <Stack.Screen name="Parties" component={PartyNavigator} />
        <Stack.Screen name="Reports" component={ReportNavigator} />
        <Stack.Screen name="Settings" component={SettingsNavigator} />

        {/* Standalone Screens that can be accessed from anywhere */}
        <Stack.Screen name="Leads" component={LeadListPage} options={{ headerShown: true, title: 'Leads' }} />
        <Stack.Screen name="CreateLead" component={CreateLeadPage} options={{ headerShown: true, title: 'Create Lead' }} />
        <Stack.Screen name="Quotations" component={QuotationListPage} options={{ headerShown: true, title: 'Quotations' }} />
        <Stack.Screen name="CreateQuotation" component={CreateQuotationPage} options={{ headerShown: true, title: 'Create Quotation' }} />
        <Stack.Screen name="Approvals" component={ApprovalsScreen} options={{ headerShown: true, title: 'Pending Approvals' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;