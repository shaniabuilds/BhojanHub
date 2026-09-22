
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { apiFetch, saveToken, getToken } from "../config/apiClient";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const checkExistingLogin = async () => {
      const token = await getToken();

      if (!isMounted) return;

      if (token) {
        router.replace("/restaurant-home");
      } else {
        setCheckingAuth(false);
      }
    };

    checkExistingLogin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiFetch<{
        user?: {
          id?: string;
          name?: string;
          email?: string;
          role?: string;
        };
        token?: string;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response?.token) {
        throw new Error("Token missing from server response.");
      }

      await saveToken(response.token);

      // Restaurant login goes directly to Restaurant Home.
      router.replace("/restaurant-home");
    } catch (err) {
      console.log("LOGIN ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C93E2B" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* BRAND */}
          <View style={styles.brandRow}>
            <View style={styles.brandIconBox}>
              <Text style={styles.brandEmoji}>🍽️</Text>
            </View>

            <Text style={styles.brandName}>
              Bhojan<Text style={styles.brandAccent}>Hub</Text>
            </Text>
          </View>

          {/* HEADER */}
          <Text style={styles.eyebrow}>RESTAURANT MANAGEMENT PLATFORM</Text>

          <Text style={styles.title}>Welcome back</Text>

          <Text style={styles.subtitle}>
            Sign in with your staff credentials to continue.
          </Text>

          {/* ERROR */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* EMAIL */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError("");
              }}
              placeholder="you@restaurant.com"
              placeholderTextColor="#9A8982"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          {/* PASSWORD */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError("");
              }}
              placeholder="••••••••"
              placeholderTextColor="#9A8982"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#F3E9DC" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                Sign In to Workspace →
              </Text>
            )}
          </TouchableOpacity>

          {/* SECURITY */}
          <View style={styles.securityNote}>
            <Text style={styles.securityText}>
              🔒 Secure staff access · Connected to BhojanHub Cloud
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 50,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: "#3A1A1615",
    shadowColor: "#3A1A16",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },

  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#3A1A16",
    justifyContent: "center",
    alignItems: "center",
  },

  brandEmoji: {
    fontSize: 18,
  },

  brandName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3A1A16",
    letterSpacing: -0.5,
  },

  brandAccent: {
    color: "#C93E2B",
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#C93E2B",
    marginBottom: 6,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#3A1A16",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 13,
    color: "#665650",
    marginTop: 4,
    marginBottom: 22,
    lineHeight: 18,
  },

  errorBox: {
    backgroundColor: "#FCE4DE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C93E2B30",
  },

  errorText: {
    color: "#C93E2B",
    fontSize: 12,
    fontWeight: "600",
  },

  formGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#665650",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#3A1A1620",
    backgroundColor: "#FDFBF7",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: "#3A1A16",
  },

  button: {
    marginTop: 10,
    backgroundColor: "#3A1A16",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#3A1A16",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#F3E9DC",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.2,
  },

  securityNote: {
    marginTop: 22,
    alignItems: "center",
  },

  securityText: {
    fontSize: 11,
    color: "#8D7C74",
  },
});