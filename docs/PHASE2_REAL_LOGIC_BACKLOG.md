# Phase 2 Real Logic Backlog

## Analyze API (`/api/analyze`)
- Replace placeholder scoring with resume parser + Gemini prompt pipeline.
- Return structured sections compatible with existing UI cards.
- Add timeout, retries, and fallback error mapping.

## Jobs API (`/api/jobs/recommend`)
- Integrate SerpAPI provider.
- Normalize title/company/location/link/snippet fields.
- Add geo/query fallback behavior.

## CV Templates API (`/api/cv/templates`)
- Generate editable CV section objects from analysis output.
- Ensure contract stability for template editor.

## Assessment API (`/api/assess/generate`)
- Generate 5-10 quiz questions with explanation fields.
- Validate option and answer consistency.

## Security and Reliability
- Add route-level rate limiting for AI-heavy endpoints.
- Add request logging and structured error IDs.
- Add schema tests and API integration tests.
