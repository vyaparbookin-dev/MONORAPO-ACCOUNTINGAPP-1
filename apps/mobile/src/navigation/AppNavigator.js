import React, { useContext, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, LogBox, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import Loader from '../components/Loader';

// Navigators
import MainTabNavigator from './MainTabNavigator';
import BillingNavigator from './BillingNavigator';
import InventoryNavigator from './InventoryNavigator';
import ReportNavigator from './ReportNavigator';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordscreen from '../screens/auth/ForgotPasswordscreen';
import PartiesScreen from '../screens/parties/PartiesScreen'; // Fixed casing to match filename
import AddPartyScreen from '../screens/parties/AddPartyScreen';
import PartyStatementScreen from '../screens/parties/PartyStatementScreen';
import ReviewParsedStatementScreen from '../screens/parties/ReviewParsedStatementScreen';
import PaymentEntryScreen from '../screens/parties/PaymentEntryScreen';
import KeyrecoveryScreen from '../screens/auth/KeyrecoveryScreen';
import ExpensesListScreen from '../screens/expenses/ExpensesListScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import DayBookScreen from '../screens/report/DayBookScreen';
import B2bDocumentListScreen from '../screens/billing/B2bDocumentListScreen';
import CreateB2bDocumentScreen from '../screens/billing/CreateB2bDocumentScreen';
import StockAdjustmentScreen from '../screens/inventory/StockAdjustmentScreen';
import StockTransferScreen from '../screens/inventory/StockTransferScreen';
import SupplierLedgerScreen from '../screens/inventory/SupplierLedgerScreen';
import StaffManagementScreen from '../screens/settings/StaffManagementScreen';
import AppSettingsScreen from '../screens/settings/AppSettingsScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import NotificationSettings from '../screens/settings/NotificationSettings';
import SecurityLogsScreen from '../screens/settings/SecurityLogsScreen';
import CreateReturnPage from '../screens/returns/CreateReturnPage';
import ApprovalsScreen from '../screens/dashboard/ApprovalsScreen';

// --- New Screens (Registered for Full App Access) ---
import CompanyListScreen from '../screens/company/CompanyListScreen';
import BranchScreen from '../screens/company/BranchScreen';
import FeatureControlScreen from '../screens/company/FeatureControlScreen';
import AddCompanyScreen from '../screens/company/AddCompanyScreen';
import AddCouponScreen from '../screens/coupons/AddCouponScreen';
import CouponListScreen from '../screens/coupons/couponListScreen';
import AddLaterpadScreen from '../screens/laterpad/AddLaterpadScreen';
import LaterpadListScreen from '../screens/laterpad/LaterpadListScreen';
import LoyaltyDetailScreen from '../screens/membership/LoyaltyDetailScreen';
import MembershipListScreen from '../screens/membership/MembershipListScreen';
import ReminderScreen from '../screens/notification/ReminderScreen';
import AddSalaryScreen from '../screens/salary/AddSalaryScreen';
import AddStaffScreen from '../screens/salary/AddStaffScreen';
import MarkAttendanceScreen from '../screens/salary/MarkAttendanceScreen';
import SalaryListScreen from '../screens/salary/SalaryListScreen';
import StaffStatementScreen from '../screens/salary/StaffStatementScreen';
import BackupRestoreScreen from '../screens/settings/BackupRestoreScreen';
import CloudsyncSetting from '../screens/settings/CloudsyncSetting';
import SettingsScreen from '../screens/settings/SettingsScreen';
import AddWarehouseScreen from '../screens/warehouse/AddWarehouseScreen';
import WarehouseListScreen from '../screens/warehouse/WarehouseListScreen';


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
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Something went wrong!</Text>
          <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
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
    return <Loader />;
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token ? (
            <>
              <Stack.Screen name="MainApp" component={MainTabNavigator} />
              {/* Add Parties screen to the main stack so it can be called from anywhere */}
              <Stack.Screen name="Parties" component={PartiesScreen} options={{ headerShown: true, title: 'Parties' }} />
              <Stack.Screen name="Billing" component={BillingNavigator} options={{ headerShown: false }} />
              <Stack.Screen name="Inventory" component={InventoryNavigator} options={{ headerShown: false }} />
              <Stack.Screen name="Reports" component={ReportNavigator} options={{ headerShown: false }} />
              <Stack.Screen name="AddParty" component={AddPartyScreen} options={{ headerShown: true, title: 'Add Party' }} />
              <Stack.Screen name="PartyStatement" component={PartyStatementScreen} options={({ route }) => ({ headerShown: true, title: route.params?.partyName || 'Statement' })} />
              <Stack.Screen name="ReviewParsedStatement" component={ReviewParsedStatementScreen} options={{ headerShown: true, title: 'Review Statement' }} />
              <Stack.Screen name="PaymentEntry" component={PaymentEntryScreen} options={{ headerShown: true, title: 'Payment Entry' }} />
              <Stack.Screen name="Expenses" component={ExpensesListScreen} options={{ headerShown: true, title: 'Expenses' }} />
              <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ headerShown: true, title: 'Add Expense' }} />
              <Stack.Screen name="DayBook" component={DayBookScreen} options={{ headerShown: true, title: 'Day Book' }} />
              <Stack.Screen name="B2bDocuments" component={B2bDocumentListScreen} options={{ headerShown: true, title: 'B2B Documents' }} />
              <Stack.Screen name="CreateB2bDocument" component={CreateB2bDocumentScreen} options={{ headerShown: true, title: 'Create B2B Document' }} />
              <Stack.Screen name="StockAdjustment" component={StockAdjustmentScreen} options={{ headerShown: true, title: 'Stock Adjustment' }} />
              <Stack.Screen name="StockTransfer" component={StockTransferScreen} options={{ headerShown: true, title: 'Stock Transfer' }} />
              <Stack.Screen name="SupplierLedger" component={SupplierLedgerScreen} options={{ headerShown: true, title: 'Supplier Ledger' }} />
              <Stack.Screen name="StaffManagement" component={StaffManagementScreen} options={{ headerShown: true, title: 'Staff Management' }} />
              <Stack.Screen name="AppSettings" component={AppSettingsScreen} options={{ headerShown: true, title: 'App Settings' }} />
              <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Notifications" component={NotificationSettings} options={{ headerShown: true, title: 'Notifications' }} />
              <Stack.Screen name="SecurityLogs" component={SecurityLogsScreen} options={{ headerShown: true, title: 'Security Logs' }} />
              <Stack.Screen name="CreateReturn" component={CreateReturnPage} options={{ headerShown: true, title: 'Create Return' }} />
              <Stack.Screen name="Approvals" component={ApprovalsScreen} options={{ headerShown: true, title: 'Approvals' }} />
              
              {/* Newly Registered Modules */}
              <Stack.Screen name="CompanyList" component={CompanyListScreen} options={{ headerShown: true, title: 'Companies' }} />
              <Stack.Screen name="Branch" component={BranchScreen} options={{ headerShown: true, title: 'Branches' }} />
              <Stack.Screen name="FeatureControl" component={FeatureControlScreen} options={{ headerShown: true, title: 'Feature Control' }} />
              <Stack.Screen name="AddCompany" component={AddCompanyScreen} options={{ headerShown: true, title: 'Add Company' }} />
              <Stack.Screen name="AddCoupon" component={AddCouponScreen} options={{ headerShown: true, title: 'Add Coupon' }} />
              <Stack.Screen name="CouponList" component={CouponListScreen} options={{ headerShown: true, title: 'Coupons' }} />
              <Stack.Screen name="AddLaterpad" component={AddLaterpadScreen} options={{ headerShown: true, title: 'Add Laterpad' }} />
              <Stack.Screen name="LaterpadList" component={LaterpadListScreen} options={{ headerShown: true, title: 'Laterpad' }} />
              <Stack.Screen name="LoyaltyDetail" component={LoyaltyDetailScreen} options={{ headerShown: true, title: 'Loyalty Detail' }} />
              <Stack.Screen name="MembershipList" component={MembershipListScreen} options={{ headerShown: true, title: 'Memberships' }} />
              <Stack.Screen name="Reminder" component={ReminderScreen} options={{ headerShown: true, title: 'Reminders' }} />
              <Stack.Screen name="AddSalary" component={AddSalaryScreen} options={{ headerShown: true, title: 'Add Salary' }} />
              <Stack.Screen name="AddStaff" component={AddStaffScreen} options={{ headerShown: true, title: 'Add Staff' }} />
              <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} options={{ headerShown: true, title: 'Mark Attendance' }} />
              <Stack.Screen name="SalaryList" component={SalaryListScreen} options={{ headerShown: true, title: 'Salary List' }} />
              <Stack.Screen name="StaffStatement" component={StaffStatementScreen} options={{ headerShown: true, title: 'Staff Statement' }} />
              <Stack.Screen name="BackupRestore" component={BackupRestoreScreen} options={{ headerShown: true, title: 'Backup & Restore' }} />
              <Stack.Screen name="CloudsyncSetting" component={CloudsyncSetting} options={{ headerShown: true, title: 'Cloud Sync' }} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
              <Stack.Screen name="AddWarehouse" component={AddWarehouseScreen} options={{ headerShown: true, title: 'Add Warehouse' }} />
              <Stack.Screen name="WarehouseList" component={WarehouseListScreen} options={{ headerShown: true, title: 'Warehouses' }} />
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
