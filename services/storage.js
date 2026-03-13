import * as SecureStore from 'expo-secure-store';

// Keys used to store data on the device
const KEYS = {
  token:    'famille_jwt_token',   // JWT from login
  userId:   'famille_user_id',     // logged in user's ID
  userName: 'famille_user_name',   // shown on dashboard
};

const storage = {

  // ── Save JWT token after login ──────────────────
  async saveToken(token) {
    // SecureStore encrypts the token on the device
    await SecureStore.setItemAsync(KEYS.token, token);
  },

  // ── Get JWT token for API calls ─────────────────
  async getToken() {
    return await SecureStore.getItemAsync(KEYS.token);
  },

  // ── Save user info after login ──────────────────
  async saveUser(userId, userName) {
    await SecureStore.setItemAsync(KEYS.userId,   String(userId));
    await SecureStore.setItemAsync(KEYS.userName, userName);
  },

  // ── Get user ID ─────────────────────────────────
  async getUserId() {
    const id = await SecureStore.getItemAsync(KEYS.userId);
    return id ? parseInt(id) : null;
  },

  // ── Get user name for greeting ──────────────────
  async getUserName() {
    return await SecureStore.getItemAsync(KEYS.userName);
  },

  // ── Clear everything on logout ──────────────────
  async clearAll() {
    await SecureStore.deleteItemAsync(KEYS.token);
    await SecureStore.deleteItemAsync(KEYS.userId);
    await SecureStore.deleteItemAsync(KEYS.userName);
  },

  // ── Check if user is logged in ──────────────────
  async isLoggedIn() {
    const token = await SecureStore.getItemAsync(KEYS.token);
    return token !== null && token !== undefined;
  },
};

export default storage;