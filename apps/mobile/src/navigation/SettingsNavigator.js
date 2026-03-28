import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Settings
import SettingsScreen from '../screens/settings/SettingsScreen';
import AppSettingsScreen from '../screens/settings/AppSettingsScreen';
import BackupRestoreScreen from '../screens/settings/BackupRestoreScreen';
import CloudsyncSetting from '../screens/settings/CloudsyncSetting';
import NotificationSettings from '../screens/settings/NotificationSettings';
import ProfileScreen from '../screens/settings/ProfileScreen';
import SecurityLogsScreen from '../screens/settings/SecurityLogsScreen';

// Company
import CompanyListScreen from '../screens/company/CompanyListScreen';
import AddCompanyScreen from '../screens/company/AddCompanyScreen';
import BranchScreen from '../screens/company/BranchScreen';
import FeatureControlScreen from '../screens/company/FeatureControlScreen';

// Warehouse
import WarehouseListScreen from '../screens/warehouse/WarehouseListScreen';
import AddWarehouseScreen from '../screens/warehouse/AddWarehouseScreen';

// Salary
import SalaryListScreen from '../screens/salary/SalaryListScreen';
import AddSalaryScreen from '../screens/salary/AddSalaryScreen';
import AddStaffScreen from '../screens/salary/AddStaffScreen';
import MarkAttendanceScreen from '../screens/salary/MarkAttendanceScreen';
import StaffStatementScreen from '../screens/salary/StaffStatementScreen';

// Expenses
import ExpensesListScreen from '../screens/expenses/ExpensesListScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';

// Coupons & Membership
import CouponListScreen from '../screens/coupons/couponListScreen';
import AddCouponScreen from '../screens/coupons/AddCouponScreen';
import MembershipListScreen from '../screens/membership/MembershipListScreen';
import LoyaltyDetailScreen from '../screens/membership/LoyaltyDetailScreen';

// Laterpad
import LaterpadListScreen from '../screens/laterpad/LaterpadListScreen';
import AddLaterpadScreen from '../screens/laterpad/AddLaterpadScreen';

// Notification
import ReminderScreen from '../screens/notification/ReminderScreen';

const Stack = createStackNavigator();

export default function SettingsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
      
      {/* Settings */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
      <Stack.Screen name="BackupRestore" component={BackupRestoreScreen} />
      <Stack.Screen name="CloudSync" component={CloudsyncSetting} />
      <Stack.Screen name="Notifications" component={NotificationSettings} />
      <Stack.Screen name="SecurityLogs" component={SecurityLogsScreen} />

      {/* Company */}
      <Stack.Screen name="CompanyList" component={CompanyListScreen} />
      <Stack.Screen name="AddCompany" component={AddCompanyScreen} />
      <Stack.Screen name="Branch" component={BranchScreen} />
      <Stack.Screen name="FeatureControl" component={FeatureControlScreen} />

      {/* Warehouse */}
      <Stack.Screen name="WarehouseList" component={WarehouseListScreen} />
      <Stack.Screen name="AddWarehouse" component={AddWarehouseScreen} />

      {/* Salary */}
      <Stack.Screen name="SalaryList" component={SalaryListScreen} />
      <Stack.Screen name="AddSalary" component={AddSalaryScreen} />
      <Stack.Screen name="AddStaff" component={AddStaffScreen} options={{ title: 'Add Staff' }} />
      <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} options={{ title: 'Attendance & Leave' }} />
      <Stack.Screen name="StaffStatement" component={StaffStatementScreen} options={{ title: 'Staff Ledger' }} />
      
      {/* Others */}
      <Stack.Screen name="Expenses" component={ExpensesListScreen} options={{ title: 'Expenses' }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="CouponList" component={CouponListScreen} />
      <Stack.Screen name="AddCoupon" component={AddCouponScreen} />
      <Stack.Screen name="MembershipList" component={MembershipListScreen} />
      <Stack.Screen name="LoyaltyDetail" component={LoyaltyDetailScreen} />
      <Stack.Screen name="LaterpadList" component={LaterpadListScreen} />
      <Stack.Screen name="AddLaterpad" component={AddLaterpadScreen} />
      <Stack.Screen name="Reminders" component={ReminderScreen} /> 
    </Stack.Navigator>
  );
}