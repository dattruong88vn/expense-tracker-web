import { http, HttpResponse } from 'msw';

import type { HealthResponse } from '@/api/types';

import { API_BASE_URL, authHandlers } from './auth-handlers';

/** Default handlers: the happy path of every endpoint in the contract. */
export const handlers = [
  http.get(`${API_BASE_URL}/health`, () => HttpResponse.json<HealthResponse>({ status: 'ok' })),
  ...authHandlers,
];
