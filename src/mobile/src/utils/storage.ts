import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'campusfolio_access_token';
const USER_KEY = 'campusfolio_user_info';

// Web fallback memory cache in case Expo Go / Web is used
const memoryStore = new Map<string, string>();

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return await SecureStore.isAvailableAsync();
}

export async function getStoredToken(): Promise<string | null> {
  try {
    if (await isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
    return memoryStore.get(TOKEN_KEY) || null;
  } catch {
    return memoryStore.get(TOKEN_KEY) || null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      memoryStore.set(TOKEN_KEY, token);
    }
  } catch {
    memoryStore.set(TOKEN_KEY, token);
  }
}

export async function removeStoredToken(): Promise<void> {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      memoryStore.delete(TOKEN_KEY);
    }
  } catch {
    memoryStore.delete(TOKEN_KEY);
  }
}

export async function getStoredUser<T>(): Promise<T | null> {
  try {
    let raw: string | null = null;
    if (await isSecureStoreAvailable()) {
      raw = await SecureStore.getItemAsync(USER_KEY);
    } else {
      raw = memoryStore.get(USER_KEY) || null;
    }
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setStoredUser<T>(user: T): Promise<void> {
  try {
    const raw = JSON.stringify(user);
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(USER_KEY, raw);
    } else {
      memoryStore.set(USER_KEY, raw);
    }
  } catch {
    // ignore
  }
}

export async function removeStoredUser(): Promise<void> {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(USER_KEY);
    } else {
      memoryStore.delete(USER_KEY);
    }
  } catch {
    // ignore
  }
}
