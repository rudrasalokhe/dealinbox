# Changelog

## 2026-04-03

### Added
- Phase 1 / Feature 1 groundwork:
  - Added `POST /api/inbound-email` SendGrid Inbound Parse-compatible endpoint.
  - Added Claude-powered inbound email parsing helper (`claude-sonnet-4-6`) with safe fallback parsing.
  - Added automatic enquiry creation from inbound email with status `new` and initial event log entry.
  - Added creator alert email dispatch via SendGrid (`New collab request from [Brand]`).
- Added `GET /health` JSON health endpoint reporting MongoDB connection status.
- Added global API response helpers (`api_ok`, `api_error`) and budget parsing helper.

### Notes
- New endpoints and helpers are environment-variable driven (`ANTHROPIC_API_KEY`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`).
- Existing app behavior remains unchanged for current UI flows.
