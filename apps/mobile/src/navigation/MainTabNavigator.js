import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Import Screens (Aapko apne hisaab se paths adjust karne pad sakte hain)
import MainDashboard from '../screens/dashboard/MainDashboard';
import PartiesScreen from '../screens/parties/PartiesScreen';
import MoreSettingsScreen from '../screens/settings/SettingsScreen'; // Changed to main settings screen
import ReportsMenuScreen from '../screens/report/ReportsMenuScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen'; // Changed from ProductListScreen

const Tab = createBottomTabNavigator();

// Custom "Add" button component
const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={{
      top: -25,
      justifyContent: 'center',
      alignItems: 'center',
      ...styles.shadow
    }}
    onPress={onPress}
  >
    <View style={{
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#4338ca' // Primary color
    }}>
      {children}
    </View>
  </TouchableOpacity>
);

const AddButtonPlaceholder = () => null; // Empty component for the center tab

export default function MainTabNavigator({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#6C4CF1', // Purple Primary
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: styles.tabBar, // Use custom style
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={MainDashboard} 
        options={{ tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }} 
      />
      <Tab.Screen 
        name="Parties" 
        component={PartiesScreen} 
        options={{ tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} /> }} 
      />

      {/* Center Add Button */}
      <Tab.Screen
        name="Add"
        component={AddButtonPlaceholder} // Dummy component
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name="add" size={30} color="#fff" />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} onPress={() => navigation.navigate('CreateBill')} />
          ),
        }}
      />

      <Tab.Screen 
        name="Reports" 
        component={ReportsMenuScreen} 
        options={{ tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={22} color={color} /> }} 
      />

      <Tab.Screen 
        name="Items" 
        component={InventoryScreen} 
        options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name="package-variant-closed" size={22} color={color} /> }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5
  }
});