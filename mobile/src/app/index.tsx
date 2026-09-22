import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function ModeSelectionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🍽️</Text>
        </View>

        <Text style={styles.brand}>
          Bhojan<Text style={styles.brandAccent}>Hub</Text>
        </Text>

        <Text style={styles.subtitle}>
          How would you like to continue?
        </Text>

        <View style={styles.options}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.replace("/login")}
            activeOpacity={0.85}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>🏪</Text>
            </View>

            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Restaurant</Text>
              <Text style={styles.optionDescription}>
                Manage your restaurant
              </Text>
            </View>

            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.replace("/customer")}
            activeOpacity={0.85}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>🍽️</Text>
            </View>

            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Customer</Text>
              <Text style={styles.optionDescription}>
                Browse menu and order food
              </Text>
            </View>

            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footer}>BhojanHub · Hospitality Platform</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3E9DC",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 90,
    paddingBottom: 30,
  },
  content: {
    alignItems: "center",
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#3A1A16",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 34,
  },
  brand: {
    fontSize: 32,
    fontWeight: "800",
    color: "#3A1A16",
    letterSpacing: -1,
  },
  brandAccent: {
    color: "#C93E2B",
  },
  subtitle: {
    fontSize: 15,
    color: "#665650",
    marginTop: 8,
    marginBottom: 34,
  },
  options: {
    width: "100%",
    gap: 14,
  },
  optionCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3A1A1612",
    shadowColor: "#3A1A16",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F3E9DC",
    justifyContent: "center",
    alignItems: "center",
  },
  optionEmoji: {
    fontSize: 25,
  },
  optionText: {
    flex: 1,
    marginLeft: 14,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3A1A16",
  },
  optionDescription: {
    fontSize: 12,
    color: "#665650",
    marginTop: 4,
  },
  arrow: {
    fontSize: 22,
    fontWeight: "700",
    color: "#C93E2B",
    marginLeft: 8,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#88756E",
  },
});