import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getToken, clearToken, apiFetch } from "../config/apiClient";
import { BottomNavBar } from "../components/navigation/BottomNavBar";

interface ModuleCard {
  number: string;
  title: string;
  category: string;
  description: string;
  emoji: string;
  route: "/pos" | "/online-ordering" | "/tables" | "/inventory" | "/crm" | "/reports" | "/settings";
}

const platformModules: ModuleCard[] = [
  {
    number: "01",
    title: "Billing & POS",
    category: "Operations",
    description: "One-tap billing, multi-payment support, table assignments & receipt printing.",
    emoji: "🧾",
    route: "/pos",
  },
  {
    number: "02",
    title: "Online Ordering",
    category: "Digital Dining",
    description: "Digital menu, delivery & takeaway cart, customer checkout & order tracking.",
    emoji: "🍽️",
    route: "/online-ordering",
  },
  {
    number: "03",
    title: "Table Management",
    category: "Floor Plan",
    description: "Live floor status, table capacity, walk-in waitlist queue & party seating.",
    emoji: "🪑",
    route: "/tables",
  },
  {
    number: "04",
    title: "Inventory Management",
    category: "Stock Control",
    description: "Real-time stock tracking, low-stock alerts, one-tap restock & recipe links.",
    emoji: "📦",
    route: "/inventory",
  },
  {
    number: "05",
    title: "Guest CRM & Loyalty",
    category: "Guest Relations",
    description: "Customer directory, dining preferences, VIP repeat tags & loyalty points.",
    emoji: "👥",
    route: "/crm",
  },
  {
    number: "06",
    title: "Reporting & Analytics",
    category: "Intelligence",
    description: "Sales dashboards, menu velocity, channel breakdown & payment analytics.",
    emoji: "📊",
    route: "/reports",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      const token = await getToken();
      if (!token) {
        if (isMounted) router.replace("/login");
        return;
      }

      try {
        const me = await apiFetch<{ user?: { name?: string } }>("/api/auth/me");
        if (isMounted && me?.user?.name) {
          setUserName(me.user.name);
        }
      } catch {
        // Token might be valid or endpoint optional; proceed
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    };

    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of BhojanHub?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await clearToken();
          router.replace("/login");
        },
      },
    ]);
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C93E2B" />
        <Text style={styles.loadingText}>Connecting to BhojanHub…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP BRANDING BAR */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandEmoji}>🍽️</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>
                Bhojan<Text style={styles.brandAccent}>Hub</Text>
              </Text>
              {userName ? (
                <Text style={styles.brandUser}>Welcome, {userName}</Text>
              ) : (
                <Text style={styles.brandUser}>Restaurant Platform</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* 01 — HERO / BURGUNDY CARD */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroDivider} />
            <Text style={styles.heroBadgeText}>FINE DINING & HOSPITALITY</Text>
            <View style={styles.heroDivider} />
          </View>

          <Text style={styles.heroHeading}>
            The intelligent OS for{"\n"}
            <Text style={styles.heroHeadingAccent}>ambitious kitchens.</Text>
          </Text>

          <Text style={styles.heroDescription}>
            Streamline table reservations, harmonize front-of-house hospitality, and optimize kitchen
            pace with a platform crafted for culinary excellence.
          </Text>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => router.push("/pos" as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.heroPrimaryBtnText}>Launch POS Counter →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => router.push("/online-ordering" as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.heroSecondaryBtnText}>Online Orders</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.heroCustomerBtn}
            onPress={() => router.push("/customer" as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.heroCustomerBtnText}>🍽️ Customer Food Ordering Mode →</Text>
          </TouchableOpacity>
        </View>

        {/* 02 — ONE SYSTEM / FLOATING OVERLAP CARD */}
        <View style={styles.overlapCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardAccentBar} />
            <Text style={styles.cardEyebrow}>ONE SYSTEM</Text>
          </View>

          <Text style={styles.cardHeadline}>
            Less time managing.{"\n"}
            <Text style={styles.cardHeadlineAccent}>More time serving.</Text>
          </Text>

          <Text style={styles.cardSubheadline}>
            Engineered specifically for high-tempo dining rooms.
          </Text>

          <Text style={styles.cardBody}>
            Every tool is calibrated to eliminate communication bottlenecks between the kitchen brigade
            and dining room floor — no scattered tools, no unnecessary complexity.
          </Text>

          <View style={styles.cardFootnote}>
            <View style={styles.cardDot} />
            <Text style={styles.cardFootnoteText}>Built around your hospitality service</Text>
          </View>
        </View>

        {/* 03 — PLATFORM CAPABILITIES */}
        <View style={styles.modulesSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadgeRow}>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionBadge}>PLATFORM CAPABILITIES</Text>
            </View>

            <Text style={styles.sectionTitle}>
              Every moving part,{"\n"}
              <Text style={styles.sectionTitleAccent}>beautifully connected.</Text>
            </Text>

            <Text style={styles.sectionSubtitle}>
              Select any operational module below to access live data and workflows.
            </Text>
          </View>

          <View style={styles.modulesGrid}>
            {platformModules.map((mod) => (
              <TouchableOpacity
                key={mod.number}
                style={styles.moduleCard}
                onPress={() => router.push(mod.route as any)}
                activeOpacity={0.75}
              >
                <View style={styles.moduleTopRow}>
                  <View style={styles.moduleIconBox}>
                    <Text style={styles.moduleEmoji}>{mod.emoji}</Text>
                  </View>
                  <Text style={styles.moduleNumber}>{mod.number}</Text>
                </View>

                <Text style={styles.moduleCategory}>{mod.category}</Text>
                <Text style={styles.moduleTitle}>{mod.title}</Text>
                <Text style={styles.moduleDesc}>{mod.description}</Text>

                <View style={styles.moduleFooter}>
                  <Text style={styles.moduleOpenText}>Open Module</Text>
                  <Text style={styles.moduleArrow}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 04 — LIVE SYSTEM FOOTER STRIP */}
        <View style={styles.systemStatusBox}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live Cloud Sync Active</Text>
          </View>

          <TouchableOpacity
            style={styles.settingsLink}
            onPress={() => router.push("/settings" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsLinkText}>Platform Settings ⚙️</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3E9DC",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F3E9DC",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#665650",
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  topBar: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F3E9DC",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3A1A16",
    justifyContent: "center",
    alignItems: "center",
  },
  brandEmoji: {
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3A1A16",
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: "#C93E2B",
  },
  brandUser: {
    fontSize: 11,
    color: "#665650",
    fontWeight: "500",
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3A1A1620",
    backgroundColor: "#FFFFFF80",
  },
  logoutText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3A1A16",
  },

  // HERO SECTION
  heroSection: {
    backgroundColor: "#3A1A16",
    marginHorizontal: 16,
    borderRadius: 28,
    padding: 24,
    marginTop: 8,
    shadowColor: "#3A1A16",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  heroDivider: {
    width: 16,
    height: 1.5,
    backgroundColor: "#C93E2B",
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#F3E9DC",
    opacity: 0.8,
  },
  heroHeading: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  heroHeadingAccent: {
    color: "#F3E9DC",
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#D8CBBE",
    marginTop: 12,
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  heroPrimaryBtn: {
    flex: 1.2,
    backgroundColor: "#C93E2B",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#C93E2B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroPrimaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  heroSecondaryBtn: {
    flex: 0.9,
    backgroundColor: "#FFFFFF15",
    borderWidth: 1,
    borderColor: "#FFFFFF30",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  heroSecondaryBtnText: {
    color: "#F3E9DC",
    fontWeight: "600",
    fontSize: 13,
  },
  heroCustomerBtn: {
    backgroundColor: "#F3E9DC",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F3E9DC",
  },
  heroCustomerBtnText: {
    color: "#3A1A16",
    fontWeight: "800",
    fontSize: 13,
  },

  // OVERLAP CARD
  overlapCard: {
    backgroundColor: "#FFFCF9",
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 22,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#3A1A1612",
    shadowColor: "#3A1A16",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cardAccentBar: {
    width: 14,
    height: 2,
    backgroundColor: "#C93E2B",
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#C93E2B",
  },
  cardHeadline: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: "#2B211F",
    letterSpacing: -0.4,
  },
  cardHeadlineAccent: {
    color: "#7A3026",
  },
  cardSubheadline: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3A1A16",
    marginTop: 8,
  },
  cardBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "#5E514C",
    marginTop: 6,
  },
  cardFootnote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#3A1A1610",
  },
  cardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C93E2B",
  },
  cardFootnoteText: {
    fontSize: 11,
    color: "#786A64",
    fontWeight: "500",
  },

  // MODULES SECTION
  modulesSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sectionDivider: {
    width: 14,
    height: 2,
    backgroundColor: "#C93E2B",
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#3A1A16",
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#3A1A16",
    letterSpacing: -0.4,
  },
  sectionTitleAccent: {
    color: "#6F3028",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#5E514C",
    marginTop: 6,
    lineHeight: 18,
  },
  modulesGrid: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#3A1A1610",
    shadowColor: "#3A1A16",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  moduleTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F3E9DC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3A1A1610",
  },
  moduleEmoji: {
    fontSize: 22,
  },
  moduleNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: "#C93E2B",
    letterSpacing: 1,
  },
  moduleCategory: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#88756E",
    marginTop: 12,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3A1A16",
    marginTop: 2,
  },
  moduleDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: "#5E514C",
    marginTop: 6,
  },
  moduleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#3A1A1608",
  },
  moduleOpenText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C93E2B",
  },
  moduleArrow: {
    fontSize: 16,
    color: "#C93E2B",
    fontWeight: "700",
  },

  // STATUS BOX
  systemStatusBox: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF90",
    borderWidth: 1,
    borderColor: "#3A1A1610",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  liveText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
  },
  settingsLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  settingsLinkText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3A1A16",
  },
});