import axiosInstance from './axios.js';

// Auth APIs
export const authAPI = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data),
  me: () => axiosInstance.get('/auth/me'),
  forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => axiosInstance.post(`/auth/reset-password/${token}`, data),
  verifyEmail: (token) => axiosInstance.get(`/auth/verify-email/${token}`),
};

// Event APIs
export const eventAPI = {
  createEvent: (data) => axiosInstance.post('/events', data),
  getMyEvents: (params) => axiosInstance.get('/events/my', { params }),
  getEventBySlug: (slug) => axiosInstance.get(`/events/${slug}`),
  getEventById: (id) => axiosInstance.get(`/events/id/${id}`),
  updateEvent: (id, data) => axiosInstance.put(`/events/${id}`, data),
  deleteEvent: (id) => axiosInstance.delete(`/events/${id}`),
  publishEvent: (id) => axiosInstance.post(`/events/${id}/publish`),
  getAnalytics: (id) => axiosInstance.get(`/events/${id}/analytics`),
};

// Registration APIs
export const registrationAPI = {
  registerForEvent: (data) => axiosInstance.post('/registrations', data),
  getEventRegistrations: (eventId, params) => axiosInstance.get(`/registrations/event/${eventId}`, { params }),
  checkIn: (ticketId) => axiosInstance.post(`/registrations/checkin/${ticketId}`),
  exportCSV: (eventId) => axiosInstance.get(`/registrations/export/${eventId}`, { responseType: 'blob' }),
};

// Promo Email APIs
export const promoAPI = {
  sendPromoEmail: (data) => axiosInstance.post('/promo/send', data),
  getHistory: (params) => axiosInstance.get('/promo/history', { params }),
};

// Payout APIs
export const payoutAPI = {
  getSummary: () => axiosInstance.get('/payouts'),
};

// Payment APIs (Razorpay)
export const paymentAPI = {
  initiatePayment: (data) => axiosInstance.post('/payments/initiate', data),
  verifyPayment: (data) => axiosInstance.post('/payments/verify', data),
};
