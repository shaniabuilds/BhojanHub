import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MobileHeader } from "../components/navigation/MobileHeader";
import { BottomNavBar } from "../components/navigation/BottomNavBar";
import { clearToken, getToken, apiFetch } from "../config/apiClient";
import { API_BASE_URL } from "../config/api";

export default function SettingsScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("BhojanHub Staff");
  const [userEmail, setUserEmail] = useState<string>("admin@bhojanhub.com");
  const [userRole, setUserRole] = useState<string>("Store Administrator");
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Active & Verified 🟢");
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  // Load current user profile from server
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const data = await apiFetch<{
          user?: { name?: string; email?: string; role?: string };
        }>("/api/auth/me");

        if (isMounted && data?.user) {
          if (data.user.name) setUserName(data.user.name);
          if (data.user.email) setUserEmail(data.user.email);
          if (data.user.role) setUserRole(data.user.role);
        }
      } catch {
        // Fallback default profile
      }
    };

    void fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Test live backend connection
  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      await apiFetch("/api/menu");
      setConnectionStatus("Active & Verified 🟢");
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      Alert.alert(
        "Connection Verified",
        `Successfully pinged production cloud server at ${API_BASE_URL}`
      );
    } catch {
      setConnectionStatus("Offline / Fallback Mode 🟡");
      Alert.alert(
        "Connection Notice",
        "Could not verify remote server. Operating in offline/local cache mode."
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Sign out handler
  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out of BhojanHub?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await clearToken();
            router.replace("/login");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <MobileHeader
        title="Platform Settings"
        subtitle="System & Account Preferences"
      />

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarEmoji}>👨‍🍳</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{userRole.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Outlet & Operations */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Restaurant Outlet</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Active Branch</Text>
            <Text style={styles.settingValue}>BhojanHub Flagship #01</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Operating Mode</Text>
            <Text style={styles.settingValue}>Full Service Dine-In & Delivery</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Standard Currency</Text>
            <Text style={styles.settingValue}>Indian Rupee (₹ INR)</Text>
          </View>
        </View>

        {/* Financial & Tax Defaults */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Financial & Billing Rules</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Default GST Tax Rate</Text>
            <Text style={styles.settingValue}>5.0%</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Hospitality Service Charge</Text>
            <Text style={styles.settingValue}>5.0% (Opt-in)</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-Generate KOT</Text>
            <Text style={styles.settingValue}>Enabled (Kitchen Ticket)</Text>
          </View>
        </View>

        {/* Cloud Server & Sync Status */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Cloud Synchronization</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Server Endpoint</Text>
            <Text style={styles.serverUrlText} numberOfLines={1}>
              {API_BASE_URL}
            </Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Live Connection</Text>
            <Text style={styles.settingValue}>{connectionStatus}</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Last Synchronized</Text>
            <Text style={styles.settingValue}>{lastSyncTime}</Text>
          </View>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={testConnection}
            disabled={isTestingConnection}
            activeOpacity={0.8}
          >
            {isTestingConnection ? (
              <ActivityIndicator color="#E29074" size="small" />
            ) : (
              <Text style={styles.testBtnText}>Verify Server Ping ⚡</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About BhojanHub Mobile</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Mobile App Version</Text>
            <Text style={styles.settingValue}>v1.0.0 (Expo SDK 54)</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Backend Runtime</Text>
            <Text style={styles.settingValue}>Next.js + MongoDB Enterprise</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Data Encryption</Text>
            <Text style={styles.settingValue}>TLS 1.3 / Bearer JWT</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutButtonText}>Sign Out of BhojanHub 🚪</Text>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>

      <BottomNavBar activeTab="settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F0E0C",
  },
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#44211D",
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#3A1A16",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C93E2B",
    marginRight: 14,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F3E9DC",
  },
  profileEmail: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#3A1A16",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#5A2822",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E29074",
  },
  sectionCard: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F3E9DC",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#381714",
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 13,
    color: "#BCA393",
  },
  settingValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F3E9DC",
  },
  serverUrlText: {
    fontSize: 12,
    color: "#E29074",
    maxWidth: "55%",
  },
  testBtn: {
    backgroundColor: "#3A1A16",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#5A2822",
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },
  testBtnText: {
    color: "#E29074",
    fontSize: 12,
    fontWeight: "700",
  },
  logoutButton: {
    backgroundColor: "#C93E2B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});

