import { api } from './client.js';

// One function per API endpoint used by the website, grouped by resource.
// Components and hooks call these instead of building URLs themselves.

// Sign-up, sign-in, sessions and passwords use the Better Auth client (lib/auth-client.js).

export const biodataApi = {
  // The member's own biodata
  mine: () => api.get('/biodatas/me'),
  create: () => api.post('/biodatas/me', { pledge: true }),
  saveSection: (section, data) => api.put(`/biodatas/me/sections/${section}`, { data }),
  submit: () => api.post('/biodatas/me/submit'),
  setVisibility: (body) => api.patch('/biodatas/me/visibility', body),
  remove: (body) => api.delete('/biodatas/me', body),
  restore: () => api.post('/biodatas/me/restore'),
  restoreRequest: () => api.get('/biodatas/me/restore-request'),
  requestRestore: (reason) => api.post('/biodatas/me/restore-request', { reason }),
  partnerLookup: (no) => api.get('/biodatas/partner-lookup', { no }),

  // Other members' biodatas
  search: (query) => api.get('/biodatas', query),
  locationCounts: (query) => api.get('/biodatas/location-counts', query),
  viewer: (no) => api.get(`/biodatas/${no}/viewer`),
  visit: (no) => api.post(`/biodatas/${no}/visit`),
  unlock: (no) => api.post(`/biodatas/${no}/unlock`),
  favorite: (no) => api.post(`/biodatas/${no}/favorite`),
  unfavorite: (no) => api.delete(`/biodatas/${no}/favorite`),
  dislike: (no) => api.post(`/biodatas/${no}/dislike`),
  undislike: (no) => api.delete(`/biodatas/${no}/dislike`),
  propose: (no, message) => api.post(`/biodatas/${no}/proposals`, { message }),
  report: (no, body) => api.post(`/biodatas/${no}/report`, body),
};

export const accountApi = {
  dashboard: () => api.get('/me/dashboard'),
  deactivate: (body) => api.delete('/me', body),
  favorites: (page) => api.get('/me/favorites', { page }),
  dislikes: (page) => api.get('/me/dislikes', { page }),
  favoritedMe: (page) => api.get('/me/favorited-me', { page }),
  unlocks: (page) => api.get('/me/unlocks', { page }),
  proposals: (box, page) => api.get('/me/proposals', { box, page }),
  respondToProposal: (id, action) => api.post(`/me/proposals/${id}/respond`, { action }),
  withdrawProposal: (id) => api.post(`/me/proposals/${id}/withdraw`),
  notifications: (page) => api.get('/me/notifications', { page }),
  markAllRead: () => api.post('/me/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/me/notifications/${id}`),
  connections: (page) => api.get('/me/connections', { page }),
};

export const billingApi = {
  catalogue: () => api.get('/packages'),
  /** Starts an SSLCommerz checkout (this website's /api/checkout, src/server/checkout.js). */
  createPayment: (body) => api.post('/checkout', body),
  myPayments: (page) => api.get('/payments/mine', { page }),
  paymentStatus: (invoiceNo) => api.get(`/payments/status/${encodeURIComponent(invoiceNo)}`),
  requestRefund: (body) => api.post('/refunds', body),
};

export const supportApi = {
  tickets: (page) => api.get('/tickets', { page }),
  open: (body) => api.post('/tickets', body),
  get: (id) => api.get(`/tickets/${id}`),
  reply: (id, body) => api.post(`/tickets/${id}/messages`, body),
  close: (id) => api.post(`/tickets/${id}/close`),
  contact: (body) => api.post('/contact', body),
};

export const contentApi = {
  publicSettings: () => api.get('/public/settings'),
  downloadBanner: (id) => api.post(`/public/banners/${id}/download`),
};
