import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";

export type NavTab = "home" | "pos" | "orders" | "tables" | "inventory" | "crm" | "reports" | "settings";

interface Props {
  activeTab?: NavTab;
}

export function BottomNavBar({ activeTab }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Derive current tab if not explicitly passed
  const currentTab: NavTab =
    activeTab ||
    (pathname === "/"
      ? "home"
      : pathname.includes("pos")
        ? "pos"
        : pathname.includes("online-ordering")
          ? "orders"
          : pathname.includes("tables")
            ? "tables"
            : pathname.includes("inventory")
              ? "inventory"
              : pathname.includes("crm")
                ? "crm"
                : pathname.includes("reports")
                  ? "reports"
                  : pathname.includes("settings")
                    ? "settings"
                    : "home");

  const navigateTo = (path: string) => {
    setShowMoreMenu(false);
    router.replace(path as any);
  };

  const isMoreActive = ["inventory", "crm", "reports", "settings"].includes(currentTab);

  return (
    <>
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo("/")}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, currentTab === "home" && styles.activeIcon]}>⌂</Text>
          <Text style={[styles.navLabel, currentTab === "home" && styles.activeLabel]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo("/pos")}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, currentTab === "pos" && styles.activeIcon]}>🧾</Text>
          <Text style={[styles.navLabel, currentTab === "pos" && styles.activeLabel]}>POS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo("/online-ordering")}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, currentTab === "orders" && styles.activeIcon]}>🍽️</Text>
          <Text style={[styles.navLabel, currentTab === "orders" && styles.activeLabel]}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo("/tables")}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, currentTab === "tables" && styles.activeIcon]}>🪑</Text>
          <Text style={[styles.navLabel, currentTab === "tables" && styles.activeLabel]}>Tables</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setShowMoreMenu(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, isMoreActive && styles.activeIcon]}>⋯</Text>
          <Text style={[styles.navLabel, isMoreActive && styles.activeLabel]}>More</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Access 'More' Sheet */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMoreMenu(false)}>
          <View style={styles.moreSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Operations Modules</Text>

            <View style={styles.sheetGrid}>
              <TouchableOpacity
                style={[styles.sheetItem, currentTab === "inventory" && styles.activeSheetItem]}
                onPress={() => navigateTo("/inventory")}
              >
                <View style={styles.sheetIconBox}>
                  <Text style={styles.sheetEmoji}>📦</Text>
                </View>
                <Text style={styles.sheetItemLabel}>Inventory</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetItem, currentTab === "crm" && styles.activeSheetItem]}
                onPress={() => navigateTo("/crm")}
              >
                <View style={styles.sheetIconBox}>
                  <Text style={styles.sheetEmoji}>👥</Text>
                </View>
                <Text style={styles.sheetItemLabel}>CRM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetItem, currentTab === "reports" && styles.activeSheetItem]}
                onPress={() => navigateTo("/reports")}
              >
                <View style={styles.sheetIconBox}>
                  <Text style={styles.sheetEmoji}>📊</Text>
                </View>
                <Text style={styles.sheetItemLabel}>Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetItem, currentTab === "settings" && styles.activeSheetItem]}
                onPress={() => navigateTo("/settings")}
              >
                <View style={styles.sheetIconBox}>
                  <Text style={styles.sheetEmoji}>⚙️</Text>
                </View>
                <Text style={styles.sheetItemLabel}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    height: 72,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#3A1A1615",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 6,
    shadowColor: "#3A1A16",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 54,
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 20,
    color: "#665650",
    marginBottom: 3,
  },
  activeIcon: {
    color: "#C93E2B",
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#665650",
  },
  activeLabel: {
    color: "#C93E2B",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(58, 26, 22, 0.4)",
    justifyContent: "flex-end",
  },
  moreSheet: {
    backgroundColor: "#FDFBF7",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: "#3A1A1610",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A1A1620",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3A1A16",
    marginBottom: 20,
    textAlign: "center",
  },
  sheetGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sheetItem: {
    alignItems: "center",
    width: "22%",
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#3A1A1610",
  },
  activeSheetItem: {
    borderColor: "#C93E2B40",
    backgroundColor: "#FFF1EE",
  },
  sheetIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3E9DC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  sheetEmoji: {
    fontSize: 20,
  },
  sheetItemLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3A1A16",
  },
});

