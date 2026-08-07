import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Footer = () => (
  <View style={styles.footer}>
    <Text style={styles.text}>© 2025 My Business App</Text>
  </View>
);

const styles = StyleSheet.create({
  footer: {
    padding: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  text: {
    color: "#64748b",
    fontSize: 12,
  },
});

export default Footer;