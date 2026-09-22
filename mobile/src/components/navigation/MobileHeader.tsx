import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  rightAction?: React.ReactNode;
}

export function MobileHeader({
  title,
  subtitle,
  showBack = true,
  onRefresh,
  isRefreshing = false,
  rightAction,
}: Props) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          {showBack && (
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/");
                }
              }}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => router.replace("/")} activeOpacity={0.8}>
            <View style={styles.brandRow}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>🍽️</Text>
              </View>
              <Text style={styles.brandText}>
                Bhojan<Text style={styles.brandAccent}>Hub</Text>
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.rightGroup}>
          {onRefresh && (
            <TouchableOpacity
              onPress={onRefresh}
              disabled={isRefreshing}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#C93E2B" />
              ) : (
                <Text style={styles.refreshIcon}>↻</Text>
              )}
            </TouchableOpacity>
          )}
          {rightAction}
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#F3E9DC",
    borderBottomWidth: 1,
    borderBottomColor: "#3A1A1615",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#3A1A1615",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3A1A16",
    marginTop: -2,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3A1A16",
    justifyContent: "center",
    alignItems: "center",
  },
  brandBadgeText: {
    fontSize: 14,
  },
  brandText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3A1A16",
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: "#C93E2B",
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#3A1A1615",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3A1A16",
  },
  titleContainer: {
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3A1A16",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "#665650",
    marginTop: 2,
  },
});

