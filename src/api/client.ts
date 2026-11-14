import axios from 'axios';

/** Shared HTTP client. `VITE_API_BASE_URL` is the API origin; resource paths carry `/api/v1`. */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
});
