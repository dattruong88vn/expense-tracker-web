/**
 * Named aliases over the generated contract (`schema.d.ts`, produced by `npm run gen:api`).
 * Application code imports from here, never from `schema.d.ts` directly.
 */
import type { components, operations, paths } from './schema';

type Schemas = components['schemas'];

/** JSON body of the `status` response of operation `Op`. */
export type ResponseBody<
  Op extends keyof operations,
  Status extends keyof operations[Op]['responses'],
> = operations[Op]['responses'][Status] extends { content: { 'application/json': infer Body } }
  ? Body
  : never;

/** JSON request body of operation `Op`. */
export type RequestBody<Op extends keyof operations> = operations[Op]['requestBody'] extends {
  content: { 'application/json': infer Body };
}
  ? Body
  : never;

export type HealthResponse =
  paths['/health']['get']['responses'][200]['content']['application/json'];

export type SessionResponse = Schemas['SessionResponse'];
export type UserProfile = Schemas['UserProfile'];
export type AccountStatus = Schemas['AccountStatus'];
export type GoogleSignInRequest = Schemas['GoogleSignInRequest'];
export type RestoreAccountRequest = Schemas['RestoreAccountRequest'];

export type ErrorCode = Schemas['ErrorCode'];
export type ErrorDetail = Schemas['ErrorDetail'];
export type ErrorResponse = Schemas['ErrorResponse'];
export type ValidationErrorResponse = Schemas['ValidationErrorResponse'];
export type ValidationIssue = Schemas['ValidationIssue'];
export type PendingDeletionErrorResponse = Schemas['PendingDeletionErrorResponse'];
export type PendingDeletionDetail = Schemas['PendingDeletionDetail'];
