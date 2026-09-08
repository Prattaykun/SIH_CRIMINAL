/**
 * Authentication storage and session synchronization utilities.
 * Ensures deterministic, persistent token storage across browser tabs and devices.
 */

export const TOKEN_STORAGE_KEY = 'sih_auth_token';
export const USER_STORAGE_KEY = 'sih_auth_user';

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

/**
 * Retrieve the active JWT token from persistent localStorage.
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Persist or clear the JWT token in localStorage.
 */
export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage access might be restricted in some environments
  }
}

/**
 * Retrieve cached user profile from localStorage.
 */
export function getStoredUser<T = StoredUser>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Persist or clear user profile in localStorage.
 */
export function setStoredUser(user: unknown | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // Storage access might be restricted
  }
}

/**
 * Clear all authentication session state from localStorage.
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Ignore error
  }
}

/**
 * Subscribe to cross-tab storage events to sync login/logout state across browser tabs.
 */
export function subscribeToAuthSync(callback: (token: string | null, user: StoredUser | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_STORAGE_KEY || event.key === USER_STORAGE_KEY) {
      const currentToken = getStoredToken();
      const currentUser = getStoredUser<StoredUser>();
      callback(currentToken, currentUser);
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}
