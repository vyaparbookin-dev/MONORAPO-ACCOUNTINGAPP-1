import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ReportCard = ({ title, value }) => (
  <View style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    color: "#475569",
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563eb",
  },
});

export default ReportCard;