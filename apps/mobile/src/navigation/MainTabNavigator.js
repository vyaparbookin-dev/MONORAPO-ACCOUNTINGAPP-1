import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Import Screens (Aapko apne hisaab se paths adjust karne pad sakte hain)
import MainDashboard from '../screens/dashboard/MainDashboard';
import PartiesScreen from '../screens/parties/PartiesScreen';
import MoreSettingsScreen from '../screens/settings/MoreSettingsScreen';
import ReportsMenuScreen from '../screens/report/ReportsMenuScreen';
import ProductListScreen from '../screens/inventory/ProductListScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#6C4CF1', // Purple Primary
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: styles.tabBar,
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
      
      <Tab.Screen 
        name="ReportsTab" 
        component={ReportsMenuScreen} 
        options={{ 
          headerShown: true, title: 'All Reports', tabBarLabel: 'Reports',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={22} color={color} /> 
        }} 
      />
      
      <Tab.Screen 
        name="Items" 
        component={ProductListScreen} 
        options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name="package-variant-closed" size={22} color={color} /> }} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault(); // Prevents loading missing components
            navigation.navigate('Inventory', { screen: 'ProductList' }); // Routes directly to proper stack
          }
        })}
      />
      <Tab.Screen 
        name="More" 
        component={MoreSettingsScreen} 
        options={{ tabBarIcon: ({ color }) => <Ionicons name="menu" size={24} color={color} /> }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    backgroundColor: '#ffffff',
    height: 65,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
});