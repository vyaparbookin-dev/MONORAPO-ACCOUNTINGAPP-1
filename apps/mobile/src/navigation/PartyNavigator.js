import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import Party-related screens
import PartiesScreen from '../screens/parties/PartiesScreen';
import AddPartyScreen from '../screens/parties/AddPartyScreen';
import PartyStatementScreen from '../screens/parties/PartyStatementScreen';
import PaymentEntryScreen from '../screens/parties/PaymentEntryScreen';
import ReviewParsedStatementScreen from '../screens/parties/ReviewParsedStatementScreen';

const Stack = createStackNavigator();

/**
 * Navigator for all screens related to Parties/Customers.
 */
function PartyNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PartyList" component={PartiesScreen} />
      <Stack.Screen name="AddParty" component={AddPartyScreen} />
      <Stack.Screen name="PartyStatement" component={PartyStatementScreen} />
      <Stack.Screen name="PaymentEntry" component={PaymentEntryScreen} />
      <Stack.Screen name="ReviewParsedStatement" component={ReviewParsedStatementScreen} />
    </Stack.Navigator>
  );
}

export default PartyNavigator;