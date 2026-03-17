import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE = "http://10.11.73.161:8080/famille-app/api";

// Axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE,
});

// Add JWT token to headers
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Endpoints
export const authAPI = {
  getCaptcha: () => apiClient.get('/auth/captcha'),
  getCaptchaUrl: () => `${API_BASE}/auth/captcha?t=${Date.now()}`,
  signup: (name, email, password, phone, captchaAnswer) => 
    apiClient.post('/auth/signup', { name, email, password, phone, captchaAnswer }),
  verifyOtp: (userId, code) => 
    apiClient.post('/auth/verify-otp', { userId, code }),
  login: (email, password) => 
    apiClient.post('/auth/login', { email, password }),
  savePushToken: (token) => 
    apiClient.post('/auth/save-token', { token }),
};

// Children Endpoints
export const childrenAPI = {
  getAll: () => apiClient.get('/children'),
  add: (name, birthDate, gender, weight) => 
    apiClient.post('/children', { name, birthDate, gender, weight }),
  update: (id, name, birthDate, gender, weight) => 
    apiClient.put(`/children/${id}`, { name, birthDate, gender, weight }),
  delete: (id) => apiClient.delete(`/children/${id}`),
};

// Pregnancy Endpoints
export const pregnancyAPI = {
  get: () => apiClient.get('/pregnancy'),
  register: (dueDate, motherName) => 
    apiClient.post('/pregnancy', { dueDate, motherName }),
  update: (id, dueDate, motherName) => 
    apiClient.put(`/pregnancy/${id}`, { dueDate, motherName }),
  delete: (id) => apiClient.delete(`/pregnancy/${id}`),
};

// Meals Endpoints
export const mealsAPI = {
  getRecent: (childId) => apiClient.get(`/meals/${childId}`),
  getSuggestions: (childId) => apiClient.get(`/meals/${childId}/suggestions`),
  save: (childId, date, breakfast, lunch, dinner, snacks, notes) => 
    apiClient.post('/meals', { childId, date, breakfast, lunch, dinner, snacks, notes }),
};

// Sleep Records Endpoints
export const sleepAPI = {
  getRecent: (childId) => apiClient.get(`/sleep/${childId}`),
  log: (childId, date, sleepTime, wakeTime) => 
    apiClient.post(`/sleep/${childId}`, { date, sleepTime, wakeTime }),
};

// Vaccinations Endpoints
export const vaccinationsAPI = {
  getByChild: (childId) => apiClient.get(`/vaccinations/${childId}`),
  markDone: (vaccinationId) => 
    apiClient.put(`/vaccinations/${vaccinationId}/done`),
};

// Medications Endpoints (not in original exports but used in screens)
export const medicationsAPI = {
  getActive: (childId) => apiClient.get(`/medications/${childId}`),
  add: (childId, medicationName, dosage, frequency, startDate, endDate) => 
    apiClient.post(`/medications/${childId}`, { medicationName, dosage, frequency, startDate, endDate }),
  remove: (medicationId) => apiClient.delete(`/medications/${medicationId}`),
};

// Reminders Endpoints
export const remindersAPI = {
  schedule: (type, message, scheduledAt) => 
    apiClient.post('/reminders', { type, message, scheduledAt }),
};

// Budget Endpoints
export const budgetAPI = {
  getAll: () => apiClient.get('/budget'),
  add: (type, amount, description, date, category) => 
    apiClient.post('/budget', { type, amount, description, date, category }),
  update: (id, type, amount, description, date, category) => 
    apiClient.put(`/budget/${id}`, { type, amount, description, date, category }),
  delete: (id) => apiClient.delete(`/budget/${id}`),
};

// Utility function to clear JWT
export const clearJwt = async () => {
  await AsyncStorage.removeItem('jwt');
};
