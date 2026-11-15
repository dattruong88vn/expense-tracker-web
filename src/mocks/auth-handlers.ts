import { addDays, addHours } from 'date-fns';
import { http, HttpResponse } from 'msw';

import type {
  ErrorCode,
  ErrorDetail,
  ErrorResponse,
  GoogleSignInRequest,
  PendingDeletionErrorResponse,
  ResponseBody,
  SessionResponse,
  UserProfile,
  ValidationErrorResponse,
} from '@/api/types';

/** Same origin as jsdom in tests, so that XHR requests are not subject to CORS. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_URL = `${API_BASE_URL}/api/v1/auth`;

/** The only bearer token the mocks accept. */
export const MOCK_SESSION_TOKEN = 'mock-session-token';

/** Recovery period of an account pending deletion (BR-15). */
const RECOVERY_PERIOD_DAYS = 30;

export const mockUser: UserProfile = {
  id: '6750a1b2c3d4e5f6a7b8c9d0',
  email: 'an.nguyen@example.com',
  name: 'An Nguyen',
  avatarUrl: null,
  currency: 'VND',
  status: 'active',
  createdAt: '2026-11-01T03:00:00.000Z',
};

export function mockSession(user: UserProfile = mockUser, now = new Date()): SessionResponse {
  return {
    token: MOCK_SESSION_TOKEN,
    tokenType: 'Bearer',
    expiresAt: addDays(now, 7).toISOString(),
    user,
  };
}

export function errorBody(
  code: ErrorCode,
  message: string,
  details: ErrorDetail[] = [],
): ErrorResponse {
  return { error: { code, message, details } };
}

type GoogleTokenEndpoint = 'google' | 'restore';

/** Answers 400 `VALIDATION_ERROR` unless the body is exactly `{ idToken: <non-empty string> }`. */
async function validateIdToken(request: Request): Promise<Response | undefined> {
  const body: unknown = await request.json().catch(() => undefined);
  const valid =
    typeof body === 'object' &&
    body !== null &&
    Object.keys(body).length === 1 &&
    typeof (body as Partial<GoogleSignInRequest>).idToken === 'string' &&
    (body as GoogleSignInRequest).idToken.length > 0;
  if (valid) return undefined;
  return HttpResponse.json<ValidationErrorResponse>(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [{ path: 'body.idToken', message: 'Required' }],
      },
    },
    { status: 400 },
  );
}

function hasMockSession(request: Request): boolean {
  return request.headers.get('Authorization') === `Bearer ${MOCK_SESSION_TOKEN}`;
}

function unauthenticated() {
  return HttpResponse.json<ResponseBody<'getCurrentUser', 401>>(
    errorBody('UNAUTHENTICATED', 'Authentication required'),
    { status: 401 },
  );
}

/** Happy path of every auth endpoint. Override per test with `server.use(authScenarios.…())`. */
export const authHandlers = [
  http.post(`${AUTH_URL}/google`, async ({ request }) => {
    const invalid = await validateIdToken(request);
    if (invalid) return invalid;
    return HttpResponse.json<ResponseBody<'signInWithGoogle', 200>>(mockSession());
  }),

  http.get<never, never, ResponseBody<'getCurrentUser', 200 | 401>>(
    `${AUTH_URL}/me`,
    ({ request }) =>
      hasMockSession(request)
        ? HttpResponse.json<ResponseBody<'getCurrentUser', 200>>(mockUser)
        : unauthenticated(),
  ),

  http.delete<never, never, ResponseBody<'requestAccountDeletion', 401> | null>(
    `${AUTH_URL}/me`,
    ({ request }) =>
      hasMockSession(request) ? new HttpResponse(null, { status: 204 }) : unauthenticated(),
  ),

  http.post(`${AUTH_URL}/restore`, async ({ request }) => {
    const invalid = await validateIdToken(request);
    if (invalid) return invalid;
    return HttpResponse.json<ResponseBody<'restoreAccount', 200>>(mockSession());
  }),
];

/** Error scenarios of the auth contract, one handler factory per documented response. */
export const authScenarios = {
  /** First sign-in: 201 with a newly initialised account. */
  signInNewAccount: () =>
    http.post(`${AUTH_URL}/google`, () =>
      HttpResponse.json<ResponseBody<'signInWithGoogle', 201>>(mockSession(), { status: 201 }),
    ),

  /** 403 `ACCOUNT_PENDING_DELETION` with `remainingDays` whole days left (UC-01 A2). */
  signInPendingDeletion: (remainingDays = 8, now = new Date()) => {
    const permanentDeletionAt = addHours(addDays(now, remainingDays), 1);
    const deletionRequestedAt = addDays(permanentDeletionAt, -RECOVERY_PERIOD_DAYS);
    return http.post(`${AUTH_URL}/google`, () =>
      HttpResponse.json<PendingDeletionErrorResponse>(
        {
          error: {
            code: 'ACCOUNT_PENDING_DELETION',
            message: 'The account is pending deletion',
            details: [
              {
                remainingDays,
                deletionRequestedAt: deletionRequestedAt.toISOString(),
                permanentDeletionAt: permanentDeletionAt.toISOString(),
              },
            ],
          },
        },
        { status: 403 },
      ),
    );
  },

  /** 401 `INVALID_GOOGLE_TOKEN` from sign-in or restoration. */
  invalidGoogleToken: (endpoint: GoogleTokenEndpoint = 'google') =>
    http.post(`${AUTH_URL}/${endpoint}`, () =>
      HttpResponse.json<ResponseBody<'signInWithGoogle', 401>>(
        errorBody('INVALID_GOOGLE_TOKEN', 'Invalid Google ID token'),
        { status: 401 },
      ),
    ),

  /** 401 `UNAUTHENTICATED` from every bearer-protected endpoint (expired or revoked session). */
  sessionExpired: () => [
    http.get(`${AUTH_URL}/me`, unauthenticated),
    http.delete(`${AUTH_URL}/me`, unauthenticated),
  ],

  /** 404 `ACCOUNT_NOT_FOUND`: nothing restorable for the Google identity. */
  restoreAccountNotFound: () =>
    http.post(`${AUTH_URL}/restore`, () =>
      HttpResponse.json<ResponseBody<'restoreAccount', 404>>(
        errorBody('ACCOUNT_NOT_FOUND', 'No restorable account exists'),
        { status: 404 },
      ),
    ),

  /** 409 `ACCOUNT_NOT_PENDING_DELETION`: the account is already active. */
  restoreAccountNotPendingDeletion: () =>
    http.post(`${AUTH_URL}/restore`, () =>
      HttpResponse.json<ResponseBody<'restoreAccount', 409>>(
        errorBody('ACCOUNT_NOT_PENDING_DELETION', 'The account is not pending deletion'),
        { status: 409 },
      ),
    ),

  /** 429 `RATE_LIMITED` with `Retry-After` in seconds. */
  rateLimited: (endpoint: GoogleTokenEndpoint = 'google', retryAfterSeconds = 3600) =>
    http.post(`${AUTH_URL}/${endpoint}`, () =>
      HttpResponse.json<ResponseBody<'signInWithGoogle' | 'restoreAccount', 429>>(
        errorBody('RATE_LIMITED', 'Too many requests'),
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
      ),
    ),
};
