// services/api.js
// Central API service — all HTTP calls to the Java backend
// Every function returns { ok: true/false, data: {...} }

import storage from './storage';
import { API_BASE_URL } from '../constants/api';

// ── Core request function ─────────────────────────
// All API calls go through this one function
// It automatically:
//   1. Adds the JWT token to every request
//   2. Parses the JSON response
//   3. Returns { ok, data } so screens never crash on errors
async function request(method, path, body = null) {
  try {
    // Build headers
    const headers = { 'Content-Type': 'application/json' };

    // Add JWT token if we have one
    const token = await storage.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Build fetch options
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    // Make the request
    const res  = await fetch(`${API_BASE_URL}${path}`, options);
    const data = await res.json().catch(() => ({})); // safe parse

    return { ok: res.ok, data };

  } catch (err) {
    // Network error — no internet, server down etc.
    console.error(`API ${method} ${path} failed:`, err.message);
    return {
      ok: false,
      data: { error: 'Reba interineti yawe. (Check your connection)' }
    };
  }
}

// ─────────────────────────────────────────────────────
// ── Auth API ──────────────────────────────────────────
// Matches: /api/auth/* in AuthServlet.java
// ─────────────────────────────────────────────────────
export const authAPI = {

  // GET /api/captcha → returns PNG image URL
  // Used as <Image source={{ uri: authAPI.getCaptchaUrl() }} />
  getCaptchaUrl() {
    return `${API_BASE_URL}/captcha?t=${Date.now()}`;
    // t= timestamp busts cache so every call gets a fresh image
  },

  // POST /api/auth/signup
  // Body: { name, email, password, phone, captchaAnswer }
  // Returns: { userId } on success
  async signup(name, email, password, phone, captchaAnswer) {
    return request('POST', '/auth/signup', {
      name, email, password, phone, captchaAnswer
    });
  },

  // POST /api/auth/verify-otp
  // Body: { userId, code }
  // Returns: { token } on success
  async verifyOtp(userId, code) {
    return request('POST', '/auth/verify-otp', { userId, code });
  },

  // POST /api/auth/login
  // Body: { email, password }
  // Returns: { token, userId, name } on success
  async login(email, password) {
    return request('POST', '/auth/login', { email, password });
  },

  // POST /api/auth/save-token
  // Body: { token: expoToken }
  // Saves Expo push token so backend can send notifications
  async savePushToken(expoToken) {
    return request('POST', '/auth/save-token', { token: expoToken });
  },
};

// ─────────────────────────────────────────────────────
// ── Children API ──────────────────────────────────────
// Matches: /api/children/* in ChildServlet.java
// ─────────────────────────────────────────────────────
export const childrenAPI = {

  // GET /api/children
  // Returns: [ { id, name, birthDate, gender, weight, ageInMonths } ]
  async getAll() {
    return request('GET', '/children');
  },

  // POST /api/children
  // Body: { name, birthDate, gender, weight }
  // Returns: { id, name, ... } — also auto-creates vaccination schedule
  async add(name, birthDate, gender, weight) {
    return request('POST', '/children', { name, birthDate, gender, weight });
  },

  // PUT /api/children/:id
  // Body: { name, birthDate, gender, weight }
  async update(id, name, birthDate, gender, weight) {
    return request('PUT', `/children/${id}`, {
      name, birthDate, gender, weight
    });
  },
};

// ─────────────────────────────────────────────────────
// ── Pregnancy API ─────────────────────────────────────
// Matches: /api/pregnancy in PregnancyServlet.java
// ─────────────────────────────────────────────────────
export const pregnancyAPI = {

  // GET /api/pregnancy
  // Returns: { id, dueDate, currentWeek, motherName, createdAt }
  async get() {
    return request('GET', '/pregnancy');
  },

  // POST /api/pregnancy
  // Body: { dueDate, motherName }
  // Returns: { id, dueDate, currentWeek }
  async register(dueDate, motherName) {
    return request('POST', '/pregnancy', { dueDate, motherName });
  },
};

// ─────────────────────────────────────────────────────
// ── Vaccinations API ──────────────────────────────────
// Matches: /api/vaccinations/* in VaccinationServlet.java
// ─────────────────────────────────────────────────────
export const vaccinationsAPI = {

  // GET /api/vaccinations/:childId
  // Returns: [ { id, vaccineName, scheduledDate, done } ]
  async getByChild(childId) {
    return request('GET', `/vaccinations/${childId}`);
  },

  // PUT /api/vaccinations/:id/done
  // Marks a vaccination as completed
  async markDone(vaccinationId) {
    return request('PUT', `/vaccinations/${vaccinationId}/done`);
  },
};

// ─────────────────────────────────────────────────────
// ── Meals API ─────────────────────────────────────────
// Matches: /api/meals/* in MealServlet.java
// ─────────────────────────────────────────────────────
export const mealsAPI = {

  // GET /api/meals/:childId
  // Returns: last 7 days of meals
  async getRecent(childId) {
    return request('GET', `/meals/${childId}`);
  },

  // GET /api/meals/:childId/suggestions
  // Returns: [ "Porridge", "Ibijumba" ... ] based on child age
  async getSuggestions(childId) {
    return request('GET', `/meals/${childId}/suggestions`);
  },

  // POST /api/meals
  // Body: { childId, date, breakfast, lunch, dinner, snacks, notes }
  // Uses UPSERT — updates if meal for that date already exists
  async save(childId, date, breakfast, lunch, dinner, snacks, notes) {
    return request('POST', '/meals', {
      childId, date, breakfast, lunch, dinner, snacks, notes
    });
  },
};

// ─────────────────────────────────────────────────────
// ── Sleep API ─────────────────────────────────────────
// Matches: /api/sleep/* in SleepServlet.java
// ─────────────────────────────────────────────────────
export const sleepAPI = {

  // GET /api/sleep/:childId
  // Returns: last 7 sleep records + recommendedHours
  async getRecent(childId) {
    return request('GET', `/sleep/${childId}`);
  },

  // POST /api/sleep/:childId
  // Body: { date, sleepTime, wakeTime }
  // sleepTime / wakeTime format: "HH:MM"
  async log(childId, date, sleepTime, wakeTime) {
    return request('POST', `/sleep/${childId}`, {
      date, sleepTime, wakeTime
    });
  },
};

// ─────────────────────────────────────────────────────
// ── Medications API ───────────────────────────────────
// Matches: /api/medications/* in MedicationServlet.java
// ─────────────────────────────────────────────────────
export const medicationsAPI = {

  // GET /api/medications/:childId
  // Returns: active medications (end_date >= today OR no end_date)
  async getActive(childId) {
    return request('GET', `/medications/${childId}`);
  },

  // POST /api/medications/:childId
  // Body: { medicationName, dosage, frequency, startDate, endDate }
  async add(childId, medicationName, dosage, frequency, startDate, endDate) {
    return request('POST', `/medications/${childId}`, {
      medicationName, dosage, frequency, startDate, endDate
    });
  },

  // DELETE /api/medications/:id
  async remove(medicationId) {
    return request('DELETE', `/medications/${medicationId}`);
  },
};

// ─────────────────────────────────────────────────────
// ── Reminders API ─────────────────────────────────────
// Matches: /api/reminders in ReminderServlet.java
// ─────────────────────────────────────────────────────
export const remindersAPI = {

  // POST /api/reminders
  // Body: { type, message, scheduledAt }
  // scheduledAt format: "YYYY-MM-DDTHH:MM:SS"
  // type: "PRENATAL_CHECKUP" | "VACCINATION" | "MEDICATION"
  async schedule(type, message, scheduledAt) {
    return request('POST', '/reminders', { type, message, scheduledAt });
  },
};