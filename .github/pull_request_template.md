## Jira issue

ET-<n>

## Change

<!-- What changes and why. -->

## Testing

<!-- Tests added or updated, and the commands run (lint, typecheck, test, build). -->

## Checklist

- [ ] The PR title is a Conventional Commit containing the Jira key
- [ ] Design tokens only; no hard-coded colours
- [ ] Loading, empty, error and success states covered at 375 px and 1280 px (if UI changed)
- [ ] `src/api/schema.d.ts` regenerated with `npm run gen:api` (if the contract changed)
- [ ] No secrets committed
