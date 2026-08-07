import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

const Card = ({ title, children }) => (
  <View style={styles.card}>
    {title && <Text style={styles.title}>{title}</Text>}
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1e293b",
  },
});

export default Card;