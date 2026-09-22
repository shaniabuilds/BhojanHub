import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./api";

const TOKEN_KEY = "bhojanhub_token";

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * Use this instead of the raw `fetch` for every API call in the app.
 * It automatically:
 *  - prefixes the URL with API_BASE_URL
 *  - attaches "Authorization: Bearer <token>" if a token is saved
 *  - parses the JSON response
 *  - throws a readable Error if the request failed
 */
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // response wasn't JSON (e.g. an unexpected HTML error page)
  }

  if (!response.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}