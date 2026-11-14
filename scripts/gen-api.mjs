// Generates src/api/schema.d.ts from the API contract.
// Source (path or URL), in order of precedence: CLI argument, OPENAPI_SOURCE, the sibling API repository.
import { execFileSync } from 'node:child_process';

const source =
  process.argv[2] ?? process.env.OPENAPI_SOURCE ?? '../expense-tracker-api/openapi.json';

execFileSync('npx', ['--no', 'openapi-typescript', source, '-o', 'src/api/schema.d.ts'], {
  stdio: 'inherit',
});
