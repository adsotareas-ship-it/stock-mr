const API_URL = 'http://localhost:3000/api';

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  login: (email, password) => request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  getUser: () => request('/user'),
  
  updateUser: (userData) => request('/user', {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),

  getAssets: () => request('/assets'),
  
  getAssetById: (id) => request(`/assets/${id}`),
  
  createAsset: (assetData) => request('/assets', {
    method: 'POST',
    body: JSON.stringify(assetData),
  }),
  
  updateAsset: (id, updates) => request(`/assets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),

  deleteAsset: (id) => request(`/assets/${id}`, {
    method: 'DELETE',
  }),
  
  getTickets: () => request('/tickets'),
  
  createTicket: (ticketData) => request('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData),
  }),
  
  getLogs: () => request('/logs'),
  
  createLog: (logData) => request('/logs', {
    method: 'POST',
    body: JSON.stringify(logData),
  }),
  
  getAuditSessions: () => request('/audit-sessions'),
  
  createAuditSession: (sessionData) => request('/audit-sessions', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  }),
};
