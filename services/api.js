import API_BASE_URL from '../constants/api';
import storage from './storage';

// ── Core request function ──────────────────────────────────────
// All API calls use this — it handles token injection and errors

async function request(endpoint, method = 'GET', body = null, requiresAuth = true) {

  // Build headers
  const headers = {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  };

  // Attach JWT token if this route requires authentication
  if (requiresAuth) {
    const token = await storage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Build request options
  const options = { method, headers };

  // Attach body for POST/PUT requests
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    // Return both status and data so callers can handle errors
    return { ok: response.ok, status: response.status, data };

  } catch (error) {
    // Network error — no internet or server down
    console.error('API Error:', error);
    return { ok: false, status: 0, data: { error: 'Ikibazo cy\'umuyoboro.' } };
  }
}

// ─────────────────────────────────────────────────────────────
//  AUTH endpoints
// ─────────────────────────────────────────────────────────────

export const authAPI = {

  // Get CAPTCHA image URL — used directly as image source
  getCaptchaUrl() {
    return `${API_BASE_URL}/captcha?t=${Date.now()}`; // t= prevents caching
  },

  // Register a new parent
  async signup(name, email, password, phone, captchaAnswer) {
    return request('/auth/signup', 'POST', {
      name, email, password, phone, captchaAnswer
    }, false); // false = no token needed
  },

  // Verify OTP after signup
  async verifyOtp(userId, code) {
    return request('/auth/verify-otp', 'POST', { userId, code }, false);
  },

  // Login with email + password
  async login(email, password) {
    return request('/auth/login', 'POST', { email, password }, false);
  },

  // Save Expo push token after login
  async savePushToken(expoToken) {
    return request('/auth/save-token', 'POST', { fcmToken: expoToken });
  },
};

// ─────────────────────────────────────────────────────────────
//  CHILDREN endpoints
// ─────────────────────────────────────────────────────────────

export const childrenAPI = {

  // Get all children in the family
  async getAll() {
    return request('/children', 'GET');
  },

  // Add a new child
  async add(name, birthDate, bloodType, gender) {
    return request('/children', 'POST', { name, birthDate, bloodType, gender });
  },

  // Edit a child's info
  async update(childId, name, birthDate, bloodType, gender) {
    return request(`/children/${childId}`, 'PUT', {
      name, birthDate, bloodType, gender
    });
  },
};

// ─────────────────────────────────────────────────────────────
//  PREGNANCY endpoints
// ─────────────────────────────────────────────────────────────

export const pregnancyAPI = {

  // Get current pregnancy
  async get() {
    return request('/pregnancy', 'GET');
  },

  // Register a new pregnancy
  async register(dueDate) {
    return request('/pregnancy', 'POST', { dueDate });
  },
};

// ─────────────────────────────────────────────────────────────
//  VACCINATIONS endpoints
// ─────────────────────────────────────────────────────────────

export const vaccinationsAPI = {

  // Get full vaccine schedule for a child
  async getByChild(childId) {
    return request(`/vaccinations/${childId}`, 'GET');
  },

  // Mark a vaccine as done
  async markDone(vaccinationId) {
    return request(`/vaccinations/${vaccinationId}/done`, 'PUT');
  },
};

// ─────────────────────────────────────────────────────────────
//  MEALS endpoints
// ─────────────────────────────────────────────────────────────

export const mealsAPI = {

  // Get recent meals for a child
  async getRecent(childId) {
    return request(`/meals/${childId}`, 'GET');
  },

  // Get age-appropriate food suggestions for a child
  async getSuggestions(childId) {
    return request(`/meals/${childId}/suggestions`, 'GET');
  },

  // Save today's meals
  async save(childId, date, breakfast, lunch, dinner, snacks) {
    return request('/meals', 'POST', {
      childId, date, breakfast, lunch, dinner, snacks
    });
  },
};

// ─────────────────────────────────────────────────────────────
//  SLEEP endpoints
// ─────────────────────────────────────────────────────────────

export const sleepAPI = {

  // Get recent sleep records for a child
  async getRecent(childId) {
    return request(`/sleep/${childId}`, 'GET');
  },

  // Log tonight's sleep
  async log(childId, date, bedtime, wakeTime, napMinutes) {
    return request(`/sleep/${childId}`, 'POST', {
      date, bedtime, wakeTime, napMinutes
    });
  },
};

// ─────────────────────────────────────────────────────────────
//  MEDICATIONS endpoints
// ─────────────────────────────────────────────────────────────

export const medicationsAPI = {

  // Get active medications for a child
  async getActive(childId) {
    return request(`/medications/${childId}`, 'GET');
  },

  // Add a new medication
  async add(childId, name, dose, frequency, startDate, endDate) {
    return request(`/medications/${childId}`, 'POST', {
      name, dose, frequency, startDate, endDate
    });
  },

  // Delete a medication
  async remove(medicationId) {
    return request(`/medications/${medicationId}`, 'DELETE');
  },
};

// ─────────────────────────────────────────────────────────────
//  REMINDERS endpoints
// ─────────────────────────────────────────────────────────────

export const remindersAPI = {

  // Schedule a reminder
  async schedule(type, message, scheduledAt) {
    return request('/reminders', 'POST', { type, message, scheduledAt });
  },
};