import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import type { HealthResponse } from '@/api/health';

/** Same origin as jsdom, so that XHR requests are not subject to CORS in tests. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const handlers = [
  http.get(`${API_BASE_URL}/health`, () => HttpResponse.json<HealthResponse>({ status: 'ok' })),
];

export const server = setupServer(...handlers);
