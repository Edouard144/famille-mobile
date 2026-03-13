// Web-compatible storage for Famille app
// Uses AsyncStorage for web, SecureStore for native

import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys used to store data on the device
const KEYS = {
  token:    'famille_jwt_token',   // JWT from login
  userId:   'famille_user_id',     // logged in user's ID
  userName: 'famille_user_name',   // shown on dashboard
};

const storage = {

  // ── Save JWT token after login ──────────────────
  async saveToken(token) {
    // Use AsyncStorage which works on both web and native
    await AsyncStorage.setItem(KEYS.token, token);
  },

  // ── Get JWT token for API calls ─────────────────
  async getToken() {
    return await AsyncStorage.getItem(KEYS.token);
  },

  // ── Save user info after login ──────────────────
  async saveUser(userId, userName) {
    await AsyncStorage.setItem(KEYS.userId, String(userId));
    await AsyncStorage.setItem(KEYS.userName, userName);
  },

  // ── Get user ID ─────────────────────────────────
  async getUserId() {
    const id = await AsyncStorage.getItem(KEYS.userId);
    return id ? parseInt(id) : null;
  },

  // ── Get user name for greeting ──────────────────
  async getUserName() {
    return await AsyncStorage.getItem(KEYS.userName);
  },

  // ── Clear everything on logout ──────────────────
  async clearAll() {
    await AsyncStorage.multiRemove([KEYS.token, KEYS.userId, KEYS.userName]);
  },

  // ── Check if user is logged in ──────────────────
  async isLoggedIn() {
    const token = await AsyncStorage.getItem(KEYS.token);
    return token !== null && token !== undefined;
  },
};

export default storage;
