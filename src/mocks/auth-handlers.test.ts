import type {
  ErrorCode,
  ErrorResponse,
  PendingDeletionErrorResponse,
  SessionResponse,
  UserProfile,
} from '@/api/types';
import { server } from '@/test/msw';

import { API_BASE_URL, authScenarios, MOCK_SESSION_TOKEN, mockUser } from './auth-handlers';

const AUTH_URL = `${API_BASE_URL}/api/v1/auth`;

function postIdToken(
  endpoint: 'google' | 'restore',
  body: unknown = { idToken: 'google-id-token' },
) {
  return fetch(`${AUTH_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function withSession(method: 'GET' | 'DELETE', token = MOCK_SESSION_TOKEN) {
  return fetch(`${AUTH_URL}/me`, { method, headers: { Authorization: `Bearer ${token}` } });
}

async function errorCodeOf(response: Response): Promise<ErrorCode> {
  return ((await response.json()) as ErrorResponse).error.code;
}

describe('auth mock handlers (default happy path)', () => {
  it.each(['google', 'restore'] as const)('POST /auth/%s returns a session', async (endpoint) => {
    const response = await postIdToken(endpoint);
    const session = (await response.json()) as SessionResponse;

    expect(response.status).toBe(200);
    expect(session).toMatchObject({
      token: MOCK_SESSION_TOKEN,
      tokenType: 'Bearer',
      user: mockUser,
    });
  });

  it.each(['google', 'restore'] as const)(
    'POST /auth/%s rejects a body without idToken with 400 VALIDATION_ERROR',
    async (endpoint) => {
      const response = await postIdToken(endpoint, { idToken: '', extra: true });

      expect(response.status).toBe(400);
      expect(await errorCodeOf(response)).toBe('VALIDATION_ERROR');
    },
  );

  it('GET /auth/me returns the profile for the mock session and 401 otherwise', async () => {
    const ok = await withSession('GET');
    expect(ok.status).toBe(200);
    expect((await ok.json()) as UserProfile).toEqual(mockUser);

    const denied = await withSession('GET', 'other-token');
    expect(denied.status).toBe(401);
    expect(await errorCodeOf(denied)).toBe('UNAUTHENTICATED');
  });

  it('DELETE /auth/me returns 204 for the mock session and 401 without one', async () => {
    expect((await withSession('DELETE')).status).toBe(204);
    expect((await fetch(`${AUTH_URL}/me`, { method: 'DELETE' })).status).toBe(401);
  });
});

describe('auth mock scenarios', () => {
  it('signInNewAccount returns 201 with a session', async () => {
    server.use(authScenarios.signInNewAccount());

    expect((await postIdToken('google')).status).toBe(201);
  });

  it('signInPendingDeletion returns 403 with consistent recovery details', async () => {
    const now = new Date('2026-11-15T00:00:00.000Z');
    server.use(authScenarios.signInPendingDeletion(8, now));

    const response = await postIdToken('google');
    const body = (await response.json()) as PendingDeletionErrorResponse;
    const [detail] = body.error.details;

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('ACCOUNT_PENDING_DELETION');
    expect(detail?.remainingDays).toBe(8);
    const remainingMs = Date.parse(detail?.permanentDeletionAt ?? '') - now.getTime();
    expect(Math.floor(remainingMs / 86_400_000)).toBe(8);
    expect(
      Date.parse(detail?.permanentDeletionAt ?? '') - Date.parse(detail?.deletionRequestedAt ?? ''),
    ).toBe(30 * 86_400_000);
  });

  it.each([
    ['restoreAccountNotFound', 404, 'ACCOUNT_NOT_FOUND'],
    ['restoreAccountNotPendingDeletion', 409, 'ACCOUNT_NOT_PENDING_DELETION'],
  ] as const)('%s returns %i %s', async (scenario, status, code) => {
    server.use(authScenarios[scenario]());

    const response = await postIdToken('restore');
    expect(response.status).toBe(status);
    expect(await errorCodeOf(response)).toBe(code);
  });

  it.each(['google', 'restore'] as const)(
    'rateLimited(%s) returns 429 with Retry-After',
    async (endpoint) => {
      server.use(authScenarios.rateLimited(endpoint, 120));

      const response = await postIdToken(endpoint);
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('120');
      expect(await errorCodeOf(response)).toBe('RATE_LIMITED');
    },
  );

  it.each(['google', 'restore'] as const)(
    'invalidGoogleToken(%s) returns 401 INVALID_GOOGLE_TOKEN',
    async (endpoint) => {
      server.use(authScenarios.invalidGoogleToken(endpoint));

      const response = await postIdToken(endpoint);
      expect(response.status).toBe(401);
      expect(await errorCodeOf(response)).toBe('INVALID_GOOGLE_TOKEN');
    },
  );

  it('sessionExpired returns 401 UNAUTHENTICATED even for the mock session', async () => {
    server.use(...authScenarios.sessionExpired());

    for (const method of ['GET', 'DELETE'] as const) {
      const response = await withSession(method);
      expect(response.status).toBe(401);
      expect(await errorCodeOf(response)).toBe('UNAUTHENTICATED');
    }
  });
});
