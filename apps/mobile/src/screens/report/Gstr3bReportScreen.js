import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Gstr3bReportScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GSTR-3B Report</Text>
      {/* GSTR-3B Report details will go here */}
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

export default Gstr3bReportScreen;