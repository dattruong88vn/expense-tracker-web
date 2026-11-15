# expense-tracker-web

[![ci](https://github.com/dattruong88vn/expense-tracker-web/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dattruong88vn/expense-tracker-web/actions/workflows/ci.yml)

Web client of Expense Tracker: React, TypeScript (strict), Vite, Tailwind CSS v4 with shadcn/ui, React Router, TanStack Query, React Hook Form and Zod. It is deployed to Azure Static Web Apps.

## Prerequisites

- Node.js 22 or later, npm 10 or later
- A running API (`expense-tracker-api`) for anything beyond the start page's error state

## Run locally

```bash
npm ci
cp .env.example .env.local   # set VITE_API_BASE_URL (for example http://localhost:3000) and VITE_GOOGLE_CLIENT_ID
npm run dev                  # http://localhost:5173
```

`VITE_API_BASE_URL` is the API origin without `/api/v1`. The start page calls `GET /health` and shows `ok` or an error state.

## Scripts

| Script                            | Purpose                                              |
| --------------------------------- | ---------------------------------------------------- |
| `npm run dev`                     | Development server                                   |
| `npm run build`                   | Typecheck and production build into `dist`           |
| `npm run lint`                    | ESLint                                               |
| `npm run typecheck`               | TypeScript without emitting                          |
| `npm run test` / `test:coverage`  | Vitest with React Testing Library and MSW            |
| `npm run format` / `format:check` | Prettier                                             |
| `npm run gen:api [source]`        | Generate `src/api/schema.d.ts` from the API contract |

`gen:api` reads the contract from, in order: the CLI argument, the `OPENAPI_SOURCE` variable, then `../expense-tracker-api/openapi.json`. The source can be a file path or a URL, for example `npm run gen:api -- https://<api-host>/openapi.json`. Commit the regenerated file with the change that consumes it.

## Structure

```text
src/
  api/              HTTP client, generated schema and query hooks
  components/ui/    shadcn/ui components, styled with the design tokens
  features/         auth, transactions, categories, dashboard
  lib/              shared utilities
  routes/           router and route pages
  test/             test setup, MSW server and render helpers
  index.css         Tailwind entry point and design tokens
```

## Design tokens

`src/index.css` declares the tokens of the design index in the Tailwind `@theme` block, with dark values applied through `prefers-color-scheme`. A token such as `color-income` yields `text-income`, `bg-income` and `border-income`. Components use tokens only and never contain colour literals. The file is excluded from Prettier so that the token values keep the notation of the design index.

## Tests

Component tests use MSW handlers in `src/test/msw.ts`; any unhandled request fails the test. In tests, `VITE_API_BASE_URL` is the jsdom origin (`http://localhost:3000`), so Axios requests are not blocked by CORS.

## Conventions

Branches `<feat|fix|chore|docs|test>/ET-<n>-<description>`, Conventional Commits containing the Jira key (checked by commitlint), squash merge through a Pull Request. The pre-commit hook runs ESLint and Prettier on staged files.
