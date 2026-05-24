import axiosInstance from './axios.js';

// Auth APIs
export const authAPI = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data),
  me: () => axiosInstance.get('/auth/me'),
  forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => axiosInstance.post(`/auth/reset-password/${token}`, data),
  verifyEmail: (token) => axiosInstance.get(`/auth/verify-email/${token}`),
  uploadProfilePhoto: (formData) => axiosInstance.post('/auth/upload-profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
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
  uploadEventCover: (id, formData) => axiosInstance.post(`/events/${id}/upload-cover`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  sendReminder: (id, data) => axiosInstance.post(`/events/${id}/reminder`, data),
  inviteTeamMember: (id, data) => axiosInstance.post(`/events/${id}/team`, data),
  acceptTeamInvite: (token) => axiosInstance.post(`/events/team/accept/${token}`),
  updateTeamMember: (id, memberId, data) => axiosInstance.patch(`/events/${id}/team/${memberId}`, data),
  removeTeamMember: (id, memberId) => axiosInstance.delete(`/events/${id}/team/${memberId}`),
  getAnalytics: (id) => axiosInstance.get(`/events/${id}/analytics`),
};

// Registration APIs
export const registrationAPI = {
  registerForEvent: (data) => axiosInstance.post('/registrations', data),
  getEventRegistrations: (eventId, params) => axiosInstance.get(`/registrations/event/${eventId}`, { params }),
  checkIn: (ticketId) => axiosInstance.post(`/registrations/checkin/${ticketId}`),
  exportCSV: (eventId) => axiosInstance.get(`/registrations/export/${eventId}`, { responseType: 'blob' }),
  getTicketDetails: (ticketId) => axiosInstance.get(`/registrations/ticket/${ticketId}`),
  downloadTicket: (ticketId) => axiosInstance.get(`/registrations/download/${ticketId}`, { responseType: 'blob' }),
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
  /**
   * Create a Razorpay order.
   * @param {{ type: 'registration'|'email_credits'|'certificates', eventId?: string, count?: number }} data
   */
  createOrder: (data) => axiosInstance.post('/payments/create-order', data),
 
  /**
   * Verify payment signature after Razorpay checkout completes.
   * @param {{ razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }} data
   */
  verifyPayment: (data) => axiosInstance.post('/payments/verify', data),
};

// Certificate APIs
export const certificateAPI = {
  // Events
  getOrganizerEvents: () => axiosInstance.get('/certificates/organizer/events'),
  getEventRegistrations: (eventId) => axiosInstance.get(`/certificates/event/${eventId}/registrations`),

  // Templates
  createTemplate: (data) => {
    console.log('API: Creating template with data:', data);
    return axiosInstance.post('/certificates/template/create', data);
  },
  getTemplate: (templateId) => axiosInstance.get(`/certificates/template/${templateId}`),
  updateTemplate: (templateId, data) => axiosInstance.put(`/certificates/template/${templateId}`, data),
  deleteTemplate: (templateId) => axiosInstance.delete(`/certificates/template/${templateId}`),
  uploadTemplateLogo: (templateId, formData) => axiosInstance.post(`/certificates/template/${templateId}/upload-logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadTemplateSignature: (templateId, formData) => axiosInstance.post(`/certificates/template/${templateId}/upload-signature`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getOrganizerTemplates: () => axiosInstance.get('/certificates/organizer/templates'),

  // Certificate Generation
  generatePreview: (data) => axiosInstance.post('/certificates/preview', data),
  checkPricing: (data) => axiosInstance.post('/certificates/check-pricing', data),
  generateCertificates: (data) => axiosInstance.post('/certificates/generate', data),
  getIssuedCertificates: (templateId) => axiosInstance.get(`/certificates/issued/${templateId}`),

  // Download and Send
  downloadCertificatePDF: (certificateId) => axiosInstance.get(`/certificates/download/${certificateId}`),
  sendCertificatesEmail: (data) => axiosInstance.post('/certificates/send-emails', data),

  // Pricing
  getPricingInfo: () => axiosInstance.get('/certificates/pricing/info'),
};

