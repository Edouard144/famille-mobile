// services/storage.js
// Secure storage for JWT token and user info
// On mobile: uses expo-secure-store (encrypted)
// On web:    uses memory only (no persistence — web is for demo)

import { Platform } from 'react-native';

// We lazy-import SecureStore only on native
// to avoid crashes on web
async function getSecureStore() {
  if (Platform.OS === 'web') return null;
  return await import('expo-secure-store');
}

// ── In-memory fallback for web ─────────────────────
// Web doesn't persist between refreshes — that's fine
// for demo/testing purposes
const memoryStore = {};

async function setItem(key, value) {
  if (Platform.OS === 'web') {
    memoryStore[key] = value;
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key) {
  if (Platform.OS === 'web') {
    return memoryStore[key] || null;
  }
  const SecureStore = await getSecureStore();
  return await SecureStore.getItemAsync(key);
}

async function deleteItem(key) {
  if (Platform.OS === 'web') {
    delete memoryStore[key];
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore.deleteItemAsync(key);
}

// ── Public API ────────────────────────────────────
const storage = {

  // Save JWT token after login/verify
  async saveToken(token) {
    await setItem('jwt_token', token);
  },

  // Get JWT token for API requests
  async getToken() {
    return await getItem('jwt_token');
  },

  // Save user id and name after login
  async saveUser(userId, name) {
    await setItem('user_id',   String(userId));
    await setItem('user_name', name);
  },

  // Get user id
  async getUserId() {
    return await getItem('user_id');
  },

  // Get user display name
  async getUserName() {
    return await getItem('user_name');
  },

  // Check if user has a valid token saved
  async isLoggedIn() {
    const token = await getItem('jwt_token');
    return !!token; // true if token exists
  },

  // Clear everything on logout
  async clearAll() {
    await deleteItem('jwt_token');
    await deleteItem('user_id');
    await deleteItem('user_name');
  },
};

export default storage;