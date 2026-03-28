import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CashFlowReportScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cash Flow Report</Text>
      {/* Cash Flow Report details will go here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default CashFlowReportScreen;