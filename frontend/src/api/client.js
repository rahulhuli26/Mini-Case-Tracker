import axios from 'axios';

/**
 * @file Shared Axios instance for all API calls. Base URL comes from
 * `VITE_API_URL`, defaulting to the local backend.
 */

const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Origin of the backend server (no `/api` suffix), for building links to
 * statically-served resources such as uploaded documents.
 */
export const apiOrigin = apiBaseURL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: apiBaseURL
});

/**
 * Request interceptor that attaches the stored JWT (if any) as a `Bearer`
 * Authorization header on every outgoing request.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Configured Axios instance for calling the Case Tracker API. */
export default api;
