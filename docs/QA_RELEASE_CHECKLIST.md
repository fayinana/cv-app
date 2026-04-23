# QA and Cutover Checklist

## Environment
- [ ] Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Configure optional provider keys (`GOOGLE_API_KEY`, `SERPAPI_API_KEY`).
- [ ] Confirm Supabase `profiles` table migration is applied.

## Functional QA
- [ ] Signup and login flow works.
- [ ] Auth callback redirects correctly.
- [ ] Profile page can submit via Server Action.
- [ ] Analyze and Build pages call internal `/api/*` routes.
- [ ] Static pages (`about`, `contact`, `faq`, `privacy`, `terms`) render correctly.

## Quality Gates
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] API contract tests pass (when added).
- [ ] Security checks for route-level validation and auth guarding.

## Release
- [ ] Deploy preview environment.
- [ ] Stakeholder UI parity review signoff.
- [ ] Production cutover window approved.
